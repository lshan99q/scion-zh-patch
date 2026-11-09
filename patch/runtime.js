/* Scion 简体中文界面补丁 —— 运行时翻译层
 *
 * 原则：只做“整串精确匹配”，字典命中才替换；绝不猜测、不改写用户数据。
 * 覆盖：文档树 + 所有 Shadow DOM（Lit / Shoelace）的文本节点与常见 UI 属性。
 * 监听：MutationObserver，异步渲染出来的内容也会被翻译。
 *
 * 字典与模式由构建脚本注入（见 build-zh.mjs）。
 */
(function () {
  'use strict';
  if (window.__scionZhInstalled) return;
  window.__scionZhInstalled = true;

  var DICT = window.__SCION_ZH__ || {};
  var PATTERNS = window.__SCION_ZH_PATTERNS__ || [];
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'label'];
  // 数字 + 名词 的中文量词（只在前面挨着数字时使用）
  var QUANT = {
    agent: '个智能体', agents: '个智能体',
    project: '个项目', projects: '个项目',
    user: '位用户', users: '位用户',
    member: '位成员', members: '位成员',
    message: '条消息', messages: '条消息',
    file: '个文件', files: '个文件',
    binding: '条绑定', bindings: '条绑定',
    permission: '项权限', permissions: '项权限',
    resource: '项资源', resources: '项资源',
    item: '项', items: '项',
    entry: '条', entries: '条',
    event: '个事件', events: '个事件',
    token: '个令牌', tokens: '个令牌',
    secret: '个密钥', secrets: '个密钥',
    skill: '个技能', skills: '个技能',
    scope: '个作用域', scopes: '个作用域',
    session: '个会话', sessions: '个会话',
    invite: '个邀请', invites: '个邀请',
    task: '个任务', tasks: '个任务',
    version: '个版本', versions: '个版本',
    limit: '个上限', limits: '个上限',
    run: '次运行', runs: '次运行',
    use: '次使用', uses: '次使用',
    day: '天', days: '天',
    hour: '小时', hours: '小时',
    minute: '分钟', minutes: '分钟',
  };

  function prevIsNumber(node) {
    var p = node.previousSibling;
    while (p && p.nodeType === 3 && !p.nodeValue.trim()) p = p.previousSibling;
    if (!p) return false;
    var txt = p.nodeType === 3 ? p.nodeValue : p.textContent || '';
    return /^\s*\d[\d,.]*\s*$/.test(txt);
  }
  var SKIP_SELECTOR =
    'pre, code, .xterm, .cm-editor, .cm-content, [contenteditable="true"], [data-no-i18n]';
  var textState = new WeakMap();
  var attrState = new WeakMap();
  var observedRoots = new WeakSet();

  function lookup(t) {
    var hit = DICT[t];
    return hit === undefined ? null : hit;
  }

  function translateString(s, depth) {
    if (!s) return null;
    var t = s.trim().replace(/\s+/g, ' ');
    if (!t) return null;
    var hit = lookup(t);
    if (hit !== null) return hit;

    for (var i = 0; i < PATTERNS.length; i++) {
      var m = t.match(PATTERNS[i][0]);
      if (!m) continue;
      var rep = PATTERNS[i][1];
      if (typeof rep === 'function') {
        var out = rep(m, lookup);
        if (out) return out;
      } else {
        var r = rep;
        for (var j = 1; j < m.length; j++) r = r.split('$' + j).join(m[j]);
        return r;
      }
    }

    if (depth > 2) return null;

    // “A · Ctrl+N” 这类组合：翻译前面的 A，保留后缀
    var sep = t.indexOf(' · ');
    if (sep > 0) {
      var headZh = translateString(t.slice(0, sep), depth + 1);
      if (headZh !== null) return headZh + t.slice(sep);
    }

    // “(inherited from ...)” 这类纯括号说明
    var paren = t.match(/^\((.*)\)$/);
    if (paren) {
      var innerZh = translateString(paren[1], depth + 1);
      if (innerZh !== null) return '（' + innerZh + '）';
    }

    // “名称 — 12” 这类组合：翻译前半段
    var dash = t.match(/^(.*?) — (\d[\d,]*)$/);
    if (dash) {
      var dashZh = translateString(dash[1], depth + 1);
      if (dashZh !== null) return dashZh + ' — ' + dash[2];
    }

    // “名称 (inherited from ...)”：保留前缀，括号内翻译
    var suffix = t.match(/^(.*?) \((.*)\)$/);
    if (suffix) {
      var innerZ = translateString(suffix[2], depth + 1);
      if (innerZ !== null) return suffix[1] + '（' + innerZ + '）';
    }

    // “文本 (12)”：英文部分可译时，括号改成中文全角
    var num = t.match(/^(.*?) \((\d+)\)$/);
    if (num) {
      var baseZh = translateString(num[1], depth + 1);
      if (baseZh !== null) return baseZh + '（' + num[2] + '）';
    }

    // 省略号后缀：去掉后再查一次，保留原省略号
    var tail = t.match(/^(.*?)(\.\.\.|…)$/);
    if (tail) {
      var tailZh = translateString(tail[1], depth + 1);
      if (tailZh !== null) return tailZh + tail[2];
    }
    return null;
  }

  function inSkipZone(node) {
    var p = node.parentElement;
    while (p) {
      if (p.matches && p.matches(SKIP_SELECTOR)) return true;
      var root = p.getRootNode && p.getRootNode();
      p = p.parentElement || (root && root.host) || null;
    }
    return false;
  }

  function translateText(node) {
    var v = node.nodeValue;
    if (!v) return;
    if (textState.get(node) === v) return;
    textState.set(node, v);
    var t = v.trim();
    if (!t) return;
    // 英文复数后缀：前面已经译成中文时直接去掉
    if (t === 's' || t === 'es') {
      var prev = node.previousSibling;
      if (prev && prev.nodeType === 3 && /[\u4e00-\u9fff]/.test(prev.nodeValue)) {
        textState.set(node, '');
        node.nodeValue = '';
        return;
      }
    }
    if (!/[A-Za-z]/.test(t)) return;
    var zh = null;
    var q = QUANT[t.toLowerCase()];
    if (q && prevIsNumber(node)) zh = q;
    else zh = translateString(t);
    if (zh === null) return;
    // 保留首尾空白，中间被模板换行折开的内容整体替换
    var lead = v.length - v.replace(/^\s+/, '').length;
    var trail = v.length - v.replace(/\s+$/, '').length;
    var nv = v.slice(0, lead) + zh + (trail ? v.slice(v.length - trail) : '');
    textState.set(node, nv);
    node.nodeValue = nv;
  }

  function translateAttrs(el) {
    if (!el.getAttribute || !el.hasAttribute) return;
    var prev = attrState.get(el);
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      var v = el.getAttribute(a);
      if (!v) continue;
      if (prev && prev[a] === v) continue;
      var zh = translateString(v);
      if (zh === null) continue;
      if (!prev) {
        prev = Object.create(null);
        attrState.set(el, prev);
      }
      prev[a] = zh;
      el.setAttribute(a, zh);
    }
  }

  function isSkipped(node) {
    if (node.nodeType === 3) return inSkipZone(node);
    var el = node.nodeType === 1 ? node : node.parentElement;
    return !!(el && el.closest && el.closest(SKIP_SELECTOR));
  }

  function walk(root) {
    if (!root) return;
    var stack = [root];
    while (stack.length) {
      var node = stack.pop();
      if (node.nodeType === 3) {
        if (!isSkipped(node)) translateText(node);
        continue;
      }
      if (node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11) continue;
      if (node.nodeType === 1) {
        if (node.matches && node.matches(SKIP_SELECTOR)) continue;
        translateAttrs(node);
        if (node.shadowRoot) {
          observe(node.shadowRoot);
          stack.push(node.shadowRoot);
        }
      }
      var kids = node.childNodes;
      if (kids) for (var i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
    }
  }

  var pending = new Set();
  var scheduled = false;
  function schedule(root) {
    pending.add(root);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      var roots = Array.from(pending);
      pending.clear();
      for (var i = 0; i < roots.length; i++) walk(roots[i]);
    });
  }

  function observe(root) {
    if (!root || observedRoots.has(root)) return;
    observedRoots.add(root);
    var mo = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === 'characterData') schedule(r.target);
        else if (r.type === 'attributes' || r.type === 'childList') {
          for (var j = 0; j < r.addedNodes.length; j++) {
            var n = r.addedNodes[j];
            if (n.nodeType === 1 || n.nodeType === 3) {
              if (!isSkipped(n)) schedule(n);
            }
          }
          if (r.type === 'attributes' && r.target) schedule(r.target);
        }
      }
    });
    mo.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });
  }

  function translateTitle() {
    var t = document.title;
    if (!t) return;
    var parts = t.split(' — ');
    var changed = false;
    for (var i = 0; i < parts.length; i++) {
      var zh = translateString(parts[i], 1);
      if (zh !== null && zh !== parts[i]) {
        parts[i] = zh;
        changed = true;
      }
    }
    if (changed) document.title = parts.join(' — ');
  }

  // 晚挂载的自定义元素（动态 import 后再 upgrade）也要能观察到
  var origAttachShadow = Element.prototype.attachShadow;
  if (origAttachShadow) {
    Element.prototype.attachShadow = function (init) {
      var root = origAttachShadow.call(this, init);
      try {
        observe(root);
        schedule(root);
      } catch (e) {}
      return root;
    };
  }

  function boot() {
    try {
      document.documentElement.lang = 'zh-CN';
    } catch (e) {}
    walk(document);
    observe(document.documentElement);
    translateTitle();
    // 兜底：每 2 秒重扫一次，捕获异步插入/动态升级的内容
    setInterval(function () {
      schedule(document);
      translateTitle();
    }, 2000);
    var head = document.head || document.documentElement;
    new MutationObserver(function () {
      translateTitle();
    }).observe(head, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

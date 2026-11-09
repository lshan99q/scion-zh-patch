/* 动态文案模式（正则 → 中文）。构建脚本会把本文件拼进补丁。 */
window.__SCION_ZH_PATTERNS__ = (function () {
  var UNIT = {
    second: '秒',
    seconds: '秒',
    minute: '分钟',
    minutes: '分钟',
    hour: '小时',
    hours: '小时',
    day: '天',
    days: '天',
    week: '周',
    weeks: '周',
    month: '个月',
    months: '个月',
    year: '年',
    years: '年',
  };
  function unit(w) {
    return UNIT[String(w).toLowerCase()] || '';
  }
  return [
    [/^just now$/i, '刚刚'],
    [
      /^(\d+)\s*(second|minute|hour|day|week|month|year)s? ago$/i,
      function (m) {
        return m[1] + ' ' + unit(m[2]) + '前';
      },
    ],
    [
      /^an? (second|minute|hour|day|week|month|year) ago$/i,
      function (m) {
        return '1 ' + unit(m[1]) + '前';
      },
    ],
    [
      /^(\d+)(s|m|h|d|w)$/i,
      function (m) {
        var u = { s: '秒', m: '分钟', h: '小时', d: '天', w: '周' }[m[2].toLowerCase()];
        return m[1] + ' ' + u + '前';
      },
    ],
    [/^(\d+) total redemptions?$/, function (m) { return '共 ' + m[1] + ' 次兑换'; }],
    [/^(\d+) (user|users)$/, '$1 位用户'],
    [/^(\d+) (agent|agents)$/, '$1 个智能体'],
    [/^(\d+) (project|projects)$/, '$1 个项目'],
    [/^(\d+) (member|members)$/, '$1 位成员'],
    [/^(\d+) (message|messages)$/, '$1 条消息'],
    [/^(\d+) (invite|invites)$/, '$1 个邀请'],
    [/^(\d+) (session|sessions)$/, '$1 个会话'],
    [/^(\d+) (skill|skills)$/, '$1 个技能'],
    [/^(\d+) (token|tokens)$/, '$1 个令牌'],
    [/^(\d+) (secret|secrets)$/, '$1 个密钥'],
    [/^(\d+) (file|files)$/, '$1 个文件'],
    [/^(\d+) (item|items|entries)$/, '$1 项'],
    [/^(\d+) (use|uses)$/, '$1 次使用'],
    [/^(\d+) (day|days)$/, '$1 天'],
    [/^(\d+) (hour|hours)$/, '$1 小时'],
    [/^(\d+) (minute|minutes)$/, '$1 分钟'],
    [/^(\d+) (second|seconds)$/, '$1 秒'],
    [/^0 = unlimited$/i, '0 = 不限制'],
    [/^— expands to (\d+) scopes?$/, function (m) { return '— 展开为 ' + m[1] + ' 个作用域'; }],
    [/^Page (\d+) of (\d+)$/i, function (m) { return '第 ' + m[1] + ' 页，共 ' + m[2] + ' 页'; }],
    [/^(\d+) of (\d+) selected$/, function (m) { return '已选 ' + m[1] + ' / ' + m[2]; }],
    [/^Today$/, '今天'],
    [/^Yesterday$/, '昨天'],
    [/^Today at (.+)$/, '今天 $1'],
    [/^Yesterday at (.+)$/, '昨天 $1'],
    [/^\+(\d+) more$/, function (m) { return '还有 ' + m[1] + ' 个'; }],
    [/^(\d+) selected$/, function (m) { return '已选 ' + m[1] + ' 项'; }],
    [/^Ctrl\s*\+\s*(\d+)$/, function (m) { return 'Ctrl+' + m[1]; }],
    [/^Back to (.+)$/, function (m, lookup) { var t = lookup(m[1]); return t ? '返回' + t : null; }],
    [/^← Back to (.+)$/, function (m, lookup) { var t = lookup(m[1]); return t ? '← 返回' + t : null; }],
    [/^Reconnect all: reconnect (\d+) terminals? that are not connected and whose agent still exists\. Connected terminals and terminals for deleted agents are left alone\.$/, function (m) { return '全部重新连接：重新连接 ' + m[1] + ' 个未连接且智能体仍存在的终端。已连接终端和已删除智能体的终端不受影响。'; }],
    [/^Remove all inactive: remove (\d+) terminals? that are not connected, including grey rows and red rows that are not connected\. Connected and connecting terminals stay\.$/, function (m) { return '移除所有未活跃项：移除 ' + m[1] + ' 个未连接终端（含未连接的灰色行和红色行）。已连接和正在连接的终端保留。'; }],
    [/^Reconnect all \((\d+) eligible\)$/, function (m) { return '全部重新连接（' + m[1] + ' 个符合条件）'; }],
    [/^Reconnect (.+)$/, '重新连接 $1'],
    [/^Close (.+)$/, '关闭 $1'],
    [/^Drag to place (.+) in layout$/, '拖动以放置 $1 到布局'],
    [/^Place (.+) in pane$/, '将 $1 放入窗格'],
    [/^Show terminal for (.+) in (.+)\. (.+)$/, function (m, lookup) { var st = lookup(m[3]); return '显示终端：' + m[1] + '（' + m[2] + '）' + (st ? ' · ' + st : ''); }],
  ];
})();

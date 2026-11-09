# Scion Web UI — Simplified Chinese Patch

Unofficial zh-CN localization for the [Scion](https://github.com/GoogleCloudPlatform/scion) web dashboard
(Google's open-source multi-agent orchestration platform).

It does **not** modify Scion's source. A small runtime layer translates the rendered UI by exact string match,
covering Lit/Shoelace components (including Shadow DOM), lazy-loaded views, dialogs, forms,
aria-labels/titles/placeholders, and common dynamic patterns (relative times, counters, `Ctrl+K` hints, …).

- 4,821 message entries (`patch/zh-CN.json`)
- Target: Scion `nightly-20261107` / `v0.3.0-preview.6` web bundle (2026-11-07)
- Requirements: Node.js ≥ 20, gzip; the embedded-binary route also needs Go 1.26 and the Scion source tree
- License: Apache-2.0 (same as upstream Scion)

> This is a community patch, not an upstream feature. Upstream i18n is being discussed in
> [GoogleCloudPlatform/scion#4085](https://github.com/GoogleCloudPlatform/scion/issues/4085)
> with a draft implementation in [#4090](https://github.com/GoogleCloudPlatform/scion/pull/4090).

## Install

```bash
git clone https://github.com/GoogleCloudPlatform/scion.git ~/src/scion
cd ~/src/scion/web && npm install && npm run build

# Option A: quick try (server must keep the flag)
SCION_ROOT=~/src/scion ./scripts/apply-web-assets.sh

# Option B (recommended): build the assets into the binary, survives restarts
SCION_ROOT=~/src/scion ./scripts/rebuild-embedded.sh --install
```

See the Chinese section below and `README` inside the package for details.

---

# Scion 简体中文补丁（Web UI）

为 [Scion](https://github.com/GoogleCloudPlatform/scion)（Google 开源的多智能体编排平台）的 Web 控制台提供简体中文界面。

不改动 Scion 源码：在页面加载后运行一层「整串精确匹配」的翻译脚本，覆盖 Lit / Shoelace 组件（Shadow DOM）、懒加载组件、弹窗、表单、aria-label / title / placeholder，以及常见的动态文案（相对时间、`Terminals (4)`、`Dashboard · Ctrl+1` 之类）。

- 词条：4821 条（`patch/zh-CN.json`）
- 适配：Scion `nightly-20261107` / `v0.3.0-preview.6` 的前端构建（2026-11-07）
- 依赖：Node.js ≥ 20、gzip；方式 B 另需 Go 1.26 与 Scion 源码
- 许可：Apache-2.0（上游 Scion 同许可）

## 安装方式

先准备 Scion 源码并构建前端（已有 `web/dist/client` 可跳过）：

```bash
git clone https://github.com/GoogleCloudPlatform/scion.git ~/src/scion
cd ~/src/scion/web && npm install && npm run build   # 本机 NODE_ENV=production 时先 unset NODE_ENV
```

### A. 不重编译二进制（快速试用）

```bash
SCION_ROOT=~/src/scion ./scripts/apply-web-assets.sh
```

脚本会生成 `~/src/scion/zh-dist` 并用 `--web-assets-dir` 启动。**缺点**：之后任何不带该参数的 `scion server start/restart` 都会退回英文，需要重新执行本脚本。

### B. 编译进二进制（推荐，重启不丢）

```bash
SCION_ROOT=~/src/scion ./scripts/rebuild-embedded.sh            # 只构建到 /tmp/scion-zh-bin
SCION_ROOT=~/src/scion ./scripts/rebuild-embedded.sh --install  # 备份、安装到 /usr/local/bin 并重启
```

方式 B 会把中文资源写入 `web/dist/client`（Go 的 `go:embed` 目录）再编译，因此 `scion server restart`、被自动重启、甚至重新 `scion server start` 都保持中文。

> 升级 Scion 后：重新拉取源码并 `npm run build`，再执行一次方式 B 即可；词条通常可继续复用。

## 目录结构

```
scion-zh-patch/
├── build-zh.mjs              # 生成中文静态资源（zh-dist）
├── patch/
│   ├── zh-CN.json            # 词条：英文 → 中文（整串精确匹配）
│   ├── runtime.js            # 运行时翻译层（文本节点 + 属性 + MutationObserver + attachShadow）
│   └── zh-patterns.js        # 动态文案正则（相对时间、计数、Ctrl 快捷键、继承标签等）
├── scripts/
│   ├── apply-web-assets.sh   # 方式 A
│   └── rebuild-embedded.sh   # 方式 B
└── tools/
    ├── extract-ast.mjs       # 从源码模板抽取候选文案
    └── extract-words.mjs     # 从源码抽取零散短标签
```

## 自定义词条

编辑 `patch/zh-CN.json`（键为界面上的完整英文文本，值为中文），然后重跑方式 B。动态文案在 `patch/zh-patterns.js` 里按正则添加。

运行时约定：只替换**整串**命中词典的文本，不碰用户数据；`pre`、`code`、`.xterm`、`.cm-editor`、`contenteditable` 区域不翻译，避免改坏终端、代码和编辑器内容。

## 已知限制

- 只覆盖 Web 前端；CLI 输出、`scion server open` 登录页、Go 渲染的 401/服务不可用页面仍为英文。
- 日期/数字格式跟随浏览器语言（浏览器 zh-CN 时显示「2026 年 11 月 7 日」）。
- 项目名、智能体名、权限键（如 `agent:manage`）、K8s 枚举值等数据不翻译。
- 翻译层在浏览器里运行，首屏可能有极短暂英文→中文的切换。
- 词条基于 2026-11-07 的前端构建；上游大改版后可能需要补词条。

## 许可与致谢

Scion 及其界面文案版权归 Google LLC，遵循 Apache License 2.0；本补丁的译文与脚本同样以 Apache-2.0 发布，见 `LICENSE` 与 `NOTICE.md`。

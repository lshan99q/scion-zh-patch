#!/bin/bash
# 不重编译二进制的轻量方式：生成中文静态资源，用 --web-assets-dir 启动
# 注意：这种方式的服务器一旦被无参数的 start/restart 拉起，会退回英文，需要重新执行本脚本。
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SCION_ROOT="${SCION_ROOT:-$HOME/src/scion}"
DIST="${DIST_DIR:-$SCION_ROOT/zh-dist}"

SCION_ROOT="$SCION_ROOT" OUT_DIR="$DIST" node "$HERE/build-zh.mjs"

scion server stop || true
sleep 2
scion server start --enable-hub --enable-runtime-broker --enable-web --dev-auth --auto-provide \
  --web-port=8088 --web-assets-dir="$DIST"
echo "已用中文资源启动：$DIST"

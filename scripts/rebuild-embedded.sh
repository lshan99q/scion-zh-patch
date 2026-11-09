#!/bin/bash
# 把中文资源编译进 scion 二进制（推荐方式：重启后不会掉回英文）
# 用法：SCION_ROOT=~/src/scion ./rebuild-embedded.sh [--install]
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SCION_ROOT="${SCION_ROOT:-$HOME/src/scion}"
BIN_OUT="${BIN_OUT:-/tmp/scion-zh-bin}"
export PATH=/usr/local/go/bin:$PATH
export GOPROXY="${GOPROXY:-https://goproxy.cn,direct}"

[ -d "$SCION_ROOT/web/dist/client/assets" ] || {
  echo "找不到 $SCION_ROOT/web/dist/client，请先构建 Scion 前端（cd web && npm install && npm run build）" >&2
  exit 1
}

SCION_ROOT="$SCION_ROOT" node "$HERE/build-zh.mjs"

cp "$SCION_ROOT/zh-dist/assets/main.js" "$SCION_ROOT/web/dist/client/assets/main.js"
cp "$SCION_ROOT/zh-dist/assets/scion-zh.js" "$SCION_ROOT/web/dist/client/assets/scion-zh.js"
cp "$SCION_ROOT/zh-dist/assets/main.js.gz" "$SCION_ROOT/web/dist/client/assets/main.js.gz" 2>/dev/null || true
rm -f "$SCION_ROOT/web/dist/client/assets/main.js.br"

cd "$SCION_ROOT"
go build -buildvcs=false -ldflags "$(./hack/version.sh 2>/dev/null || true)" -o "$BIN_OUT" ./cmd/scion
echo "已构建：$BIN_OUT"

if [ "${1:-}" = "--install" ]; then
  TS=$(date +%Y%m%d-%H%M%S)
  sudo cp -a /usr/local/bin/scion "/usr/local/bin/scion.bak-$TS" 2>/dev/null || true
  sudo install -m 0755 "$BIN_OUT" /usr/local/bin/scion
  scion server stop || true
  sleep 2
  scion server start --enable-hub --enable-runtime-broker --enable-web --dev-auth --auto-provide --web-port=8088
  echo "已安装并重启"
fi

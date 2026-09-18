#!/bin/sh
# 用 Chrome 把 scripts/og-image.html 截成分享卡片圖 pwa/og.png（1200×630）
set -e
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=4000 \
  --screenshot="$PWD/pwa/og.png" "file://$PWD/scripts/og-image.html" 2>/dev/null
echo "pwa/og.png"

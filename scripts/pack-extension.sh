#!/bin/sh
# 打包成可上傳 Chrome 線上應用程式商店的 zip（擴充功能的側邊欄是 sidepanel.html＋app.js；網站首頁另外由 build-v2.py 產生）
set -e
cd "$(dirname "$0")/.."
mkdir -p dist
rm -f dist/threads-ruler-extension.zip
zip -r -q dist/threads-ruler-extension.zip manifest.json sidepanel.html i18n.js core.js kaomoji.js dividers.js app.js LICENSE extension _locales
echo "已產生 dist/threads-ruler-extension.zip"

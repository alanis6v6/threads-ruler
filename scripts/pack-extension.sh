#!/bin/sh
# 打包成可上傳 Chrome 線上應用程式商店的 zip（網站與擴充功能共用同一份 index.html / app.js）
set -e
cd "$(dirname "$0")/.."
mkdir -p dist
rm -f dist/threads-ruler-extension.zip
zip -r -q dist/threads-ruler-extension.zip manifest.json index.html core.js kaomoji.js dividers.js app.js LICENSE extension _locales
echo "已產生 dist/threads-ruler-extension.zip"

# 翠排版尺

Threads（翠）串文排版預覽工具：直接在預覽裡寫，照 Threads 實際量到的寬度看每一行在哪裡換行。

- 串文列表／點開貼文、電腦／手機切換
- 空白行保留（複製時塞入 U+2800 點字空白）
- 半形空白自動轉全形、選取段落置中
- 英文特殊字體、顏文字一鍵換臉換手勢

網站：https://alanis6v6.github.io/threads-ruler/

## Chrome 擴充功能（側邊欄）

跟網站是同一份程式：在 Chrome 右側開側邊欄，左邊開著翠，右邊排版，排好按複製貼上。手機版 Chrome 不支援擴充功能，手機請用網站。

### 安裝（自己用，免費）

1. 在這個 repo 頁面按綠色 **Code** → **Download ZIP**，下載後解壓縮（或用 `git clone`）。
2. Chrome 網址列輸入 `chrome://extensions` 打開擴充功能頁。
3. 右上角打開 **開發人員模式**。
4. 左上角按 **載入未封裝項目**，選剛剛解壓縮出來的資料夾（裡面有 `manifest.json` 的那一層）。
5. 按網址列右邊的拼圖圖示 🧩 → 找到 **翠排版尺** → 按圖釘釘選。
6. 之後按工具列上的翠排版尺圖示，就會打開側邊欄。

更新：抓新版覆蓋資料夾後，到 `chrome://extensions` 在翠排版尺那張卡片按 **重新載入** ↻。

### 注意

- 擴充功能的草稿和網站的草稿是分開存的。
- 側邊欄比較窄，會用手機介面；預覽放不下時會等比縮小。

### 打包上架用

```
./scripts/pack-extension.sh
```

會產生 `dist/threads-ruler-extension.zip`，可上傳到 Chrome 線上應用程式商店。

## 授權

[PolyForm Noncommercial 1.0.0](LICENSE)＋附加條款（畫面署名）：

- 可以看、學、個人修改使用，**禁止商業用途**。想商用請先聯絡作者。
- 修改版、轉載或另外架設給別人用的版本，**必須在畫面上清楚顯示「原作者：space.grapefruit_」並連結到作者的 Threads**，不得移除或隱藏。

作者：alanis6v6 ／ Threads [@space.grapefruit_](https://www.threads.com/@space.grapefruit_)

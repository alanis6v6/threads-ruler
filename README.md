# 翠排版尺

Threads（翠）串文排版預覽工具：直接在預覽裡寫，照 Threads 實際量到的寬度看每一行在哪裡換行。

- 串文列表／點開貼文、電腦／手機切換
- 空白行保留（複製時塞入 U+2800 點字空白）
- 半形空白自動轉全形、選取段落置中
- 英文特殊字體、顏文字一鍵換臉換手勢

網站：https://alanis6v6.github.io/threads-ruler/

## 手機（iPhone／Android）

- **加入主畫面**：iPhone 用 Safari 打開網站 → 分享 → 「加入主畫面」，之後從主畫面打開就是全螢幕、沒網路也能用。Android 用 Chrome 選「安裝應用程式」，在翠 App 按分享時也能直接選翠排版尺。
- **複製後打開翠**（手機預設開）：按「複製」、「複製全文」或「✨ 整理剪貼簿」後，直接跳到翠 App 的發文框，文字已經填好（500 字以內）。iPhone 用翠 App 的 `barcelona://create?text=`，Android／電腦用翠官方的 `threads.com/intent/post?text=`。設定裡可以關掉。
- **📋 貼上**：在翠 App 複製文字 → 翠排版尺按「貼上」帶進來排版 → 「複製全文」回翠貼上。
- **✨ 整理剪貼簿**：不想編輯、只想修空白——在翠 App 複製 → 按一下 → 回翠貼上，空白行和會被吃掉的半形空白都處理好。
- **iPhone 捷徑**：網址可以帶文字，`https://alanis6v6.github.io/threads-ruler/?text=（URL 編碼的文字）`。捷徑做法：「取得剪貼簿」→「URL 編碼」→「URL」（上面網址接變數）→「打開 URL」。網站「寬度怎麼量的」說明裡有完整步驟。

## Chrome 擴充功能（側邊欄）

跟網站是同一份程式：在 Chrome 右側開側邊欄，左邊開著翠，右邊排版。手機版 Chrome 不支援擴充功能，手機請用網站。

- **填入發文框**：在翠按「有什麼新鮮事？」打開發文視窗，再到側邊欄按「填入整串」（或某一則的「填入發文框」），排好的字會直接填進去，第二則起自動按「新增到串文」。不會替你發文，確認後自己按「發佈」。
- **在翠上直接排版**：翠的發文視窗旁邊會出現「📏 翠排版尺」工具卡，直接改發文框裡的字：
  - 選取文字 → 置中／靠左（可選手機或電腦、兩邊折衷／列表／點開）
  - 選取英文 → 換英文特殊字體，可以一直換
  - 游標放在顏文字上 → 換臉、換手勢；沒放在顏文字上 → 插入新的
  - ✨ 發佈前整理：空白行換成點字空白、會被吃掉的半形空白轉全形
  - ↗ 把發文框的字帶進側邊欄
  - 改完都可以用翠自己的復原（⌘Z）
- 翠改版後這兩個功能可能暫時失效，「複製」貼上永遠可以用。

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

### 單一功能頁（`fonts/`、`kaomoji/`、`dividers/`）

```
python3 scripts/build-pages.py
```

每一頁都是完整的翠排版尺，只換標題、搜尋說明和常見問題，並多一個該功能的區塊。頁面由 `index.html` 產生（顏文字、分隔線的內容來自 `kaomoji.js`、`dividers.js`），**改完這幾個檔案要重跑一次**。

### 流量統計的自訂事件（只有網站版）

`app.js` 裡的 `track(name, params)` 包著 `window.gtag`，擴充功能沒有載入 `analytics.js`，所以那邊等於不做事。

埋在**真正完成動作的函式**裡，不是每一顆按鈕上——電腦版和手機版的按鈕都 proxy 到同一個函式，掛函式可以一次涵蓋兩邊，而且只有真的成功才算一次。

| 事件 | 參數 | 什麼時候送 |
| --- | --- | --- |
| `edit_start` | — | 第一次打字（每次載入頁面只送一次） |
| `copy_all` | `posts` | 複製全文，內容不是空的 |
| `copy_post` | — | 單則複製 |
| `open_threads` | `via`、`fits` | 複製後真的跳到翠的發文框 |
| `paste_in` | — | 📋 貼上成功 |
| `tidy_clip` | — | ✨ 整理剪貼簿成功 |
| `align_lines` | `mode`、`lines` | 置中或靠左，而且真的有行被改動 |
| `font_change` | `style` | 換英文字體，而且字真的變了（選到中文不會送） |
| `mat_insert` | `mat` | 從素材面板插入（`kao`／`div`／`big`） |
| `kaomoji_add` | — | ＋顏文字 |
| `width_change` | `width` | 換裝置或換預覽寬度 |
| `view_change` | `view` | 換「看哪一種畫面」 |
| `center_target` | `target` | 換「置中依據」 |
| `tour_end` | `step`、`total` | 導覽結束，用來看走到第幾步 |

**送出的只有動作名稱、選項名稱與數字；使用者打的字一律不送。** 改這裡要同步檢查 `privacy.html`。

參數要在 GA4 **管理 → 自訂定義 → 自訂維度**註冊過，報表和 Looker Studio 才看得到分佈（事件次數本身不用註冊）。GA4 不會回填，所以註冊之前的資料看不到參數。

### 贊助與意見回饋（只有網站版）

工具頁底部有一排：**排版眉角｜意見回饋｜贊助莉亞**。

- 「排版眉角」就地展開／收起說明區（`#guideBox`）。內容留在首頁，**不搬到別的網址**——那段是首頁一半以上的可索引文字，還綁著 FAQ 的結構化資料。
- 「意見回饋」「贊助莉亞」各是一頁獨立的小頁（`feedback/`、`support/`），共用 `page.css`，兩頁都掛 `noindex, follow`。

這兩顆按鈕由 `support-config.js` 控制，**沒填網址就不會出現**，對應的頁面也只會顯示一句「還在準備中」。

```js
window.SUPPORT_CONFIG = {
  kofi: "",           // https://ko-fi.com/…
  buymeacoffee: "",   // https://www.buymeacoffee.com/…
  ecpay: "",          // 綠界／歐付寶的贊助連結
  feedbackUrl: ""     // Apps Script 部署後的網頁應用程式網址
};
```

意見回饋的後端是一支 Google Apps Script，把留言寫進作者自己的 Google 試算表。程式碼與安裝步驟在 [`scripts/feedback-apps-script.gs`](scripts/feedback-apps-script.gs)。

Chrome 擴充功能不打包 `support-config.js`、`support.js` 與那兩頁，側邊欄裡也看不到底部那一排（`.ext .web-only`）。

## 授權

[PolyForm Noncommercial 1.0.0](LICENSE)＋附加條款（畫面署名）：

- 可以看、學、個人修改使用，**禁止他人商業使用**。想商用請先聯絡作者。
- 修改版、轉載或另外架設給別人用的版本，**必須在畫面上清楚顯示「原作者：space.grapefruit_」並連結到作者的 Threads**，不得移除或隱藏。

作者：alanis6v6 ／ Threads [@space.grapefruit_](https://www.threads.com/@space.grapefruit_)

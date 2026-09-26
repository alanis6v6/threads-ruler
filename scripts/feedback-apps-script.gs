/**
 * 翠排版尺：意見回饋的後端（Google Apps Script）
 * 網站的回饋表單會把內容送到這裡，這支程式把它寫進同一份 Google 試算表。
 *
 * ── 怎麼裝（大約五分鐘，全部在瀏覽器裡） ────────────────────────
 *
 *  1. 開一份新的 Google 試算表：網址列輸入 sheets.new
 *     （建議把它命名成「翠排版尺 意見回饋」，之後好找）
 *
 *  2. 試算表上方選單：擴充功能 → Apps Script
 *
 *  3. 會開一個新分頁，裡面有預設的幾行程式碼。
 *     在程式碼區域按一下 → 全選（Cmd + A）→ 刪掉 → 貼上這整個檔案的內容
 *
 *  4. 按上方的儲存圖示（軟碟片圖案）
 *
 *  5. 右上角藍色的「部署」→ 新增部署作業
 *
 *  6. 左邊「選取類型」旁邊的齒輪圖示 → 網頁應用程式
 *
 *  7. 設定成：
 *        說明          ：隨便打，例如「回饋表單」
 *        執行身分       ：我（你的 Gmail）
 *        誰可以存取     ：所有人      ← 這個一定要選「所有人」，不然網站送不進來
 *
 *  8. 按「部署」。第一次會跳出授權：
 *        授權存取權 → 選你自己的帳號 → 畫面說「Google 尚未驗證這個應用程式」
 *        → 左下角「進階」→ 最下面「前往 未命名的專案 (不安全)」→ 允許
 *     （這是在授權「你自己寫的程式」存取「你自己的試算表」，不是第三方）
 *
 *  9. 部署完成後會出現「網頁應用程式」網址，長得像
 *        https://script.google.com/macros/s/AKfycb.../exec
 *     按旁邊的「複製」
 *
 * 10. 回到 GitHub 的 threads-ruler，打開 support-config.js，
 *     把剛剛複製的網址貼進 feedbackUrl 的引號裡，存檔。
 *
 * ── 之後改了這支程式要記得 ──────────────────────────────
 *  改完程式碼後，要再按一次「部署 → 管理部署作業 → 鉛筆圖示 →
 *  版本選『新版本』→ 部署」，網址不會變，但新的程式碼才會生效。
 */

// 想在有人留言時收到 email 通知，就把你的信箱填進引號裡，例如 "abc@gmail.com"
// 留成空的 "" 就不寄信。
var NOTIFY_EMAIL = "";

var SHEET_NAME = "意見回饋";
var HEADERS = ["時間", "類型", "內容", "聯絡方式", "頁面", "語言", "螢幕寬", "瀏覽器"];


function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var d = JSON.parse(raw);

    var body = String(d.body || "").trim();
    if (!body) return json({ ok: false, error: "empty" });
    if (body.length > 5000) body = body.slice(0, 5000);

    var sheet = getSheet();
    sheet.appendRow([
      new Date(),
      String(d.kind || "").slice(0, 40),
      body,
      String(d.contact || "").slice(0, 200),
      String(d.page || "").slice(0, 200),
      String(d.lang || "").slice(0, 10),
      Number(d.width) || "",
      String(d.ua || "").slice(0, 300)
    ]);

    if (NOTIFY_EMAIL) {
      try {
        MailApp.sendEmail(
          NOTIFY_EMAIL,
          "翠排版尺 有人留言了",
          [String(d.kind || ""), "", body, "", "聯絡方式：" + String(d.contact || "（沒留）")].join("\n")
        );
      } catch (mailErr) {
        // 寄信失敗不影響留言存檔
      }
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}


// 直接用瀏覽器打開部署網址時看到的畫面，用來確認有沒有部署成功
function doGet() {
  return json({ ok: true, hint: "翠排版尺 意見回饋後端正常運作中" });
}


function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(3, 420);
  }
  return sheet;
}


function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

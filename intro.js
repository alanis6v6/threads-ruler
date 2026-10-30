// 從舊網址（alanis6v6.github.io）跳過來的人先看到的過場：圓框裡兩行置中，上面是輪播的波浪文字，下面是百分比。
// 每頁 <head> 最前面的小腳本發現網址帶 ?from=gh 才會用同步方式載入這支，所以一般進站完全不會碰到它；
// 同步載入是為了在畫面第一次畫出來之前就蓋上去，不會閃一下原本的頁面。
// 顏色、字體沿用 space.grapefruit 總站（style.css 的 --bg／--ink 日夜兩組、Noto Serif TC）；
// 百分比的做法跟總站手機版載入動畫（loader.js）一樣：沒載完最多停 90%，load 之後才補到 100%。
(function () {
  var MIN_MS = 2500;       // 過場最少顯示多久（排版尺是靜態頁，不設保底會一閃就沒），之後要調改這裡
  var MAX_MS = 10000;      // 再怎麼慢也不要卡住人：超過就直接放行
  var WORD_MS = [600, 1000];   // 文字每隔多久換一個（隨機落在這個範圍）
  var WORDS = ["加載中", "精心打扮", "包袱款款", "喵喵喵叫", "即將抵達"];
  var WAVE_S = 1.2, WAVE_STEP = .12;   // 波浪一圈幾秒、相鄰兩字差多少秒

  var root = document.documentElement;
  if (document.getElementById("ruler-intro")) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var css =
    "#ruler-intro{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;" +
      "background:oklch(97.5% 0.014 45);color:oklch(26% 0.045 335);opacity:1;transition:opacity .5s ease}" +
    "#ruler-intro.out{opacity:0;pointer-events:none}" +
    "#ruler-intro .ri-ring{box-sizing:border-box;width:168px;height:168px;border:1.5px solid currentColor;border-radius:50%;" +
      "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;" +
      "font-family:'Noto Serif TC','Songti TC','PingFang TC',serif}" +
    "#ruler-intro .ri-word{display:flex;font-size:18px;font-weight:600;line-height:1.3;white-space:pre;letter-spacing:.04em}" +
    "#ruler-intro .ri-word span{display:inline-block;animation:ri-wave " + WAVE_S + "s ease-in-out infinite}" +
    "#ruler-intro .ri-num{font-size:14px;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:.04em}" +
    "@keyframes ri-wave{0%,100%{transform:translateY(2.5px)}50%{transform:translateY(-3.5px)}}" +
    "@media (max-width:479px){#ruler-intro .ri-ring{width:140px;height:140px}}" +
    "@media (prefers-color-scheme:dark){#ruler-intro{background:oklch(17% 0.012 15);color:oklch(94% 0.012 40)}}" +
    "@media (prefers-reduced-motion:reduce){#ruler-intro .ri-word span{animation:none}#ruler-intro{transition:none}}" +
    "html.ri-lock,html.ri-lock body{overflow:hidden}";
  var style = document.createElement("style");
  style.id = "ruler-intro-css";
  style.textContent = css;
  root.appendChild(style);

  // 宋體只跟 Google 要這五個詞和數字用到的字（跟其他頁一樣的作法），沒載到就用系統宋體
  var chars = {};
  WORDS.join("0123456789%").split("").forEach(function (c) { chars[c] = 1; });
  var font = document.createElement("link");
  font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600&display=swap&text=" +
    encodeURIComponent(Object.keys(chars).join(""));
  root.appendChild(font);

  var box = document.createElement("div");
  box.id = "ruler-intro";
  box.setAttribute("role", "status");
  box.setAttribute("aria-label", "載入中");
  box.innerHTML = '<div class="ri-ring"><div class="ri-word" aria-hidden="true"></div><div class="ri-num" aria-hidden="true">0%</div></div>';
  root.appendChild(box);
  root.classList.add("ri-lock");
  var wordEl = box.querySelector(".ri-word"), numEl = box.querySelector(".ri-num");

  // 輪播文字：隨機挑，不連續重複；波浪的相位用全域時間算，換字時波不會斷掉
  var last = -1;
  function setWord() {
    var i;
    do { i = Math.floor(Math.random() * WORDS.length); } while (i === last);
    last = i;
    var phase = (performance.now() / 1000) % WAVE_S;
    wordEl.textContent = "";
    WORDS[i].split("").forEach(function (c, k) {
      var s = document.createElement("span");
      s.textContent = c;
      if (!reduce) s.style.animationDelay = (k * WAVE_STEP - phase).toFixed(3) + "s";
      wordEl.appendChild(s);
    });
  }
  var wordTimer = 0;
  function nextWord() {
    setWord();
    wordTimer = setTimeout(nextWord, WORD_MS[0] + Math.random() * (WORD_MS[1] - WORD_MS[0]));
  }
  nextWord();

  // 百分比：時間從 0 跑到 100；沒載完最多停在 90%，load 之後才補滿。總長 = max(真實 load 完成時間, MIN_MS)
  var t0 = performance.now(), loadedAt = 0, done = false, raf = 0, shown = 0, holdFrom = 0, holdP = 0;
  function onLoad() { if (!loadedAt) loadedAt = performance.now() - t0; }
  if (document.readyState === "complete") onLoad(); else addEventListener("load", onLoad);

  function progress(t) {
    var p = Math.min(.9, t / MIN_MS);
    if (!loadedAt) return p;
    if (loadedAt <= MIN_MS) return Math.min(1, t / MIN_MS);                     // load 比保底快：照原速跑到 MIN_MS 剛好 100
    if (!holdFrom) { holdFrom = t; holdP = p; }                                 // load 比保底慢：從停住的地方 0.4 秒補滿
    return Math.min(1, holdP + (1 - holdP) * Math.min(1, (t - holdFrom) / 400));
  }
  function frame(now) {
    if (done) return;
    var t = now - t0;
    var p = t >= MAX_MS ? 1 : progress(t);
    shown = Math.max(shown, p);
    numEl.textContent = Math.round(shown * 100) + "%";
    if (shown >= 1) finish(); else raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function stripMark() {
    try {
      var q = location.search.replace(/([?&])from=gh(&|$)/, function (m, a, b) { return b ? a : ""; });   // 只拿掉記號，?text= 這類別的參數原樣留著
      history.replaceState(history.state, "", location.pathname + q + location.hash);
    } catch (e) {}
  }
  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    clearTimeout(wordTimer);
    numEl.textContent = "100%";
    stripMark();
    box.classList.add("out");
    root.classList.remove("ri-lock");
    setTimeout(function () { box.remove(); style.remove(); font.remove(); }, reduce ? 50 : 600);
  }
  addEventListener("pageshow", function (e) { if (e.persisted) finish(); });   // 從上一頁快取回來：不要卡在半路
})();

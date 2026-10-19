// 翠排版尺 v2 手機版的共用外框：設定那一句話、草稿條、提示、複製。
// 草稿跟排版尺本體存在同一個地方（localStorage "threads-ruler-v1"），在工具頁加進去的東西，回到排版就看得到。
(function(){
  var STORE = "threads-ruler-v1", LANG_KEY = "threads-ruler-lang";
  var C = window.TRCore;
  var $ = function(id){ return document.getElementById(id); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ═══ 存檔：讀整份、只改這裡管的欄位、整份寫回去，排版尺本體的其他設定原封不動 ═══
  function read(){
    var d = null;
    try{ d = JSON.parse(localStorage.getItem(STORE) || "null"); }catch(e){}
    // 還沒有存檔的新使用者：標成範例，排版尺本體才會照常放範例草稿
    d = d && typeof d === "object" ? d : { sample: true };
    if(!Array.isArray(d.posts)) d.posts = [];
    if(!d.layout) d.layout = {};
    if(!d.layout.phone) d.layout.phone = { view: "feed", device: "mobile", phoneW: "auto" };
    return d;
  }
  function write(d){ try{ localStorage.setItem(STORE, JSON.stringify(d)); return true; }catch(e){ return false; } }

  // ═══ 草稿 ═══
  // 還是範例草稿（或還沒有草稿）時，第一次加東西就開一份新的，不接在範例後面
  function addToDraft(text){
    var d = read();
    if(d.sample || !d.posts.length){ d.posts = [""]; d.sample = false; }
    var i = d.posts.length - 1, cur = d.posts[i];
    d.posts[i] = cur + (cur && !/[\s　]$/.test(cur) ? " " : "") + text;
    if(!write(d)){ toast(t("這個瀏覽器不能存草稿（可能是無痕模式），先用複製")); return false; }
    renderStrip(text);
    return true;
  }
  function addPost(text){
    var d = read();
    if(d.sample || !d.posts.length || d.posts.every(function(p){ return !String(p).trim(); })){ d.posts = [text]; d.sample = false; }
    else if(!String(d.posts[d.posts.length - 1]).trim()) d.posts[d.posts.length - 1] = text;   // 最後一則是空的就填進去，不要夾一則空白
    else d.posts.push(text);
    if(!write(d)){ toast(t("這個瀏覽器不能存草稿（可能是無痕模式），先用複製")); return false; }
    renderStrip(text.split("\n")[0]);
    return true;
  }
  function t(s, v){
    if(window.TRI18N) return window.TRI18N.t(s, v);
    return v ? s.replace(/\{(\w+)\}/g, function(m, k){ return v[k] != null ? v[k] : m; }) : s;
  }
  function renderStrip(added){
    var box = $("stripText"), n = $("stripCount");
    if(!box) return;
    var d = read(), posts = d.sample ? [] : d.posts.filter(function(p){ return p.trim(); });
    var last = posts.length ? posts[posts.length - 1].replace(/\s+/g, " ").trim() : "";
    box.textContent = "";
    if(added){ var b = document.createElement("b"); b.textContent = "＋" + added + "　"; box.appendChild(b); }
    box.appendChild(document.createTextNode(last || t("草稿是空的，點一個加進來")));
    n.textContent = posts.length > 1 ? t("草稿 {n} 則", { n: posts.length }) : t("草稿");
  }

  // ═══ 提示、複製 ═══
  var toastTimer = null;
  function toast(msg){
    var el = $("toast"); if(!el) return;
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ el.classList.remove("show"); }, 1800);
  }
  function copy(text, msg){
    var done = function(){ toast(msg || t("已複製")); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
    function fallback(){
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      ta.setSelectionRange(0, text.length);   // iOS 的 readonly 欄位只靠 select() 選不到字
      var ok = false;
      try{ ok = document.execCommand("copy"); }catch(e){}
      if(ok) done(); else toast(t("複製失敗，請長按手動複製"));
      ta.remove();
    }
  }

  // ═══ 設定：一句話，[ ] 點了換下一個 ═══
  // 每一格：怎麼讀現在的值、有哪些選項、選了怎麼寫回去
  var WIDTHS = ["auto", 360, 375, 390, 412, 430];
  var SLOTS = {
    width: {
      opts: WIDTHS.map(function(w){ return { v: w, t: w === "auto" ? "手機 本機" : "手機 " + w, k: w === "auto" ? null : "手機 {w}" }; }).concat([{ v: "desktop", t: "電腦" }]),
      get: function(d){ var p = d.layout.phone; return p.device === "desktop" ? "desktop" : p.phoneW; },
      set: function(d, v){ var p = d.layout.phone; if(v === "desktop") p.device = "desktop"; else { p.device = "mobile"; p.phoneW = v; } }
    },
    view: {
      opts: [{ v: "feed", t: "串文列表" }, { v: "detail", t: "點開貼文" }],
      get: function(d){ return d.layout.phone.view || "feed"; },
      set: function(d, v){ d.layout.phone.view = v; }
    },
    blank: {
      opts: [{ v: true, t: "保留" }, { v: false, t: "不保留" }],
      get: function(d){ return d.keepBlank !== false; },
      set: function(d, v){ d.keepBlank = v; }
    },
    spaces: {
      opts: [{ v: "smart", t: "會被吃掉的" }, { v: "all", t: "全部" }, { v: "off", t: "關" }],
      get: function(d){ return d.spaceMode || "smart"; },
      set: function(d, v){ d.spaceMode = v; }
    },
    center: {
      opts: [{ v: "both", t: "兩邊折衷" }, { v: "feed", t: "列表" }, { v: "lead", t: "點開" }],
      get: function(d){ return d.centerTarget || "both"; },
      set: function(d, v){ d.centerTarget = v; }
    },
    open: {
      // 沒設定過（null）時手機預設會打開
      opts: [{ v: true, t: "打開脆" }, { v: false, t: "不打開" }],
      get: function(d){ return d.openAfterCopy !== false; },
      set: function(d, v){ d.openAfterCopy = v; }
    },
    lang: {
      opts: [{ v: "zh", t: "繁中" }, { v: "en", t: "English" }, { v: "ja", t: "日本語" }, { v: "ko", t: "한국어" }],
      get: function(){ try{ return localStorage.getItem(LANG_KEY) || "zh"; }catch(e){ return "zh"; } },
      setLang: function(v){ try{ localStorage.setItem(LANG_KEY, v); }catch(e){} }
    }
  };
  function label(key){
    var s = SLOTS[key], d = read(), v = s.get(d), hit = s.opts.filter(function(o){ return o.v === v; })[0];
    var o = hit || s.opts[0];
    return o.k ? t(o.k, { w: o.v }) : t(o.t);
  }
  var settingsHooks = [];   // 排版頁：設定一改就重畫預覽、重算寬度
  function paintSettings(){
    document.querySelectorAll("[data-set]").forEach(function(b){ b.textContent = label(b.dataset.set); });
  }
  function cycle(key){
    var s = SLOTS[key], d = read(), v = s.get(d), i = 0;
    s.opts.forEach(function(o, n){ if(o.v === v) i = n; });
    var next = s.opts[(i + 1) % s.opts.length];
    if(s.setLang){ s.setLang(next.v); location.reload(); return; }   // 換語言：重新載入，整頁的字才會一起換
    s.set(d, next.v); write(d);
    paintSettings();
    settingsHooks.forEach(function(fn){ fn(key); });
  }
  function openSettings(open){
    var box = $("settings"), btn = $("setBtn");
    if(!box) return;
    if(open && !reduceMotion){
      // 閃一格字卡：大約 0.2 秒，像剪接時跳一格
      var f = $("flash");
      f.classList.add("on");
      setTimeout(function(){ f.classList.remove("on"); }, 200);
    }
    box.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if(open) paintSettings();
  }

  // ═══ 清空草稿：要按兩次（第一次只換字提醒） ═══
  // 第二次要隔 0.5 秒以上才算，手指連點兩下不會直接清掉
  var clearArmed = null, armedAt = 0;
  function clearDraft(b){
    if(!clearArmed || Date.now() - armedAt < 500){
      if(clearArmed) return;
      armedAt = Date.now();
      b.textContent = t("再按一次清空"); clearArmed = setTimeout(function(){ b.textContent = t("清空草稿"); clearArmed = null; }, 2500);
      return;
    }
    clearTimeout(clearArmed); clearArmed = null; b.textContent = t("清空草稿");
    var d = read(); d.posts = [""]; d.sample = false; write(d);
    renderStrip(); toast(t("草稿清空了"));
  }

  // ═══ 整理剪貼簿：跟排版尺本體同一套（空白行保留、會被吃掉的半形空白轉全形） ═══
  function tidyText(t){ return C.fillBlankLines(C.convertSpaces(String(t).replace(/\r\n?/g, "\n").replace(/\n+$/, ""), "smart")); }
  function tidyClip(){
    var denied = function(){ toast(t("瀏覽器不讓讀剪貼簿，請到排版頁貼上")); };
    var done = function(){ toast(t("剪貼簿整理好了，回脆貼上")); };
    if(!navigator.clipboard || !navigator.clipboard.readText || !C){ denied(); return; }
    var plain = function(){ navigator.clipboard.readText().then(function(t){ return navigator.clipboard.writeText(tidyText(t)); }).then(done, denied); };
    // Safari 要在點擊當下就呼叫寫入，所以把「讀 → 整理」包成 Promise 交給 ClipboardItem（跟排版尺本體同一招）
    if(window.ClipboardItem && navigator.clipboard.write){
      var blob = navigator.clipboard.readText().then(function(t){
        if(!t.trim()) throw new Error("empty");
        return new Blob([tidyText(t)], { type: "text/plain" });
      });
      navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]).then(done, plain);
    }else plain();
  }

  // ═══ 電腦：滑鼠碰到左右兩邊，在那一側彈出選單（底部分頁列收起來） ═══
  function sideMenu(){
    var bar = document.querySelector(".tabbar");
    if(!bar || !window.matchMedia("(min-width: 900px) and (pointer: fine)").matches) return;
    var menu = document.createElement("nav");
    menu.className = "side-menu"; menu.setAttribute("aria-label", t("工具（側邊選單）"));
    var title = document.createElement("i"); title.textContent = "threads ruler"; menu.appendChild(title);
    bar.querySelectorAll("a, span").forEach(function(src){
      if(src.parentNode !== bar) return;
      var a = document.createElement(src.tagName === "A" ? "a" : "span");
      if(src.href) a.href = src.getAttribute("href");
      if(src.hasAttribute("aria-current")) a.setAttribute("aria-current", "page");
      var svg = src.querySelector("svg"); if(svg) a.appendChild(svg.cloneNode(true));
      var t = document.createElement("span"); t.textContent = src.textContent.trim(); a.appendChild(t);
      menu.appendChild(a);
    });
    document.body.appendChild(menu);
    var timer = null;
    function show(side){ clearTimeout(timer); menu.classList.remove("l", "r"); menu.classList.add(side, "on"); }
    function hide(){ clearTimeout(timer); timer = setTimeout(function(){ menu.classList.remove("on"); }, 280); }
    ["l", "r"].forEach(function(side){
      var z = document.createElement("div"); z.className = "side-zone " + side; z.setAttribute("aria-hidden", "true");
      z.addEventListener("mouseenter", function(){ show(side); });
      z.addEventListener("mouseleave", hide);
      document.body.appendChild(z);
    });
    menu.addEventListener("mouseenter", function(){ clearTimeout(timer); });
    menu.addEventListener("mouseleave", hide);
    // 鍵盤：Tab 到選單裡也會出現（預設在左邊）
    menu.addEventListener("focusin", function(){ if(!menu.classList.contains("on")) show("l"); });
    menu.addEventListener("focusout", function(e){ if(!menu.contains(e.relatedTarget)) hide(); });
    menu.classList.add("l");
  }

  // ═══ 接上畫面 ═══
  function init(){
    sideMenu();
    var setBtn = $("setBtn");
    if(setBtn) setBtn.addEventListener("click", function(){ openSettings($("settings").hidden); });
    var close = $("setClose");
    if(close) close.addEventListener("click", function(){ openSettings(false); });
    document.querySelectorAll("[data-set]").forEach(function(b){ b.addEventListener("click", function(){ cycle(b.dataset.set); }); });
    var c = $("clearDraft"); if(c) c.addEventListener("click", function(){ clearDraft(c); });
    var t = $("tidyClip"); if(t) t.addEventListener("click", tidyClip);
    // 導覽在排版頁：其他頁按「導覽」就帶過去
    var tb = $("tourBtn");
    if(tb && !$("tour")) tb.addEventListener("click", function(){
      var first = document.querySelector(".tabbar a"); location.href = (first ? first.getAttribute("href") : "../") + "#tour";
    });
    // 加到主畫面：依手機系統給步驟（不需要截圖）
    var hb = $("homeBtn"), hh = $("homeHow");
    if(hb && hh) hb.addEventListener("click", function(){
      var ua = navigator.userAgent || "", ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      hh.textContent = t(ios
        ? "iPhone：用 Safari 打開這頁（在脆或 IG 裡打開的話，先按右上「⋯」→「用 Safari 開啟」）→ 按下方的「分享」（方框加箭頭）→ 往下滑點「加入主畫面」→ 右上「加入」。之後從桌面的圖示打開，就像一個 App。"
        : /Android/.test(ua)
          ? "Android：用 Chrome 打開這頁 → 右上「⋮」→「加到主畫面」（或「安裝應用程式」）→「新增」。之後從桌面的圖示打開，就像一個 App。"
          : "用手機打開這一頁：iPhone 在 Safari 按「分享」→「加入主畫面」；Android 在 Chrome 按「⋮」→「加到主畫面」。");
      hh.hidden = !hh.hidden;
      hb.setAttribute("aria-expanded", hh.hidden ? "false" : "true");
    });
    document.querySelectorAll("[data-more]").forEach(function(b){
      var p = $(b.dataset.more);
      b.addEventListener("click", function(){
        var open = p.classList.toggle("open");
        b.textContent = open ? t("收起說明") : t("看完整說明");
        b.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    // 頂列的「說明」：打開下面摺起來的說明再捲過去
    document.querySelectorAll('a[href="#guide"]').forEach(function(l){
      l.addEventListener("click", function(e){
        var g = $("guide"); if(!g) return;
        e.preventDefault(); g.open = true;
        g.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    });
    renderStrip();
    // 從排版頁改了草稿再回來（或別的分頁改了）：草稿條跟設定跟著更新
    window.addEventListener("storage", function(e){ if(e.key === STORE){ renderStrip(); paintSettings(); } });
    window.addEventListener("pageshow", function(){ renderStrip(); paintSettings(); });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  // ═══ 我的最愛：顏文字、emoji、符號共用一份，存在這台裝置的瀏覽器 ═══
  var FAV_KEY = "threads-ruler-favs";
  function favs(){ try{
      var a = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return Array.isArray(a) ? a.filter(function(x, i){ return typeof x === "string" && x && a.indexOf(x) === i; }) : [];   // 只留字串、去掉重複
    }catch(e){ return []; } }
  function toggleFav(text){
    var a = favs(), i = a.indexOf(text), on = i < 0;
    if(on) a.unshift(text); else a.splice(i, 1);
    try{ localStorage.setItem(FAV_KEY, JSON.stringify(a.slice(0, 500))); }catch(e){ toast(t("這個瀏覽器不能存收藏（可能是無痕模式）")); return !on; }
    document.dispatchEvent(new CustomEvent("v2:favs"));
    toast(on ? t("收進我的最愛") : t("從我的最愛拿掉"));
    return on;
  }
  window.addEventListener("storage", function(e){ if(e.key === FAV_KEY) document.dispatchEvent(new CustomEvent("v2:favs")); });

  window.V2 = { t: t, addPost: addPost, addToDraft: addToDraft, toast: toast, copy: copy, favs: favs, toggleFav: toggleFav, read: read, write: write, onSettings: function(fn){ settingsHooks.push(fn); } };
})();

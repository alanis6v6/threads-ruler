(function(){
  var C = window.TRCore;
  var FILLER = C.FILLER;
  var LIMIT = 500;
  var STORE = "threads-ruler-v1";
  var DESKTOP = { card: 639, pad: 24 };
  var MOBILE_PAD = 12;
  var FEED_AV = 48, REPLY_AV = 38, CJK = 15, LINE_H = 21, LINE_H_APP = 23; // 行高：網頁版 21、翠 App 23
  var DDI = C.DDI;
  var STYLES = C.STYLES, plainify = C.plainify, stylize = C.stylize;
  var FACES = C.FACES, ALL_FACES = C.ALL_FACES, BODIES = C.BODIES, parseKao = C.parseKao, kaoString = C.kaoString;
  var convertSpaces = C.convertSpaces;

  var SAMPLE = [
    "排版前先想好：這篇是會被滑過，還是會被點開看？" + DDI + "(⩌ᴗ⩌ )\n\n在串文列表裡，電腦版一行大約 36 個中文字；點開之後主貼文變寬，一行可以放到 39 個字。\n\n同一段話，換行的位置就不一樣了。",
    "選取英文就能換字體：\nThreads Layout Ruler\n\n點上面那個顏文字的臉，可以直接換成別的表情 ʕ•ᴥ•ʔ",
    "小提醒：連續打好幾個半形空白，翠只會留一個，這裡會自動幫你換成全形。\n\n選取這行試試「置中」\n\n切到手機版看看，一行只剩 24 個字左右。"
  ];


  // ═══ 狀態 ═══
  var state = {
    posts: SAMPLE.slice(), keepBlank: true, sample: true, showEditor: true, spaceMode: "smart", centerTarget: "both", openAfterCopy: null,
    // 電腦介面和手機介面各自記住自己的版型設定
    layout: {
      desktop: { view: "feed", device: "desktop", phoneW: 390 },
      phone: { view: "feed", device: "mobile", phoneW: "auto" }
    }
  };
  // 以 Chrome 擴充功能側邊欄開啟時：側邊欄寬度不是手機螢幕寬，拿掉「本機」
  var IS_EXT = location.protocol === "chrome-extension:";
  // 單一功能頁（/fonts/ 等）放在子資料夾，共用檔案要往上一層找
  var BASE = document.documentElement.getAttribute("data-base") || "";
  if(IS_EXT){
    document.documentElement.classList.add("ext");
    state.layout.phone.phoneW = 390;
  }
  var phoneQuery = window.matchMedia("(max-width: 700px)");
  function isPhone(){ return phoneQuery.matches; }
  function lay(){ return state.layout[isPhone() ? "phone" : "desktop"]; }
  function autoWidth(){ return Math.max(320, Math.round(document.documentElement.clientWidth)); }
  var history = [];
  var activeIdx = -1;
  var focusIdx = 0; // 「點開貼文」時點開的是第幾則

  var $ = function(id){ return document.getElementById(id); };
  var editList = $("editList"), card = $("card"), frame = $("frame");

  var touring = false; // 導覽中用示範內容，不存檔
  function save(){ if(touring) return; try{ localStorage.setItem(STORE, JSON.stringify(state)); }catch(e){} }
  function load(){
    try{
      var raw = localStorage.getItem(STORE);
      if(!raw) return;
      var d = JSON.parse(raw);
      if(Array.isArray(d.posts) && d.posts.length) state.posts = d.posts.map(String);
      if(typeof d.keepBlank === "boolean") state.keepBlank = d.keepBlank;
      if(typeof d.showEditor === "boolean") state.showEditor = d.showEditor;
      if(["off", "smart", "all"].indexOf(d.spaceMode) > -1) state.spaceMode = d.spaceMode;
      if(typeof d.openAfterCopy === "boolean") state.openAfterCopy = d.openAfterCopy;
      if(["both", "feed", "lead"].indexOf(d.centerTarget) > -1) state.centerTarget = d.centerTarget;
      var src = d.layout || { desktop: d };
      ["desktop", "phone"].forEach(function(k){
        var from = src[k], to = state.layout[k];
        if(!from) return;
        if(from.view === "feed" || from.view === "detail") to.view = from.view;
        if(from.device === "desktop" || from.device === "mobile") to.device = from.device;
        if([360, 390, 430, "auto"].indexOf(from.phoneW) > -1) to.phoneW = from.phoneW;
        if((k === "desktop" || IS_EXT) && to.phoneW === "auto") to.phoneW = 390;
      });
      state.sample = !!d.sample;
    }catch(e){}
  }
  function remember(){
    history.push(state.posts.slice());
    if(history.length > 60) history.shift();
    syncUndo();
  }
  function syncUndo(){ $("undo").disabled = $("undoM").disabled = !history.length; }
  function leaveSample(){ if(state.sample){ state.sample = false; $("sampleBadge").hidden = true; } }

  function geom(){
    var L = lay(), desk = L.device === "desktop";
    var cardW = desk ? DESKTOP.card : (L.phoneW === "auto" ? (isPhone() && !IS_EXT ? autoWidth() : 390) : L.phoneW);
    var pad = desk ? DESKTOP.pad : MOBILE_PAD;
    var inner = cardW - pad * 2;
    return { card: cardW, pad: pad, feed: inner - FEED_AV, lead: inner, reply: inner - REPLY_AV };
  }
  function perLine(w){ return Math.floor(w / CJK); }
  function countChars(t){ return Array.from(t).length; }

  // ═══ 文字轉換 ═══
  function toOutput(t){
    if(!state.keepBlank) return t;
    return t.split("\n").map(function(l){ return l.trim() === "" ? FILLER : l; }).join("\n");
  }
  // 關掉「保留空白行」時，翠會把空白行吃掉；map[顯示位置] = 原文位置
  function collapse(raw){
    var re = /\n[ \t]*(?:\n[ \t]*)+/g, out = "", map = [], last = 0, m, j;
    while((m = re.exec(raw))){
      for(j = last; j < m.index; j++) map.push(j);
      out += raw.slice(last, m.index);
      map.push(m.index); out += "\n";
      last = m.index + m[0].length;
    }
    for(j = last; j <= raw.length; j++) map.push(j);
    out += raw.slice(last);
    return { text: out, map: map };
  }
  function hasEatenSpaces(t){ return convertSpaces(t, "smart") !== t; }

  // ═══ contenteditable 工具 ═══
  var CE_MODE = (function(){ var d = document.createElement("div"); d.contentEditable = "plaintext-only"; return d.contentEditable === "plaintext-only" ? "plaintext-only" : "true"; })();
  function serialize(root){
    var out = "";
    (function walk(p){
      p.childNodes.forEach(function(c){
        if(c.nodeType === 3) out += c.nodeValue;
        else if(c.nodeType === 1){
          if(c.nodeName === "BR"){ if(!c.hasAttribute("data-s")) out += "\n"; }
          else{
            if(/^(DIV|P)$/.test(c.nodeName) && out !== "" && !out.endsWith("\n")) out += "\n";
            walk(c);
          }
        }
      });
    })(root);
    return out;
  }
  function selOffsets(root){
    var s = window.getSelection();
    if(!s || !s.rangeCount) return null;
    var r = s.getRangeAt(0);
    if(!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
    var pre = document.createRange();
    pre.selectNodeContents(root);
    pre.setEnd(r.startContainer, r.startOffset);
    var a = serialize(pre.cloneContents()).length;
    pre.setEnd(r.endContainer, r.endOffset);
    var b = serialize(pre.cloneContents()).length;
    return { start: a, end: b };
  }
  function nodeOffset(root, node){
    var pre = document.createRange();
    pre.selectNodeContents(root);
    pre.setEndBefore(node);
    return serialize(pre.cloneContents()).length;
  }
  function locate(root, off){
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, acc = 0, last = null;
    while((n = w.nextNode())){
      var len = n.nodeValue.length;
      if(off <= acc + len) return [n, off - acc];
      acc += len; last = n;
    }
    return last ? [last, last.nodeValue.length] : [root, 0];
  }
  function setSel(root, start, end){
    var a = locate(root, start), b = locate(root, end);
    var r = document.createRange();
    r.setStart(a[0], a[1]); r.setEnd(b[0], b[1]);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  function syncSentinel(el, raw){
    var last = el.lastChild;
    var has = last && last.nodeName === "BR" && last.hasAttribute("data-s");
    if(raw.endsWith("\n") && !has){ var br = document.createElement("br"); br.setAttribute("data-s", ""); el.append(br); }
    else if(!raw.endsWith("\n") && has) last.remove();
  }

  // ═══ 文字編輯欄 ═══
  function renderEditors(){
    editList.innerHTML = "";
    state.posts.forEach(function(text, i){
      var box = document.createElement("div");
      box.className = "post-edit";

      var head = document.createElement("div");
      head.className = "pe-head";
      var no = document.createElement("span");
      no.className = "pe-no"; no.textContent = "第 " + (i + 1) + " 則";
      var grow = document.createElement("span"); grow.className = "grow";
      var stat = document.createElement("span");
      stat.className = "pe-stat"; stat.id = "stat-" + i;
      var cp = document.createElement("button");
      cp.type = "button"; cp.className = "copy"; cp.textContent = "複製";
      cp.addEventListener("click", function(){ copyPost(i, cp); });
      head.append(no, grow, stat, cp);
      if(state.posts.length > 1){
        var del = document.createElement("button");
        del.type = "button"; del.className = "del"; del.textContent = "✕";
        del.setAttribute("aria-label", "刪除第 " + (i + 1) + " 則");
        del.addEventListener("click", function(){ deletePost(i); });
        head.append(del);
      }

      var ta = document.createElement("textarea");
      ta.id = "post-" + i; ta.dataset.idx = i;
      ta.value = text;
      ta.setAttribute("aria-label", "第 " + (i + 1) + " 則內容");
      ta.placeholder = i === 0 ? "把草稿貼進來，或直接在右邊預覽裡寫…" : "接著寫第 " + (i + 1) + " 則…";
      ta.addEventListener("input", function(e){
        state.posts[i] = ta.value; leaveSample();
        if(!e.isComposing) autoSpaces(i, ta);
        renderBody(i); updateWarn(i); updateStats(); save();
      });
      ta.addEventListener("compositionend", function(){
        autoSpaces(i, ta); updateWarn(i); save();
      });
      ta.addEventListener("focus", function(){ setActive(i); });
      ta.addEventListener("blur", function(){ setActive(-1); });
      ["select", "keyup", "mouseup", "touchend"].forEach(function(ev){ ta.addEventListener(ev, checkSelection); });

      var warn = document.createElement("div");
      warn.className = "space-warn"; warn.id = "warn-" + i; warn.hidden = true;
      var wt = document.createElement("span");
      wt.textContent = "有會被翠吃掉的半形空白（連續或行首）。";
      var wb = document.createElement("button");
      wb.type = "button"; wb.textContent = "換成全形空白";
      wb.addEventListener("click", function(){
        remember();
        state.posts[i] = convertSpaces(state.posts[i], "smart");
        syncTextarea(i); renderBody(i); updateWarn(i); updateStats(); save();
        toast("已換成全形空白");
      });
      warn.append(wt, wb);

      box.append(head, ta, warn);
      editList.append(box);
      updateWarn(i);
    });
    $("sampleBadge").hidden = !state.sample;
  }
  function updateWarn(i){ var w = $("warn-" + i); if(w) w.hidden = !hasEatenSpaces(state.posts[i]); }
  function autoSpaces(i, el){
    if(state.spaceMode === "off") return;
    var raw = state.posts[i], next = convertSpaces(raw, state.spaceMode);
    if(next === raw) return;
    if(el.tagName !== "TEXTAREA" && el.dataset.mode !== "raw") return;
    state.posts[i] = next;
    if(el.tagName === "TEXTAREA"){
      var a = el.selectionStart, b = el.selectionEnd;
      el.value = next; el.setSelectionRange(a, b);
      renderBody(i);
    }else{
      var o = selOffsets(el);
      fillBody(el, i);
      if(o) setSel(el, o.start, o.end);
      syncTextarea(i);
    }
  }
  function syncTextarea(i){ var ta = $("post-" + i); if(ta && ta.value !== state.posts[i]) ta.value = state.posts[i]; }

  function setActive(i){
    activeIdx = i;
    Array.prototype.forEach.call(editList.children, function(el, k){ el.classList.toggle("active", k === i); });
    card.querySelectorAll(".t-post").forEach(function(p){ p.classList.toggle("active", +p.dataset.idx === i); });
  }

  // ═══ 預覽 ═══
  var ICONS = [
    '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    '<path d="M20 12a8 8 0 1 1-3.3-6.5L20 4l-.8 4A8 8 0 0 1 20 12z"/>',
    '<path d="M4 9h13l-3-3M20 15H7l3 3"/>',
    '<path d="M21 4 10 13M21 4l-6.5 16-3.5-7-7-3.5z"/>'
  ];
  function actions(){
    var d = document.createElement("div");
    d.className = "t-actions"; d.setAttribute("aria-hidden", "true");
    d.innerHTML = ICONS.map(function(p){ return '<svg viewBox="0 0 24 24">' + p + "</svg>"; }).join("");
    return d;
  }
  function head(){
    var h = document.createElement("div");
    h.className = "t-head";
    var b = document.createElement("b"); b.textContent = "你的帳號";
    var s = document.createElement("span"); s.textContent = "2 分鐘";
    h.append(b, s);
    return h;
  }
  function makeBody(i){
    var el = document.createElement("div");
    el.className = "t-body"; el.id = "body-" + i; el.dataset.idx = i;
    el.contentEditable = CE_MODE;
    el.spellcheck = false;
    el.setAttribute("role", "textbox");
    el.setAttribute("aria-multiline", "true");
    el.setAttribute("aria-label", "第 " + (i + 1) + " 則內容");
    el.dataset.ph = "（第 " + (i + 1) + " 則還沒寫，點這裡開始打字）";
    fillBody(el, i);
    return el;
  }
  function fillBody(el, i){
    var raw = state.posts[i];
    var editing = document.activeElement === el;
    var text = (state.keepBlank || editing) ? raw : collapse(raw).text;
    el.dataset.mode = text === raw ? "raw" : "collapsed";
    el.textContent = "";
    var list = parseKao(text), pos = 0;
    list.forEach(function(m, k){
      if(m.start > pos) el.append(document.createTextNode(text.slice(pos, m.start)));
      var sp = document.createElement("span");
      sp.className = "kao"; sp.dataset.k = k;
      sp.textContent = text.slice(m.start, m.end);
      if(kpop.i === i && kpop.k === k && !$("kpop").hidden) sp.classList.add("on");
      el.append(sp);
      pos = m.end;
    });
    if(pos < text.length) el.append(document.createTextNode(text.slice(pos)));
    syncSentinel(el, text);
  }
  function renderBody(i, opt){
    var el = $("body-" + i);
    if(!el) return;
    opt = opt || {};
    if(opt.focus && document.activeElement !== el) el.focus({ preventScroll: true });
    fillBody(el, i);
    if(opt.sel && document.activeElement === el) setSel(el, opt.sel[0], opt.sel[1]);
  }
  function tools(i){
    var t = document.createElement("div");
    t.className = "p-tools";
    var st = document.createElement("span");
    st.className = "pe-stat"; st.id = "pstat-" + i;
    t.append(st);
    function btn(label, cls, fn){
      var b = document.createElement("button");
      b.type = "button"; b.textContent = label; if(cls) b.className = cls;
      b.addEventListener("mousedown", function(e){ e.preventDefault(); });
      b.addEventListener("click", function(e){ e.stopPropagation(); fn(b); });
      t.append(b);
    }
    btn("＋顏文字", "", function(){ insertKao(i); });
    if(state.posts.length > 1) btn("刪除", "del-p", function(){ deletePost(i); });
    if(IS_EXT) btn("填入發文框", "fill-p", function(){ fillThreads("one", [state.posts[i]]); });
    btn("複製", "copy-p", function(b){ copyPost(i, b); });
    return t;
  }

  function renderPreview(){
    var g = geom();
    frame.style.setProperty("--card-w", g.card + "px");
    card.style.setProperty("--pad", g.pad + "px");
    frame.classList.toggle("mobile", lay().device === "mobile");

    var detail = lay().view === "detail";
    var rw = detail ? g.lead : g.feed;
    frame.style.setProperty("--ruler-x", (g.pad + (detail ? 0 : FEED_AV)) + "px");
    frame.style.setProperty("--ruler-w", rw + "px");
    $("rulerLabel").textContent = rw + "px · 約 " + perLine(rw) + " 字/行";

    card.innerHTML = "";
    focusIdx = Math.min(focusIdx, state.posts.length - 1);

    state.posts.forEach(function(t, i){
      var p = document.createElement("article");
      p.dataset.idx = i;
      if(i === activeIdx) p.classList.add("active");
      if(!detail || i !== focusIdx){
        p.classList.add("openable");
        p.title = "點頭像或名字，點開這一則";
      }
      if(detail && i === focusIdx){
        p.className += " t-post lead";
        var hr = document.createElement("div"); hr.className = "t-lead-head";
        var av = document.createElement("div"); av.className = "t-av";
        hr.append(av, head());
        p.append(hr, makeBody(i), actions(), tools(i));
        card.append(p);
        if(i < state.posts.length - 1){ var dv = document.createElement("div"); dv.className = "t-divider"; card.append(dv); }
        return;
      }
      // 翠 App：點開的那則上面的串文維持列表樣式，下面的才是回覆樣式
      p.className += " t-post " + (detail && i > focusIdx ? "reply" : "feed");
      var col = document.createElement("div"); col.className = "t-av-col";
      var a = document.createElement("div"); a.className = "t-av";
      var c = document.createElement("div"); c.className = "t-conn";
      col.append(a, c);
      var m = document.createElement("div"); m.className = "t-main";
      m.append(head(), makeBody(i), actions(), tools(i));
      p.append(col, m);
      card.append(p);
    });

    var top = $("stageTop"); top.innerHTML = "";
    if(detail){
      var back = document.createElement("button");
      back.type = "button"; back.className = "back"; back.textContent = "← 回到串文列表";
      back.addEventListener("click", function(){ setView("feed"); });
      top.append(back);
    }

    $("autoW").textContent = autoWidth();
    renderReadout(g);
    fitFrame();
    requestAnimationFrame(updateStats);
    if(!$("kpop").hidden) placeKpop();
  }

  function renderReadout(g){
    var detail = lay().view === "detail";
    var rows = [["串文列表", g.feed, !detail], ["點開的那則", g.lead, detail], ["點開・下面的串文", g.reply, detail, "網頁版實測"]];
    var ro = $("readout"); ro.innerHTML = "";
    rows.forEach(function(r){
      var d = document.createElement("div");
      if(r[2]) d.className = "current";
      var dt = document.createElement("dt"); dt.textContent = r[0];
      var dd = document.createElement("dd");
      dd.innerHTML = "<b>" + r[1] + "</b>px · " + perLine(r[1]) + " 字/行" + (r[3] ? ' <span class="tag">（' + r[3] + "）</span>" : "");
      d.append(dt, dd); ro.append(d);
    });
  }

  function updateStats(){
    state.posts.forEach(function(t, i){
      var n = countChars(t);
      var b = $("body-" + i);
      var lines = (b && t.trim() !== "") ? Math.round(b.offsetHeight / (lay().device === "mobile" ? LINE_H_APP : LINE_H)) : 0;
      var txt = n + "/" + LIMIT + " · " + lines + " 行";
      [$("stat-" + i), $("pstat-" + i)].forEach(function(st){
        if(!st) return;
        st.textContent = txt;
        st.classList.toggle("over", n > LIMIT);
      });
    });
  }

  // ═══ 預覽區直接編輯 ═══
  card.addEventListener("input", function(e){
    var el = e.target.closest && e.target.closest(".t-body");
    if(!el) return;
    var i = +el.dataset.idx;
    var raw = serialize(el);
    if(raw === "" && el.childNodes.length) el.textContent = "";
    syncSentinel(el, raw);
    state.posts[i] = raw; leaveSample();
    if(!e.isComposing) autoSpaces(i, el);
    syncTextarea(i); updateWarn(i); updateStats(); save();
  });
  card.addEventListener("compositionend", function(e){
    var el = e.target.closest && e.target.closest(".t-body");
    if(!el) return;
    var i = +el.dataset.idx;
    autoSpaces(i, el); updateWarn(i); save();
  });
  card.addEventListener("paste", function(e){
    var el = e.target.closest && e.target.closest(".t-body");
    if(!el || !e.clipboardData) return;
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  });
  card.addEventListener("focusin", function(e){
    var el = e.target.closest && e.target.closest(".t-body");
    if(!el) return;
    var i = +el.dataset.idx;
    setActive(i);
    setTimeout(function(){
      // 顯示的是吃掉空白行後的版本 → 換回原文再編輯，游標對回原位
      if(el.dataset.mode !== "collapsed" || document.activeElement !== el) return;
      var c = collapse(state.posts[i]);
      var o = selOffsets(el);
      var s = o ? c.map[o.start] : state.posts[i].length, en = o ? c.map[o.end] : s;
      fillBody(el, i); setSel(el, s, en);
    }, 0);
  });
  card.addEventListener("focusout", function(e){
    var el = e.target.closest && e.target.closest(".t-body");
    if(!el) return;
    var i = +el.dataset.idx;
    setTimeout(function(){
      if(document.activeElement === el) return;
      if(!(document.activeElement && document.activeElement.closest && document.activeElement.closest(".t-post"))) setActive(-1);
      if($("body-" + i) === el) fillBody(el, i);
      if(!$("kpop").hidden) placeKpop();
      updateStats();
    }, 0);
  });
  card.addEventListener("click", function(e){
    var sp = e.target.closest(".kao");
    if(sp && !sp.isConnected){
      // 點下去時預覽剛好換回原文重畫，改用座標找回同一個顏文字
      var at = document.elementFromPoint(e.clientX, e.clientY);
      sp = at && at.closest(".kao");
      if(!sp) return;
    }
    if(sp){ openKpop(sp); return; }
    if(e.target.closest(".t-body,.p-tools")) return;
    var art = e.target.closest(".t-post");
    if(!art) return;
    var i = +art.dataset.idx;
    if(lay().view === "feed" || i !== focusIdx){ focusIdx = i; setView("detail"); }
  });

  // ═══ 英文字體浮動列 ═══
  var fsel = null, hideTimer = null, barPressed = false;
  function currentSelection(){
    var ae = document.activeElement;
    if(ae && ae.classList && ae.classList.contains("t-body")){
      var o = selOffsets(ae);
      if(o && o.end > o.start){
        var i = +ae.dataset.idx;
        var raw = state.posts[i];
        if(ae.dataset.mode === "collapsed"){ var c = collapse(raw); o = { start: c.map[o.start], end: c.map[o.end] }; }
        return { src: "body", i: i, start: o.start, end: o.end };
      }
    }else if(ae && ae.tagName === "TEXTAREA" && ae.dataset.idx != null && ae.selectionEnd > ae.selectionStart){
      return { src: "ta", i: +ae.dataset.idx, start: ae.selectionStart, end: ae.selectionEnd };
    }
    return null;
  }
  function checkSelection(){
    var s = currentSelection();
    if(s){
      clearTimeout(hideTimer);
      fsel = s; showFontbar();
      return;
    }
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function(){ if(!barPressed) $("fontbar").hidden = true; }, 250);
  }
  document.addEventListener("selectionchange", checkSelection);

  function showFontbar(){
    var bar = $("fontbar"), chips = $("fbChips");
    var seg = state.posts[fsel.i].slice(fsel.start, fsel.end);
    var sample = Array.from(plainify(seg)).slice(0, 14).join("").replace(/\n/g, " ");
    var hasLatin = /[A-Za-z0-9]/.test(plainify(seg));
    $("fbFontSec").hidden = !hasLatin;
    bar.classList.toggle("no-font", !hasLatin);
    $("fbWidth").textContent = "置中依 " + centerName();
    chips.innerHTML = "";
    STYLES.forEach(function(s){
      var b = document.createElement("button");
      b.type = "button"; b.className = "fb-chip" + (s.id === "plain" ? " plain" : "");
      var sv = document.createElement("span"); sv.className = "s"; sv.textContent = stylize(sample, s.id);
      var nv = document.createElement("span"); nv.className = "n"; nv.textContent = s.name;
      b.append(sv, nv);
      b.addEventListener("click", function(){ applyStyle(s.id); });
      chips.append(b);
    });
    bar.hidden = false;
    placeFontbar();
  }
  function placeFontbar(){
    var bar = $("fontbar");
    if(bar.hidden || !fsel) return;
    var narrow = window.innerWidth < 640;
    var rect = null;
    if(fsel.src === "body" && !narrow){
      var s = window.getSelection();
      if(s && s.rangeCount){ var r = s.getRangeAt(0).getBoundingClientRect(); if(r.width || r.height) rect = r; }
    }
    if(!rect){ bar.classList.add("dock"); return; }
    bar.classList.remove("dock");
    var bw = bar.offsetWidth, bh = bar.offsetHeight;
    var top = rect.bottom + 10;
    if(top + bh > window.innerHeight - 8) top = Math.max(8, rect.top - bh - 10);
    var left = Math.min(Math.max(8, rect.left + rect.width / 2 - bw / 2), window.innerWidth - bw - 8);
    bar.style.top = top + "px"; bar.style.left = left + "px";
  }
  $("fontbar").addEventListener("mousedown", function(e){ e.preventDefault(); });
  $("fontbar").addEventListener("pointerdown", function(){ barPressed = true; clearTimeout(hideTimer); });
  document.addEventListener("pointerup", function(){ setTimeout(function(){ barPressed = false; }, 400); });

  function applyStyle(id){
    if(!fsel) return;
    var i = fsel.i, raw = state.posts[i];
    var seg = raw.slice(fsel.start, fsel.end);
    var out = stylize(seg, id);
    if(out !== seg){
      remember();
      state.posts[i] = raw.slice(0, fsel.start) + out + raw.slice(fsel.end);
      leaveSample();
    }
    fsel.end = fsel.start + out.length;
    commitSelectionEdit(i);
  }

  // ═══ 段落置中 ═══
  var meas = document.createElement("span");
  meas.setAttribute("aria-hidden", "true");
  meas.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;font-size:15px;font-family:var(--f-threads);";
  document.body.append(meas);
  function textWidth(t){ meas.textContent = t; return meas.getBoundingClientRect().width; }
  function widthFor(i){
    var g = geom();
    if(lay().view === "feed" || i < focusIdx) return g.feed;
    return i === focusIdx ? g.lead : g.reply;
  }
  function viewName(i){
    var dev = lay().device === "desktop" ? "電腦" : "手機 " + geom().card;
    var v = lay().view === "feed" ? "串文列表" : (i < focusIdx ? "點開・上面的串文" : i === focusIdx ? "點開的那則" : "點開・下面的串文");
    return dev + "・" + v + " " + widthFor(i) + "px";
  }
  // 翠的串文列表和點開後寬度差 48，行首空白沒辦法兩邊都剛好置中：
  // 預設取兩者中間，兩種版型各偏不到一個字
  function centerWidth(){
    var g = geom(), t = state.centerTarget;
    return t === "feed" ? g.feed : t === "lead" ? g.lead : Math.round((g.feed + g.lead) / 2);
  }
  function centerName(){
    var dev = lay().device === "desktop" ? "電腦" : "手機 " + geom().card;
    var t = { both: "列表與點開折衷", feed: "串文列表", lead: "點開" }[state.centerTarget];
    return dev + "・" + t + " " + centerWidth() + "px";
  }
  function alignLines(mode){
    if(!fsel) return;
    var i = fsel.i, raw = state.posts[i];
    var res = C.alignBlock(raw, fsel.start, fsel.end, mode, centerWidth(), textWidth);
    var ls = res.start, le = res.end, out = res.text, done = res.done, tooLong = res.tooLong;
    if(!res.changed){
      toast(tooLong ? "選到的行太長，會自動換行，沒辦法置中" : "已經是這個對齊了");
      return;
    }
    remember();
    state.posts[i] = raw.slice(0, ls) + out + raw.slice(le);
    leaveSample();
    fsel.start = ls; fsel.end = ls + out.length;
    commitSelectionEdit(i);
    if(mode === "left") toast("已靠左");
    else toast("已依 " + centerName() + " 置中 " + done + " 行" + (tooLong ? "，" + tooLong + " 行太長沒動" : ""));
  }
  function commitSelectionEdit(i){
    if(fsel.src === "ta"){
      var ta = $("post-" + i);
      syncTextarea(i); renderBody(i);
      ta.focus(); ta.setSelectionRange(fsel.start, fsel.end);
    }else{
      syncTextarea(i);
      renderBody(i, { focus: true, sel: [fsel.start, fsel.end] });
    }
    updateWarn(i); updateStats(); save();
    showFontbar();
  }
  $("fbCenter").addEventListener("click", function(){ alignLines("center"); });
  $("fbLeft").addEventListener("click", function(){ alignLines("left"); });
  document.querySelectorAll('input[name="ctarget"]').forEach(function(r){
    r.addEventListener("change", function(){
      state.centerTarget = r.value; save();
      $("fbWidth").textContent = "置中依 " + centerName();
      toast("之後按「置中」會依" + { both: "兩邊折衷", feed: "串文列表", lead: "點開" }[r.value] + "；已經置中的行，選取後再按一次就會重算");
    });
  });

  // ═══ 顏文字面板 ═══
  var kpop = { i: -1, k: -1 };
  function openKpop(sp){
    var el = sp.closest(".t-body"), i = +el.dataset.idx;
    var raw = state.posts[i];
    var text = el.dataset.mode === "collapsed" ? collapse(raw).text : raw;
    var off = nodeOffset(el, sp);
    var list = parseKao(text), k = -1;
    list.forEach(function(m, n){ if(k < 0 && m.start <= off && off < m.end) k = n; });
    if(k < 0) return;
    kpop = { i: i, k: k };
    $("kpop").hidden = false;
    renderKpop();
  }
  function closeKpop(){
    $("kpop").hidden = true;
    card.querySelectorAll(".kao.on").forEach(function(s){ s.classList.remove("on"); });
    kpop = { i: -1, k: -1 };
  }
  function currentKao(){
    var t = state.posts[kpop.i];
    if(t == null) return null;
    return parseKao(t)[kpop.k] || null;
  }
  function renderKpop(){
    var m = currentKao();
    if(!m){ closeKpop(); return; }
    $("kpNow").textContent = kaoString(m);
    var body = $("kpBody"); body.innerHTML = "";
    var tab = $("kp-body").checked ? "body" : "face";
    function chip(label, on, fn){
      var b = document.createElement("button");
      b.type = "button"; b.className = "kp-chip" + (on ? " on" : "");
      b.textContent = label; b.title = label;
      b.addEventListener("click", fn);
      return b;
    }
    if(tab === "face"){
      FACES.forEach(function(g){
        var h = document.createElement("div"); h.className = "kp-group"; h.textContent = g[0];
        var grid = document.createElement("div"); grid.className = "kp-grid";
        g[1].forEach(function(f){
          var preview = kaoString({ l: m.l, o: m.o, inner: f, c: m.c, r: m.r });
          grid.append(chip(preview, m.inner.trim() === f, function(){ swapKao({ inner: f }); }));
        });
        body.append(h, grid);
      });
    }else{
      var grid = document.createElement("div"); grid.className = "kp-grid";
      BODIES.forEach(function(b){
        var preview = kaoString({ l: b.l, o: b.o, inner: m.inner, c: b.c, r: b.r });
        var on = b.l === m.l && b.r === m.r && b.o === m.o;
        grid.append(chip(preview, on, function(){ swapKao({ l: b.l, o: b.o, c: b.c, r: b.r }); }));
      });
      var h = document.createElement("div"); h.className = "kp-group"; h.textContent = "手勢（臉不變）";
      body.append(h, grid);
    }
    card.querySelectorAll(".kao.on").forEach(function(s){ s.classList.remove("on"); });
    var sp = card.querySelector("#body-" + kpop.i + ' .kao[data-k="' + kpop.k + '"]');
    if(sp) sp.classList.add("on");
    placeKpop();
  }
  function placeKpop(){
    var pop = $("kpop");
    if(pop.hidden) return;
    var sp = card.querySelector("#body-" + kpop.i + ' .kao[data-k="' + kpop.k + '"]');
    if(window.innerWidth < 640 || !sp){ pop.classList.add("sheet"); return; }
    pop.classList.remove("sheet");
    var r = sp.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var top = r.bottom + 8;
    if(top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 8);
    var left = Math.min(Math.max(8, r.left), window.innerWidth - pw - 8);
    pop.style.top = top + "px"; pop.style.left = left + "px";
  }
  function swapKao(change){
    var m = currentKao();
    if(!m) return;
    var next = { l: m.l, o: m.o, inner: m.inner, c: m.c, r: m.r };
    Object.keys(change).forEach(function(key){ next[key] = change[key]; });
    var str = kaoString(next);
    if(str === kaoString(m)) return;
    remember();
    var raw = state.posts[kpop.i];
    state.posts[kpop.i] = raw.slice(0, m.start) + str + raw.slice(m.end);
    leaveSample();
    var el = $("body-" + kpop.i);
    var editing = el && document.activeElement === el;
    renderBody(kpop.i, editing ? { sel: [m.start + str.length, m.start + str.length] } : null);
    syncTextarea(kpop.i); updateWarn(kpop.i); updateStats(); save();
    renderKpop();
  }
  function insertKao(i){
    var el = $("body-" + i), raw = state.posts[i], at = raw.length;
    if(el && document.activeElement === el){
      var o = selOffsets(el);
      if(o){ at = el.dataset.mode === "collapsed" ? collapse(raw).map[o.end] : o.end; }
    }
    var face = ALL_FACES[Math.floor(Math.random() * ALL_FACES.length)];
    var str = DDI + "(" + face + ")";
    remember();
    state.posts[i] = raw.slice(0, at) + str + raw.slice(at);
    leaveSample();
    renderBody(i, { focus: true, sel: [at + str.length, at + str.length] });
    syncTextarea(i); updateWarn(i); updateStats(); save();
    var k = -1;
    parseKao(state.posts[i]).forEach(function(m, n){ if(m.start === at) k = n; });
    if(k > -1){ kpop = { i: i, k: k }; $("kpop").hidden = false; renderKpop(); }
  }
  $("kpop").addEventListener("mousedown", function(e){ if(!e.target.closest("input,label")) e.preventDefault(); });
  $("kpClose").addEventListener("click", closeKpop);
  $("kpRandom").addEventListener("click", function(){
    var m = currentKao(); if(!m) return;
    if($("kp-body").checked){
      var pool = BODIES.filter(function(b){ return !(b.l === m.l && b.r === m.r && b.o === m.o); });
      var b = pool[Math.floor(Math.random() * pool.length)];
      swapKao({ l: b.l, o: b.o, c: b.c, r: b.r });
    }else{
      var faces = ALL_FACES.filter(function(f){ return f !== m.inner.trim(); });
      swapKao({ inner: faces[Math.floor(Math.random() * faces.length)] });
    }
  });
  document.querySelectorAll('input[name="kptab"]').forEach(function(r){ r.addEventListener("change", renderKpop); });
  document.addEventListener("pointerdown", function(e){
    if($("kpop").hidden || touring) return;
    if(e.target.closest("#kpop,.kao,.p-tools")) return;
    closeKpop();
  });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !$("kpop").hidden) closeKpop(); });
  window.addEventListener("scroll", function(){ placeKpop(); placeFontbar(); }, { passive: true, capture: true });
  window.addEventListener("resize", function(){ placeKpop(); placeFontbar(); requestAnimationFrame(updateStats); });

  // ═══ 串文操作 ═══
  function setView(v){ lay().view = v; syncControls(); renderPreview(); save(); }
  function syncControls(){
    var L = lay();
    $("view-" + L.view).checked = true;
    $("dev-" + L.device).checked = true;
    $("ph-" + L.phoneW).checked = true;
    $("phoneCtrl").hidden = L.device !== "mobile";
    $("keepBlank").checked = state.keepBlank;
    $("sp-" + state.spaceMode).checked = true;
    $("openAfterCopy").checked = openAfterCopyOn();
    $("ct-" + state.centerTarget).checked = true;
    $("showEditor").checked = state.showEditor;
    // 手機介面直接在預覽裡編輯，不開文字編輯欄
    var showEd = state.showEditor && !isPhone();
    $("editorPanel").hidden = !showEd;
    $("workspace").classList.toggle("solo", !showEd);
  }
  // 預覽放不下就等比縮小，不出現左右捲動
  function fitFrame(){
    var fit = $("fit"), stage = fit.parentElement, cs = getComputedStyle(stage);
    var avail = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var cw = geom().card;
    var sc = avail >= cw - 1 ? 1 : avail / cw;
    frame.style.transform = sc < 1 ? "scale(" + sc + ")" : "";
    fit.style.width = cw * sc + "px";
    fit.style.height = frame.offsetHeight * sc + "px";
    frame.classList.toggle("edge", isPhone() && sc === 1 && cw >= avail - 1);
    var note = $("scaleNote");
    note.hidden = sc === 1;
    note.textContent = "放不下，縮小成 " + Math.round(sc * 100) + "% 顯示（換行位置不變）";
  }
  function applyUI(){
    document.body.classList.toggle("phone-ui", isPhone());
    closeKpop(); $("fontbar").hidden = true;
    syncControls(); renderPreview();
  }
  function structural(){
    renderEditors(); renderPreview(); save();
    if(!$("kpop").hidden && !currentKao()) closeKpop();
  }
  function deletePost(i){
    if(state.posts.length <= 1) return;
    remember();
    state.posts.splice(i, 1);
    closeKpop(); activeIdx = -1;
    structural(); toast("已刪除第 " + (i + 1) + " 則，按「復原」可以救回來");
  }
  function addPost(){
    state.posts.push(""); structural();
    var b = $("body-" + (state.posts.length - 1));
    if(b){ b.focus(); b.scrollIntoView({ block: "nearest" }); }
  }
  function copyPost(i, btn){
    var text = toOutput(state.posts[i]);
    copyText(text, "第 " + (i + 1) + " 則已複製，切到翠貼上", btn);
    if(text.trim()) openThreads(text);
  }

  // ═══ 複製後打開翠的發文框，文字直接填好 ═══
  // iPhone：翠 App 的網址 barcelona://create?text=…（barcelona 是翠的開發代號）
  // Android／電腦：翠官方的 threads.com/intent/post?text=…（手機會直接跳進 App）
  var UA = navigator.userAgent || "";
  var IS_IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  var IS_ANDROID = /Android/.test(UA);
  var IS_MOBILE = IS_IOS || IS_ANDROID;
  function openAfterCopyOn(){ return !IS_EXT && (state.openAfterCopy === null ? IS_MOBILE : state.openAfterCopy); }
  function openThreads(text){
    if(!openAfterCopyOn()) return;
    var fits = text && Array.from(text).length <= LIMIT;
    var q = fits ? "?text=" + encodeURIComponent(text) : "";
    // 等剪貼簿寫完、提示跳出來再切走
    setTimeout(function(){
      if(IS_IOS) location.href = "barcelona://create" + q;
      else if(IS_ANDROID) location.href = "https://www.threads.com/intent/post" + q;
      else window.open("https://www.threads.com/intent/post" + q, "_blank", "noopener");
    }, IS_MOBILE ? 350 : 0);
    if(!fits && text) toast("超過 500 字，已打開翠的發文框，請自己貼上");
  }

  function copyText(text, msg, btn){
    if(text.trim() === ""){ toast("這則還沒有內容"); return; }
    function done(){
      toast(msg);
      if(btn){
        var old = btn.textContent;
        btn.textContent = "已複製"; btn.classList.add("done");
        setTimeout(function(){ btn.textContent = old; btn.classList.remove("done"); }, 1800);
      }
    }
    function fallback(){
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.append(ta); ta.select();
      var ok = false; try{ ok = document.execCommand("copy"); }catch(e){}
      ta.remove();
      ok ? done() : toast("瀏覽器擋住了複製，請手動全選後複製");
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done, fallback);
    }else fallback();
  }

  var toastTimer;
  function toast(msg){
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.classList.remove("show"); }, 2200);
  }

  // ═══ 控制列事件 ═══
  document.querySelectorAll('input[name="view"]').forEach(function(r){ r.addEventListener("change", function(){ setView(r.value); }); });
  document.querySelectorAll('input[name="device"]').forEach(function(r){ r.addEventListener("change", function(){ lay().device = r.value; syncControls(); renderPreview(); save(); }); });
  document.querySelectorAll('input[name="phone"]').forEach(function(r){ r.addEventListener("change", function(){ lay().phoneW = r.value === "auto" ? "auto" : +r.value; renderPreview(); save(); }); });
  if(window.ResizeObserver) new ResizeObserver(function(){ fitFrame(); }).observe(frame);
  if(phoneQuery.addEventListener) phoneQuery.addEventListener("change", applyUI);
  else phoneQuery.addListener(applyUI);
  // 只有寬度真的變了（例如手機轉向）才重畫；手機鍵盤彈出只改高度，不能重畫，不然會打斷打字
  var lastVW = document.documentElement.clientWidth;
  window.addEventListener("resize", function(){
    var w = document.documentElement.clientWidth;
    if(w === lastVW) return;
    lastVW = w;
    var L = lay();
    if(isPhone() && L.device === "mobile" && L.phoneW === "auto") renderPreview();
    else fitFrame();
  });
  $("moreBtn").addEventListener("click", function(){
    var open = $("settings").classList.toggle("open");
    this.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $("helpBtn").addEventListener("click", function(){
    var panel = $("helpPanel");
    panel.hidden = !panel.hidden;
    this.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
  });
  function flash(btn){
    btn.classList.add("flash");
    clearTimeout(btn._flash);
    btn._flash = setTimeout(function(){ btn.classList.remove("flash"); }, 1000);
  }
  function doUndo(){
    if(!history.length) return;
    state.posts = history.pop();
    syncUndo();
    closeKpop(); $("fontbar").hidden = true;
    structural(); toast("已復原上一步");
  }
  function doCopyAll(){
    var parts = state.posts.filter(function(t){ return t.trim() !== ""; }).map(toOutput);
    var all = parts.join("\n" + FILLER + "\n");
    copyText(all, "全文已複製", null);
    if(all.trim()) openThreads(all);
  }
  // ═══ 擴充功能：填進翠的發文框 ═══
  function fillThreads(mode, posts){
    posts = posts.filter(function(t){ return t.trim() !== ""; }).map(toOutput);
    if(!posts.length){ toast("還沒有內容可以填"); return; }
    var NO_TAB = "先切到翠的分頁，按「有什麼新鮮事？」打開發文視窗；分頁是在安裝前打開的話，重新整理一次";
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs){
      var tab = tabs && tabs[0];
      if(!tab){ toast(NO_TAB); return; }
      chrome.tabs.sendMessage(tab.id, { type: "threads-ruler-fill", mode: mode, posts: posts }, function(res){
        if(chrome.runtime.lastError || !res){ toast(NO_TAB); return; }
        if(!res.ok){
          toast(res.reason === "no-composer" ? "先在翠按「有什麼新鮮事？」打開發文視窗" : "填入失敗，請改用「複製」貼上");
          return;
        }
        var msg = "已填入 " + res.filled + " 則，確認後在翠按「發佈」";
        if(res.reason) msg = "只填入前 " + res.filled + " 則，後面的請用「複製」貼上";
        else if(res.extra) msg += "（發文視窗多的 " + res.extra + " 則沒動）";
        toast(msg);
      });
    });
  }
  if(IS_EXT){
    ["fillAll", "fillAllM"].forEach(function(id){ $(id).addEventListener("click", function(){ flash(this); fillThreads("all", state.posts); }); });
    // 翠網頁上按「用翠排版尺排版」：把發文框的字帶進來（點字空白換回空白行）
    var consumeImport = function(data){
      if(!data || !data.posts || !data.posts.length || Date.now() - data.at > 60000) return;
      chrome.storage.session.remove("threadsRulerImport");
      var posts = data.posts.map(function(t){
        return t.split("\n").map(function(l){ return l.replace(/[\u2800\s]/g, "") === "" ? "" : l; }).join("\n");
      });
      remember();
      if(state.sample || state.posts.every(function(t){ return t.trim() === ""; })) state.posts = posts;
      else state.posts = state.posts.concat(posts);
      state.sample = false; focusIdx = 0;
      structural();
      toast("已從發文框帶入 " + posts.length + " 則");
    };
    chrome.storage.session.get("threadsRulerImport", function(r){ consumeImport(r && r.threadsRulerImport); });
    chrome.storage.onChanged.addListener(function(changes, area){
      if(area === "session" && changes.threadsRulerImport) consumeImport(changes.threadsRulerImport.newValue);
    });
  }

  // ═══ 剪貼簿（手機從翠 App 帶字進來、一鍵整理） ═══
  // 翠上的點字空白行換回空白行，放進排版尺
  function importText(text, msg){
    var t = String(text).replace(/\r\n?/g, "\n").split("\n")
      .map(function(l){ return l.replace(/[\u2800\s]/g, "") === "" ? "" : l; }).join("\n")
      .replace(/\n+$/, "");
    if(!t.trim()){ toast("剪貼簿裡沒有文字"); return; }
    t = convertSpaces(t, state.spaceMode);
    remember();
    if(state.sample || state.posts.every(function(p){ return p.trim() === ""; })) state.posts = [t];
    else state.posts.push(t);
    state.sample = false; focusIdx = 0;
    structural();
    toast(msg || "已貼上成新的一則");
  }
  function tidyText(t){
    return C.fillBlankLines(C.convertSpaces(String(t).replace(/\r\n?/g, "\n").replace(/\n+$/, ""), "smart"));
  }
  var CLIP_DENIED = "瀏覽器不讓讀剪貼簿，請在文字框長按貼上";
  ["pasteClip", "pasteClipM"].forEach(function(id){
    $(id).addEventListener("click", function(){
      if(!navigator.clipboard || !navigator.clipboard.readText){ toast(CLIP_DENIED); return; }
      navigator.clipboard.readText().then(function(t){ importText(t); }, function(){ toast(CLIP_DENIED); });
    });
  });
  $("tidyClip").addEventListener("click", function(){
    var btn = this;
    if(!navigator.clipboard || !navigator.clipboard.readText){ toast(CLIP_DENIED); return; }
    var tidied = "";
    var done = function(){ flash(btn); toast("剪貼簿整理好了，回翠貼上"); if(tidied) openThreads(tidied); };
    // Safari 要在點擊當下就呼叫寫入，所以把「讀 → 整理」包成 Promise 交給 ClipboardItem
    if(window.ClipboardItem && navigator.clipboard.write){
      var blob = navigator.clipboard.readText().then(function(t){
        if(!t.trim()) throw new Error("empty");
        tidied = tidyText(t);
        return new Blob([tidied], { type: "text/plain" });
      });
      navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]).then(done, function(){
        navigator.clipboard.readText().then(function(t){ tidied = tidyText(t); return navigator.clipboard.writeText(tidied); }).then(done, function(){ toast(CLIP_DENIED); });
      });
    }else{
      navigator.clipboard.readText().then(function(t){ tidied = tidyText(t); return navigator.clipboard.writeText(tidied); }).then(done, function(){ toast(CLIP_DENIED); });
    }
  });

  ["undo", "undoM"].forEach(function(id){ $(id).addEventListener("click", function(){ if(history.length) flash(this); doUndo(); }); });
  ["copyAll", "copyAllM"].forEach(function(id){ $(id).addEventListener("click", function(){ flash(this); doCopyAll(); }); });

  document.querySelectorAll('input[name="spaces"]').forEach(function(r){
    r.addEventListener("change", function(){
      state.spaceMode = r.value; save();
      toast(r.value === "off" ? "半形空白不會自動轉換" : r.value === "smart" ? "打字時，連續和行首的半形空白會自動變全形" : "打字時，整則的半形空白都會變全形（英文字間距也會變寬）");
    });
  });
  $("openAfterCopy").addEventListener("change", function(){
    state.openAfterCopy = this.checked; save();
    toast(this.checked ? "之後按複製會直接打開翠的發文框" : "之後按複製只會複製，不會跳到翠");
  });
  $("keepBlank").addEventListener("change", function(){ state.keepBlank = this.checked; renderPreview(); save(); });
  $("showEditor").addEventListener("change", function(){ state.showEditor = this.checked; syncControls(); save(); requestAnimationFrame(updateStats); });
  $("addPost").addEventListener("click", addPost);
  $("stageAdd").addEventListener("click", addPost);
  // 清空：先問一次，6 秒沒回應就收回
  var clearTimer;
  function closeClearConfirm(){
    clearTimeout(clearTimer);
    $("clearConfirm").hidden = true;
    $("clearAll").hidden = false;
  }
  $("clearAll").addEventListener("click", function(){
    this.hidden = true;
    $("clearConfirm").hidden = false;
    $("clearNo").focus();
    clearTimer = setTimeout(closeClearConfirm, 6000);
  });
  $("clearNo").addEventListener("click", function(){ closeClearConfirm(); $("clearAll").focus(); });
  $("clearYes").addEventListener("click", function(){
    closeClearConfirm();
    remember();
    state.posts = [""]; state.sample = false; focusIdx = 0; closeKpop();
    structural(); toast("已清空，按「復原」可以救回來");
  });

  // ═══ 首次使用導覽 ═══
  var TOUR_KEY = "threads-ruler-tour-done";
  var TOUR_VERSION = "2"; // 2：加了「複製後打開翠」「加到主畫面」
  var TOUR_DEMO = "選取英文就能換字型：\nTHREADS Layout Ruler\n\n點顏文字換臉、換手勢 " + DDI + "(\u2A4C\u1D17\u2A4C )";
  var TOUR_STEPS = [
    { en: "EDITOR", title: "左邊打草稿\n右邊看翠上的樣子", target: "#editorPanel", desk: true,
      body: "每一則串文一個框，字數、行數即時算好。也可以直接在右邊預覽裡打字，兩邊會同步。" },
    { en: "VIEW", title: "滑過去，\n還是點開看？", target: "#view-feed", group: true,
      body: "串文列表和點開貼文的文字寬度不同，換行位置也不同。點預覽裡的頭像或名字，也會點開那一則。" },
    { en: "DEVICE", title: "電腦和手機\n一行放的字差很多", target: "#dev-desktop", group: true,
      body: "電腦版一行大約 36 個中文字，手機大約 21 個。先切到讀者最常用的裝置再排。" },
    { en: "WIDTH", title: "選一支手機的寬度", target: "#phoneCtrl", device: "mobile",
      body: "360、390、430 是常見的手機寬度；在手機上打開時，還會多一個「本機」，直接用你螢幕的寬度。" },
    { en: "BLANK LINES", title: "段落間距\n不會被吃掉", target: "#keepBlank", group: true, settings: true,
      body: "翠會刪掉空白行。打開後按複製，會在空白行塞入看不見的點字空白，貼上去間距就留住了。" },
    { en: "SPACES", title: "連打的空白\n自動變全形", target: "#sp-smart", group: true, settings: true,
      body: "翠會吃掉連續和行首的半形空白。「會被吃掉的」只轉這兩種，英文單字之間的空白不動。" },
    { en: "CENTER", title: "置中要顧\n哪一種版型", target: "#ct-both", group: true, settings: true,
      body: "列表和點開的寬度差 48，同一串空白沒辦法兩邊都剛好置中。預設「兩邊折衷」，兩邊都接近置中。" },
    { en: "OPEN THREADS", isNew: true, web: true, title: "複製完，\n直接跳進翠的發文框", target: "#openAfterCopy", group: true, settings: true,
      body: function(){
        return IS_MOBILE
          ? "按「複製」、「複製全文」或「✨ 整理剪貼簿」後，會直接打開翠 App 的發文框，文字已經填好（500 字以內），連貼上都不用。不想跳過去，可以在這裡關掉。"
          : "打開這個開關，按「複製」後會在新分頁打開翠的發文視窗並填好文字。電腦預設關，手機預設開：在手機上按複製，會直接跳進翠 App 的發文框。";
      } },
    { en: "PANEL", title: "只想看預覽，\n就把編輯欄收起來", target: "#showEditor", group: true, desk: true,
      body: "關掉文字編輯欄，預覽會變寬，直接在預覽裡編輯就好。" },
    { en: "FONTS", title: "選一段英文，\n點一下就換字型", target: "#card", demo: "fonts",
      body: "看示範：分別選取「Layout」和「Ruler」，換成粗體和草寫。可以一直換，按「一般」就變回來。" },
    { en: "KAOMOJI", title: "點一下顏文字，\n換臉、換手勢", target: "#card", demo: "kaomoji",
      body: "有粉紅虛線的顏文字點一下，就能挑表情和手勢；懶得挑就按骰子隨機。" },
    { en: "HOME SCREEN", isNew: true, web: true, home: true, title: "加到主畫面，\n當 App 用", target: "#tourHomeDemo", demo: "home",
      body: function(){
        if(IS_ANDROID) return "看示範：Chrome 右上角 ⋮ → 「安裝應用程式」→ 安裝。之後從主畫面打開就是全螢幕，在翠 App 按分享也能直接選翠排版尺。";
        return "看示範：用 Safari 打開這個網站 → 下方的分享按鈕 → 「加入主畫面」→ 加入。之後從主畫面打開就是全螢幕，沒網路也能用。";
      } }
  ];
  function isStandalone(){
    try{ return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }catch(e){ return false; }
  }
  var tour = null;

  // opts：auto 自動播（已從主畫面打開就跳過主畫面那步）、onlyNew 只播新功能、only 只播指定步驟
  function tourSteps(opts){
    opts = opts || (tour && tour.opts) || {};
    return TOUR_STEPS.filter(function(s){
      if(s.web && IS_EXT) return false;
      if(opts.only) return opts.only.indexOf(s.en) > -1;
      if(s.desk && isPhone()) return false;
      if(s.home && opts.auto && isStandalone()) return false;
      return !opts.onlyNew || s.isNew;
    });
  }
  function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  // onlyNew：看過舊版導覽的人，只看新加的步驟
  function startTour(opts){
    if(tour) return;
    if(!opts || opts.type) opts = {}; // 從按鈕點進來會收到事件物件
    if(!tourSteps(opts).length){ try{ localStorage.setItem(TOUR_KEY, TOUR_VERSION); }catch(e){} return; }
    touring = true;
    document.body.classList.add("touring");
    tour = {
      i: 0, run: 0, opts: opts,
      snap: {
        posts: state.posts.slice(), sample: state.sample, showEditor: state.showEditor,
        layout: JSON.parse(JSON.stringify(state.layout)), history: history.length, focus: focusIdx
      }
    };
    closeKpop(); $("fontbar").hidden = true; $("helpPanel").hidden = true;
    state.posts = [TOUR_DEMO]; state.showEditor = true; focusIdx = 0;
    lay().view = "feed";
    syncControls(); renderEditors(); renderPreview();

    var block = document.createElement("div"); block.className = "tour-block"; block.id = "tourBlock";
    var hole = document.createElement("div"); hole.className = "tour-hole"; hole.id = "tourHole";
    var coach = document.createElement("div");
    coach.className = "tour-coach"; coach.id = "tourCoach";
    coach.setAttribute("role", "dialog"); coach.setAttribute("aria-live", "polite");
    coach.innerHTML =
      '<div class="tc-top"><span class="tc-en" id="tcEn"></span><button class="tc-skip" id="tcSkip" type="button">略過導覽</button></div>' +
      '<div class="tc-title" id="tcTitle"></div><div class="tc-body" id="tcBody"></div>' +
      '<div class="tc-actions"><button class="tc-next" id="tcNext" type="button"></button>' +
      '<button class="tc-back" id="tcBack" type="button">上一步</button>' +
      '<button class="tc-replay" id="tcReplay" type="button" hidden>↻ 再看一次</button></div>' +
      '<div class="tc-dots" id="tcDots"></div>';
    document.body.append(block, hole, coach);
    $("tcSkip").addEventListener("click", endTour);
    $("tcNext").addEventListener("click", function(){ if(tour.i >= tourSteps().length - 1) endTour(); else tourGo(tour.i + 1); });
    $("tcBack").addEventListener("click", function(){ if(tour.i > 0) tourGo(tour.i - 1); });
    $("tcReplay").addEventListener("click", function(){ tourGo(tour.i); });
    tourGo(0);
    $("tcNext").focus();
  }

  function tourCleanupStep(){
    tour.run++;
    var hd = $("tourHomeDemo"); if(hd) hd.remove();
    closeKpop();
    $("fontbar").hidden = true;
    var ae = document.activeElement;
    if(ae && ae.classList && ae.classList.contains("t-body")) ae.blur();
  }

  function tourGo(n){
    tourCleanupStep();
    var steps = tourSteps(), step = steps[n];
    tour.i = n;
    var L = lay();
    var wantDevice = step.device || tour.snap.layout[isPhone() ? "phone" : "desktop"].device;
    if(L.device !== wantDevice){ L.device = wantDevice; syncControls(); renderPreview(); }
    if(step.demo){
      // 每次重播都從乾淨的示範內容開始
      state.posts = [TOUR_DEMO];
      if(L.view !== "feed"){ L.view = "feed"; syncControls(); }
      renderEditors(); renderPreview();
    }
    if(isPhone()){
      $("settings").classList.toggle("open", !!step.settings);
      $("moreBtn").setAttribute("aria-expanded", step.settings ? "true" : "false");
    }

    $("tcEn").textContent = (tour.opts.only ? "" : tour.opts.onlyNew ? "NEW · " : "STEP " + String(n + 1).padStart(2, "0") + " · ") + step.en;
    $("tcTitle").textContent = step.title;
    $("tcBody").textContent = typeof step.body === "function" ? step.body() : step.body;
    $("tcNext").textContent = n >= steps.length - 1 ? "開始使用" : "下一步";
    $("tcBack").hidden = n === 0;
    $("tcReplay").hidden = !step.demo;
    $("tcDots").innerHTML = steps.map(function(s, k){ return '<span class="' + (k < n ? "done" : k === n ? "on" : "") + '"></span>'; }).join("");
    var coach = $("tourCoach");
    coach.style.animation = "none"; void coach.offsetWidth; coach.style.animation = "";

    if(step.demo === "home") buildHomeDemo();
    var el = tourTarget(step);
    if(el && step.demo !== "home") el.scrollIntoView({ block: step.target === "#editorPanel" ? "start" : "center" });
    requestAnimationFrame(placeTour);
    if(step.demo === "fonts") demoFonts(tour.run);
    if(step.demo === "kaomoji") demoKaomoji(tour.run);
    if(step.demo === "home") demoHome(tour.run);
  }

  function tourTarget(step){
    if(!step.target) return null;
    var el = document.querySelector(step.target);
    if(el && step.group) el = el.closest(".group") || el;
    return el;
  }

  function placeTour(){
    if(!tour) return;
    var step = tourSteps()[tour.i], el = tourTarget(step);
    var hole = $("tourHole"), coach = $("tourCoach");
    if(!el){
      // 沒有要框的欄位：整片變暗，說明卡放中間
      hole.style.top = "50%"; hole.style.left = "50%"; hole.style.width = "0px"; hole.style.height = "0px";
      coach.style.top = Math.max(12, (window.innerHeight - coach.offsetHeight) / 2) + "px";
      coach.style.left = Math.max(12, (window.innerWidth - coach.offsetWidth) / 2) + "px";
      return;
    }
    var r = el.getBoundingClientRect(), pad = 8;
    var top = Math.max(4, r.top - pad), left = Math.max(4, r.left - pad);
    var bottom = Math.min(window.innerHeight - 4, r.bottom + pad), right = Math.min(window.innerWidth - 4, r.right + pad);
    hole.style.top = top + "px"; hole.style.left = left + "px";
    hole.style.width = Math.max(0, right - left) + "px"; hole.style.height = Math.max(0, bottom - top) + "px";

    var cw = coach.offsetWidth, ch = coach.offsetHeight, gap = 14, vw = window.innerWidth, vh = window.innerHeight;
    var ct, cl;
    if(right + gap + cw <= vw - 12){ cl = right + gap; ct = Math.min(Math.max(12, top), vh - ch - 12); }
    else if(left - gap - cw >= 12){ cl = left - gap - cw; ct = Math.min(Math.max(12, top), vh - ch - 12); }
    else if(bottom + gap + ch <= vh - 12){ ct = bottom + gap; cl = Math.min(Math.max(12, left), vw - cw - 12); }
    else if(top - gap - ch >= 12){ ct = top - gap - ch; cl = Math.min(Math.max(12, left), vw - cw - 12); }
    else { ct = 12; cl = Math.max(12, (vw - cw) / 2); }
    // 示範步驟底部會跳出浮動列／顏文字面板，說明卡往上放
    if(step.demo && step.demo !== "home" && (isPhone() || vw < 640)) ct = 12;
    // 主畫面示範：手機縮在上方，說明卡固定放在它下面
    if(step.demo === "home" && $("tourHomeDemo") && $("tourHomeDemo").classList.contains("narrow")){
      ct = Math.min(bottom + gap, vh - ch - 8); cl = Math.max(12, (vw - cw) / 2);
    }
    coach.style.top = ct + "px"; coach.style.left = cl + "px";
  }

  function pressChip(sel){
    var c = document.querySelector(sel);
    if(c){ c.classList.add("tour-press"); c.scrollIntoView({ block: "nearest", inline: "center" }); }
  }

  async function demoFonts(run){
    var alive = function(){ return tour && tour.run === run; };
    await wait(700); if(!alive()) return;
    var picks = [["Layout", ["script", "double", "bold"]], ["Ruler", ["fraktur", "mono", "scriptlight"]]];
    for(var p = 0; p < picks.length; p++){
      var word = picks[p][0], el = $("body-0");
      if(!el) return;
      var at = state.posts[0].indexOf(word);
      el.focus({ preventScroll: true });
      setSel(el, at, at + word.length);
      checkSelection();
      await wait(900); if(!alive()) return;
      for(var k = 0; k < picks[p][1].length; k++){
        var id = picks[p][1][k], idx = STYLES.findIndex(function(s){ return s.id === id; });
        pressChip("#fbChips .fb-chip:nth-child(" + (idx + 1) + ")");
        await wait(520); if(!alive()) return;
        applyStyle(id);
        placeTour();
        await wait(650); if(!alive()) return;
      }
      await wait(500); if(!alive()) return;
    }
    $("fontbar").hidden = true;
    el.blur();
  }

  async function demoKaomoji(run){
    var alive = function(){ return tour && tour.run === run; };
    await wait(700); if(!alive()) return;
    var sp = card.querySelector("#body-0 .kao");
    if(!sp) return;
    openKpop(sp);
    placeTour();
    $("kp-face").checked = true; renderKpop();
    var faces = ["\u25D4\u032F\u25D4", "≧▽≦", "˘ω˘", "ಠ_ಠ", "•ᴗ•"];
    for(var f = 0; f < faces.length; f++){
      await wait(800); if(!alive()) return;
      swapKao({ inner: faces[f] });
    }
    await wait(900); if(!alive()) return;
    $("kp-body").checked = true; renderKpop();
    var bodies = [2, 3, 6, 17];
    for(var b = 0; b < bodies.length; b++){
      await wait(850); if(!alive()) return;
      var B = BODIES[bodies[b]];
      swapKao({ l: B.l, o: B.o, c: B.c, r: B.r });
    }
  }

  function endTour(){
    if(!tour) return;
    tourCleanupStep();
    var snap = tour.snap;
    tour = null;
    ["tourBlock", "tourHole", "tourCoach"].forEach(function(id){ var n = $(id); if(n) n.remove(); });
    document.body.classList.remove("touring");
    state.posts = snap.posts; state.sample = snap.sample; state.showEditor = snap.showEditor;
    state.layout = snap.layout; focusIdx = snap.focus;
    history.length = snap.history; syncUndo();
    $("settings").classList.remove("open"); $("moreBtn").setAttribute("aria-expanded", "false");
    touring = false;
    syncControls(); renderEditors(); renderPreview(); save();
    try{ localStorage.setItem(TOUR_KEY, TOUR_VERSION); }catch(e){}
    $("tourBtn").focus();
  }

  // ═══ 加入主畫面示範：用畫的手機演一次，不需要真的截圖 ═══
  function buildHomeDemo(){
    var old = $("tourHomeDemo"); if(old) old.remove();
    var android = IS_ANDROID;
    var icon = "pwa/apple-touch-icon.png";
    var hd = document.createElement("div");
    hd.className = "hd"; hd.id = "tourHomeDemo";
    hd.setAttribute("aria-hidden", "true");
    hd.dataset.os = android ? "android" : "ios";
    hd.dataset.phase = "page";
    var list = android
      ? ["新分頁", "書籤", "下載", "安裝應用程式"]
      : ["拷貝", "加入閱讀列表", "加入書籤", "加入主畫面"];
    var marks = android ? ["", "", "", "⤓"] : ["⧉", "∞", "☆", "⊞"];
    hd.innerHTML =
      '<div class="hd-phone"><div class="hd-screen"><div class="hd-island"></div>' +
        '<div class="hd-page"><h5>翠排版尺<i>｜</i></h5><p>照翠實際的寬度排版，直接在預覽裡寫。</p>' +
          '<div class="hd-sk" style="width:60%"></div><div class="hd-sk" style="width:80%"></div>' +
          '<div class="hd-card"><div class="hd-sk" style="width:90%"></div><div class="hd-sk" style="width:70%"></div><div class="hd-sk" style="width:84%"></div></div></div>' +
        '<div class="hd-bar"><div class="hd-url">alanis6v6.github.io</div><div class="hd-dots">⋮</div>' +
          '<div class="hd-tools"><span>‹</span><span>›</span><span class="hd-share"></span><span>▢</span><span>⧉</span></div></div>' +
        '<div class="hd-sheet"><div class="hd-sheet-head"><img src="' + icon + '" alt=""><div><b>翠排版尺</b><span>alanis6v6.github.io</span></div></div>' +
          '<div class="hd-apps"><i></i><i></i><i></i><i></i><i></i></div>' +
          '<div class="hd-list">' + list.map(function(t, k){ return '<div class="hd-item' + (k === 3 ? " hd-add" : "") + '">' + t + '<em>' + marks[k] + '</em></div>'; }).join("") + '</div></div>' +
        '<div class="hd-dialog">' + (android
          ? '<div class="hd-dtop"><b>要安裝應用程式嗎？</b><span style="color:#9c97a3">翠排版尺</span><span class="hd-ok" style="align-self:flex-end">安裝</span></div>'
          : '<div class="hd-dtop"><span>取消</span><b>加入主畫面</b><span class="hd-ok">加入</span></div>' +
            '<div class="hd-dbody"><img src="' + icon + '" alt=""><div>翠排版尺<small>alanis6v6.github.io</small></div></div>') + '</div>' +
        '<div class="hd-home">' + new Array(11).join("<i></i>") + '<div class="hd-app"><img src="' + icon + '" alt=""><span>翠排版尺</span></div></div>' +
        '<div class="hd-finger"></div>' +
      '</div></div>';
    document.body.append(hd);
    // 窄螢幕：手機縮小放上方，說明卡放下方
    var narrow = isPhone() || window.innerWidth < 760;
    hd.classList.toggle("narrow", narrow);
    if(narrow){
      var room = Math.max(200, window.innerHeight * 0.46);
      hd.style.setProperty("--hd-scale", Math.min(1, room / 454).toFixed(3));
    }
    return hd;
  }
  async function demoHome(run){
    var alive = function(){ return tour && tour.run === run && $("tourHomeDemo"); };
    var hd = $("tourHomeDemo"); if(!hd) return;
    var android = hd.dataset.os === "android";
    var finger = hd.querySelector(".hd-finger");
    function point(sel){
      var screen = hd.querySelector(".hd-screen").getBoundingClientRect();
      var r = hd.querySelector(sel).getBoundingClientRect();
      // 位置換回縮放前的座標
      var k = screen.width / 206;
      finger.style.setProperty("--fx", ((r.left + r.width / 2 - screen.left) / k) + "px");
      finger.style.setProperty("--fy", ((r.top + r.height / 2 - screen.top) / k) + "px");
    }
    async function tap(sel){
      point(sel); finger.classList.add("on");
      await wait(650); if(!alive()) return false;
      finger.classList.remove("tap"); void finger.offsetWidth; finger.classList.add("tap");
      await wait(450);
      return !!alive();
    }
    while(alive()){
      hd.dataset.phase = "page";
      finger.classList.remove("on");
      await wait(900); if(!alive()) return;
      if(!await tap(android ? ".hd-dots" : ".hd-share")) return;
      hd.dataset.phase = "sheet";
      if(android) hd.querySelector(".hd-sheet").style.transform = "scale(1)";
      await wait(900); if(!alive()) return;
      if(!await tap(".hd-add")) return;
      hd.querySelector(".hd-add").classList.add("hit");
      await wait(300); if(!alive()) return;
      hd.dataset.phase = "dialog";
      if(android){ hd.querySelector(".hd-sheet").style.transform = ""; hd.querySelector(".hd-dialog").style.transform = "scale(1)"; }
      await wait(900); if(!alive()) return;
      if(!await tap(".hd-ok")) return;
      hd.querySelector(".hd-ok").classList.add("hit");
      await wait(300); if(!alive()) return;
      finger.classList.remove("on");
      hd.dataset.phase = "home";
      if(android) hd.querySelector(".hd-dialog").style.transform = "";
      await wait(2600); if(!alive()) return;
      hd.querySelector(".hd-add").classList.remove("hit");
      hd.querySelector(".hd-ok").classList.remove("hit");
    }
  }

  $("tourBtn").addEventListener("click", startTour);
  $("homeDemoBtn").addEventListener("click", function(){ $("helpPanel").hidden = true; $("helpBtn").setAttribute("aria-expanded", "false"); startTour({ only: ["HOME SCREEN"] }); });
  document.addEventListener("keydown", function(e){ if(tour && e.key === "Escape") endTour(); });
  window.addEventListener("resize", function(){ if(tour) requestAnimationFrame(placeTour); });
  window.addEventListener("scroll", function(){ if(tour) placeTour(); }, { passive: true, capture: true });

  if(document.fonts && document.fonts.ready) document.fonts.ready.then(updateStats);

  load();
  document.body.classList.toggle("phone-ui", isPhone());
  syncControls();
  renderEditors();
  renderPreview();
  // 第一次打開自動播導覽
  var seenTour = null;
  try{ seenTour = localStorage.getItem(TOUR_KEY); }catch(e){ seenTour = TOUR_VERSION; }
  // ═══ 英文特殊字體轉換（/fonts/ 頁才有） ═══
  if($("fontGen")){
    var genInput = $("fontGenInput"), genList = $("fontGenList");
    STYLES.forEach(function(st){
      if(st.id === "plain") return;
      var li = document.createElement("li"); li.className = "gen-row";
      var name = document.createElement("span"); name.className = "gen-name"; name.textContent = st.name;
      var out = document.createElement("span"); out.className = "gen-out"; out.dataset.style = st.id;
      var btn = document.createElement("button"); btn.className = "gen-copy"; btn.type = "button"; btn.textContent = "複製";
      btn.addEventListener("click", function(){ copyText(out.textContent, st.name + "已複製，切到翠貼上", btn); });
      li.append(name, out, btn); genList.append(li);
    });
    var renderGen = function(){
      var t = genInput.value.trim() ? genInput.value : genInput.placeholder;
      genList.querySelectorAll(".gen-out").forEach(function(o){ o.textContent = stylize(t, o.dataset.style); });
    };
    genInput.addEventListener("input", renderGen);
    renderGen();
  }

  // 網址帶文字進來（iPhone 捷徑、Android 分享）：?text=…
  var incoming = null;
  try{
    var q = new URLSearchParams(location.search);
    incoming = [q.get("title"), q.get("text"), q.get("url")].filter(function(v){ return v && v.trim(); }).join("\n") || null;
  }catch(e){}
  if(incoming){
    importText(incoming, "已帶入文字，排好按「複製全文」回翠貼上");
    // 清掉網址裡的文字，重新整理才不會再帶入一次（注意：這個檔案裡的 history 是復原紀錄，要用 window.history）
    try{ window.history.replaceState(null, "", location.pathname); }catch(e){}
  }
  // 單一功能頁是從搜尋進來找特定功能的，不自動播導覽（右上「導覽」還是可以看）
  if(!incoming && !document.documentElement.dataset.page){
    if(!seenTour) setTimeout(function(){ startTour({ auto: true }); }, 500);
    else if(seenTour !== TOUR_VERSION) setTimeout(function(){ startTour({ auto: true, onlyNew: true }); }, 500); // 看過舊版：只播新功能
  }
  // 網站：流量統計（擴充功能不載入）
  if(!IS_EXT && location.protocol === "https:"){
    var ga = document.createElement("script");
    ga.src = BASE + "analytics.js";
    document.head.appendChild(ga);
  }
  // 網頁 App：離線快取（擴充功能不需要）
  if(!IS_EXT && "serviceWorker" in navigator && location.protocol === "https:"){
    navigator.serviceWorker.register(BASE + "sw.js").catch(function(){});
  }
})();

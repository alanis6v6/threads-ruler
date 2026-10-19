// 翠排版尺 v2：排版頁。編輯是一則一個文字框；預覽照脆實際的寬度排（跟排版尺本體同一套數字與規則）。
// 草稿、設定都存在 localStorage "threads-ruler-v1"（跟本體同一份），工具頁「加進草稿」的東西會出現在這裡。
(function(){
  var C = window.TRCore, V = window.V2, D = window.TRDividers;
  var $ = function(id){ return document.getElementById(id); };
  var LIMIT = 500;
  var DESKTOP = { card: 639, pad: 24 }, MOBILE_PAD = 12;
  var FEED_AV = 48, REPLY_AV = 38, CJK = 15, LINE_H = 21, LINE_H_APP = 23;   // 跟 app.js 同一組量測值
  var FILLER = C.FILLER, DDI = C.DDI;
  var SAMPLE = [
    "排版前先想好：這篇是會被滑過，還是會被點開看？" + DDI + "(⩌ᴗ⩌ )\n\n在串文列表裡，電腦版一行大約 36 個中文字；點開之後主貼文變寬，一行可以放到 39 個字。\n\n同一段話，換行的位置就不一樣了。",
    "選取英文就能換字體：\nThreads Layout Ruler\n\n點兩下顏文字，可以換臉、換動作 ʕ•ᴥ•ʔ",
    "小提醒：連續打好幾個半形空白，脆只會留一個，這裡會自動幫你換成全形。\n\n選取這行試試「置中」"
  ];

  // ═══ 狀態：草稿跟本體共用；版型設定讀手機那一組（設定那一句話改的也是它） ═══
  var posts = [], sample = false, mode = "edit", history = [], lastSel = null, panel = null, typingSnap = null;
  function store(){ return V.read(); }
  function lay(){ return store().layout.phone; }
  function load(){
    var d = store();
    sample = !!d.sample || !d.posts.length;
    posts = sample ? SAMPLE.slice() : d.posts.map(String);
  }
  function save(){
    if(wide() && $("tCard")) renderPreview();
    var d = store();
    d.posts = posts.slice(); d.sample = sample;
    V.write(d);
  }
  function leaveSample(){
    if(!sample) return;
    sample = false;
    var b = $("sampleNote"); if(b) b.hidden = true;
  }
  // 復原點：連「是不是範例」一起記；不是打字造成的（置中、插入…）會切斷正在打字的那一段
  function remember(typing){
    if(!typing){ clearTimeout(typingSnap); typingSnap = null; }
    history.push({ posts: posts.slice(), sample: sample }); if(history.length > 60) history.shift(); $("undo").disabled = false;
  }
  // 選取、面板都跟著「第幾則、第幾個字」走：則數或內容整個換掉時一起清掉，免得指到別則
  function resetCursor(){ lastSel = null; closePanel(); }

  // ═══ 寬度：跟本體 geom() 一樣 ═══
  function isPhone(){ return window.matchMedia("(max-width: 700px)").matches; }
  function geom(){
    var L = lay(), desk = L.device === "desktop";
    var card = desk ? DESKTOP.card : (L.phoneW === "auto" ? (isPhone() ? Math.max(320, Math.round(document.documentElement.clientWidth)) : 390) : L.phoneW);
    var pad = desk ? DESKTOP.pad : MOBILE_PAD, inner = card - pad * 2;
    return { card: card, pad: pad, feed: inner - FEED_AV, lead: inner, reply: inner - REPLY_AV, desk: desk };
  }
  function widthFor(i){
    var g = geom();
    if((lay().view || "feed") === "feed") return g.feed;
    return i === 0 ? g.lead : g.reply;
  }
  function centerWidth(){
    var g = geom(), t = store().centerTarget || "both";
    return t === "feed" ? g.feed : t === "lead" ? g.lead : Math.round((g.feed + g.lead) / 2);
  }
  // 靠右要補到「不會換行」為止：兩邊折衷時用比較窄的列表寬度，不然在列表裡會多一格被擠到下一行
  function rightWidth(){
    var g = geom(), t = store().centerTarget || "both";
    return t === "lead" ? g.lead : g.feed;
  }
  // 量字寬：跟預覽同一種字型、15px
  var meas = document.createElement("span");
  meas.className = "measure"; meas.setAttribute("aria-hidden", "true");
  document.body.appendChild(meas);
  function textWidth(t){ meas.textContent = t; return meas.getBoundingClientRect().width; }
  // 算行數：放進一樣寬的隱形框量高度
  var box = document.createElement("div");
  box.className = "measure-box"; box.setAttribute("aria-hidden", "true");
  document.body.appendChild(box);
  function lineCount(t, i){
    if(!t.trim()) return 0;
    var lh = geom().desk ? LINE_H : LINE_H_APP;
    box.style.width = widthFor(i) + "px"; box.style.lineHeight = lh + "px";
    box.textContent = output(t);
    return Math.round(box.offsetHeight / lh);
  }

  // ═══ 轉換：空白行、半形空白 ═══
  function keepBlank(){ return store().keepBlank !== false; }
  function spaceMode(){ return store().spaceMode || "smart"; }
  function output(t){
    if(keepBlank()) return t.split("\n").map(function(l){ return l.trim() === "" ? FILLER : l; }).join("\n");
    return t.replace(/\n[ \t]*(?:\n[ \t]*)+/g, "\n");   // 不保留：跟脆一樣把連續空行縮成一個換行
  }

  // ═══ 編輯 ═══
  function renderEdit(){
    var wrap = $("posts");
    wrap.textContent = "";
    posts.forEach(function(text, i){
      var p = document.createElement("section");
      p.className = "post-ed"; p.setAttribute("aria-label", "第 " + (i + 1) + " 則");
      var h = document.createElement("div"); h.className = "ph";
      var no = document.createElement("b"); no.textContent = "第 " + (i + 1) + " 則";
      var stat = document.createElement("span"); stat.className = "stat"; stat.id = "stat-" + i;
      var r = document.createElement("span"); r.className = "r";
      var cp = chip("複製", function(){ copyText(output(posts[i]), "第 " + (i + 1) + " 則已複製"); });
      r.appendChild(cp);
      if(posts.length > 1) r.appendChild(chip("刪除", function(){ remember(); posts.splice(i, 1); leaveSample(); resetCursor(); save(); render(); V.toast("刪掉第 " + (i + 1) + " 則"); }));
      h.append(no, stat, r);
      var ta = document.createElement("textarea");
      ta.id = "post-" + i; ta.value = text; ta.rows = 3; ta.spellcheck = false;
      ta.setAttribute("aria-label", "第 " + (i + 1) + " 則內容");
      ta.placeholder = "第 " + (i + 1) + " 則還沒寫，點這裡開始打字";
      bindTa(ta, i);
      p.append(h, ta);
      wrap.appendChild(p);
      grow(ta); updateStat(i);
    });
  }
  function chip(label, fn, cls){
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip" + (cls ? " " + cls : ""); b.textContent = label;
    b.addEventListener("mousedown", function(e){ e.preventDefault(); });   // 不要把文字框的選取弄掉
    b.addEventListener("click", fn);
    return b;
  }
  function grow(ta){ ta.style.height = "auto"; ta.style.height = Math.max(72, ta.scrollHeight + 2) + "px"; }
  function updateStat(i){
    var el = $("stat-" + i); if(!el) return;
    var n = Array.from(output(posts[i])).length;   // 照複製出去的樣子算：空白行會補一個點字空白
    el.textContent = n + " / " + LIMIT + " 字・" + lineCount(posts[i], i) + " 行";
    el.classList.toggle("over", n > LIMIT);
  }
  var saveTimer = null;
  function bindTa(ta, i){
    function keep(){ lastSel = { i: i, start: ta.selectionStart, end: ta.selectionEnd }; }
    ["focus", "select", "keyup", "mouseup", "touchend"].forEach(function(ev){ ta.addEventListener(ev, keep); });
    ta.addEventListener("input", function(e){
      // 打字的那一串只記一次復原點（停一秒以上再打算新的一段）
      if(!typingSnap){ remember(true); }
      clearTimeout(typingSnap); typingSnap = setTimeout(function(){ typingSnap = null; }, 1000);
      leaveSample();
      posts[i] = ta.value;
      if(panel && panel.kind === "kao" && panel.i === i) closePanel();   // 位置變了，面板記的顏文字位置不準了
      if(!e.isComposing) autoSpaces(ta, i);   // 注音、日文組字中不要動它
      grow(ta); updateStat(i); keep();
      if(wide()) renderPreview();
      clearTimeout(saveTimer); saveTimer = setTimeout(save, 300);
    });
    ta.addEventListener("compositionend", function(){ autoSpaces(ta, i); posts[i] = ta.value; });
    // 點兩下顏文字：打開換臉、換動作（點到的字在顏文字裡面才算）
    ta.addEventListener("dblclick", function(){
      var a = ta.selectionStart, b = ta.selectionEnd, hit = null;
      C.parseKao(posts[i]).forEach(function(m){ if(m.start < b && a < m.end) hit = m; });
      if(hit){ ta.setSelectionRange(hit.end, hit.end); keep(); openKao(i, hit.start); }
    });
  }
  // 半形空白：照設定自動換成全形（游標位置不變，一個換一個）
  function autoSpaces(ta, i){
    var m = spaceMode(); if(m === "off") return;
    var next = C.convertSpaces(posts[i], m);
    if(next === posts[i]) return;
    var a = ta.selectionStart, b = ta.selectionEnd;
    posts[i] = next; ta.value = next; ta.setSelectionRange(a, b);
  }
  function taOf(i){ return $("post-" + i); }
  function selection(){
    if(!lastSel || lastSel.i >= posts.length) return null;
    return lastSel;
  }
  // 插進游標的位置；ownLine：自己佔一行（分隔線）
  function insert(str, ownLine){
    if(mode !== "edit") setMode("edit");
    var s = selection() || { i: posts.length - 1, start: posts[posts.length - 1].length, end: posts[posts.length - 1].length };
    var raw = posts[s.i], at = s.end;
    if(ownLine){
      if(at > 0 && raw[at - 1] !== "\n") str = "\n" + str;
      if(at < raw.length && raw[at] !== "\n") str = str + "\n";
    }
    remember(); leaveSample();
    posts[s.i] = raw.slice(0, at) + str + raw.slice(at);
    var ta = taOf(s.i);
    ta.value = posts[s.i]; grow(ta); updateStat(s.i);
    ta.focus(); ta.setSelectionRange(at + str.length, at + str.length);
    lastSel = { i: s.i, start: at + str.length, end: at + str.length };
    save();
    return { i: s.i, at: at + (str.indexOf(C.DDI) > 0 ? 1 : 0) };
  }

  // ═══ 置中、靠左、靠右 ═══
  function align(how){
    var s = selection();
    if(!s){ V.toast("先在框裡點一下，或選取要對齊的幾行"); return; }
    var raw = posts[s.i];
    var res = C.alignBlock(raw, s.start, s.end, how, how === "right" ? rightWidth() : centerWidth(), textWidth);
    if(!res.changed){ V.toast(res.tooLong ? "選到的行太長，會自動換行，沒辦法" + (how === "right" ? "靠右" : "置中") : "已經是這個對齊了"); return; }
    remember(); leaveSample();
    posts[s.i] = raw.slice(0, res.start) + res.text + raw.slice(res.end);
    var ta = taOf(s.i);
    ta.value = posts[s.i]; grow(ta); updateStat(s.i);
    ta.focus(); ta.setSelectionRange(res.start, res.start + res.text.length);
    lastSel = { i: s.i, start: res.start, end: res.start + res.text.length };
    save();
    V.toast(how === "left" ? "已靠左" : (how === "right" ? "已靠右 " : "已置中 ") + (how === "left" ? "" : res.done + " 行") + (res.tooLong ? "，" + res.tooLong + " 行太長沒動" : ""));
  }

  // ═══ 工具列下面展開的小面板：顏文字、字體、分隔線 ═══
  function closePanel(){ var p = $("toolPanel"); p.hidden = true; p.textContent = ""; panel = null; markTools(); }
  function markTools(){ document.querySelectorAll("[data-tool]").forEach(function(b){ b.setAttribute("aria-pressed", panel && panel.kind === b.dataset.tool ? "true" : "false"); }); }
  function openPanel(kind, build){
    var p = $("toolPanel");
    p.textContent = ""; p.hidden = false; panel = { kind: kind };
    build(p); markTools();
    var close = chip("收起", closePanel, "close"); p.appendChild(close);
  }
  // 顏文字：插一個，或點兩下框裡的顏文字，在這裡換臉、換動作
  function kaoAt(i, start){ var hit = null; C.parseKao(posts[i]).forEach(function(m){ if(m.start === start) hit = m; }); return hit; }
  function openKao(i, start){
    openPanel("kao", function(p){
      var m = kaoAt(i, start);
      if(!m) return;
      panel.i = i; panel.start = start;
      var now = document.createElement("span"); now.className = "kao-now"; now.textContent = C.kaoString(m);
      var row = document.createElement("div"); row.className = "row";
      row.append(chip("換臉", function(){ swapKao("face"); }), chip("換動作", function(){ swapKao("body"); }));
      p.append(now, row);
    });
    if(panel && panel.i === undefined) closePanel();
  }
  function swapKao(kind){
    var m = kaoAt(panel.i, panel.start); if(!m) return;
    var next = { l: m.l, o: m.o, inner: m.inner, c: m.c, r: m.r }, pick = function(a){ return a[Math.floor(Math.random() * a.length)]; };
    if(kind === "face") next.inner = pick(C.ALL_FACES.filter(function(f){ return f !== m.inner.trim(); }));
    else { var b = pick(C.BODIES.filter(function(x){ return !(x.l === m.l && x.r === m.r && x.o === m.o); })); next.l = b.l; next.o = b.o; next.c = b.c; next.r = b.r; }
    var str = C.kaoString(next), raw = posts[panel.i];
    remember(); leaveSample();
    posts[panel.i] = raw.slice(0, m.start) + str + raw.slice(m.end);
    var ta = taOf(panel.i); ta.value = posts[panel.i]; grow(ta); updateStat(panel.i);
    ta.setSelectionRange(m.start + str.length, m.start + str.length);
    lastSel = { i: panel.i, start: m.start + str.length, end: m.start + str.length };
    $("toolPanel").querySelector(".kao-now").textContent = str;
    save();
  }
  function addKao(){
    var face = C.ALL_FACES[Math.floor(Math.random() * C.ALL_FACES.length)];
    var s = selection() || { i: posts.length - 1, end: posts[posts.length - 1].length };
    var at = s.end, str = DDI + "(" + face + ")";
    insert(str, false);
    // 找剛插進去的那個顏文字（手勢 DDI 算在顏文字裡，開頭就是 at）
    var hit = null; C.parseKao(posts[s.i]).forEach(function(m){ if(m.start <= at && at < m.end) hit = m; });
    if(hit) openKao(s.i, hit.start);
  }
  // 字體：選取的那段英文換成另一種字體
  function openFonts(){
    var s = selection();
    if(!s || s.start === s.end){ V.toast("先在框裡選取要換字體的英文"); return; }
    openPanel("font", function(p){
      var src = posts[s.i].slice(s.start, s.end), row = document.createElement("div"); row.className = "row wrap";
      C.STYLES.forEach(function(st){
        row.appendChild(chip(C.stylize(Array.from(src).slice(0, 12).join(""), st.id) + "　" + st.name, function(){
          var cur = selection() || s, raw = posts[cur.i], piece = raw.slice(cur.start, cur.end);
          if(!piece){ V.toast("先選取要換字體的英文"); return; }
          var out = C.stylize(piece, st.id);
          remember(); leaveSample();
          posts[cur.i] = raw.slice(0, cur.start) + out + raw.slice(cur.end);
          var ta = taOf(cur.i); ta.value = posts[cur.i]; grow(ta); updateStat(cur.i);
          ta.focus(); ta.setSelectionRange(cur.start, cur.start + out.length);
          lastSel = { i: cur.i, start: cur.start, end: cur.start + out.length };
          save(); V.toast("換成" + st.name);
        }, "font"));
      });
      p.appendChild(row);
    });
  }
  // 分隔線：點一條插在游標那一行
  function openDividers(){
    if(!D){ V.toast("分隔線還沒載入"); return; }
    openPanel("div", function(p){
      var cats = document.createElement("div"); cats.className = "row cats-mini";
      var list = document.createElement("div"); list.className = "div-list";
      function show(k){
        list.textContent = "";
        cats.querySelectorAll(".chip").forEach(function(c, n){ c.setAttribute("aria-pressed", n === k ? "true" : "false"); });
        D.lines[k][1].forEach(function(line){
          var b = chip(line, function(){ insert(line, true); V.toast("插入分隔線"); }, "div-line");
          list.appendChild(b);
        });
      }
      D.lines.forEach(function(c, k){ cats.appendChild(chip(c[0], function(){ show(k); })); });
      p.append(cats, list);
      show(0);
    });
  }

  // ═══ 預覽：照脆的版型畫，文字寬度就是量好的像素 ═══
  var ICONS = [
    '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    '<path d="M20 12a8 8 0 1 1-3.3-6.5L20 4l-.8 4A8 8 0 0 1 20 12z"/>',
    '<path d="M4 9h13l-3-3M20 15H7l3 3"/>',
    '<path d="M21 4 10 13M21 4l-6.5 16-3.5-7-7-3.5z"/>'
  ];
  function renderPreview(){
    var g = geom(), detail = (lay().view || "feed") === "detail", card = $("tCard");
    card.style.width = g.card + "px"; card.style.setProperty("--pad", g.pad + "px");
    card.style.setProperty("--lh", (g.desk ? LINE_H : LINE_H_APP) + "px");
    card.textContent = "";
    posts.forEach(function(text, i){
      var kind = detail ? (i === 0 ? "lead" : "reply") : "feed";
      var p = document.createElement("article"); p.className = "t-post " + kind;
      var av = document.createElement("div"); av.className = "t-av";
      var head = document.createElement("div"); head.className = "t-head";
      head.innerHTML = "<b>你的帳號</b><span>剛剛</span>";
      var body = document.createElement("div"); body.className = "t-body";
      body.style.width = widthFor(i) + "px";
      body.textContent = output(text);
      if(!text.trim()){ body.classList.add("empty"); body.textContent = "（第 " + (i + 1) + " 則還沒寫）"; }
      var acts = document.createElement("div"); acts.className = "t-acts";
      acts.innerHTML = ICONS.map(function(d){ return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + "</svg>"; }).join("");
      if(kind === "lead"){
        var hr = document.createElement("div"); hr.className = "t-lead-head"; hr.append(av, head);
        p.append(hr, body, acts);
      }else{
        var col = document.createElement("div"); col.className = "t-col";
        var conn = document.createElement("div"); conn.className = "t-conn";
        col.append(av, conn);
        var main = document.createElement("div"); main.className = "t-main"; main.append(head, body, acts);
        p.append(col, main);
      }
      card.appendChild(p);
    });
  }

  // ═══ 複製、打開脆 ═══
  var UA = navigator.userAgent || "";
  var IS_IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  var IS_ANDROID = /Android/.test(UA), IS_MOBILE = IS_IOS || IS_ANDROID;
  function openOn(){ var o = store().openAfterCopy; return o === null || o === undefined ? IS_MOBILE : o; }
  function openThreads(text){
    if(!openOn()) return;
    var fits = text && Array.from(text).length <= LIMIT, q = fits ? "?text=" + encodeURIComponent(text) : "";
    setTimeout(function(){
      if(IS_IOS) location.href = "barcelona://create" + q;
      else if(IS_ANDROID) location.href = "https://www.threads.com/intent/post" + q;
      else window.open("https://www.threads.com/intent/post" + q, "_blank", "noopener");
    }, IS_MOBILE ? 350 : 0);
    if(!fits && text) V.toast("超過 500 字，已打開脆的發文框，請自己貼上");
  }
  function copyText(text, msg){
    if(!text.trim()){ V.toast("這則還沒有內容"); return; }
    V.copy(text, msg);
    openThreads(text);
  }
  function copyAll(){
    var parts = posts.filter(function(t){ return t.trim(); }).map(output);
    copyText(parts.join("\n" + FILLER + "\n"), parts.length > 1 ? "全文 " + parts.length + " 則已複製" : "已複製");
  }
  function paintCopyBtn(){ $("copyAll").textContent = openOn() ? "複製並開脆" : "複製全文"; }

  // ═══ 剪貼簿、網址帶文字進來 ═══
  function importText(text, msg){
    var t = String(text).replace(/\r\n?/g, "\n").split("\n")
      .map(function(l){ return l.replace(new RegExp("[" + FILLER + "\\s]", "g"), "") === "" ? "" : l; }).join("\n")
      .replace(/\n+$/, "");
    if(!t.trim()){ V.toast("剪貼簿裡沒有文字"); return; }
    t = C.convertSpaces(t, spaceMode());
    remember();
    if(sample || posts.every(function(p){ return !p.trim(); })) posts = [t]; else posts.push(t);
    sample = false; resetCursor(); save(); render();
    V.toast(msg || "已貼上成新的一則");
  }
  function paste(){
    if(!navigator.clipboard || !navigator.clipboard.readText){ V.toast("瀏覽器不讓讀剪貼簿，請在文字框長按貼上"); return; }
    navigator.clipboard.readText().then(function(t){ importText(t); }, function(){ V.toast("瀏覽器不讓讀剪貼簿，請在文字框長按貼上"); });
  }

  // ═══ 畫面 ═══
  // 寬螢幕（電腦）：編輯跟預覽並排，不用切換
  var wideQ = window.matchMedia("(min-width: 1100px)");
  function wide(){ return wideQ.matches; }
  function setMode(m){
    mode = m;
    document.querySelectorAll("[data-mode]").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.mode === m ? "true" : "false"); });
    $("editPane").hidden = !wide() && m !== "edit"; $("previewPane").hidden = !wide() && m !== "preview";
    if(m === "preview") closePanel();
    render();
  }
  function setView(v){
    var d = store(); d.layout.phone.view = v; V.write(d);
    refresh();
  }
  // 版型、寬度、設定改了：只更新寬度那一行、字數、預覽；文字框不重建
  // 文字框高度：字型載入完、寬度變了都要重算，不然最後一行會被切掉
  function growAll(){ document.querySelectorAll("#posts textarea").forEach(grow); }
  function refresh(){
    growAll();
    paintBar();
    posts.forEach(function(_, i){ updateStat(i); });
    if(wide() || mode === "preview") renderPreview();
  }
  function paintBar(){
    var g = geom(), L = lay(), detail = (L.view || "feed") === "detail", w = detail ? g.lead : g.feed;
    $("wText").textContent = (g.desk ? "電腦" : "手機 " + g.card) + "・約 " + Math.floor(w / CJK) + " 字/行";
    document.querySelectorAll("[data-view]").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.view === (L.view || "feed") ? "true" : "false"); });
    paintCopyBtn();
  }
  function render(){
    paintBar();
    if(wide()){ renderEdit(); renderPreview(); }
    else if(mode === "edit") renderEdit(); else renderPreview();
    var n = $("sampleNote"); if(n) n.hidden = !sample;
  }

  // ═══ 接上按鈕 ═══
  document.querySelectorAll("[data-mode]").forEach(function(b){ b.addEventListener("click", function(){ setMode(b.dataset.mode); }); });
  document.querySelectorAll("[data-view]").forEach(function(b){ b.addEventListener("click", function(){ setView(b.dataset.view); }); });
  document.querySelectorAll("[data-align]").forEach(function(b){
    b.addEventListener("mousedown", function(e){ e.preventDefault(); });
    b.addEventListener("click", function(){ align(b.dataset.align); });
  });
  var tools = { kao: addKao, font: openFonts, div: openDividers };
  document.querySelectorAll("[data-tool]").forEach(function(b){
    b.addEventListener("mousedown", function(e){ e.preventDefault(); });
    b.addEventListener("click", function(){
      if(b.dataset.tool !== "kao" && panel && panel.kind === b.dataset.tool) closePanel();   // 字體、分隔線：再按一次收起
      else tools[b.dataset.tool]();   // 顏文字：每按一次插一個
    });
  });
  $("wBtn").addEventListener("click", function(){ $("setBtn").click(); });
  $("undo").addEventListener("click", function(){
    if(!history.length) return;
    var h = history.pop(); posts = h.posts; sample = h.sample; $("undo").disabled = !history.length;
    resetCursor(); save(); render(); V.toast("已復原上一步");
  });
  $("paste").addEventListener("click", paste);
  $("addPost").addEventListener("click", function(){
    remember(); leaveSample(); posts.push(""); save();
    if(mode !== "edit") setMode("edit"); else render();
    var ta = taOf(posts.length - 1); ta.focus(); ta.scrollIntoView({ block: "center", behavior: "smooth" });
  });
  $("copyAll").addEventListener("click", copyAll);
  $("clearSample").addEventListener("click", function(){ remember(); posts = [""]; sample = false; resetCursor(); save(); render(); taOf(0).focus(); });
  V.onSettings(function(){ refresh(); });
  wideQ.addEventListener("change", function(){ setMode(mode); });
  var lastW = document.documentElement.clientWidth;
  window.addEventListener("resize", function(){
    var w = document.documentElement.clientWidth;
    if(w === lastW) return;   // 手機網址列伸縮只改高度，不用重畫
    lastW = w; refresh();
  });
  // 從工具頁加了東西再回來（或別的分頁改了草稿）：重新讀一次
  window.addEventListener("pageshow", function(e){ if(e.persisted){ load(); resetCursor(); render(); } });
  window.addEventListener("storage", function(e){ if(e.key === "threads-ruler-v1"){ load(); resetCursor(); render(); } });
  // 離開頁面（切 App、換分頁）前把還沒存的字存起來
  window.addEventListener("pagehide", function(){ clearTimeout(saveTimer); save(); });
  document.addEventListener("visibilitychange", function(){ if(document.hidden){ clearTimeout(saveTimer); save(); } });
  // 手機拖選取把手不一定會觸發 textarea 的事件：用 selectionchange 記住目前的選取
  document.addEventListener("selectionchange", function(){
    var a = document.activeElement;
    if(a && a.tagName === "TEXTAREA" && /^post-\d+$/.test(a.id)) lastSel = { i: +a.id.slice(5), start: a.selectionStart, end: a.selectionEnd };
  });

  load();
  $("undo").disabled = true;
  // 網址帶文字進來（iPhone 捷徑、Android 分享）：?text=…
  try{
    var q = new URLSearchParams(location.search);
    var incoming = [q.get("title"), q.get("text"), q.get("url")].filter(function(v){ return v && v.trim(); }).join("\n");
    if(incoming){ importText(incoming, "已帶入文字，排好按「複製並開脆」"); window.history.replaceState(null, "", location.pathname); }
  }catch(e){}
  setMode("edit");
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(growAll);
})();

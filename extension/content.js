// 翠排版尺：翠（Threads）網頁上的工具
// 1. 側邊欄按「填入」時，把排好的文字填進發文框
// 2. 發文視窗旁的工具卡：直接在翠的發文框裡置中、換英文字體、換顏文字、發佈前整理
// 只在使用者按按鈕時讀寫發文框，不會自動發文、不讀取其他內容。
(function(){
  if(window.__threadsRulerLoaded) return;
  window.__threadsRulerLoaded = true;

  var C = window.TRCore;
  var EDITOR_SEL = '[contenteditable="true"][data-lexical-editor]';
  var lastEditor = null;

  function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  function composerDialog(){
    var eds = document.querySelectorAll('[role="dialog"] ' + EDITOR_SEL);
    return eds.length ? eds[0].closest('[role="dialog"]') : null;
  }
  function editorsIn(dlg){ return Array.prototype.slice.call(dlg.querySelectorAll(EDITOR_SEL)); }

  document.addEventListener("focusin", function(e){
    var ed = e.target.closest && e.target.closest(EDITOR_SEL);
    if(ed) lastEditor = ed;
  }, true);

  // ═══ 發文框文字 ⇄ 位置 ═══
  // 翠的發文框是 Lexical：文字在 span 裡，換行是 <br>；Lexical 自己補的空行 br 不算字
  function isLineBreak(n){ return n.nodeName === "BR" && !n.hasAttribute("data-lexical-managed-linebreak"); }
  function serialize(root){
    var out = "";
    (function walk(p){
      p.childNodes.forEach(function(c){
        if(c.nodeType === 3) out += c.nodeValue;
        else if(c.nodeType === 1){
          if(c.nodeName === "BR"){ if(isLineBreak(c)) out += "\n"; }
          else{
            if(c.nodeName === "P" && out !== "" && !out.endsWith("\n")) out += "\n";
            walk(c);
          }
        }
      });
    })(root);
    return out;
  }
  function selOffsets(ed){
    var s = window.getSelection();
    if(!s || !s.rangeCount) return null;
    var r = s.getRangeAt(0);
    if(!ed.contains(r.startContainer) || !ed.contains(r.endContainer)) return null;
    var pre = document.createRange();
    pre.selectNodeContents(ed);
    pre.setEnd(r.startContainer, r.startOffset);
    var a = serialize(pre.cloneContents()).length;
    pre.setEnd(r.endContainer, r.endOffset);
    return { start: a, end: serialize(pre.cloneContents()).length };
  }
  // 位置 → DOM 節點（跟 serialize 同一套算法）
  function locate(ed, off){
    var acc = 0, found = null, lastText = null;
    (function walk(p){
      for(var i = 0; i < p.childNodes.length && !found; i++){
        var c = p.childNodes[i];
        if(c.nodeType === 3){
          var len = c.nodeValue.length;
          if(off <= acc + len){ found = [c, off - acc]; return; }
          acc += len; lastText = c;
        }else if(c.nodeType === 1){
          if(c.nodeName === "BR"){
            if(isLineBreak(c)){
              if(off === acc){ found = [p, i]; return; }
              acc += 1;
            }
          }else walk(c);
        }
      }
    })(ed);
    if(found) return found;
    return lastText ? [lastText, lastText.nodeValue.length] : [ed, 0];
  }
  function setSel(ed, start, end){
    var a = locate(ed, start), b = locate(ed, end);
    var r = document.createRange();
    r.setStart(a[0], a[1]); r.setEnd(b[0], b[1]);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  async function pasteText(ed, text){
    await wait(60);
    var dt = new DataTransfer();
    dt.setData("text/plain", text);
    ed.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    await wait(160);
  }
  // 翠的發文框吃「貼上」：全選或選取一段後貼上，換行、空白行、全形空白都會保留，也能用翠的復原
  async function replaceRange(ed, start, end, text){
    ed.focus();
    setSel(ed, start, end);
    await pasteText(ed, text);
  }
  async function fillEditor(ed, text){
    ed.focus();
    var r = document.createRange(); r.selectNodeContents(ed);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    await pasteText(ed, text);
  }

  // ═══ 側邊欄「填入」 ═══
  function findAddButton(dlg){
    var nodes = dlg.querySelectorAll("div,span");
    for(var i = 0; i < nodes.length; i++){
      var n = nodes[i];
      if(n.childElementCount === 0 && /^(新增到串文|Add to thread)$/.test(n.textContent.trim())){
        return n.closest('[role="button"]') || n;
      }
    }
    return null;
  }
  async function fill(msg){
    var dlg = composerDialog();
    if(!dlg) return { ok: false, reason: "no-composer" };
    var posts = msg.posts || [];
    if(!posts.length) return { ok: false, reason: "empty" };
    if(msg.mode === "one"){
      var eds = editorsIn(dlg);
      var target = (lastEditor && lastEditor.isConnected && dlg.contains(lastEditor)) ? lastEditor
        : (eds.find(function(e){ return e.innerText.trim() === ""; }) || eds[eds.length - 1]);
      await fillEditor(target, posts[0]);
      return { ok: true, filled: 1 };
    }
    for(var i = 0; i < posts.length; i++){
      var list = editorsIn(dlg);
      if(i >= list.length){
        var add = findAddButton(dlg);
        if(!add) return { ok: i > 0, filled: i, reason: "no-add-button" };
        add.click();
        var t0 = Date.now();
        while(editorsIn(dlg).length <= i && Date.now() - t0 < 2500) await wait(100);
        list = editorsIn(dlg);
        if(i >= list.length) return { ok: i > 0, filled: i, reason: "add-failed" };
      }
      await fillEditor(list[i], posts[i]);
    }
    return { ok: true, filled: posts.length, extra: Math.max(0, editorsIn(dlg).length - posts.length) };
  }
  chrome.runtime.onMessage.addListener(function(msg, sender, reply){
    if(!msg || msg.type !== "threads-ruler-fill") return;
    fill(msg).then(reply, function(err){ reply({ ok: false, reason: String(err) }); });
    return true;
  });

  // ═══ 工具卡設定 ═══
  var WIDTHS = { mobile: { feed: 321, lead: 369, name: "手機" }, desktop: { feed: 543, lead: 591, name: "電腦" } };
  var settings = { device: "mobile", basis: "both" };
  try{
    chrome.storage.local.get(["trDevice", "trBasis"], function(r){
      if(r.trDevice === "mobile" || r.trDevice === "desktop") settings.device = r.trDevice;
      if(["both", "feed", "lead"].indexOf(r.trBasis) > -1) settings.basis = r.trBasis;
      if(ui) renderSettings();
    });
  }catch(e){}
  function saveSettings(){ try{ chrome.storage.local.set({ trDevice: settings.device, trBasis: settings.basis }); }catch(e){} }
  function centerWidth(){
    var w = WIDTHS[settings.device];
    return settings.basis === "feed" ? w.feed : settings.basis === "lead" ? w.lead : Math.round((w.feed + w.lead) / 2);
  }
  var meas = null;
  function measure(t){
    if(!meas){
      meas = document.createElement("span");
      meas.setAttribute("style", "position:fixed;left:-9999px;top:0;visibility:hidden;white-space:pre;");
      document.documentElement.appendChild(meas);
    }
    var ed = lastEditor || document.querySelector(EDITOR_SEL);
    if(ed) meas.style.font = getComputedStyle(ed).font;
    meas.textContent = t;
    return meas.getBoundingClientRect().width;
  }

  // ═══ 目前選取（在發文框裡） ═══
  var cur = null; // { ed, start, end }
  document.addEventListener("selectionchange", function(){
    var s = window.getSelection();
    if(!s || !s.rangeCount) return;
    var node = s.anchorNode;
    var el = node && (node.nodeType === 1 ? node : node.parentElement);
    var ed = el && el.closest && el.closest(EDITOR_SEL);
    if(!ed || !ed.closest('[role="dialog"]')) return;
    var o = selOffsets(ed);
    if(!o) return;
    cur = { ed: ed, start: o.start, end: o.end };
    if(ui) refreshContext();
  });
  function curText(){ return cur && cur.ed.isConnected ? serialize(cur.ed) : null; }

  // ═══ 工具卡 UI（Shadow DOM，不受翠的樣式影響） ═══
  var ui = null;
  var CSS = [
    ":host{all:initial;}",
    ".card{position:fixed;z-index:2147483000;width:292px;box-sizing:border-box;background:#1b1a1f;color:#eeecf1;border:1px solid #2f2c35;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.45);font:13px/1.5 -apple-system,BlinkMacSystemFont,'PingFang TC','Noto Sans TC',sans-serif;padding:12px;}",
    ".head{display:flex;align-items:center;gap:8px;margin-bottom:10px;}",
    ".brand{font-weight:700;letter-spacing:.06em;color:#e88aad;flex:1;}",
    ".icon{border:none;background:none;color:#9c97a3;cursor:pointer;font-size:14px;padding:2px 6px;border-radius:6px;}",
    ".icon:hover{color:#eeecf1;background:#2a2830;}",
    ".row{display:flex;flex-wrap:wrap;gap:6px;}",
    "button.b{border:1px solid #34313b;background:#232128;color:#eeecf1;border-radius:9px;padding:5px 10px;font:inherit;cursor:pointer;white-space:nowrap;}",
    "button.b:hover{border-color:#e88aad;}",
    "button.b.on{border-color:color-mix(in srgb,#e88aad 60%,#1b1a1f);background:#2e1d25;color:#e88aad;}",
    "button.tidy{border-color:color-mix(in srgb,#6bb8d6 55%,#1b1a1f);color:#93cbe0;}",
    ".label{font-size:11.5px;color:#9c97a3;margin:10px 0 6px;letter-spacing:.06em;}",
    ".label b{color:#e88aad;font-weight:700;}",
    ".panel{margin-top:10px;border-top:1px solid #2c2a31;padding-top:4px;max-height:300px;overflow:auto;}",
    ".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:5px;}",
    ".chip{border:1px solid #34313b;background:#232128;color:#eeecf1;border-radius:8px;padding:5px 4px;font:14px/1.3 system-ui,-apple-system,sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    ".chip:hover{border-color:#e88aad;}",
    ".chip.on{border-color:#e88aad;background:#2e1d25;}",
    ".chip small{display:block;font:10.5px/1.2 -apple-system,'PingFang TC',sans-serif;color:#9c97a3;}",
    ".seg{display:inline-flex;border:1px solid #34313b;border-radius:8px;overflow:hidden;}",
    ".seg button{border:none;background:#232128;color:#9c97a3;padding:3px 9px;font:inherit;font-size:12px;cursor:pointer;}",
    ".seg button.on{background:#2e1d25;color:#e88aad;font-weight:700;}",
    ".status{margin-top:10px;font-size:12px;color:#9c97a3;min-height:18px;}",
    ".hint{font-size:12px;color:#9c97a3;}",
    ".min .body{display:none;}",
    ".min{width:auto;padding:8px 12px;}",
    ".min .head{margin:0;}"
  ].join("");

  function h(tag, attrs, kids){
    var e = document.createElement(tag);
    if(attrs) Object.keys(attrs).forEach(function(k){
      if(k === "text") e.textContent = attrs[k];
      else if(k === "on") Object.keys(attrs.on).forEach(function(ev){ e.addEventListener(ev, attrs.on[ev]); });
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function(k){ if(k) e.appendChild(k); });
    return e;
  }

  function buildUI(){
    var host = h("div", { id: "threads-ruler-toolbar" });
    var root = host.attachShadow({ mode: "open" });
    root.appendChild(h("style", { text: CSS }));
    var card = h("div", { class: "card" });
    // 按在工具卡上不要讓發文框失去選取
    card.addEventListener("mousedown", function(e){ e.preventDefault(); });

    var minBtn = h("button", { class: "icon", title: "收合／展開", text: "—" });
    var panelBtn = h("button", { class: "icon", title: "在側邊欄打開翠排版尺", text: "↗" });
    card.appendChild(h("div", { class: "head" }, [h("span", { class: "brand", text: "📏 翠排版尺" }), panelBtn, minBtn]));

    var body = h("div", { class: "body" });
    var bCenter = h("button", { class: "b", text: "置中" });
    var bLeft = h("button", { class: "b", text: "靠左" });
    var bFont = h("button", { class: "b", text: "𝐀𝐚 字體" });
    var bKao = h("button", { class: "b", text: C.DDI + "( ) 顏文字" });
    var bTidy = h("button", { class: "b tidy", text: "✨ 發佈前整理" });
    body.appendChild(h("div", { class: "row" }, [bCenter, bLeft, bFont, bKao, bTidy]));
    var settingsBox = h("div");
    body.appendChild(settingsBox);
    var panel = h("div", { class: "panel" });
    panel.hidden = true;
    body.appendChild(panel);
    var status = h("div", { class: "status" });
    body.appendChild(status);
    card.appendChild(body);
    root.appendChild(card);
    document.documentElement.appendChild(host);

    ui = { host: host, card: card, panel: panel, status: status, settingsBox: settingsBox, mode: null, bFont: bFont, bKao: bKao };

    minBtn.addEventListener("click", function(){
      card.classList.toggle("min");
      minBtn.textContent = card.classList.contains("min") ? "＋" : "—";
      place();
    });
    panelBtn.addEventListener("click", openSidePanel);
    bCenter.addEventListener("click", function(){ align("center"); });
    bLeft.addEventListener("click", function(){ align("left"); });
    bFont.addEventListener("click", function(){ togglePanel("font"); });
    bKao.addEventListener("click", function(){ togglePanel("kao"); });
    bTidy.addEventListener("click", tidy);
    renderSettings();
  }

  function say(msg){ if(ui) ui.status.textContent = msg; }

  function renderSettings(){
    var box = ui.settingsBox; box.textContent = "";
    function seg(options, value, onPick){
      var s = h("div", { class: "seg" });
      options.forEach(function(o){
        s.appendChild(h("button", { class: o[0] === value ? "on" : "", text: o[1], on: { click: function(){ onPick(o[0]); } } }));
      });
      return s;
    }
    box.appendChild(h("div", { class: "label", text: "置中依 " + WIDTHS[settings.device].name + "・" + { both: "列表與點開折衷", feed: "串文列表", lead: "點開" }[settings.basis] + " " + centerWidth() + "px" }));
    box.appendChild(h("div", { class: "row" }, [
      seg([["mobile", "手機"], ["desktop", "電腦"]], settings.device, function(v){ settings.device = v; saveSettings(); renderSettings(); }),
      seg([["both", "兩邊折衷"], ["feed", "列表"], ["lead", "點開"]], settings.basis, function(v){ settings.basis = v; saveSettings(); renderSettings(); })
    ]));
  }

  function togglePanel(mode){
    ui.mode = ui.mode === mode ? null : mode;
    ui.bFont.classList.toggle("on", ui.mode === "font");
    ui.bKao.classList.toggle("on", ui.mode === "kao");
    renderPanel();
  }
  function refreshContext(){ if(ui && ui.mode) renderPanel(); }

  function renderPanel(){
    var p = ui.panel; p.textContent = "";
    p.hidden = !ui.mode;
    if(!ui.mode){ place(); return; }
    var text = curText();
    if(ui.mode === "font"){
      var seg = cur && text != null && cur.end > cur.start ? text.slice(cur.start, cur.end) : "";
      if(!/[A-Za-z0-9]/.test(C.plainify(seg))){
        p.appendChild(h("div", { class: "label", text: "先在發文框選取英文或數字" }));
      }else{
        var sample = Array.from(C.plainify(seg)).slice(0, 10).join("").replace(/\n/g, " ");
        var grid = h("div", { class: "grid" });
        C.STYLES.forEach(function(st){
          var b = h("button", { class: "chip" }, [document.createTextNode(C.stylize(sample, st.id)), h("small", { text: st.name })]);
          b.addEventListener("click", function(){ applyFont(st.id); });
          grid.appendChild(b);
        });
        p.appendChild(h("div", { class: "label", text: "點一下就換，可以一直換" }));
        p.appendChild(grid);
      }
    }else if(ui.mode === "kao"){
      var m = currentKao(text);
      if(m){
        p.appendChild(h("div", { class: "label" }, [document.createTextNode("換掉游標所在的 "), h("b", { text: C.kaoString(m) })]));
      }else{
        p.appendChild(h("div", { class: "label", text: "點一下插入到游標位置；游標放在顏文字上可以直接換" }));
      }
      var faceGrid = h("div", { class: "grid" });
      C.FACES.forEach(function(g){
        g[1].forEach(function(f){
          var show = m ? C.kaoString({ l: m.l, o: m.o, inner: f, c: m.c, r: m.r }) : C.DDI + "(" + f + ")";
          var b = h("button", { class: "chip" + (m && m.inner.trim() === f ? " on" : ""), title: g[0], text: show });
          b.addEventListener("click", function(){ applyKao({ inner: f }); });
          faceGrid.appendChild(b);
        });
      });
      p.appendChild(h("div", { class: "label", text: "換臉" }));
      p.appendChild(faceGrid);
      if(m){
        var bodyGrid = h("div", { class: "grid" });
        C.BODIES.forEach(function(bd){
          var on = bd.l === m.l && bd.r === m.r && bd.o === m.o;
          var b = h("button", { class: "chip" + (on ? " on" : ""), text: C.kaoString({ l: bd.l, o: bd.o, inner: m.inner, c: bd.c, r: bd.r }) });
          b.addEventListener("click", function(){ applyKao({ l: bd.l, o: bd.o, c: bd.c, r: bd.r }); });
          bodyGrid.appendChild(b);
        });
        p.appendChild(h("div", { class: "label", text: "換手勢（臉不變）" }));
        p.appendChild(bodyGrid);
      }
    }
    place();
  }

  function currentKao(text){
    if(!cur || text == null) return null;
    var list = C.parseKao(text);
    for(var i = 0; i < list.length; i++){
      if(list[i].start <= cur.start && cur.end <= list[i].end) return list[i];
    }
    return null;
  }

  // ═══ 動作 ═══
  function needEditor(){
    if(!cur || !cur.ed.isConnected){ say("先點進發文框，選取要改的文字"); return false; }
    return true;
  }
  async function applyFont(id){
    if(!needEditor()) return;
    var text = serialize(cur.ed), seg = text.slice(cur.start, cur.end);
    var out = C.stylize(seg, id);
    if(out === seg){ say("這段已經是這個字體了"); return; }
    var ed = cur.ed, start = cur.start;
    await replaceRange(ed, cur.start, cur.end, out);
    await wait(80);
    setSel(ed, start, start + out.length); // 選取新文字，可以一直換
    say("已換成" + C.STYLES.find(function(s){ return s.id === id; }).name);
  }
  async function applyKao(change){
    if(!needEditor()) return;
    var ed = cur.ed, text = serialize(ed), m = currentKao(text);
    if(!m){
      if(!change.inner){ say("游標放在顏文字上才能換手勢"); return; }
      var ins = C.DDI + "(" + change.inner + ")";
      var start = cur.start;
      await replaceRange(ed, cur.start, cur.end, ins);
      await wait(80);
      setSel(ed, start + ins.length - 1, start + ins.length - 1); // 游標留在括號裡，可以繼續換
      say("已插入 " + ins);
      return;
    }
    var next = { l: m.l, o: m.o, inner: m.inner, c: m.c, r: m.r };
    Object.keys(change).forEach(function(k){ next[k] = change[k]; });
    var str = C.kaoString(next);
    await replaceRange(ed, m.start, m.end, str);
    await wait(80);
    setSel(ed, m.start + 1, m.start + 1); // 游標留在顏文字裡，可以繼續換
    say("已換成 " + str);
  }
  async function align(mode){
    if(!needEditor()) return;
    var ed = cur.ed, text = serialize(ed);
    var res = C.alignBlock(text, cur.start, cur.end, mode, centerWidth(), measure);
    if(!res.changed){ say(res.tooLong ? "選到的行太長，會自動換行，沒辦法置中" : "已經是這個對齊了"); return; }
    await replaceRange(ed, res.start, res.end, res.text);
    say(mode === "left" ? "已靠左" : "已置中 " + res.done + " 行" + (res.tooLong ? "，" + res.tooLong + " 行太長沒動" : ""));
  }
  async function tidy(){
    var dlg = composerDialog();
    if(!dlg) return;
    var n = 0;
    var eds = editorsIn(dlg);
    for(var i = 0; i < eds.length; i++){
      var ed = eds[i], text = serialize(ed);
      if(!text.trim()) continue;
      var out = C.fillBlankLines(C.convertSpaces(text.replace(/\n$/, ""), "smart"));
      if(out !== text.replace(/\n$/, "")){ await fillEditor(ed, out); n++; }
    }
    say(n ? "已整理 " + n + " 則：空白行保留、會被吃掉的半形空白轉全形" : "不用整理，已經都沒問題");
  }
  function openSidePanel(){
    var dlg = composerDialog();
    var posts = dlg ? editorsIn(dlg).map(function(e){ return serialize(e).replace(/\n$/, ""); }).filter(function(t){ return t.trim() !== ""; }) : [];
    chrome.runtime.sendMessage({ type: "threads-ruler-open", posts: posts });
    say(posts.length ? "已把 " + posts.length + " 則帶進側邊欄" : "已打開側邊欄");
  }

  // ═══ 位置：發文視窗右邊，放不下就放左邊或上方 ═══
  function place(){
    var dlg = composerDialog();
    if(!dlg){ if(ui) ui.host.style.display = "none"; return; }
    if(!ui) buildUI();
    ui.host.style.display = "";
    var r = firstVisibleRect(dlg);
    var card = ui.card, cw = card.offsetWidth, ch = card.offsetHeight, gap = 12, vw = window.innerWidth, vh = window.innerHeight;
    var left, top;
    var clampLeft = Math.min(Math.max(8, r.right - cw), vw - cw - 8);
    if(r.right + gap + cw <= vw - 8){ left = r.right + gap; top = Math.min(Math.max(8, r.top), vh - ch - 8); }
    else if(r.left - gap - cw >= 8){ left = r.left - gap - cw; top = Math.min(Math.max(8, r.top), vh - ch - 8); }
    else if(r.top - gap - ch >= 8){ left = clampLeft; top = r.top - gap - ch; }        // 左右放不下：放發文視窗上方
    else if(r.bottom + gap + ch <= vh - 8){ left = clampLeft; top = r.bottom + gap; }  // 或下方
    else { left = Math.max(8, vw - cw - 8); top = 8; }                                  // 真的沒空間：右上角，可以收合
    card.style.left = left + "px"; card.style.top = top + "px";
  }
  // 翠的 dialog 外層可能是整個畫面的遮罩，找實際的發文視窗框
  function firstVisibleRect(dlg){
    var ed = dlg.querySelector(EDITOR_SEL);
    var el = ed, best = dlg.getBoundingClientRect();
    while(el && el !== dlg){
      var r = el.getBoundingClientRect();
      if(r.width >= 400 && r.width < window.innerWidth * 0.9){ best = r; }
      el = el.parentElement;
    }
    return best;
  }
  var raf = 0;
  function schedule(){ if(!raf) raf = requestAnimationFrame(function(){ raf = 0; place(); }); }
  new MutationObserver(schedule).observe(document.body || document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("scroll", schedule, true);
})();

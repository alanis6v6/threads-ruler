// 翠排版尺：在翠（Threads）網頁上，把排好的文字填進發文框，
// 並在發文視窗旁邊放一顆「翠排版尺」按鈕，把發文框裡的字帶進側邊欄。
// 只在使用者按按鈕時讀寫發文框，不會自動發文、不讀取其他內容。
(function(){
  if(window.__threadsRulerLoaded) return;
  window.__threadsRulerLoaded = true;

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

  // 翠的發文框是 Lexical 編輯器：全選後模擬「貼上」，換行、空白行、全形空白都會保留
  function selectAll(ed){
    ed.focus();
    var r = document.createRange();
    r.selectNodeContents(ed);
    var s = window.getSelection();
    s.removeAllRanges(); s.addRange(r);
  }
  async function fillEditor(ed, text){
    selectAll(ed);
    await wait(60);
    var dt = new DataTransfer();
    dt.setData("text/plain", text);
    ed.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    await wait(200);
  }
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

    // 整串：依序填，不夠的框按「新增到串文」補
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
    var extra = editorsIn(dlg).length - posts.length;
    return { ok: true, filled: posts.length, extra: Math.max(0, extra) };
  }

  chrome.runtime.onMessage.addListener(function(msg, sender, reply){
    if(!msg || msg.type !== "threads-ruler-fill") return;
    fill(msg).then(reply, function(err){ reply({ ok: false, reason: String(err) }); });
    return true;
  });

  // ── 發文視窗旁的「翠排版尺」按鈕 ──
  var pill = null;
  function makePill(){
    pill = document.createElement("button");
    pill.type = "button";
    pill.textContent = "📏 用翠排版尺排版";
    pill.title = "把發文框裡的字帶進翠排版尺側邊欄";
    pill.setAttribute("style", [
      "position:fixed", "z-index:2147483000", "display:none",
      "padding:6px 14px", "border-radius:999px", "border:1px solid rgba(232,138,173,.55)",
      "background:#1f1d24", "color:#e88aad", "font:600 13px/1.4 -apple-system,BlinkMacSystemFont,'PingFang TC',sans-serif",
      "box-shadow:0 6px 20px rgba(0,0,0,.35)", "cursor:pointer", "white-space:nowrap"
    ].join(";"));
    pill.addEventListener("mousedown", function(e){ e.preventDefault(); });
    pill.addEventListener("click", function(){
      var dlg = composerDialog();
      var posts = dlg ? editorsIn(dlg).map(function(e){ return e.innerText.replace(/\n$/, ""); }).filter(function(t){ return t.trim() !== ""; }) : [];
      chrome.runtime.sendMessage({ type: "threads-ruler-open", posts: posts });
    });
    document.documentElement.appendChild(pill);
  }
  function placePill(){
    var dlg = composerDialog();
    if(!dlg){ if(pill) pill.style.display = "none"; return; }
    if(!pill) makePill();
    var r = dlg.getBoundingClientRect();
    if(!r.width){ pill.style.display = "none"; return; }
    pill.style.display = "block";
    var w = pill.offsetWidth || 150;
    pill.style.top = Math.max(8, r.top - 44) + "px";
    pill.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + "px";
  }
  var raf = 0;
  function schedule(){ if(!raf) raf = requestAnimationFrame(function(){ raf = 0; placePill(); }); }
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("scroll", schedule, true);
})();

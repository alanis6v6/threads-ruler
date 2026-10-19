// 翠排版尺 v2：字體頁。打英文（中文也行），下面每種樣式一起換；點一下放上面的小卡，點兩下複製。
(function(){
  var C = window.TRCore, X = window.TRFontsExtra, V = window.V2;
  var $ = function(id){ return document.getElementById(id); };
  var input = $("fontIn"), now = $("pickNow"), name = $("pickName");
  var rows = Array.prototype.slice.call(document.querySelectorAll(".font-list button"));
  var fns = {};
  if(C) C.STYLES.forEach(function(s){ fns[s.id] = function(t){ return C.stylize(t, s.id); }; });
  if(X) X.EXTRA.forEach(function(s){ fns[s.id] = s.fn; });
  var sel = rows[0];
  if(sel) sel.setAttribute("aria-pressed", "true");

  function render(){
    var t = input.value.trim() ? input.value : input.placeholder;   // 空的或只有空白：先用範例字
    rows.forEach(function(b){ var f = fns[b.dataset.style]; if(f) b.querySelector(".t").textContent = f(t); });
    show(sel);
  }
  function show(b){
    if(!b) return;
    now.textContent = b.querySelector(".t").textContent;
    name.textContent = b.querySelector(".n").firstChild.textContent;
  }
  var lastTap = { el: null, t: 0 };
  rows.forEach(function(b){
    b.addEventListener("click", function(){
      var t = Date.now(), text = b.querySelector(".t").textContent;
      if(lastTap.el === b && t - lastTap.t < 350){ V.copy(text, "已複製　" + text); lastTap.el = null; return; }
      lastTap = { el: b, t: t };
      rows.forEach(function(x){ x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      sel = b; show(b);
    });
  });
  now.addEventListener("click", function(){ V.copy(now.textContent, "已複製　" + now.textContent); });
  $("pickAdd").addEventListener("click", function(){ if(V.addToDraft(now.textContent)) V.toast("已加進草稿・點兩下直接複製"); });
  input.addEventListener("input", render);
  render();
})();

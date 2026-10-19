// 翠排版尺 v2：emoji、特殊符號頁。點一下放上面的小卡（看名字、加進草稿），點兩下直接複製；emoji 可以用中文名字搜尋。
(function(){
  var V = window.V2;
  var $ = function(id){ return document.getElementById(id); };
  var now = $("pickNow"), name = $("pickName"), list = $("pickList");
  var buttons = Array.prototype.slice.call(list.querySelectorAll(".pick-group button"));

  function show(b){
    now.textContent = b.textContent;
    name.textContent = b.getAttribute("aria-label") || "";
    var kw = b.dataset.k;
    if(kw){ var s = document.createElement("small"); s.textContent = kw.split(" ").join("・"); name.appendChild(s); }
  }

  var cats = document.querySelectorAll("[data-cat]");
  function pickCat(b){
    cats.forEach(function(x){ x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    list.querySelectorAll(".pick-group").forEach(function(g){ g.classList.toggle("on", g.id === b.dataset.cat); });
  }
  cats.forEach(function(b){
    b.addEventListener("click", function(){ clearFind(); pickCat(b); b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); });
  });

  var lastTap = { el: null, t: 0 };
  buttons.forEach(function(b){
    b.addEventListener("click", function(){
      var t = Date.now();
      if(lastTap.el === b && t - lastTap.t < 350){ V.copy(b.textContent, "已複製 " + b.textContent); lastTap.el = null; return; }
      lastTap = { el: b, t: t };
      buttons.forEach(function(x){ if(x !== b) x.removeAttribute("aria-pressed"); });
      b.setAttribute("aria-pressed", "true");
      show(b);
    });
  });
  now.addEventListener("click", function(){ V.copy(now.textContent, "已複製 " + now.textContent); });
  $("pickAdd").addEventListener("click", function(){ if(V.addToDraft(now.textContent)) V.toast("已加進草稿・點兩下直接複製"); });

  // 搜尋（emoji 頁才有）：比對名字、關鍵字或貼上的字本身，搜尋時所有分類一起列出來
  var find = $("find"), empty = $("findEmpty"), count = $("findCount"), composing = false;
  var total = count ? count.textContent : "";
  function clearFind(){ if(find && find.value){ find.value = ""; run(); } }
  function run(){
    var q = find.value.trim().toLowerCase(), hits = 0;
    list.classList.toggle("searching", !!q);
    buttons.forEach(function(b){
      var hay = ((b.getAttribute("aria-label") || "") + " " + (b.dataset.k || "") + " " + b.textContent).toLowerCase();
      var ok = !q || hay.indexOf(q) > -1;
      b.hidden = !ok; if(ok) hits++;
    });
    list.querySelectorAll(".pick-group").forEach(function(g){ g.hidden = !!q && !g.querySelector("button:not([hidden])"); });
    cats.forEach(function(x){ x.classList.toggle("dim", !!q); });
    if(count) count.textContent = q ? "找到 " + hits + " 個" : total;
    if(empty) empty.hidden = !q || hits > 0;
  }
  if(find){
    find.addEventListener("compositionstart", function(){ composing = true; });
    find.addEventListener("compositionend", function(){ composing = false; run(); });
    find.addEventListener("input", function(){ if(!composing) run(); });
  }
  if(buttons[0]) show(buttons[0]);
})();

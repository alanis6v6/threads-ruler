// 翠排版尺 v2：emoji、特殊符號頁。點一下放上面的小卡（看名字、加進草稿），點兩下直接複製；emoji 可以用中文名字搜尋。
(function(){
  var V = window.V2;
  var $ = function(id){ return document.getElementById(id); };
  var now = $("pickNow"), name = $("pickName"), list = $("pickList"), favBtn = $("pickFav"), favBox = $("gfav");
  var buttons = Array.prototype.slice.call(list.querySelectorAll(".pick-group:not(#gfav):not(.cards) button"));

  function paintFav(){ favBtn.setAttribute("aria-pressed", V.favs().indexOf(now.textContent) > -1 ? "true" : "false"); }
  // 我的最愛：從存的清單畫出來；名字從原本那一格抄（別頁收的就只有字）
  function renderFavs(){
    var a = V.favs(), byText = {};
    buttons.forEach(function(b){ byText[b.textContent] = b; });
    favBox.querySelectorAll("button, p").forEach(function(x){ x.remove(); });
    a.forEach(function(t){
      var src = byText[t], b = src ? src.cloneNode(true) : document.createElement("button");
      b.type = "button"; b.removeAttribute("aria-pressed"); b.hidden = false;
      if(!src){ b.textContent = t; if(Array.from(t).length > 2) b.className = "long"; }
      favBox.appendChild(b);
    });
    if(!a.length){ var p = document.createElement("p"); p.className = "fav-empty"; p.textContent = V.t("還沒有收藏。點一個，再按上面小卡的「收藏」。"); favBox.appendChild(p); }
    if(now.textContent) paintFav();
  }
  function show(b){
    now.textContent = b.textContent;
    name.textContent = b.getAttribute("aria-label") || "";
    var kw = b.dataset.k;
    if(kw){ var s = document.createElement("small"); s.textContent = kw.split(" ").join("・"); name.appendChild(s); }
    paintFav();
  }

  var cats = document.querySelectorAll("[data-cat]");
  function pickCat(b){
    cats.forEach(function(x){ x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    list.querySelectorAll(".pick-group").forEach(function(g){ g.classList.toggle("on", g.id === b.dataset.cat); });
    var card = document.querySelector(".pick-card"), g = document.getElementById(b.dataset.cat);
    if(card) card.hidden = !!(g && g.classList.contains("cards"));   // 卡片那一組自己有複製、放進排版，上面的小卡先收起來
  }
  cats.forEach(function(b){
    b.addEventListener("click", function(){ clearFind(); pickCat(b); b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); });
  });

  var lastTap = { el: null, t: 0 };
  list.addEventListener("click", function(e){
    var b = e.target.closest(".pick-group button");
    if(!b || b.closest(".cards")) return;   // 卡片自己的按鈕（複製、放進排版）交給 cards.js
    var t = Date.now();
    if(lastTap.el === b && t - lastTap.t < 350){ V.copy(b.textContent, V.t("已複製　{t}", { t: b.textContent })); lastTap.el = null; return; }
    lastTap = { el: b, t: t };
    list.querySelectorAll(".pick-group button[aria-pressed]").forEach(function(x){ if(x !== b) x.removeAttribute("aria-pressed"); });
    b.setAttribute("aria-pressed", "true");
    show(b);
  });
  now.addEventListener("click", function(){ V.copy(now.textContent, V.t("已複製　{t}", { t: now.textContent })); });
  $("pickAdd").addEventListener("click", function(){ V.track("mat_insert", { mat: "pick" }); if(V.addToDraft(now.textContent)) V.toast(V.t("已加進草稿・點兩下直接複製")); });

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
    list.querySelectorAll(".pick-group").forEach(function(g){ g.hidden = !!q && (g === favBox || !g.querySelector("button:not([hidden])")); });
    cats.forEach(function(x){ x.classList.toggle("dim", !!q); });
    if(count) count.textContent = q ? V.t("找到 {n} 個", { n: hits }) : total;
    if(empty) empty.hidden = !q || hits > 0;
  }
  if(find){
    find.addEventListener("compositionstart", function(){ composing = true; });
    find.addEventListener("compositionend", function(){ composing = false; run(); });
    find.addEventListener("input", function(){ if(!composing) run(); });
  }
  favBtn.addEventListener("click", function(){ if(now.textContent) V.toggleFav(now.textContent); });
  document.addEventListener("v2:favs", renderFavs);
  renderFavs();
  if(buttons[0]) show(buttons[0]);
})();

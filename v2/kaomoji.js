// 翠排版尺 v2：顏文字頁。點一個 → 上面的小卡換成它，可以換臉、換動作、收藏、加進草稿；點兩下直接複製。
// 換臉、換動作跟排版尺本體一樣只換括號跟手那一段，前後的東西（︵ ┻━┻、♪、凹）留著。
(function(){
  var C = window.TRCore, V = window.V2;
  var $ = function(id){ return document.getElementById(id); };
  var big = $("kaoNow"), cur = null;   // cur：目前這個顏文字拆開的樣子 {start,end,l,o,inner,c,r}
  var list = document.querySelector(".kao-list"), favBox = $("kfav"), favBtn = $("kaoFav");
  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

  function paintFav(){ favBtn.setAttribute("aria-pressed", V.favs().indexOf(big.textContent) > -1 ? "true" : "false"); }
  function setKao(text){
    big.textContent = text;
    cur = C ? (C.parseKao(text)[0] || null) : null;
    $("swapFace").disabled = $("swapBody").disabled = !cur;
    paintFav();
  }
  function swap(kind){
    if(!cur) return;
    var next = { l: cur.l, o: cur.o, inner: cur.inner, c: cur.c, r: cur.r };
    if(kind === "face"){
      next.inner = pick(C.ALL_FACES.filter(function(f){ return f !== cur.inner.trim(); }));
    }else{
      var b = pick(C.BODIES.filter(function(x){ return !(x.l === cur.l && x.r === cur.r && x.o === cur.o); }));
      next.l = b.l; next.o = b.o; next.c = b.c; next.r = b.r;
    }
    var raw = big.textContent, str = C.kaoString(next);
    big.textContent = raw.slice(0, cur.start) + str + raw.slice(cur.end);
    next.start = cur.start; next.end = cur.start + str.length; cur = next;
    paintFav();
  }

  // 分類：一次只露一組（沒有 JS 時全部都看得到，搜尋也讀得到每一個；html 的 js class 在 head 就加好了）
  var cats = document.querySelectorAll("[data-cat]");
  cats.forEach(function(b){
    b.addEventListener("click", function(){
      cats.forEach(function(x){ x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      document.querySelectorAll(".kao-group").forEach(function(g){ g.classList.toggle("on", g.id === b.dataset.cat); });
      $("kaoCard").hidden = b.dataset.cat === "kbig";   // 大型顏文字卡片自己有按鈕，換臉小卡先收起來
      b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
  });

  // 點一下選它、點兩下複製（手機上兩下之間 350ms 內）。用委派：我的最愛那一組是後來長出來的
  var lastTap = { el: null, t: 0 };
  list.addEventListener("click", function(e){
    var b = e.target.closest(".kao-group button");
    if(!b || b.closest(".cards")) return;   // 大型顏文字卡片的按鈕交給 cards.js
    var now = Date.now(), text = b.textContent;
    if(lastTap.el === b && now - lastTap.t < 350){ V.copy(text, "已複製　" + text); lastTap.el = null; return; }
    lastTap = { el: b, t: now };
    list.querySelectorAll(".kao-group button[aria-pressed]").forEach(function(x){ x.removeAttribute("aria-pressed"); });
    b.setAttribute("aria-pressed", "true");
    setKao(text);   // 小卡黏在上面，不用捲回去，也不會打斷點兩下
  });

  // 我的最愛：顏文字、emoji、符號共用一份
  function renderFavs(){
    var a = V.favs();
    favBox.querySelectorAll("button, p").forEach(function(x){ x.remove(); });
    a.forEach(function(t){ var b = document.createElement("button"); b.type = "button"; b.textContent = t; favBox.appendChild(b); });
    if(!a.length){
      var p = document.createElement("p"); p.className = "fav-empty";
      p.textContent = "還沒有收藏。點一個，再按上面小卡的「收藏」。";
      favBox.appendChild(p);
    }
    paintFav();
  }
  favBtn.addEventListener("click", function(){ V.toggleFav(big.textContent); });
  document.addEventListener("v2:favs", renderFavs);

  $("swapFace").addEventListener("click", function(){ swap("face"); });
  $("swapBody").addEventListener("click", function(){ swap("body"); });
  $("addKao").addEventListener("click", function(){ if(V.addToDraft(big.textContent)) V.toast("已加進草稿・點兩下直接複製"); });
  big.addEventListener("click", function(){ V.copy(big.textContent, "已複製　" + big.textContent); });
  if(!C){ $("swapFace").hidden = $("swapBody").hidden = true; }
  renderFavs();
  setKao(big.textContent);
})();

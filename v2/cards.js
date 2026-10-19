// 翠排版尺 v2：大型顏文字、可以放字的框（分隔線頁）共用的卡片。
// 圖先寫在 HTML 裡（搜尋讀得到）；有輸入框的，打字就用 kaomoji.js 的 fill() 重畫。
(function(){
  var C = window.TRCore, K = window.TRKaomoji, D = window.TRDividers, V = window.V2;
  if(!K) return;
  var SRC = { big: K.big, div: D ? D.cards : [] };
  // 複製、放進排版前整理：空白行補點字空白、會被吃掉的半形空白轉全形（跟排版尺本體同一招）
  function tidy(t){ return C.fillBlankLines(C.convertSpaces(String(t).replace(/\n+$/, ""), "smart")); }
  document.querySelectorAll(".big-card").forEach(function(card){
    var item = (SRC[card.dataset.src] || [])[+card.dataset.i];
    if(!item) return;
    var art = card.querySelector(".big-art"), inp = card.querySelector(".big-input");
    function cur(){ return K.fill(item, inp && inp.value.trim() ? inp.value.trim() : null); }
    if(inp) inp.addEventListener("input", function(){ art.textContent = cur(); });
    card.querySelector(".big-copy").addEventListener("click", function(){ V.copy(tidy(cur()), V.t("已複製　{t}", { t: V.t(item.name) })); });
    card.querySelector(".big-use").addEventListener("click", function(){
      if(V.addPost(tidy(cur()))) V.toast(V.t("已放進草稿的新一則，到排版頁看手機會不會換行"));
    });
  });
})();

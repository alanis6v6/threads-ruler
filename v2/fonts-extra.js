// 翠排版尺 v2：字體頁另外加的幾種樣式（上標、下標、刪除線、底線、倒過來……）。
// 排版尺本體的 14 種在 core.js（選取英文換字體也用那一套）；這幾種只在字體頁用，因為大多換不回一般字。
(function(root){
  var SUP = { a:"ᵃ",b:"ᵇ",c:"ᶜ",d:"ᵈ",e:"ᵉ",f:"ᶠ",g:"ᵍ",h:"ʰ",i:"ⁱ",j:"ʲ",k:"ᵏ",l:"ˡ",m:"ᵐ",n:"ⁿ",o:"ᵒ",p:"ᵖ",r:"ʳ",s:"ˢ",t:"ᵗ",u:"ᵘ",v:"ᵛ",w:"ʷ",x:"ˣ",y:"ʸ",z:"ᶻ",
    A:"ᴬ",B:"ᴮ",D:"ᴰ",E:"ᴱ",G:"ᴳ",H:"ᴴ",I:"ᴵ",J:"ᴶ",K:"ᴷ",L:"ᴸ",M:"ᴹ",N:"ᴺ",O:"ᴼ",P:"ᴾ",R:"ᴿ",T:"ᵀ",U:"ᵁ",V:"ⱽ",W:"ᵂ",
    "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","+":"⁺","-":"⁻","=":"⁼","(":"⁽",")":"⁾" };
  var SUB = { a:"ₐ",e:"ₑ",h:"ₕ",i:"ᵢ",j:"ⱼ",k:"ₖ",l:"ₗ",m:"ₘ",n:"ₙ",o:"ₒ",p:"ₚ",r:"ᵣ",s:"ₛ",t:"ₜ",u:"ᵤ",v:"ᵥ",x:"ₓ",
    "0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉","+":"₊","-":"₋","=":"₌","(":"₍",")":"₎" };
  var FLIP = { a:"ɐ",b:"q",c:"ɔ",d:"p",e:"ǝ",f:"ɟ",g:"ƃ",h:"ɥ",i:"ᴉ",j:"ɾ",k:"ʞ",l:"l",m:"ɯ",n:"u",o:"o",p:"d",q:"b",r:"ɹ",s:"s",t:"ʇ",u:"n",v:"ʌ",w:"ʍ",x:"x",y:"ʎ",z:"z",
    A:"∀",B:"ᗺ",C:"Ɔ",D:"ᗡ",E:"Ǝ",F:"Ⅎ",G:"⅁",H:"H",I:"I",J:"ſ",K:"ʞ",L:"˥",M:"W",N:"N",O:"O",P:"Ԁ",Q:"Ό",R:"ᴚ",S:"S",T:"⊥",U:"∩",V:"Λ",W:"M",X:"X",Y:"⅄",Z:"Z",
    "1":"Ɩ","2":"ᄅ","3":"Ɛ","4":"ㄣ","5":"ϛ","6":"9","7":"ㄥ","8":"8","9":"6","0":"0",".":"˙",",":"'","'":",","!":"¡","?":"¿","(":")",")":"(","[":"]","]":"[","{":"}","}":"{","<":">",">":"<","_":"‾","&":"⅋" };
  function map(table){ return function(t){ return Array.from(t).map(function(c){ return table[c] || c; }).join(""); }; }
  // 疊加符號：每個字後面加一個組合用的線。空白不加（不會畫出懸空的線）；中文、日文、韓文也不加，
  // 很多字型疊在中文字上會變成方框
  var SKIP = /[\s\u0300-\u036f\u200b-\u200f\u2060\u20d0-\u20ff\ufe00-\ufe0f\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef\u{1F000}-\u{1FAFF}\u{20000}-\u{3FFFF}]/u;
  // 本身就是組合用的記號、零寬字、emoji、罕用漢字也跳過，才不會把 emoji 拆開或疊成方框
  function mark(cp){ var m = String.fromCharCode(cp); return function(t){ return Array.from(t).map(function(c){ return SKIP.test(c) ? c : c + m; }).join(""); }; }
  // 倒過來寫要以「看起來的一個字」為單位，emoji 組合、國旗、重音字才不會被拆散
  function graphemes(t){
    if(typeof Intl !== "undefined" && Intl.Segmenter) return Array.from(new Intl.Segmenter().segment(t), function(x){ return x.segment; });
    return Array.from(t);
  }
  var EXTRA = [
    { id: "sup", name: "上標小字", fn: map(SUP), note: "少數字母沒有小字" },
    { id: "sub", name: "下標小字", fn: map(SUB), note: "只有部分字母有" },
    { id: "strike", name: "刪除線", fn: mark(0x336) },
    { id: "under", name: "底線", fn: mark(0x332) },
    { id: "dunder", name: "雙底線", fn: mark(0x333) },
    { id: "over", name: "上劃線", fn: mark(0x305) },
    { id: "slash", name: "斜線劃掉", fn: mark(0x338) },
    { id: "wave", name: "波浪底線", fn: mark(0x330) },
    { id: "flip", name: "倒過來", fn: function(t){ return graphemes(map(FLIP)(t)).reverse().join(""); } },
    { id: "mirror", name: "倒著寫", fn: function(t){ return graphemes(t).reverse().join(""); } }
  ];
  root.TRFontsExtra = { EXTRA: EXTRA };
})(typeof window !== "undefined" ? window : globalThis);

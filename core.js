// 翠排版尺共用核心：英文特殊字體、顏文字、空白轉換、置中。
// 網站、側邊欄（app.js）和翠網頁上的工具列（extension/content.js）共用這一份。
(function(root){
  var FILLER = "\u2800";
  var DDI = "\u0D26\u0D4D\u0D26\u0D3F"; // ദ്ദി

  // ═══ 英文特殊字體（Unicode 數學字母等） ═══
  var STYLES = [
    { id: "plain", name: "一般" },
    { id: "bold", name: "粗體", U: 0x1D400, L: 0x1D41A, D: 0x1D7CE },
    { id: "sansbold", name: "黑體", U: 0x1D5D4, L: 0x1D5EE, D: 0x1D7EC },
    { id: "italic", name: "斜體", U: 0x1D608, L: 0x1D622 },
    { id: "bolditalic", name: "粗斜體", U: 0x1D63C, L: 0x1D656 },
    { id: "script", name: "草寫", U: 0x1D4D0, L: 0x1D4EA },
    { id: "scriptlight", name: "細草寫", U: 0x1D49C, L: 0x1D4B6,
      ex: { B: 0x212C, E: 0x2130, F: 0x2131, H: 0x210B, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211B, e: 0x212F, g: 0x210A, o: 0x2134 } },
    { id: "fraktur", name: "哥德", U: 0x1D504, L: 0x1D51E, ex: { C: 0x212D, H: 0x210C, I: 0x2111, R: 0x211C, Z: 0x2128 } },
    { id: "frakturbold", name: "粗哥德", U: 0x1D56C, L: 0x1D586 },
    { id: "double", name: "空心", U: 0x1D538, L: 0x1D552, D: 0x1D7D8,
      ex: { C: 0x2102, H: 0x210D, N: 0x2115, P: 0x2119, Q: 0x211A, R: 0x211D, Z: 0x2124 } },
    { id: "mono", name: "打字機", U: 0x1D670, L: 0x1D68A, D: 0x1D7F6 },
    { id: "wide", name: "全形", U: 0xFF21, L: 0xFF41, D: 0xFF10 },
    { id: "smallcaps", name: "小型大寫", table: "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ" },
    { id: "circled", name: "圓圈", U: 0x24B6, L: 0x24D0 },
    { id: "boxed", name: "方塊", U: 0x1F170 }
  ];
  var MAP = {}, REV = {};
  STYLES.forEach(function(s){
    if(s.id === "plain") return;
    var m = {}, k, d;
    var small = s.table ? Array.from(s.table) : null;
    for(k = 0; k < 26; k++){
      var up = String.fromCharCode(65 + k), lo = String.fromCharCode(97 + k);
      if(small){ m[lo] = small[k]; continue; }
      m[up] = String.fromCodePoint((s.ex && s.ex[up]) || s.U + k);
      m[lo] = String.fromCodePoint((s.ex && s.ex[lo]) || (s.L ? s.L + k : s.U + k));
    }
    if(s.D) for(d = 0; d < 10; d++) m[String(d)] = String.fromCodePoint(s.D + d);
    if(s.id === "circled"){ m["0"] = "⓪"; for(d = 1; d < 10; d++) m[String(d)] = String.fromCodePoint(0x2460 + d - 1); }
    MAP[s.id] = m;
    Object.keys(m).forEach(function(a){ if(m[a] !== a && !(m[a] in REV)) REV[m[a]] = a; });
  });
  function plainify(t){ return Array.from(t).map(function(ch){ return REV[ch] || ch; }).join(""); }
  function stylize(t, id){
    var base = plainify(t);
    if(id === "plain") return base;
    var m = MAP[id];
    return Array.from(base).map(function(ch){ return m[ch] || ch; }).join("");
  }

  // ═══ 顏文字 ═══
  var FACES = [
    ["開心", ["⩌ᴗ⩌", "•ᴗ•", "´▽`", "≧▽≦", "◕‿◕", "˶ᵔ ᵕ ᵔ˶", "・ω・", "´∀`", "ᵔᴥᵔ", "˃ᴗ˂", "⁰▿⁰", "◍•ᴗ•◍"]],
    ["害羞撒嬌", ["⸝⸝ᵕᴗᵕ⸝⸝", "˘ω˘", "｡•̀ᴗ-", "¬‿¬", "ゝω・", "∗ˊᵕˋ∗", "˶˘ ³˘", "･ω<"]],
    ["哭哭", ["╥﹏╥", "´；ω；`", "ó﹏ò｡", "இ﹏இ", "ㅠ﹏ㅠ", "T_T"]],
    ["無言傻眼", ["◔̯◔", "ಠ_ಠ", "´･_･`", "˙꒳˙", "≖_≖", "꒪⌓꒪", "-_-;", "•_•"]],
    ["生氣", ["｀へ´", "｀д´", "≧Д≦", ">_<", "ꐦ ಠ‸ಠ"]],
    ["驚訝", ["°ロ°", "⚆_⚆", "⊙ω⊙", "ﾟДﾟ", "O_O", "⊙_⊙"]]
  ];
  var ALL_FACES = [].concat.apply([], FACES.map(function(g){ return g[1]; }));

  var BODIES = [
    { l: "", o: "(", c: ")", r: "" },
    { l: DDI, o: "(", c: ")", r: "" },
    { l: "٩", o: "(", c: ")", r: "۶" },
    { l: "ヾ", o: "(", c: ")", r: "ﾉ" },
    { l: "", o: "(", c: ")", r: "ﾉ" },
    { l: "", o: "(", c: ")", r: "و✧" },
    { l: "ᕙ", o: "(", c: ")", r: "ᕗ" },
    { l: "ᕦ", o: "(", c: ")", r: "ᕤ" },
    { l: "⊂", o: "(", c: ")", r: "⊃" },
    { l: "", o: "(", c: ")", r: "づ" },
    { l: "୧", o: "(", c: ")", r: "୨" },
    { l: "┐", o: "(", c: ")", r: "┌" },
    { l: "\\", o: "(", c: ")", r: "/" },
    { l: "✧", o: "(", c: ")", r: "✧" },
    { l: "໒", o: "(", c: ")", r: "७" },
    { l: "ʚ", o: "(", c: ")", r: "ɞ" },
    { l: "", o: "(", c: ")", r: "☆ﾐ" },
    { l: "", o: "ʕ", c: "ʔ", r: "" },
    { l: "", o: "༼", c: "༽", r: "つ" }
  ];
  function uniqSorted(key){
    var seen = {}, out = [];
    BODIES.forEach(function(b){ if(b[key] && !seen[b[key]]){ seen[b[key]] = 1; out.push(b[key]); } });
    return out.sort(function(a, b){ return b.length - a.length; });
  }
  var LEFTS = uniqSorted("l"), RIGHTS = uniqSorted("r");
  var KRE = /[(（ʕ༼]([^()（）ʕʔ༼༽\n]{1,16})[)）ʔ༽]/g;

  function faceLike(inner){
    var t = inner.trim();
    if(!t) return false;
    if(/[㄀-ㄯ㐀-鿿豈-﫿]/.test(t)) return false; // 漢字、注音 → 一般括號
    if(/[A-Za-z]{2,}/.test(t)) return false;                              // 英文單字
    if(/^[\d\s\/.\-:,+%#~～]+$/.test(t)) return false;                    // (1/3) 這種編號
    if(/^[、。，！？：；…,.!?:;'"「」]+$/.test(t)) return false;
    return true;
  }
  function parseKao(text){
    var list = [], m;
    KRE.lastIndex = 0;
    while((m = KRE.exec(text))){
      if(!faceLike(m[1])) continue;
      var s = m.index, e = m.index + m[0].length, l = "", r = "", j;
      for(j = 0; j < LEFTS.length; j++) if(text.slice(0, s).endsWith(LEFTS[j])){ l = LEFTS[j]; break; }
      for(j = 0; j < RIGHTS.length; j++) if(text.startsWith(RIGHTS[j], e)){ r = RIGHTS[j]; break; }
      list.push({ start: s - l.length, end: e + r.length, l: l, o: text[s], inner: m[1], c: text[e - 1], r: r });
    }
    return list;
  }
  function kaoString(m){ return m.l + m.o + m.inner + m.c + m.r; }

  // 半形空白 → 全形，一個換一個（長度不變，游標位置不用重算）
  function convertSpaces(t, mode){
    if(mode === "off") return t;
    if(mode === "all") return t.replace(/ /g, "\u3000");
    return t.replace(/ +/g, function(run, at, str){
      var prev = str[at - 1], next = str[at + run.length];
      var lineStart = at === 0 || prev === "\n";
      if(run.length >= 2 || lineStart || prev === "\u3000" || next === "\u3000") return "\u3000".repeat(run.length);
      return run;
    });
  }

  // 空白行換成點字空白，翠就不會把段落間距吃掉
  function fillBlankLines(t){
    return t.split("\n").map(function(l){ return l.trim() === "" ? FILLER : l; }).join("\n");
  }

  // 置中／靠左：把 [selStart, selEnd) 涵蓋到的每一整行重新對齊
  // measure(text) 回傳文字寬度（px），W 是目標版型的文字寬度
  function alignBlock(raw, selStart, selEnd, mode, W, measure){
    var ls = selStart > 0 ? raw.lastIndexOf("\n", selStart - 1) + 1 : 0;
    var endSel = selEnd;
    if(endSel > selStart && raw[endSel - 1] === "\n") endSel--;
    var le = raw.indexOf("\n", endSel);
    if(le < 0) le = raw.length;
    var unit = measure("\u3000"), tooLong = 0, done = 0;
    var before = raw.slice(ls, le);
    var out = before.split("\n").map(function(line){
      var core = line.replace(/^[ \t\u3000\u2800]+/, "").replace(/[ \t]+$/, "");
      if(!core) return line;
      if(mode === "left"){ done++; return core; }
      var w = measure(core);
      if(w > W){ tooLong++; return core; }
      var n = Math.min(Math.round((W - w) / 2 / unit), Math.floor((W - w) / unit));
      done++;
      return "\u3000".repeat(Math.max(0, n)) + core;
    }).join("\n");
    return { start: ls, end: le, before: before, text: out, done: done, tooLong: tooLong, changed: out !== before };
  }

  root.TRCore = {
    FILLER: FILLER, DDI: DDI,
    STYLES: STYLES, plainify: plainify, stylize: stylize,
    FACES: FACES, ALL_FACES: ALL_FACES, BODIES: BODIES, parseKao: parseKao, kaoString: kaoString,
    convertSpaces: convertSpaces, fillBlankLines: fillBlankLines, alignBlock: alignBlock
  };
})(typeof window !== "undefined" ? window : this);

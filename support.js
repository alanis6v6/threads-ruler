// 底部那一排（排版眉角｜意見回饋｜App 上架預告）、贊助頁、意見回饋頁共用的一支。
// 網址設定在 support-config.js；沒填的項目自動不顯示，所以不會出現壞掉的按鈕或空白的頁。
(function(){
  var CFG = window.SUPPORT_CONFIG || {};

  function url(key){
    var v = CFG[key];
    return (typeof v === "string" && /^https:\/\//.test(v.trim())) ? v.trim() : "";
  }

  var SPONSORS = [
    { key: "kofi",         icon: "☕", name: "Ko-fi",             note: "信用卡，國際通用" },
    { key: "buymeacoffee", icon: "🧋", name: "Buy Me a Coffee",   note: "信用卡，國際通用" },
    { key: "ecpay",        icon: "🧾", name: "綠界",               note: "台灣超商代碼、ATM 轉帳" }
  ].filter(function(s){ return url(s.key); });

  // 意見回饋表單：直接送進 Lia 自己的 Google 表單（回覆會自動進她的 Google 試算表）。
  // 這幾個 entry.xxxxx 是那份表單每一題的固定 id，換表單才需要換這裡。
  var GFORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSd_Ui4vzMzKY3KZe3sRTwWWUUw1TxBK2NpzRmB3UfbF82mWVQ/formResponse";
  var GFORM_ENTRY = {
    nick: "entry.561309518",       // 暱稱
    kind: "entry.1780542497",      // 回饋類型
    device: "entry.2066103744",    // 使用裝置（複選）
    bugText: "entry.945527014",    // 回饋內容（Bug回報／建議這條路）
    otherText: "entry.1684751049", // 任何內容都歡迎回饋給我💕（好心人誇誇支持／其他這條路）
    contact: "entry.623276364"     // 聯絡方式（選填）
  };
  // 使用裝置選項要跟表單裡的選項字串完全一樣（含全形／半形括號這種細節），
  // 送出去的字串對不上表單裡的選項，Google 表單會當成「其他」記錄。
  var GFORM_DEVICES = ["網頁版", "手機網頁版", "手機PWA（iOS)", "手機PWA(android)", "Google擴充"];

  function ev(name, params){ if(window.gtag) window.gtag("event", name, params || {}); }
  function tr(s){ return window.TRI18N ? window.TRI18N.t(s) : s; }
  var THREADS = "https://www.threads.com/@space.grapefruit_";

  function el(tag, cls, text){
    var n = document.createElement(tag);
    if(cls) n.className = cls;
    if(text != null) n.textContent = text;
    return n;
  }

  // 還沒設定好時顯示的那一句，中間夾一個連到翠的連結，不要變成死路
  function empty(before, linkText, after){
    var p = el("p", "empty", before);
    var a = el("a", null, linkText);
    a.href = THREADS;
    a.target = "_blank";
    a.rel = "noopener";
    p.append(a, document.createTextNode(after));
    return p;
  }

  // ═══ 一、工具頁底部那一排 ═══
  // 三顆一律都在（還沒設定好的，點進去那一頁會說「還在準備中」並連到翠）
  var bar = document.getElementById("barRow");
  if(bar){
    var fbLink = document.getElementById("barFeedback");
    if(fbLink) fbLink.addEventListener("click", function(){ ev("bar_click", { to: "feedback" }); });

    var toggle = document.getElementById("guideToggle");
    var guide = document.getElementById("guideBox");
    if(toggle && guide){
      toggle.addEventListener("click", function(){
        // 手機版：說明已經被搬進上面「？」的面板，這顆改成把那個面板打開
        var panel = document.getElementById("mPanelHelp");
        var phoneHelp = document.getElementById("mHelpBtn");
        if(panel && phoneHelp && panel.contains(guide)){
          ev("guide_open", { via: "phone" });
          phoneHelp.click();
          return;
        }
        var open = guide.hidden;
        guide.hidden = !open;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if(open){
          ev("guide_open");
          guide.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          bar.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  }

  // ═══ 二、贊助頁 ═══
  var spMount = document.getElementById("sponsorMount");
  if(spMount){
    if(!SPONSORS.length){
      spMount.append(empty("贊助管道還在準備中，之後會放在這裡。想跟我說話的話，可以直接", "到翠找我", " ♡"));
    } else {
      var list = el("div", "sp-list");
      SPONSORS.forEach(function(s){
        var a = el("a", "sp-card");
        a.href = url(s.key);
        a.target = "_blank";
        a.rel = "noopener";
        a.append(el("span", "sp-ico", s.icon));
        var body = el("span", "sp-body");
        body.append(el("span", "sp-name", s.name));
        body.append(el("span", "sp-note", s.note));
        a.append(body);
        a.append(el("span", "sp-go", "→"));
        a.addEventListener("click", function(){ ev("support_click", { method: s.key }); });
        list.append(a);
      });
      spMount.append(list);
    }
  }

  // ═══ 三、意見回饋頁 ═══
  var fbMount = document.getElementById("feedbackMount");
  if(fbMount){
    // 表單自己的開場白，跟 Lia 在 Google 表單裡寫的那段一樣
    var intro = el("p", "fb-intro");
    intro.append(document.createTextNode("嗨，我是 Lia！謝謝你打開這份表單 ˙˚ᵎᵎ丶 翠排版尺是我邊用邊修做出來的，所以你遇到的每一個卡卡的地方、想要但還沒有的功能，或是單純想說「欸這個好用」，我都很想知道！！不用寫得很完整，一句話也可以，我每一則都會看。想要我回覆的話再留聯絡方式就好，不留也完全沒關係～"));
    if(url("buymeacoffee")){
      var coffeeP = el("p", "fb-intro");
      coffeeP.append(document.createTextNode("也歡迎"));
      var coffeeA = el("a", null, "買一杯咖啡給我");
      coffeeA.href = url("buymeacoffee");
      coffeeA.target = "_blank";
      coffeeA.rel = "noopener";
      coffeeA.addEventListener("click", function(){ ev("support_click", { method: "buymeacoffee", from: "feedback" }); });
      coffeeP.append(coffeeA, document.createTextNode("(ﾉ´ｪ`)ﾉ"));
    }

    var form = el("form", "fb-form");
    form.setAttribute("novalidate", "novalidate");

    // ── 暱稱（選填）──
    var nick = el("input", "fb-contact");
    nick.type = "text";
    nick.maxLength = 60;
    nick.placeholder = "暱稱（選填）";
    nick.setAttribute("aria-label", "暱稱");
    nick.autocomplete = "off";
    form.append(nick);

    // ── 回饋類型（必填，選了才會往下展開對應的欄位）──
    var KINDS = ["Bug回報", "建議", "好心人誇誇支持", "其他"];
    var BUG_PATH = { "Bug回報": 1, "建議": 1 }; // 這兩種走「使用裝置＋回饋內容」
    var kindWrap = el("div", "fb-kinds");
    kindWrap.setAttribute("role", "radiogroup");
    kindWrap.setAttribute("aria-label", "回饋類型");
    var kind = "";
    KINDS.forEach(function(k){
      var b = el("button", "fb-kind", k);
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", "false");
      b.addEventListener("click", function(){
        kind = k;
        kindWrap.querySelectorAll(".fb-kind").forEach(function(o){
          o.classList.toggle("on", o === b);
          o.setAttribute("aria-checked", o === b ? "true" : "false");
        });
        bugSection.hidden = !BUG_PATH[k];
        otherSection.hidden = !!BUG_PATH[k];
        rest.hidden = false;
      });
      kindWrap.append(b);
    });
    form.append(kindWrap);

    // ── 分支一：Bug回報／建議 → 使用裝置（複選）＋回饋內容 ──
    var bugSection = el("div", "fb-branch");
    bugSection.hidden = true;
    var deviceWrap = el("div", "fb-kinds");
    deviceWrap.setAttribute("role", "group");
    deviceWrap.setAttribute("aria-label", "使用裝置");
    var devices = {};
    GFORM_DEVICES.forEach(function(d){
      var b = el("button", "fb-kind", d);
      b.type = "button";
      b.setAttribute("role", "checkbox");
      b.setAttribute("aria-checked", "false");
      b.addEventListener("click", function(){
        devices[d] = !devices[d];
        b.classList.toggle("on", devices[d]);
        b.setAttribute("aria-checked", devices[d] ? "true" : "false");
      });
      deviceWrap.append(b);
    });
    bugSection.append(deviceWrap);
    var bugText = el("textarea", "fb-text");
    bugText.rows = 5;
    bugText.maxLength = 2000;
    bugText.placeholder = "回饋內容…";
    bugText.setAttribute("aria-label", "回饋內容");
    bugSection.append(bugText);
    form.append(bugSection);

    // ── 分支二：好心人誇誇支持／其他 → 單一欄位 ──
    var otherSection = el("div", "fb-branch");
    otherSection.hidden = true;
    var otherText = el("textarea", "fb-text");
    otherText.rows = 5;
    otherText.maxLength = 2000;
    otherText.placeholder = "任何內容都歡迎回饋給我💕";
    otherText.setAttribute("aria-label", "任何內容都歡迎回饋給我");
    otherSection.append(otherText);
    form.append(otherSection);

    // ── 兩條分支後面共用：聯絡方式 + 送出 ──
    var rest = el("div", "fb-branch");
    rest.hidden = true;
    var contact = el("input", "fb-contact");
    contact.type = "email";
    contact.maxLength = 120;
    contact.placeholder = "聯絡方式（選填），方便回覆的話留 email";
    contact.setAttribute("aria-label", "聯絡方式（選填）");
    contact.autocomplete = "off";
    rest.append(contact);

    // 擋機器人：正常的人看不到這格，填了就當成廣告直接丟掉
    var trap = el("input", "fb-trap");
    trap.type = "text";
    trap.tabIndex = -1;
    trap.autocomplete = "off";
    trap.setAttribute("aria-hidden", "true");
    rest.append(trap);

    var actions = el("div", "fb-actions");
    var send = el("button", "fb-send", "送出");
    send.type = "submit";
    actions.append(send);
    var status = el("span", "fb-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    actions.append(status);
    rest.append(actions);
    form.append(rest);

    fbMount.append(intro);
    if(coffeeP) fbMount.append(coffeeP);
    fbMount.append(form);

    var sending = false;
    function say(msg, bad){
      status.textContent = tr(msg);
      status.classList.toggle("bad", !!bad);
    }

    // 用隱藏 iframe 送進 Google 表單：表單網域不放行 CORS，fetch 讀不到回應狀態，
    // 這招（表單 target 指到隱藏 iframe）是繞過這件事的標準做法。
    var hiddenFrame = el("iframe", null, null);
    hiddenFrame.name = "fb-google-frame";
    hiddenFrame.style.display = "none";
    document.body.append(hiddenFrame);

    form.addEventListener("submit", function(e){
      e.preventDefault();
      if(sending) return;
      if(!kind){ say("先選一個回饋類型 ˊ_>ˋ", true); return; }

      var isBug = !!BUG_PATH[kind];
      var body = (isBug ? bugText : otherText).value.trim();
      if(body.length < 4){ say("再多寫一點點，我才知道怎麼幫你 ˊ_>ˋ", true); (isBug ? bugText : otherText).focus(); return; }
      var chosenDevices = GFORM_DEVICES.filter(function(d){ return devices[d]; });
      if(isBug && !chosenDevices.length){ say("選一下你在哪個裝置上遇到的 ˊ_>ˋ", true); return; }
      if(trap.value){ say("謝謝你，我收到了！"); form.reset(); return; } // 機器人：安靜丟掉
      var last = 0;
      try{ last = +localStorage.getItem("threads-ruler-fb") || 0; }catch(err){}
      if(Date.now() - last < 30000){ say("剛剛才送出過，等一下下再試 ˊ_>ˋ", true); return; }

      sending = true;
      send.disabled = true;
      say("送出中…");

      // 動態組一個真的 <form>，POST 進 Google 表單的送出網址，target 指到隱藏 iframe
      var gform = document.createElement("form");
      gform.action = GFORM_ACTION;
      gform.method = "POST";
      gform.target = "fb-google-frame";
      gform.style.display = "none";

      function addField(name, value){
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        gform.append(input);
      }
      addField(GFORM_ENTRY.nick, nick.value.trim());
      addField(GFORM_ENTRY.kind, kind);
      if(isBug){
        chosenDevices.forEach(function(d){ addField(GFORM_ENTRY.device, d); });
        addField(GFORM_ENTRY.bugText, body);
      } else {
        addField(GFORM_ENTRY.otherText, body);
      }
      addField(GFORM_ENTRY.contact, contact.value.trim());

      document.body.append(gform);

      // iframe 的 load 事件在送出後一定會觸發一次（不管 Google 那邊真正回什麼），
      // 用它當「應該是送到了」的訊號──跟原本 Apps Script 版一樣沒辦法讀到精確的成功/失敗。
      var settled = false;
      function finish(){
        if(settled) return;
        settled = true;
        try{ localStorage.setItem("threads-ruler-fb", Date.now()); }catch(err){}
        ev("feedback_submit", { kind: kind });
        var done = el("div", "fb-done");
        done.append(el("p", "fb-done-title", "收到了，謝謝你 ♡"));
        done.append(el("p", null, "我會一則一則看。留了聯絡方式的話，需要的時候我會回你。"));
        var back = el("a", "fb-back", "← 回排版尺");
        back.href = "../";
        done.append(back);
        fbMount.replaceChildren(done);
        gform.remove();
      }
      hiddenFrame.addEventListener("load", finish, { once: true });
      setTimeout(finish, 4000); // 保險：萬一 iframe 的 load 事件沒觸發，還是要讓使用者看到「完成了」
      gform.submit();
    });
  }
})();

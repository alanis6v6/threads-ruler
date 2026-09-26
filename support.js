// 贊助入口與意見回饋（只在網站載入，擴充功能不打包這支檔案）
// 網址設定在 support-config.js；沒填的項目自動不顯示，所以不會出現壞掉的按鈕。
(function(){
  var box = document.getElementById("support");
  if(!box) return;

  var CFG = window.SUPPORT_CONFIG || {};
  var SPONSORS = [
    { key: "kofi",         icon: "☕", name: "Ko-fi" },
    { key: "buymeacoffee", icon: "🧋", name: "Buy Me a Coffee" },
    { key: "ecpay",        icon: "🧾", name: "綠界（台灣超商、轉帳）" }
  ].filter(function(s){ return typeof CFG[s.key] === "string" && /^https:\/\//.test(CFG[s.key].trim()); });

  var FEEDBACK = typeof CFG.feedbackUrl === "string" && /^https:\/\//.test(CFG.feedbackUrl.trim())
    ? CFG.feedbackUrl.trim() : "";

  // 兩個都沒設定就整塊不出現
  if(!SPONSORS.length && !FEEDBACK) return;

  function ev(name, params){ if(window.gtag) window.gtag("event", name, params || {}); }
  // i18n 的 SKIP 清單含 textarea（避免翻到使用者打的字），它的 placeholder／aria-label 要自己翻
  function tr(s){ return window.TRI18N ? window.TRI18N.t(s) : s; }
  function el(tag, cls, text){
    var n = document.createElement(tag);
    if(cls) n.className = cls;
    if(text != null) n.textContent = text;
    return n;
  }

  // ═══ 贊助 ═══
  if(SPONSORS.length){
    var sp = el("div", "sp-part");
    sp.append(el("h2", "sp-title", "這個工具是免費的"));
    sp.append(el("p", "sp-note", "如果它幫你省下一點排版的時間，可以請我喝杯飲料 ♡ 不贊助也完全沒關係，功能不會有任何差別。"));
    var row = el("div", "sp-row");
    SPONSORS.forEach(function(s){
      var a = el("a", "sp-btn");
      a.href = CFG[s.key].trim();
      a.target = "_blank";
      a.rel = "noopener";
      a.append(el("span", "sp-ico", s.icon));
      a.append(el("span", null, s.name));
      a.addEventListener("click", function(){ ev("support_click", { method: s.key }); });
      row.append(a);
    });
    sp.append(row);
    box.append(sp);
  }

  // ═══ 意見回饋 ═══
  if(FEEDBACK){
    var fb = el("div", "sp-part");
    fb.append(el("h2", "sp-title", "用起來卡卡的嗎？"));
    fb.append(el("p", "sp-note", "想要什麼功能、哪裡怪怪的、或是排版排到一半卡住，都可以跟我說。不用留名字。"));

    var openBtn = el("button", "sp-open", "✉️ 告訴我");
    openBtn.type = "button";
    openBtn.setAttribute("aria-expanded", "false");
    fb.append(openBtn);

    var form = el("form", "sp-form");
    form.hidden = true;
    form.setAttribute("novalidate", "novalidate");

    var KINDS = ["想要新功能", "回報問題", "只是想說聲謝謝", "其他"];
    var kindWrap = el("div", "sp-kinds");
    kindWrap.setAttribute("role", "radiogroup");
    kindWrap.setAttribute("aria-label", "回饋類型");
    var kind = KINDS[0];
    KINDS.forEach(function(k, i){
      var b = el("button", "sp-kind" + (i === 0 ? " on" : ""), k);
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", i === 0 ? "true" : "false");
      b.addEventListener("click", function(){
        kind = k;
        kindWrap.querySelectorAll(".sp-kind").forEach(function(o){
          o.classList.toggle("on", o === b);
          o.setAttribute("aria-checked", o === b ? "true" : "false");
        });
      });
      kindWrap.append(b);
    });
    form.append(kindWrap);

    var ta = el("textarea", "sp-text");
    ta.rows = 4;
    ta.maxLength = 2000;
    ta.placeholder = tr("想說的話…");
    ta.setAttribute("aria-label", tr("想說的話"));
    form.append(ta);

    var contact = el("input", "sp-contact");
    contact.type = "text";
    contact.maxLength = 120;
    contact.placeholder = "想收到回覆的話，留個翠帳號或 email（選填）";
    contact.setAttribute("aria-label", "聯絡方式（選填）");
    contact.autocomplete = "off";
    form.append(contact);

    // 擋機器人：正常的人看不到這格，填了就當成廣告直接丟掉
    var trap = el("input", "sp-trap");
    trap.type = "text";
    trap.tabIndex = -1;
    trap.autocomplete = "off";
    trap.setAttribute("aria-hidden", "true");
    form.append(trap);

    var actions = el("div", "sp-actions");
    var send = el("button", "sp-send", "送出");
    send.type = "submit";
    actions.append(send);
    var status = el("span", "sp-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    actions.append(status);
    form.append(actions);

    form.append(el("p", "sp-priv", "送出的內容會存進作者自己的 Google 試算表，只有作者看得到。你在排版尺裡打的草稿不會一起送出。"));

    fb.append(form);
    box.append(fb);

    openBtn.addEventListener("click", function(){
      var show = form.hidden;
      form.hidden = !show;
      openBtn.setAttribute("aria-expanded", show ? "true" : "false");
      if(show){ ta.focus(); ev("feedback_open"); }
    });

    var sending = false;
    function say(msg, bad){
      status.textContent = tr(msg);
      status.classList.toggle("bad", !!bad);
    }

    form.addEventListener("submit", function(e){
      e.preventDefault();
      if(sending) return;
      var body = ta.value.trim();
      if(body.length < 4){ say("再多寫一點點，我才知道怎麼幫你 ˊ_>ˋ", true); ta.focus(); return; }
      if(trap.value){ say("謝謝你，我收到了！"); form.reset(); return; } // 機器人：安靜丟掉
      var last = 0;
      try{ last = +localStorage.getItem("threads-ruler-fb") || 0; }catch(err){}
      if(Date.now() - last < 30000){ say("剛剛才送出過，等一下下再試 ˊ_>ˋ", true); return; }

      sending = true;
      send.disabled = true;
      say("送出中…");
      var payload = JSON.stringify({
        kind: kind,
        body: body,
        contact: contact.value.trim(),
        page: location.pathname,
        lang: (window.TRI18N && window.TRI18N.lang) || "zh",
        ua: navigator.userAgent.slice(0, 300),
        width: window.innerWidth
      });

      // Apps Script 用 text/plain 送，瀏覽器就不會先送 preflight（Apps Script 不接 OPTIONS）
      fetch(FEEDBACK, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: payload
      }).then(function(r){
        if(!r.ok) throw new Error("http " + r.status);
        return r.text();
      }).then(function(){
        try{ localStorage.setItem("threads-ruler-fb", Date.now()); }catch(err){}
        ev("feedback_submit", { kind: kind });
        form.reset();
        form.hidden = true;
        openBtn.setAttribute("aria-expanded", "false");
        openBtn.textContent = tr("✉️ 收到了，謝謝你！");
        openBtn.disabled = true;
      }).catch(function(){
        say("送不出去，可能是網路的關係，等一下再試一次 ˊ_>ˋ", true);
      }).then(function(){
        sending = false;
        send.disabled = false;
      });
    });
  }

  if(window.TRI18N) window.TRI18N.apply(box);
})();

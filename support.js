// 底部那一排（排版眉角｜意見回饋｜贊助莉亞）、贊助頁、意見回饋頁共用的一支。
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

  var FEEDBACK = url("feedbackUrl");

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
  var bar = document.getElementById("barRow");
  if(bar){
    var fbLink = document.getElementById("barFeedback");
    var spLink = document.getElementById("barSupport");
    if(fbLink && !FEEDBACK) fbLink.remove();
    if(spLink && !SPONSORS.length) spLink.remove();
    if(fbLink && FEEDBACK) fbLink.addEventListener("click", function(){ ev("bar_click", { to: "feedback" }); });
    if(spLink && SPONSORS.length) spLink.addEventListener("click", function(){ ev("bar_click", { to: "support" }); });

    var toggle = document.getElementById("guideToggle");
    var guide = document.getElementById("guideBox");
    if(toggle && guide){
      toggle.addEventListener("click", function(){
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
    if(!FEEDBACK){
      fbMount.append(empty("回饋表單還在準備中。現在想跟我說什麼的話，可以直接", "到翠留言給我", " ♡"));
      return;
    }

    var form = el("form", "fb-form");
    form.setAttribute("novalidate", "novalidate");

    var KINDS = ["想要新功能", "回報問題", "只是想說聲謝謝", "其他"];
    var kindWrap = el("div", "fb-kinds");
    kindWrap.setAttribute("role", "radiogroup");
    kindWrap.setAttribute("aria-label", "回饋類型");
    var kind = KINDS[0];
    KINDS.forEach(function(k, i){
      var b = el("button", "fb-kind" + (i === 0 ? " on" : ""), k);
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", i === 0 ? "true" : "false");
      b.addEventListener("click", function(){
        kind = k;
        kindWrap.querySelectorAll(".fb-kind").forEach(function(o){
          o.classList.toggle("on", o === b);
          o.setAttribute("aria-checked", o === b ? "true" : "false");
        });
      });
      kindWrap.append(b);
    });
    form.append(kindWrap);

    var ta = el("textarea", "fb-text");
    ta.rows = 6;
    ta.maxLength = 2000;
    ta.placeholder = tr("想說的話…");
    ta.setAttribute("aria-label", tr("想說的話"));
    form.append(ta);

    var contact = el("input", "fb-contact");
    contact.type = "text";
    contact.maxLength = 120;
    contact.placeholder = "想收到回覆的話，留個翠帳號或 email（選填）";
    contact.setAttribute("aria-label", "聯絡方式（選填）");
    contact.autocomplete = "off";
    form.append(contact);

    // 擋機器人：正常的人看不到這格，填了就當成廣告直接丟掉
    var trap = el("input", "fb-trap");
    trap.type = "text";
    trap.tabIndex = -1;
    trap.autocomplete = "off";
    trap.setAttribute("aria-hidden", "true");
    form.append(trap);

    var actions = el("div", "fb-actions");
    var send = el("button", "fb-send", "送出");
    send.type = "submit";
    actions.append(send);
    var status = el("span", "fb-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    actions.append(status);
    form.append(actions);

    fbMount.append(form);

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
        var done = el("div", "fb-done");
        done.append(el("p", "fb-done-title", "收到了，謝謝你 ♡"));
        done.append(el("p", null, "我會一則一則看。留了聯絡方式的話，需要的時候我會回你。"));
        var back = el("a", "fb-back", "← 回排版尺");
        back.href = "../";
        done.append(back);
        form.replaceWith(done);
      }).catch(function(){
        say("送不出去，可能是網路的關係，等一下再試一次 ˊ_>ˋ", true);
      }).then(function(){
        sending = false;
        send.disabled = false;
      });
    });
  }
})();

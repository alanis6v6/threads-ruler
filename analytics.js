// Google Analytics 與 AdSense（只在網站載入；擴充功能不打包這支檔案，也不會呼叫）
// 回傳的網址只留路徑：?text=… 帶進來的文字不會送出
(function(){
  var ID = "G-1155N6ETH9";
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", ID, {
    page_location: location.origin + location.pathname,
    page_referrer: document.referrer ? document.referrer.split(/[?#]/)[0] : ""
  });
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
  document.head.appendChild(s);
})();

// Google AdSense（只在網站載入；擴充功能不打包這支檔案，所以擴充版沒有廣告，跟隱私權政策寫的一樣）
// 用手動廣告單元，不開自動廣告：廣告只出現在頁面上的 .ad-slot（排版尺各頁「說明」上方），不會插進工具中間。
// 總站首頁不載入這支，所以首頁沒有廣告。
(function(){
  if(location.protocol !== "https:" || ["spacegrapefruit.com", "www.spacegrapefruit.com"].indexOf(location.hostname) < 0) return;   // 本機測試、擴充都不載
  var CLIENT = "ca-pub-9004468743492022";
  var s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + CLIENT;
  document.head.appendChild(s);

  function fill(){
    document.querySelectorAll(".ad-slot[data-ad-slot]").forEach(function(box){
      if(box.querySelector("ins")) return;
      var ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.setAttribute("data-ad-client", CLIENT);
      ins.setAttribute("data-ad-slot", box.getAttribute("data-ad-slot"));
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");
      box.appendChild(ins);
      box.hidden = false;
      try{ (window.adsbygoogle = window.adsbygoogle || []).push({}); }catch(e){}
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill); else fill();
})();

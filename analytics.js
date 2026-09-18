// Google Analytics（只在網站載入；擴充功能不打包這支檔案，也不會呼叫）
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

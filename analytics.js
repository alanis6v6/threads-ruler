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

// Google AdSense 自動廣告（只在網站載入；擴充功能不打包這支檔案，所以擴充版沒有廣告，跟隱私權政策寫的一樣）
(function(){
  if(location.protocol !== "https:" || ["spacegrapefruit.com", "www.spacegrapefruit.com"].indexOf(location.hostname) < 0) return;   // 本機測試、擴充都不載
  var s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9004468743492022";
  document.head.appendChild(s);
})();

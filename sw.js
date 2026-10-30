// 翠排版尺離線快取：先給快取的版本（打開很快、沒網路也能用），同時在背景抓新版，下次打開就是新的
var CACHE = "threads-ruler-v18";   // v18：加載過場改成總站的潮點聚環（intro.js 換新）；v17：從舊網址跳過來（網址帶 ?from=gh）先看到加載過場 intro.js；v16：舊網址 alanis6v6.github.io 打開自動轉到 spacegrapefruit.com、網站網址換新
var ASSETS = ["./", "index.html", "kaomoji/", "fonts/", "dividers/", "emoji/", "symbols/",
  "intro.js", "i18n.js", "core.js", "kaomoji.js", "dividers.js", "analytics.js", "support-config.js", "support.js", "page.css",
  "v2/shell.css", "v2/shell.js", "v2/edit.css", "v2/edit.js", "v2/kaomoji.css", "v2/kaomoji.js", "v2/pick.css", "v2/pick.js",
  "v2/cards.css", "v2/cards.js", "v2/fonts.css", "v2/fonts.js", "v2/fonts-extra.js",
  "feedback/", "support/", "site.webmanifest", "privacy.html",
  "pwa/icon-192.png", "pwa/icon-512.png", "pwa/apple-touch-icon.png", "extension/icons/icon48.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // 帶文字進來的網址（?text=…）都對應同一個頁面
  var key = new URL(req.url); key.search = "";
  e.respondWith(caches.open(CACHE).then(function(cache){
    return cache.match(key.href).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.ok) cache.put(key.href, res.clone());
        return res;
      }).catch(function(){ return hit; });
      return hit || net;
    });
  }));
});

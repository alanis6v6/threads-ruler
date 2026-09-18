// 翠排版尺離線快取：先給快取的版本（打開很快、沒網路也能用），同時在背景抓新版，下次打開就是新的
var CACHE = "threads-ruler-v3";
var ASSETS = ["./", "index.html", "core.js", "app.js", "analytics.js", "site.webmanifest", "privacy.html",
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

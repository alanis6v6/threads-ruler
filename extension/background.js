// 點工具列上的圖示就打開側邊欄
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(function(err){ console.error(err); });

// 翠網頁上的「用翠排版尺排版」按鈕：打開側邊欄，並把發文框的字交給側邊欄
chrome.runtime.onMessage.addListener(function(msg, sender){
  if(!msg || msg.type !== "threads-ruler-open" || !sender.tab) return;
  // sidePanel.open 必須緊接在使用者點擊之後呼叫，所以放在最前面
  chrome.sidePanel.open({ tabId: sender.tab.id }).catch(function(){
    chrome.sidePanel.open({ windowId: sender.tab.windowId }).catch(function(err){ console.error(err); });
  });
  if(msg.posts && msg.posts.length){
    chrome.storage.session.set({ threadsRulerImport: { posts: msg.posts, at: Date.now() } });
  }
});

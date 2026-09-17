// 點工具列上的圖示就打開側邊欄
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(function(err){ console.error(err); });

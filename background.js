// Background service worker for Volume Booster Pro

chrome.runtime.onInstalled.addListener(() => {
  console.log('Volume Booster Pro installed');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TAB_INFO') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ tab: tabs[0] });
      }
    });
    return true;
  }
});

// 扩展状态管理
let isEnabled = false;

// 初始化：从 storage 读取状态
chrome.storage.local.get(['enabled'], (result) => {
  isEnabled = result.enabled || false;
  updateIcon();
  if (isEnabled) {
    muteAllTabsExceptActive();
  }
});

// Service Worker 被唤醒时确保状态正确
self.addEventListener('activate', () => {
  chrome.storage.local.get(['enabled'], (result) => {
    isEnabled = result.enabled || false;
    updateIcon();
  });
});

// 监听标签页激活事件
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (isEnabled) {
    muteAllTabsExceptActive(activeInfo.tabId, activeInfo.windowId);
  }
});

// 监听标签页更新事件（如新标签页加载完成）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (isEnabled && changeInfo.status === 'complete') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        muteAllTabsExceptActive(tabs[0].id, tabs[0].windowId);
      }
    });
  }
});

// 核心功能：静音除活动标签页外的所有标签页
function muteAllTabsExceptActive(activeTabId = null, windowId = null) {
  if (activeTabId === null) {
    // 如果没有指定活动标签页，查询当前窗口的活动标签页
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      if (activeTabs[0]) {
        performMute(activeTabs[0].id);
      }
    });
  } else {
    performMute(activeTabId);
  }
}

function performMute(activeTabId) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        const shouldMute = tab.id !== activeTabId;
        chrome.tabs.update(tab.id, { muted: shouldMute }).catch(() => {
          // 忽略已关闭标签页的错误
        });
      }
    });
  });
}

// 切换扩展状态
function toggleState() {
  isEnabled = !isEnabled;
  chrome.storage.local.set({ enabled: isEnabled }).catch(() => {
    // 存储失败时回滚状态
    isEnabled = !isEnabled;
  });

  if (isEnabled) {
    // 启用：立即执行静音
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        muteAllTabsExceptActive(tabs[0].id, tabs[0].windowId);
      }
    });
  } else {
    // 禁用：取消所有标签页的静音
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.update(tab.id, { muted: false }).catch(() => {
            // 忽略错误
          });
        }
      });
    });
  }

  updateIcon();
  return isEnabled;
}

// 更新图标
function updateIcon() {
  const iconSuffix = isEnabled ? 'on' : 'off';
  chrome.action.setIcon({
    path: {
      '16': `icons/icon-${iconSuffix}-16.png`,
      '48': `icons/icon-${iconSuffix}-48.png`,
      '128': `icons/icon-${iconSuffix}-128.png`
    }
  }).catch(() => {
    // 忽略图标更新失败
  });
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle') {
    const newState = toggleState();
    sendResponse({ enabled: newState });
  } else if (request.action === 'getState') {
    sendResponse({ enabled: isEnabled });
  }
  return true;
});

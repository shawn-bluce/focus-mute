// 获取 DOM 元素
const toggleButton = document.getElementById('toggleButton');
const statusBlock = document.querySelector('.status-block');
const statusIcon = document.getElementById('statusIcon');
const statusValue = document.getElementById('statusValue');
const buttonText = document.getElementById('buttonText');

// 初始化：获取当前状态
function init() {
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (response && typeof response.enabled !== 'undefined') {
      updateUI(response.enabled);
    } else {
      // 如果无法获取状态，默认为禁用
      updateUI(false);
    }
  });
}

// 更新 UI 状态
function updateUI(enabled) {
  if (enabled) {
    statusBlock.classList.add('enabled');
    statusIcon.textContent = '[ON]';
    statusValue.textContent = 'enabled';
    buttonText.textContent = 'DISABLE';
    toggleButton.classList.add('enabled');
  } else {
    statusBlock.classList.remove('enabled');
    statusIcon.textContent = '[OFF]';
    statusValue.textContent = 'disabled';
    buttonText.textContent = 'ENABLE';
    toggleButton.classList.remove('enabled');
  }
}

// 切换状态
function toggleState() {
  // 禁用按钮防止重复点击
  toggleButton.disabled = true;

  chrome.runtime.sendMessage({ action: 'toggle' }, (response) => {
    // 重新启用按钮
    toggleButton.disabled = false;

    if (response && typeof response.enabled !== 'undefined') {
      updateUI(response.enabled);
    }
  });
}

// 绑定事件
toggleButton.addEventListener('click', toggleState);

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);

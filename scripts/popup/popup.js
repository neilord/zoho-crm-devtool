function setTabsPossitions() {
  const tabs = document.querySelectorAll('.tab');
  const iconWidth = document.querySelector('.tab-icon').offsetWidth;
  const containerWidth = document.querySelector('#extension-container').offsetWidth;
  let left = 0;
  for (const tab of tabs) {
    tab.style.setProperty('left', left + 'px');
    if (tab.className.includes('active')) {
      left += containerWidth - (tabs.length - 1) * iconWidth;
    } else {
      left += iconWidth;
    }
  };
}

function setSavedSettings() {
  chrome.storage.local.get(null, (settings) => {
    for (const [key, value] of Object.entries(settings)) {
      const setting = document.querySelector('[data-key="' + key + '"]');
      if (key.endsWith('-switch')) {
        setting.children[0].classList[value ? 'add' : 'remove']('toggle-on');
      } else {
        setting.value = value;
      }
    }
  });
}

async function setDefaultSettings() {
  await new Promise((resolve) => chrome.storage.local.clear(resolve));

  // Reset popup.html
  let response = await fetch(chrome.runtime.getURL('scripts/popup/popup.html'));
  let data = await response.text();
  const original = new DOMParser().parseFromString(data, 'text/html');
  document.body.innerHTML = original.body.innerHTML;

  setupPopup();
  startBackgroundTasks();
}

function saveSettings() {
  const settings = document.querySelectorAll('*[data-key]');
  for (const setting of settings) {
    const trigger = setting.id.endsWith('-switch') ? 'click' : 'change';
    const determineValue = (setting, trigger) =>
      trigger === 'click' ? !!setting.querySelector('.toggle-on') : setting.value;

    updateStorageVariable(setting.dataset.key, determineValue(setting, trigger), false);
    setting.addEventListener(trigger, () => {
      updateStorageVariable(setting.dataset.key, determineValue(document.getElementById(setting.id), trigger));
    });
  };
}

async function updateStorageVariable(key, value, overwrite = true) {
  if (!overwrite) {
    const result = await chrome.storage.local.get(key);
    value = result[key] !== undefined ? result[key] : value;
  }
  chrome.storage.local.set({ [key]: value });
}

function setupPopup() {
  setTabsPossitions();
  setSavedSettings();
  saveSettings();
  applyStyleSettings('popup');
}

function startBackgroundTasks() {
  // Tabs selector
  const tabs = document.querySelectorAll('.tab');
  for (const selectedTab of tabs) {
    selectedTab.addEventListener('click', () => {
      document.querySelector('.tab.active').classList.remove('active');
      selectedTab.classList.add('active');
      setTabsPossitions();
    });
  };

  // Switch toggler
  const settingSwitches = document.querySelectorAll('.toggle-switch');
  for (const settingSwitch of settingSwitches) {
    settingSwitch.addEventListener('click', () => {
      settingSwitch.classList.toggle('toggle-on');
    });
  };

  // Reset Settings Button
  const resetSettingsButton = document.querySelector('#reset-settings-button');
  const textUnconfirmed = resetSettingsButton.textContent;
  const textConfirmed = 'Really?'
  let confirmed = false;
  let resetTimeout;

  resetSettingsButton.addEventListener('click', () => {
    if (confirmed) {
      setDefaultSettings();
      confirmed = false;
      resetSettingsButton.textContent = textUnconfirmed;
      clearTimeout(resetTimeout);
    } else {
      confirmed = true;
      resetSettingsButton.textContent = textConfirmed;
      resetTimeout = setTimeout(() => {
        confirmed = false;
        resetSettingsButton.textContent = textUnconfirmed;
      }, 5000);
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  setupPopup();
  startBackgroundTasks();
});

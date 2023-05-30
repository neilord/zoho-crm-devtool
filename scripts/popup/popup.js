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

document.addEventListener('DOMContentLoaded', function () {
  setTabsPossitions();
  setSavedSettings();
  saveSettings();
  applyStyleSettings('popup');

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
});













chrome.storage.onChanged.addListener((changes, namespace) => {
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});

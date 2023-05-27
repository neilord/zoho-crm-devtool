async function loadCSSVariables() {
  const file = document.createElement("link");
  file.setAttribute("rel", "stylesheet");
  file.setAttribute("type", "text/css");
  file.setAttribute("href", chrome.runtime.getURL('scripts/variables.css'));
  document.head.appendChild(file);
}

async function setTabsPossitions() {
  const tabs = document.querySelectorAll('.tab');
  const iconWidth = document.querySelector('.tab-icon').offsetWidth;
  const containerWidth = document.querySelector('#extension-container').offsetWidth;
  let left = 0;
  tabs.forEach(function (tab) {
    tab.style.setProperty('left', left + 'px');
    if (tab.className.includes('active')) {
      left += containerWidth - (tabs.length - 1) * iconWidth;
    } else {
      left += iconWidth;
    }
  });
}

async function toggleAnimations(enabled) {
  const elements = Array.from(document.body.getElementsByTagName('*'));
  elements.forEach(function (element) {
    if (enabled) {
      element.style.transition = element.dataset.originalTransition;
    } else {
      element.dataset.originalTransition = element.style.transition;
      element.style.transition = 'none';
    }
  });
}

async function setSavedSettings() {
  await toggleAnimations(false);

  const setSetting = (setting, value) => {
    if (setting.id.endsWith('-select')) {
      setting.value = value;
    } else if (setting.id.endsWith('-switch')) {
      setting.children[0].classList[value ? 'add' : 'remove']('toggle-on');
    }
  };

  const checkSetting = (setting, value) => {
    if (setting.id.endsWith('-select')) {
      return setting.value == value;
    } else if (setting.id.endsWith('-switch')) {
      return setting.children[0].classList.contains('toggle-on') == value;
    }
    return true;
  };

  const waitForSettingsSet = (checkSettings, delay) => new Promise(resolve =>
    setTimeout(() => checkSettings() ?
      resolve() : waitForSettingsSet(checkSettings, delay).then(resolve), delay)
  );

  await new Promise((resolve) => {
    chrome.storage.sync.get(null, function (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const setting = document.getElementById(key);
        setSetting(setting, value);
      });

      const checkSettings = () =>
        Object.entries(variables).every(([key, value]) =>
          checkSetting(document.getElementById(key), value));

      resolve(waitForSettingsSet(checkSettings, 50));
    });
  });

  toggleAnimations(true);
}

async function startSettingsSave() {
  // Dropdowns
  const settingDropdowns = document.querySelectorAll('.setting-dropdown');
  settingDropdowns.forEach(function (settingDropdown) {
    settingDropdown.addEventListener('change', () => {
      chrome.storage.sync.set({ [settingDropdown.id]: settingDropdown.value });
    });
  });

  // Switches
  const settingSwitches = document.querySelectorAll('.setting-switch, #extension-activation-switch');
  settingSwitches.forEach(function (settingSwitch) {
    settingSwitch.addEventListener('click', () => {
      chrome.storage.sync.set({
        [settingSwitch.id]: !!document.querySelector('#' + settingSwitch.id + ':has(.toggle-on)')
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  loadCSSVariables();
  setTabsPossitions();
  setSavedSettings();
  startSettingsSave();

  // Tabs selector
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (selectedTab) {
    selectedTab.addEventListener('click', () => {
      document.querySelector('.tab.active').classList.remove('active');
      selectedTab.classList.add('active');
      setTabsPossitions();
    });
  });

  // Switch toggler
  const settingSwitches = document.querySelectorAll('.toggle-switch');
  settingSwitches.forEach(function (settingSwitch) {
    settingSwitch.addEventListener('click', () => {
      settingSwitch.classList.toggle('toggle-on');
    });
  });
});

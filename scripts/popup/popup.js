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
  let file = await fetch(chrome.runtime.getURL('scripts/popup/popup.html'));
  let data = await file.text();
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
    const setting = await chrome.storage.local.get(key);
    value = setting[key] !== undefined ? setting[key] : value;
  }
  chrome.storage.local.set({ [key]: value });
}

function addAnimationsCSS() {

}

function setupPopup() {
  setTabsPossitions();
  setSavedSettings();
  saveSettings();
  addAvailiableFontSettings();
  applyRevertStyleSettings('popup');

  requestAnimationFrame(() => {
    createRemoveScriptElement('popup/animations.css');
  });
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
  const switchSettings = document.querySelectorAll('.toggle-switch');
  for (const switchSetting of switchSettings) {
    switchSetting.addEventListener('click', () => {
      if (switchSetting.parentElement.id === 'font-feature-settings-switch') {
        // Allow ligatures activation only if font have such version.
        const fontFamilySelect = document.getElementById('font-family-select');
        if (fontFamilySelect.value.split(',').length === 2) {
          switchSetting.classList.toggle('toggle-on');
        }
      } else {
        switchSetting.classList.toggle('toggle-on');
      }
    });
  };

  // Reset Settings Button
  const resetSettingsButton = document.querySelector('#reset-settings-button');
  const textUnconfirmed = resetSettingsButton.textContent;

  const textConfirmed = 'Really?'
  const confirmationTime = 5000;

  // When clicked show confirmation message for some time
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
      }, confirmationTime);
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  setupPopup();
  startBackgroundTasks();
});

function addAvailiableFontSettings() {
  fetch(chrome.runtime.getURL('scripts/utilities/variables.css'))
    .then(response => response.text())
    .then(variables => {
      const fontFamiliesWeights = extractFontFamiliesWeightsFromFontFaces(variables);

      const fontFamilySelect = document.getElementById('font-family-select');
      fontFamilySelect.addEventListener('change', event => {
        const selectedFontFamily = event.target.value.split(',')[0].trim();
        const weights = fontFamiliesWeights[selectedFontFamily];
        const fontWeightSelect = document.getElementById('font-weight-select');

        // Add weights to settings dropdown
        fontWeightSelect.textContent = '';
        chrome.storage.local.get(['--code-font-weight']).then((result) => {
          let closestWeight = null;
          let closestWeightDifference = Infinity;

          weights.sort().forEach(weight => {
            // Find closest font-weight selected in old font-family in new font-family
            const weightDifference = Math.abs(weight - result['--code-font-weight']);
            if (weightDifference < closestWeightDifference) {
              closestWeight = weight;
              closestWeightDifference = weightDifference;
            }

            const option = document.createElement('option');
            option.value = weight;
            option.textContent = weight;
            fontWeightSelect.appendChild(option);
          });

          if (closestWeight) {
            fontWeightSelect.value = closestWeight;
            chrome.storage.local.set({ '--code-font-weight': closestWeight });
          }
        });

        // Deactivate ligatures if font don't have such version.
        if (fontFamilySelect.value.split(',').length !== 2) {
          document.querySelector('#font-feature-settings-switch .toggle-switch').classList.remove('toggle-on');
          chrome.storage.local.set({ 'font-feature-settings-switch': false });
        }
      });
      fontFamilySelect.dispatchEvent(new Event('change'));
    });
}

function extractFontFamiliesWeightsFromFontFaces(cssText) {
  const fontFamiliesWeights = {};

  // Iterate over all @font-face blocks in CSS text
  const regex = /@font-face\s*\{([^\}]*)\}/g; // defined outside of the loop
  let match;
  while ((match = regex.exec(cssText)) !== null) {
    const rules = match[1].split(';').map(rule => rule.trim());
    let fontFamily, fontWeight;

    // Find font-family with font-weight
    for (const rule of rules) {
      if (rule.startsWith('font-family')) {
        fontFamily = rule.split(':')[1].trim().replace(/["']/g, '');
      } else if (rule.startsWith('font-weight')) {
        fontWeight = rule.split(':')[1].trim();
      }
    };

    // Add found font-family with font-weight
    if (fontFamily && fontWeight) {
      if (!fontFamiliesWeights[fontFamily]) {
        fontFamiliesWeights[fontFamily] = new Set();
      }
      fontFamiliesWeights[fontFamily].add(fontWeight);
    }
  }

  // Remove duplicates
  for (let fontFamily in fontFamiliesWeights) {
    fontFamiliesWeights[fontFamily] = Array.from(fontFamiliesWeights[fontFamily]);
  }
  return fontFamiliesWeights;
}


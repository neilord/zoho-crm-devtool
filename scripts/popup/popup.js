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
      if (!switchSetting.parentElement.classList.contains('not-available')) {
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
      const fontFamiliesWeightsStyles = extractFontFamiliesWeightsStylesFromFontFaces(variables);

      const fontFamilySelect = document.getElementById('font-family-select');
      const fontWeightSelect = document.getElementById('font-weight-select');

      const getFontSettings = () => {
        const selectedFontFamily = fontFamilySelect.value.split(',')[0].trim();
        const selectedFontWeight = fontWeightSelect.value;
        const weightsStyles = fontFamiliesWeightsStyles[selectedFontFamily];
        return { selectedFontWeight, weightsStyles };
      };

      const handleFontWeightChange = () => {
        const { selectedFontWeight, weightsStyles } = getFontSettings();

        // Deactivate italics if font-weight don't have such version.        
        const italicsSwitch = document.querySelector('#italics-switch');
        if (
          !weightsStyles.some(
            (weightStyle) =>
              weightStyle.weight === selectedFontWeight &&
              (weightStyle.style === 'italic' || weightStyle.style === 'oblique')
          )
        ) {
          italicsSwitch.classList.add('not-available');
          italicsSwitch.children[0].classList.remove('toggle-on');
          chrome.storage.local.set({ '--italics-switch': false });
        } else {
          italicsSwitch.classList.remove('not-available');
        }

        // Disable if only a single choice
        if (fontWeightSelect.options.length <= 1) {
          fontWeightSelect.disabled = true;
        } else {
          fontWeightSelect.disabled = false;
        }
      };

      const handleFontFamilyChange = () => {
        const { weightsStyles } = getFontSettings();

        chrome.storage.local.get(['--code-font-weight']).then((result) => {
          // Add weights to settings dropdown
          let closestWeight = null;
          let closestWeightDifference = Infinity;
          fontWeightSelect.textContent = '';

          weightsStyles.sort((a, b) => a.weight - b.weight).forEach(weightStyle => {
            const weight = weightStyle.weight;

            // Find closest font-weight selected in old font-family in new font-family
            const weightDifference = Math.abs(weight - (result['--code-font-weight'] || 400));
            if (weightDifference < closestWeightDifference) {
              closestWeight = weight;
              closestWeightDifference = weightDifference;
            }

            // Add option if it wasn't added before
            if (!Array.from(fontWeightSelect.options).some(option => option.value === weight)) {
              const option = document.createElement('option');
              option.value = weight;
              option.textContent = weight;
              fontWeightSelect.appendChild(option);
            }
          });

          // Select font-weight
          if (closestWeight) {
            fontWeightSelect.value = closestWeight;
            fontWeightSelect.dispatchEvent(new Event('change'));
            chrome.storage.local.set({ '--code-font-weight': closestWeight });
          }

          // Deactivate ligatures if font-family don't have such version.
          const fontFeatureSettingsSwitch = document.querySelector('#font-feature-settings-switch');
          const fontFeatureSettingsSelect = document.querySelector('#font-feature-settings-select');
          if (fontFamilySelect.value.split(',').length !== 2) {
            fontFeatureSettingsSwitch.classList.add('not-available');
            fontFeatureSettingsSwitch.children[0].classList.remove('toggle-on');
            fontFeatureSettingsSelect.disabled = true;
            chrome.storage.local.set({ 'font-feature-settings-switch': false });
          } else {
            fontFeatureSettingsSwitch.classList.remove('not-available');
            fontFeatureSettingsSelect.disabled = false;
          }
        });
      };

      fontFamilySelect.addEventListener('change', handleFontFamilyChange);
      fontWeightSelect.addEventListener('change', handleFontWeightChange);
      handleFontFamilyChange();
    });
}

function extractFontFamiliesWeightsStylesFromFontFaces(cssText) {
  const fontFamiliesWeightsStyles = {};

  // Iterate over all @font-face blocks in CSS text
  const regex = /@font-face\s*\{([^\}]*)\}/g;
  let match;
  while ((match = regex.exec(cssText)) !== null) {
    const rules = match[1].split(';').map(rule => rule.trim());
    let fontFamily, fontWeight, fontStyle;

    // Find font-family with font-weight and font-style
    for (const rule of rules) {
      if (rule.startsWith('font-family')) {
        fontFamily = rule.split(':')[1].trim().replace(/["']/g, '');
      } else if (rule.startsWith('font-weight')) {
        fontWeight = rule.split(':')[1].trim();
      } else if (rule.startsWith('font-style')) {
        fontStyle = rule.split(':')[1].trim();
      }
    };

    // Add found font-family with font-weight and font-style
    if (fontFamily && fontWeight && fontStyle) {
      if (!fontFamiliesWeightsStyles[fontFamily]) {
        fontFamiliesWeightsStyles[fontFamily] = [];
      }
      fontFamiliesWeightsStyles[fontFamily].push({ weight: fontWeight, style: fontStyle });
    }
  }
  return fontFamiliesWeightsStyles;
}


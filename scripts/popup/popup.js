function showSavedSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (settings) => {
      for (const [key, value] of Object.entries(settings)) {
        const setting = document.querySelector('[data-key="' + key + '"]');
        if (setting) {
          if (key.endsWith('-switch')) {
            setting.children[0].classList[value ? 'add' : 'remove']('toggle-on');
          } else {
            setting.value = value;
          }
        }
      }
      resolve();
    });
  });
}

function startSettingsSave() {
  const settings = document.querySelectorAll('*[data-key]');
  for (const setting of settings) {
    const trigger = setting.id.endsWith('-switch') ? 'click' : 'change';
    const determineValue = (setting, trigger) =>
      trigger === 'click' ? !!setting.querySelector('.toggle-on') : setting.value;

    updateStorageVariable(setting.dataset.key, determineValue(setting, trigger));
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

async function setupPopup() {
  await setInitialSettings();
  await showSavedSettings();
  await addAvailiableFontSettings();
  startSettingsSave();
  applyRevertStyleSettings();

  // Enable animations.css
  requestAnimationFrame(() => {
    createRemoveScriptElement('popup/animations.css');
  });
}

function startBackgroundTasks() {
  // Switch toggler
  const switchSettings = document.querySelectorAll('.toggle-switch');
  for (const switchSetting of switchSettings) {
    switchSetting.addEventListener('click', () => {
      if (!switchSetting.parentElement.classList.contains('not-available')) {
        switchSetting.classList.toggle('toggle-on');
      }
    });
  };
}

function addAvailiableFontSettings() {
  return new Promise((resolve) => {
    fetch(chrome.runtime.getURL('scripts/base/variables.css'))
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
            chrome.storage.local.set({ [italicsSwitch.dataset.key]: false });
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
          return new Promise((resolve) => {
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
                chrome.storage.local.set({ [fontWeightSelect.dataset.key]: closestWeight });
              }

              // Deactivate ligatures if font-family don't have such version.
              const fontFeatureSettingsSwitch = document.querySelector('#font-feature-settings-switch');
              const fontFeatureSettingsSelect = document.querySelector('#font-feature-settings-select');
              if (fontFamilySelect.value.split(',').length !== 2) {
                fontFeatureSettingsSwitch.classList.add('not-available');
                fontFeatureSettingsSwitch.children[0].classList.remove('toggle-on');
                fontFeatureSettingsSelect.disabled = true;
                chrome.storage.local.set({ [fontFeatureSettingsSwitch.dataset.key]: false });
              } else {
                fontFeatureSettingsSwitch.classList.remove('not-available');
                fontFeatureSettingsSelect.disabled = false;
              }
              resolve();
            });
          });
        };

        fontFamilySelect.addEventListener('change', handleFontFamilyChange);
        fontWeightSelect.addEventListener('change', handleFontWeightChange);
        handleFontFamilyChange().then(() => {
          resolve();
        });
      });
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

document.addEventListener('DOMContentLoaded', function () {
  setupPopup();
  startBackgroundTasks();
});

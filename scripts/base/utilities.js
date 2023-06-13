function createRemoveScriptElement(file, create = true) {
  const name = file.split('/').pop().split('.')[0];
  const id = name + '-script';
  const type = file.split('.').pop();
  const isJS = type === 'js';

  const oldElement = document.getElementById(id);
  if (oldElement) {
    oldElement.remove();
  }

  if (create) {
    const url = chrome.runtime.getURL('scripts/' + file);
    const newElement = document.createElement(isJS ? 'script' : 'link');
    newElement.id = id;
    newElement.setAttribute(isJS ? 'src' : 'href', url);
    newElement.setAttribute(
      isJS ? 'type' : 'rel',
      isJS ? 'text/javascript' : 'stylesheet',
    );
    (isJS ? document.body : document.head).appendChild(newElement);
  }
}

function waitForElement(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function waitForElementRemoval(selector) {
  return new Promise((resolve) => {
    if (!document.querySelector(selector)) {
      return resolve();
    }

    const observer = new MutationObserver(() => {
      if (!document.querySelector(selector)) {
        resolve();
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function applyRevertStyleSettings(apply = true) {
  const popupSettings = [
    'theme',
    'style',
    '--code-font-family',
    '--font-feature-settings',
    'font-feature-settings-switch',
  ];

  const skipSettings = [
    'end-with-new-line-switch',
    'space-if-statements-switch',
    'shift-brackets-switch',
    'compact-conditions-switch',
    'divide-comments-select',
    'divide-comments-switch',
    'disable-darkreader-switch',
  ];

  const isPopup = location.href.includes('chrome-extension://');

  function modifyStyles(changes) {
    for (const [key, { oldValue, newValue }] of changes) {
      if (skipSettings.includes(key) || (isPopup && !popupSettings.includes(key))) {
        continue;
      }

      if (key.startsWith('--')) {
        // CSS Variables
        let modifications = {};
        if (key === '--code-font-family' && newValue) {
          const fontFamilies = newValue.split(',');
          modifications['--code-font-family'] = fontFamilies[0];
          modifications['--code-font-family-ligatures'] = fontFamilies[1] || fontFamilies[0];
        } else {
          modifications[key] = newValue;
        }
        for (const [variable, value] of Object.entries(modifications)) {
          document.documentElement.style.setProperty(variable, value);
        }

      } else if (key.endsWith('-switch')) {
        // Appending CSS for specific functionalities
        const path = (isPopup ? 'popup/' : 'functions-editor/') + 'settings-styles/';
        const name = key.replace(/(-switch$)/, '');
        const create = apply && newValue;
        createRemoveScriptElement(path + name + '.css', create);

      } else if (key === 'close-button-select') {
        const create = apply && newValue === 'left';
        createRemoveScriptElement('functions-editor/settings-styles/' + key + '.css', create);

      } else if (key === 'theme') {
        createRemoveScriptElement('base/themes/' + oldValue + '.css', false);
        createRemoveScriptElement('base/themes/' + newValue + '.css');

      } else if (key === 'style') {
        createRemoveScriptElement('base/themes/styles/' + oldValue + '.css', false);
        createRemoveScriptElement('base/themes/styles/' + newValue + '.css');
      }
    }
  }

  // Immediately apply changes
  chrome.storage.local.get(null, (changes) => {
    let formattedChanges = [];
    for (const [key, value] of Object.entries(changes)) {
      formattedChanges.push([key, { oldValue: value, newValue: value }]);
    }
    modifyStyles(formattedChanges);
  });

  // Listen for changes
  chrome.storage.onChanged[apply ? 'addListener' : 'removeListener']( (changes) => {
    let formattedChanges = [];
    for (let key in changes) {
      formattedChanges.push([key, { oldValue: changes[key].oldValue, newValue: changes[key].newValue }]);
    }
    modifyStyles(formattedChanges);
  });
}

function setDefaultSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(function () {
      chrome.storage.local.set({
        'extension-activation-switch': true,
        'theme': 'zoho-default-light',
        'style': 'classic',
        '--code-font-family': 'JetBrains Mono NL,JetBrains Mono',
        '--code-font-size': '14px',
        '--code-font-weight': '400',
        '--code-font-line-height': '1.5',
        '--font-feature-settings': "'calt', 'zero'",
        'font-feature-settings-switch': true,
        'italics-switch': true,
        'indent-guides-switch': true,
        'pro-syntax-higliting-switch': true,
        'close-button-select': 'right',
      }, resolve);
    });
  });
}

async function setInitialSettings() {
  const settings = await new Promise((resolve) => chrome.storage.local.get(null, resolve));
  if (Object.keys(settings).length === 0 && settings.constructor === Object) {
    await setDefaultSettings();
  }
}


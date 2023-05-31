function createRemoveScriptElement(file, create = true) {
  const name = file.split('/').pop().split('.')[0];
  const id = name + '-script';
  const type = file.split('.').pop();

  const oldElement = document.getElementById(id);
  if (oldElement) {
    oldElement.remove();
  }

  if (create) {
    const url = chrome.runtime.getURL(file);
    const newElement = document.createElement(type === 'js' ? 'script' : 'link');
    newElement.id = id;
    newElement.setAttribute(type === 'js' ? 'src' : 'href', url);
    newElement.setAttribute(
      type === 'js' ? 'type' : 'rel',
      type === 'js' ? 'text/javascript' : 'stylesheet'
    );
    document.body.appendChild(newElement);
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

function applyStyleSettings(page) {
  const popupSettings = [
    'theme',
    '--code-font-family',
    '--code-font-feature-settings',
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

  function modifyStyles(changes) {
    for (const [key, value] of Object.entries(changes)) {
      if (skipSettings.includes(key) || (page === 'popup' && !popupSettings.includes(key))) {
        continue;
      }

      if (key.startsWith('--')) {
        let modifications = {};
        if (key === '--code-font-family' && value) {
          const fontFamilies = value.split(', ');
          modifications['--code-font-family'] = fontFamilies[0];
          modifications['--code-font-family-ligatures'] = fontFamilies[1] || fontFamilies[0];
        } else {
          modifications[key] = value;
        }
        for (const [variable, value] of Object.entries(modifications)) {
          console.log(variable + '   ' + value);
          document.documentElement.style.setProperty(variable, value);
        }

      } else if (key.endsWith('-switch')) {
        const path = 'scripts/' + (page === 'popup' ? 'popup/' : 'functions-editor/') + 'settings-styles/';
        const name = key.replace(/(-switch$)/, '');
        createRemoveScriptElement(path + name + '.css', value);
        console.log(path + name + '.css, ' + value);

        if (key == '--code-font-family')
          document.documentElement.style.setProperty('--code-font-family', value);

      } else if (key === 'theme') {
        createRemoveScriptElement('scripts/utilities/themes/' + value + '.css');

      } else if (key === 'close-button-select') {
        createRemoveScriptElement('scripts/functions-editor/settings-styles/' + key + '.css', value === 'left');
      }
    }
  }

  // Immediately apply changes
  chrome.storage.local.get(null, modifyStyles);

  // Listen for changes
  if (!applyStyleSettings.listenerAdded) {
    chrome.storage.onChanged.addListener((changes) => {
      const simplifiedChanges = {};
      for (const [key, { newValue }] of Object.entries(changes)) {
        simplifiedChanges[key] = newValue;
      }
      modifyStyles(simplifiedChanges);
    });
    applyStyleSettings.listenerAdded = true;
  }
}
applyStyleSettings.listenerAdded = false;

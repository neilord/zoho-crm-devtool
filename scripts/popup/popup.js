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

async function toggleExtensionActivation() {
  const mainSwitch = document.querySelector('#extension-activation-switch .toggle-switch');
  await chrome.storage.sync.get(['extensionActivated']).then((result) => {
    const extensionActivated = result.extensionActivated;
    if (extensionActivated == true) {
      mainSwitch.classList.add('toggle-on');
    } else if (extensionActivated == false) {
      mainSwitch.classList.remove('toggle-on');
    } else {
      chrome.storage.sync.set({
        extensionActivated: document.querySelector('.toggle-switch.toggle-on'),
      });
    }
  });
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

async function setInitialSettings() {
  await toggleAnimations(false);
  await toggleExtensionActivation();
  await setTabsPossitions();
  await toggleAnimations(true);
}

document.addEventListener('DOMContentLoaded', function () {
  createRemoveScriptElement('variables.css');
  setInitialSettings();

  // Main switch toggler
  const mainSwitches = document.querySelectorAll('.toggle-switch');
  mainSwitches.forEach(function (mainSwitch) {
    mainSwitch.addEventListener('click', () => {
      mainSwitch.classList.toggle('toggle-on');
      chrome.storage.sync.get(['extensionActivated']).then((result) => {
        chrome.storage.sync.set({
          extensionActivated: !result.extensionActivated,
        });
      });
    });
  });

  // Tabs selector
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (selectedTab) {
    selectedTab.addEventListener('click', () => {
      document.querySelector('.tab.active').classList.remove('active');
      selectedTab.classList.add('active');
      setTabsPossitions();
    });
  });
});












async function createRemoveScriptElement(file, create = true) {
  const name = file.split('.')[0];
  const type = file.split('.')[1];

  const oldElement = document.getElementById(name);
  if (oldElement) {
    oldElement.remove();
  }

  if (create) {
    const url = chrome.runtime.getURL('scripts/' + file);
    const newElement = document.createElement(type == 'js' ? 'script' : 'link');
    newElement.id = name;
    newElement.setAttribute(type == 'js' ? 'src' : 'href', url);
    newElement.setAttribute(
      type == 'js' ? 'type' : 'rel',
      type == 'js' ? 'text/javascript' : 'stylesheet'
    );
    document.body.appendChild(newElement);
  }
}

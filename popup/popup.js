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
  const mainSwitch = document.querySelector('#extension-activation-switch .toggle');
  await chrome.storage.sync.get(['extensionActivated']).then((result) => {
    const extensionActivated = result.extensionActivated;
    if (extensionActivated == true) {
      mainSwitch.classList.add('toggle-on');
    } else if (extensionActivated == false) {
      mainSwitch.classList.remove('toggle-on');
    } else {
      chrome.storage.sync.set({
        extensionActivated: document.querySelector('.toggle.toggle-on'),
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
  setInitialSettings();

  // Main switch toggler
  const mainSwitch = document.querySelector('#extension-activation-switch .toggle');
  mainSwitch.addEventListener('click', () => {
    mainSwitch.classList.toggle('toggle-on');
    chrome.storage.sync.get(['extensionActivated']).then((result) => {
      chrome.storage.sync.set({
        extensionActivated: !result.extensionActivated,
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

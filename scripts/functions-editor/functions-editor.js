// Actions

async function changeGoToLinePlaceholder() {
  (await waitForElement('#customDelugeGoTo')).setAttribute('placeholder', 'Go to line number..');
  await waitForElementRemoval('#customDelugeGoTo');
  setTimeout(changeGoToLinePlaceholder, 0);
}

function addLeftCloseButton() {
  const leftCloseButton = document.createElement('lyte-button');
  document
    .querySelector('div.headerSectionTabCnt.pR.crmBaseColor.br_bottom_border3.w100_per.oH > div')
    .children[0].before(leftCloseButton);
  leftCloseButton.setAttribute('id', 'functionCancelLeft');
  leftCloseButton.firstElementChild.textContent = 'Close';
  leftCloseButton.onclick = () => {
    createRemoveScriptElement('functions-editor/close-button-action.js');
  };
}

function removeLeftCloseButton() {
  const leftCloseButton = document.querySelector('#functionCancelLeft');
  if (leftCloseButton) {
    leftCloseButton.remove();
  }
}

async function addFooter() {
  // Footer
  const footer = document.createElement('footer');
  document.body.appendChild(footer);
  footer.setAttribute('id', 'functionFooter');
  footer.style = `
    z-index: 29;
    display: flex;
    justify-content: space-between;
    position: absolute;
    height: 31px;
    width: 100%;
    bottom: 0px;
    border-top: 1px solid var(--editor-footer-border-color);
    align-items: center;

    font-family: var(--editor-footer-font-family);
    font-size: 15px;
    font-weight: 600;
    color: var(--editor-footer-text-color);
    background: var(--editor-footer-background-color);
  `;

  // Function Details
  const functionDetails = document.createElement('div');
  footer.appendChild(functionDetails);
  functionDetails.style = `
    display: flex;
    margin-left: 8px;
  `;

  // Function Name
  const headerFunctionName = await waitForElement('#dreFunctionName');
  const functionName = document.createElement('div');
  functionDetails.appendChild(functionName);
  syncElements(headerFunctionName, functionName, 'textContent');

  // Function Parameters
  const headerFunctionParameters = await waitForElement('#functionArguments');
  const functionParameters = document.createElement('div');
  functionDetails.appendChild(functionParameters);
  functionParameters.style = `
    margin-left: 2px;
  `;
  syncElements(headerFunctionParameters, functionParameters, 'textContent');

  // Edit Arguments
  const functionEditArguments = document.createElement('div');
  functionDetails.appendChild(functionEditArguments);
  functionEditArguments.textContent = 'Edit Arguments';
  functionEditArguments.onclick = () => {
    document.querySelector('.smalledit.pR').click();
  };
  functionEditArguments.style = `
    margin-left: 8px;
    text-decoration: underline;
    cursor: pointer;
  `;

  // Function Description
  const headerFunctionDescription = await waitForElement('lyte-input[data-zcqa="cf_functionDesc"] input[value]');
  const functionDescription = document.createElement('input');
  footer.appendChild(functionDescription);
  functionDescription.setAttribute('id', 'templateSubject');
  functionDescription.setAttribute('placeholder', 'Function Description');
  functionDescription.setAttribute('autocomplete', 'off');
  functionDescription.setAttribute('value', headerFunctionDescription.value);
  headerFunctionDescription.setAttribute('id', 'headerFunctionDescription');

  // Deluge Logo
  const delugeLogo = document.createElement('div');
  footer.appendChild(delugeLogo);
  delugeLogo.style = `
    display: flex;
    align-items: center;
    margin-right: 8px;
  `;

  // Deluge Icon
  const delugeIcon = document.createElement('div');
  delugeLogo.appendChild(delugeIcon);
  delugeIcon.textContent = '{}';
  delugeIcon.style = `
    margin-right: 8px;
  `;

  // Deluge Title
  const delugeTitle = document.createElement('div');
  delugeLogo.appendChild(delugeTitle);
  delugeTitle.textContent = 'Deluge';
}

function removeFooter() {
  const footer = document.querySelector('#functionFooter');
  if (footer) {
    footer.remove();
  }
}

// Apply

async function enhanceFunctionsEditor() {
  addLeftCloseButton();
  addFooter();
  createRemoveScriptElement('base/variables.css');
  createRemoveScriptElement('functions-editor/functions-editor.css');
  applyRevertStyleSettings();
  createRemoveScriptElement('functions-editor/deluge-editor-resize.js');
}

function revertFunctionsEditor() {
  removeLeftCloseButton();
  removeFooter();
  createRemoveScriptElement('base/variables.css', false);
  createRemoveScriptElement('functions-editor/functions-editor.css', false);
  applyRevertStyleSettings(false);
  createRemoveScriptElement('functions-editor/deluge-editor-resize.js');
}

async function observeFunctionsEditor() {
  const visibleTopBarSelector = '#tabLayer:not([style*="display: none"])';
  const hiddenTopBarWithCodeFrameSelector = '#basic:has(#tabLayer[style*="display: none"]) ~ #createfunctionpopdiv';

  // Opened
  await waitForElement(hiddenTopBarWithCodeFrameSelector);

  // Enhance if extension-activation-switch is on or was turned on
  chrome.storage.local.get(['extension-activation-switch']).then((result) => {
    if (result['extension-activation-switch']) {
      enhanceFunctionsEditor();
    }
  });

  const extensionActivationSwitchChangesListener = (changes) => {
    if ('extension-activation-switch' in changes) {
      if (changes['extension-activation-switch'].newValue) {
        enhanceFunctionsEditor();
      } else {
        revertFunctionsEditor();
      }
    }
  };

  chrome.storage.onChanged.addListener(extensionActivationSwitchChangesListener);

  // Closed
  await waitForElement(visibleTopBarSelector);
  revertFunctionsEditor();

  chrome.storage.onChanged.removeListener(extensionActivationSwitchChangesListener);

  observeFunctionsEditor();
}

async function manageEditorEnhancements() {
  await setInitialSettings();
  observeFunctionsEditor();
  changeGoToLinePlaceholder();
}
manageEditorEnhancements();

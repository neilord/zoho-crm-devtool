const visableTopBarSelecter = '#tabLayer:not([style*="display: none"])';
const hiddenTopBarWithCodeFrameSelecter =
  '#basic:has(#tabLayer[style*="display: none"]) ~ #createfunctionpopdiv';

const headerSelector = '.w100p.untitledRepTextPar.aIC.dF.spaceBetween.h70';
const functionNameSelector = '#dreFunctionName';
const functionParametersSelector = '#functionArguments';
const functionDescriptionId = 'templateSubject';

const buttonsSelector = '.dIB.mL10.viewaschartbtn.addchartbtnhere.vam';
const editArgumentsButtonSelector = '.smalledit.pR';

const goToLineInputSelector = '#customDelugeGoTo';

// Enhance Functions Editor

async function changeGoToLinePlaceholder() {
  await waitForElement(goToLineInputSelector);

  goToLineInput = document.querySelector(goToLineInputSelector);
  goToLineInput.setAttribute('placeholder', 'Go to line number..');

  await waitForElementRemoval(goToLineInputSelector);
  changeGoToLinePlaceholder();
}

function addLeftCloseButton() {
  const leftCloseButton = document.createElement('lyte-button');
  document.querySelector(headerSelector).children[0].before(leftCloseButton);
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
    font-weight: bold;
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
  await waitForElement(functionNameSelector);
  const headerFunctionName = document.querySelector(functionNameSelector);

  const functionName = document.createElement('div');
  functionDetails.appendChild(functionName);
  functionName.textContent = headerFunctionName.textContent;

  // Function Parameters
  await waitForElement(functionParametersSelector);
  const headerFunctionParameters = document.querySelector(functionParametersSelector);

  const functionParameters = document.createElement('div');
  functionDetails.appendChild(functionParameters);
  functionParameters.textContent = headerFunctionParameters.textContent;
  functionParameters.style = `
    margin-left: 2px;
  `;

  // Edit Arguments
  const functionEditArguments = document.createElement('div');
  functionDetails.appendChild(functionEditArguments);
  functionEditArguments.textContent = 'Edit Arguments';
  functionEditArguments.onclick = () => {
    document.querySelector(editArgumentsButtonSelector).click();
  };
  functionEditArguments.style = `
    margin-left: 8px;
    text-decoration: underline;
    cursor: pointer;
  `;

  // Function Description
  await waitForElement('#' + functionDescriptionId);
  const headerFunctionDescription = document.getElementById(functionDescriptionId);

  const functionDescription = document.createElement('input');
  footer.appendChild(functionDescription);
  functionDescription.setAttribute('id', functionDescriptionId);
  functionDescription.setAttribute('placeholder', 'Function Description');
  functionDescription.setAttribute('autocomplete', 'off');
  functionDescription.setAttribute('value', headerFunctionDescription.getAttribute('value'));
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

async function beautifyCode() {
  await waitForElementRemoval('.CodeMirror-code');
  await waitForElement('.CodeMirror-code');
  createRemoveScriptElement('functions-editor/code-beautifier.js');
}

function enchanceFunctionsEditor() {
  addLeftCloseButton();
  addFooter();
  beautifyCode();
  createRemoveScriptElement('functions-editor/functions-editor.css');
  applyRevertStyleSettings('website');
}

function revertFunctionsEditor() {
  removeLeftCloseButton();
  removeFooter();
  createRemoveScriptElement('functions-editor.css', false);
  applyRevertStyleSettings('website', false);
}

async function observeFunctionsEditor() {
  // Opened
  await waitForElement(hiddenTopBarWithCodeFrameSelecter);

  // Enchance if extension-activation-switch is on or was turned on
  chrome.storage.local.get(['extension-activation-switch']).then((result) => {
    if (result['extension-activation-switch']) {
      enchanceFunctionsEditor();
    }
  });

  const extensionActivationSwitchChangesListener = (changes) => {
    if ('extension-activation-switch' in changes) {
      if (changes['extension-activation-switch'].newValue) {
        enchanceFunctionsEditor();
      } else {
        revertFunctionsEditor();
      }
    }
  };

  chrome.storage.onChanged.addListener(extensionActivationSwitchChangesListener);

  // Closed
  await waitForElement(visableTopBarSelecter);
  revertFunctionsEditor();

  chrome.storage.onChanged.removeListener(extensionActivationSwitchChangesListener);

  observeFunctionsEditor();
}

observeFunctionsEditor();

// Other task

changeGoToLinePlaceholder();

// Return storage settings if requested
window.addEventListener('message', function (event) {
  if (event.source !== window)
    return;

  if (event.data.type === 'GET_LOCAL_STORAGE') {
    chrome.storage.local.get(null, function (result) {
      window.postMessage({
        type: 'LOCAL_STORAGE_RESPONSE',
        data: result
      }, '*');
    });
  }
});

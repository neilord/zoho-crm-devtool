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

// Utilities

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

async function createRemoveScriptElement(file, create = true) {
  const name = file.split('.')[0];
  const type = file.split('.')[1];

  const oldElement = document.getElementById(name);
  if (oldElement) {
    oldElement.remove();
  }

  if (create) {
    const url = chrome.runtime.getURL('scripts/functions-editor/' + file);
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

// Enhance Functions Editor

async function changeGoToLinePlaceholder() {
  await waitForElement(goToLineInputSelector);

  goToLineInput = document.querySelector(goToLineInputSelector);
  goToLineInput.setAttribute('placeholder', 'Go to line number..');

  await waitForElementRemoval(goToLineInputSelector);
  changeGoToLinePlaceholder();
}

async function addLeftCloseButton() {
  const leftCloseButton = document.createElement('lyte-button');
  document.querySelector(headerSelector).children[0].before(leftCloseButton);
  leftCloseButton.setAttribute('id', 'functionCancelLeft');
  leftCloseButton.firstElementChild.textContent = 'Close';
  leftCloseButton.onclick = () => {
    createRemoveScriptElement('close-button-action.js');
  };
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
    border-top: 1px solid var(--header-footer-border-color);
    align-items: center;

    font-family: var(--crm-font-bold);
    font-size: 15px;
    color: var(--line-number-color);
    background: var(--primary-background-color);
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
  const headerFunctionParameters = document.querySelector(
    functionParametersSelector
  );

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
  const headerFunctionDescription = document.getElementById(
    functionDescriptionId
  );

  const functionDescription = document.createElement('input');
  footer.appendChild(functionDescription);
  functionDescription.setAttribute('id', functionDescriptionId);
  functionDescription.setAttribute('placeholder', 'Function Description');
  functionDescription.setAttribute('autocomplete', 'off');
  functionDescription.setAttribute(
    'value',
    headerFunctionDescription.getAttribute('value')
  );
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
    font-family: 'JetBrains Mono';
    margin-right: 8px;
  `;

  // Deluge Title
  const delugeTitle = document.createElement('div');
  delugeLogo.appendChild(delugeTitle);
  delugeTitle.textContent = 'Deluge';
}

async function removeFooter() {
  document.querySelector('#functionFooter').remove();
}

async function formatCode() {
  await waitForElementRemoval('.CodeMirror-code');
  await waitForElement('.CodeMirror-code');
  createRemoveScriptElement('code-formatter.js');
}

async function disableEnableDarkReader(disable = true) {
  let disabler = document.querySelector('meta[name="darkreader-lock"]');
  if (disable && !disabler) {
    disabler = document.createElement('meta');
    disabler.name = 'darkreader-lock';
    document.head.appendChild(disabler);
  } else if (disabler) {
    disabler.parentNode.removeChild(disabler);
  }
}

async function observeFunctionsEditor() {
  await waitForElement(hiddenTopBarWithCodeFrameSelecter);

  // Oppened
  addLeftCloseButton();
  addFooter();
  formatCode();
  disableEnableDarkReader();
  createRemoveScriptElement('functions-editor.css');

  await waitForElement(visableTopBarSelecter);

  // Closed
  removeFooter();
  disableEnableDarkReader(false);
  createRemoveScriptElement('functions-editor.css', false);

  observeFunctionsEditor();
}

async function startBackgroundTasks() {
  changeGoToLinePlaceholder();
}

observeFunctionsEditor();
startBackgroundTasks();

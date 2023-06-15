(() => {
  const closeButtonSelector = 'lyte-button[data-zcqa="cf_functionCancel"] button';

  if (!delugeEditor.isEditorContentModified()) {
    customFunctionsObj.leavePage();
  } else {
    document.querySelector(closeButtonSelector).click();
  }
})();

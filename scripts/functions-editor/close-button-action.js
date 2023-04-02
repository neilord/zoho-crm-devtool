(() => {
  const closeButtonSelector = '#functionCancel';

  if (!delugeEditor.isEditorContentModified()) {
    customFunctionsObj.leavePage();
  } else {
    document.querySelector(closeButtonSelector).click();
  }
})();

(() => {
  const initialContent = delugeEditor.getEditorValue();
  const beautifiers = {
    "Space If-Statements": {
      active: true,
      find: /((?<=(^|\n)\t*(else )?)(if)(?=\())/g,
      replace: '$& ',
    },
    "Shift Brackets": {
      active: true,
      find: / *\n\t*(?=\{|\[)/g,
      replace: ' ',
    },
    "Compact Conditions": {
      active: true,
      find: / *\n\t*(?=else|catch)/g,
      replace: ' ',
    },
    "End With New Line": {
      active: true,
      find: /([^\n])$/g,
      replace: '$&\n',
    },
    "Divide Comments MESSAGE": {
      active: true,
      find: /(?<!(\/\/)|\t|\n)(\n\t*)(\/\/ )(?=.)/g,
      replace: '$2$2$3',
    },
    "Divide Comments ALL": {
      active: false,
      find: /(?<!(\/\/)|\t|\n)(\n\t*)(\/\/)(?=.)/g,
      replace: '$2$2$3',
    },
  };

  let newContent = initialContent;
  Object.values(beautifiers).forEach(beautifier => {
    if (beautifier.active) {
      newContent = newContent.replace(beautifier.find, beautifier.replace);
    }
  });
  delugeEditor.setEditorContent(newContent);
})();

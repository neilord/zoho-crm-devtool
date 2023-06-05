(async () => {
  if (!delugeEditor.isEditorContentModified()) {
    return;
  }
  
  const beautifiers = {
    'end-with-new-line-switch': {
      find: /([^\n])$/g,
      replace: '$&\n',
    },
    'space-if-statements-switch': {
      find: /((?<=(^|\n)\t*(else )?)(if)(?=\())/g,
      replace: '$& ',
    },
    'shift-brackets-switch': {
      find: / *\n\t*(?=\{|\[)/g,
      replace: ' ',
    },
    'compact-conditions-switch': {
      find: / *\n\t*(?=else|catch)/g,
      replace: ' ',
    },
    'divide-comments-switch Remarks': {
      find: /(?<!(\/\/.*?)|\t|\n)(\n\t*)(\/\/ )(?=.)/g,
      replace: '$2$2$3',
    },
    'divide-comments-switch All': {
      find: /(?<!(\/\/.*?)|\t|\n)(\n\t*)(\/\/)(?=.)/g,
      replace: '$2$2$3',
    },
  };

  // Get code beautifier settings
  const getSettings = () => {
    return new Promise((resolve) => {
      window.addEventListener('message', (event) => {
        if (event.source !== window)
          return;

        if (event.data.type === 'LOCAL_STORAGE_RESPONSE') {
          resolve(event.data.data);
        }
      });

      window.postMessage({
        type: 'GET_LOCAL_STORAGE'
      }, '*');
    });
  };
  const settings = await getSettings();

  // Apply regex rules
  let content = delugeEditor.delugeEditorContent;
  for (const [key, value] of Object.entries(beautifiers)) {
    let active = false;

    if (key.startsWith('divide-comments-switch')) {
      const switchSettingKey = key.replace(/(?= ).*/, '');
      const dropdownSettingKey = switchSettingKey.replace('-switch', '-select');
      active = settings[switchSettingKey] && settings[dropdownSettingKey] === key.replace(/.*(?<= )/, '');
    } else {
      active = !!settings[key];
    }

    if (active) {
      content = content.replace(value.find, value.replace);
      delugeEditor.setEditorContent(content);
    }
  }
})();

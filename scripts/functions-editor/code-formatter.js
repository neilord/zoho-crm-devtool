(() => {
  const initialContent = delugeEditor.getEditorValue();

  let newContent = initialContent;
  newContent = newContent.replace(/(?:\n)([\s]*)([\{\[])/g, ' $2'); // if\n{ → if {
  newContent = newContent.replace(/(?<=\n[\s]*\})[\s]*(?=(else|catch) .*\{\n)/g, ' '); // }\nelse → } else 
  newContent = newContent.replace(/((?<=(\n[\s]*|[\s]*\} else ))if)(?=\()/g, '$1 '); // if( → if (

  delugeEditor.setEditorContent(newContent);
})();

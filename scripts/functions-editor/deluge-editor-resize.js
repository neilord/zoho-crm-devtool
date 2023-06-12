(() => {
  const interval = setInterval(() => {
    try {
      delugeEditor.resize();
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      clearInterval(interval);
    } catch (error) {
      // delugeEditor is not available yet
    }
  }, 100);
})();

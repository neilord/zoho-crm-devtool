(() => {
  const interval = setInterval(() => {
    try {
      delugeEditor.resize();
      clearInterval(interval);
    } catch (error) {
      // delugeEditor is not available yet
    }
  }, 100);
})();

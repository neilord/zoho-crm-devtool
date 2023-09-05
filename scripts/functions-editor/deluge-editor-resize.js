(() => {
  let isAvailable = false;
  const interval = setInterval(() => {
    try {
      delugeEditor.resize();
      if (!isAvailable) {
        isAvailable = true; 
        setTimeout(() => {
          clearInterval(interval);
        }, 1000);
      }
    } catch (error) {
      // delugeEditor is not available yet
    }
  }, 100);
})();

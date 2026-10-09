var ValletSession = (() => {
  const SESSION_KEY = 'vallet.session';

  const read = () => {
    try {
      return window.sessionStorage.getItem(SESSION_KEY);
    } catch (error) {
      return null;
    }
  };

  const write = (email) => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, email);
    } catch (error) {
      return;
    }
  };

  const clear = () => {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      return;
    }
  };

  return { read, write, clear };
})();

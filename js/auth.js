/**
 * auth.js - Authentication Module
 */

const Auth = {
  PASSWORD: '12345678910',
  SESSION_KEY: 'emera_session',
  CUSTOM_PWD_KEY: 'emera_custom_password',

  // Returns the active password (custom if set, else default)
  _activePassword() {
    return localStorage.getItem(this.CUSTOM_PWD_KEY) || this.PASSWORD;
  },

  isLoggedIn() {
    return localStorage.getItem(this.SESSION_KEY) === 'true';
  },

  login(password) {
    if (password === this._activePassword()) {
      localStorage.setItem(this.SESSION_KEY, 'true');
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'index.html';
  },
};

// === SERVICIO DE TEMAS - UNINOTE ===

import { StorageManager } from '../core/storage.js';
import { STATE } from '../config/state.js';

export class ThemeService {
  static init() {
    const savedTheme = StorageManager.getTheme();
    if (savedTheme === 'dark') {
      this.setDarkTheme();
    }
  }

  static toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      this.setLightTheme();
    } else {
      this.setDarkTheme();
    }
  }

  static setDarkTheme() {
    document.body.setAttribute('data-theme', 'dark');
    if (STATE.DOM.themeToggleBtn) {
      STATE.DOM.themeToggleBtn.textContent = '☀️';
    }
    StorageManager.setTheme('dark');
  }

  static setLightTheme() {
    document.body.removeAttribute('data-theme');
    if (STATE.DOM.themeToggleBtn) {
      STATE.DOM.themeToggleBtn.textContent = '🌙';
    }
    StorageManager.removeTheme();
  }
}

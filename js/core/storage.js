// === GESTIÓN DE ALMACENAMIENTO - UNINOTE ===

import { STORAGE_KEYS } from '../config/constants.js';

export class StorageManager {
  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch(e) {
      console.error(`Error reading ${key}:`, e);
      return null;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch(e) {
      console.error(`Error saving ${key}:`, e);
      return false;
    }
  }

  static remove(key) {
    localStorage.removeItem(key);
  }

  static clear() {
    localStorage.clear();
  }

  // === Métodos específicos para App Data ===

  static getAppData() {
    return this.get(STORAGE_KEYS.APP_DATA);
  }

  static setAppData(data) {
    return this.set(STORAGE_KEYS.APP_DATA, data);
  }

  // === Métodos específicos para Documentos ===

  static getDocNotes(docName) {
    return this.get(`${STORAGE_KEYS.DOC_PREFIX}${docName}`) || [];
  }

  static setDocNotes(docName, notes) {
    return this.set(`${STORAGE_KEYS.DOC_PREFIX}${docName}`, notes);
  }

  static removeDocNotes(docName) {
    this.remove(`${STORAGE_KEYS.DOC_PREFIX}${docName}`);
  }

  // === Métodos específicos para Emojis ===

  static getRecentEmojis() {
    return this.get(STORAGE_KEYS.RECENTS) || [];
  }

  static setRecentEmojis(emojis) {
    return this.set(STORAGE_KEYS.RECENTS, emojis);
  }

  // === Métodos específicos para Tema ===

  static getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME);
  }

  static setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  static removeTheme() {
    this.remove(STORAGE_KEYS.THEME);
  }

  // === Métodos específicos para Notificaciones ===

  static getSeenNotifications() {
    return new Set(this.get(STORAGE_KEYS.SEEN_NOTIFICATIONS) || []);
  }

  static setSeenNotifications(set) {
    return this.set(STORAGE_KEYS.SEEN_NOTIFICATIONS, [...set]);
  }

  // === Métodos para reportes de notificaciones ===

  static getLastMorningReport() {
    return localStorage.getItem(STORAGE_KEYS.LAST_MORNING);
  }

  static setLastMorningReport(date) {
    localStorage.setItem(STORAGE_KEYS.LAST_MORNING, date);
  }

  static getLastNoonReport() {
    return localStorage.getItem(STORAGE_KEYS.LAST_NOON);
  }

  static setLastNoonReport(date) {
    localStorage.setItem(STORAGE_KEYS.LAST_NOON, date);
  }

  static getLastEveningReport() {
    return localStorage.getItem(STORAGE_KEYS.LAST_EVENING);
  }

  static setLastEveningReport(date) {
    localStorage.setItem(STORAGE_KEYS.LAST_EVENING, date);
  }
}

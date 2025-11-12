// === MODELO DE DATOS DE APLICACIÓN - UNINOTE ===

export class AppData {
  constructor(data = {}) {
    this.documents = data.documents || [];
    this.favorites = data.favorites || [];
    this.activeDocument = data.activeDocument || null;
    this.defaultDocument = data.defaultDocument || null;
    this.documentPasswords = data.documentPasswords || {};
    this.universalPasswordHash = data.universalPasswordHash || null;
    this.appLockPasswordHash = data.appLockPasswordHash || null;
    this.isAppLockEnabled = data.isAppLockEnabled || false;
  }

  toJSON() {
    return {
      documents: this.documents,
      favorites: this.favorites,
      activeDocument: this.activeDocument,
      defaultDocument: this.defaultDocument,
      documentPasswords: this.documentPasswords,
      universalPasswordHash: this.universalPasswordHash,
      appLockPasswordHash: this.appLockPasswordHash,
      isAppLockEnabled: this.isAppLockEnabled
    };
  }

  addDocument(name) {
    if (!this.documents.includes(name)) {
      this.documents.push(name);
    }
  }

  removeDocument(name) {
    this.documents = this.documents.filter(d => d !== name);
    this.favorites = this.favorites.filter(f => f !== name);
    delete this.documentPasswords[name];
    if (this.defaultDocument === name) {
      this.defaultDocument = null;
    }
    if (this.activeDocument === name) {
      this.activeDocument = this.documents[0] || null;
    }
  }

  renameDocument(oldName, newName) {
    const index = this.documents.indexOf(oldName);
    if (index !== -1) {
      this.documents[index] = newName;
    }

    const favIndex = this.favorites.indexOf(oldName);
    if (favIndex !== -1) {
      this.favorites[favIndex] = newName;
    }

    if (this.documentPasswords[oldName]) {
      this.documentPasswords[newName] = this.documentPasswords[oldName];
      delete this.documentPasswords[oldName];
    }

    if (this.defaultDocument === oldName) {
      this.defaultDocument = newName;
    }

    if (this.activeDocument === oldName) {
      this.activeDocument = newName;
    }
  }

  toggleFavorite(name) {
    const index = this.favorites.indexOf(name);
    if (index === -1) {
      this.favorites.push(name);
    } else {
      this.favorites.splice(index, 1);
    }
  }

  setDocumentPassword(name, passwordHash) {
    this.documentPasswords[name] = passwordHash;
  }

  removeDocumentPassword(name) {
    delete this.documentPasswords[name];
  }
}

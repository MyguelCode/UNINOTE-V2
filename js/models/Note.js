// === MODELO DE NOTA - UNINOTE ===

import { NOTE_STATUS } from '../config/constants.js';
import { Utils } from '../core/utils.js';

export class Note {
  constructor(data = {}) {
    this.id = data.id || Utils.generateUUID();
    this.content = data.content || '';
    this.status = data.status || NOTE_STATUS.TODO;
    this.creationDate = data.creationDate || new Date().toISOString();
    this.dueDate = data.dueDate || null;
    this.icon = data.icon || '';
    this.children = (data.children || []).map(child => new Note(child));
    this.isArchived = data.isArchived || false;
    this.archivedTimestamp = data.archivedTimestamp || null;
    this.originalDoc = data.originalDoc || null;
    this.lockType = data.lockType || null;
    this.lockHint = data.lockHint || '';
    this.passwordHash = data.passwordHash || null;
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
      status: this.status,
      creationDate: this.creationDate,
      dueDate: this.dueDate,
      icon: this.icon,
      children: this.children.map(child => child.toJSON()),
      isArchived: this.isArchived,
      archivedTimestamp: this.archivedTimestamp,
      originalDoc: this.originalDoc,
      lockType: this.lockType,
      lockHint: this.lockHint,
      passwordHash: this.passwordHash
    };
  }

  addChild(note) {
    this.children.push(note);
  }

  removeChild(noteId) {
    this.children = this.children.filter(child => child.id !== noteId);
  }

  findById(id) {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.findById(id);
      if (found) return found;
    }
    return null;
  }

  archive(docName) {
    this.isArchived = true;
    this.archivedTimestamp = new Date().toISOString();
    this.originalDoc = docName;
  }

  unarchive() {
    this.isArchived = false;
    this.archivedTimestamp = null;
    this.originalDoc = null;
  }

  setLock(lockType, passwordHash, hint = '') {
    this.lockType = lockType;
    this.passwordHash = passwordHash;
    this.lockHint = hint;
  }

  removeLock() {
    this.lockType = null;
    this.passwordHash = null;
    this.lockHint = '';
  }
}

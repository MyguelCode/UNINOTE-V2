// === MODELO DE DOCUMENTO - UNINOTE ===

import { Note } from './Note.js';

export class Document {
  constructor(name, notes = []) {
    this.name = name;
    this.notes = notes.map(noteData => new Note(noteData));
    this.passwordHash = null;
  }

  toJSON() {
    return this.notes.map(note => note.toJSON());
  }

  addNote(note) {
    this.notes.push(note);
  }

  removeNote(noteId) {
    this.notes = this.notes.filter(note => note.id !== noteId);
  }

  findNoteById(id) {
    for (const note of this.notes) {
      if (note.id === id) return note;
      const found = note.findById(id);
      if (found) return found;
    }
    return null;
  }

  getActiveNotes() {
    return this.notes.filter(note => !note.isArchived);
  }

  getArchivedNotes() {
    const archived = [];
    const findArchived = (notes) => {
      notes.forEach(note => {
        if (note.isArchived) {
          archived.push(note);
        } else if (note.children) {
          findArchived(note.children);
        }
      });
    };
    findArchived(this.notes);
    return archived;
  }

  countNotes() {
    let total = 0;
    const count = (notes) => {
      notes.forEach(note => {
        if (!note.isArchived) {
          total++;
          if (note.children) count(note.children);
        }
      });
    };
    count(this.notes);
    return total;
  }
}

/**
 * NoteController - Controlador principal para operaciones CRUD de notas
 */

import { STATE } from '../config/state.js';
import { StateController } from './StateController.js';

export class NoteController {

  /**
   * Encontrar datos de una nota por ID
   */
  static findNoteData(notes, id) {
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      if (note.id === id) {
        return { note, parentArray: notes, index: i };
      }
      if (note.children) {
        const found = this.findNoteData(note.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Asegurar que haya al menos una nota
   */
  static ensureAtLeastOneNote() {
    const isDocLocked = STATE.appData.documentPasswords[STATE.currentDocumentName] &&
                        !STATE.unlockedDocuments.has(STATE.currentDocumentName);

    if (!isDocLocked && !STATE.isArchiveViewActive) {
      const activeNotes = STATE.currentNotesData.filter(n => !n.isArchived);
      if(activeNotes.length === 0) {
        const newNoteData = {
          id: crypto.randomUUID(),
          content: '',
          status: 'todo',
          creationDate: new Date().toISOString(),
          children: []
        };
        STATE.currentNotesData.push(newNoteData);

        // Crear en DOM si existe la función
        if (window.createNote) {
          const newNoteLi = window.createNote(STATE.DOM.notesList, null, true, newNoteData);
          if (window.renderNoteState) {
            window.renderNoteState(newNoteLi);
          }
          StateController.runUpdates();
        }
      }
    }
  }

  /**
   * Verificar estado del padre (auto-completado)
   */
  static checkParentStatus(parentNote) {
    if (!parentNote || (parentNote.dataset.lockType && !STATE.sessionUnlockedNotes.has(parentNote.dataset.id))) return;

    const sublist = parentNote.querySelector('ul.subnotes');
    if (!sublist || sublist.children.length === 0) return;

    const siblings = Array.from(sublist.children);
    const allDone = siblings.every(sibling =>
      sibling.dataset.status === 'done' ||
      (sibling.dataset.lockType && !STATE.sessionUnlockedNotes.has(sibling.dataset.id))
    );

    if (allDone) {
      parentNote.dataset.status = 'done';
      const statusBtn = parentNote.querySelector('[data-action="cycle-status"]');
      if (statusBtn) {
        statusBtn.textContent = '🟢';
      }
      StateController.runUpdates();

      const grandParentNote = parentNote.parentElement.closest('.note');
      if (grandParentNote) {
        this.checkParentStatus(grandParentNote);
      }
    }
  }
}

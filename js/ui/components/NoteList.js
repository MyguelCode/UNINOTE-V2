// === NOTE LIST - UNINOTE ===

import { STATE } from '../../config/state.js';

export class NoteList {
  static loadFromData(notesData) {
    // Código actual en legacy líneas 1414-1436
    console.log('NoteList: Usando versión legacy');
  }

  static clear() {
    if (STATE.DOM.notesList) {
      STATE.DOM.notesList.innerHTML = '';
    }
  }
}

// === DOCUMENT MENU - UNINOTE ===

import { STATE } from '../../config/state.js';

export class DocumentMenu {
  static render() {
    // Código actual en legacy líneas 2242-2264
    console.log('DocumentMenu: Usando versión legacy');
  }

  static toggle() {
    if (STATE.DOM.documentMenu) {
      STATE.DOM.documentMenu.classList.toggle('hidden');
    }
  }
}

// === BULK ACTIONS BAR - UNINOTE ===

import { STATE } from '../../config/state.js';

export class BulkActionsBar {
  static update() {
    // Código actual en legacy líneas 1595-1603
    const count = STATE.selectedNotes.size;
    if (STATE.DOM.selectionCounter) {
      STATE.DOM.selectionCounter.textContent = `${count} nota${count > 1 ? 's' : ''} seleccionada${count > 1 ? 's' : ''}`;
    }
    if (STATE.DOM.bulkActionsBar) {
      STATE.DOM.bulkActionsBar.classList.toggle('visible', count > 0);
    }
  }
}

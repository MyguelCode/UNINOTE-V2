// === SELECTION MANAGER - UNINOTE ===

import { STATE } from '../../config/state.js';

export class SelectionManager {
  static saveSelection() {
    // Código actual en legacy líneas 1348-1354
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      STATE.lastSelectionRange = selection.getRangeAt(0).cloneRange();
    }
  }

  static restoreSelection() {
    // Código actual en legacy líneas 1348-1354
    const selection = window.getSelection();
    if (STATE.lastSelectionRange) {
      selection.removeAllRanges();
      selection.addRange(STATE.lastSelectionRange);
    }
  }
}

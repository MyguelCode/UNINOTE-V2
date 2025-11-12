// === KEYBOARD HANDLER - UNINOTE ===

import { STATE } from '../../config/state.js';

export class KeyboardHandler {
  static init() {
    // Código actual en legacy líneas 2607-2676
    console.log('KeyboardHandler: Usando versión legacy');
  }

  static handleEnter(event) {
    // Enter: crear nota hermana
  }

  static handleTab(event) {
    // Tab: anidar nota
    // Shift+Tab: desanidar nota
  }

  static handleCtrlB(event) {
    // Ctrl+B: negrita
  }
}

// === ARCHIVE VIEW - UNINOTE ===

import { STATE } from '../../config/state.js';

export class ArchiveView {
  static render() {
    // Código actual en legacy líneas 1955-2084
    console.log('ArchiveView: Usando versión legacy');
  }

  static toggle() {
    STATE.isArchiveViewActive = !STATE.isArchiveViewActive;
    // Llamar render
  }
}

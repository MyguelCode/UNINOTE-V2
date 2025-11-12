/**
 * ArchiveController - Controlador para gestión de archivo
 */

import { STATE } from '../config/state.js';

export class ArchiveController {

  /**
   * Alternar vista de archivo
   */
  static toggleArchiveView() {
    STATE.isArchiveViewActive = !STATE.isArchiveViewActive;
    if (window.renderView) {
      window.renderView();
    }
  }

  /**
   * Renderizar vista de archivo
   */
  static async renderArchiveView() {
    // Delegar a ArchiveService
    if (window.ArchiveService && window.ArchiveService.renderArchiveTimeline) {
      await window.ArchiveService.renderArchiveTimeline();
    }
  }
}

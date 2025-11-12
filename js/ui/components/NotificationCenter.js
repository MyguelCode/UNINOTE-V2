// === NOTIFICATION CENTER - UNINOTE ===

import { STATE } from '../../config/state.js';

export class NotificationCenter {
  static populate(notes) {
    // Código actual en legacy líneas 1704-1718
    console.log('NotificationCenter: Usando versión legacy');
  }

  static show() {
    if (STATE.DOM.notificationCenterOverlay) {
      STATE.DOM.notificationCenterOverlay.classList.remove('hidden');
    }
  }

  static hide() {
    if (STATE.DOM.notificationCenterOverlay) {
      STATE.DOM.notificationCenterOverlay.classList.add('hidden');
    }
  }
}

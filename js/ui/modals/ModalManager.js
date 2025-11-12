// === MODAL MANAGER - UNINOTE ===

export class ModalManager {
  static show(modalElement) {
    if (modalElement) {
      modalElement.classList.remove('hidden');
    }
  }

  static hide(modalElement) {
    if (modalElement) {
      modalElement.classList.add('hidden');
    }
  }

  static showOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    this.show(overlay);
  }

  static hideOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    this.hide(overlay);
  }
}

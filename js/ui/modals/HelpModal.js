// === HELP MODAL - UNINOTE ===

export class HelpModal {
  static show() {
    const overlay = document.getElementById('help-modal-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }

  static hide() {
    const overlay = document.getElementById('help-modal-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }
}

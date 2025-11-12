// === CONTEXT MENU - UNINOTE ===

export class ContextMenu {
  static show(x, y, noteElement) {
    const menu = document.getElementById('context-menu');
    if (menu) {
      menu.style.display = 'block';
      menu.style.top = `${y}px`;
      menu.style.left = `${x}px`;
    }
  }

  static hide() {
    const menu = document.getElementById('context-menu');
    if (menu) {
      menu.style.display = 'none';
    }
  }
}

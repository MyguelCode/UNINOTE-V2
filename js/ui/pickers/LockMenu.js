// === LOCK MENU - UNINOTE ===

export class LockMenu {
  static show(x, y, noteElement) {
    const menu = document.getElementById('lock-menu');
    if (menu) {
      menu.style.display = 'block';
      menu.style.top = `${y}px`;
      menu.style.left = `${x}px`;
    }
  }

  static hide() {
    const menu = document.getElementById('lock-menu');
    if (menu) {
      menu.style.display = 'none';
    }
  }
}

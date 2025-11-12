// === FORMATTING TOOLBAR - UNINOTE ===

export class FormattingToolbar {
  static show() {
    // Código actual en legacy líneas 1313-1337
    console.log('FormattingToolbar: Usando versión legacy');
  }

  static hide() {
    const toolbar = document.getElementById('formatting-toolbar');
    if (toolbar) {
      toolbar.style.display = 'none';
    }
  }
}

// === PASSWORD MODAL - UNINOTE ===

export class PasswordModal {
  static showSetPassword(title, showHint = false) {
    // Código actual en legacy líneas 3148-3184
    return new Promise(resolve => {
      console.log('PasswordModal: Usando versión legacy');
      resolve({ newPass: null, newHint: '' });
    });
  }

  static showUnlock(docName, purpose = 'unlock') {
    // Código actual en legacy líneas 2086-2123
    return new Promise(resolve => {
      console.log('PasswordModal: Usando versión legacy');
      resolve(false);
    });
  }
}

/**
 * SecurityService - Gestión de seguridad y contraseñas
 */

import { STATE } from '../config/state.js';

export class SecurityService {

  /**
   * Solicitar contraseña de documento
   */
  static async promptForDocumentPassword(docName, purpose = 'unlock') {
    return new Promise(async (resolve) => {
      const modal = document.getElementById('unlock-modal-overlay');
      const title = purpose === 'unlock' ? `Desbloquear Uninote "${docName}"` : `Confirmar para quitar contraseña`;
      modal.querySelector('h2').textContent = title;
      const passInput = document.getElementById('unlock-password-input');
      passInput.value = '';
      modal.classList.remove('hidden');
      passInput.focus();
      const confirmBtn = document.getElementById('unlock-confirm-btn');
      const cancelBtn = document.getElementById('unlock-cancel-btn');

      const cleanup = (result) => {
        modal.classList.add('hidden');
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        passInput.onkeydown = null;
        resolve(result);
      };

      const handleConfirm = async () => {
        const hashData = STATE.appData.documentPasswords[docName];
        const isCorrect = await this.verifyPassword(passInput.value, hashData);
        if (isCorrect) {
          // Actualizar a nuevo formato si es necesario
          if(typeof hashData === 'string'){
            STATE.appData.documentPasswords[docName] = await this.hashPasswordWithSalt(passInput.value);
            if (window.saveAppDataAsync) {
              await window.saveAppDataAsync(STATE.appData);
            }
          }
          cleanup(true);
        } else {
          // Mostrar notificación de error
          if (window.showNotification) {
            window.showNotification('Contraseña incorrecta', 'error');
          }
          cleanup(false);
        }
      };

      confirmBtn.onclick = handleConfirm;
      cancelBtn.onclick = () => cleanup(false);
      passInput.onkeydown = (e) => {
        if (e.key === 'Enter') handleConfirm();
        else if (e.key === 'Escape') cancelBtn.click();
      };
    });
  }

  /**
   * Mostrar modal para establecer contraseña
   */
  static showSetPasswordModal(title, showHint = false) {
    return new Promise(resolve => {
      const modal = document.getElementById('set-password-modal-overlay');
      modal.querySelector('#set-password-title').textContent = title;
      modal.querySelector('#set-password-hint-container').style.display = showHint ? 'block' : 'none';
      const passInput = modal.querySelector('#set-password-input');
      const confirmInput = modal.querySelector('#set-password-confirm-input');
      const hintInput = modal.querySelector('#set-password-hint-input');
      [passInput.value, confirmInput.value, hintInput.value] = ['', '', ''];

      modal.classList.remove('hidden');
      passInput.focus();

      const saveBtn = modal.querySelector('#save-password-btn');
      const cancelBtn = modal.querySelector('#cancel-password-btn');

      const cleanupAndResolve = (result) => {
        modal.classList.add('hidden');
        saveBtn.onclick = null;
        cancelBtn.onclick = null;
        resolve(result);
      };

      saveBtn.onclick = () => {
        if (passInput.value !== confirmInput.value) {
          if (window.showAlertModal) {
            window.showAlertModal('Error', 'Las contraseñas no coinciden.');
          }
          return;
        }
        if (!passInput.value) {
          if (window.showAlertModal) {
            window.showAlertModal('Error', 'La contraseña no puede estar vacía.');
          }
          return;
        }
        cleanupAndResolve({newPass: passInput.value, newHint: hintInput.value});
      };
      cancelBtn.onclick = () => cleanupAndResolve({});
    });
  }

  /**
   * Hash de contraseña con PBKDF2
   */
  static bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
  }

  static async hashPasswordWithSalt(password) {
    if (!password) return null;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iterations = 100000;
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );

    return {
      hash: this.bufferToHex(derivedBits),
      salt: this.bufferToHex(salt),
      iterations: iterations
    };
  }

  static async verifyPassword(password, storedHashData) {
    if (!password || !storedHashData) return false;

    // Backward compatibility para SHA-256 simple
    if (typeof storedHashData === 'string') {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashHex = this.bufferToHex(hashBuffer);
      return hashHex === storedHashData;
    }

    const { hash, salt, iterations } = storedHashData;
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: this.hexToBuffer(salt), iterations: iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );

    return this.bufferToHex(derivedBits) === hash;
  }

  /**
   * Gestionar contraseñas (crear, cambiar, eliminar)
   */
  static async managePassword(type, action) {
    const isMaster = type === 'master';
    const currentHash = isMaster ? STATE.appData.appLockPasswordHash : STATE.appData.universalPasswordHash;
    const passwordName = isMaster ? 'de bloqueo total' : 'universal';

    if (action === 'create' || action === 'change') {
      // Check if trying to create when password already exists
      if (action === 'create' && currentHash) {
        window.showNotification(`Ya existe una contraseña ${passwordName}. Usa "Cambiar Contraseña" para modificarla.`, 'warning');
        return;
      }

      if (action === 'change') {
        const oldPass = await window.showPromptModal('Verificación de Seguridad', `Introduce tu contraseña ${passwordName} ACTUAL:`, {type: 'password'});
        if (!oldPass || !(await this.verifyPassword(oldPass, currentHash))) {
          window.showNotification('Contraseña de verificación incorrecta.', 'error');
          return;
        }
      }
      const { newPass } = await this.showSetPasswordModal(`Nueva Contraseña ${passwordName}`);
      if (newPass) {
        const newHash = await this.hashPasswordWithSalt(newPass);
        if (isMaster) STATE.appData.appLockPasswordHash = newHash;
        else STATE.appData.universalPasswordHash = newHash;

        if (window.saveAppDataAsync) {
          await window.saveAppDataAsync(STATE.appData);
        }
        window.showNotification(`Contraseña ${passwordName} ${action === 'create' ? 'creada' : 'cambiada'} con éxito.`);
      }
    } else if (action === 'remove') {
      const oldPass = await window.showPromptModal('Verificación de Seguridad', `Introduce tu contraseña ${passwordName} ACTUAL para quitarla:`, {type: 'password'});
      if (!oldPass || !(await this.verifyPassword(oldPass, currentHash))) {
        window.showNotification('Contraseña de verificación incorrecta.', 'error');
        return;
      }
      const confirmed = await window.showConfirmationModal('Quitar Contraseña', `¿Estás seguro de que quieres quitar la contraseña ${passwordName}?`);
      if (confirmed) {
        if (isMaster) {
          STATE.appData.appLockPasswordHash = null;
          STATE.appData.isAppLockEnabled = false;
        } else {
          STATE.appData.universalPasswordHash = null;
        }
        if (window.saveAppDataAsync) {
          await window.saveAppDataAsync(STATE.appData);
        }
        window.showNotification(`Contraseña ${passwordName} eliminada.`);
      }
    }
  }
}

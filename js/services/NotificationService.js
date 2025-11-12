/**
 * NotificationService - Gestión de notificaciones, alertas y modales
 */

import { STATE } from '../config/state.js';

export class NotificationService {

  /**
   * Mostrar notificación toast
   */
  static showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    STATE.DOM.notificationArea.appendChild(notification);
    if(type === 'error'){
      notification.style.animationPlayState = 'running, running';
    }
    setTimeout(() => { notification.remove(); }, 3900);
  }

  /**
   * Mostrar modal de alerta
   */
  static showAlertModal(title, message) {
    return new Promise(resolve => {
      document.getElementById('alert-title').textContent = title;
      document.getElementById('alert-message').textContent = message;
      const alertOverlay = document.getElementById('alert-modal-overlay');
      alertOverlay.classList.remove('hidden');
      const okBtn = document.getElementById('alert-ok-btn');
      okBtn.onclick = () => {
        alertOverlay.classList.add('hidden');
        resolve();
      };
    });
  }

  /**
   * Mostrar modal de confirmación
   */
  static showConfirmationModal(title, message, options = {}) {
    return new Promise(resolve => {
      document.getElementById('confirmation-title').textContent = title;
      document.getElementById('confirmation-message').innerHTML = message;
      const confirmBtn = document.getElementById('confirmation-confirm-btn');
      const cancelBtn = document.getElementById('confirmation-cancel-btn');
      confirmBtn.textContent = options.confirmText || 'Confirmar';
      cancelBtn.textContent = options.cancelText || 'Cancelar';

      const confirmationModalOverlay = document.getElementById('confirmation-modal-overlay');
      confirmationModalOverlay.classList.remove('hidden');

      const cleanup = () => {
        confirmationModalOverlay.classList.add('hidden');
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
      };

      confirmBtn.onclick = () => { cleanup(); resolve(true); };
      cancelBtn.onclick = () => { cleanup(); resolve(false); };
    });
  }

  /**
   * Mostrar modal de prompt (input)
   */
  static showPromptModal(title, message, options = {}) {
    return new Promise(resolve => {
      document.getElementById('prompt-title').textContent = title;
      document.getElementById('prompt-message').textContent = message;
      const input = document.getElementById('prompt-input');
      input.value = options.defaultValue || '';
      input.type = options.type || 'text';
      input.placeholder = options.placeholder || '';

      const promptOverlay = document.getElementById('prompt-modal-overlay');
      promptOverlay.classList.remove('hidden');
      input.focus();
      input.select();

      const confirmBtn = document.getElementById('prompt-confirm-btn');
      const cancelBtn = document.getElementById('prompt-cancel-btn');

      const cleanup = () => {
        promptOverlay.classList.add('hidden');
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        input.onkeydown = null;
      };

      confirmBtn.onclick = () => { cleanup(); resolve(input.value); };
      cancelBtn.onclick = () => { cleanup(); resolve(null); };
      input.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmBtn.click(); }
        else if (e.key === 'Escape') cancelBtn.click();
      };
    });
  }

  /**
   * Mostrar modal de duplicación
   */
  static showDuplicateModal() {
    return new Promise(resolve => {
      const duplicateOverlay = document.getElementById('duplicate-modal-overlay');
      const onlyNoteBtn = document.getElementById('duplicate-only-note-btn');
      const withChildrenBtn = document.getElementById('duplicate-with-children-btn');
      const cancelBtn = document.getElementById('duplicate-cancel-btn');

      duplicateOverlay.classList.remove('hidden');

      const cleanup = () => {
        duplicateOverlay.classList.add('hidden');
        onlyNoteBtn.onclick = null;
        withChildrenBtn.onclick = null;
        cancelBtn.onclick = null;
        duplicateOverlay.onclick = null; // Limpiar event listener del overlay
      };

      // Click en overlay (fuera del modal-box) para cancelar
      duplicateOverlay.onclick = (e) => {
        if (e.target === duplicateOverlay) {
          cleanup();
          resolve(null);
        }
      };

      onlyNoteBtn.onclick = () => { cleanup(); resolve('only'); };
      withChildrenBtn.onclick = () => { cleanup(); resolve('with-children'); };
      cancelBtn.onclick = () => { cleanup(); resolve(null); };
    });
  }

  /**
   * Mostrar notificación nativa del navegador
   */
  static showNativeNotification(title, options) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

  /**
   * Mostrar modal de opciones de importación
   */
  static promptImportOption(importType) {
    return new Promise(resolve => {
      const importTitle = document.getElementById('import-title');
      const importMessage = document.getElementById('import-message');
      const replaceBtn = document.getElementById('import-action-replace');
      const appendBtn = document.getElementById('import-action-append');
      const mergeBtn = document.getElementById('import-action-merge');

      [replaceBtn, appendBtn, mergeBtn].forEach(btn => btn.style.display = 'none');

      if (importType === 'total') {
        importTitle.textContent = "Importar Backup Total";
        importMessage.innerHTML = "Este es un <strong>Backup Total</strong>. ¿Cómo deseas proceder?";
        replaceBtn.textContent = "Reemplazar Todo";
        mergeBtn.textContent = "Fusionar con Existente";
        replaceBtn.style.display = 'inline-block';
        mergeBtn.style.display = 'inline-block';
      } else { // 'legacy'
        importTitle.textContent = "Importar Notas";
        importMessage.textContent = `¿Cómo deseas importar estas notas?`;
        replaceBtn.textContent = "Reemplazar notas actuales";
        appendBtn.textContent = "Agregar al final";
        replaceBtn.style.display = 'inline-block';
        appendBtn.style.display = 'inline-block';
      }

      const importModalOverlay = document.getElementById('import-modal-overlay');
      importModalOverlay.classList.remove('hidden');

      const handleChoice = (choice) => {
        importModalOverlay.classList.add('hidden');
        resolve(choice);
      };

      replaceBtn.onclick = () => handleChoice('replace');
      appendBtn.onclick = () => handleChoice('append');
      mergeBtn.onclick = () => handleChoice('merge');
      document.getElementById('import-action-cancel').onclick = () => handleChoice('cancel');
    });
  }
}

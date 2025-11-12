/**
 * securityEvents.js - Security and password management event handlers
 */

import { STATE } from '../config/state.js';
import { StateController } from '../controllers/StateController.js';
import { NoteRenderer } from '../ui/NoteRenderer.js';
import { SecurityService } from '../services/SecurityService.js';
import { NoteController } from '../controllers/NoteController.js';

export function initializeSecurityEvents() {
  const lockMenu = document.getElementById('lock-menu');
  const unlockModalOverlay = document.getElementById('unlock-modal-overlay');
  const unlockPasswordInput = document.getElementById('unlock-password-input');
  const unlockConfirmBtn = document.getElementById('unlock-confirm-btn');
  const unlockCancelBtn = document.getElementById('unlock-cancel-btn');
  const appSettingsBtn = document.getElementById('app-settings-btn');
  const appLockEnableToggle = document.getElementById('app-lock-enable-toggle');

  // Lock menu click handler
  lockMenu.addEventListener('click', async (e) => {
    if (!STATE.activeNoteForLock) return;

    const noteToProcess = STATE.activeNoteForLock;
    const action = e.target.dataset.action;
    STATE.activeNoteForLock = null;
    lockMenu.style.display = 'none';

    // Unlock or remove lock - show password modal
    if (action === 'unlock' || action === 'remove-lock') {
      STATE.activeNoteForLock = noteToProcess;
      const title = action === 'unlock' ? 'Desbloquear Nota' : 'Confirmar para quitar bloqueo';
      unlockModalOverlay.querySelector('h2').textContent = title;
      unlockPasswordInput.value = '';
      unlockModalOverlay.classList.remove('hidden');
      unlockPasswordInput.focus();
      return;
    }

    // Relock note
    if (action === 'relock') {
      STATE.sessionUnlockedNotes.delete(noteToProcess.dataset.id);
      NoteRenderer.renderNoteState(noteToProcess);
      StateController.runUpdates();

      // Guardar documento para persistir el re-bloqueo
      await window.DocumentController.saveCurrentDocument();
      return;
    }

    // Apply lock with specific type
    const lockType = action.split('-')[1];

    const applyLock = async (hash, type) => {
      const editable = noteToProcess.querySelector('.editable-note');
      const lockedContent = editable.innerHTML;
      const lockHint = editable.textContent.substring(0, 30).trim() || "Nota bloqueada";

      // Actualizar en el DOM
      noteToProcess.dataset.lockedContent = lockedContent;
      noteToProcess.dataset.lockType = type;
      noteToProcess.dataset.lockHint = lockHint;
      noteToProcess.dataset.passwordHash = JSON.stringify(hash);

      // IMPORTANTE: Actualizar también en noteData para que persista
      const noteId = noteToProcess.dataset.id;
      const { note: noteData } = NoteController.findNoteData(STATE.currentNotesData, noteId) || {};
      if (noteData) {
        noteData.lockType = type;
        noteData.lockHint = lockHint;
        noteData.passwordHash = hash;
      }

      NoteRenderer.renderNoteState(noteToProcess);
      StateController.runUpdates();

      // Guardar documento para persistir el bloqueo
      await window.DocumentController.saveCurrentDocument();
      window.NotificationService.showNotification('Nota bloqueada.');
    };

    if (lockType === 'universal') {
      await applyLock(STATE.appData.universalPasswordHash, 'universal');
    } else if (lockType === 'document') {
      await applyLock(STATE.appData.documentPasswords[STATE.currentDocumentName], 'document');
    } else if (lockType === 'exclusive') {
      const { newPass, newHint } = await SecurityService.showSetPasswordModal('Crear Bloqueo Exclusivo', true);
      if (newPass) {
        const hashData = await SecurityService.hashPasswordWithSalt(newPass);
        const noteToLock = noteToProcess;
        const lockedContent = noteToLock.querySelector('.editable-note').innerHTML;
        const hint = newHint || 'Contenido bloqueado';

        // Actualizar en el DOM
        noteToLock.dataset.lockedContent = lockedContent;
        noteToLock.dataset.lockType = 'exclusive';
        noteToLock.dataset.lockHint = hint;
        noteToLock.dataset.passwordHash = JSON.stringify(hashData);

        // IMPORTANTE: Actualizar también en noteData para que persista
        const noteId = noteToLock.dataset.id;
        const { note: noteData } = NoteController.findNoteData(STATE.currentNotesData, noteId) || {};
        if (noteData) {
          noteData.lockType = 'exclusive';
          noteData.lockHint = hint;
          noteData.passwordHash = hashData;
        }

        NoteRenderer.renderNoteState(noteToLock);
        StateController.runUpdates();

        // Guardar documento para persistir el bloqueo
        await window.DocumentController.saveCurrentDocument();
        window.NotificationService.showNotification('Nota bloqueada con contraseña exclusiva.');
      }
    }
  });

  // Unlock confirm button
  unlockConfirmBtn.addEventListener('click', async () => {
    if (!STATE.activeNoteForLock) return;

    const noteToProcess = STATE.activeNoteForLock;
    const actionTitle = unlockModalOverlay.querySelector('h2').textContent;
    const isRemovingLock = actionTitle.includes('quitar');

    const pass = unlockPasswordInput.value;
    const hashData = JSON.parse(noteToProcess.dataset.passwordHash);

    const isCorrect = await SecurityService.verifyPassword(pass, hashData);
    unlockPasswordInput.value = '';

    if (isCorrect) {
      unlockModalOverlay.classList.add('hidden');

      if (isRemovingLock) {
        window.permanentlyRemoveLock(noteToProcess);
        window.NotificationService.showNotification('Bloqueo de nota eliminado permanentemente.');
      } else {
        STATE.sessionUnlockedNotes.add(noteToProcess.dataset.id);

        // Upgrade old password format
        if (typeof hashData === 'string') {
          const { note } = NoteController.findNoteData(STATE.currentNotesData, noteToProcess.dataset.id);
          if (note) {
            note.passwordHash = await SecurityService.hashPasswordWithSalt(pass);
            StateController.runUpdates();
            window.NotificationService.showNotification('Contraseña de nota actualizada a nuevo formato de seguridad.');
          }
        }

        NoteRenderer.renderNoteState(noteToProcess);
        StateController.runUpdates();
        window.NotificationService.showNotification('Nota desbloqueada.');
        noteToProcess.querySelector('.editable-note').focus();
      }

      STATE.activeNoteForLock = null;
    } else {
      window.NotificationService.showNotification('Contraseña incorrecta.', 'error');
      unlockPasswordInput.style.animation = 'shake 0.5s';
      setTimeout(() => { unlockPasswordInput.style.animation = '' }, 500);
    }
  });

  // Unlock cancel button
  unlockCancelBtn.addEventListener('click', () => {
    unlockModalOverlay.classList.add('hidden');
    STATE.activeNoteForLock = null;
  });

  // App settings button
  appSettingsBtn.addEventListener('click', () => {
    document.getElementById('app-settings-modal-overlay').classList.remove('hidden');
  });

  // Cancel app settings button
  document.getElementById('cancel-app-settings-btn').addEventListener('click', () => {
    document.getElementById('app-settings-modal-overlay').classList.add('hidden');
  });

  // App lock enable toggle
  appLockEnableToggle.addEventListener('change', async function (e) {
    const isChecked = e.target.checked;
    const appLockControls = document.getElementById('app-lock-password-container');

    if (isChecked) {
      if (!STATE.appData.masterPasswordHash) {
        const { newPass } = await SecurityService.showSetPasswordModal('Crear Contraseña Maestra', false);
        if (newPass) {
          STATE.appData.masterPasswordHash = await SecurityService.hashPasswordWithSalt(newPass);
          STATE.appData.isAppLockEnabled = true;
          if (window.saveAppDataAsync) {
            await window.saveAppDataAsync(STATE.appData);
          }
          appLockControls.classList.remove('hidden');
          window.NotificationService.showNotification('Bloqueo de aplicación activado.');
        } else {
          e.target.checked = false;
        }
      } else {
        STATE.appData.isAppLockEnabled = true;
        if (window.saveAppDataAsync) {
          await window.saveAppDataAsync(STATE.appData);
        }
        appLockControls.classList.remove('hidden');
        window.NotificationService.showNotification('Bloqueo de aplicación activado.');
      }
    } else {
      const confirmed = await window.NotificationService.showConfirmationModal(
        'Desactivar Bloqueo de Aplicación',
        '¿Deseas desactivar completamente el bloqueo de aplicación? Esta acción NO eliminará la contraseña maestra.'
      );

      if (confirmed) {
        STATE.appData.isAppLockEnabled = false;
        if (window.saveAppDataAsync) {
          await window.saveAppDataAsync(STATE.appData);
        }
        appLockControls.classList.add('hidden');
        window.NotificationService.showNotification('Bloqueo de aplicación desactivado.');
      } else {
        e.target.checked = true;
      }
    }
  });

  // Password management buttons
  document.getElementById('app-lock-create-btn').addEventListener('click', async () => {
    await SecurityService.managePassword('master', 'create');
    updatePasswordFieldsDisplay();
    updatePasswordButtonsVisibility();
  });
  document.getElementById('app-lock-change-btn').addEventListener('click', async () => {
    await SecurityService.managePassword('master', 'change');
    updatePasswordFieldsDisplay();
    updatePasswordButtonsVisibility();
  });
  document.getElementById('app-lock-remove-btn').addEventListener('click', async () => {
    await SecurityService.managePassword('master', 'remove');
    updatePasswordFieldsDisplay();
    updatePasswordButtonsVisibility();
  });
  document.getElementById('universal-create-btn').addEventListener('click', async () => {
    await SecurityService.managePassword('universal', 'create');
    updatePasswordFieldsDisplay();
    updatePasswordButtonsVisibility();
  });
  document.getElementById('universal-change-btn').addEventListener('click', async () => {
    await SecurityService.managePassword('universal', 'change');
    updatePasswordFieldsDisplay();
    updatePasswordButtonsVisibility();
  });
  document.getElementById('universal-remove-btn').addEventListener('click', async () => {
    await SecurityService.managePassword('universal', 'remove');
    updatePasswordFieldsDisplay();
    updatePasswordButtonsVisibility();
  });

  // Update password fields on modal open
  appSettingsBtn.addEventListener('click', () => {
    updatePasswordFieldsDisplay();
    updatePasswordButtonsVisibility();
    // Also update toggle state
    if (appLockEnableToggle) {
      appLockEnableToggle.checked = !!STATE.appData.isAppLockEnabled;
    }
  });

  // Lock App Now button
  const lockAppNowBtn = document.getElementById('lock-app-now-btn');
  if (lockAppNowBtn) {
    lockAppNowBtn.addEventListener('click', () => {
      if (!STATE.appData.masterPasswordHash) {
        window.NotificationService.showNotification('Debes crear una contraseña de bloqueo total primero.', 'warning');
        return;
      }
      lockApp(true);
      // Close settings modal
      document.getElementById('app-settings-modal-overlay').classList.add('hidden');
    });
  }

  // App unlock button
  const appUnlockConfirmBtn = document.getElementById('app-unlock-confirm-btn');
  const appUnlockPasswordInput = document.getElementById('app-unlock-password-input');
  const appLockModalOverlay = document.getElementById('app-lock-modal-overlay');

  console.log('🔐 UNLOCK HANDLER: Botones encontrados', {
    unlockBtn: !!appUnlockConfirmBtn,
    passwordInput: !!appUnlockPasswordInput,
    modalOverlay: !!appLockModalOverlay
  });

  if (appUnlockConfirmBtn && appUnlockPasswordInput) {
    appUnlockConfirmBtn.addEventListener('click', async () => {
      console.log('🔐 UNLOCK: Click en botón desbloquear');
      const password = appUnlockPasswordInput.value;
      console.log('🔐 UNLOCK: Password ingresado:', password ? `${password.length} caracteres` : 'VACÍO');

      if (!password) {
        console.log('❌ UNLOCK: Password vacío, abortando');
        return;
      }

      console.log('🔐 UNLOCK: Verificando contraseña...');
      console.log('🔐 UNLOCK: STATE.appData:', STATE.appData ? 'existe' : 'NULL');
      console.log('🔐 UNLOCK: masterPasswordHash:', STATE.appData?.masterPasswordHash ? 'existe' : 'NULL');

      const isCorrect = await SecurityService.verifyPassword(password, STATE.appData.masterPasswordHash);
      console.log('🔐 UNLOCK: Resultado verificación:', isCorrect ? '✅ CORRECTA' : '❌ INCORRECTA');

      if (isCorrect) {
        console.log('✅ UNLOCK: Contraseña correcta, desbloqueando...');
        appUnlockPasswordInput.value = '';
        unlockApp();
        window.NotificationService.showNotification('App desbloqueada correctamente.', 'success');
      } else {
        console.log('❌ UNLOCK: Contraseña incorrecta');
        window.NotificationService.showNotification('Contraseña incorrecta.', 'error');
        appUnlockPasswordInput.style.animation = 'shake 0.5s';
        setTimeout(() => { appUnlockPasswordInput.style.animation = '' }, 500);
        appUnlockPasswordInput.value = '';
        appUnlockPasswordInput.focus();
      }
    });

    // Allow Enter key to unlock
    appUnlockPasswordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        appUnlockConfirmBtn.click();
      }
    });
  }

  // Prevent back button when locked
  window.addEventListener('popstate', (e) => {
    if (STATE.isAppLocked) {
      e.preventDefault();
      history.pushState(null, '', location.href);
      window.NotificationService.showNotification('La app está bloqueada. Introduce tu contraseña para desbloquear.', 'warning');
    }
  });

  // Initialize password fields display and toggle state
  updatePasswordFieldsDisplay();
  updatePasswordButtonsVisibility();
  if (appLockEnableToggle && STATE.appData) {
    appLockEnableToggle.checked = !!STATE.appData.isAppLockEnabled;
  }

  // Check if app should be locked on load
  checkAppLockOnLoad();
}

/**
 * Lock the app - show lock screen and save state
 */
function lockApp(saveState = false) {
  const appLockModalOverlay = document.getElementById('app-lock-modal-overlay');
  const appUnlockPasswordInput = document.getElementById('app-unlock-password-input');
  const mainContent = document.querySelector('main');
  const header = document.querySelector('header');
  const aside = document.querySelector('aside');

  if (appLockModalOverlay && appUnlockPasswordInput) {
    // Hide all content
    if (mainContent) mainContent.style.display = 'none';
    if (header) header.style.display = 'none';
    if (aside) aside.style.display = 'none';

    // Show lock screen
    appLockModalOverlay.style.display = 'flex';

    // Set locked state
    STATE.isAppLocked = true;

    // Push history state to prevent back button
    history.pushState(null, '', location.href);

    // Save lock state if manual lock
    if (saveState) {
      sessionStorage.setItem('appManuallyLocked', 'true');
    }

    setTimeout(() => {
      appUnlockPasswordInput.focus();
    }, 100);
  }
}

/**
 * Unlock the app - hide lock screen and restore content
 */
function unlockApp() {
  console.log('🔓 UNLOCK: Desbloqueando app...');
  const appLockModalOverlay = document.getElementById('app-lock-modal-overlay');
  const mainContent = document.querySelector('main');
  const header = document.querySelector('header');
  const aside = document.querySelector('aside');

  if (appLockModalOverlay) {
    // Hide lock screen
    appLockModalOverlay.style.display = 'none';
    console.log('🔓 UNLOCK: Modal ocultado');

    // Show all content
    if (mainContent) mainContent.style.display = 'block';
    if (header) header.style.display = 'flex';
    if (aside) aside.style.display = 'block';
    console.log('🔓 UNLOCK: Contenido mostrado');

    // Remove pre-locked classes
    document.documentElement.classList.remove('pre-locked');
    document.body.classList.remove('pre-locked');
    console.log('🔓 UNLOCK: Clases pre-locked removidas');

    // Clear locked state
    STATE.isAppLocked = false;
    sessionStorage.removeItem('appManuallyLocked');
    console.log('🔓 UNLOCK: Estado limpiado, app desbloqueada');
  }
}

/**
 * Check if app should be locked on page load
 */
function checkAppLockOnLoad() {
  // Check if manually locked in this session
  const wasManuallyLocked = sessionStorage.getItem('appManuallyLocked') === 'true';

  // Check if app lock is enabled and there's a password
  const hasAppLock = STATE.appData && STATE.appData.isAppLockEnabled && STATE.appData.masterPasswordHash;

  if (wasManuallyLocked && hasAppLock) {
    // Hide content IMMEDIATELY before any rendering happens
    const mainContent = document.querySelector('main');
    const header = document.querySelector('header');
    const aside = document.querySelector('aside');

    if (mainContent) mainContent.style.display = 'none';
    if (header) header.style.display = 'none';
    if (aside) aside.style.display = 'none';

    // Re-lock the app immediately (no timeout)
    lockApp(false); // Don't save again, already in session storage
  }
}

/**
 * Update visibility of password management buttons
 */
function updatePasswordButtonsVisibility() {
  const appLockPasswordContainer = document.getElementById('app-lock-password-container');
  const appLockCreateBtn = document.getElementById('app-lock-create-btn');
  const appLockChangeBtn = document.getElementById('app-lock-change-btn');
  const appLockRemoveBtn = document.getElementById('app-lock-remove-btn');

  const universalCreateBtn = document.getElementById('universal-create-btn');
  const universalChangeBtn = document.getElementById('universal-change-btn');
  const universalRemoveBtn = document.getElementById('universal-remove-btn');

  // Show/hide master password buttons based on whether password exists
  if (appLockCreateBtn && appLockChangeBtn && appLockRemoveBtn) {
    const hasMasterPassword = STATE.appData && STATE.appData.masterPasswordHash;

    if (hasMasterPassword) {
      appLockCreateBtn.style.display = 'none';
      appLockChangeBtn.style.display = 'inline-block';
      appLockRemoveBtn.style.display = 'inline-block';
    } else {
      appLockCreateBtn.style.display = 'inline-block';
      appLockChangeBtn.style.display = 'none';
      appLockRemoveBtn.style.display = 'none';
    }
  }

  // Show/hide universal password buttons
  if (universalCreateBtn && universalChangeBtn && universalRemoveBtn) {
    const hasUniversalPassword = STATE.appData && STATE.appData.universalPasswordHash;

    if (hasUniversalPassword) {
      universalCreateBtn.style.display = 'none';
      universalChangeBtn.style.display = 'inline-block';
      universalRemoveBtn.style.display = 'inline-block';
    } else {
      universalCreateBtn.style.display = 'inline-block';
      universalChangeBtn.style.display = 'none';
      universalRemoveBtn.style.display = 'none';
    }
  }

  // Always show password container if there's a password OR if lock is enabled
  if (appLockPasswordContainer) {
    const shouldShow = (STATE.appData && STATE.appData.masterPasswordHash) ||
                       (STATE.appData && STATE.appData.isAppLockEnabled);
    appLockPasswordContainer.style.display = shouldShow ? 'block' : 'none';
  }
}

/**
 * Update password fields to show asterisks when password is set
 */
function updatePasswordFieldsDisplay() {
  const masterPasswordInput = document.getElementById('app-lock-master-password-input');
  const universalPasswordInput = document.getElementById('universal-password-input');

  if (masterPasswordInput) {
    if (STATE.appData.masterPasswordHash) {
      masterPasswordInput.value = '••••••••••';
      masterPasswordInput.style.color = 'var(--text-color)';
    } else {
      masterPasswordInput.value = '';
      masterPasswordInput.placeholder = 'No configurada';
    }
  }

  if (universalPasswordInput) {
    if (STATE.appData.universalPasswordHash) {
      universalPasswordInput.value = '••••••••••';
      universalPasswordInput.style.color = 'var(--text-color)';
    } else {
      universalPasswordInput.value = '';
      universalPasswordInput.placeholder = 'No configurada';
    }
  }
}

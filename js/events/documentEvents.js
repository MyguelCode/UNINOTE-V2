/**
 * documentEvents.js - Document (Uninote) management event handlers
 */

import { STATE } from '../config/state.js';
import { DocumentController } from '../controllers/DocumentController.js';
import { NoteRenderer } from '../ui/NoteRenderer.js';

export function initializeDocumentEvents() {
  const documentTitle = document.getElementById('document-title');
  const documentMenu = document.getElementById('document-menu');
  const tabsContainer = document.getElementById('tabs-container');
  const relockDocBtn = document.getElementById('relock-doc-btn');

  // Document title click - Toggle menu
  documentTitle.addEventListener('click', () => {
    documentMenu.classList.toggle('hidden');
  });

  // Document menu click handler
  documentMenu.addEventListener('click', async (e) => {
    const targetLi = e.target.closest('li');
    const star = e.target.closest('.favorite-star');

    // Toggle favorite star
    if (star) {
      e.stopPropagation();
      if (window.toggleFavorite) {
        window.toggleFavorite(star.parentElement.dataset.docName);
      }
      return;
    }

    if (targetLi) {
      const action = targetLi.dataset.action;
      const docName = targetLi.dataset.docName;
      documentMenu.classList.add('hidden');

      if (action) {
        switch (action) {
          case 'create':
            await DocumentController.createNewDocument();
            break;

          case 'rename':
            await window.renameCurrentDocument();
            break;

          case 'delete':
            await window.deleteCurrentDocument();
            break;

          case 'set-default':
            STATE.appData.defaultDocument = STATE.currentDocumentName;
            if (window.saveAppDataAsync) {
              await window.saveAppDataAsync(STATE.appData);
            }
            NoteRenderer.renderDocumentMenu();
            if (window.NotificationService) {
              window.NotificationService.showNotification(`"${STATE.currentDocumentName}" es ahora el Uninote principal.`);
            }
            break;

          case 'set-doc-pass':
            if (STATE.appData.documentPasswords[STATE.currentDocumentName]) {
              // Document already has password - change or remove
              const choice = await window.NotificationService.showConfirmationModal(
                'Gestionar Contraseña',
                '¿Deseas cambiar la contraseña o quitarla permanentemente?',
                { confirmText: 'Cambiar', cancelText: 'Quitar' }
              );

              if (choice) {
                // Change password
                document.getElementById('set-password-modal-overlay').classList.remove('hidden');
              } else {
                // Remove password
                const confirmed = await window.SecurityService.promptForDocumentPassword(STATE.currentDocumentName, 'remove');
                if (confirmed) {
                  delete STATE.appData.documentPasswords[STATE.currentDocumentName];
                  STATE.unlockedDocuments.delete(STATE.currentDocumentName);

                  if (window.saveAppDataAsync) {
                    await window.saveAppDataAsync(STATE.appData);
                  }

                  NoteRenderer.renderAppUI();

                  if (window.NotificationService) {
                    window.NotificationService.showNotification(`Contraseña eliminada del Uninote "${STATE.currentDocumentName}".`);
                  }
                }
              }
            } else {
              // No password yet - set new password
              document.getElementById('set-password-modal-overlay').classList.remove('hidden');
            }

            document.getElementById('set-password-title').textContent = `Contraseña para el Uninote "${STATE.currentDocumentName}"`;
            document.getElementById('set-password-hint-container').style.display = 'none';
            document.getElementById('set-password-input').value = '';
            document.getElementById('set-password-confirm-input').value = '';
            break;
        }
      } else if (docName) {
        // Switch to different document
        await DocumentController.switchDocument(docName);
      }
    }
  });

  // Tabs container - Switch document via tabs
  tabsContainer.addEventListener('click', async (e) => {
    const tab = e.target.closest('.tab-button');
    if (tab && tab.dataset.docName !== STATE.currentDocumentName) {
      await DocumentController.switchDocument(tab.dataset.docName);
    }
  });

  // Relock document button
  relockDocBtn.addEventListener('click', async () => {
    STATE.unlockedDocuments.delete(STATE.currentDocumentName);
    NoteRenderer.renderView();
  });
}

/**
 * archiveEvents.js - Archive view and unarchive event handlers
 */

import { STATE } from '../config/state.js';

export function initializeArchiveEvents() {
  const archiveViewContainer = document.getElementById('archive-view-container');
  const unarchiveModalOverlay = document.getElementById('unarchive-modal-overlay');
  const unarchiveToOriginalBtn = document.getElementById('unarchive-to-original-btn');
  const unarchiveToOtherBtn = document.getElementById('unarchive-to-other-btn');
  const unarchiveCancelBtn = document.getElementById('unarchive-cancel-btn');
  const unarchiveOptionsList = document.getElementById('unarchive-options-list');

  // Archive view click handler
  archiveViewContainer.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    const noteLi = e.target.closest('.note');

    // Locked note in archive view
    if (noteLi && noteLi.classList.contains('is-locked')) {
      STATE.activeNoteForLock = noteLi;
      document.getElementById('unlock-modal-overlay').querySelector('h2').textContent = 'Desbloquear Nota Archivada';
      document.getElementById('unlock-password-input').value = '';
      document.getElementById('unlock-modal-overlay').classList.remove('hidden');
      document.getElementById('unlock-password-input').focus();
      return;
    }

    if (!target || !target.dataset.action) return;

    const action = target.dataset.action;
    if (!noteLi) return;

    // Unarchive button
    if (action === 'unarchive') {
      STATE.activeNoteForUnarchive = {
        id: noteLi.dataset.id,
        originalDoc: noteLi.dataset.originalDoc,
      };

      unarchiveToOriginalBtn.textContent = `Desarchivar en "${STATE.activeNoteForUnarchive.originalDoc}"`;
      unarchiveOptionsList.classList.add('hidden');
      unarchiveToOtherBtn.classList.remove('hidden');
      unarchiveModalOverlay.classList.remove('hidden');
    }
  });

  // Unarchive to other document button
  unarchiveToOtherBtn.addEventListener('click', () => {
    unarchiveOptionsList.innerHTML = '';

    STATE.appData.documents.forEach(docName => {
      if (docName !== STATE.activeNoteForUnarchive.originalDoc) {
        const li = document.createElement('li');
        li.textContent = docName;
        li.dataset.docName = docName;
        unarchiveOptionsList.appendChild(li);
      }
    });

    unarchiveToOtherBtn.classList.add('hidden');
    unarchiveOptionsList.classList.remove('hidden');
  });

  // Unarchive cancel button
  unarchiveCancelBtn.addEventListener('click', () => {
    unarchiveModalOverlay.classList.add('hidden');
    STATE.activeNoteForUnarchive = null;
  });

  // Unarchive options list click handler
  unarchiveOptionsList.addEventListener('click', (e) => {
    const targetLi = e.target.closest('li');
    if (targetLi) {
      if (window.handleUnarchive) {
        window.handleUnarchive(targetLi.dataset.docName);
      }
    }
  });

  // Unarchive to original document button
  unarchiveToOriginalBtn.addEventListener('click', () => {
    if (window.handleUnarchive && STATE.activeNoteForUnarchive) {
      window.handleUnarchive(STATE.activeNoteForUnarchive.originalDoc);
    }
  });
}

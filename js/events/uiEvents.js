/**
 * uiEvents.js - UI control event handlers (theme, scroll, help, date picker, notifications, bulk actions)
 */

import { STATE } from '../config/state.js';
import { StateController } from '../controllers/StateController.js';
import { NoteController } from '../controllers/NoteController.js';
import { ArchiveController } from '../controllers/ArchiveController.js';
import { Features } from '../features/Features.js';

export function initializeUIEvents() {
  const toggleAllBtn = document.getElementById('toggle-all-btn');
  const deselectAllBtn = document.getElementById('deselect-all-btn');
  const deleteSelectedBtn = document.getElementById('delete-selected-btn');
  const indentSelectedBtn = document.getElementById('indent-selected-btn');
  const outdentSelectedBtn = document.getElementById('outdent-selected-btn');
  const selectChildrenBtn = document.getElementById('select-children-btn');
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  const scrollBottomBtn = document.getElementById('scroll-bottom-btn');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const helpBtn = document.getElementById('help-btn');
  const helpCloseBtn = document.getElementById('help-close-btn');
  const helpModalOverlay = document.getElementById('help-modal-overlay');
  const saveDateBtn = document.getElementById('save-date-btn');
  const removeDateBtn = document.getElementById('remove-date-btn');
  const cancelDateBtn = document.getElementById('cancel-date-btn');
  const datePickerModalOverlay = document.getElementById('date-picker-modal-overlay');
  const dateTimeInput = document.getElementById('date-time-input');
  const notificationCenterBtn = document.getElementById('notification-center-btn');
  const notificationCenterCloseBtn = document.getElementById('notification-center-close-btn');
  const notificationCenterOverlay = document.getElementById('notification-center-overlay');
  const notificationDot = document.getElementById('notification-dot');
  const toggleArchiveViewBtn = document.getElementById('toggle-archive-view-btn');
  const archiveControls = document.getElementById('archive-controls');

  // Toggle all notes (expand/collapse)
  toggleAllBtn.addEventListener('click', () => {
    const isCollapsed = toggleAllBtn.textContent === 'Contraer Todo';
    document.querySelectorAll('.note:not([data-is-archived="true"]):not(.is-locked) > .subnotes').forEach(sublist => {
      sublist.classList.toggle('hidden', isCollapsed);
    });
    toggleAllBtn.textContent = isCollapsed ? 'Expandir Todo' : 'Contraer Todo';
    StateController.runUpdates();
  });

  // Deselect all notes
  deselectAllBtn.addEventListener('click', () => {
    STATE.selectedNotes.forEach(note => {
      note.classList.remove('selected');
      note.querySelector('.note-selector').checked = false;
    });
    STATE.selectedNotes.clear();
    Features.updateBulkActionsBar();
  });

  // Delete selected notes
  deleteSelectedBtn.addEventListener('click', async () => {
    if (STATE.selectedNotes.size === 0) return;

    const confirmed = await window.NotificationService.showConfirmationModal(
      'Eliminar Notas',
      `¿Estás seguro de que quieres eliminar ${STATE.selectedNotes.size} nota(s) permanentemente? Esto incluye notas bloqueadas.`
    );

    if (confirmed) {
      STATE.selectedNotes.forEach(note => {
        const { parentArray, index } = NoteController.findNoteData(STATE.currentNotesData, note.dataset.id) || {};
        if (parentArray) parentArray.splice(index, 1);
        note.remove();
      });

      STATE.selectedNotes.clear();
      Features.updateBulkActionsBar();
      NoteController.ensureAtLeastOneNote();
      StateController.runUpdates();
      window.NotificationService.showNotification('Notas eliminadas.');
    } else {
      window.NotificationService.showNotification('Eliminación cancelada.', 'error');
    }
  });

  // Indent selected notes
  indentSelectedBtn.addEventListener('click', () => {
    const notesList = document.getElementById('notes-list');
    const notesToProcess = Array.from(STATE.selectedNotes).sort((a, b) =>
      Array.from(notesList.querySelectorAll('.note')).indexOf(b) -
      Array.from(notesList.querySelectorAll('.note')).indexOf(a)
    );

    notesToProcess.forEach(noteLi => {
      const prevSibling = noteLi.previousElementSibling;
      if (prevSibling && prevSibling.classList.contains('note') && !prevSibling.classList.contains('is-locked')) {
        let sublist = prevSibling.querySelector('.subnotes');
        if (!sublist) {
          sublist = document.createElement('ul');
          sublist.className = 'subnotes';
          prevSibling.appendChild(sublist);
        }
        sublist.appendChild(noteLi);
      }
    });

    deselectAllBtn.click();
    StateController.runUpdates();
  });

  // Outdent selected notes
  outdentSelectedBtn.addEventListener('click', () => {
    const notesList = document.getElementById('notes-list');
    const notesToProcess = Array.from(STATE.selectedNotes).sort((a, b) =>
      Array.from(notesList.querySelectorAll('.note')).indexOf(b) -
      Array.from(notesList.querySelectorAll('.note')).indexOf(a)
    );

    notesToProcess.forEach(noteLi => {
      const currentList = noteLi.parentElement;
      const parentNote = currentList.closest('.note');

      if (parentNote) {
        const grandParentList = parentNote.parentElement;
        grandParentList.insertBefore(noteLi, parentNote.nextSibling);

        if (currentList.children.length === 0) {
          currentList.remove();
        }
      }
    });

    deselectAllBtn.click();
    StateController.runUpdates();
  });

  // Select children of selected notes
  selectChildrenBtn.addEventListener('click', () => {
    const descendantsToSelect = new Set();
    STATE.selectedNotes.forEach(note => {
      note.querySelectorAll('.note').forEach(descendant => {
        descendantsToSelect.add(descendant);
      });
    });

    descendantsToSelect.forEach(note => {
      STATE.selectedNotes.add(note);
      note.classList.add('selected');
      note.querySelector('.note-selector').checked = true;
    });

    Features.updateBulkActionsBar();
  });

  // Scroll to top
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Scroll to bottom
  scrollBottomBtn.addEventListener('click', () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  // Theme toggle
  themeToggleBtn.addEventListener('click', async () => {
    const currentTheme = document.body.getAttribute('data-theme');

    if (currentTheme === 'dark') {
      document.body.removeAttribute('data-theme');
      themeToggleBtn.textContent = '🌙';

      if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
        await window.saveSettingAsync('Theme', null);
      } else {
        localStorage.removeItem('uninoteTheme');
      }
    } else {
      document.body.setAttribute('data-theme', 'dark');
      themeToggleBtn.textContent = '☀️';

      if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
        await window.saveSettingAsync('Theme', 'dark');
      } else {
        localStorage.setItem('uninoteTheme', 'dark');
      }
    }
  });

  // Help modal
  helpBtn.addEventListener('click', () => {
    helpModalOverlay.classList.remove('hidden');
  });

  helpCloseBtn.addEventListener('click', () => {
    helpModalOverlay.classList.add('hidden');
  });

  helpModalOverlay.addEventListener('click', (e) => {
    if (e.target === helpModalOverlay) {
      helpModalOverlay.classList.add('hidden');
    }
  });

  // Date picker
  saveDateBtn.addEventListener('click', async () => {
    if (STATE.activeNoteForDatePicker) {
      const noteLi = STATE.activeNoteForDatePicker;
      const dateISO = dateTimeInput.value ? new Date(dateTimeInput.value).toISOString() : '';

      // Actualizar en el DOM
      noteLi.dataset.dueDate = dateISO;

      // IMPORTANTE: Actualizar también en noteData para que persista
      const noteId = noteLi.dataset.id;
      const { note: noteData } = window.NoteController.findNoteData(STATE.currentNotesData, noteId) || {};
      if (noteData) {
        noteData.dueDate = dateISO;
      }
    }
    datePickerModalOverlay.classList.add('hidden');
    StateController.runUpdates();

    // Guardar documento para persistir la fecha
    await window.DocumentController.saveCurrentDocument();
  });

  removeDateBtn.addEventListener('click', async () => {
    if (STATE.activeNoteForDatePicker) {
      const noteLi = STATE.activeNoteForDatePicker;

      // Actualizar en el DOM
      noteLi.dataset.dueDate = '';

      // IMPORTANTE: Actualizar también en noteData para que persista
      const noteId = noteLi.dataset.id;
      const { note: noteData } = window.NoteController.findNoteData(STATE.currentNotesData, noteId) || {};
      if (noteData) {
        noteData.dueDate = '';
      }

      datePickerModalOverlay.classList.add('hidden');
      StateController.runUpdates();

      // Guardar documento para persistir la eliminación de fecha
      await window.DocumentController.saveCurrentDocument();
    }
  });

  cancelDateBtn.addEventListener('click', () => {
    datePickerModalOverlay.classList.add('hidden');
    STATE.activeNoteForDatePicker = null;
  });

  datePickerModalOverlay.addEventListener('click', (e) => {
    if (e.target === datePickerModalOverlay) {
      datePickerModalOverlay.classList.add('hidden');
    }
  });

  // Notification center
  notificationCenterBtn.addEventListener('click', async () => {
    notificationCenterOverlay.classList.remove('hidden');
    notificationDot.classList.add('hidden');

    document.querySelectorAll('#notification-list li').forEach(li => {
      STATE.seenNotifications.add(li.dataset.noteId);
    });

    if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
      await window.saveSettingAsync('SeenNotifications', [...STATE.seenNotifications]);
    } else {
      localStorage.setItem('uninoteSeenNotifications', JSON.stringify([...STATE.seenNotifications]));
    }
  });

  notificationCenterCloseBtn.addEventListener('click', () => {
    notificationCenterOverlay.classList.add('hidden');
  });

  notificationCenterOverlay.addEventListener('click', (e) => {
    if (e.target === notificationCenterOverlay) {
      notificationCenterOverlay.classList.add('hidden');
    }
  });

  // Archive view toggle
  toggleArchiveViewBtn.addEventListener('click', () => {
    ArchiveController.toggleArchiveView();
  });

  // Archive controls (grouping change)
  archiveControls.addEventListener('change', () => {
    if (window.ArchiveService && window.ArchiveService.renderArchiveTimeline) {
      window.ArchiveService.renderArchiveTimeline();
    }
  });

  // Global click handler to close pickers/menus and modals
  document.addEventListener('click', (e) => {
    // Cerrar overflow menu si se hace click fuera de él
    const overflowMenu = document.getElementById('overflow-menu');

    // Logs SIEMPRE para diagnosticar
    console.log('🟡 GLOBAL CLICK detectado:', {
      target: e.target,
      tagName: e.target.tagName,
      classList: e.target.classList.toString(),
      id: e.target.id || 'sin-id',
      menuDisplay: overflowMenu ? overflowMenu.style.display : 'N/A',
      menuExists: !!overflowMenu
    });

    if (overflowMenu && overflowMenu.style.display === 'block') {
      console.log('🟡 GLOBAL CLICK: ⚠️ Overflow menu está ABIERTO (display: block)');

      const isInsideMenu = !!e.target.closest('#overflow-menu');
      const isShowMenuButton = !!e.target.closest('[data-action="show-menu"]');

      console.log('🟡 GLOBAL CLICK: Análisis del click', {
        clickTargetDetails: {
          element: e.target,
          path: e.composedPath ? e.composedPath().map(el => el.tagName || el.nodeName).join(' > ') : 'N/A'
        },
        isInsideMenu: isInsideMenu,
        isShowMenuButton: isShowMenuButton,
        shouldClose: !isInsideMenu && !isShowMenuButton
      });

      if (!isInsideMenu && !isShowMenuButton) {
        console.log('🟡 GLOBAL CLICK: 🚨 CERRANDO overflow menu (click fuera del menú)');
        overflowMenu.style.display = 'none';
        overflowMenu.classList.remove('icon-grid'); // ⚡ Remover clase para que CSS display:grid !important no interfiera
        STATE.activeNoteForMenu = null; // Clear active note reference
        console.log('🟡 GLOBAL CLICK: ✅ Overflow menu CERRADO, activeNoteForMenu = null');
        console.log('🟡 GLOBAL CLICK: ✅ Menu display después de cerrar:', overflowMenu.style.display);
      } else {
        console.log('🟡 GLOBAL CLICK: ❌ NO cerrando - Razón:', {
          isInsideMenu: isInsideMenu ? 'Click DENTRO del menú' : false,
          isShowMenuButton: isShowMenuButton ? 'Click en botón show-menu' : false
        });
      }
    } else {
      if (overflowMenu && overflowMenu.style.display !== 'block') {
        console.log('🟡 GLOBAL CLICK: Overflow menu NO está abierto (display:', overflowMenu.style.display + ')');
      }
    }

    // Cerrar lock menu si se hace click fuera de él
    const lockMenu = document.getElementById('lock-menu');
    if (lockMenu && lockMenu.style.display === 'block') {
      if (!e.target.closest('#lock-menu') && !e.target.closest('[data-action="lock"]')) {
        lockMenu.style.display = 'none';
      }
    }

    // Cerrar icon picker si se hace click fuera de él
    const iconPicker = document.getElementById('icon-picker');
    if (iconPicker && iconPicker.style.display === 'block') {
      if (!e.target.closest('#icon-picker') && !e.target.closest('[data-action="emoji-picker"]') && !e.target.closest('.note-icon')) {
        iconPicker.style.display = 'none';
      }
    }

    // Cerrar modales si se hace click en el overlay (fuera del modal-box)
    if (e.target.classList.contains('modal-overlay')) {
      const modalOverlay = e.target;
      // Lista de modales que se pueden cerrar con click fuera
      const closableModals = [
        'help-modal-overlay',
        'notification-center-overlay',
        'app-settings-modal-overlay',
        'date-picker-modal-overlay',
        'duplicate-modal-overlay'
      ];

      if (closableModals.includes(modalOverlay.id)) {
        modalOverlay.classList.add('hidden');
      }
    }
  });
}

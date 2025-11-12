/**
 * formattingEvents.js - Formatting toolbar and emoji picker event handlers
 */

import { STATE } from '../config/state.js';
import { StateController } from '../controllers/StateController.js';
import { Features } from '../features/Features.js';

export function initializeFormattingEvents() {
  const formattingToolbar = document.getElementById('formatting-toolbar');
  const fontSizeInput = document.getElementById('font-size-input');
  const iconPicker = document.getElementById('icon-picker');

  // Prevent toolbar mousedown from affecting selection
  formattingToolbar.addEventListener('mousedown', e => e.preventDefault());

  // Formatting toolbar button clicks
  formattingToolbar.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const command = button.dataset.command;
    if (command === 'increaseFontSize' || command === 'decreaseFontSize') {
      Features.changeFontSize(command === 'increaseFontSize' ? 'increase' : 'decrease');
    } else if (command) {
      Features.applyStyle(command);
    }
  });

  // Font size input (manual entry)
  fontSizeInput.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      Features.changeFontSize('input');
    }
  });

  // Color picker
  formattingToolbar.querySelector('input[type="color"]').addEventListener('input', (e) => {
    if (e.target.dataset.command === 'foreColor') {
      Features.applyStyle(e.target.dataset.command, e.target.value);
    }
  });

  // Icon picker (emoji picker)
  iconPicker.addEventListener('click', (e) => {
    e.stopPropagation();
    const target = e.target.closest('button');
    if (!target) return;

    // Tab switching
    if (target.parentElement.classList.contains('picker-tabs')) {
      document.querySelectorAll('.picker-tabs button').forEach(b => b.classList.remove('active'));
      target.classList.add('active');
      document.querySelectorAll('.picker-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${target.dataset.tab}`).classList.add('active');
      return;
    }

    // Emoji selection
    if (target.parentElement.classList.contains('picker-panel')) {
      if (STATE.activeNoteForMenu) {
        const noteLi = STATE.activeNoteForMenu;
        const emoji = target.textContent;

        // Actualizar icono en el DOM
        noteLi.querySelector('.note-icon').textContent = emoji;

        // IMPORTANTE: Actualizar también en noteData para que persista
        const noteId = noteLi.dataset.id;
        const { note: noteData } = window.NoteController.findNoteData(STATE.currentNotesData, noteId) || {};
        if (noteData) {
          noteData.icon = emoji;
        }

        Features.addEmojiToRecents(emoji);
        StateController.runUpdates();
      }
      iconPicker.style.display = 'none';
      STATE.activeNoteForMenu = null;
    }
  });

  // Show formatting toolbar on text selection
  document.addEventListener('mouseup', () => {
    if (window.showFormattingToolbar) {
      window.showFormattingToolbar();
    } else if (Features.showFormattingToolbar) {
      Features.showFormattingToolbar();
    }
  });

  // Hide pickers when clicking outside
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.picker') &&
        !e.target.closest('[data-action="show-menu"]') &&
        !e.target.closest('[data-action="lock"]') &&
        !e.target.closest('#transfer-btn')) {
      document.querySelectorAll('.picker').forEach(p => p.style.display = 'none');
      STATE.activeNoteForMenu = null;
    }
  });
}

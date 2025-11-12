/**
 * dragDropEvents.js - Drag and drop functionality for note reordering
 */

import { STATE } from '../config/state.js';
import { NoteController } from '../controllers/NoteController.js';
import { StateController } from '../controllers/StateController.js';
import { DocumentController } from '../controllers/DocumentController.js';

export function initializeDragDropEvents() {
  const notesList = document.getElementById('notes-list');

  // Drag start
  notesList.addEventListener('dragstart', (e) => {
    if (STATE.isArchiveViewActive) return;

    if (e.target.classList.contains('drag-handle')) {
      STATE.draggedElement = e.target.closest('.note');
      setTimeout(() => STATE.draggedElement.classList.add('dragging'), 0);
    }
  });

  // Drag over
  notesList.addEventListener('dragover', (e) => {
    if (STATE.isArchiveViewActive) return;
    e.preventDefault();

    if (!STATE.draggedElement) return;

    const targetNote = e.target.closest('.note');

    // Don't allow dropping into self or locked notes
    if (targetNote && (
      STATE.draggedElement.contains(targetNote) ||
      (targetNote.dataset.lockType && !STATE.sessionUnlockedNotes.has(targetNote.dataset.id))
    )) {
      return;
    }

    // Clear previous indicators
    document.querySelectorAll('.drop-indicator').forEach(i => i.remove());
    document.querySelectorAll('.drop-target-nest').forEach(el => el.classList.remove('drop-target-nest'));

    if (targetNote) {
      const rect = targetNote.getBoundingClientRect();
      const noteContainer = targetNote.querySelector('.note-container');
      const dropZoneHeight = rect.height / 3;

      // Drop above
      if (e.clientY < rect.top + dropZoneHeight) {
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        targetNote.parentElement.insertBefore(indicator, targetNote);
      }
      // Drop below
      else if (e.clientY > rect.bottom - dropZoneHeight) {
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        targetNote.parentElement.insertBefore(indicator, targetNote.nextSibling);
      }
      // Drop as child (nest)
      else {
        noteContainer.classList.add('drop-target-nest');
      }
    }
  });

  // Drop
  notesList.addEventListener('drop', async (e) => {
    if (STATE.isArchiveViewActive) return;
    e.preventDefault();

    if (!STATE.draggedElement) return;

    console.log('🎯 DROP: Iniciando reordenamiento...');

    const { note: noteData, parentArray: originalParent, index: originalIndex } =
      NoteController.findNoteData(STATE.currentNotesData, STATE.draggedElement.dataset.id);

    if (!noteData) return;

    console.log('📝 Nota:', noteData.content.substring(0, 30), '| Índice original:', originalIndex);

    // Remove from original position
    originalParent.splice(originalIndex, 1);

    const indicator = document.querySelector('.drop-indicator');
    const nestTarget = document.querySelector('.drop-target-nest');

    if (indicator) {
      // Dropping with indicator (before/after)
      const beforeElement = indicator.nextElementSibling;
      const list = indicator.parentElement;
      let targetParentArray;
      let targetIndex = -1;

      if (list === notesList) {
        targetParentArray = STATE.currentNotesData;
      } else {
        const parentLi = list.closest('.note');
        targetParentArray = NoteController.findNoteData(STATE.currentNotesData, parentLi.dataset.id).note.children;
      }

      if (beforeElement) {
        const beforeElementId = beforeElement.dataset.id;
        targetIndex = targetParentArray.findIndex(note => note.id === beforeElementId);

        if (targetIndex === -1) {
          targetIndex = targetParentArray.length;
        }

        console.log('🔍 beforeElement ID:', beforeElementId, '| Índice en array:', targetIndex);
      } else {
        targetIndex = targetParentArray.length;
      }

      console.log('📍 Nuevo índice calculado:', targetIndex, '| Total elementos:', targetParentArray.length);

      targetParentArray.splice(targetIndex, 0, noteData);
      indicator.parentElement.insertBefore(STATE.draggedElement, beforeElement);

    } else if (nestTarget) {
      // Dropping as child (nesting)
      const parentLi = nestTarget.closest('.note');
      const { note: parentData } = NoteController.findNoteData(STATE.currentNotesData, parentLi.dataset.id);

      if (!parentData.children) parentData.children = [];
      parentData.children.push(noteData);

      let sublist = parentLi.querySelector('.subnotes');
      if (!sublist) {
        sublist = document.createElement('ul');
        sublist.className = 'subnotes';
        parentLi.appendChild(sublist);
      }

      sublist.appendChild(STATE.draggedElement);
      sublist.classList.remove('hidden');

    } else {
      // Dropped in empty space, put it back
      originalParent.splice(originalIndex, 0, noteData);
    }

    // Clean up indicators
    document.querySelectorAll('.drop-indicator').forEach(i => i.remove());
    document.querySelectorAll('.drop-target-nest').forEach(el => el.classList.remove('drop-target-nest'));

    StateController.runUpdates();

    console.log('📋 Orden final en currentNotesData:', STATE.currentNotesData.map((n, idx) => `${idx}: ${n.content.substring(0, 20)}`));

    // Save immediately
    clearTimeout(STATE.saveTimeout);
    console.log('🔄 Nota reordenada, guardando inmediatamente...');
    await DocumentController.saveCurrentDocument();
    console.log('✅ Orden guardado en IndexedDB');
  });

  // Drag end
  notesList.addEventListener('dragend', () => {
    if (STATE.isArchiveViewActive) return;

    if (STATE.draggedElement) {
      STATE.draggedElement.classList.remove('dragging');
    }

    STATE.draggedElement = null;
    document.querySelectorAll('.drop-indicator').forEach(i => i.remove());
    document.querySelectorAll('.drop-target-nest').forEach(el => el.classList.remove('drop-target-nest'));
  });
}

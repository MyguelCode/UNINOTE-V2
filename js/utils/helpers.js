/**
 * helpers.js - Utility helper functions used across the application
 */

import { STATE } from '../config/state.js';
import { NoteRenderer } from '../ui/NoteRenderer.js';
import { StateController } from '../controllers/StateController.js';
import { NoteController } from '../controllers/NoteController.js';
import { DocumentController } from '../controllers/DocumentController.js';

/**
 * Create a new note DOM element
 */
export function createNote(parentList, afterElement = null, shouldFocus = false, data = {}) {
  const li = document.createElement('li');
  li.className = 'note';
  const noteId = data.id || crypto.randomUUID();
  li.dataset.id = noteId;

  const noteData = {
    id: noteId,
    content: '',
    status: 'todo',
    creationDate: new Date().toISOString(),
    children: [],
    ...data
  };

  li.dataset.status = noteData.status;
  li.dataset.creationDate = noteData.creationDate;
  li.dataset.dueDate = noteData.dueDate || '';
  li.dataset.isArchived = String(noteData.isArchived || false);
  li.dataset.archivedTimestamp = noteData.archivedTimestamp || '';

  if (noteData.originalDoc) {
    li.dataset.originalDoc = noteData.originalDoc;
  }

  if (noteData.lockType && noteData.passwordHash) {
    li.dataset.lockType = noteData.lockType;
    li.dataset.lockHint = noteData.lockHint || '';
    li.dataset.passwordHash = JSON.stringify(noteData.passwordHash);
    li.dataset.lockedContent = noteData.content || '';
  }

  // IMPORTANTE: Usar NoteRenderer.generateNoteHTML para respetar configuración de botones
  if (window.NoteRenderer && window.NoteRenderer.generateNoteHTML) {
    li.innerHTML = window.NoteRenderer.generateNoteHTML(noteData);
  } else {
    // Fallback si NoteRenderer no está disponible (no debería pasar)
    li.innerHTML = `
      <div class="note-container">
        <input type="checkbox" class="note-selector" title="Seleccionar nota">
        <button class="drag-handle" data-action="drag" draggable="true" title="Arrastrar para mover">⠿</button>
        <span class="note-icon"></span>
        <button data-action="cycle-status" title="Estado: Sin Hacer">⚪</button>
        <button data-action="set-date" title="Asignar Fecha Límite">🗓️</button>
        <span class="countdown-timer"></span>
        <button data-action="lock" title="Opciones de Bloqueo">🔒</button>
        <button data-action="duplicate" title="Duplicar Nota">⧉</button>
        <button data-action="toggle"></button>
        <span class="note-number" title="Creado el: ${new Date(noteData.creationDate).toLocaleString()}"></span>
        <div class="editable-note" contenteditable="true">${noteData.content || ''}</div>
        <button data-action="add-sibling" title="Añadir Nota Hermana">➕</button>
        <button data-action="add-subnote" title="Añadir Subnota"><sub>➕</sub></button>
        <button data-action="show-menu" title="Más Opciones">⋮</button>
        <button data-action="unarchive" title="Desarchivar Nota">📤</button>
        <button data-action="archive" title="Archivar Nota">📥</button>
        <button data-action="delete" title="Eliminar Nota">🗑️</button>
      </div>
    `;
  }

  const statusBtn = li.querySelector('[data-action="cycle-status"]');
  if (statusBtn) {
    switch (li.dataset.status) {
      case 'inprogress':
        statusBtn.textContent = '🟡';
        break;
      case 'done':
        statusBtn.textContent = '🟢';
        break;
      default:
        statusBtn.textContent = '⚪';
        break;
    }
  }

  const iconEl = li.querySelector('.note-icon');
  if (iconEl) {
    iconEl.textContent = noteData.icon || '';
  }

  if (afterElement) {
    parentList.insertBefore(li, afterElement.nextSibling);
  } else {
    parentList.appendChild(li);
  }

  if (shouldFocus) {
    const editable = li.querySelector('.editable-note');
    editable.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(editable);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  return li;
}

/**
 * Update toggle button visibility for a note
 */
export function updateToggleVisibilityForNote(noteLi) {
  const toggleBtn = noteLi.querySelector('[data-action="toggle"]');
  if (noteLi.classList.contains('is-locked')) {
    toggleBtn.classList.remove('toggle-visible');
    return;
  }

  const sublist = noteLi.querySelector('.subnotes');
  if (sublist && sublist.children.length > 0) {
    toggleBtn.classList.add('toggle-visible');
    if (sublist.classList.contains('hidden')) {
      toggleBtn.textContent = '▶';
      toggleBtn.title = 'Expandir';
    } else {
      toggleBtn.textContent = '▼';
      toggleBtn.title = 'Contraer';
    }
  } else {
    toggleBtn.classList.remove('toggle-visible');
  }
}

/**
 * Permanently remove lock from a note
 */
export function permanentlyRemoveLock(noteLi) {
  const noteId = noteLi.dataset.id;
  const { note: noteData } = NoteController.findNoteData(STATE.currentNotesData, noteId);

  if (noteData) {
    delete noteData.lockType;
    delete noteData.passwordHash;
    delete noteData.lockHint;
    delete noteData.lockedContent;
  }

  delete noteLi.dataset.lockType;
  delete noteLi.dataset.passwordHash;
  delete noteLi.dataset.lockHint;
  delete noteLi.dataset.lockedContent;

  STATE.sessionUnlockedNotes.delete(noteId);
  NoteRenderer.renderNoteState(noteLi);
  StateController.runUpdates();
}

/**
 * Toggle favorite status of a document
 */
export function toggleFavorite(docName) {
  const idx = STATE.appData.favorites.indexOf(docName);
  if (idx === -1) {
    STATE.appData.favorites.push(docName);
  } else {
    STATE.appData.favorites.splice(idx, 1);
  }

  if (window.saveAppDataAsync) {
    window.saveAppDataAsync(STATE.appData);
  }

  NoteRenderer.renderDocumentMenu();
  NoteRenderer.renderTabs();
}

/**
 * Rename current document
 */
export async function renameCurrentDocument() {
  const oldName = STATE.currentDocumentName;

  const newName = await window.NotificationService.showPromptModal(
    'Renombrar Uninote',
    'Introduce el nuevo nombre:',
    { defaultValue: oldName }
  );

  if (!newName || newName.trim() === '' || newName.trim() === oldName) return;

  const trimmedName = newName.trim();

  if (STATE.appData.documents.includes(trimmedName)) {
    await window.NotificationService.showAlertModal('Error', 'Ya existe un Uninote con ese nombre.');
    return;
  }

  // Update in documents list
  const idx = STATE.appData.documents.indexOf(oldName);
  if (idx !== -1) {
    STATE.appData.documents[idx] = trimmedName;
  }

  // Update favorites
  const favIdx = STATE.appData.favorites.indexOf(oldName);
  if (favIdx !== -1) {
    STATE.appData.favorites[favIdx] = trimmedName;
  }

  // Update default document
  if (STATE.appData.defaultDocument === oldName) {
    STATE.appData.defaultDocument = trimmedName;
  }

  // Update password reference
  if (STATE.appData.documentPasswords[oldName]) {
    STATE.appData.documentPasswords[trimmedName] = STATE.appData.documentPasswords[oldName];
    delete STATE.appData.documentPasswords[oldName];
  }

  // Update unlocked documents
  if (STATE.unlockedDocuments.has(oldName)) {
    STATE.unlockedDocuments.delete(oldName);
    STATE.unlockedDocuments.add(trimmedName);
  }

  STATE.currentDocumentName = trimmedName;
  STATE.appData.activeDocument = trimmedName;

  // Rename in storage
  if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
    const notesData = await window.loadDocumentAsync(oldName);
    await window.saveDocumentAsync(trimmedName, notesData);

    // Delete old document from IndexedDB
    const db = await window.uninoteDB;
    await db.delete('documents', oldName);
  } else {
    const notesData = localStorage.getItem(`uninote_doc_${oldName}`);
    localStorage.setItem(`uninote_doc_${trimmedName}`, notesData);
    localStorage.removeItem(`uninote_doc_${oldName}`);
  }

  await window.saveAppDataAsync(STATE.appData);
  NoteRenderer.renderAppUI();
  window.NotificationService.showNotification(`Uninote renombrado a "${trimmedName}".`);
}

/**
 * Delete current document
 */
export async function deleteCurrentDocument() {
  if (STATE.appData.documents.length === 1) {
    await window.NotificationService.showAlertModal('Error', 'No puedes eliminar el último Uninote.');
    return;
  }

  const confirmed = await window.NotificationService.showConfirmationModal(
    'Eliminar Uninote',
    `¿Estás seguro de que quieres eliminar "${STATE.currentDocumentName}" permanentemente? Esta acción no se puede deshacer.`
  );

  if (!confirmed) return;

  const docToDelete = STATE.currentDocumentName;

  // Remove from documents list
  const idx = STATE.appData.documents.indexOf(docToDelete);
  if (idx !== -1) {
    STATE.appData.documents.splice(idx, 1);
  }

  // Remove from favorites
  const favIdx = STATE.appData.favorites.indexOf(docToDelete);
  if (favIdx !== -1) {
    STATE.appData.favorites.splice(favIdx, 1);
  }

  // Clear default if it was the default
  if (STATE.appData.defaultDocument === docToDelete) {
    STATE.appData.defaultDocument = null;
  }

  // Remove password
  if (STATE.appData.documentPasswords[docToDelete]) {
    delete STATE.appData.documentPasswords[docToDelete];
  }

  STATE.unlockedDocuments.delete(docToDelete);

  // Delete from storage
  if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
    const db = await window.uninoteDB;
    await db.delete('documents', docToDelete);
  } else {
    localStorage.removeItem(`uninote_doc_${docToDelete}`);
  }

  await window.saveAppDataAsync(STATE.appData);

  // Switch to another document
  const nextDoc = STATE.appData.documents[0];
  await DocumentController.switchDocument(nextDoc);

  window.NotificationService.showNotification(`Uninote "${docToDelete}" eliminado.`);
}

/**
 * Handle unarchive action
 */
export async function handleUnarchive(targetDocName) {
  const noteId = STATE.activeNoteForUnarchive.id;
  const originalDoc = STATE.activeNoteForUnarchive.originalDoc;

  // Find and remove from original document
  let noteData;
  if (originalDoc === STATE.currentDocumentName) {
    const result = NoteController.findNoteData(STATE.currentNotesData, noteId);
    if (result) {
      noteData = result.note;
      result.parentArray.splice(result.index, 1);
    }
  } else {
    let originalNotesData;
    if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
      originalNotesData = await window.loadDocumentAsync(originalDoc);
    } else {
      const raw = localStorage.getItem(`uninote_doc_${originalDoc}`);
      originalNotesData = raw ? JSON.parse(raw) : [];
    }

    const result = NoteController.findNoteData(originalNotesData, noteId);
    if (result) {
      noteData = result.note;
      result.parentArray.splice(result.index, 1);

      if (window.saveNotesToStorage) {
        await window.saveNotesToStorage(originalDoc, originalNotesData);
      }
    }
  }

  if (!noteData) {
    window.NotificationService.showNotification('No se pudo encontrar la nota.', 'error');
    return;
  }

  // Unarchive
  noteData.isArchived = false;
  delete noteData.archivedTimestamp;
  delete noteData.originalDoc;

  // Add to target document
  if (targetDocName === STATE.currentDocumentName) {
    STATE.currentNotesData.push(noteData);
  } else {
    let targetNotesData;
    if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
      targetNotesData = await window.loadDocumentAsync(targetDocName);
    } else {
      const raw = localStorage.getItem(`uninote_doc_${targetDocName}`);
      targetNotesData = raw ? JSON.parse(raw) : [];
    }

    targetNotesData.push(noteData);

    if (window.saveNotesToStorage) {
      await window.saveNotesToStorage(targetDocName, targetNotesData);
    }
  }

  document.getElementById('unarchive-modal-overlay').classList.add('hidden');
  STATE.activeNoteForUnarchive = null;

  if (window.ArchiveService && window.ArchiveService.renderArchiveTimeline) {
    await window.ArchiveService.renderArchiveTimeline();
  }

  window.NotificationService.showNotification(`Nota desarchivada en "${targetDocName}".`);
}

/**
 * Render notes (shortcut to NoteRenderer.renderAppUI)
 */
export function renderNotes() {
  NoteRenderer.renderAppUI();
}

/**
 * Render view (shortcut to NoteRenderer.renderView)
 */
export function renderView() {
  NoteRenderer.renderView();
}

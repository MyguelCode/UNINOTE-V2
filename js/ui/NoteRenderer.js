/**
 * NoteRenderer - Renderizado completo de notas y UI
 */

import { STATE } from '../config/state.js';
import { StateController } from '../controllers/StateController.js';
import { NoteController } from '../controllers/NoteController.js';
import { ButtonConfigService } from '../services/ButtonConfigService.js';

export class NoteRenderer {

  /**
   * Cargar notas desde datos
   */
  static loadNotesFromData(notesData) {
    STATE.currentNotesData = JSON.parse(JSON.stringify(notesData || []));
    STATE.DOM.notesList.innerHTML = '';

    const activeNotes = STATE.currentNotesData.filter(note => !note.isArchived);

    const recursiveLoad = (dataArray, parentList) => {
      dataArray.forEach(noteData => {
        const li = this.createNote(parentList, null, false, noteData);
        if (noteData.children && noteData.children.length > 0) {
          const sublist = document.createElement('ul');
          sublist.className = 'subnotes';

          if (noteData.isCollapsed) {
            sublist.classList.add('hidden');
          }

          li.appendChild(sublist);
          recursiveLoad(noteData.children, sublist);
        }
        this.renderNoteState(li);
      });
    };

    recursiveLoad(activeNotes, STATE.DOM.notesList);
    NoteController.ensureAtLeastOneNote();
    StateController.runUpdates();
  }

  /**
   * Generate note HTML based on button configuration
   */
  static generateNoteHTML(noteData) {
    const config = ButtonConfigService.getConfig();
    const isArchiveView = STATE.isArchiveViewActive;
    const { leftVisible, leftHidden, rightVisible, rightHidden } =
      ButtonConfigService.getButtonsForNote(isArchiveView);

    // Helper to create button HTML
    const createButton = (btn) => {
      const actionMap = {
        'estado': 'cycle-status',
        'fechaLimite': 'set-date',
        'candado': 'lock',
        'duplicar': 'duplicate',
        'agregarHermana': 'add-sibling',
        'agregarSubNota': 'add-subnote',
        'emojiPicker': 'emoji-picker',
        'archivar': 'archive',
        'eliminar': 'delete',
        'desarchivar': 'unarchive',
        'fijar': 'pin',
        'moverInicio': 'move-top',
        'moverFinal': 'move-bottom',
        'moverPosicion': 'move-to',
        'promover': 'promote'
      };

      const action = actionMap[btn.id];
      const title = btn.label;

      // Special handling for certain buttons
      if (btn.id === 'estado') {
        return `<button data-action="${action}" title="Estado: Sin Hacer">⚪</button>`;
      } else if (btn.id === 'agregarSubNota') {
        return `<button data-action="${action}" title="${title}"><sub>➕</sub></button>`;
      } else if (!btn.functional) {
        // Phase 2 buttons - non-functional, show with opacity
        return `<button data-action="${action}" title="${title} (Próximamente)" style="opacity: 0.5;">${btn.icon}</button>`;
      } else {
        return `<button data-action="${action}" title="${title}">${btn.icon}</button>`;
      }
    };

    const parts = [];

    // 1. FIXED ELEMENTS START

    // Numeración antes del checkbox (if configured)
    if (config.numeracion === 'antes-checkbox') {
      parts.push(`<span class="note-number" title="Creado el: ${new Date(noteData.creationDate || new Date()).toLocaleString()}"></span>`);
    }

    // Checkbox (fixed)
    parts.push(`<input type="checkbox" class="note-selector" title="Seleccionar nota">`);

    // Drag handle (fixed)
    parts.push(`<button class="drag-handle" data-action="drag" draggable="true" title="Arrastrar para mover">⠿</button>`);

    // Note icon (fixed)
    parts.push(`<span class="note-icon"></span>`);

    // Toggle expand/collapse (fixed, before overflow menu)
    parts.push(`<button data-action="toggle"></button>`);

    // Overflow menu (fixed, only if there are hidden buttons)
    const hasHiddenButtons = leftHidden.length > 0 || rightHidden.length > 0;
    console.log(`🔍 NoteRenderer: leftHidden=${leftHidden.length}, rightHidden=${rightHidden.length}, hasHidden=${hasHiddenButtons}`);
    if (hasHiddenButtons) {
      parts.push(`<button data-action="show-menu" title="Más Opciones">⋮</button>`);
    }

    // 2. LEFT VISIBLE BUTTONS
    leftVisible.forEach(btn => {
      parts.push(createButton(btn));
    });

    // 3. NUMERACIÓN (if antes-contenido)
    if (config.numeracion === 'antes-contenido') {
      parts.push(`<span class="note-number" title="Creado el: ${new Date(noteData.creationDate || new Date()).toLocaleString()}"></span>`);
    }

    // 4. COUNTDOWN TIMER (always between buttons and content)
    parts.push(`<span class="countdown-timer"></span>`);

    // 5. CONTENT (editable)
    parts.push(`<div class="editable-note" contenteditable="true">${noteData.content || ''}</div>`);

    // 6. RIGHT VISIBLE BUTTONS
    rightVisible.forEach(btn => {
      parts.push(createButton(btn));
    });

    // Note: Hidden buttons will be shown in the overflow menu (⋮)
    // which is handled by existing event handlers

    return `<div class="note-container">${parts.join('\n        ')}</div>`;
  }

  /**
   * Crear nota en DOM
   */
  static createNote(parentList, afterElement = null, shouldFocus = false, data = {}) {
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

    // Generate HTML using button configuration
    li.innerHTML = this.generateNoteHTML(noteData);

    // Update status button icon (if exists)
    const statusBtn = li.querySelector('[data-action="cycle-status"]');
    if (statusBtn) {
      switch(li.dataset.status) {
        case 'inprogress': statusBtn.textContent = '🟡'; break;
        case 'done': statusBtn.textContent = '🟢'; break;
        default: statusBtn.textContent = '⚪'; break;
      }
    }

    // Update note icon
    const noteIcon = li.querySelector('.note-icon');
    if (noteIcon) {
      noteIcon.textContent = noteData.icon || '';
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
   * Renderizar estado de nota (bloqueada/desbloqueada)
   */
  static renderNoteState(noteLi) {
    const hasLockData = noteLi.dataset.lockType && noteLi.dataset.passwordHash;
    const isTemporarilyUnlocked = STATE.sessionUnlockedNotes.has(noteLi.dataset.id);

    if (hasLockData && !isTemporarilyUnlocked) {
      noteLi.classList.add('is-locked');
      const editable = noteLi.querySelector('.editable-note');
      editable.setAttribute('contenteditable', 'false');
      editable.innerHTML = `🔒 <span class="lock-hint">${noteLi.dataset.lockHint || 'Contenido bloqueado'}</span>`;
    } else {
      noteLi.classList.remove('is-locked');
      const editable = noteLi.querySelector('.editable-note');
      editable.setAttribute('contenteditable', 'true');
      if (hasLockData) {
        editable.innerHTML = noteLi.dataset.lockedContent || '';
      }
      this.linkify(editable);
    }
    StateController.updateToggleVisibilityForNote(noteLi);
  }

  /**
   * Linkificar URLs en contenido
   */
  static linkify(element) {
    if (!element || (element.closest('.note') && element.closest('.note').classList.contains('is-locked'))) return;

    const urlRegex = /(https?:\/\/[^\s"'<>()]+)/g;
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      { acceptNode: (node) => node.parentElement.tagName !== 'A' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
    );

    const nodesToProcess = [];
    let node;
    while (node = walker.nextNode()) {
      if (urlRegex.test(node.textContent)) {
        nodesToProcess.push(node);
      }
    }

    if (nodesToProcess.length === 0) return;

    nodesToProcess.forEach((textNode) => {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      urlRegex.lastIndex = 0;

      while ((match = urlRegex.exec(textNode.textContent)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(textNode.textContent.substring(lastIndex, match.index)));
        }
        const a = document.createElement('a');
        a.href = match[0];
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = match[0];
        fragment.appendChild(a);
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < textNode.textContent.length) {
        fragment.appendChild(document.createTextNode(textNode.textContent.substring(lastIndex)));
      }

      if (fragment.childNodes.length > 0) {
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    });
  }

  /**
   * Renderizar vista (normal/archivo/bloqueada)
   */
  static renderView() {
    const isDocLocked = STATE.appData.documentPasswords[STATE.currentDocumentName] &&
                        !STATE.unlockedDocuments.has(STATE.currentDocumentName);

    STATE.DOM.relockDocBtn.classList.toggle('hidden',
      isDocLocked ||
      !STATE.appData.documentPasswords[STATE.currentDocumentName] ||
      !STATE.unlockedDocuments.has(STATE.currentDocumentName)
    );

    if (isDocLocked) {
      STATE.DOM.notesList.innerHTML = `
        <div id="doc-locked-message">
          <h2>🔒 Uninote Bloqueado</h2>
          <p>Este Uninote está protegido por contraseña.</p>
          <button id="unlock-doc-btn" class="modal-button confirm-action">Desbloquear Uninote</button>
        </div>`;
      STATE.DOM.archiveViewContainer.classList.add('hidden');
      STATE.DOM.globalSearchResults.classList.add('hidden');
      STATE.DOM.notesCounter.classList.add('hidden');
      return;
    }

    STATE.DOM.notesCounter.classList.remove('hidden');

    if (STATE.isArchiveViewActive) {
      document.body.dataset.viewMode = 'archive';
      STATE.DOM.notesList.classList.add('hidden');
      STATE.DOM.archiveViewContainer.classList.remove('hidden');
      STATE.DOM.globalSearchResults.classList.add('hidden');
      STATE.DOM.toggleArchiveViewBtn.textContent = '📖 Ver Activas';
      STATE.DOM.addMainNoteBtn.classList.add('hidden');
      STATE.DOM.notesCounter.classList.add('hidden');

      if (window.ArchiveService) {
        window.ArchiveService.renderArchiveTimeline();
      }
    } else {
      document.body.dataset.viewMode = 'active';
      STATE.DOM.notesList.classList.remove('hidden');
      STATE.DOM.archiveViewContainer.classList.add('hidden');

      if (!STATE.DOM.searchAllToggle.checked || !STATE.DOM.searchInput.value) {
        STATE.DOM.globalSearchResults.classList.add('hidden');
      }

      STATE.DOM.toggleArchiveViewBtn.textContent = '📦 Archivo';
      STATE.DOM.addMainNoteBtn.classList.remove('hidden');
      STATE.DOM.notesCounter.classList.remove('hidden');
    }

    StateController.runUpdates();
  }

  /**
   * Renderizar UI completa de la app
   */
  static renderAppUI() {
    STATE.DOM.documentTitle.textContent = `${STATE.currentDocumentName} ▾`;
    this.renderDocumentMenu();
    this.renderTabs();
    this.loadNotesFromData(STATE.currentNotesData);
  }

  /**
   * Renderizar menú de documentos
   */
  static renderDocumentMenu() {
    const documentMenu = STATE.DOM.documentMenu;
    documentMenu.innerHTML = '';

    STATE.appData.documents.forEach(docName => {
      const li = document.createElement('li');
      li.dataset.docName = docName;
      const isProtected = STATE.appData.documentPasswords[docName] ? '🔒' : '';
      const isDefault = STATE.appData.defaultDocument === docName ? ' (Principal)' : '';
      li.innerHTML = `
        <span class="doc-name">${docName} ${isProtected}${isDefault}</span>
        <span class="favorite-star ${STATE.appData.favorites.includes(docName) ? 'is-favorite' : ''}" data-action="toggle-favorite">☆</span>
      `;
      if (docName === STATE.currentDocumentName) {
        li.classList.add('active-doc');
      }
      documentMenu.appendChild(li);
    });

    documentMenu.innerHTML += `<hr>`;
    documentMenu.innerHTML += `<li data-action="create">➕ Crear nuevo Uninote</li>`;
    documentMenu.innerHTML += `<li data-action="rename">✏️ Renombrar "${STATE.currentDocumentName}"</li>`;
    documentMenu.innerHTML += `<li data-action="set-default">🏠 Establecer como principal</li>`;
    documentMenu.innerHTML += `<li data-action="set-doc-pass">🔑 Gestionar Contraseña</li>`;
    documentMenu.innerHTML += `<li data-action="delete" style="color: #e53935;">🗑️ Eliminar "${STATE.currentDocumentName}"</li>`;
  }

  /**
   * Renderizar tabs de favoritos
   */
  static renderTabs() {
    const tabsContainer = STATE.DOM.tabsContainer;
    tabsContainer.innerHTML = '';

    STATE.appData.favorites.forEach(favName => {
      const tab = document.createElement('button');
      tab.className = 'tab-button';
      const isProtected = STATE.appData.documentPasswords[favName] ? '🔒' : '';
      tab.textContent = `${favName} ${isProtected}`;
      tab.dataset.docName = favName;
      if (favName === STATE.currentDocumentName) {
        tab.classList.add('active');
      }
      tabsContainer.appendChild(tab);
    });
  }
}

// Exportar globalmente
window.NoteRenderer = NoteRenderer;
window.createNote = NoteRenderer.createNote.bind(NoteRenderer);
window.renderNoteState = NoteRenderer.renderNoteState.bind(NoteRenderer);
window.renderView = NoteRenderer.renderView.bind(NoteRenderer);
window.renderAppUI = NoteRenderer.renderAppUI.bind(NoteRenderer);
window.loadNotesFromData = NoteRenderer.loadNotesFromData.bind(NoteRenderer);

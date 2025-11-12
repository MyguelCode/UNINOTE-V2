/**
 * noteEvents.js - Event handlers for note interactions
 */

import { STATE } from '../config/state.js';
import { NoteController } from '../controllers/NoteController.js';
import { StateController } from '../controllers/StateController.js';
import { DocumentController } from '../controllers/DocumentController.js';
import { NoteRenderer } from '../ui/NoteRenderer.js';

export function initializeNoteEvents() {
  const notesList = document.getElementById('notes-list');
  const iconPicker = document.getElementById('icon-picker');
  const lockMenu = document.getElementById('lock-menu');
  const overflowMenu = document.getElementById('overflow-menu');
  const datePickerModalOverlay = document.getElementById('date-picker-modal-overlay');
  const dateTimeInput = document.getElementById('date-time-input');
  const removeIconBtn = document.getElementById('remove-icon-btn');

  // Overflow menu click handler
  overflowMenu.addEventListener('click', async (e) => {
    // ⚡ CRÍTICO: Detener propagación INMEDIATAMENTE para evitar que el global click handler cierre el menú
    e.stopPropagation();

    console.log('🔵 OVERFLOW MENU CLICKED', {
      target: e.target,
      tagName: e.target.tagName,
      classList: e.target.classList.toString(),
      hasIconGrid: overflowMenu.classList.contains('icon-grid'),
      display: overflowMenu.style.display
    });

    // Ignorar clicks si el menú está cerrado (puede pasar si se cerró por global click handler)
    if (overflowMenu.style.display === 'none') {
      console.log('⚠️ OVERFLOW MENU: Menú está cerrado, ignorando click');
      return;
    }

    // Buscar el botón - funciona incluso si el click fue en un text node (emoji)
    const button = e.target.closest('button');
    console.log('🔵 Button found:', button, 'action:', button?.dataset?.action);

    if (!button) {
      console.log('❌ No button found in click target (probablemente espacio vacío del grid)');
      console.log('🔵 CERRANDO MENÚ por click en espacio vacío');
      overflowMenu.style.display = 'none';
      overflowMenu.classList.remove('icon-grid'); // ⚡ Remover clase para que CSS no interfiera
      STATE.activeNoteForMenu = null;
      return;
    }

    const noteLi = STATE.activeNoteForMenu;
    if (!noteLi) {
      console.log('❌ No activeNoteForMenu in STATE');
      // ⚡ CRÍTICO: Cerrar menú incluso si no hay activeNoteForMenu
      overflowMenu.style.display = 'none';
      overflowMenu.classList.remove('icon-grid'); // ⚡ Remover clase para que CSS no interfiera
      STATE.activeNoteForMenu = null;
      return;
    }

    console.log('✅ Processing overflow menu action:', button.dataset.action);

    const noteId = noteLi.dataset.id;
    const { note: noteData, parentArray, index } = NoteController.findNoteData(STATE.currentNotesData, noteId) || {};

    // Ejecutar acción del botón con try-finally para GARANTIZAR que el menú se cierre
    try {
      const action = button.dataset.action;
      await handleNoteAction(e, action, noteLi, noteData, parentArray, index, button);
    } finally {
      // ⚡ CRÍTICO: SIEMPRE cerrar menú, incluso si hay error o el usuario cancela el modal
      console.log('🔵 FINALLY: Cerrando overflow menu (GARANTIZADO)');
      overflowMenu.style.display = 'none';
      overflowMenu.classList.remove('icon-grid'); // ⚡ Remover clase para que CSS display:grid !important no interfiera

      // ⚡ IMPORTANTE: No limpiar activeNoteForMenu si la acción fue emoji-picker
      // porque el emoji picker necesita que persista para aplicar el emoji seleccionado
      if (button.dataset.action !== 'emoji-picker') {
        STATE.activeNoteForMenu = null;
      }
      console.log('🔵 FINALLY: Overflow menu cerrado, activeNoteForMenu =', STATE.activeNoteForMenu?.dataset?.id || 'null');
    }
  });

  // Main note click handler
  document.querySelector('main').addEventListener('click', async (e) => {
    // Unlock document button
    const unlockDocBtn = e.target.closest('#unlock-doc-btn');
    if (unlockDocBtn) {
      await window.DocumentController.switchDocument(STATE.currentDocumentName);
      return;
    }

    // Locked note click
    const noteLi = e.target.closest('.note');
    if (noteLi && noteLi.classList.contains('is-locked')) {
      STATE.activeNoteForLock = noteLi;
      document.getElementById('unlock-modal-overlay').querySelector('h2').textContent = 'Desbloquear Nota';
      document.getElementById('unlock-password-input').value = '';
      document.getElementById('unlock-modal-overlay').classList.remove('hidden');
      document.getElementById('unlock-password-input').focus();
      return;
    }

    // External link clicks
    const link = e.target.closest('a');
    if (link && link.href) {
      e.preventDefault();
      window.open(link.href, '_blank', 'noopener,noreferrer');
      return;
    }

    // Note selector checkbox
    if (e.target.matches('.note-selector')) {
      const noteLiCheckbox = e.target.closest('.note');
      if (e.target.checked) STATE.selectedNotes.add(noteLiCheckbox);
      else STATE.selectedNotes.delete(noteLiCheckbox);
      noteLiCheckbox.classList.toggle('selected');
      if (window.Features) window.Features.updateBulkActionsBar();
      return;
    }

    // Group header toggle (archive view)
    const groupHeader = e.target.closest('.group-header');
    if (groupHeader) {
      const groupContainer = groupHeader.parentElement;
      groupContainer.classList.toggle('collapsed');
      return;
    }

    // Action buttons
    const target = e.target.closest('button');
    if (!target || !target.dataset.action) return;

    const action = target.dataset.action;
    if (action === 'drag' || action === 'unarchive') return;
    if (!noteLi) return;

    const noteId = noteLi.dataset.id;
    const { note: noteData, parentArray, index } = NoteController.findNoteData(STATE.currentNotesData, noteId) || {};

    await handleNoteAction(e, action, noteLi, noteData, parentArray, index, target);
  });

  // Context menu (right-click) on notes
  notesList.addEventListener('contextmenu', e => {
    const targetElement = e.target.closest('.note-container');
    if (targetElement && !targetElement.closest('.note.is-locked')) {
      e.preventDefault();
      STATE.activeNoteForMenu = targetElement.closest('.note');

      const rect = targetElement.getBoundingClientRect();
      iconPicker.style.display = 'block';
      iconPicker.style.top = `${rect.bottom + window.scrollY + 5}px`;
      let menuLeftPos = rect.left - iconPicker.offsetWidth + rect.width;
      if (menuLeftPos < 0) menuLeftPos = 5;
      iconPicker.style.left = `${menuLeftPos + window.scrollX}px`;

      document.querySelector('.picker-tabs button[data-tab="common"]').click();
    }
  });

  // Remove icon button
  removeIconBtn.addEventListener('click', () => {
    if (STATE.activeNoteForMenu) {
      const noteId = STATE.activeNoteForMenu.dataset.id;
      const { note: noteData } = NoteController.findNoteData(STATE.currentNotesData, noteId) || {};
      if (noteData) {
        delete noteData.icon;
        STATE.activeNoteForMenu.querySelector('.note-icon').textContent = '';
        iconPicker.style.display = 'none';
        StateController.runUpdates();
      }
    }
  });

  // Keydown events (Enter, Tab, Backspace)
  notesList.addEventListener('keydown', async (e) => {
    if (STATE.isArchiveViewActive) return;

    const editableDiv = e.target.closest('.editable-note');
    if (!editableDiv) return;

    const noteLi = editableDiv.closest('.note');
    if (!noteLi || noteLi.classList.contains('is-locked')) return;

    const noteId = noteLi.dataset.id;
    const { note: noteData, parentArray, index } = NoteController.findNoteData(STATE.currentNotesData, noteId) || {};

    // Enter key - Add sibling
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!parentArray) return;

      const newSiblingData = {
        id: crypto.randomUUID(),
        content: '',
        status: 'todo',
        creationDate: new Date().toISOString(),
        children: []
      };

      parentArray.splice(index + 1, 0, newSiblingData);
      const newSiblingLi = window.createNote(noteLi.parentElement, noteLi, true, newSiblingData);
      NoteRenderer.renderNoteState(newSiblingLi);
      StateController.runUpdates();
    }

    // Tab key - Add subnote
    else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (!noteData) return;

      const newSubnoteData = {
        id: crypto.randomUUID(),
        content: '',
        status: 'todo',
        creationDate: new Date().toISOString(),
        children: []
      };

      if (!noteData.children) noteData.children = [];
      noteData.children.push(newSubnoteData);

      let sublist = noteLi.querySelector('.subnotes');
      if (!sublist) {
        sublist = document.createElement('ul');
        sublist.className = 'subnotes';
        noteLi.appendChild(sublist);
      }

      const newSubnoteLi = window.createNote(sublist, null, true, newSubnoteData);
      NoteRenderer.renderNoteState(newSubnoteLi);
      sublist.classList.remove('hidden');
      StateController.runUpdates();
    }

    // Backspace on empty note - Delete
    else if (e.key === 'Backspace' && editableDiv.textContent.trim() === '') {
      e.preventDefault();

      if (parentArray && parentArray.length > 1) {
        parentArray.splice(index, 1);

        const previousNote = noteLi.previousElementSibling;
        noteLi.remove();

        if (previousNote) {
          const prevEditable = previousNote.querySelector('.editable-note');
          if (prevEditable) {
            prevEditable.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(prevEditable);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }

        NoteController.ensureAtLeastOneNote();
        StateController.runUpdates();
      }
    }
  });

  // Focus out - Save content
  notesList.addEventListener('focusout', async (e) => {
    const editableDiv = e.target.closest('.editable-note');
    if (!editableDiv) return;

    const noteLi = editableDiv.closest('.note');
    if (!noteLi || noteLi.classList.contains('is-locked')) return;

    const noteId = noteLi.dataset.id;
    const { note: noteData } = NoteController.findNoteData(STATE.currentNotesData, noteId) || {};

    if (noteData) {
      const newContent = editableDiv.innerHTML.trim();
      if (noteData.content !== newContent) {
        noteData.content = newContent;

        clearTimeout(STATE.saveTimeout);
        STATE.saveTimeout = setTimeout(async () => {
          await DocumentController.saveCurrentDocument();
        }, 500);
      }
    }

    NoteRenderer.linkify(editableDiv);
  });

  // Add main note button
  document.getElementById('add-main-note-btn').addEventListener('click', () => {
    if (STATE.isArchiveViewActive) return;

    const newNoteData = {
      id: crypto.randomUUID(),
      content: '',
      status: 'todo',
      creationDate: new Date().toISOString(),
      children: []
    };

    STATE.currentNotesData.push(newNoteData);
    const newLi = window.createNote(notesList, null, true, newNoteData);
    NoteRenderer.renderNoteState(newLi);
    StateController.runUpdates();
  });
}

/**
 * Handle note action from button clicks
 */
async function handleNoteAction(e, action, noteLi, noteData, parentArray, index, target) {
  const lockMenu = document.getElementById('lock-menu');
  const iconPicker = document.getElementById('icon-picker');
  const datePickerModalOverlay = document.getElementById('date-picker-modal-overlay');
  const dateTimeInput = document.getElementById('date-time-input');

  switch (action) {
    case 'lock':
      e.stopPropagation();
      STATE.activeNoteForLock = noteLi;
      const rect = target.getBoundingClientRect();
      const lockScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const lockScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      lockMenu.style.display = 'block';
      lockMenu.style.top = `${rect.bottom + lockScrollTop + 5}px`;
      let leftPos = rect.left - lockMenu.offsetWidth + rect.width;
      lockMenu.style.left = `${Math.max(5, leftPos) + lockScrollLeft}px`;

      const hasLockData = noteLi.dataset.lockType && noteLi.dataset.passwordHash;
      const isTemporarilyUnlocked = STATE.sessionUnlockedNotes.has(noteLi.dataset.id);

      lockMenu.querySelector('[data-action="lock-universal"]').style.display = hasLockData ? 'none' : 'block';
      lockMenu.querySelector('[data-action="lock-document"]').style.display = hasLockData ? 'none' : 'block';
      lockMenu.querySelector('[data-action="lock-exclusive"]').style.display = hasLockData ? 'none' : 'block';
      lockMenu.querySelector('[data-action="unlock"]').style.display = hasLockData && !isTemporarilyUnlocked ? 'block' : 'none';
      lockMenu.querySelector('[data-action="relock"]').style.display = isTemporarilyUnlocked ? 'block' : 'none';
      lockMenu.querySelector('[data-action="remove-lock"]').style.display = hasLockData ? 'block' : 'none';
      lockMenu.querySelector('hr').style.display = hasLockData ? 'block' : 'none';

      lockMenu.querySelector('[data-action="lock-universal"]').disabled = !STATE.appData.universalPasswordHash;
      lockMenu.querySelector('[data-action="lock-document"]').disabled = !STATE.appData.documentPasswords[STATE.currentDocumentName];
      break;

    case 'archive':
      if (!noteData) return;
      noteData.isArchived = true;
      noteData.archivedTimestamp = new Date().toISOString();
      noteLi.remove();

      if (document.getElementById('notes-list').children.length === 0) {
        STATE.isArchiveViewActive = true;
        NoteRenderer.renderView();
      } else {
        StateController.runUpdates();
      }
      break;

    case 'set-date':
      STATE.activeNoteForDatePicker = noteLi;
      const currentDueDate = noteLi.dataset.dueDate;
      if (currentDueDate) {
        dateTimeInput.value = currentDueDate.slice(0, 16);
      } else {
        dateTimeInput.value = '';
      }
      datePickerModalOverlay.classList.remove('hidden');
      break;

    case 'emoji-picker':
      e.stopPropagation();
      const emojiRect = target.getBoundingClientRect();
      const emojiScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const emojiScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      iconPicker.style.display = 'block';
      iconPicker.style.top = `${emojiRect.bottom + emojiScrollTop + 5}px`;
      let emojiLeftPos = emojiRect.left - iconPicker.offsetWidth + emojiRect.width;
      if (emojiLeftPos < 0) emojiLeftPos = 5;
      iconPicker.style.left = `${emojiLeftPos + emojiScrollLeft}px`;
      STATE.activeNoteForMenu = noteLi;
      document.querySelector('.picker-tabs button[data-tab="common"]').click();
      break;

    case 'show-menu':
      // Show overflow menu with hidden buttons
      console.log('🟢 SHOW-MENU: Abriendo overflow menu');
      e.stopPropagation();

      // Obtener botones ocultos
      const { leftHidden, rightHidden } = window.ButtonConfigService.getButtonsForNote(STATE.isArchiveViewActive);
      const allHiddenButtons = [...leftHidden, ...rightHidden];

      console.log('🟢 SHOW-MENU: Botones ocultos:', allHiddenButtons.length, allHiddenButtons.map(b => b.label));

      if (allHiddenButtons.length === 0) {
        console.log('⚠️ No hay botones ocultos para mostrar en el menú');
        return;
      }

      const overflowMenu = document.getElementById('overflow-menu');
      const config = window.ButtonConfigService.getConfig();

      console.log('🟢 SHOW-MENU: Config menuShowText:', config.menuShowText);

      // Aplicar clase para grid si es solo iconos
      if (config.menuShowText) {
        overflowMenu.classList.remove('icon-grid');
        console.log('🟢 SHOW-MENU: Modo LISTA (con texto)');
      } else {
        overflowMenu.classList.add('icon-grid');
        console.log('🟢 SHOW-MENU: Modo GRID (solo iconos)');
      }

      // Generar contenido del menú
      overflowMenu.innerHTML = '';
      allHiddenButtons.forEach(btn => {
        const button = document.createElement('button');
        button.dataset.action = btn.action;

        // Determinar icono y contenido según el tipo de botón (misma lógica que botones visibles)
        let buttonIcon = btn.icon;
        let buttonLabel = btn.label;

        // Lógica especial para ciertos botones (igual que en NoteRenderer.js)
        if (btn.id === 'estado') {
          // Obtener el estado actual de la nota
          const currentStatus = noteLi.dataset.status || 'todo';
          switch(currentStatus) {
            case 'inprogress':
              buttonIcon = '🟡';
              buttonLabel = 'Estado: En Progreso';
              break;
            case 'done':
              buttonIcon = '🟢';
              buttonLabel = 'Estado: Hecho';
              break;
            default:
              buttonIcon = '⚪';
              buttonLabel = 'Estado: Sin Hacer';
              break;
          }
        } else if (btn.id === 'agregarSubNota') {
          buttonIcon = '➕';
          // Mantener el label original
        } else if (btn.id === 'candado') {
          // Verificar si la nota está bloqueada
          const hasLock = noteLi.dataset.lockType && noteLi.dataset.passwordHash;
          const isUnlocked = STATE.sessionUnlockedNotes.has(noteLi.dataset.id);
          if (hasLock && !isUnlocked) {
            buttonIcon = '🔒';
            buttonLabel = 'Bloqueada';
          } else if (hasLock && isUnlocked) {
            buttonIcon = '🔓';
            buttonLabel = 'Desbloqueada (temp)';
          } else {
            buttonIcon = '🔓';
            buttonLabel = 'Sin bloqueo';
          }
        } else if (btn.id === 'fechaLimite') {
          // Verificar si tiene fecha límite
          if (noteLi.dataset.dueDate) {
            buttonIcon = '📅';
            buttonLabel = 'Fecha límite';
          } else {
            buttonIcon = '📅';
            buttonLabel = 'Establecer fecha';
          }
        }

        // Generar contenido con o sin texto
        if (config.menuShowText) {
          button.innerHTML = `${buttonIcon} ${buttonLabel}`;
        } else {
          button.innerHTML = buttonIcon;
          button.title = buttonLabel;
        }

        // Estilo especial para botones Phase 2 (no funcionales)
        if (!btn.functional) {
          button.style.opacity = '0.5';
          button.title = `${buttonLabel} (Próximamente)`;
        }

        overflowMenu.appendChild(button);
      });

      console.log('🟢 SHOW-MENU: Botones creados en el DOM:', overflowMenu.children.length);

      // Posicionar y mostrar menú
      const menuRect = target.getBoundingClientRect();

      // Respetar el modo grid o block según la clase icon-grid
      if (config.menuShowText) {
        overflowMenu.style.display = 'block';
      } else {
        overflowMenu.style.display = 'grid';
      }

      // Calcular dimensiones del viewport
      const viewportHeight = window.innerHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // Margen de seguridad
      const MARGIN = 10;
      const MAX_HEIGHT = viewportHeight - (MARGIN * 2);

      // Establecer max-height para evitar que el menú sea demasiado alto
      overflowMenu.style.maxHeight = `${MAX_HEIGHT}px`;
      overflowMenu.style.overflowY = 'auto';

      // Posicionar temporalmente para obtener altura real
      overflowMenu.style.visibility = 'hidden';
      overflowMenu.style.display = config.menuShowText ? 'block' : 'grid';
      const menuHeight = Math.min(overflowMenu.offsetHeight, MAX_HEIGHT);
      overflowMenu.style.visibility = 'visible';

      // Calcular espacio disponible
      const buttonBottom = menuRect.bottom;
      const buttonTop = menuRect.top;
      const spaceBelow = viewportHeight - buttonBottom;
      const spaceAbove = buttonTop;

      let menuTop;

      // Decidir si mostrar arriba o abajo
      if (spaceBelow >= menuHeight + MARGIN) {
        // Hay espacio abajo: mostrar debajo del botón
        menuTop = buttonBottom + MARGIN;
      } else if (spaceAbove >= menuHeight + MARGIN) {
        // No cabe abajo pero sí arriba: mostrar arriba del botón
        menuTop = buttonTop - menuHeight - MARGIN;
      } else {
        // No cabe completo ni arriba ni abajo: usar el lado con más espacio
        if (spaceBelow > spaceAbove) {
          // Más espacio abajo: alinear con el bottom del viewport
          menuTop = viewportHeight - menuHeight - MARGIN;
        } else {
          // Más espacio arriba: alinear con el top del viewport
          menuTop = MARGIN;
        }
      }

      // Asegurar que el menú nunca se salga del viewport
      menuTop = Math.max(MARGIN, Math.min(menuTop, viewportHeight - menuHeight - MARGIN));

      // Posición horizontal (alineado a la derecha del botón)
      let menuLeftPos = menuRect.left - overflowMenu.offsetWidth + menuRect.width;
      if (menuLeftPos < MARGIN) menuLeftPos = MARGIN;
      if (menuLeftPos + overflowMenu.offsetWidth > window.innerWidth - MARGIN) {
        menuLeftPos = window.innerWidth - overflowMenu.offsetWidth - MARGIN;
      }

      // Aplicar posición final - IMPORTANTE: Agregar scroll offset para position: absolute
      overflowMenu.style.top = `${menuTop + scrollTop}px`;
      overflowMenu.style.left = `${menuLeftPos + scrollLeft}px`;

      console.log('🟢 SHOW-MENU: Menú posicionado y mostrado', {
        display: overflowMenu.style.display,
        hasIconGrid: overflowMenu.classList.contains('icon-grid'),
        top: overflowMenu.style.top,
        left: overflowMenu.style.left,
        maxHeight: overflowMenu.style.maxHeight,
        menuHeight: menuHeight,
        viewportHeight: viewportHeight,
        buttonBottom: buttonBottom,
        buttonTop: buttonTop,
        spaceBelow: spaceBelow,
        spaceAbove: spaceAbove
      });

      STATE.activeNoteForMenu = noteLi;
      console.log('🟢 SHOW-MENU: STATE.activeNoteForMenu establecido');
      break;

    case 'duplicate':
      if (!noteData) return;

      const duplicateChoice = await window.NotificationService.showDuplicateModal();
      if (!duplicateChoice) return;

      let noteDataToDup;

      if (duplicateChoice === 'only') {
        noteDataToDup = {
          id: crypto.randomUUID(),
          content: noteData.content,
          status: noteData.status,
          creationDate: new Date().toISOString(),
          icon: noteData.icon,
          dueDate: noteData.dueDate,
          children: []
        };
      } else if (duplicateChoice === 'with-children') {
        noteDataToDup = JSON.parse(JSON.stringify(noteData));
        const assignNewIds = (note) => {
          note.id = crypto.randomUUID();
          note.creationDate = new Date().toISOString();
          if (note.children) {
            note.children.forEach(assignNewIds);
          }
        };
        assignNewIds(noteDataToDup);
      }

      parentArray.splice(index + 1, 0, noteDataToDup);
      const newLi = window.createNote(noteLi.parentElement, noteLi, true, noteDataToDup);

      if (noteDataToDup.children && noteDataToDup.children.length > 0) {
        const sublist = document.createElement('ul');
        sublist.className = 'subnotes';
        newLi.appendChild(sublist);

        const renderChildren = (childrenArray, parentList) => {
          childrenArray.forEach(childData => {
            const childLi = window.createNote(parentList, null, false, childData);
            if (childData.children && childData.children.length > 0) {
              const childSublist = document.createElement('ul');
              childSublist.className = 'subnotes';
              childLi.appendChild(childSublist);
              renderChildren(childData.children, childSublist);
            }
            NoteRenderer.renderNoteState(childLi);
          });
        };

        renderChildren(noteDataToDup.children, sublist);
      }

      NoteRenderer.renderNoteState(newLi);
      StateController.runUpdates();
      await DocumentController.saveCurrentDocument();
      break;

    case 'cycle-status':
      const currentStatus = noteLi.dataset.status;
      let nextStatus, nextIcon, nextTitle;

      if (currentStatus === 'todo') {
        nextStatus = 'inprogress';
        nextIcon = '🟡';
        nextTitle = 'Estado: En Proceso';
      } else if (currentStatus === 'inprogress') {
        nextStatus = 'done';
        nextIcon = '🟢';
        nextTitle = 'Estado: Hecho';
      } else {
        nextStatus = 'todo';
        nextIcon = '⚪';
        nextTitle = 'Estado: Sin Hacer';
      }

      // Actualizar estado en dataset y noteData
      noteLi.dataset.status = nextStatus;
      if (noteData) noteData.status = nextStatus;

      // Actualizar botón que se clickeó (puede ser el visible o el del menú)
      target.textContent = nextIcon;
      target.title = nextTitle;

      // IMPORTANTE: Si existe un botón de estado visible en la nota, también actualizarlo
      // (esto es necesario cuando el click viene del menú overflow)
      const visibleStatusBtn = noteLi.querySelector('[data-action="cycle-status"]');
      if (visibleStatusBtn && visibleStatusBtn !== target) {
        visibleStatusBtn.textContent = nextIcon;
        visibleStatusBtn.title = nextTitle;
      }

      const parentNote = noteLi.parentElement.closest('.note');
      NoteController.checkParentStatus(parentNote);
      StateController.runUpdates();

      // Guardar documento después de cambiar estado
      await DocumentController.saveCurrentDocument();
      break;

    case 'toggle':
      const subnotes = noteLi.querySelector('.subnotes');
      if (subnotes) {
        const isHidden = subnotes.classList.contains('hidden');
        subnotes.classList.toggle('hidden');

        if (noteData) {
          noteData.isCollapsed = !isHidden;
        }

        window.updateToggleVisibilityForNote(noteLi);
        await DocumentController.saveCurrentDocument();
      }
      break;

    case 'add-sibling':
      if (!parentArray) return;
      const newSiblingData = {
        id: crypto.randomUUID(),
        content: '',
        status: 'todo',
        creationDate: new Date().toISOString(),
        children: []
      };
      parentArray.splice(index + 1, 0, newSiblingData);
      const newSiblingLi = window.createNote(noteLi.parentElement, noteLi, true, newSiblingData);
      NoteRenderer.renderNoteState(newSiblingLi);
      StateController.runUpdates();
      break;

    case 'add-subnote':
      if (!noteData) return;
      const newSubnoteData = {
        id: crypto.randomUUID(),
        content: '',
        status: 'todo',
        creationDate: new Date().toISOString(),
        children: []
      };

      if (!noteData.children) noteData.children = [];
      noteData.children.push(newSubnoteData);

      let sublist = noteLi.querySelector('.subnotes');
      if (!sublist) {
        sublist = document.createElement('ul');
        sublist.className = 'subnotes';
        noteLi.appendChild(sublist);
      }

      const newSubnoteLi = window.createNote(sublist, null, true, newSubnoteData);
      NoteRenderer.renderNoteState(newSubnoteLi);
      sublist.classList.remove('hidden');
      StateController.runUpdates();
      break;

    case 'delete':
      if (noteLi.dataset.lockType) {
        const confirmed = await window.NotificationService.showConfirmationModal(
          'Eliminar Nota Bloqueada',
          'Esta nota está bloqueada. ¿Estás seguro de que quieres eliminarla permanentemente?'
        );
        if (!confirmed) return;
      }

      if (parentArray) {
        parentArray.splice(index, 1);
      }
      noteLi.remove();
      NoteController.ensureAtLeastOneNote();
      StateController.runUpdates();
      break;

    // Phase 2 actions (not yet implemented)
    case 'pin':
      window.NotificationService.showNotification('Función "Fijar nota" próximamente', 'info');
      break;

    case 'move-top':
      window.NotificationService.showNotification('Función "Mover al inicio" próximamente', 'info');
      break;

    case 'move-bottom':
      window.NotificationService.showNotification('Función "Mover al final" próximamente', 'info');
      break;

    case 'move-to':
      window.NotificationService.showNotification('Función "Mover a posición" próximamente', 'info');
      break;

    case 'promote':
      window.NotificationService.showNotification('Función "Promover a principal" próximamente', 'info');
      break;
  }
}

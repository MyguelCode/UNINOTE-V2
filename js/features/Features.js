/**
 * Features - Funcionalidades consolidadas
 */

import { STATE } from '../config/state.js';
import { COMMON_EMOJIS, EMOJIS } from '../config/constants.js';
import { StateController } from '../controllers/StateController.js';
import { NoteController } from '../controllers/NoteController.js';

export class Features {

  /**
   * ========== EMOJI PICKER ==========
   */
  static populateEmojiPicker() {
    const commonPanel = document.getElementById('panel-common');
    commonPanel.innerHTML = '';
    COMMON_EMOJIS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      commonPanel.appendChild(btn);
    });

    for (const category in EMOJIS) {
      const panel = document.getElementById(`panel-${category}`);
      if(!panel) continue;
      panel.innerHTML = '';
      EMOJIS[category].forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        panel.appendChild(btn);
      });
    }
    this.updateRecentEmojis();
  }

  static updateRecentEmojis() {
    const panel = document.getElementById('panel-recents');
    if(!panel) return;
    panel.innerHTML = '';
    STATE.recentEmojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      panel.appendChild(btn);
    });
  }

  static async addEmojiToRecents(emoji) {
    STATE.recentEmojis = STATE.recentEmojis.filter(e => e !== emoji);
    STATE.recentEmojis.unshift(emoji);
    if (STATE.recentEmojis.length > 24) STATE.recentEmojis.pop();

    if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
      await window.saveSettingAsync('Recents', STATE.recentEmojis);
    } else {
      localStorage.setItem('uninoteRecents', JSON.stringify(STATE.recentEmojis));
    }
    this.updateRecentEmojis();
  }

  /**
   * ========== FORMATTING TOOLBAR ==========
   */
  static showFormattingToolbar() {
    setTimeout(() => {
      const selection = window.getSelection();
      const formattingToolbar = STATE.DOM.formattingToolbar;

      if (!selection.rangeCount || selection.isCollapsed) {
        formattingToolbar.style.display = 'none';
        return;
      }

      const range = selection.getRangeAt(0);
      const parentEditable = range.commonAncestorContainer.parentElement?.closest('.editable-note');

      if (parentEditable && !parentEditable.closest('.note.is-locked')) {
        STATE.lastSelectionRange = range.cloneRange();
        const rect = range.getBoundingClientRect();
        formattingToolbar.style.display = 'flex';

        const toolbarHeight = formattingToolbar.offsetHeight;
        const topPos = rect.top + window.scrollY - toolbarHeight - 5;
        formattingToolbar.style.top = `${topPos}px`;

        const leftPos = rect.left + window.scrollX + (rect.width / 2) - (formattingToolbar.offsetWidth / 2);
        formattingToolbar.style.left = `${Math.max(5, leftPos)}px`;

        this.updateToolbarState();
      } else {
        formattingToolbar.style.display = 'none';
      }
    }, 10);
  }

  static updateToolbarState() {
    if (!STATE.lastSelectionRange) return;

    const isBold = document.queryCommandState('bold');
    document.querySelector('[data-command="bold"]')?.classList.toggle('active', isBold);

    const container = STATE.lastSelectionRange.startContainer.nodeType === 1 ?
      STATE.lastSelectionRange.startContainer :
      STATE.lastSelectionRange.startContainer.parentElement;

    const sizeSpan = container.closest('span[style*="font-size"]');
    const fontSizeInput = STATE.DOM.fontSizeInput;
    if (fontSizeInput) {
      fontSizeInput.value = sizeSpan && sizeSpan.style.fontSize ?
        parseInt(sizeSpan.style.fontSize, 10) || 16 : 16;
    }
  }

  static restoreSelection() {
    const selection = window.getSelection();
    if (STATE.lastSelectionRange) {
      selection.removeAllRanges();
      selection.addRange(STATE.lastSelectionRange);
    }
  }

  static applyStyle(command, value = null) {
    this.restoreSelection();
    try {
      document.execCommand(command, false, value);
    } catch (e) {
      console.error(`Error al ejecutar el comando ${command}:`, e);
    }

    const activeEditable = document.activeElement.closest('.editable-note');
    if (activeEditable && window.getSelection().rangeCount > 0) {
      STATE.lastSelectionRange = window.getSelection().getRangeAt(0).cloneRange();
      this.updateToolbarState();
    }
  }

  static changeFontSize(direction) {
    this.restoreSelection();
    if (!STATE.lastSelectionRange || STATE.lastSelectionRange.collapsed) return;

    const fontSizeInput = STATE.DOM.fontSizeInput;
    let currentSize = parseInt(fontSizeInput.value, 10);
    let newSize = direction === 'input' ?
      parseInt(fontSizeInput.value, 10) :
      (direction === 'increase' ? currentSize + 1 : currentSize - 1);

    newSize = Math.max(12, Math.min(24, newSize));

    const span = document.createElement('span');
    span.style.fontSize = `${newSize}px`;

    try {
      STATE.lastSelectionRange.surroundContents(span);
      const selection = window.getSelection();
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
      STATE.lastSelectionRange = newRange.cloneRange();
    } catch (e) {
      console.warn("surroundContents falló.", e);
      this.restoreSelection();
    }

    this.updateToolbarState();
  }

  /**
   * ========== NOTIFICATIONS ==========
   */
  static async checkAndTriggerNotifications() {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    let urgentNotes = [];

    const findUrgentRecursive = (notes) => {
      notes.forEach(note => {
        const isNoteLocked = note.lockType && !STATE.sessionUnlockedNotes.has(note.id);
        if (isNoteLocked || note.status === 'done' || !note.dueDate || note.isArchived) return;

        const dueDate = new Date(note.dueDate);
        const diffMinutes = (dueDate - now) / (1000 * 60);

        if (diffMinutes <= 60) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = note.content;
          urgentNotes.push({
            id: note.id,
            text: (tempDiv.textContent || tempDiv.innerText || "").substring(0, 100),
            dueDate: dueDate,
            isOverdue: diffMinutes < 0
          });
        }

        if (note.children) {
          findUrgentRecursive(note.children);
        }
      });
    };

    findUrgentRecursive(STATE.currentNotesData);

    this.populateNotificationCenter(urgentNotes);

    const hasUnseen = urgentNotes.some(n => !STATE.seenNotifications.has(n.id));
    STATE.DOM.notificationDot.classList.toggle('hidden', !hasUnseen);

    // Cargar reportes
    let lastMorningReport, lastNoonReport, lastEveningReport;
    if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
      [lastMorningReport, lastNoonReport, lastEveningReport] = await Promise.all([
        window.loadSettingAsync('LastMorningReport'),
        window.loadSettingAsync('LastNoonReport'),
        window.loadSettingAsync('LastEveningReport')
      ]);
    } else {
      lastMorningReport = localStorage.getItem('uninoteLastMorningReport');
      lastNoonReport = localStorage.getItem('uninoteLastNoonReport');
      lastEveningReport = localStorage.getItem('uninoteLastEveningReport');
    }

    const shouldShowPopup = (
      (now.getHours() >= 7 && lastMorningReport !== todayStr) ||
      (now.getHours() >= 12 && lastNoonReport !== todayStr) ||
      (now.getHours() >= 18 && lastEveningReport !== todayStr)
    );

    if (urgentNotes.length > 0 && shouldShowPopup) {
      STATE.DOM.notificationCenterOverlay.classList.remove('hidden');

      if (window.NotificationService) {
        window.NotificationService.showNativeNotification(
          `Uninote: Tienes ${urgentNotes.length} tarea(s) urgente(s)`,
          { body: "Revisa tu centro de notificaciones para más detalles." }
        );
      }

      // Guardar reporte
      if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
        if (now.getHours() >= 18) await window.saveSettingAsync('LastEveningReport', todayStr);
        else if (now.getHours() >= 12) await window.saveSettingAsync('LastNoonReport', todayStr);
        else if (now.getHours() >= 7) await window.saveSettingAsync('LastMorningReport', todayStr);
      } else {
        if (now.getHours() >= 18) localStorage.setItem('uninoteLastEveningReport', todayStr);
        else if (now.getHours() >= 12) localStorage.setItem('uninoteLastNoonReport', todayStr);
        else if (now.getHours() >= 7) localStorage.setItem('uninoteLastMorningReport', todayStr);
      }
    }
  }

  static populateNotificationCenter(notes) {
    const notificationList = STATE.DOM.notificationList;
    notificationList.innerHTML = '';

    if (notes.length === 0) {
      notificationList.innerHTML = '<li class="notif-empty">¡Todo en orden! No hay tareas urgentes.</li>';
      return;
    }

    notes.sort((a,b) => a.dueDate - b.dueDate);

    notes.forEach(note => {
      const li = document.createElement('li');
      li.dataset.noteId = note.id;
      li.classList.add(note.isOverdue ? 'notif-overdue' : 'notif-urgent');
      li.innerHTML = `
        <span class="notif-text">${note.text || '(Nota sin texto)'}</span>
        <span class="notif-due">${note.isOverdue ? `Venció: ${note.dueDate.toLocaleString()}` : `Vence: ${note.dueDate.toLocaleString()}`}</span>
      `;
      notificationList.appendChild(li);
    });
  }

  /**
   * ========== BULK ACTIONS ==========
   */
  static updateBulkActionsBar() {
    const count = STATE.selectedNotes.size;
    if (count > 0) {
      STATE.DOM.selectionCounter.textContent = `${count} nota${count > 1 ? 's' : ''} seleccionada${count > 1 ? 's' : ''}`;
      STATE.DOM.bulkActionsBar.classList.add('visible');
    } else {
      STATE.DOM.bulkActionsBar.classList.remove('visible');
    }
  }
}

// Exportar globalmente
window.Features = Features;
window.populateEmojiPicker = Features.populateEmojiPicker.bind(Features);
window.checkAndTriggerNotifications = Features.checkAndTriggerNotifications.bind(Features);

/**
 * StateController - Gestión del estado global y actualizaciones
 */

import { STATE } from '../config/state.js';

export class StateController {

  /**
   * Ejecutar todas las actualizaciones
   */
  static runUpdates() {
    const searchAllToggle = STATE.DOM.searchAllToggle;
    const searchInput = STATE.DOM.searchInput;

    if (searchAllToggle && searchAllToggle.checked && searchInput && searchInput.value) return;

    this.updateNumbers();
    this.updateNotesCounter();
    this.updateToggleVisibility();
    this.updateIconVisibility();
    this.updateAllCountdowns();

    if (!STATE.isInitializing) {
      if (!STATE.isArchiveViewActive && window.checkAndTriggerNotifications) {
        window.checkAndTriggerNotifications();
      }
      // Debounced save
      clearTimeout(STATE.saveTimeout);
      STATE.saveTimeout = setTimeout(() => {
        if (window.saveCurrentDocument) {
          window.saveCurrentDocument();
        }
      }, 500);
    }
  }

  /**
   * Actualizar numeración de notas
   */
  static updateNumbers() {
    if (STATE.isArchiveViewActive) return;
    const notesList = STATE.DOM.notesList;

    const recursiveUpdate = (list) => {
      const items = Array.from(list.children).filter(child =>
        child.tagName === 'LI' && !child.classList.contains('is-locked')
      );
      items.forEach((li, index) => {
        const numberSpan = li.querySelector('.note-number');
        if (numberSpan) {
          numberSpan.textContent = `${index + 1}.`;
        }
        const sublist = li.querySelector('ul.subnotes');
        if (sublist) {
          recursiveUpdate(sublist);
        }
      });
    };
    recursiveUpdate(notesList);
  }

  /**
   * Actualizar contador de notas
   */
  static updateNotesCounter() {
    const notesCounter = STATE.DOM.notesCounter;
    let mainCount = 0;
    let totalCount = 0;

    const countRecursive = (notes) => {
      let count = notes.length;
      notes.forEach(note => {
        if(note.children) {
          count += countRecursive(note.children);
        }
      });
      return count;
    };

    if (STATE.currentNotesData) {
      const activeNotes = STATE.currentNotesData.filter(n => !n.isArchived);
      mainCount = activeNotes.length;
      totalCount = countRecursive(activeNotes);
    }

    if (notesCounter) {
      notesCounter.textContent = `Principales: ${mainCount} / Total: ${totalCount}`;
    }
  }

  /**
   * Actualizar visibilidad de toggles
   */
  static updateToggleVisibility() {
    document.querySelectorAll('.note').forEach(noteLi => {
      this.updateToggleVisibilityForNote(noteLi);
    });
  }

  static updateToggleVisibilityForNote(noteLi) {
    const toggleBtn = noteLi.querySelector('[data-action="toggle"]');
    if (!toggleBtn) return;

    if (noteLi.classList.contains('is-locked')) {
      toggleBtn.classList.remove('toggle-visible');
      return;
    }
    const sublist = noteLi.querySelector('ul.subnotes');
    const hasChildren = sublist && sublist.children.length > 0;
    toggleBtn.classList.toggle('toggle-visible', hasChildren);
    if (hasChildren) {
      toggleBtn.textContent = sublist.classList.contains('hidden') ? '▶' : '▼';
      toggleBtn.title = 'Expandir/Colapsar';
    }
  }

  /**
   * Actualizar visibilidad de iconos
   */
  static updateIconVisibility() {
    document.querySelectorAll('.note-icon').forEach(icon => {
      icon.classList.toggle('icon-visible', icon.textContent.trim() !== '');
    });
  }

  /**
   * Actualizar todos los contadores de cuenta regresiva
   */
  static updateAllCountdowns() {
    const now = new Date();
    document.querySelectorAll('.note:not(.is-locked)').forEach(note => {
      const timerSpan = note.querySelector('.countdown-timer');
      const dueDateString = note.dataset.dueDate;
      const creationDateString = note.dataset.creationDate;
      note.classList.remove('alert-early', 'alert-urgent', 'overdue');

      if (!dueDateString || !timerSpan) {
        if (timerSpan) {
          timerSpan.textContent = '';
          timerSpan.classList.add('hidden');
        }
        return;
      }

      const dueDate = new Date(dueDateString);
      let text = '';

      if (note.dataset.status === 'done') {
        timerSpan.textContent = `Completada`;
        timerSpan.classList.remove('hidden');
        return;
      }

      const diff = dueDate - now;
      if (diff < 0) {
        text = 'Vencido';
        note.classList.add('overdue');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (days > 0) text = `Faltan ${days} día${days > 1 ? 's' : ''}`;
        else if (hours > 0) text = `Faltan ${hours} hora${hours > 1 ? 's' : ''}`;
        else if (minutes >= 0) text = `Faltan ${minutes} min`;

        const creationDate = new Date(creationDateString);
        const totalTime = dueDate - creationDate;
        const elapsedTime = now - creationDate;

        if (totalTime > 0) {
          const percentage = (elapsedTime / totalTime) * 100;
          if (percentage >= 76) note.classList.add('alert-urgent');
          else if (percentage >= 51) note.classList.add('alert-early');
        }
      }

      timerSpan.textContent = text;
      timerSpan.classList.remove('hidden');
    });
  }
}

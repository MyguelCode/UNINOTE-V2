/**
 * ArchiveService - Gestión de notas archivadas y timeline
 */

import { STATE } from '../config/state.js';

export class ArchiveService {

  /**
   * Renderizar timeline de archivo
   */
  static async renderArchiveTimeline() {
    const archiveTimelineContainer = STATE.DOM.archiveTimelineContainer;
    const archiveSortSelect = STATE.DOM.archiveSortSelect;

    archiveTimelineContainer.innerHTML = '';
    const allArchivedNotes = [];

    for (const docName of STATE.appData.documents) {
      if (STATE.appData.documentPasswords[docName] && !STATE.unlockedDocuments.has(docName)) {
        continue;
      }

      // Cargar desde IndexedDB
      let notesData;
      if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
        notesData = await window.loadDocumentAsync(docName);
      } else {
        const notesDataRaw = localStorage.getItem(`uninote_doc_${docName}`);
        notesData = notesDataRaw ? JSON.parse(notesDataRaw) : null;
      }
      if (!notesData) continue;

      function findArchivedRecursive(notes) {
        for (const note of notes) {
          if (note.isArchived) {
            allArchivedNotes.push({ ...note, originalDoc: docName });
          } else if (note.children) {
            findArchivedRecursive(note.children);
          }
        }
      }
      findArchivedRecursive(notesData);
    }

    if (allArchivedNotes.length === 0) {
      archiveTimelineContainer.innerHTML = '<p style="text-align: center; color: var(--locked-text-color);">No hay notas archivadas en los Uninotes accesibles.</p>';
      return;
    }

    const viewMode = document.querySelector('input[name="archive-view"]:checked').value;
    const sortKey = archiveSortSelect.value;
    allArchivedNotes.sort((a, b) => new Date(b[sortKey]) - new Date(a[sortKey]));

    if (viewMode === 'groupByUninote') {
      this.renderGroupedByUninote(allArchivedNotes);
    } else {
      this.renderGroupedByDate(allArchivedNotes);
    }
  }

  /**
   * Renderizar agrupado por Uninote
   */
  static renderGroupedByUninote(notes) {
    const archiveTimelineContainer = STATE.DOM.archiveTimelineContainer;
    const grouped = notes.reduce((acc, note) => {
      const docName = note.originalDoc;
      if (!acc[docName]) acc[docName] = [];
      acc[docName].push(note);
      return acc;
    }, {});

    for (const docName in grouped) {
      const uninoteGroup = document.createElement('div');
      uninoteGroup.className = 'archive-uninote-group';
      uninoteGroup.innerHTML = `<h3 class="group-header">${docName}</h3>`;
      archiveTimelineContainer.appendChild(uninoteGroup);
      this.renderTimelineForNotes(grouped[docName], uninoteGroup);
    }
  }

  /**
   * Renderizar agrupado por fecha
   */
  static renderGroupedByDate(notes) {
    const archiveTimelineContainer = STATE.DOM.archiveTimelineContainer;
    this.renderTimelineForNotes(notes, archiveTimelineContainer);
  }

  /**
   * Renderizar timeline para notas específicas
   */
  static renderTimelineForNotes(notes, container) {
    const groupedByMonth = notes.reduce((acc, note) => {
      const timestamp = new Date(note.archivedTimestamp);
      const monthKey = `${timestamp.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`;
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(note);
      return acc;
    }, {});

    for (const month in groupedByMonth) {
      const monthGroup = document.createElement('div');
      monthGroup.className = 'archive-month-group collapsed';
      monthGroup.innerHTML = `<div class="group-header">${month.charAt(0).toUpperCase() + month.slice(1)}</div>`;
      container.appendChild(monthGroup);

      const groupedByDay = groupedByMonth[month].reduce((acc, note) => {
        const timestamp = new Date(note.archivedTimestamp);
        const dayKey = timestamp.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
        if (!acc[dayKey]) acc[dayKey] = [];
        acc[dayKey].push(note);
        return acc;
      }, {});

      for (const day in groupedByDay) {
        const dayGroup = document.createElement('div');
        dayGroup.className = 'archive-day-group collapsed';
        dayGroup.innerHTML = `<div class="group-header">${day}</div>`;
        monthGroup.appendChild(dayGroup);

        const groupedByUninoteInDay = groupedByDay[day].reduce((acc, note) => {
          const docName = note.originalDoc;
          if (!acc[docName]) acc[docName] = [];
          acc[docName].push(note);
          return acc;
        }, {});

        for(const docName in groupedByUninoteInDay) {
          if (document.querySelector('input[name="archive-view"]:checked').value === 'groupByDate') {
            const uninoteHeader = document.createElement('h4');
            uninoteHeader.className = 'archive-day-uninote-header';
            uninoteHeader.textContent = `en: ${docName}`;
            dayGroup.appendChild(uninoteHeader);
          }
          const dayNoteContainer = document.createElement('ul');
          dayNoteContainer.className = 'notes-container';
          dayGroup.appendChild(dayNoteContainer);

          // Necesitamos importar createArchivedNoteDOM
          groupedByUninoteInDay[docName].forEach(noteData => {
            // Esta función se moverá a ArchiveTimeline component
            this.createArchivedNoteDOM(noteData, dayNoteContainer);
          });
        }
      }
    }
  }

  /**
   * Crear DOM de nota archivada (temporal - se moverá a component)
   */
  static createArchivedNoteDOM(noteData, parentElement) {
    // Esta función será manejada por ArchiveTimeline component
    // Por ahora la dejamos como placeholder
  }
}

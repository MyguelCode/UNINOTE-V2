/**
 * SearchService - Búsqueda local y global de notas
 */

import { STATE } from '../config/state.js';

export class SearchService {

  /**
   * Búsqueda local en el documento actual
   */
  static performLocalSearch(searchTerm) {
    const notesList = STATE.DOM.notesList;
    notesList.querySelectorAll('.note').forEach(n => n.classList.remove('is-filtered'));
    if (!searchTerm) return;

    const notesToShow = new Set();
    const searchLower = searchTerm.toLowerCase();

    const recursiveSearch = (list) => {
      list.querySelectorAll(':scope > .note').forEach(note => {
        if (note.dataset.isArchived === 'true') return;

        let noteText;
        const isNoteLocked = note.dataset.lockType && !STATE.sessionUnlockedNotes.has(note.dataset.id);

        if (isNoteLocked) {
          noteText = (note.dataset.lockHint || '').toLowerCase();
        } else {
          noteText = note.querySelector('.editable-note').textContent.toLowerCase();
        }

        if (noteText.includes(searchLower)) {
          notesToShow.add(note);
          // Agregar todos los padres
          let parent = note.parentElement.closest('.note');
          while (parent) {
            notesToShow.add(parent);
            parent = parent.parentElement.closest('.note');
          }
        }

        const sublist = note.querySelector('.subnotes');
        if (sublist && recursiveSearch(sublist)) {
          notesToShow.add(note);
        }
      });
    };

    recursiveSearch(notesList);

    notesList.querySelectorAll('.note').forEach(note => {
      if (note.dataset.isArchived === 'true') return;
      note.classList.toggle('is-filtered', !notesToShow.has(note));
    });
  }

  /**
   * Búsqueda global en todos los documentos
   */
  static async performGlobalSearch(searchTerm) {
    const notesList = STATE.DOM.notesList;
    const archiveViewContainer = STATE.DOM.archiveViewContainer;
    const globalSearchResults = STATE.DOM.globalSearchResults;

    notesList.classList.add('hidden');
    archiveViewContainer.classList.add('hidden');
    globalSearchResults.classList.remove('hidden');
    globalSearchResults.innerHTML = '<li class="search-no-results">Buscando en todos los Uninotes accesibles...</li>';

    let allResults = [];
    const tempDiv = document.createElement('div');
    const searchLower = searchTerm.toLowerCase();

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

      const recursiveSearch = (notes) => {
        for (const note of notes) {
          if (note.isArchived) continue;
          const isNoteLocked = note.lockType && !STATE.sessionUnlockedNotes.has(note.id);
          let textToSearch = isNoteLocked ? (note.lockHint || '') : note.content;
          tempDiv.innerHTML = textToSearch;
          textToSearch = (tempDiv.textContent || tempDiv.innerText || "").toLowerCase();

          if (textToSearch.includes(searchLower)) {
            allResults.push({ note, docName });
          }

          if (note.children && !isNoteLocked) {
            recursiveSearch(note.children);
          }
        }
      };
      recursiveSearch(notesData);
    }

    this.renderGlobalResults(allResults, searchTerm);
  }

  /**
   * Renderizar resultados de búsqueda global
   */
  static renderGlobalResults(results, searchTerm) {
    const globalSearchResults = STATE.DOM.globalSearchResults;
    globalSearchResults.innerHTML = '';

    if (results.length === 0) {
      globalSearchResults.innerHTML = '<li class="search-no-results">No se encontraron resultados.</li>';
      return;
    }

    const regex = new RegExp(`(${searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const tempDiv = document.createElement('div');

    results.forEach(result => {
      const li = document.createElement('li');
      li.className = 'search-result-item';
      li.dataset.docName = result.docName;
      li.dataset.noteId = result.note.id;
      tempDiv.innerHTML = result.note.content;
      let plainText = tempDiv.textContent || tempDiv.innerText || "";
      let highlightedText = plainText.replace(regex, '<mark>$1</mark>');
      li.innerHTML = `
        <p class="result-content">${highlightedText}</p>
        <p class="result-location">en: ${result.docName}</p>
      `;
      globalSearchResults.appendChild(li);
    });
  }

  /**
   * Ocultar resultados de búsqueda global
   */
  static hideGlobalSearchResults() {
    STATE.DOM.globalSearchResults.classList.add('hidden');
  }
}

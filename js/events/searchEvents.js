/**
 * searchEvents.js - Search functionality event handlers
 */

import { STATE } from '../config/state.js';
import { SearchService } from '../services/SearchService.js';

export function initializeSearchEvents() {
  const searchInput = document.getElementById('search-input');
  const searchAllToggle = document.getElementById('search-all-toggle');
  const globalSearchResults = document.getElementById('global-search-results');

  // Search input handler
  searchInput.addEventListener('input', handleSearch);
  searchAllToggle.addEventListener('change', handleSearch);

  // Global search results click handler
  globalSearchResults.addEventListener('click', async (e) => {
    const resultItem = e.target.closest('.global-search-result');
    if (resultItem) {
      const docName = resultItem.dataset.documentName;
      const noteId = resultItem.dataset.noteId;

      if (docName && docName !== STATE.currentDocumentName) {
        await window.DocumentController.switchDocument(docName);
      }

      SearchService.hideGlobalSearchResults();
      searchInput.value = '';

      setTimeout(() => {
        const targetNote = document.querySelector(`.note[data-id="${noteId}"]`);
        if (targetNote) {
          targetNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetNote.classList.add('highlight');
          setTimeout(() => targetNote.classList.remove('highlight'), 2000);
        }
      }, 300);
    }
  });
}

/**
 * Handle search input
 */
function handleSearch() {
  const searchInput = document.getElementById('search-input');
  const searchAllToggle = document.getElementById('search-all-toggle');
  const searchTerm = searchInput.value.trim();

  if (searchTerm.length === 0) {
    SearchService.hideGlobalSearchResults();
    if (window.renderNotes) {
      window.renderNotes();
    }
    return;
  }

  if (searchAllToggle.checked) {
    // Global search across all documents
    SearchService.performGlobalSearch(searchTerm);
  } else {
    // Local search in current document
    SearchService.performLocalSearch(searchTerm);
  }
}

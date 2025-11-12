// === REFERENCIAS DOM - UNINOTE ===

import { STATE } from '../config/state.js';

export function initDOMReferences() {
  STATE.DOM = {
    // Header
    documentTitle: document.getElementById('document-title'),
    documentMenu: document.getElementById('document-menu'),
    tabsContainer: document.getElementById('tabs-container'),
    searchInput: document.getElementById('search-input'),
    searchAllToggle: document.getElementById('search-all-toggle'),
    globalSearchResults: document.getElementById('global-search-results'),
    addMainNoteBtn: document.getElementById('add-main-note-btn'),
    relockDocBtn: document.getElementById('relock-doc-btn'),
    notesCounter: document.getElementById('notes-counter'),

    // Main
    notesList: document.getElementById('notes-list'),

    // Pickers
    iconPicker: document.getElementById('icon-picker'),
    contextMenu: document.getElementById('context-menu'),
    removeIconBtn: document.getElementById('remove-icon-btn'),
    lockMenu: document.getElementById('lock-menu'),
    formattingToolbar: document.getElementById('formatting-toolbar'),
    fontSizeInput: document.getElementById('font-size-input'),

    // File Inputs
    importFileInput: document.getElementById('import-file-input'),
    importNotionInput: document.getElementById('import-notion-input'),

    // Notification Area
    notificationArea: document.getElementById('notification-area'),

    // Modals
    confirmationModalOverlay: document.getElementById('confirmation-modal-overlay'),
    importModalOverlay: document.getElementById('import-modal-overlay'),
    datePickerModalOverlay: document.getElementById('date-picker-modal-overlay'),
    dateTimeInput: document.getElementById('date-time-input'),
    saveDateBtn: document.getElementById('save-date-btn'),
    removeDateBtn: document.getElementById('remove-date-btn'),
    cancelDateBtn: document.getElementById('cancel-date-btn'),

    // Buttons
    toggleAllBtn: document.getElementById('toggle-all-btn'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    helpBtn: document.getElementById('help-btn'),
    helpModalOverlay: document.getElementById('help-modal-overlay'),
    helpCloseBtn: document.getElementById('help-close-btn'),

    // Bulk Actions
    bulkActionsBar: document.getElementById('bulk-actions-bar'),
    selectionCounter: document.getElementById('selection-counter'),
    deleteSelectedBtn: document.getElementById('delete-selected-btn'),
    deselectAllBtn: document.getElementById('deselect-all-btn'),
    indentSelectedBtn: document.getElementById('indent-selected-btn'),
    outdentSelectedBtn: document.getElementById('outdent-selected-btn'),
    selectChildrenBtn: document.getElementById('select-children-btn'),

    // Scroll Buttons
    scrollButtons: document.getElementById('scroll-buttons'),
    scrollTopBtn: document.getElementById('scroll-top-btn'),
    scrollBottomBtn: document.getElementById('scroll-bottom-btn'),

    // Notification Center
    notificationCenterBtn: document.getElementById('notification-center-btn'),
    notificationDot: document.getElementById('notification-dot'),
    notificationCenterOverlay: document.getElementById('notification-center-overlay'),
    notificationCenterCloseBtn: document.getElementById('notification-center-close-btn'),
    notificationList: document.getElementById('notification-list'),

    // Archive
    toggleArchiveViewBtn: document.getElementById('toggle-archive-view-btn'),
    archiveViewContainer: document.getElementById('archive-view-container'),
    archiveControls: document.getElementById('archive-controls'),
    archiveSortSelect: document.getElementById('archive-sort-select'),
    archiveTimelineContainer: document.getElementById('archive-timeline-container'),

    // Settings
    appSettingsBtn: document.getElementById('app-settings-btn'),
    appLockOverlay: document.getElementById('app-lock-overlay'),
    appLockPasswordInput: document.getElementById('app-lock-password-input'),
    appLockUnlockBtn: document.getElementById('app-lock-unlock-btn'),
    appLockEnableToggle: document.getElementById('app-lock-enable-toggle'),

    // Transfer
    transferBtn: document.getElementById('transfer-btn'),
    transferMenu: document.getElementById('transfer-menu'),

    // Unarchive
    unarchiveModalOverlay: document.getElementById('unarchive-modal-overlay'),
    unarchiveToOriginalBtn: document.getElementById('unarchive-to-original-btn'),
    unarchiveToOtherBtn: document.getElementById('unarchive-to-other-btn'),
    unarchiveOptionsList: document.getElementById('unarchive-options-list'),
    unarchiveCancelBtn: document.getElementById('unarchive-cancel-btn')
  };
}

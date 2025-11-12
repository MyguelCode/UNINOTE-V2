// === ESTADO GLOBAL - UNINOTE ===

export const STATE = {
  // Datos de la aplicación
  appData: {},
  currentDocumentName: '',
  currentNotesData: [],

  // Seguridad y sesión
  unlockedDocuments: new Set(),
  sessionUnlockedNotes: new Set(),

  // Vista y UI
  isArchiveViewActive: false,

  // Drag & Drop
  draggedElement: null,
  dropTarget: null,

  // Menús activos
  activeNoteForMenu: null,
  activeNoteForDatePicker: null,
  activeNoteForLock: null,
  activeNoteForUnarchive: null,

  // Edición de texto
  lastSelectionRange: null,

  // Guardado
  saveTimeout: null,

  // Selección múltiple
  selectedNotes: new Set(),

  // Inicialización
  isInitializing: true,

  // Emojis
  recentEmojis: [],

  // Notificaciones
  seenNotifications: new Set(),

  // Referencias DOM
  DOM: {}
};

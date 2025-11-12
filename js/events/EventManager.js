/**
 * EventManager.js - Main event manager that initializes all event handlers
 */

import { initializeNoteEvents } from './noteEvents.js';
import { initializeDragDropEvents } from './dragDropEvents.js';
import { initializeSearchEvents } from './searchEvents.js';
import { initializeFormattingEvents } from './formattingEvents.js';
import { initializeDocumentEvents } from './documentEvents.js';
import { initializeUIEvents } from './uiEvents.js';
import { initializeSecurityEvents } from './securityEvents.js';
import { initializeArchiveEvents } from './archiveEvents.js';
import { initializeImportExportEvents } from './importExportEvents.js';
import { initializeButtonConfigEvents } from './buttonConfigEvents.js';

/**
 * EventManager - Centralizes all event handler initialization
 */
export class EventManager {
  /**
   * Initialize all event handlers
   */
  static initializeAll() {
    console.log('🎯 EventManager: Inicializando todos los event handlers...');

    try {
      // Note interactions (click, keydown, focusout, context menu)
      initializeNoteEvents();
      console.log('✅ Note events initialized');

      // Drag and drop
      initializeDragDropEvents();
      console.log('✅ Drag & drop events initialized');

      // Search functionality
      initializeSearchEvents();
      console.log('✅ Search events initialized');

      // Formatting toolbar and emoji picker
      initializeFormattingEvents();
      console.log('✅ Formatting events initialized');

      // Document management (tabs, menu)
      initializeDocumentEvents();
      console.log('✅ Document events initialized');

      // UI controls (theme, scroll, bulk actions, date picker, notifications)
      initializeUIEvents();
      console.log('✅ UI events initialized');

      // Security (lock/unlock, passwords)
      initializeSecurityEvents();
      console.log('✅ Security events initialized');

      // Archive view and unarchive
      initializeArchiveEvents();
      console.log('✅ Archive events initialized');

      // Import/Export
      initializeImportExportEvents();
      console.log('✅ Import/Export events initialized');

      // Button configuration
      initializeButtonConfigEvents();
      console.log('✅ Button configuration events initialized');

      console.log('🎉 EventManager: Todos los event handlers inicializados correctamente!');
    } catch (error) {
      console.error('❌ EventManager: Error al inicializar event handlers:', error);
      throw error;
    }
  }
}

// Export for global access
window.EventManager = EventManager;

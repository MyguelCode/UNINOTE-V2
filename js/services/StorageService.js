// === UNINOTE - Storage Service ===
// Servicio de almacenamiento con soporte para IndexedDB y fallback a localStorage

import { db, isDatabaseAvailable } from '../core/database.js';

/**
 * Servicio de almacenamiento unificado
 * Maneja automáticamente IndexedDB con fallback a localStorage
 */
export class StorageService {
  static useIndexedDB = true;

  /**
   * Verifica qué sistema de almacenamiento usar
   */
  static async init() {
    this.useIndexedDB = await isDatabaseAvailable();
    console.log(`💾 Sistema de almacenamiento: ${this.useIndexedDB ? 'IndexedDB' : 'localStorage (fallback)'}`);
  }

  // ==========================================
  // APP DATA - Configuración global
  // ==========================================

  /**
   * Guarda la configuración global de la aplicación
   * @param {Object} appData - Objeto con documents, documentPasswords, universalPassword, etc.
   * @returns {Promise<boolean>}
   */
  static async saveAppData(appData) {
    try {
      if (this.useIndexedDB) {
        await db.appData.put({
          key: 'global_config',
          value: appData,
          lastModified: new Date().toISOString()
        });
      } else {
        localStorage.setItem('uninote_app_data', JSON.stringify(appData));
      }
      return true;
    } catch (error) {
      console.error('❌ Error al guardar appData:', error);
      return false;
    }
  }

  /**
   * Carga la configuración global de la aplicación
   * @returns {Promise<Object|null>}
   */
  static async loadAppData() {
    try {
      if (this.useIndexedDB) {
        const result = await db.appData.get('global_config');
        return result ? result.value : null;
      } else {
        const data = localStorage.getItem('uninote_app_data');
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error('❌ Error al cargar appData:', error);
      return null;
    }
  }

  // ==========================================
  // DOCUMENTS - Uninotes individuales
  // ==========================================

  /**
   * Guarda un documento completo con todas sus notas
   * @param {string} docName - Nombre del documento
   * @param {Array} notesData - Array de notas con jerarquía
   * @returns {Promise<boolean>}
   */
  static async saveDocument(docName, notesData) {
    try {
      if (this.useIndexedDB) {
        await db.documents.put({
          id: docName,
          name: docName,
          notes: notesData,
          lastModified: new Date().toISOString()
        });
      } else {
        localStorage.setItem(`uninote_doc_${docName}`, JSON.stringify(notesData));
      }
      return true;
    } catch (error) {
      console.error(`❌ Error al guardar documento "${docName}":`, error);
      return false;
    }
  }

  /**
   * Carga un documento específico
   * @param {string} docName - Nombre del documento
   * @returns {Promise<Array|null>}
   */
  static async loadDocument(docName) {
    try {
      if (this.useIndexedDB) {
        const doc = await db.documents.get(docName);
        return doc ? doc.notes : null;
      } else {
        const data = localStorage.getItem(`uninote_doc_${docName}`);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error(`❌ Error al cargar documento "${docName}":`, error);
      return null;
    }
  }

  /**
   * Obtiene todos los documentos
   * @returns {Promise<Array>}
   */
  static async getAllDocuments() {
    try {
      if (this.useIndexedDB) {
        return await db.documents.toArray();
      } else {
        const docs = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('uninote_doc_')) {
            const docName = key.replace('uninote_doc_', '');
            const notes = JSON.parse(localStorage.getItem(key));
            docs.push({
              id: docName,
              name: docName,
              notes: notes,
              lastModified: null
            });
          }
        }
        return docs;
      }
    } catch (error) {
      console.error('❌ Error al obtener todos los documentos:', error);
      return [];
    }
  }

  /**
   * Elimina un documento
   * @param {string} docName - Nombre del documento
   * @returns {Promise<boolean>}
   */
  static async deleteDocument(docName) {
    try {
      if (this.useIndexedDB) {
        await db.documents.delete(docName);
      } else {
        localStorage.removeItem(`uninote_doc_${docName}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ Error al eliminar documento "${docName}":`, error);
      return false;
    }
  }

  /**
   * Renombra un documento
   * @param {string} oldName - Nombre actual
   * @param {string} newName - Nombre nuevo
   * @returns {Promise<boolean>}
   */
  static async renameDocument(oldName, newName) {
    try {
      // Cargar notas del documento antiguo
      const notes = await this.loadDocument(oldName);
      if (!notes) return false;

      // Guardar con el nuevo nombre
      await this.saveDocument(newName, notes);

      // Eliminar el antiguo
      await this.deleteDocument(oldName);

      return true;
    } catch (error) {
      console.error(`❌ Error al renombrar documento "${oldName}" a "${newName}":`, error);
      return false;
    }
  }

  // ==========================================
  // SETTINGS - Configuraciones
  // ==========================================

  /**
   * Guarda una configuración específica
   * @param {string} key - Clave de la configuración
   * @param {*} value - Valor a guardar
   * @returns {Promise<boolean>}
   */
  static async saveSetting(key, value) {
    try {
      if (this.useIndexedDB) {
        await db.settings.put({ key, value });
      } else {
        localStorage.setItem(`uninote${key}`, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      console.error(`❌ Error al guardar setting "${key}":`, error);
      return false;
    }
  }

  /**
   * Carga una configuración específica
   * @param {string} key - Clave de la configuración
   * @returns {Promise<*>}
   */
  static async loadSetting(key) {
    try {
      if (this.useIndexedDB) {
        const result = await db.settings.get(key);
        return result ? result.value : null;
      } else {
        const data = localStorage.getItem(`uninote${key}`);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error(`❌ Error al cargar setting "${key}":`, error);
      return null;
    }
  }

  /**
   * Elimina una configuración
   * @param {string} key - Clave de la configuración
   * @returns {Promise<boolean>}
   */
  static async deleteSetting(key) {
    try {
      if (this.useIndexedDB) {
        await db.settings.delete(key);
      } else {
        localStorage.removeItem(`uninote${key}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ Error al eliminar setting "${key}":`, error);
      return false;
    }
  }

  /**
   * Obtiene todas las configuraciones
   * @returns {Promise<Object>}
   */
  static async getAllSettings() {
    try {
      if (this.useIndexedDB) {
        const settings = await db.settings.toArray();
        const obj = {};
        settings.forEach(s => obj[s.key] = s.value);
        return obj;
      } else {
        const obj = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('uninote') && !key.startsWith('uninote_doc_') && key !== 'uninote_app_data') {
            const settingKey = key.replace('uninote', '');
            obj[settingKey] = JSON.parse(localStorage.getItem(key));
          }
        }
        return obj;
      }
    } catch (error) {
      console.error('❌ Error al obtener todas las configuraciones:', error);
      return {};
    }
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Limpia todos los datos (⚠️ PELIGROSO)
   * @returns {Promise<boolean>}
   */
  static async clearAll() {
    try {
      if (this.useIndexedDB) {
        await db.appData.clear();
        await db.documents.clear();
        await db.settings.clear();
      } else {
        localStorage.clear();
      }
      console.log('🗑️ Todos los datos han sido eliminados');
      return true;
    } catch (error) {
      console.error('❌ Error al limpiar datos:', error);
      return false;
    }
  }

  /**
   * Exporta todos los datos a un objeto
   * @returns {Promise<Object>}
   */
  static async exportAll() {
    try {
      const exportData = {
        appData: await this.loadAppData(),
        documents: await this.getAllDocuments(),
        settings: await this.getAllSettings(),
        exportDate: new Date().toISOString(),
        storageType: this.useIndexedDB ? 'IndexedDB' : 'localStorage'
      };
      return exportData;
    } catch (error) {
      console.error('❌ Error al exportar datos:', error);
      return null;
    }
  }

  /**
   * Obtiene estadísticas de almacenamiento
   * @returns {Promise<Object>}
   */
  static async getStats() {
    try {
      const stats = {
        storageType: this.useIndexedDB ? 'IndexedDB' : 'localStorage',
        documentsCount: 0,
        totalNotes: 0,
        settingsCount: 0
      };

      if (this.useIndexedDB) {
        stats.documentsCount = await db.documents.count();
        stats.settingsCount = await db.settings.count();

        const allDocs = await db.documents.toArray();
        stats.totalNotes = allDocs.reduce((sum, doc) => {
          return sum + (doc.notes ? doc.notes.length : 0);
        }, 0);
      } else {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('uninote_doc_')) {
            stats.documentsCount++;
            const notes = JSON.parse(localStorage.getItem(key));
            stats.totalNotes += notes ? notes.length : 0;
          } else if (key.startsWith('uninote') && key !== 'uninote_app_data') {
            stats.settingsCount++;
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return null;
    }
  }
}

export default StorageService;

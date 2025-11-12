// === UNINOTE - IndexedDB Database Configuration ===
// Configuración de la base de datos usando Dexie.js

// Crear instancia de la base de datos
export const db = new Dexie('UninoteDB');

// Definir el schema de la base de datos
db.version(1).stores({
  // AppData: Configuración global de la aplicación
  // Key-value store para datos globales
  appData: 'key',

  // Documents: Documentos/Uninotes individuales
  // Cada documento contiene todas sus notas en un array
  documents: 'id, name, lastModified',

  // Settings: Configuraciones de la aplicación
  // Key-value store para preferencias del usuario
  settings: 'key'
});

/**
 * Inicializa la base de datos IndexedDB
 * @returns {Promise<boolean>} true si se inicializó correctamente, false si hubo error
 */
export async function initDatabase() {
  try {
    await db.open();
    console.log('✅ IndexedDB (UninoteDB) inicializado correctamente');
    console.log('📊 Stores disponibles:', db.tables.map(t => t.name).join(', '));
    return true;
  } catch (error) {
    console.error('❌ Error al abrir IndexedDB:', error);
    console.warn('⚠️ Se usará localStorage como fallback');
    return false;
  }
}

/**
 * Verifica si IndexedDB está disponible y funcionando
 * @returns {Promise<boolean>}
 */
export async function isDatabaseAvailable() {
  try {
    await db.open();
    return db.isOpen();
  } catch (error) {
    return false;
  }
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDatabase() {
  if (db.isOpen()) {
    db.close();
    console.log('🔒 IndexedDB cerrado');
  }
}

/**
 * Elimina completamente la base de datos (útil para testing)
 * ⚠️ CUIDADO: Esto borra TODOS los datos
 */
export async function deleteDatabase() {
  try {
    await db.delete();
    console.log('🗑️ Base de datos eliminada');
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar base de datos:', error);
    return false;
  }
}

/**
 * Obtiene estadísticas de uso de la base de datos
 * @returns {Promise<Object>}
 */
export async function getDatabaseStats() {
  try {
    const stats = {
      appDataCount: await db.appData.count(),
      documentsCount: await db.documents.count(),
      settingsCount: await db.settings.count()
    };

    // Calcular tamaño aproximado de documentos
    const allDocs = await db.documents.toArray();
    const totalNotes = allDocs.reduce((sum, doc) => {
      return sum + (doc.notes ? doc.notes.length : 0);
    }, 0);

    stats.totalNotes = totalNotes;

    return stats;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    return null;
  }
}

// Exportar la instancia de Dexie para uso directo si es necesario
export default db;

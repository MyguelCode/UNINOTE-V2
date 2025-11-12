// === INICIALIZACIÓN - UNINOTE ===
// Usando IndexedDB como sistema principal de almacenamiento

import { STATE } from '../config/state.js';
import { StorageManager } from '../core/storage.js';
import { ThemeService } from '../services/ThemeService.js';
import { StorageService } from '../services/StorageService.js';
import { initDatabase } from '../core/database.js';
import { COMMON_EMOJIS, EMOJIS } from '../config/constants.js';

export async function initialize() {
  console.log('🚀 Inicializando Uninote con IndexedDB...');

  try {
    // 1. Inicializar IndexedDB
    console.log('📊 Inicializando base de datos IndexedDB...');
    const dbReady = await initDatabase();

    if (!dbReady) {
      throw new Error('IndexedDB no está disponible');
    }

    // 2. Inicializar StorageService
    await StorageService.init();

    if (!StorageService.useIndexedDB) {
      throw new Error('No se pudo inicializar IndexedDB');
    }

    console.log('✅ IndexedDB inicializado correctamente');

    // 3. Cargar tema
    console.log('🎨 Cargando tema...');
    const theme = await StorageService.loadSetting('Theme');
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // 4. Cargar emojis recientes
    const recents = await StorageService.loadSetting('Recents');
    STATE.recentEmojis = recents || [];

    // 5. Cargar notificaciones vistas
    const seenNotifs = await StorageService.loadSetting('SeenNotifications');
    STATE.seenNotifications = seenNotifs || [];

    // 6. Cargar datos de la aplicación
    console.log('📦 Cargando datos de la aplicación...');
    const savedAppData = await StorageService.loadAppData();

    if (savedAppData) {
      STATE.appData = savedAppData;
      STATE.appData.documentPasswords = STATE.appData.documentPasswords || {};
      STATE.appData.universalPasswordHash = STATE.appData.universalPasswordHash || null;
      STATE.appData.defaultDocument = STATE.appData.defaultDocument || null;
      STATE.appData.isAppLockEnabled = STATE.appData.isAppLockEnabled || false;
      STATE.appData.appLockPasswordHash = STATE.appData.appLockPasswordHash || null;

      console.log(`✅ Datos cargados: ${STATE.appData.documents ? STATE.appData.documents.length : 0} documentos`);
    } else {
      // Crear datos iniciales si no existen
      console.log('🆕 Primera vez usando Uninote - Creando datos iniciales...');
      const defaultDocName = "Mi Primer Uninote";
      STATE.appData = {
        documents: [defaultDocName],
        favorites: [],
        activeDocument: defaultDocName,
        universalPasswordHash: null,
        documentPasswords: {},
        defaultDocument: null,
        isAppLockEnabled: false,
        appLockPasswordHash: null
      };

      // Guardar documento vacío inicial
      await StorageService.saveDocument(defaultDocName, []);
      await StorageService.saveAppData(STATE.appData);

      console.log('✅ Datos iniciales creados');
    }

    // 7. Mostrar estadísticas de almacenamiento
    const stats = await StorageService.getStats();
    console.log('📊 Estadísticas:', stats);

    console.log('✅ Uninote inicializado correctamente');
    console.log('💾 Sistema de almacenamiento: IndexedDB');

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);

    // Fallback a localStorage solo si IndexedDB falla completamente
    console.warn('⚠️ Iniciando con localStorage como fallback...');

    ThemeService.init();
    STATE.recentEmojis = StorageManager.getRecentEmojis();
    STATE.seenNotifications = StorageManager.getSeenNotifications();

    const savedAppData = StorageManager.getAppData();
    if (savedAppData) {
      STATE.appData = savedAppData;
      STATE.appData.documentPasswords = STATE.appData.documentPasswords || {};
      STATE.appData.universalPasswordHash = STATE.appData.universalPasswordHash || null;
      STATE.appData.defaultDocument = STATE.appData.defaultDocument || null;
      STATE.appData.isAppLockEnabled = STATE.appData.isAppLockEnabled || false;
      STATE.appData.appLockPasswordHash = STATE.appData.appLockPasswordHash || null;
    } else {
      const defaultDocName = "Mi Primer Uninote";
      STATE.appData = {
        documents: [defaultDocName],
        favorites: [],
        activeDocument: defaultDocName,
        universalPasswordHash: null,
        documentPasswords: {},
        defaultDocument: null,
        isAppLockEnabled: false,
        appLockPasswordHash: null
      };
      StorageManager.setDocNotes(defaultDocName, []);
    }

    console.log('⚠️ Usando localStorage (modo fallback)');
  }
}

export function populateEmojiPicker() {
  const commonPanel = document.getElementById('panel-common');
  if (commonPanel) {
    commonPanel.innerHTML = '';
    COMMON_EMOJIS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      commonPanel.appendChild(btn);
    });
  }

  for (const category in EMOJIS) {
    const panel = document.getElementById(`panel-${category}`);
    if (panel) {
      panel.innerHTML = '';
      EMOJIS[category].forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        panel.appendChild(btn);
      });
    }
  }

  updateRecentEmojis();
}

export function updateRecentEmojis() {
  const panel = document.getElementById('panel-recents');
  if (!panel) return;
  panel.innerHTML = '';
  STATE.recentEmojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    panel.appendChild(btn);
  });
}

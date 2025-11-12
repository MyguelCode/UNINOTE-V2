/**
 * importExportEvents.js - Import/Export event handlers
 */

import { STATE } from '../config/state.js';
import { ExportImportService } from '../services/ExportImportService.js';
import { StateController } from '../controllers/StateController.js';
import { NoteRenderer } from '../ui/NoteRenderer.js';

export function initializeImportExportEvents() {
  const importFileInput = document.getElementById('import-file-input');
  const importNotionInput = document.getElementById('import-notion-input');
  const transferBtn = document.getElementById('transfer-btn');
  const transferMenu = document.getElementById('transfer-menu');

  // Import JSON file
  importFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.documentName || !data.notes) {
        await window.NotificationService.showAlertModal('Error', 'Archivo inválido. Asegúrate de que sea una exportación de Uninote.');
        return;
      }

      const importType = await window.NotificationService.promptImportOption(data.documentName);

      if (importType === 'merge') {
        STATE.currentNotesData.push(...data.notes);
        NoteRenderer.renderAppUI();
        window.NotificationService.showNotification(`${data.notes.length} nota(s) importada(s) al Uninote actual.`);
      } else if (importType === 'new') {
        let newDocName = data.documentName;
        if (STATE.appData.documents.includes(newDocName)) {
          newDocName = await window.NotificationService.showPromptModal(
            'Nombre de Uninote',
            'El nombre del Uninote ya existe. Introduce un nuevo nombre:',
            { defaultValue: `${newDocName} (Importado)` }
          );
          if (!newDocName) return;
        }

        STATE.appData.documents.push(newDocName);

        if (window.saveNotesToStorage) {
          await window.saveNotesToStorage(newDocName, data.notes);
        }

        if (window.saveAppDataAsync) {
          await window.saveAppDataAsync(STATE.appData);
        }

        await window.DocumentController.switchDocument(newDocName);
        window.NotificationService.showNotification(`Uninote "${newDocName}" creado con ${data.notes.length} nota(s).`);
      }
    } catch (e) {
      console.error('Error al importar:', e);
      await window.NotificationService.showAlertModal('Error', 'No se pudo leer el archivo. Asegúrate de que sea un JSON válido.');
    } finally {
      importFileInput.value = '';
    }
  });

  // Import Notion Markdown file
  importNotionInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const notes = ExportImportService.parseNotionMarkdown(text);

      if (notes.length === 0) {
        await window.NotificationService.showAlertModal('Advertencia', 'No se encontraron checkboxes válidos en el archivo Notion.');
        return;
      }

      STATE.currentNotesData.push(...notes);
      NoteRenderer.renderAppUI();
      window.NotificationService.showNotification(`${notes.length} nota(s) importada(s) desde Notion.`);
      StateController.runUpdates();
    } catch (e) {
      console.error('Error al importar Notion:', e);
      await window.NotificationService.showAlertModal('Error', 'No se pudo procesar el archivo Notion.');
    } finally {
      importNotionInput.value = '';
    }
  });

  // Transfer button (export menu toggle)
  transferBtn.addEventListener('click', () => {
    transferMenu.classList.toggle('hidden');
  });

  // Transfer menu click handler
  transferMenu.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const action = li.dataset.action;

    if (action === 'export-current') {
      await ExportImportService.exportCurrentUninote();
    } else if (action === 'export-total') {
      await ExportImportService.exportTotalBackup();
    }

    transferMenu.classList.add('hidden');
  });
}

/**
 * ExportImportService - Importación y exportación de datos
 */

import { STATE } from '../config/state.js';

export class ExportImportService {

  /**
   * Exportar Uninote actual
   */
  static async exportCurrentUninote() {
    const currentDocumentName = STATE.currentDocumentName;
    const currentNotesData = STATE.currentNotesData;

    // Guardar antes de exportar
    if (window.saveDocumentAsync) {
      await window.saveDocumentAsync(currentDocumentName, currentNotesData);
    }

    const dataStr = JSON.stringify(currentNotesData, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uninote_${currentDocumentName.replace(/ /g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Exportar backup total
   */
  static async exportTotalBackup() {
    const currentDocumentName = STATE.currentDocumentName;
    const currentNotesData = STATE.currentNotesData;
    const appData = STATE.appData;

    // Guardar documento actual
    if (window.saveDocumentAsync) {
      await window.saveDocumentAsync(currentDocumentName, currentNotesData);
    }

    const allNotesData = {};

    // Cargar todos los documentos desde IndexedDB
    if (window.isUsingIndexedDB && window.isUsingIndexedDB()) {
      for (const docName of appData.documents) {
        allNotesData[docName] = await window.loadDocumentAsync(docName) || [];
      }
    } else {
      appData.documents.forEach(docName => {
        allNotesData[docName] = JSON.parse(localStorage.getItem(`uninote_doc_${docName}`) || '[]');
      });
    }

    const totalBackup = {
      appData: appData,
      allNotesData: allNotesData
    };

    const dataStr = JSON.stringify(totalBackup, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `uninote_backup_total_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Parsear Markdown de Notion
   */
  static parseNotionMarkdown(markdown) {
    const lines = markdown.split('\n');
    const root = { children: [] };
    const stack = [root];

    function getIndentLevel(line) {
      const match = line.match(/^(\s*)/);
      return match[1].replace(/\t/g, '    ').length / 4;
    }

    function convertMarkdownToHtml(text) {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/~~(.*?)~~/g, '<s>$1</s>');
    }

    for (const line of lines) {
      if (line.trim() === '') continue;
      const level = getIndentLevel(line);
      let content = line.trim().replace(/^-/, '').trim();
      let status = 'todo';

      if (content.startsWith('[x] ')) {
        status = 'done';
        content = content.substring(4);
      } else if (content.startsWith('[ ] ')) {
        status = 'todo';
        content = content.substring(4);
      }

      const newNode = {
        id: crypto.randomUUID(),
        content: convertMarkdownToHtml(content),
        status: status,
        icon: '',
        creationDate: new Date().toISOString(),
        children: []
      };

      while (level < stack.length - 1) {
        stack.pop();
      }

      stack[stack.length - 1].children.push(newNode);
      stack.push(newNode);
    }

    return root.children;
  }
}

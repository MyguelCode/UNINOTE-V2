// === EMOJI PICKER - UNINOTE ===

import { STATE } from '../../config/state.js';
import { StorageManager } from '../../core/storage.js';

export class EmojiPicker {
  static show(noteElement) {
    // Código actual en legacy
    console.log('EmojiPicker: Usando versión legacy');
  }

  static hide() {
    const picker = document.getElementById('icon-picker');
    if (picker) {
      picker.style.display = 'none';
    }
  }

  static addToRecents(emoji) {
    STATE.recentEmojis = STATE.recentEmojis.filter(e => e !== emoji);
    STATE.recentEmojis.unshift(emoji);
    if (STATE.recentEmojis.length > 24) {
      STATE.recentEmojis.pop();
    }
    StorageManager.setRecentEmojis(STATE.recentEmojis);
  }
}

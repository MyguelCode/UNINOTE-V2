// === COUNTDOWN RENDERER - UNINOTE ===

export class CountdownRenderer {
  static updateAll() {
    // Código actual en legacy líneas 1605-1647
    const now = new Date();
    document.querySelectorAll('.note:not(.is-locked)').forEach(note => {
      const timerSpan = note.querySelector('.countdown-timer');
      const dueDateString = note.dataset.dueDate;

      if (!dueDateString) {
        if (timerSpan) {
          timerSpan.textContent = '';
          timerSpan.classList.add('hidden');
        }
        return;
      }

      const dueDate = new Date(dueDateString);
      const diff = dueDate - now;

      let text = '';
      if (diff < 0) {
        text = 'Vencido';
        note.classList.add('overdue');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (days > 0) text = `Faltan ${days} día${days > 1 ? 's' : ''}`;
        else if (hours > 0) text = `Faltan ${hours} hora${hours > 1 ? 's' : ''}`;
        else if (minutes >= 0) text = `Faltan ${minutes} min`;
      }

      if (timerSpan) {
        timerSpan.textContent = text;
        timerSpan.classList.remove('hidden');
      }
    });
  }
}

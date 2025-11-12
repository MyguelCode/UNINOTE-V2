// === UTILIDADES GENERALES - UNINOTE ===

export const Utils = {
  generateUUID() {
    return crypto.randomUUID();
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  },

  formatDate(isoString) {
    return new Date(isoString).toLocaleString('es-ES');
  },

  formatDateShort(isoString) {
    return new Date(isoString).toLocaleDateString('es-ES');
  },

  cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

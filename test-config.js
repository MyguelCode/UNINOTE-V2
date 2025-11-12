// Test simple para verificar la configuración
import { ButtonConfigService } from './js/services/ButtonConfigService.js';

// Simular configuración estándar
const config = {
  numeracion: 'antes-contenido',
  leftButtons: ['estado', 'fechaLimite', 'candado'],
  rightButtons: ['emojiPicker', 'agregarHermana', 'agregarSubNota', 'duplicar', 'archivar', 'eliminar'],
  visibleButtons: new Set(['estado', 'emojiPicker', 'agregarHermana', 'agregarSubNota', 'archivar', 'eliminar']),
  menuShowText: false
};

// Simular getButtonsForNote
const leftVisible = [];
const leftHidden = [];
const rightVisible = [];
const rightHidden = [];

config.leftButtons.forEach(btnId => {
  const btn = { id: btnId, icon: '🔘', label: btnId };
  if (config.visibleButtons.has(btnId)) {
    leftVisible.push(btn);
  } else {
    leftHidden.push(btn);
  }
});

config.rightButtons.forEach(btnId => {
  const btn = { id: btnId, icon: '🔘', label: btnId };
  if (config.visibleButtons.has(btnId)) {
    rightVisible.push(btn);
  } else {
    rightHidden.push(btn);
  }
});

console.log('Left visible:', leftVisible.map(b => b.id));
console.log('Left hidden:', leftHidden.map(b => b.id));
console.log('Right visible:', rightVisible.map(b => b.id));
console.log('Right hidden:', rightHidden.map(b => b.id));
console.log('Has hidden buttons:', leftHidden.length > 0 || rightHidden.length > 0);

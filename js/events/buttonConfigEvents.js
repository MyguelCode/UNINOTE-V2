/**
 * buttonConfigEvents.js - Event handlers for button configuration UI
 */

import { ButtonConfigService } from '../services/ButtonConfigService.js';
import { NoteRenderer } from '../ui/NoteRenderer.js';
import { STATE } from '../config/state.js';

export function initializeButtonConfigEvents() {
  // Preset mode buttons are now rendered dynamically in renderButtonConfigUI()

  // Numeración radio buttons
  const numeracionRadios = document.querySelectorAll('input[name="numeracion"]');
  numeracionRadios.forEach(radio => {
    radio.addEventListener('change', async (e) => {
      if (e.target.checked) {
        await ButtonConfigService.updateNumeracion(e.target.value);

        // Re-render all notes
        if (window.renderAppUI) {
          window.renderAppUI();
        }

        window.NotificationService.showNotification('Numeración actualizada');
      }
    });
  });

  // Menu show text toggle
  const menuShowTextToggle = document.getElementById('menu-show-text-toggle');
  if (menuShowTextToggle) {
    menuShowTextToggle.addEventListener('change', async () => {
      await ButtonConfigService.toggleMenuShowText();

      // Re-render all notes
      if (window.renderAppUI) {
        window.renderAppUI();
      }

      window.NotificationService.showNotification('Visualización de menú actualizada');
    });
  }

  // Update current mode button
  const updateCurrentModeBtn = document.getElementById('update-current-mode-btn');
  if (updateCurrentModeBtn) {
    updateCurrentModeBtn.addEventListener('click', async () => {
      const config = ButtonConfigService.getConfig();
      const currentMode = config.activeMode;

      // Verificar que sea un custom mode
      if (!currentMode || !currentMode.startsWith('custom_')) {
        window.NotificationService.showNotification('Solo puedes actualizar modos personalizados', 'warning');
        return;
      }

      const customMode = config.customModes[currentMode];
      if (!customMode) {
        window.NotificationService.showNotification('Modo no encontrado', 'error');
        return;
      }

      const confirmed = await window.NotificationService.showConfirmationModal(
        'Actualizar Modo',
        `¿Actualizar el modo "${customMode.name}" con la configuración actual?`
      );

      if (confirmed) {
        await ButtonConfigService.updateCustomMode(currentMode);
        window.NotificationService.showNotification(`Modo "${customMode.name}" actualizado`);
        renderButtonConfigUI();
      }
    });
  }

  // Save custom mode button
  const saveCustomModeBtn = document.getElementById('save-custom-mode-btn');
  if (saveCustomModeBtn) {
    saveCustomModeBtn.addEventListener('click', async () => {
      const name = await window.showPromptModal(
        'Guardar Modo Personalizado',
        'Nombre del modo:',
        { defaultValue: 'Mi Configuración' }
      );

      if (name && name.trim()) {
        const customId = await ButtonConfigService.createCustomMode(
          name.trim(),
          '' // Sin descripción
        );

        // Auto-aplicar el modo recién creado
        await ButtonConfigService.applyCustomMode(customId);

        window.NotificationService.showNotification(`Modo "${name}" guardado y aplicado`);

        // Re-render to show new custom mode button
        renderButtonConfigUI();
        if (window.renderAppUI) window.renderAppUI();
      }
    });
  }

  // Initial render of configuration UI
  renderButtonConfigUI();
}

/**
 * Render the button configuration UI
 */
function renderButtonConfigUI() {
  const config = ButtonConfigService.getConfig();

  // Render all mode buttons (presets + custom)
  const presetModesContainer = document.querySelector('.preset-modes');
  if (presetModesContainer) {
    presetModesContainer.innerHTML = '';

    // Add preset buttons
    const presets = ['minimal', 'estandar', 'completo'];
    const presetLabels = { minimal: 'Minimal', estandar: 'Estándar', completo: 'Completo' };

    presets.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'modal-button';
      btn.dataset.preset = preset;
      btn.textContent = presetLabels[preset];

      // Style if active
      if (config.activeMode === preset) {
        btn.style.fontWeight = 'bold';
        btn.style.backgroundColor = 'var(--accent-color, #4CAF50)';
        btn.style.color = 'white';
      }

      // Event listener
      btn.addEventListener('click', async () => {
        await ButtonConfigService.applyPreset(preset);
        renderButtonConfigUI();
        if (window.renderAppUI) window.renderAppUI();
        window.NotificationService.showNotification(`Modo ${preset} aplicado`);
      });

      presetModesContainer.appendChild(btn);
    });

    // Add custom mode buttons
    if (config.customModes && Object.keys(config.customModes).length > 0) {
      Object.entries(config.customModes).forEach(([customId, customMode]) => {
        const btn = document.createElement('button');
        btn.className = 'modal-button';
        btn.dataset.preset = customId;
        btn.textContent = customMode.name;
        btn.style.position = 'relative';

        // Style if active
        if (config.activeMode === customId) {
          btn.style.fontWeight = 'bold';
          btn.style.backgroundColor = 'var(--accent-color, #4CAF50)';
          btn.style.color = 'white';
        }

        // Event listener to apply custom mode
        btn.addEventListener('click', async () => {
          await ButtonConfigService.applyCustomMode(customId);
          renderButtonConfigUI();
          if (window.renderAppUI) window.renderAppUI();
          window.NotificationService.showNotification(`Modo "${customMode.name}" aplicado`);
        });

        // Add delete button (X)
        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = '×';
        deleteBtn.style.cssText = 'position: absolute; top: -5px; right: -5px; background: red; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer; font-weight: bold;';
        deleteBtn.title = 'Eliminar modo';
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`¿Eliminar el modo "${customMode.name}"?`)) {
            await ButtonConfigService.deleteCustomMode(customId);
            renderButtonConfigUI();
            window.NotificationService.showNotification(`Modo "${customMode.name}" eliminado`);
          }
        });

        btn.appendChild(deleteBtn);
        presetModesContainer.appendChild(btn);
      });
    }
  }

  // Update numeración radio
  const numeracionValue = config.numeracion || 'antes-contenido';
  document.querySelector(`input[name="numeracion"][value="${numeracionValue}"]`).checked = true;

  // Update menu show text toggle
  const menuShowTextToggle = document.getElementById('menu-show-text-toggle');
  if (menuShowTextToggle) {
    menuShowTextToggle.checked = config.menuShowText || false;
  }

  // Show/hide "Update Current Mode" button
  const updateCurrentModeBtn = document.getElementById('update-current-mode-btn');
  if (updateCurrentModeBtn) {
    if (config.activeMode && config.activeMode.startsWith('custom_')) {
      updateCurrentModeBtn.style.display = 'block';
    } else {
      updateCurrentModeBtn.style.display = 'none';
    }
  }

  // Render button lists
  renderButtonList('left', config.leftButtons || []);
  renderButtonList('right', config.rightButtons || []);
}

/**
 * Render button list for a column
 */
function renderButtonList(column, buttonIds) {
  const container = document.getElementById(`${column}-buttons-container`);
  if (!container) return;

  const config = ButtonConfigService.getConfig();
  container.innerHTML = '';

  buttonIds.forEach((btnId, index) => {
    const btnDef = ButtonConfigService.AVAILABLE_BUTTONS[btnId];
    if (!btnDef) return;

    const isVisible = config.visibleButtons.has(btnId);
    const isFunctional = btnDef.functional;

    const btnEl = document.createElement('div');
    btnEl.className = 'config-button-item';
    btnEl.draggable = true;
    btnEl.dataset.buttonId = btnId;
    btnEl.dataset.column = column;
    btnEl.dataset.index = index;

    btnEl.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      margin-bottom: 5px;
      background: var(--note-bg, #fff);
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      cursor: move;
      user-select: none;
    `;

    // Drag handle
    const dragHandle = document.createElement('span');
    dragHandle.textContent = '⠿';
    dragHandle.style.cursor = 'move';
    dragHandle.style.opacity = '0.5';

    // Button icon
    const icon = document.createElement('span');
    icon.textContent = btnDef.icon;
    icon.style.fontSize = '1.1em';

    // Button label
    const label = document.createElement('span');
    label.textContent = btnDef.label;
    label.style.flex = '1';
    label.style.fontSize = '0.9em';

    // Phase 2 indicator
    if (!isFunctional) {
      const phase2Badge = document.createElement('span');
      phase2Badge.textContent = 'Phase 2';
      phase2Badge.style.cssText = `
        font-size: 0.7em;
        padding: 2px 6px;
        background: var(--warning-color, #ff9800);
        color: white;
        border-radius: 3px;
        margin-left: 5px;
      `;
      label.appendChild(phase2Badge);
    }

    // Visibility toggle
    const visibilityBtn = document.createElement('button');
    visibilityBtn.textContent = '👁️';
    visibilityBtn.title = isVisible ? 'Ocultar en menú ⋮' : 'Mostrar en nota';
    visibilityBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 1.2em;
      cursor: pointer;
      opacity: ${isVisible ? '1' : '0.3'};
      filter: ${isVisible ? 'none' : 'grayscale(100%)'};
      transition: opacity 0.2s, filter 0.2s;
    `;

    visibilityBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await ButtonConfigService.toggleButtonVisibility(btnId);
      renderButtonConfigUI();

      // Re-render all notes
      if (window.renderAppUI) {
        window.renderAppUI();
      }
    });

    btnEl.appendChild(dragHandle);
    btnEl.appendChild(icon);
    btnEl.appendChild(label);
    btnEl.appendChild(visibilityBtn);

    // Drag events
    btnEl.addEventListener('dragstart', handleDragStart);
    btnEl.addEventListener('dragover', handleDragOver);
    btnEl.addEventListener('drop', handleDrop);
    btnEl.addEventListener('dragend', handleDragEnd);

    container.appendChild(btnEl);
  });

  // Add drop zones for empty containers
  container.addEventListener('dragover', handleContainerDragOver);
  container.addEventListener('drop', handleContainerDrop);
}

/**
 * Drag & Drop handlers
 */
let draggedElement = null;
let draggedButtonId = null;
let draggedFromColumn = null;

function handleDragStart(e) {
  draggedElement = e.currentTarget;
  draggedButtonId = draggedElement.dataset.buttonId;
  draggedFromColumn = draggedElement.dataset.column;

  e.currentTarget.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  e.dataTransfer.dropEffect = 'move';

  const target = e.currentTarget;
  if (target !== draggedElement && target.classList.contains('config-button-item')) {
    target.style.borderTop = '2px solid var(--accent-color, #4CAF50)';
  }

  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  const target = e.currentTarget;
  if (target !== draggedElement && target.classList.contains('config-button-item')) {
    const targetColumn = target.dataset.column;
    const targetIndex = parseInt(target.dataset.index);

    // Move button
    ButtonConfigService.moveButton(draggedButtonId, targetColumn, targetIndex);

    // Re-render
    renderButtonConfigUI();

    // Re-render all notes
    if (window.renderAppUI) {
      window.renderAppUI();
    }
  }

  target.style.borderTop = '';
  return false;
}

function handleDragEnd(e) {
  e.currentTarget.style.opacity = '1';

  // Remove all drag-over indicators
  document.querySelectorAll('.config-button-item').forEach(item => {
    item.style.borderTop = '';
  });

  draggedElement = null;
  draggedButtonId = null;
  draggedFromColumn = null;
}

function handleContainerDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleContainerDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  const container = e.currentTarget;
  const targetColumn = container.dataset.column;

  // If dropped on empty space in container, add to end
  if (draggedButtonId) {
    const config = ButtonConfigService.getConfig();
    const targetList = targetColumn === 'left' ? config.leftButtons : config.rightButtons;
    const targetIndex = targetList.length;

    ButtonConfigService.moveButton(draggedButtonId, targetColumn, targetIndex);

    // Re-render
    renderButtonConfigUI();

    // Re-render all notes
    if (window.renderAppUI) {
      window.renderAppUI();
    }
  }

  return false;
}

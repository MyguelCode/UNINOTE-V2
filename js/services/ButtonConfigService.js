/**
 * ButtonConfigService - Gestión de configuración de botones de notas
 * Maneja la personalización de orden, visibilidad y posición de botones
 */

import { STATE } from '../config/state.js';

export class ButtonConfigService {

  /**
   * Definición de todos los botones disponibles
   */
  static AVAILABLE_BUTTONS = {
    // Botones existentes (Phase 1)
    estado: {
      id: 'estado',
      icon: '☑',
      label: 'Estado',
      action: 'cycle-status',
      functional: true
    },
    fechaLimite: {
      id: 'fechaLimite',
      icon: '📅',
      label: 'Fecha límite',
      action: 'set-date',
      functional: true
    },
    candado: {
      id: 'candado',
      icon: '🔒',
      label: 'Candado',
      action: 'lock',
      functional: true
    },
    duplicar: {
      id: 'duplicar',
      icon: '📑',
      label: 'Duplicar',
      action: 'duplicate',
      functional: true
    },
    agregarHermana: {
      id: 'agregarHermana',
      icon: '➕',
      label: 'Agregar hermana',
      action: 'add-sibling',
      functional: true
    },
    agregarSubNota: {
      id: 'agregarSubNota',
      icon: '↳',
      label: 'Agregar sub-nota',
      action: 'add-subnote',
      functional: true
    },
    emojiPicker: {
      id: 'emojiPicker',
      icon: '😊',
      label: 'Selector emoji',
      action: 'emoji-picker',
      functional: true
    },
    archivar: {
      id: 'archivar',
      icon: '📦',
      label: 'Archivar',
      action: 'archive',
      functional: true
    },
    eliminar: {
      id: 'eliminar',
      icon: '🗑️',
      label: 'Eliminar',
      action: 'delete',
      functional: true
    },
    desarchivar: {
      id: 'desarchivar',
      icon: '📤',
      label: 'Desarchivar',
      action: 'unarchive',
      functional: true,
      archiveOnly: true // Solo visible en vista de archivo
    },

    // Botones nuevos (Phase 2 - visible pero no funcional aún)
    fijar: {
      id: 'fijar',
      icon: '📌',
      label: 'Fijar nota',
      action: 'pin',
      functional: false
    },
    moverInicio: {
      id: 'moverInicio',
      icon: '⏫',
      label: 'Mover al inicio',
      action: 'move-top',
      functional: false
    },
    moverFinal: {
      id: 'moverFinal',
      icon: '⏬',
      label: 'Mover al final',
      action: 'move-bottom',
      functional: false
    },
    moverPosicion: {
      id: 'moverPosicion',
      icon: '🎯',
      label: 'Mover a posición',
      action: 'move-to',
      functional: false
    },
    promover: {
      id: 'promover',
      icon: '⬆️',
      label: 'Promover a principal',
      action: 'promote',
      functional: false
    }
  };

  /**
   * Elementos fijos que no son configurables
   */
  static FIXED_ELEMENTS = {
    checkbox: { id: 'checkbox', icon: '☑', label: 'Checkbox', position: 'fixed-left' },
    dragHandle: { id: 'dragHandle', icon: '⠿', label: 'Drag handle', position: 'fixed-left' },
    noteIcon: { id: 'noteIcon', icon: '📝', label: 'Icono', position: 'fixed-left' },
    toggleExpand: { id: 'toggleExpand', icon: '▼', label: 'Toggle', position: 'fixed-left' },
    overflowMenu: { id: 'overflowMenu', icon: '⋮', label: 'Menú', position: 'fixed-left' }
  };

  /**
   * Preset modes - configuraciones predefinidas
   * IMPORTANTE: visibleButtons debe ser un array, no un Set (para serialización JSON)
   * IMPORTANTE: leftButtons y rightButtons deben tener TODOS los botones, visibleButtons controla cuáles se ven
   */
  static PRESET_MODES = {
    minimal: {
      name: 'Minimal',
      description: 'Solo elementos fijos esenciales, todos los demás en menú ⋮',
      numeracion: 'antes-contenido',
      // TODOS los botones en las listas (necesario para que aparezcan en menú ⋮)
      leftButtons: ['estado', 'fechaLimite', 'candado', 'duplicar', 'fijar'],
      rightButtons: ['emojiPicker', 'agregarHermana', 'agregarSubNota', 'moverInicio', 'moverFinal', 'moverPosicion', 'promover', 'archivar', 'eliminar'],
      // NINGUNO visible - TODOS en menú ⋮
      visibleButtons: [],
      menuShowText: true // Mostrar texto en menú porque hay muchos botones
    },
    estandar: {
      name: 'Estándar',
      description: 'Configuración por defecto balanceada',
      numeracion: 'antes-contenido',
      // TODOS los botones en las listas
      leftButtons: ['estado', 'fechaLimite', 'candado', 'duplicar', 'fijar'],
      rightButtons: ['emojiPicker', 'agregarHermana', 'agregarSubNota', 'moverInicio', 'moverFinal', 'moverPosicion', 'promover', 'archivar', 'eliminar'],
      // Solo los más usados visibles, el resto en menú ⋮
      visibleButtons: ['estado', 'emojiPicker', 'agregarHermana', 'agregarSubNota', 'archivar', 'eliminar'],
      menuShowText: false
    },
    completo: {
      name: 'Completo',
      description: 'Todos los botones visibles',
      numeracion: 'antes-contenido',
      // TODOS los botones en las listas
      leftButtons: ['estado', 'fechaLimite', 'candado', 'duplicar', 'fijar'],
      rightButtons: ['emojiPicker', 'agregarHermana', 'agregarSubNota', 'moverInicio', 'moverFinal', 'moverPosicion', 'promover', 'archivar', 'eliminar'],
      // TODOS visibles - NO aparece menú ⋮
      visibleButtons: ['estado', 'fechaLimite', 'candado', 'duplicar', 'emojiPicker', 'agregarHermana', 'agregarSubNota', 'archivar', 'eliminar', 'fijar', 'moverInicio', 'moverFinal', 'moverPosicion', 'promover'],
      menuShowText: true
    }
  };

  /**
   * Configuración actual (se carga de IndexedDB o usa default)
   */
  static currentConfig = null;

  /**
   * Inicializar configuración
   */
  static async initialize() {
    console.log('🔧 Inicializando ButtonConfigService...');

    // Intentar cargar desde IndexedDB
    if (window.loadSettingAsync) {
      const savedConfig = await window.loadSettingAsync('buttonConfiguration');
      if (savedConfig) {
        console.log('✅ Configuración cargada desde IndexedDB');

        // 🔄 MIGRATION: Detectar y corregir configuraciones antiguas
        const needsMigration = (
          !savedConfig.leftButtons ||
          !savedConfig.rightButtons ||
          savedConfig.leftButtons.length === 0 ||
          savedConfig.rightButtons.length === 0
        );

        if (needsMigration) {
          console.log('🔄 Migrando configuración antigua...');
          // Obtener el preset activo o usar 'estandar' por defecto
          const targetPreset = savedConfig.activeMode || 'estandar';
          const presetData = this.PRESET_MODES[targetPreset] || this.PRESET_MODES.estandar;

          // Combinar: mantener visibleButtons del usuario si son válidos, pero usar nuevos arrays de botones
          this.currentConfig = {
            ...savedConfig,
            leftButtons: presetData.leftButtons,
            rightButtons: presetData.rightButtons,
            // Mantener la configuración de visibilidad del usuario si existe y es válida
            visibleButtons: (savedConfig.visibleButtons && savedConfig.visibleButtons.length > 0)
              ? savedConfig.visibleButtons
              : presetData.visibleButtons
          };

          console.log('✅ Migración completada - leftButtons:', this.currentConfig.leftButtons.length,
                      'rightButtons:', this.currentConfig.rightButtons.length);
        } else {
          this.currentConfig = savedConfig;
        }

        // Convertir array a Set para visibleButtons
        if (Array.isArray(this.currentConfig.visibleButtons)) {
          this.currentConfig.visibleButtons = new Set(this.currentConfig.visibleButtons);
        }

        // Guardar configuración migrada
        if (needsMigration) {
          await this.saveConfiguration();
          console.log('💾 Configuración migrada guardada en IndexedDB');
        }

        return;
      }
    }

    // Si no hay configuración guardada, usar preset 'estandar'
    console.log('📋 Usando configuración estándar por defecto');
    this.currentConfig = JSON.parse(JSON.stringify(this.PRESET_MODES.estandar));
    this.currentConfig.visibleButtons = new Set(this.currentConfig.visibleButtons);
    this.currentConfig.activeMode = 'estandar';

    await this.saveConfiguration();
  }

  /**
   * Guardar configuración en IndexedDB
   */
  static async saveConfiguration() {
    if (!this.currentConfig) return;

    // Convertir Set a Array para guardar en IndexedDB
    const configToSave = {
      ...this.currentConfig,
      visibleButtons: Array.from(this.currentConfig.visibleButtons)
    };

    if (window.saveSettingAsync) {
      await window.saveSettingAsync('buttonConfiguration', configToSave);
      console.log('💾 Configuración guardada en IndexedDB');
    }
  }

  /**
   * Aplicar preset mode
   */
  static async applyPreset(presetName) {
    if (!this.PRESET_MODES[presetName]) {
      console.error('❌ Preset no encontrado:', presetName);
      return;
    }

    const preset = this.PRESET_MODES[presetName];
    this.currentConfig = {
      ...JSON.parse(JSON.stringify(preset)),
      activeMode: presetName,
      customModes: this.currentConfig?.customModes || {} // Preservar custom modes
    };

    // Convertir a Set
    this.currentConfig.visibleButtons = new Set(preset.visibleButtons);

    await this.saveConfiguration();
    console.log('✅ Preset aplicado:', presetName);
  }

  /**
   * Aplicar custom mode
   */
  static async applyCustomMode(customId) {
    if (!this.currentConfig || !this.currentConfig.customModes || !this.currentConfig.customModes[customId]) {
      console.error('❌ Custom mode no encontrado:', customId);
      return;
    }

    const customMode = this.currentConfig.customModes[customId];
    this.currentConfig = {
      ...this.currentConfig,
      numeracion: customMode.numeracion,
      leftButtons: [...customMode.leftButtons],
      rightButtons: [...customMode.rightButtons],
      visibleButtons: new Set(customMode.visibleButtons),
      menuShowText: customMode.menuShowText,
      activeMode: customId
    };

    await this.saveConfiguration();
    console.log('✅ Custom mode aplicado:', customMode.name);
  }

  /**
   * Obtener configuración actual
   */
  static getConfig() {
    if (!this.currentConfig) {
      // Si no hay config, crear una temporal del preset estándar
      const defaultConfig = JSON.parse(JSON.stringify(this.PRESET_MODES.estandar));
      defaultConfig.visibleButtons = new Set(defaultConfig.visibleButtons);
      defaultConfig.activeMode = 'estandar';
      return defaultConfig;
    }
    return this.currentConfig;
  }

  /**
   * Actualizar numeración
   */
  static async updateNumeracion(option) {
    // option: 'sin-numeracion' | 'antes-contenido' | 'antes-checkbox'
    if (!this.currentConfig) return;

    this.currentConfig.numeracion = option;
    // Marcar como configuración personalizada si no es un custom mode ya guardado
    if (!this.currentConfig.activeMode.startsWith('custom_')) {
      this.currentConfig.activeMode = 'custom';
    }
    await this.saveConfiguration();
    console.log('🔢 Numeración actualizada:', option);
  }

  /**
   * Mover botón entre columnas o cambiar orden
   */
  static async moveButton(buttonId, targetColumn, targetIndex) {
    if (!this.currentConfig) return;

    // Remover de ambas columnas
    this.currentConfig.leftButtons = this.currentConfig.leftButtons.filter(id => id !== buttonId);
    this.currentConfig.rightButtons = this.currentConfig.rightButtons.filter(id => id !== buttonId);

    // Agregar a la columna target
    if (targetColumn === 'left') {
      this.currentConfig.leftButtons.splice(targetIndex, 0, buttonId);
    } else {
      this.currentConfig.rightButtons.splice(targetIndex, 0, buttonId);
    }

    // Marcar como configuración personalizada si no es un custom mode ya guardado
    if (!this.currentConfig.activeMode || !this.currentConfig.activeMode.startsWith('custom_')) {
      this.currentConfig.activeMode = 'custom';
    }

    await this.saveConfiguration();
    console.log('🔄 Botón movido:', buttonId, 'a', targetColumn, 'index', targetIndex);
  }

  /**
   * Toggle visibilidad de botón
   */
  static async toggleButtonVisibility(buttonId) {
    if (!this.currentConfig) return;

    if (this.currentConfig.visibleButtons.has(buttonId)) {
      this.currentConfig.visibleButtons.delete(buttonId);
      console.log('👁️ Botón oculto:', buttonId);
    } else {
      this.currentConfig.visibleButtons.add(buttonId);
      console.log('👁️ Botón visible:', buttonId);
    }

    // Marcar como configuración personalizada si no es un custom mode ya guardado
    if (!this.currentConfig.activeMode || !this.currentConfig.activeMode.startsWith('custom_')) {
      this.currentConfig.activeMode = 'custom';
    }

    await this.saveConfiguration();
  }

  /**
   * Toggle mostrar texto en menú overflow
   */
  static async toggleMenuShowText() {
    if (!this.currentConfig) return;

    this.currentConfig.menuShowText = !this.currentConfig.menuShowText;
    // Marcar como configuración personalizada si no es un custom mode ya guardado
    if (!this.currentConfig.activeMode || !this.currentConfig.activeMode.startsWith('custom_')) {
      this.currentConfig.activeMode = 'custom';
    }
    await this.saveConfiguration();
    console.log('📝 Menu show text:', this.currentConfig.menuShowText);
  }

  /**
   * Crear custom mode
   */
  static async createCustomMode(name, description) {
    if (!this.currentConfig) return;

    if (!this.currentConfig.customModes) {
      this.currentConfig.customModes = {};
    }

    const customId = 'custom_' + Date.now();
    this.currentConfig.customModes[customId] = {
      name,
      description,
      numeracion: this.currentConfig.numeracion,
      leftButtons: [...this.currentConfig.leftButtons],
      rightButtons: [...this.currentConfig.rightButtons],
      visibleButtons: Array.from(this.currentConfig.visibleButtons),
      menuShowText: this.currentConfig.menuShowText
    };

    await this.saveConfiguration();
    console.log('✨ Custom mode creado:', name);
    return customId;
  }

  /**
   * Actualizar custom mode existente con configuración actual
   */
  static async updateCustomMode(customId) {
    if (!this.currentConfig || !this.currentConfig.customModes || !this.currentConfig.customModes[customId]) {
      console.error('❌ Custom mode no encontrado:', customId);
      return;
    }

    // Mantener el nombre pero actualizar la configuración
    const currentName = this.currentConfig.customModes[customId].name;
    this.currentConfig.customModes[customId] = {
      name: currentName,
      description: '',
      numeracion: this.currentConfig.numeracion,
      leftButtons: [...this.currentConfig.leftButtons],
      rightButtons: [...this.currentConfig.rightButtons],
      visibleButtons: Array.from(this.currentConfig.visibleButtons),
      menuShowText: this.currentConfig.menuShowText
    };

    await this.saveConfiguration();
    console.log('✏️ Custom mode actualizado:', currentName);
  }

  /**
   * Eliminar custom mode
   */
  static async deleteCustomMode(customId) {
    if (!this.currentConfig || !this.currentConfig.customModes) return;

    delete this.currentConfig.customModes[customId];
    await this.saveConfiguration();
    console.log('🗑️ Custom mode eliminado:', customId);
  }

  /**
   * Obtener todos los modes (presets + custom)
   */
  static getAllModes() {
    const modes = { ...this.PRESET_MODES };

    if (this.currentConfig && this.currentConfig.customModes) {
      Object.assign(modes, this.currentConfig.customModes);
    }

    return modes;
  }

  /**
   * Verificar si un botón está visible
   */
  static isButtonVisible(buttonId) {
    const config = this.getConfig();
    if (!config.visibleButtons) return false;
    return config.visibleButtons.has(buttonId);
  }

  /**
   * Obtener botones para renderizar en una nota
   * Retorna: { leftVisible, leftHidden, rightVisible, rightHidden }
   */
  static getButtonsForNote(isArchiveView = false) {
    const config = this.getConfig();
    console.log('🔍 getButtonsForNote - activeMode:', config.activeMode);
    console.log('🔍 getButtonsForNote - visibleButtons:', Array.from(config.visibleButtons || []));

    const leftVisible = [];
    const leftHidden = [];
    const rightVisible = [];
    const rightHidden = [];

    // Procesar botones izquierdos
    config.leftButtons.forEach(btnId => {
      const btn = this.AVAILABLE_BUTTONS[btnId];
      if (!btn) return;

      // Skip archiveOnly buttons if not in archive view
      if (btn.archiveOnly && !isArchiveView) return;

      if (config.visibleButtons.has(btnId)) {
        leftVisible.push(btn);
      } else {
        leftHidden.push(btn);
      }
    });

    // Procesar botones derechos
    config.rightButtons.forEach(btnId => {
      const btn = this.AVAILABLE_BUTTONS[btnId];
      if (!btn) return;

      // Skip archiveOnly buttons if not in archive view
      if (btn.archiveOnly && !isArchiveView) return;

      if (config.visibleButtons.has(btnId)) {
        rightVisible.push(btn);
      } else {
        rightHidden.push(btn);
      }
    });

    return { leftVisible, leftHidden, rightVisible, rightHidden };
  }
}

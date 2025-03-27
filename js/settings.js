/**
 * Settings Page Logic
 * Handles the settings functionality for PipeRouteAI
 */

// Store the current settings
let currentSettings = {
    general: {
        darkTheme: true,
        units: 'metric',
        highPerformance: false,
        autoSave: true
    },
    visualization: {
        cameraSpeed: 1.0,
        renderQuality: 'medium',
        showSegments: true,
        enableShadows: false
    },
    ai: {
        apiKey: 'AIzaSyB0BXc3hEp_AnU8ApaPxLFuCsMVCtTEecY',
        responseDetail: 'standard',
        enableAssistant: true
    },
    export: {
        quality: 'standard',
        includeVehicle: false,
        includeMetadata: true
    }
};

// Initialize the settings page
function initSettingsPage() {
    // Load settings from localStorage
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI with current settings
    updateSettingsUI();
}

/**
 * Set up event listeners for the settings page
 */
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            currentSettings.general.darkTheme = this.checked;
            saveSettings();
        });
    }
    
    // Units select
    const unitsSelect = document.getElementById('units-select');
    if (unitsSelect) {
        unitsSelect.addEventListener('change', function() {
            currentSettings.general.units = this.value;
            saveSettings();
        });
    }
    
    // Performance toggle
    const performanceToggle = document.getElementById('performance-toggle');
    if (performanceToggle) {
        performanceToggle.addEventListener('change', function() {
            currentSettings.general.highPerformance = this.checked;
            saveSettings();
        });
    }
    
    // Auto-save toggle
    const autoSaveToggle = document.getElementById('autosave-toggle');
    if (autoSaveToggle) {
        autoSaveToggle.addEventListener('change', function() {
            currentSettings.general.autoSave = this.checked;
            saveSettings();
        });
    }
    
    // Camera speed slider
    const cameraSpeedSlider = document.getElementById('camera-speed');
    const cameraSpeedValue = document.getElementById('camera-speed-value');
    if (cameraSpeedSlider && cameraSpeedValue) {
        cameraSpeedSlider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            currentSettings.visualization.cameraSpeed = value;
            cameraSpeedValue.textContent = value.toFixed(1);
        });
        
        cameraSpeedSlider.addEventListener('change', function() {
            saveSettings();
        });
    }
    
    // Render quality slider
    const renderQualitySlider = document.getElementById('render-quality');
    const renderQualityValue = document.getElementById('render-quality-value');
    if (renderQualitySlider && renderQualityValue) {
        renderQualitySlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            let qualityText = 'Medium';
            
            switch (value) {
                case 1:
                    qualityText = 'Low';
                    currentSettings.visualization.renderQuality = 'low';
                    break;
                case 2:
                    qualityText = 'Medium';
                    currentSettings.visualization.renderQuality = 'medium';
                    break;
                case 3:
                    qualityText = 'High';
                    currentSettings.visualization.renderQuality = 'high';
                    break;
            }
            
            renderQualityValue.textContent = qualityText;
        });
        
        renderQualitySlider.addEventListener('change', function() {
            saveSettings();
        });
    }
    
    // Segments toggle
    const segmentsToggle = document.getElementById('segments-toggle');
    if (segmentsToggle) {
        segmentsToggle.addEventListener('change', function() {
            currentSettings.visualization.showSegments = this.checked;
            saveSettings();
        });
    }
    
    // Shadows toggle
    const shadowsToggle = document.getElementById('shadows-toggle');
    if (shadowsToggle) {
        shadowsToggle.addEventListener('change', function() {
            currentSettings.visualization.enableShadows = this.checked;
            saveSettings();
        });
    }
    
    // API key input
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('change', function() {
            currentSettings.ai.apiKey = this.value;
            saveSettings();
        });
    }
    
    // Show/hide API key button
    const showKeyBtn = document.getElementById('show-key');
    if (showKeyBtn && apiKeyInput) {
        showKeyBtn.addEventListener('click', function() {
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                apiKeyInput.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    }
    
    // AI detail select
    const aiDetailSelect = document.getElementById('ai-detail');
    if (aiDetailSelect) {
        aiDetailSelect.addEventListener('change', function() {
            currentSettings.ai.responseDetail = this.value;
            saveSettings();
        });
    }
    
    // AI assistant toggle
    const assistantToggle = document.getElementById('assistant-toggle');
    if (assistantToggle) {
        assistantToggle.addEventListener('change', function() {
            currentSettings.ai.enableAssistant = this.checked;
            saveSettings();
            
            // Toggle AI assistant visibility
            const aiAssistant = document.getElementById('ai-assistant');
            if (aiAssistant) {
                aiAssistant.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
    
    // Export quality select
    const exportQualitySelect = document.getElementById('export-quality');
    if (exportQualitySelect) {
        exportQualitySelect.addEventListener('change', function() {
            currentSettings.export.quality = this.value;
            saveSettings();
        });
    }
    
    // Include vehicle toggle
    const includeVehicleToggle = document.getElementById('include-vehicle-toggle');
    if (includeVehicleToggle) {
        includeVehicleToggle.addEventListener('change', function() {
            currentSettings.export.includeVehicle = this.checked;
            saveSettings();
        });
    }
    
    // Include metadata toggle
    const includeMetadataToggle = document.getElementById('include-metadata-toggle');
    if (includeMetadataToggle) {
        includeMetadataToggle.addEventListener('change', function() {
            currentSettings.export.includeMetadata = this.checked;
            saveSettings();
        });
    }
    
    // Save settings button
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            saveSettings();
            showNotification('Settings saved successfully', 'success');
        });
    }
    
    // Export buttons
    const exportButtons = document.querySelectorAll('[id^="export-"]');
    exportButtons.forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Export functionality would be implemented in a full version', 'info');
        });
    });
    
    // Saved design buttons
    const editButtons = document.querySelectorAll('.fa-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Edit functionality would be implemented in a full version', 'info');
        });
    });
    
    const deleteButtons = document.querySelectorAll('.fa-trash-alt');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Delete functionality would be implemented in a full version', 'info');
        });
    });
}

/**
 * Update the UI with the current settings
 */
function updateSettingsUI() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = currentSettings.general.darkTheme;
    }
    
    // Units select
    const unitsSelect = document.getElementById('units-select');
    if (unitsSelect) {
        unitsSelect.value = currentSettings.general.units;
    }
    
    // Performance toggle
    const performanceToggle = document.getElementById('performance-toggle');
    if (performanceToggle) {
        performanceToggle.checked = currentSettings.general.highPerformance;
    }
    
    // Auto-save toggle
    const autoSaveToggle = document.getElementById('autosave-toggle');
    if (autoSaveToggle) {
        autoSaveToggle.checked = currentSettings.general.autoSave;
    }
    
    // Camera speed slider
    const cameraSpeedSlider = document.getElementById('camera-speed');
    const cameraSpeedValue = document.getElementById('camera-speed-value');
    if (cameraSpeedSlider && cameraSpeedValue) {
        cameraSpeedSlider.value = currentSettings.visualization.cameraSpeed;
        cameraSpeedValue.textContent = currentSettings.visualization.cameraSpeed.toFixed(1);
    }
    
    // Render quality slider
    const renderQualitySlider = document.getElementById('render-quality');
    const renderQualityValue = document.getElementById('render-quality-value');
    if (renderQualitySlider && renderQualityValue) {
        let qualityValue = 2; // Medium by default
        
        switch (currentSettings.visualization.renderQuality) {
            case 'low':
                qualityValue = 1;
                renderQualityValue.textContent = 'Low';
                break;
            case 'medium':
                qualityValue = 2;
                renderQualityValue.textContent = 'Medium';
                break;
            case 'high':
                qualityValue = 3;
                renderQualityValue.textContent = 'High';
                break;
        }
        
        renderQualitySlider.value = qualityValue;
    }
    
    // Segments toggle
    const segmentsToggle = document.getElementById('segments-toggle');
    if (segmentsToggle) {
        segmentsToggle.checked = currentSettings.visualization.showSegments;
    }
    
    // Shadows toggle
    const shadowsToggle = document.getElementById('shadows-toggle');
    if (shadowsToggle) {
        shadowsToggle.checked = currentSettings.visualization.enableShadows;
    }
    
    // API key input
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
        apiKeyInput.value = currentSettings.ai.apiKey;
    }
    
    // AI detail select
    const aiDetailSelect = document.getElementById('ai-detail');
    if (aiDetailSelect) {
        aiDetailSelect.value = currentSettings.ai.responseDetail;
    }
    
    // AI assistant toggle
    const assistantToggle = document.getElementById('assistant-toggle');
    if (assistantToggle) {
        assistantToggle.checked = currentSettings.ai.enableAssistant;
    }
    
    // Export quality select
    const exportQualitySelect = document.getElementById('export-quality');
    if (exportQualitySelect) {
        exportQualitySelect.value = currentSettings.export.quality;
    }
    
    // Include vehicle toggle
    const includeVehicleToggle = document.getElementById('include-vehicle-toggle');
    if (includeVehicleToggle) {
        includeVehicleToggle.checked = currentSettings.export.includeVehicle;
    }
    
    // Include metadata toggle
    const includeMetadataToggle = document.getElementById('include-metadata-toggle');
    if (includeMetadataToggle) {
        includeMetadataToggle.checked = currentSettings.export.includeMetadata;
    }
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
    const savedSettings = localStorage.getItem('pipeRouteSettings');
    
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            
            // Merge saved settings with defaults
            currentSettings = {
                general: { ...currentSettings.general, ...parsedSettings.general },
                visualization: { ...currentSettings.visualization, ...parsedSettings.visualization },
                ai: { ...currentSettings.ai, ...parsedSettings.ai },
                export: { ...currentSettings.export, ...parsedSettings.export }
            };
        } catch (error) {
            console.error('Error parsing saved settings:', error);
        }
    }
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
    try {
        localStorage.setItem('pipeRouteSettings', JSON.stringify(currentSettings));
        
        // Apply settings that can be applied immediately
        applySettings();
        
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings', 'error');
        return false;
    }
}

/**
 * Apply settings that can be applied immediately
 */
function applySettings() {
    // Apply theme
    document.body.classList.toggle('light-theme', !currentSettings.general.darkTheme);
    
    // Apply AI assistant visibility
    const aiAssistant = document.getElementById('ai-assistant');
    if (aiAssistant) {
        aiAssistant.style.display = currentSettings.ai.enableAssistant ? 'block' : 'none';
    }
    
    // Store API key for Gemini API
    if (window.geminiAPI && currentSettings.ai.apiKey) {
        localStorage.setItem('geminiApiKey', currentSettings.ai.apiKey);
    }
}

// Make functions available globally
window.initSettingsPage = initSettingsPage;

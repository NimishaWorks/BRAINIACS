/**
 * Pipe Routing Logic
 * Handles the pipe routing functionality and integration with the Gemini API
 */

// Store the current routing configuration
let currentRoutingConfig = {
    prompt: '',
    vehicleType: 'sedan',
    pipeType: 'fuel',
    optimizations: {
        minimizeLength: true,
        minimizeBends: true,
        maximizeClearance: true,
        avoidHeat: false
    }
};

// Store the generated routing data for both options
let generatedRoutings = {
    option1: null,
    option2: null,
    currentOption: 'option1'
};

// Initialize the routing page
function initRoutingPage() {
    // Initialize the 3D visualization
    window.threeJSHelpers.initThreeJS('routing-canvas-container', {
        showVehicle: true,
        showPipes: false,
        showHeatmap: false
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize UI state
    updateUIState();

// Set up route option handlers
function setupRouteOptionHandlers() {
    const routeOptions = document.querySelectorAll('.route-option');
    routeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            routeOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Update current route option
            const optionId = this.id === 'route-option-1' ? 'option1' : 'option2';
            generatedRoutings.currentOption = optionId;
            
            // Display the selected route's data if it exists
            if (generatedRoutings[optionId]) {
                displayGeneratedRouting(generatedRoutings[optionId]);
                updateRoutingStats(generatedRoutings[optionId]);
            }
        });
    });
}

// Initialize route options
setupRouteOptionHandlers();
}

/**
 * Set up event listeners for the routing page
 */
function setupEventListeners() {
    // Generate button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateRouting);
    }
    
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetRouting);
    }
    
    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveRouting);
    }
    
    // Analyze button
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            // Save current routing to localStorage before navigating
            saveRoutingToLocalStorage();
            
            // Navigate to analysis page
            window.location.href = 'analysis.html';
        });
    }
    
    // View buttons
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all view buttons
            viewBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Change view
            const view = this.getAttribute('data-view');
            window.threeJSHelpers.changeView(view);
        });
    });
    
    // Toggle vehicle button
    const toggleVehicleBtn = document.getElementById('toggle-vehicle');
    if (toggleVehicleBtn) {
        toggleVehicleBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            window.threeJSHelpers.toggleVehicleVisibility(this.classList.contains('active'));
        });
        
        // Set initial state
        toggleVehicleBtn.classList.add('active');
    }
    
    // Toggle obstacles button
    const toggleObstaclesBtn = document.getElementById('toggle-obstacles');
    if (toggleObstaclesBtn) {
        toggleObstaclesBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            // Implementation would depend on how obstacles are represented
        });
    }
    
    // Toggle edit mode button
    const toggleEditModeBtn = document.getElementById('toggle-edit-mode');
    const editControls = document.getElementById('edit-controls');
    
    if (toggleEditModeBtn && editControls) {
        toggleEditModeBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            editControls.style.display = this.classList.contains('active') ? 'block' : 'none';
        });
    }
    
    // Apply edit button
    const applyEditBtn = document.getElementById('apply-edit');
    if (applyEditBtn) {
        applyEditBtn.addEventListener('click', applyPipeEdit);
    }
    
    // Listen for pipe selection events
    document.addEventListener('pipeSelected', function(event) {
        const pipeData = event.detail;
        
        // Update the edit segment dropdown
        const editSegmentSelect = document.getElementById('edit-segment');
        if (editSegmentSelect) {
            editSegmentSelect.value = pipeData.pipeId.replace('pipe', '');
        }
        
        // Update other edit fields based on the selected pipe
        updateEditFields(pipeData);
        
        // Show edit controls if not already visible
        if (toggleEditModeBtn && !toggleEditModeBtn.classList.contains('active')) {
            toggleEditModeBtn.click();
        }
    });
    
    // Optimization checkboxes
    const optimizationCheckboxes = document.querySelectorAll('[id^="opt-"]');
    optimizationCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const optimizationType = this.id.replace('opt-', '');
            
            switch (optimizationType) {
                case 'length':
                    currentRoutingConfig.optimizations.minimizeLength = this.checked;
                    break;
                case 'bends':
                    currentRoutingConfig.optimizations.minimizeBends = this.checked;
                    break;
                case 'clearance':
                    currentRoutingConfig.optimizations.maximizeClearance = this.checked;
                    break;
                case 'heat':
                    currentRoutingConfig.optimizations.avoidHeat = this.checked;
                    break;
            }
        });
    });
    
    // Vehicle type selection
    const vehicleTypeSelect = document.getElementById('vehicle-type');
    if (vehicleTypeSelect) {
        vehicleTypeSelect.addEventListener('change', function() {
            currentRoutingConfig.vehicleType = this.value;
        });
    }
    
    // Pipe type selection
    const pipeTypeSelect = document.getElementById('pipe-type');
    if (pipeTypeSelect) {
        pipeTypeSelect.addEventListener('change', function() {
            currentRoutingConfig.pipeType = this.value;
        });
    }
}

/**
 * Update UI state based on current data
 */
function updateUIState() {
    // Check if there's saved routing data
    const savedRouting = loadFromLocalStorage('currentRouting');
    
    if (savedRouting) {
        // Restore the saved configuration
        currentRoutingConfig = savedRouting.config;
        
        // Update form fields
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            promptInput.value = currentRoutingConfig.prompt;
        }
        
        const vehicleTypeSelect = document.getElementById('vehicle-type');
        if (vehicleTypeSelect) {
            vehicleTypeSelect.value = currentRoutingConfig.vehicleType;
        }
        
        const pipeTypeSelect = document.getElementById('pipe-type');
        if (pipeTypeSelect) {
            pipeTypeSelect.value = currentRoutingConfig.pipeType;
        }
        
        // Update optimization checkboxes
        for (const [key, value] of Object.entries(currentRoutingConfig.optimizations)) {
            let checkboxId;
            
            switch (key) {
                case 'minimizeLength':
                    checkboxId = 'opt-length';
                    break;
                case 'minimizeBends':
                    checkboxId = 'opt-bends';
                    break;
                case 'maximizeClearance':
                    checkboxId = 'opt-clearance';
                    break;
                case 'avoidHeat':
                    checkboxId = 'opt-heat';
                    break;
            }
            
            if (checkboxId) {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox) {
                    checkbox.checked = value;
                }
            }
        }
        
        // If there's routing data, restore it
        if (savedRouting.routingData) {
            generatedRoutings = savedRouting.routingData;
            generatedRoutings.currentOption = savedRouting.currentOption || 'option1';
            
            // Display the current option
            const currentRoutingData = generatedRoutings[generatedRoutings.currentOption];
            if (currentRoutingData) {
                displayGeneratedRouting(currentRoutingData);
                updateRoutingStats(currentRoutingData);
            }
            
            // Update route option buttons
            const routeOptions = document.querySelectorAll('.route-option');
            routeOptions.forEach(option => {
                const optionId = option.id === 'route-option-1' ? 'option1' : 'option2';
                if (optionId === generatedRoutings.currentOption) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }
    }
}

/**
 * Generate pipe routing based on the current configuration
 */
function generateRouting() {
    // Get the prompt from the input field
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) {
        currentRoutingConfig.prompt = promptInput.value.trim();
    }
    
    // Validate input
    if (!currentRoutingConfig.prompt) {
        showNotification('Please enter a routing description', 'error');
        return;
    }
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
    
    // Hide routing stats if visible
    const routingStats = document.getElementById('routing-stats');
    if (routingStats) {
        routingStats.style.display = 'none';
    }
    
    // In a real application, this would call the Gemini API
    // For this demo, we'll simulate the API call with a timeout
    setTimeout(() => {
        // Generate two different routing options with varied parameters
        const option1Config = { ...currentRoutingConfig }; // Option 1 uses user's selected optimizations
    // Create radically different optimization strategy for option 2
    const option2Strategy = {
        minimizeLength: !currentRoutingConfig.optimizations.minimizeLength,
        minimizeBends: !currentRoutingConfig.optimizations.minimizeBends,
        maximizeClearance: !currentRoutingConfig.optimizations.maximizeClearance,
        avoidHeat: !currentRoutingConfig.optimizations.avoidHeat,
        routingStyle: currentRoutingConfig.optimizations.minimizeLength ? 'safety' : 'performance'
    };

    // Enhanced multipliers for more distinct differences
    const option2Multipliers = {
        length: option2Strategy.minimizeLength ? 0.6 : 1.8,  // More extreme length differences
        bends: option2Strategy.minimizeBends ? 0.5 : 2.0,    // Doubled bend difference
        clearance: option2Strategy.maximizeClearance ? 2.0 : 0.6,  // Doubled clearance difference
        score: 0,  // Will be calculated based on optimizations
        // New multipliers for distinct characteristics
        reliability: option2Strategy.routingStyle === 'safety' ? 1.4 : 0.8,
        maintenance: option2Strategy.routingStyle === 'safety' ? 1.3 : 0.9,
        cost: option2Strategy.routingStyle === 'safety' ? 1.2 : 0.85
    };

    // Enhanced score calculation with weighted factors
    if (option2Strategy.minimizeLength) option2Multipliers.score += 18;
    if (option2Strategy.minimizeBends) option2Multipliers.score += 15;
    if (option2Strategy.maximizeClearance) option2Multipliers.score += 12;
    if (option2Strategy.avoidHeat) option2Multipliers.score += 10;
    if (option2Strategy.routingStyle === 'safety') option2Multipliers.score += 8;
    
    // Create radically different routing configuration for option 2
    const option2Config = {
        ...currentRoutingConfig,
        optimizations: option2Strategy,
        visualParams: {
            // Opposite routing style for visual distinction
            routeStyle: option2Strategy.routingStyle === 'safety' ? 'conservative' : 'aggressive',
            // More extreme height variations
            heightVariation: option2Strategy.maximizeClearance ? 1.2 : 0.1,
            // Wider spread for more visual difference
            spreadFactor: option2Strategy.minimizeBends ? 0.4 : 2.8,
            // More pronounced bends
            bendIntensity: option2Strategy.minimizeBends ? 0.2 : 2.0,
            // Higher vertical offset
            verticalOffset: option2Strategy.maximizeClearance ? 0.8 : 0.05,
            // Enhanced visual parameters
            segmentGranularity: option2Strategy.routingStyle === 'safety' ? 'very_high' : 'very_low',
            pathComplexity: option2Strategy.minimizeLength ? 'minimal' : 'highly_complex',
            clearanceBuffer: option2Strategy.maximizeClearance ? 0.6 : 0.05,
            // New parameters for option 2
            routeOffset: { x: 0.3, y: 0.2, z: -0.3 }, // Offset entire route for clear distinction
            bendStyle: option2Strategy.minimizeBends ? 'sharp' : 'smooth',
            crossSectionShape: option2Strategy.routingStyle === 'safety' ? 'circular' : 'oval'
        }
    };

    // Enhanced vehicle-specific adjustments for option 2
    switch(currentRoutingConfig.vehicleType) {
        case 'sports':
            if (option2Strategy.routingStyle === 'performance') {
                option2Config.visualParams.heightVariation *= 0.5;
                option2Config.visualParams.spreadFactor *= 0.6;
                option2Multipliers.length *= 0.75;
                option2Multipliers.score += 15; // Performance bonus
            } else {
                option2Config.visualParams.heightVariation *= 0.9;
                option2Config.visualParams.clearanceBuffer *= 1.4;
                option2Multipliers.reliability *= 1.3;
            }
            break;
        case 'suv':
            if (option2Strategy.routingStyle === 'safety') {
                option2Config.visualParams.heightVariation *= 1.6;
                option2Config.visualParams.verticalOffset *= 1.8;
                option2Multipliers.clearance *= 1.5;
                option2Multipliers.score += 12; // Safety bonus
            } else {
                option2Config.visualParams.pathComplexity = 'moderate';
                option2Config.visualParams.spreadFactor *= 1.3;
                option2Multipliers.maintenance *= 1.2;
            }
            break;
        case 'truck':
            if (option2Strategy.routingStyle === 'safety') {
                option2Config.visualParams.heightVariation *= 1.8;
                option2Config.visualParams.verticalOffset *= 2.0;
                option2Multipliers.clearance *= 1.7;
                option2Multipliers.score += 10; // Durability bonus
            } else {
                option2Config.visualParams.bendIntensity *= 1.4;
                option2Config.visualParams.clearanceBuffer *= 1.5;
                option2Multipliers.cost *= 1.2;
            }
            break;
    }

    // Enhanced pipe type specific adjustments for option 2
    switch(currentRoutingConfig.pipeType) {
        case 'cooling':
            if (option2Strategy.routingStyle === 'performance') {
                option2Config.visualParams.bendIntensity *= 0.6;
                option2Config.visualParams.spreadFactor *= 1.5;
                option2Multipliers.length *= 1.3;
                option2Multipliers.score += 8; // Cooling efficiency bonus
            } else {
                option2Config.visualParams.segmentGranularity = 'very_high';
                option2Config.visualParams.clearanceBuffer *= 1.4;
                option2Multipliers.reliability *= 1.25;
            }
            break;
        case 'brake':
            if (option2Strategy.routingStyle === 'safety') {
                option2Config.visualParams.bendIntensity *= 0.4;
                option2Config.visualParams.spreadFactor *= 0.6;
                option2Multipliers.length *= 0.8;
                option2Multipliers.score += 14; // Safety system bonus
            } else {
                option2Config.visualParams.pathComplexity = 'minimal';
                option2Config.visualParams.heightVariation *= 1.3;
                option2Multipliers.maintenance *= 1.15;
            }
            break;
        case 'fuel':
            if (option2Strategy.avoidHeat) {
                option2Config.visualParams.verticalOffset *= 1.8;
                option2Config.visualParams.spreadFactor *= 1.4;
                option2Config.visualParams.clearanceBuffer *= 1.6;
                option2Multipliers.clearance *= 1.5;
                option2Multipliers.score += 12; // Heat protection bonus
            } else {
                option2Config.visualParams.segmentGranularity = 'moderate';
                option2Config.visualParams.pathComplexity = 'balanced';
                option2Multipliers.cost *= 0.9;
            }
            break;
    }

        // Generate both options with distinct characteristics
        generatedRoutings.option1 = generateMockRoutingData(option1Config);
        
        // Apply multipliers to option 2 stats
        const option2Data = generateMockRoutingData(option2Config);
        option2Data.stats = {
            length: (parseFloat(option2Data.stats.length) * option2Multipliers.length).toFixed(1),
            bends: Math.round(option2Data.stats.bends * option2Multipliers.bends),
            clearance: (parseFloat(option2Data.stats.clearance) * option2Multipliers.clearance).toFixed(1),
            score: Math.min(100, Math.round(option2Data.stats.score + option2Multipliers.score))
        };
        
        // Generate comparative analysis between routes
        const comparison = {
            advantage: '',
            tradeoff: '',
            recommendation: ''
        };

        // Compare key metrics
        const lengthDiff = (parseFloat(option2Data.stats.length) - parseFloat(generatedRoutings.option1.stats.length)).toFixed(1);
        const bendsDiff = option2Data.stats.bends - generatedRoutings.option1.stats.bends;
        const clearanceDiff = (parseFloat(option2Data.stats.clearance) - parseFloat(generatedRoutings.option1.stats.clearance)).toFixed(1);
        const scoreDiff = option2Data.stats.score - generatedRoutings.option1.stats.score;

        // Determine primary advantage and tradeoff
        if (lengthDiff < 0) {
            comparison.advantage = `shorter length (${Math.abs(lengthDiff)}m less)`;
            if (bendsDiff > 0) {
                comparison.tradeoff = `${bendsDiff} more bends`;
            } else if (clearanceDiff < 0) {
                comparison.tradeoff = `${Math.abs(clearanceDiff)}cm less clearance`;
            }
        } else if (bendsDiff < 0) {
            comparison.advantage = `fewer bends (${Math.abs(bendsDiff)} less)`;
            if (lengthDiff > 0) {
                comparison.tradeoff = `${lengthDiff}m longer path`;
            } else if (clearanceDiff < 0) {
                comparison.tradeoff = `${Math.abs(clearanceDiff)}cm less clearance`;
            }
        } else if (clearanceDiff > 0) {
            comparison.advantage = `better clearance (${clearanceDiff}cm more)`;
            if (lengthDiff > 0) {
                comparison.tradeoff = `${lengthDiff}m longer path`;
            } else if (bendsDiff > 0) {
                comparison.tradeoff = `${bendsDiff} more bends`;
            }
        }

        // Generate recommendation based on vehicle type and pipe type
        if (currentRoutingConfig.vehicleType === 'sports' && scoreDiff > 5) {
            comparison.recommendation = 'Recommended for performance-focused sports vehicle application.';
        } else if (currentRoutingConfig.vehicleType === 'suv' && clearanceDiff > 0) {
            comparison.recommendation = 'Better suited for SUV with improved ground clearance.';
        } else if (currentRoutingConfig.pipeType === 'cooling' && bendsDiff < 0) {
            comparison.recommendation = 'Preferred for cooling system with optimized flow characteristics.';
        } else if (currentRoutingConfig.pipeType === 'fuel' && option2Strategy.avoidHeat) {
            comparison.recommendation = 'Safer option with better heat avoidance for fuel system.';
        } else if (scoreDiff > 0) {
            comparison.recommendation = 'Overall better performance metrics suggest this as the preferred option.';
        } else {
            comparison.recommendation = 'Consider this as an alternative based on specific installation requirements.';
        }
        option2Data.recommendations = [
            ...option2Data.recommendations,
            `Route 2 offers ${comparison.advantage} at the cost of ${comparison.tradeoff}.`,
            comparison.recommendation
        ];
        
        generatedRoutings.option2 = option2Data;
        
        // Set current option and display it
        generatedRoutings.currentOption = 'option1';
        displayGeneratedRouting(generatedRoutings.option1);
        
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // Show routing stats
        if (routingStats) {
            routingStats.style.display = 'block';
        }
        
        // Update stats for current option
        updateRoutingStats(generatedRoutings.option1);
        
        // Save to localStorage
        saveRoutingToLocalStorage();
        
        // Show success notification
        showNotification('Multiple routing options generated successfully', 'success');
    }, 2000);
}

/**
 * Generate mock routing data for demonstration
 * In a real application, this would come from the Gemini API
 * @param {Object} config - The routing configuration
 * @returns {Object} Mock routing data
 */
function generateMockRoutingData(config) {
    // Create routing data based on the passed configuration
    const vehicleType = config.vehicleType;
    const pipeType = config.pipeType;
    const prompt = config.prompt.toLowerCase();
    const optimizations = config.optimizations;
    
    // Initialize base stats with vehicle-specific defaults
    let baseStats = window.routingHelpers.getVehicleBaseStats(vehicleType);
    let length = baseStats.length;
    let bends = baseStats.bends;
    let clearance = baseStats.clearance;
    let score = baseStats.score;

    // Apply pipe type specific modifications
    const pipeTypeModifiers = window.routingHelpers.getPipeTypeModifiers(pipeType);
    length *= pipeTypeModifiers.length;
    bends *= pipeTypeModifiers.bends;
    clearance *= pipeTypeModifiers.clearance;
    score += pipeTypeModifiers.score;

    // Apply optimization modifiers
    const optimizationImpact = window.routingHelpers.calculateOptimizationImpact(optimizations, vehicleType, pipeType);
    length *= optimizationImpact.length;
    bends *= optimizationImpact.bends;
    clearance *= optimizationImpact.clearance;
    score += optimizationImpact.score;

    // Apply additional vehicle-specific adjustments if needed
    if (vehicleType === 'sports' && optimizations.minimizeLength) {
        length *= 0.9; // Extra length reduction for sports cars
        score += 2;    // Bonus for optimal sports car routing
    }
    
    if ((vehicleType === 'suv' || vehicleType === 'truck') && optimizations.maximizeClearance) {
        clearance *= 1.1; // Extra clearance for larger vehicles
        score += 2;       // Bonus for proper SUV/truck routing
    }

    
    // Apply prompt-based adjustments with more distinct effects
    if (prompt.includes('minimum length') || prompt.includes('shorter') || prompt.includes('reduce length')) {
        if (optimizations.minimizeLength) {
            length *= 0.6; // More aggressive reduction when optimization is enabled
            score += 8;
        } else {
            length *= 0.85; // Smaller reduction without optimization
            score += 3;
        }
    }
    
    if (prompt.includes('fewer bends') || prompt.includes('straight') || prompt.includes('minimize bends')) {
        if (optimizations.minimizeBends) {
            bends = Math.max(2, bends - 5); // More aggressive bend reduction
            score += 7;
        } else {
            bends = Math.max(4, bends - 2); // Moderate bend reduction
            score += 3;
        }
    }
    
    if (prompt.includes('clearance') || prompt.includes('space') || prompt.includes('gap')) {
        if (optimizations.maximizeClearance) {
            clearance *= 1.8; // Significant clearance increase
            score += 6;
        } else {
            clearance *= 1.2; // Moderate clearance increase
            score += 2;
        }
    }
    
    if (prompt.includes('heat') || prompt.includes('temperature') || prompt.includes('thermal')) {
        if (!optimizations.avoidHeat) {
            optimizations.avoidHeat = true;
            score += 4;
        }
    }
    
    
    // Cap score at 100
    score = Math.min(100, score);
    
    // Generate pipe segments based on vehicle and pipe type with component connections
    let pipeSegments = [];
    let startComponent, endComponent;
    
    // Enhanced visualization parameters based on optimizations and vehicle type
    let visualParams = {
        segmentSpacing: optimizations.maximizeClearance ? 
            (vehicleType === 'suv' ? 0.4 : 0.3) : 
            (vehicleType === 'sports' ? 0.15 : 0.2),
        
        bendRadius: optimizations.minimizeBends ? 
            (pipeType === 'cooling' ? 0.5 : 0.4) : 
            (pipeType === 'brake' ? 0.2 : 0.3),
        
        verticalOffset: optimizations.avoidHeat ? 
            (pipeType === 'fuel' ? 0.35 : 0.25) : 
            (vehicleType === 'sports' ? 0.1 : 0.15),
        
        baseRadius: getBasePipeRadius(vehicleType, pipeType),
        pathComplexity: optimizations.minimizeLength ? 'simple' : 'complex',
        
        // New parameters for more distinct routing
        routeStyle: optimizations.minimizeLength ? 'direct' : 'curved',
        heightVariation: optimizations.minimizeLength ? 0.1 : 0.4,
        spreadFactor: optimizations.minimizeLength ? 1.0 : 1.5,
        bendIntensity: optimizations.minimizeBends ? 0.3 : 0.8
    };

    // Function to generate coordinates based on visualization parameters
    function generateSegmentCoordinates(startPoint, endPoint, params) {
        const midPoint = {
            x: (startPoint.x + endPoint.x) / 2,
            y: (startPoint.y + endPoint.y) / 2,
            z: (startPoint.z + endPoint.z) / 2
        };

        if (params.routeStyle === 'direct') {
            // Direct routing with minimal points
            return [startPoint, endPoint];
        } else {
            // Curved routing with additional points
            const heightOffset = params.heightVariation * (Math.random() - 0.5);
            const spreadOffset = params.spreadFactor * (Math.random() - 0.5);
            
            return [
                startPoint,
                {
                    x: midPoint.x + spreadOffset,
                    y: midPoint.y + heightOffset,
                    z: midPoint.z + (params.bendIntensity * (Math.random() - 0.5))
                },
                endPoint
            ];
        }
    }

    // Enhanced visualization parameters application
    const applyVisualParams = (segment) => {
        // Generate coordinates based on optimization parameters
        const points = generateSegmentCoordinates(
            segment.start,
            segment.end,
            visualParams
        );

        // Apply the generated coordinates
        if (points.length > 2) {
            // For complex paths, create intermediate points
            const midPoint = points[1];
            segment.midPoint = midPoint;
            
            // Adjust start and end points
            segment.start = points[0];
            segment.end = points[2];
        } else {
            // For direct paths, just use start and end
            segment.start = points[0];
            segment.end = points[1];
        }

        // Base adjustments with enhanced clearance
        if (optimizations.maximizeClearance) {
            const clearanceMult = vehicleType === 'suv' ? 1.8 : 
                                vehicleType === 'sports' ? 0.7 : 1.4;
            segment.start.y += visualParams.segmentSpacing * clearanceMult;
            segment.end.y += visualParams.segmentSpacing * clearanceMult;
            if (segment.midPoint) {
                segment.midPoint.y += visualParams.segmentSpacing * clearanceMult * 1.2;
            }
        }

        // Enhanced heat avoidance adjustments
        if (optimizations.avoidHeat) {
            if (segment.component === 'Engine') {
                const heatMult = pipeType === 'fuel' ? 2.0 : 
                                pipeType === 'cooling' ? 1.5 : 1.2;
                segment.start.y += visualParams.verticalOffset * heatMult;
                segment.end.y += visualParams.verticalOffset * heatMult;
                if (segment.midPoint) {
                    segment.midPoint.y += visualParams.verticalOffset * heatMult * 1.3;
                }
                
                // Enhanced horizontal offset for better heat avoidance
                const xOffset = optimizations.minimizeLength ? 0.3 : 0.5;
                segment.start.x += xOffset;
                segment.end.x += xOffset;
                if (segment.midPoint) {
                    segment.midPoint.x += xOffset * 1.2;
                }
            }
        }

        // Enhanced vehicle-specific adjustments
        switch(vehicleType) {
            case 'sports':
                // More aggressive profile for sports cars
                const sportsMult = optimizations.minimizeLength ? 0.75 : 0.9;
                segment.start.y *= sportsMult;
                segment.end.y *= sportsMult;
                if (segment.midPoint) {
                    segment.midPoint.y *= sportsMult * 1.1;
                }
                break;
            case 'suv':
                // Higher mounting points for SUVs with more clearance
                const suvMult = optimizations.minimizeLength ? 1.3 : 1.5;
                segment.start.y *= suvMult;
                segment.end.y *= suvMult;
                if (segment.midPoint) {
                    segment.midPoint.y *= suvMult * 1.1;
                }
                break;
        }

        // Enhanced pipe type specific adjustments
        switch(pipeType) {
            case 'cooling':
                // More pronounced flow characteristics
                if (!optimizations.minimizeBends) {
                    const coolMult = optimizations.minimizeLength ? 1.2 : 1.4;
                    segment.start.z *= coolMult;
                    segment.end.z *= coolMult;
                    if (segment.midPoint) {
                        segment.midPoint.z *= coolMult * 1.2;
                    }
                }
                break;
            case 'brake':
                // More direct routing for brake lines
                if (optimizations.minimizeLength) {
                    const brakeMult = 0.8;
                    segment.start.z *= brakeMult;
                    segment.end.z *= brakeMult;
                    if (segment.midPoint) {
                        segment.midPoint.z *= brakeMult;
                    }
                }
                break;
        }

        return segment;
    };

    // Helper function to determine base pipe radius
    function getBasePipeRadius(vehicleType, pipeType) {
        let baseRadius = 0.08; // Default radius
        
        // Vehicle type adjustments
        switch(vehicleType) {
            case 'suv':
                baseRadius *= 1.2;
                break;
            case 'sports':
                baseRadius *= 0.9;
                break;
            case 'truck':
                baseRadius *= 1.3;
                break;
        }
        
        // Pipe type adjustments
        switch(pipeType) {
            case 'cooling':
                baseRadius *= 1.25;
                break;
            case 'brake':
                baseRadius *= 0.75;
                break;
            case 'fuel':
                // No adjustment needed
                break;
        }
        
        return baseRadius;
    }
    
    // Initialize effective pipe type
    let effectivePipeType = pipeType;
    
    // Determine start and end components based on pipe type
    switch(effectivePipeType) {
        case 'fuel':
            startComponent = 'Fuel Tank';
            endComponent = 'Engine';
            break;
        case 'cooling':
            startComponent = 'Engine';
            endComponent = 'Radiator';
            break;
        case 'brake':
            startComponent = 'Master Cylinder';
            endComponent = 'Brake Caliper';
            break;
        default:
            startComponent = 'Source';
            endComponent = 'Destination';
    }
    
    // Pipe type has already been determined, no need for component-based overrides
    
    if (effectivePipeType === 'fuel') {
        // Determine path based on optimizations
        if (optimizations.minimizeLength) {
            // Direct path with fewer segments but higher stress
            pipeSegments = [
                {
                    id: 'pipe1',
                    name: 'Fuel Tank Outlet',
                    start: { x: -2, y: 0.5, z: 0.8 },
                    end: { x: -1.2, y: 0.6, z: 0.8 },
                    radius: 0.08,
                    color: 0x10b981, // Green
                    material: 'rubber',
                    stress: 0.4, // Medium stress due to longer segment
                    component: 'Fuel Tank'
                },
                {
                    id: 'pipe2',
                    name: 'Fuel Filter Line',
                    start: { x: -1.2, y: 0.6, z: 0.8 },
                    end: { x: -0.5, y: 0.6, z: 0.8 },
                    radius: 0.08,
                    color: 0xf59e0b, // Yellow
                    material: 'rubber',
                    stress: 0.6, // Higher stress due to angle
                    component: 'Fuel Filter'
                },
                {
                    id: 'pipe3',
                    name: 'Pre-Engine Line',
                    start: { x: -0.5, y: 0.6, z: 0.8 },
                    end: { x: 0.5, y: 0.8, z: 0.4 },
                    radius: 0.08,
                    color: 0xf59e0b, // Yellow
                    material: 'rubber',
                    stress: 0.7,
                    component: 'Fuel Line'
                },
                {
                    id: 'pipe4',
                    name: 'Engine Fuel Inlet',
                    start: { x: 0.5, y: 0.8, z: 0.4 },
                    end: { x: 1.5, y: 1.0, z: 0 },
                    radius: 0.08,
                    color: 0xef4444, // Red
                    material: 'rubber',
                    stress: 0.8, // High stress near engine
                    component: 'Engine'
                }
            ];
        } else {
            // Longer path with more segments but lower stress
            pipeSegments = [
                {
                    id: 'pipe1',
                    name: 'Fuel Tank Outlet',
                    start: { x: -2, y: 0.5, z: 0.8 },
                    end: { x: -1.5, y: 0.6, z: 0.8 },
                    radius: 0.08,
                    color: 0x10b981, // Green
                    material: 'rubber',
                    stress: 0.2, // Low stress
                    component: 'Fuel Tank'
                },
                {
                    id: 'pipe2',
                    name: 'Pre-Filter Line',
                    start: { x: -1.5, y: 0.6, z: 0.8 },
                    end: { x: -1.0, y: 0.7, z: 0.8 },
                    radius: 0.08,
                    color: 0x10b981, // Green
                    material: 'rubber',
                    stress: 0.3,
                    component: 'Fuel Line'
                },
                {
                    id: 'pipe3',
                    name: 'Fuel Filter Line',
                    start: { x: -1.0, y: 0.7, z: 0.8 },
                    end: { x: 0, y: 0.8, z: 0.8 },
                    radius: 0.08,
                    color: 0x10b981, // Green
                    material: 'rubber',
                    stress: 0.3,
                    component: 'Fuel Filter'
                },
                {
                    id: 'pipe4',
                    name: 'Post-Filter Line',
                    start: { x: 0, y: 0.8, z: 0.8 },
                    end: { x: 0.8, y: 0.9, z: 0.6 },
                    radius: 0.08,
                    color: 0xf59e0b, // Yellow
                    material: 'rubber',
                    stress: 0.4,
                    component: 'Fuel Line'
                },
                {
                    id: 'pipe5',
                    name: 'Engine Approach',
                    start: { x: 0.8, y: 0.9, z: 0.6 },
                    end: { x: 1.2, y: 1.0, z: 0.3 },
                    radius: 0.08,
                    color: 0xf59e0b, // Yellow
                    material: 'rubber',
                    stress: 0.5,
                    component: 'Fuel Line'
                },
                {
                    id: 'pipe6',
                    name: 'Engine Fuel Inlet',
                    start: { x: 1.2, y: 1.0, z: 0.3 },
                    end: { x: 1.5, y: 1.0, z: 0 },
                    radius: 0.08,
                    color: 0xef4444, // Red
                    material: 'rubber',
                    stress: 0.6,
                    component: 'Engine'
                }
            ];
        }

        // If avoiding heat sources, adjust the path to stay away from hot areas
        if (optimizations.avoidHeat) {
            pipeSegments.forEach(segment => {
                if (segment.component === 'Engine') {
                    // Move segments near the engine lower and further out
                    segment.end.y -= 0.3;
                    segment.end.z -= 0.2;
                    segment.stress *= 0.7; // Reduce stress due to better heat management
                }
            });
        }

        // If maximizing clearance, adjust vertical positions
        if (optimizations.maximizeClearance) {
            pipeSegments.forEach(segment => {
                // Raise the middle segments for better clearance
                if (segment.component === 'Fuel Line' || segment.component === 'Fuel Filter') {
                    segment.start.y += 0.2;
                    segment.end.y += 0.2;
                }
            });
        }
    } else if (effectivePipeType === 'cooling') {
        // Cooling system pipe segments with proper component connections
        // Engine -> Upper Hose -> Radiator -> Lower Hose -> Water Pump -> Engine
        pipeSegments = [
            {
                id: 'pipe1',
                name: 'Engine Outlet',
                start: { x: 1.2, y: 0.9, z: 0.3 },
                end: { x: 0.5, y: 1.1, z: 0.3 },
                radius: 0.12,
                color: 0xef4444, // Red (hot coolant)
                material: 'rubber',
                stress: 0.7, // High stress
                component: 'Engine'
            },
            {
                id: 'pipe2',
                name: 'Upper Radiator Hose',
                start: { x: 0.5, y: 1.1, z: 0.3 },
                end: { x: -1.5, y: 1.1, z: 0.3 },
                radius: 0.12,
                color: 0xf59e0b, // Yellow (warm coolant)
                material: 'rubber',
                stress: 0.5, // Medium stress
                component: 'Upper Hose'
            },
            {
                id: 'pipe3',
                name: 'Radiator Top Connection',
                start: { x: -1.5, y: 1.1, z: 0.3 },
                end: { x: -1.5, y: 0.5, z: 0.3 },
                radius: 0.10,
                color: 0xf59e0b, // Yellow
                material: 'aluminum',
                stress: 0.4, // Medium-low stress
                component: 'Radiator'
            },
            {
                id: 'pipe4',
                name: 'Radiator Bottom Connection',
                start: { x: -1.5, y: 0.5, z: 0.3 },
                end: { x: -1.5, y: 0.5, z: -0.3 },
                radius: 0.10,
                color: 0x3b82f6, // Blue (cooled coolant)
                material: 'aluminum',
                stress: 0.3, // Low stress
                component: 'Radiator'
            },
            {
                id: 'pipe5',
                name: 'Lower Radiator Hose',
                start: { x: -1.5, y: 0.5, z: -0.3 },
                end: { x: -0.5, y: 0.5, z: -0.3 },
                radius: 0.12,
                color: 0x3b82f6, // Blue
                material: 'rubber',
                stress: 0.4, // Medium-low stress
                component: 'Lower Hose'
            },
            {
                id: 'pipe6',
                name: 'Water Pump Inlet',
                start: { x: -0.5, y: 0.5, z: -0.3 },
                end: { x: 0.5, y: 0.5, z: -0.3 },
                radius: 0.10,
                color: 0x3b82f6, // Blue
                material: 'aluminum',
                stress: 0.6, // Medium stress
                component: 'Water Pump'
            },
            {
                id: 'pipe7',
                name: 'Engine Coolant Return',
                start: { x: 0.5, y: 0.5, z: -0.3 },
                end: { x: 1.2, y: 0.5, z: 0.3 },
                radius: 0.10,
                color: 0x3b82f6, // Blue
                material: 'aluminum',
                stress: 0.5, // Medium stress
                component: 'Engine'
            }
        ];
    } else if (effectivePipeType === 'brake') {
        // Brake system pipe segments
        pipeSegments = [
            {
                id: 'pipe1',
                name: 'Master Cylinder Output',
                start: { x: 0.8, y: 0.8, z: 0 },
                end: { x: 0.5, y: 0.8, z: 0 },
                radius: 0.06,
                color: 0xef4444, // Red
                material: 'steel',
                stress: 0.7, // High stress
                component: 'Master Cylinder'
            },
            {
                id: 'pipe2',
                name: 'Front Brake Line Split',
                start: { x: 0.5, y: 0.8, z: 0 },
                end: { x: 0, y: 0.8, z: 0 },
                radius: 0.06,
                color: 0xef4444, // Red
                material: 'steel',
                stress: 0.6, // Medium-high stress
                component: 'Brake Line'
            },
            {
                id: 'pipe3',
                name: 'Front Left Brake Line',
                start: { x: 0, y: 0.8, z: 0 },
                end: { x: -1.2, y: 0.4, z: -1 },
                radius: 0.05,
                color: 0xef4444, // Red
                material: 'steel',
                stress: 0.5, // Medium stress
                component: 'Front Left Caliper'
            },
            {
                id: 'pipe4',
                name: 'Front Right Brake Line',
                start: { x: 0, y: 0.8, z: 0 },
                end: { x: -1.2, y: 0.4, z: 1 },
                radius: 0.05,
                color: 0xef4444, // Red
                material: 'steel',
                stress: 0.5, // Medium stress
                component: 'Front Right Caliper'
            },
            {
                id: 'pipe5',
                name: 'Rear Brake Line',
                start: { x: 0.5, y: 0.8, z: 0 },
                end: { x: -1, y: 0.6, z: 0 },
                radius: 0.06,
                color: 0xef4444, // Red
                material: 'steel',
                stress: 0.4, // Medium-low stress
                component: 'Brake Line'
            },
            {
                id: 'pipe6',
                name: 'Rear Left Brake Line',
                start: { x: -1, y: 0.6, z: 0 },
                end: { x: -1.2, y: 0.4, z: -1 },
                radius: 0.05,
                color: 0xef4444, // Red
                material: 'steel',
                stress: 0.3, // Low stress
                component: 'Rear Left Caliper'
            },
            {
                id: 'pipe7',
                name: 'Rear Right Brake Line',
                start: { x: -1, y: 0.6, z: 0 },
                end: { x: -1.2, y: 0.4, z: 1 },
                radius: 0.05,
                color: 0xef4444, // Red
                material: 'steel',
                stress: 0.3, // Low stress
                component: 'Rear Right Caliper'
            }
        ];
    } else {
        // Default pipe segments for other types
        pipeSegments = [
            {
                id: 'pipe1',
                name: 'Main Line Start',
                start: { x: -2, y: 0.5, z: 0 },
                end: { x: -1, y: 0.8, z: 0 },
                radius: 0.08,
                color: 0x10b981, // Green
                material: 'rubber',
                stress: 0.2, // Low stress
                component: 'Source'
            },
            {
                id: 'pipe2',
                name: 'Main Line Middle',
                start: { x: -1, y: 0.8, z: 0 },
                end: { x: 1, y: 0.8, z: 0 },
                radius: 0.08,
                color: 0x10b981, // Green
                material: 'rubber',
                stress: 0.3, // Low stress
                component: 'Main Line'
            },
            {
                id: 'pipe3',
                name: 'Main Line End',
                start: { x: 1, y: 0.8, z: 0 },
                end: { x: 2, y: 0.5, z: 0 },
                radius: 0.08,
                color: 0x10b981, // Green
                material: 'rubber',
                stress: 0.4, // Medium-low stress
                component: 'Destination'
            }
        ];
    }
    
    // Analyze prompt for specific component mentions and adjust pipe segments
    if (prompt.includes('thicker') || prompt.includes('larger diameter') || prompt.includes('wider')) {
        // Increase all pipe diameters
        pipeSegments.forEach(pipe => {
            pipe.radius *= 1.5;
        });
    }
    
    if (prompt.includes('thinner') || prompt.includes('smaller diameter') || prompt.includes('narrower')) {
        // Decrease all pipe diameters
        pipeSegments.forEach(pipe => {
            pipe.radius *= 0.7;
        });
    }
    
    // Generate AI recommendations based on configuration
    let recommendations = [];
    
    if (pipeType === 'fuel' && !optimizations.avoidHeat) {
        recommendations.push('Consider using reinforced rubber for the section near the exhaust manifold.');
    }
    
    if (optimizations.minimizeBends) {
        recommendations.push('Adding a support bracket at bend #4 would improve stability.');
    }
    
    if (vehicleType === 'suv' && pipeType === 'fuel') {
        recommendations.push('For SUVs, consider increasing pipe diameter by 10% for better fuel flow.');
    }
    
    if (vehicleType === 'sports' && !currentRoutingConfig.optimizations.minimizeLength) {
        recommendations.push('For sports cars, shorter routing paths are recommended to reduce weight.');
    }
    
    return {
        stats: {
            length: length.toFixed(1),
            bends: Math.round(bends),
            clearance: clearance.toFixed(1),
            score: score
        },
        pipeSegments: pipeSegments,
        recommendations: recommendations
    };
}

/**
 * Display the generated routing in the 3D visualization
 * @param {Object} routingData - The routing data to display
 */
function displayGeneratedRouting(routingData) {
    // Convert pipe segments to Three.js format
    const threeJSPipeSegments = routingData.pipeSegments.map(segment => {
        return {
            id: segment.id,
            name: segment.name,
            start: new THREE.Vector3(segment.start.x, segment.start.y, segment.start.z),
            end: new THREE.Vector3(segment.end.x, segment.end.y, segment.end.z),
            radius: segment.radius,
            color: segment.color,
            material: segment.material,
            stress: segment.stress
        };
    });
    
    // Clear existing pipes
    window.threeJSHelpers.clearPipes();
    
    // Create each pipe segment directly using the helper function
    threeJSPipeSegments.forEach(segment => {
        window.threeJSHelpers.createPipeSegment(segment);
    });
    
    // Clear existing heatmap
    window.threeJSHelpers.clearHeatmap();
    
    // Create heatmap overlay with the pipe segments data
    window.threeJSHelpers.createHeatmapOverlay(threeJSPipeSegments);
}

/**
 * Update the routing stats display
 * @param {Object} routingData - The routing data
 */
function updateRoutingStats(routingData) {
    // Update stats display
    const statLength = document.getElementById('stat-length');
    const statBends = document.getElementById('stat-bends');
    const statClearance = document.getElementById('stat-clearance');
    const statScore = document.getElementById('stat-score');
    
    if (statLength) {
        statLength.textContent = `${routingData.stats.length} meters`;
    }
    
    if (statBends) {
        statBends.textContent = routingData.stats.bends;
    }
    
    if (statClearance) {
        statClearance.textContent = `${routingData.stats.clearance} cm`;
    }
    
    if (statScore) {
        statScore.textContent = `${routingData.stats.score}/100`;
    }
    
    // Update progress bars
    const progressBars = document.querySelectorAll('.progress-bar-fill');
    if (progressBars.length >= 4) {
        // Length (lower is better, so invert the percentage)
        const lengthPercentage = 100 - (parseFloat(routingData.stats.length) / 5 * 100);
        progressBars[0].style.width = `${Math.min(100, Math.max(0, lengthPercentage))}%`;
        
        // Bends (lower is better, so invert the percentage)
        const bendsPercentage = 100 - (routingData.stats.bends / 15 * 100);
        progressBars[1].style.width = `${Math.min(100, Math.max(0, bendsPercentage))}%`;
        
        // Clearance (higher is better)
        const clearancePercentage = parseFloat(routingData.stats.clearance) / 10 * 100;
        progressBars[2].style.width = `${Math.min(100, Math.max(0, clearancePercentage))}%`;
        
        // Score
        progressBars[3].style.width = `${routingData.stats.score}%`;
    }
    
    // Update recommendations using Gemini API
    const recommendationsContainer = document.getElementById('ai-recommendations');
    if (recommendationsContainer && generatedRoutings.option1 && generatedRoutings.option2) {
        const recommendations = window.geminiAPI.generateRouteRecommendations(
            generatedRoutings.option1,
            generatedRoutings.option2
        );
        
        recommendationsContainer.innerHTML = '';
        
        // Show recommendations for current route
        const currentRouteRecs = generatedRoutings.currentOption === 'option1' ? 
            recommendations.route1 : recommendations.route2;
            
        currentRouteRecs.forEach(recommendation => {
            const li = document.createElement('li');
            li.className = 'flex items-start';
            li.innerHTML = `
                <i class="fas fa-info-circle text-blue-400 mt-1 mr-2"></i>
                <span>${recommendation}</span>
            `;
            recommendationsContainer.appendChild(li);
        });
        
        // Add comparative analysis
        recommendations.comparison.forEach(comparison => {
            const li = document.createElement('li');
            li.className = 'flex items-start mt-2';
            li.innerHTML = `
                <i class="fas fa-chart-line text-purple-400 mt-1 mr-2"></i>
                <span>${comparison}</span>
            `;
            recommendationsContainer.appendChild(li);
        });
    }
}

/**
 * Reset the routing to default state
 */
function resetRouting() {
    // Reset form fields
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) {
        promptInput.value = '';
    }
    
    const vehicleTypeSelect = document.getElementById('vehicle-type');
    if (vehicleTypeSelect) {
        vehicleTypeSelect.value = 'sedan';
    }
    
    const pipeTypeSelect = document.getElementById('pipe-type');
    if (pipeTypeSelect) {
        pipeTypeSelect.value = 'fuel';
    }
    
    // Reset optimization checkboxes
    document.getElementById('opt-length').checked = true;
    document.getElementById('opt-bends').checked = true;
    document.getElementById('opt-clearance').checked = true;
    document.getElementById('opt-heat').checked = false;
    
    // Reset configuration
    currentRoutingConfig = {
        prompt: '',
        vehicleType: 'sedan',
        pipeType: 'fuel',
        optimizations: {
            minimizeLength: true,
            minimizeBends: true,
            maximizeClearance: true,
            avoidHeat: false
        }
    };
    
    // Clear generated routings
    generatedRoutings = {
        option1: null,
        option2: null,
        currentOption: 'option1'
    };
    
    // Clear 3D visualization
    window.threeJSHelpers.clearPipes();
    window.threeJSHelpers.clearHeatmap();
    
    // Hide routing stats
    const routingStats = document.getElementById('routing-stats');
    if (routingStats) {
        routingStats.style.display = 'none';
    }
    
    // Clear localStorage
    localStorage.removeItem('currentRouting');
    
    // Show notification
    showNotification('Routing reset to default state', 'info');
}

/**
 * Save the current routing configuration
 */
function saveRouting() {
    // Save to localStorage
    const saved = saveRoutingToLocalStorage();
    
    if (saved) {
        showNotification('Routing saved successfully', 'success');
    } else {
        showNotification('Failed to save routing', 'error');
    }
}

/**
 * Save the current routing to localStorage
 * @returns {boolean} Whether the save was successful
 */
function saveRoutingToLocalStorage() {
    if (!generatedRoutings.option1 && !generatedRoutings.option2) {
        showNotification('No routing data to save', 'warning');
        return false;
    }
    
    const routingData = {
        config: currentRoutingConfig,
        routingData: generatedRoutings,
        currentOption: generatedRoutings.currentOption,
        timestamp: new Date().toISOString()
    };
    
    return saveToLocalStorage('currentRouting', routingData);
}

/**
 * Update the edit fields based on the selected pipe
 * @param {Object} pipeData - Data for the selected pipe
 */
function updateEditFields(pipeData) {
    const editDiameter = document.getElementById('edit-diameter');
    const editMaterial = document.getElementById('edit-material');
    
    if (editDiameter && pipeData.pipeData.radius) {
        editDiameter.value = (pipeData.pipeData.radius * 10).toFixed(1); // Convert to cm
    }
    
    if (editMaterial && pipeData.pipeData.material) {
        editMaterial.value = pipeData.pipeData.material;
    }
}

/**
 * Apply edits to the selected pipe
 */
function applyPipeEdit() {
    const editSegmentSelect = document.getElementById('edit-segment');
    const editDiameter = document.getElementById('edit-diameter');
    const editMaterial = document.getElementById('edit-material');
    
    if (!editSegmentSelect || !editDiameter || !editMaterial) {
        return;
    }
    
    const pipeId = 'pipe' + editSegmentSelect.value;
    const diameter = parseFloat(editDiameter.value);
    const material = editMaterial.value;
    
    if (isNaN(diameter) || diameter <= 0) {
        showNotification('Please enter a valid diameter', 'error');
        return;
    }
    
    // Calculate stress changes based on diameter and material
    let stressModifier = 0;
    let diameterImpact = 0;
    
    // Get current routing and original diameter
    const currentRouting = generatedRoutings[generatedRoutings.currentOption];
    if (!currentRouting || !currentRouting.pipeSegments) {
        showNotification('No routing data found', 'error');
        return;
    }
    const originalDiameter = currentRouting.pipeSegments.find(pipe => pipe.id === pipeId)?.radius * 10 || 0.8;
    if (diameter < originalDiameter) {
        // Smaller diameter increases stress
        diameterImpact = 0.2 * (1 - (diameter / originalDiameter));
    } else if (diameter > originalDiameter) {
        // Larger diameter decreases stress
        diameterImpact = -0.15 * ((diameter / originalDiameter) - 1);
    }
    
    // Material impact on stress
    switch (material) {
        case 'rubber':
            stressModifier = 0;
            break;
        case 'steel':
            stressModifier = -0.2; // Reduce stress
            break;
        case 'aluminum':
            stressModifier = -0.1; // Slightly reduce stress
            break;
        case 'copper':
            stressModifier = -0.15; // Moderately reduce stress
            break;
    }
    
            // Update the pipe in the 3D visualization with material properties
            window.threeJSHelpers.updatePipeSegment(pipeId, {
                radius: diameter / 10, // Convert from cm to internal units
                material: material,
                materialProperties: {
                    shininess: material === 'rubber' ? 10 : 
                              material === 'steel' ? 90 : 
                              material === 'aluminum' ? 70 : 50,
                    specular: material === 'rubber' ? 0x111111 : 
                             material === 'steel' ? 0xffffff : 
                             material === 'aluminum' ? 0xdddddd : 0x999999,
                    emissive: material === 'rubber' ? 0x000000 : 
                             material === 'steel' ? 0x000000 : 
                             material === 'aluminum' ? 0x000000 : 0x000000,
                    color: material === 'rubber' ? 0x333333 :
                           material === 'steel' ? 0x888888 :
                           material === 'aluminum' ? 0x999999 : 0x666666
                }
            });
    
    // Update the pipe in the current routing data
    if (currentRouting.pipeSegments) {
        const pipeIndex = currentRouting.pipeSegments.findIndex(pipe => pipe.id === pipeId);
        
        if (pipeIndex !== -1) {
            // Store original values for notification
            const originalRadius = currentRouting.pipeSegments[pipeIndex].radius;
            const originalMaterial = currentRouting.pipeSegments[pipeIndex].material;
            const originalStress = currentRouting.pipeSegments[pipeIndex].stress;
            const pipeName = currentRouting.pipeSegments[pipeIndex].name;
            const pipeComponent = currentRouting.pipeSegments[pipeIndex].component || '';
            
            // Update pipe properties
            currentRouting.pipeSegments[pipeIndex].radius = diameter / 10;
            currentRouting.pipeSegments[pipeIndex].material = material;
            
            // Apply combined stress modifier, ensuring it stays in range [0, 1]
            const totalStressModifier = stressModifier + diameterImpact;
            const newStress = Math.max(0, Math.min(1, originalStress + totalStressModifier));
            currentRouting.pipeSegments[pipeIndex].stress = newStress;
            
            // Update pipe color based on new stress level
            let newColor;
            if (newStress < 0.4) {
                newColor = 0x10b981; // Green for low stress
            } else if (newStress < 0.7) {
                newColor = 0xf59e0b; // Yellow for medium stress
            } else {
                newColor = 0xef4444; // Red for high stress
            }
            
            // Update color in 3D visualization
            window.threeJSHelpers.updatePipeSegment(pipeId, {
                color: newColor
            });
            
            // Update color in data
            currentRouting.pipeSegments[pipeIndex].color = newColor;
            
            // Regenerate the heatmap overlay
            window.threeJSHelpers.clearHeatmap();
            
            // Convert pipe segments to Three.js format
            const threeJSPipeSegments = currentRouting.pipeSegments.map(segment => {
                return {
                    id: segment.id,
                    name: segment.name,
                    start: new THREE.Vector3(segment.start.x, segment.start.y, segment.start.z),
                    end: new THREE.Vector3(segment.end.x, segment.end.y, segment.end.z),
                    radius: segment.radius,
                    color: segment.color,
                    material: segment.material,
                    stress: segment.stress
                };
            });
            
            // Create heatmap overlay with the updated pipe segments data
            window.threeJSHelpers.createHeatmapOverlay(threeJSPipeSegments);
            
            // Update overall stats based on changes
            updateOverallStatsAfterEdit(pipeIndex, originalRadius, originalMaterial, originalStress);
            
            // Update AI recommendations based on the changes
            updateAIRecommendationsAfterEdit(pipeIndex, diameter / 10, material, newStress, pipeName, pipeComponent);
            
            // Save changes
            saveRoutingToLocalStorage();
            
            // Update stats display
            updateRoutingStats(currentRouting);
            
            // Show detailed notification
            const stressChange = newStress - originalStress;
            let stressMessage = '';
            
            if (Math.abs(stressChange) > 0.05) {
                stressMessage = stressChange > 0 
                    ? ` Stress increased by ${(stressChange * 100).toFixed(0)}%.` 
                    : ` Stress reduced by ${(Math.abs(stressChange) * 100).toFixed(0)}%.`;
            }
            
            showNotification(`Pipe "${pipeName}" updated.${stressMessage}`, 'success');
        }
    }
}

/**
 * Update overall stats after editing a pipe
 * @param {number} pipeIndex - Index of the edited pipe
 * @param {number} originalRadius - Original radius of the pipe
 * @param {string} originalMaterial - Original material of the pipe
 * @param {number} originalStress - Original stress level of the pipe
 */
function updateOverallStatsAfterEdit(pipeIndex, originalRadius, originalMaterial, originalStress) {
    const currentRouting = generatedRoutings[generatedRoutings.currentOption];
    if (!currentRouting || !currentRouting.stats) return;
    
    const pipe = currentRouting.pipeSegments[pipeIndex];
    const newRadius = pipe.radius;
    const newMaterial = pipe.material;
    const newStress = pipe.stress;
    
    // Calculate impact on overall score
    let scoreChange = 0;
    
    // Stress impact on score
    const stressChange = newStress - originalStress;
    if (stressChange < 0) {
        // Reduced stress improves score
        scoreChange += Math.abs(stressChange) * 15; // Reduced from 20 to 15 for better balance
    } else if (stressChange > 0) {
        // Increased stress reduces score more significantly
        scoreChange -= stressChange * 20; // Increased from 15 to 20 for more impact
    }
    
        // Material impact on score
        if (newMaterial !== originalMaterial) {
            const pipeType = currentRoutingConfig.pipeType;
            const pipeName = pipe.name.toLowerCase();
            const component = pipe.component?.toLowerCase() || '';
            
            // Determine section characteristics
            const isHotSection = component.includes('engine') || pipeName.includes('hot') || 
                               component.includes('exhaust') || pipeName.includes('exhaust');
            const isFlexibleSection = pipeName.includes('flexible') || pipeName.includes('hose') ||
                                     (pipeType === 'cooling' && (pipeName.includes('upper') || pipeName.includes('lower')));
            const isHighPressure = pipeType === 'brake' || 
                                  (pipeType === 'fuel' && component.includes('engine')) ||
                                  pipeName.includes('pressure');
            
            // Material scoring system with balanced penalties/bonuses based on characteristics
            const materialScores = {
                rubber: {
                    hot: -30,      // Severe penalty for hot sections
                    flexible: 25,   // High bonus for flexible sections
                    pressure: -25,  // Severe penalty for high pressure
                    default: -5     // Small base penalty
                },
                steel: {
                    hot: 20,       // Good bonus for hot sections
                    flexible: -20,  // Severe penalty for flexible sections
                    pressure: 30,   // High bonus for high pressure
                    default: 10     // Small base bonus
                },
                aluminum: {
                    hot: 15,       // Moderate bonus for hot sections
                    flexible: -10,  // Moderate penalty for flexible sections
                    pressure: 20,   // Good bonus for high pressure
                    default: 5      // Small base bonus
                },
                copper: {
                    hot: 10,       // Small bonus for hot sections
                    flexible: -15,  // Significant penalty for flexible sections
                    pressure: 15,   // Moderate bonus for pressure
                    default: 0      // Neutral base impact
                }
            };

            // Calculate material impact with characteristic-based scoring
            let materialImpact = 0;
            let impactFactors = [];
            
            // Gather all applicable impact factors
            if (isHotSection) {
                impactFactors.push({
                    score: materialScores[newMaterial].hot - materialScores[originalMaterial].hot,
                    weight: 2.0  // Critical importance
                });
            }
            if (isFlexibleSection) {
                impactFactors.push({
                    score: materialScores[newMaterial].flexible - materialScores[originalMaterial].flexible,
                    weight: 1.5  // High importance
                });
            }
            if (isHighPressure) {
                impactFactors.push({
                    score: materialScores[newMaterial].pressure - materialScores[originalMaterial].pressure,
                    weight: 1.8  // Very high importance
                });
            }
            
            // Calculate weighted average of all factors
            if (impactFactors.length > 0) {
                let totalWeight = impactFactors.reduce((sum, factor) => sum + factor.weight, 0);
                let totalScore = impactFactors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
                materialImpact = totalScore / totalWeight;
            } else {
                // If no specific characteristics apply, use default score difference
                materialImpact = materialScores[newMaterial].default - materialScores[originalMaterial].default;
            }

            // Apply additional context-specific modifiers
            if (isHotSection && newMaterial === 'rubber') {
                materialImpact -= 15; // Extra penalty for rubber in hot sections
            } else if (isHotSection && originalMaterial === 'rubber') {
                materialImpact += 15; // Extra bonus for moving away from rubber in hot sections
            }

            if (isHighPressure && newMaterial === 'steel') {
                materialImpact += 10; // Extra bonus for steel in high pressure
            } else if (isHighPressure && originalMaterial === 'steel') {
                materialImpact -= 10; // Extra penalty for moving away from steel in high pressure
            }

            if (isFlexibleSection && newMaterial === 'rubber') {
                materialImpact += 10; // Extra bonus for rubber in flexible sections
            } else if (isFlexibleSection && originalMaterial === 'rubber') {
                materialImpact -= 10; // Extra penalty for moving away from rubber in flexible sections
            }

            // Type-specific adjustments with relative scoring
            switch(pipeType) {
                case 'fuel':
                    if (component.includes('engine')) {
                        if (newMaterial === 'rubber') {
                            materialImpact -= 20; // Severe penalty for rubber in engine fuel connections
                        } else if (originalMaterial === 'rubber') {
                            materialImpact += 20; // Major bonus for moving away from rubber
                        }
                        
                        if (newMaterial === 'steel') {
                            materialImpact += 15; // Major bonus for steel in engine connections
                        } else if (originalMaterial === 'steel') {
                            materialImpact -= 15; // Penalty for moving away from steel
                        }
                    }
                    break;
                    
                case 'cooling':
                    if (isFlexibleSection) {
                        if (newMaterial === 'rubber') {
                            materialImpact += 15; // Bonus for rubber in cooling hoses
                        } else if (originalMaterial === 'rubber') {
                            materialImpact -= 15; // Penalty for moving away from rubber
                        }
                        
                        if (newMaterial === 'steel') {
                            materialImpact -= 12; // Penalty for steel in flexible sections
                        } else if (originalMaterial === 'steel') {
                            materialImpact += 12; // Bonus for moving away from steel
                        }
                    }
                    break;
                    
                case 'brake':
                    if (newMaterial === 'steel') {
                        materialImpact += 15; // Major bonus for using steel
                    } else if (originalMaterial === 'steel') {
                        materialImpact -= 25; // Severe penalty for moving away from steel
                    }
                    break;
            }

            // Apply material impact to score change
            scoreChange += materialImpact;
        }
    
    // Diameter impact on score
    const diameterChange = newRadius - originalRadius;
    if (Math.abs(diameterChange) > 0.01) {
        const pipeType = currentRoutingConfig.pipeType;
        const pipeName = pipe.name.toLowerCase();
        
        if (pipeType === 'fuel') {
            if (diameterChange > 0 && pipeName.includes('main')) {
                scoreChange += 5; // Larger diameter is good for main fuel lines
            } else if (diameterChange < 0 && pipeName.includes('return')) {
                scoreChange += 3; // Smaller diameter is fine for return lines
            }
        } else if (pipeType === 'cooling') {
            if (diameterChange > 0) {
                scoreChange += 6; // Larger diameter generally improves cooling system flow
            } else if (diameterChange < 0 && newStress > 0.6) {
                scoreChange -= 8; // Smaller diameter with high stress is bad for cooling
            }
        }
    }
    
    // Apply score change, ensuring it stays within bounds
    let newScore = parseInt(currentRouting.stats.score) + Math.round(scoreChange);
    newScore = Math.max(0, Math.min(100, newScore));
    currentRouting.stats.score = newScore;
}

/**
 * Update AI recommendations based on pipe edits
 * @param {number} pipeIndex - Index of the edited pipe
 * @param {number} newRadius - New radius of the pipe
 * @param {string} newMaterial - New material of the pipe
 * @param {number} newStress - New stress level of the pipe
 * @param {string} pipeName - Name of the pipe
 * @param {string} pipeComponent - Component the pipe is connected to
 */
function updateAIRecommendationsAfterEdit(pipeIndex, newRadius, newMaterial, newStress, pipeName, pipeComponent) {
    const currentRouting = generatedRoutings[generatedRoutings.currentOption];
    if (!currentRouting || !currentRouting.recommendations) return;
    
    // Clear existing recommendations that might be related to this pipe
    currentRouting.recommendations = currentRouting.recommendations.filter(rec => {
        return !rec.includes(pipeName) && 
               !rec.includes(pipeComponent) && 
               !rec.includes(`pipe #${pipeIndex + 1}`);
    });
    
    // Add new recommendations based on the current state
    if (newStress > 0.8) {
        currentRouting.recommendations.push(`High stress detected in "${pipeName}". Consider increasing diameter or adding support brackets.`);
    }
    
    if (newStress > 0.7 && newMaterial === 'rubber') {
        currentRouting.recommendations.push(`For "${pipeName}", consider using reinforced rubber or switching to a metal material to handle the high stress.`);
    }
    
    const pipeType = currentRoutingConfig.pipeType;
    
    if (pipeType === 'fuel' && pipeComponent.includes('Engine') && newMaterial !== 'steel' && newRadius < 0.08) {
        currentRouting.recommendations.push(`For engine fuel connections like "${pipeName}", consider using steel material with at least 8mm diameter for better durability.`);
    }
    
    if (pipeType === 'cooling' && pipeComponent.includes('Radiator') && newRadius < 0.1) {
        currentRouting.recommendations.push(`Radiator connections like "${pipeName}" benefit from larger diameters (10mm+) to improve coolant flow.`);
    }
    
    if (pipeType === 'brake' && newMaterial !== 'steel') {
        currentRouting.recommendations.push(`For brake system components like "${pipeName}", steel is the recommended material for safety and durability.`);
    }
    
    // Limit to 3 recommendations maximum
    if (currentRouting.recommendations.length > 3) {
        currentRouting.recommendations = currentRouting.recommendations.slice(0, 3);
    }
}

// Make functions available globally
window.initRoutingPage = initRoutingPage;

// Handle real-time dimension changes
document.getElementById('edit-diameter').addEventListener('input', function() {
    const diameter = parseFloat(this.value);
    const segment = document.getElementById('edit-segment').value;
    updatePipeVisualization(segment, diameter);
});

// Update pipe visualization in real-time
function updatePipeVisualization(segment, diameter) {
    const pipeId = 'pipe' + segment;
    const currentRouting = generatedRoutings[generatedRoutings.currentOption];
    
    if (!currentRouting || !currentRouting.pipeSegments) return;
    
    // Update 3D visualization
    window.threeJSHelpers.updatePipeSegment(pipeId, {
        radius: diameter / 10
    });
    
    // Calculate new stats based on diameter change
    const stats = calculatePipeStats(segment, diameter);
    updateDetailedStats(stats);
}

// Calculate pipe statistics based on changes
function calculatePipeStats(segment, diameter) {
    const currentRouting = generatedRoutings[generatedRoutings.currentOption];
    const pipe = currentRouting.pipeSegments.find(p => p.id === 'pipe' + segment);
    
    if (!pipe) return null;
    
    // Calculate flow characteristics
    const flowRate = calculateFlowRate(diameter, pipe.material);
    const reynoldsNumber = calculateReynoldsNumber(flowRate, diameter);
    const pressureDrop = calculatePressureDrop(flowRate, diameter, pipe);
    
    // Calculate stress factors
    const stressFactors = calculateStressFactors(diameter, pipe);
    
    return {
        flow: {
            rate: flowRate,
            reynolds: reynoldsNumber,
            pressureDrop: pressureDrop
        },
        stress: stressFactors,
        material: getMaterialProperties(pipe.material, diameter)
    };
}

// Flow calculations
function calculateFlowRate(diameter, material) {
    // Basic flow rate calculation based on diameter and material roughness
    const area = Math.PI * Math.pow(diameter/20, 2); // Convert to meters
    const roughness = getMaterialRoughness(material);
    return (area * (1 - roughness) * 100).toFixed(2); // L/min
}

function calculateReynoldsNumber(flowRate, diameter) {
    // Simplified Reynolds number calculation
    const velocity = flowRate / (Math.PI * Math.pow(diameter/20, 2));
    return (velocity * diameter * 1000).toFixed(0);
}

function calculatePressureDrop(flowRate, diameter, pipe) {
    // Basic pressure drop calculation using Darcy-Weisbach equation
    const length = getSegmentLength(pipe);
    const roughness = getMaterialRoughness(pipe.material);
    return (length * roughness * Math.pow(flowRate, 2) / Math.pow(diameter, 5) * 1000).toFixed(2);
}

// Stress calculations
function calculateStressFactors(diameter, pipe) {
    const baseStress = pipe.stress;
    const diameterImpact = 1 - (diameter / 10); // Normalized to 1
    const materialFactor = getMaterialStrengthFactor(pipe.material);
    
    return {
        total: (baseStress * (1 + diameterImpact) * materialFactor).toFixed(2),
        bending: (baseStress * diameterImpact * 1.2).toFixed(2),
        thermal: (baseStress * getMaterialThermalFactor(pipe.material)).toFixed(2)
    };
}

// Material property helpers
function getMaterialProperties(material, diameter) {
    const properties = {
        rubber: {
            elasticity: 0.7,
            thermalExpansion: 1.5,
            pressureRating: 20 - diameter
        },
        steel: {
            elasticity: 0.2,
            thermalExpansion: 0.6,
            pressureRating: 50 - diameter * 0.8
        },
        aluminum: {
            elasticity: 0.4,
            thermalExpansion: 1.2,
            pressureRating: 35 - diameter * 0.9
        },
        copper: {
            elasticity: 0.3,
            thermalExpansion: 0.9,
            pressureRating: 40 - diameter * 0.85
        }
    };
    
    return properties[material] || properties.steel;
}

function getMaterialRoughness(material) {
    const roughness = {
        rubber: 0.000015,
        steel: 0.000005,
        aluminum: 0.000010,
        copper: 0.000008
    };
    return roughness[material] || roughness.steel;
}

function getMaterialStrengthFactor(material) {
    const factors = {
        rubber: 0.8,
        steel: 1.2,
        aluminum: 1.0,
        copper: 1.1
    };
    return factors[material] || factors.steel;
}

function getMaterialThermalFactor(material) {
    const factors = {
        rubber: 1.5,
        steel: 0.8,
        aluminum: 1.2,
        copper: 1.0
    };
    return factors[material] || factors.steel;
}

function getSegmentLength(pipe) {
    const start = pipe.start;
    const end = pipe.end;
    return Math.sqrt(
        Math.pow(end.x - start.x, 2) +
        Math.pow(end.y - start.y, 2) +
        Math.pow(end.z - start.z, 2)
    );
}

// Update detailed statistics display
function updateDetailedStats(stats) {
    if (!stats) return;
    
    // Update stress points with scrollable container
    const maxStressPoints = document.getElementById('max-stress-points');
    maxStressPoints.style.maxHeight = '70vh'; // 70% of viewport height
    maxStressPoints.style.overflowY = 'auto';
    maxStressPoints.style.padding = '1rem';
    maxStressPoints.innerHTML = `
        <div class="flex justify-between mb-2">
            <span>Total Stress:</span>
            <span class="text-blue-400">${stats.stress.total}</span>
        </div>
        <div class="flex justify-between">
            <span>Bending Stress:</span>
            <span class="text-blue-400">${stats.stress.bending}</span>
        </div>
        <div class="flex justify-between">
            <span>Thermal Stress:</span>
            <span class="text-blue-400">${stats.stress.thermal}</span>
        </div>
    `;
    
    // Update flow rates
    const flowRates = document.getElementById('flow-rates');
    flowRates.innerHTML = `
        <div class="flex justify-between">
            <span>Flow Rate:</span>
            <span class="text-blue-400">${stats.flow.rate} L/min</span>
        </div>
        <div class="flex justify-between">
            <span>Reynolds Number:</span>
            <span class="text-blue-400">${stats.flow.reynolds}</span>
        </div>
        <div class="flex justify-between">
            <span>Pressure Drop:</span>
            <span class="text-blue-400">${stats.flow.pressureDrop} kPa</span>
        </div>
    `;
    
    // Update material specs
    const materialSpecs = document.getElementById('material-specs');
    materialSpecs.innerHTML = `
        <div class="flex justify-between">
            <span>Elasticity:</span>
            <span class="text-blue-400">${stats.material.elasticity}</span>
        </div>
        <div class="flex justify-between">
            <span>Pressure Rating:</span>
            <span class="text-blue-400">${stats.material.pressureRating.toFixed(1)} MPa</span>
        </div>
    `;
    
    // Update temperature effects
    const temperatureEffects = document.getElementById('temperature-effects');
    temperatureEffects.innerHTML = `
        <div class="flex justify-between">
            <span>Thermal Expansion:</span>
            <span class="text-blue-400">${stats.material.thermalExpansion} mm/m/°C</span>
        </div>
    `;
}


document.getElementById('close-stats-modal').addEventListener('click', function() {
    document.getElementById('stats-modal').style.display = 'none';
});

// Close modal when clicking outside
document.getElementById('stats-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});

// Save modal data
document.getElementById('save-btn').addEventListener('click', function() {
    const currentRouting = generatedRoutings[generatedRoutings.currentOption];
    if (!currentRouting) {
        showNotification('No routing data to save', 'warning');
        return;
    }

    // Create a JSON object with all the data
    const dataToSave = {
        routingConfig: currentRoutingConfig,
        routingData: currentRouting,
        stats: {
            stress: calculateStressFactors(
                parseFloat(document.getElementById('edit-diameter').value),
                currentRouting.pipeSegments[0]
            ),
            flow: {
                rate: calculateFlowRate(
                    parseFloat(document.getElementById('edit-diameter').value),
                    document.getElementById('edit-material').value
                ),
                reynolds: calculateReynoldsNumber(
                    calculateFlowRate(
                        parseFloat(document.getElementById('edit-diameter').value),
                        document.getElementById('edit-material').value
                    ),
                    parseFloat(document.getElementById('edit-diameter').value)
                ),
                pressureDrop: calculatePressureDrop(
                    calculateFlowRate(
                        parseFloat(document.getElementById('edit-diameter').value),
                        document.getElementById('edit-material').value
                    ),
                    parseFloat(document.getElementById('edit-diameter').value),
                    currentRouting.pipeSegments[0]
                )
            },
            material: getMaterialProperties(
                document.getElementById('edit-material').value,
                parseFloat(document.getElementById('edit-diameter').value)
            )
        },
        timestamp: new Date().toISOString()
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(dataToSave, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipe-routing-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showNotification('Routing data saved successfully', 'success');
});

// Add file input for uploading
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// Handle file upload
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading spinner
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner mx-auto my-4';
    document.querySelector('.visualization-container').appendChild(loadingSpinner);

    const reader = new FileReader();
    reader.onload = function(e) {
        // Simulate loading for better UX
        setTimeout(() => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Restore the configuration
                currentRoutingConfig = data.routingConfig;
                
                // Restore the routing data
                generatedRoutings.option1 = data.routingData;
                generatedRoutings.currentOption = 'option1';
                
                // Restore form fields
                const promptInput = document.getElementById('prompt-input');
                if (promptInput) {
                    promptInput.value = data.routingConfig.prompt;
                }
                
                const vehicleTypeSelect = document.getElementById('vehicle-type');
                if (vehicleTypeSelect) {
                    vehicleTypeSelect.value = data.routingConfig.vehicleType;
                }
                
                const pipeTypeSelect = document.getElementById('pipe-type');
                if (pipeTypeSelect) {
                    pipeTypeSelect.value = data.routingConfig.pipeType;
                }
                
                // Restore optimization checkboxes
                for (const [key, value] of Object.entries(data.routingConfig.optimizations)) {
                    let checkboxId;
                    switch (key) {
                        case 'minimizeLength':
                            checkboxId = 'opt-length';
                            break;
                        case 'minimizeBends':
                            checkboxId = 'opt-bends';
                            break;
                        case 'maximizeClearance':
                            checkboxId = 'opt-clearance';
                            break;
                        case 'avoidHeat':
                            checkboxId = 'opt-heat';
                            break;
                    }
                    if (checkboxId) {
                        const checkbox = document.getElementById(checkboxId);
                        if (checkbox) {
                            checkbox.checked = value;
                        }
                    }
                }
                
                // Update UI
                displayGeneratedRouting(data.routingData);
                updateRoutingStats(data.routingData);
                updateDetailedStats(data.stats);
                
                // Remove loading spinner
                loadingSpinner.remove();
                
                // Scroll to visualization container
                document.querySelector('.visualization-container').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Show success message
                showNotification('Routing data loaded successfully', 'success');
                
            } catch (error) {
                loadingSpinner.remove();
                showNotification('Error loading routing data', 'error');
            }
        }, 2000); // 2 second loading animation
    };
    reader.readAsText(file);
});

// Add event listener for stats button
document.getElementById('stats-btn').addEventListener('click', function() {
    const statsModal = document.getElementById('stats-modal');
    if (statsModal) {
        statsModal.style.display = 'flex';
        statsModal.classList.add('animate-fade-in');
        
        // Calculate and display stats
        const segment = document.getElementById('edit-segment').value;
        const diameter = parseFloat(document.getElementById('edit-diameter').value);
        const stats = calculatePipeStats(segment, diameter);
        updateDetailedStats(stats);
    }
});

// Update analyze button to not show stats modal
document.getElementById('analyze-btn').addEventListener('click', () => {
    // Save current routing to localStorage before navigating
    saveRoutingToLocalStorage();
    
    // Navigate to analysis page
    window.location.href = 'analysis.html';
});

// Add upload button next to save button
const saveBtn = document.getElementById('save-btn');
const uploadBtn = document.createElement('button');
uploadBtn.className = 'btn-outline';
uploadBtn.innerHTML = '<i class="fas fa-upload mr-1"></i> Upload';
uploadBtn.onclick = () => fileInput.click();
saveBtn.parentNode.insertBefore(uploadBtn, saveBtn.nextSibling);

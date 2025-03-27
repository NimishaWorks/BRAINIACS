
// Global variables
let currentModel = null;
let simulationRunning = false;
let simulationPaused = false;
let simulationSpeed = 1.0;
let currentStep = 0;
let totalSteps = 100; // Will be set based on simulation type
let analysisResults = {};

// Function to download sample model
function downloadSample() {
    fetch('sample-pipe-model.json')
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sample-pipe-model.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error downloading sample:', error);
            alert('Error downloading sample model. Please try again.');
        });
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Three.js scene
    window.threeJSHelpers.initThreeJS('analysis-canvas-container', {
        showVehicle: false,
        showPipes: false,
        showHeatmap: false
    });

    // Add view control event listeners
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            window.threeJSHelpers.changeView(this.dataset.view);
        });
    });

    // Add display option event listeners
    document.getElementById('toggle-vehicle').addEventListener('click', function() {
        this.classList.toggle('active');
        window.threeJSHelpers.toggleVehicleVisibility(this.classList.contains('active'));
    });

    document.getElementById('toggle-heatmap').addEventListener('click', function() {
        this.classList.toggle('active');
        window.threeJSHelpers.toggleHeatmapVisibility(this.classList.contains('active'));
    });

    document.getElementById('toggle-labels').addEventListener('click', function() {
        this.classList.toggle('active');
        const pipes = scene.children.filter(child => child.userData && child.userData.id);
        pipes.forEach(pipe => {
            if (pipe.userData.label) {
                pipe.userData.label.visible = this.classList.contains('active');
            }
        });
    });

    // Initialize file upload and simulation controls
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('run-analysis').addEventListener('click', startSimulation);
    document.getElementById('pause-simulation').addEventListener('click', togglePause);
    document.getElementById('step-simulation').addEventListener('click', stepSimulation);
    document.getElementById('simulation-speed').addEventListener('change', function(e) {
        simulationSpeed = parseFloat(e.target.value);
    });
    document.getElementById('download-sample').addEventListener('click', downloadSample);
});

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('fileName').textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                currentModel = JSON.parse(e.target.result);
                // Handle both old and new JSON formats
                const pipeSegments = currentModel.pipes || 
                    (currentModel.routingData && currentModel.routingData.pipeSegments) || [];
                
                if (!Array.isArray(pipeSegments)) {
                    throw new Error('Invalid model structure. Expected array of pipes.');
                }
                
                // Convert to new format if using old format
                if (currentModel.pipes) {
                    currentModel = {
                        routingData: {
                            pipeSegments: currentModel.pipes,
                            stats: {
                                length: calculateTotalLength(currentModel.pipes),
                                bends: currentModel.pipes.length - 1,
                                score: 85 // Default score
                            },
                            recommendations: [
                                "Optimize pipe routing for shorter paths",
                                "Consider using high-grade materials for critical segments",
                                "Regular maintenance recommended for all connections"
                            ]
                        }
                    };
                }
                
                // Log the model for debugging
                console.log('Current Model:', currentModel);
                
                currentModel.routingData.pipeSegments.forEach((pipe, index) => {
                    console.log(`Validating pipe ${index}:`, pipe);
                    
                    if (!pipe.id || !pipe.name || !pipe.start || !pipe.end) {
                        throw new Error(`Invalid pipe structure at index ${index}. Required fields: id, name, start, end`);
                    }
                    
                    // Ensure coordinates exist and are numbers
                    ['start', 'end'].forEach(point => {
                        ['x', 'y', 'z'].forEach(coord => {
                            if (typeof pipe[point][coord] !== 'number') {
                                pipe[point][coord] = Number(pipe[point][coord]) || 0;
                            }
                        });
                    });
                });
                // Display JSON preview with Read More option
                const jsonString = JSON.stringify(currentModel, null, 2);
                const previewLength = 10; // Number of lines to show initially
                const lines = jsonString.split('\n');
                const preview = lines.slice(0, previewLength).join('\n');
                const remaining = lines.slice(previewLength).join('\n');
                
                const jsonContainer = document.getElementById('jsonContent');
                jsonContainer.innerHTML = `
                    <pre class="text-sm">${preview}</pre>
                    ${lines.length > previewLength ? `
                        <div id="remainingJson" class="hidden">
                            <pre class="text-sm">${remaining}</pre>
                        </div>
                        <button id="toggleJson" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Read More
                        </button>
                    ` : ''}
                `;
                
                // Add toggle functionality
                const toggleBtn = document.getElementById('toggleJson');
                if (toggleBtn) {
                    toggleBtn.addEventListener('click', function() {
                        const remainingContent = document.getElementById('remainingJson');
                        const isHidden = remainingContent.classList.contains('hidden');
                        remainingContent.classList.toggle('hidden');
                        this.textContent = isHidden ? 'Show Less' : 'Read More';
                    });
                }
                
                document.getElementById('fileContent').classList.remove('hidden');
                initializeVisualization(currentModel);
                updateAnalysisResults(currentModel);
            } catch (error) {
                alert(`Error loading model: ${error.message}\n\nPlease ensure the JSON file has the correct structure.`);
            }
        };
        reader.readAsText(file);
    }
}

function initializeVisualization(model) {
    // Reinitialize Three.js scene
    window.threeJSHelpers.initThreeJS('analysis-canvas-container', {
        showVehicle: true,
        showPipes: true,
        showHeatmap: false
    });
    
    // Create model visualization based on JSON data
    if (model.routingData && model.routingData.pipeSegments) {
        model.routingData.pipeSegments.forEach(pipe => {
            window.threeJSHelpers.createPipeSegment({
                id: pipe.id,
                name: pipe.name,
                start: new THREE.Vector3(pipe.start.x, pipe.start.y, pipe.start.z),
                end: new THREE.Vector3(pipe.end.x, pipe.end.y, pipe.end.z),
                radius: pipe.radius || 0.1,
                color: pipe.color || 0x3b82f6,
                material: pipe.material || 'steel',
                stress: pipe.stress || 0
            });
        });
    }
    
    // Reset camera
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    controls.update();
}

function updateAnalysisResults(model) {
    const summaryContainer = document.getElementById('analysis-summary');
    const criticalPointsContainer = document.getElementById('critical-points-list');
    const recommendationsContainer = document.getElementById('ai-recommendations');
    const materialSuggestionsContainer = document.getElementById('material-suggestions');

    // Update summary based on data type
    if (model.routingData && model.routingData.stats) {
        // Initial model data
        const stats = model.routingData.stats;
        summaryContainer.innerHTML = `
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-gray-800 bg-opacity-70 rounded-lg p-3 border border-gray-700">
                    <h4 class="font-medium text-blue-300">Total Length</h4>
                    <p class="text-2xl font-bold text-white">${stats.length} m</p>
                </div>
                <div class="bg-gray-800 bg-opacity-70 rounded-lg p-3 border border-gray-700">
                    <h4 class="font-medium text-blue-300">Number of Bends</h4>
                    <p class="text-2xl font-bold text-white">${stats.bends}</p>
                </div>
            </div>
            <div class="bg-gray-800 bg-opacity-70 rounded-lg p-3 border border-gray-700 mb-4">
                <h4 class="font-medium text-blue-300">Routing Score</h4>
                <p class="text-2xl font-bold text-white">${stats.score}/100</p>
            </div>
        `;
    } else if (model.step !== undefined) {
        // Simulation update data
        summaryContainer.innerHTML = `
            <div class="bg-gray-800 bg-opacity-70 rounded-lg p-3 border border-gray-700 mb-4">
                <h4 class="font-medium text-blue-300">Simulation Progress</h4>
                <p class="text-2xl font-bold text-white">${Math.round((model.step / totalSteps) * 100)}%</p>
            </div>
        `;
    }

    // Update critical points
    criticalPointsContainer.innerHTML = '';
    const pipesToProcess = model.routingData ? model.routingData.pipeSegments : model.pipes;
    if (pipesToProcess) {
        pipesToProcess.forEach(pipe => {
            if (pipe.stress > 0.4) {
                const criticalPoint = document.createElement('li');
                criticalPoint.className = 'bg-gray-800 bg-opacity-70 rounded-lg p-3 border border-gray-700 mb-3';
                criticalPoint.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-medium text-white">${pipe.name}</h4>
                            <p class="text-gray-400 text-sm">Stress Level: ${(pipe.stress * 100).toFixed(1)}%</p>
                            <p class="text-gray-400 text-sm">Material: ${pipe.material}</p>
                        </div>
                        <span class="text-${pipe.stress > 0.7 ? 'red' : 'yellow'}-400 font-medium">
                            ${pipe.stress > 0.7 ? 'Critical' : 'High Stress'}
                        </span>
                    </div>
                `;
                criticalPointsContainer.appendChild(criticalPoint);
            }
        });
    }

    // Update recommendations
    if (model.routingData && model.routingData.recommendations) {
        recommendationsContainer.innerHTML = model.routingData.recommendations.map(rec => 
            `<li class="text-gray-300 mb-2"><i class="fas fa-info-circle text-blue-500 mr-2"></i>${rec}</li>`
        ).join('');
    } else {
        recommendationsContainer.innerHTML = '';
    }

    // Update material suggestions
    const pipesForSuggestions = model.routingData ? model.routingData.pipeSegments : model.pipes;
    if (pipesForSuggestions) {
        materialSuggestionsContainer.innerHTML = pipesForSuggestions
            .filter(pipe => pipe.stress > 0.4)
            .map(pipe => `
                <div class="bg-gray-800 bg-opacity-70 rounded-lg p-3 border border-gray-700 mb-3">
                    <h4 class="font-medium text-white mb-2">${pipe.name}</h4>
                    <div class="space-y-2">
                        <div class="flex items-center text-sm">
                            <span class="w-1/3 text-gray-400">Current Material:</span>
                            <span class="text-gray-300">${pipe.material}</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <span class="w-1/3 text-gray-400">Suggested Material:</span>
                            <span class="text-green-400">${pipe.stress > 0.7 ? 'High-Grade Steel' : 'Reinforced Alloy'}</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <span class="w-1/3 text-gray-400">Expected Improvement:</span>
                            <span class="text-blue-400">${((pipe.stress - 0.4) * 100).toFixed(0)}% stress reduction</span>
                        </div>
                    </div>
                </div>
            `).join('');
    } else {
        materialSuggestionsContainer.innerHTML = '';
    }
}


function startSimulation() {
    if (!currentModel) {
        alert('Please upload a model first');
        return;
    }
    
    const analysisType = document.getElementById('analysis-type').value;
    const operatingCondition = document.getElementById('operating-condition').value;
    
    // Show simulation controls
    document.getElementById('simulation-controls').style.display = 'flex';
    document.getElementById('simulation-progress').style.display = 'block';
    
    // Initialize simulation
    simulationRunning = true;
    simulationPaused = false;
    currentStep = 0;
    
    // Initialize simulation history
    window.simulationHistory = [];
    
    // Set fixed number of steps for consistent timing
    totalSteps = 80; // With 80ms delay, this gives ~6.4 seconds simulation time
    
    // Start simulation loop
    simulationLoop();
    
    // Update UI
    updateAnalysisResults({
        type: analysisType,
        condition: operatingCondition,
        progress: 0
    });
}

function simulationLoop() {
    if (!simulationRunning) return;
    if (simulationPaused) {
        requestAnimationFrame(simulationLoop);
        return;
    }
    
    // Perform one simulation step
    performSimulationStep();
    
    // Continue loop if not complete
    if (currentStep < totalSteps) {
        setTimeout(() => {
            requestAnimationFrame(simulationLoop);
        }, 80); // Fixed timing of ~80ms for consistent 5-8 second simulation
    } else {
        simulationComplete();
    }
}

function performSimulationStep() {
    currentStep++;
    
    // Get simulation parameters
    const analysisType = document.getElementById('analysis-type').value;
    const operatingCondition = document.getElementById('operating-condition').value;
    const intensity = operatingCondition === 'normal' ? 1 : 
                     operatingCondition === 'high-load' ? 1.5 : 2;
    const progress = (currentStep / totalSteps) * 100;
    
    // Update progress bar
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-percentage');
    progressBar.style.width = `${progress}%`;
    progressBar.style.transition = 'width 0.3s ease-in-out';
    progressText.textContent = `${Math.round(progress)}%`;

    // Update simulation status
    document.getElementById('simulation-status').innerHTML = `
        <div class="text-sm text-gray-300">
            <span class="font-medium">Analysis Type:</span> ${analysisType}
            <span class="ml-4 font-medium">Condition:</span> ${operatingCondition}
            <span class="ml-4 font-medium">Step:</span> ${currentStep}/${totalSteps}
        </div>
    `;
    
    // Get all pipes and process them
    const pipes = scene.children.filter(child => child.userData && child.userData.id);
    pipes.forEach(pipe => {
        // Apply visual effects based on analysis type
        switch(analysisType) {
            case 'vibration':
                // Add oscillating movement
                const amplitude = 0.05 * intensity;
                const frequency = 5 + (intensity * 2);
                const offset = Math.sin(currentStep * 0.1 * frequency) * amplitude;
                pipe.position.y += offset;
                if (pipe.userData.label) {
                    pipe.userData.label.position.y += offset;
                }
                break;
                
            case 'thermal':
                // Add pulsing effect (scale)
                const scale = 1 + (Math.sin(currentStep * 0.1) * 0.02 * intensity);
                pipe.scale.set(scale, scale, scale);
                break;
                
            case 'pressure':
                // Add ripple effect using custom shader
                if (pipe.material) {
                    pipe.material.opacity = 0.8 + (Math.sin(currentStep * 0.2) * 0.2);
                    pipe.material.transparent = true;
                }
                break;
                
            case 'combined':
                // Combine multiple effects
                const combinedScale = 1 + (Math.sin(currentStep * 0.1) * 0.01 * intensity);
                pipe.scale.set(combinedScale, combinedScale, combinedScale);
                if (currentStep % 2 === 0) {
                    pipe.position.y += Math.sin(currentStep * 0.05) * 0.02 * intensity;
                }
                break;
        }

        // Calculate and update stress levels
        const stress = calculateStress(pipe, analysisType, operatingCondition, currentStep/totalSteps);
        const color = getStressColor(stress);
        
        // Animate stress change
        window.threeJSHelpers.updatePipeSegment(pipe.userData.id, {
            stress: stress,
            color: color,
            animate: true, // Enable smooth color transition
            duration: 300 // Animation duration in milliseconds
        });
        
    // Update pipe data for real-time analysis
    pipe.userData.stress = stress;
    pipe.userData.lastUpdate = Date.now();
    });
    
    // Store simulation data for this step
    const simulationRecord = {
        step: currentStep,
        timestamp: new Date().toISOString(),
        analysisType: analysisType,
        condition: operatingCondition,
        pipes: pipes.map(pipe => ({
            id: pipe.userData.id,
            name: pipe.userData.name,
            stress: pipe.userData.stress,
            material: pipe.userData.material,
            // Add analysis-specific data
            analysisData: {
                pressure: analysisType === 'pressure' ? {
                    radiusFactor: 1 + (0.1 - pipe.userData.radius) * 5,
                    pressureSpikes: progress > 0.7 ? Math.sin(progress * Math.PI * 10) * 0.2 : 0
                } : null,
                thermal: analysisType === 'thermal' ? {
                    materialExpansion: (1 - Math.cos(progress * Math.PI)) * 0.4,
                    temperatureFluctuation: Math.sin(progress * Math.PI * 8) * 0.1
                } : null,
                vibration: analysisType === 'vibration' ? {
                    amplitude: 0.05 * intensity,
                    frequency: 5 + (intensity * 2),
                    resonanceEffect: Math.sin(progress * Math.PI * 12) * 0.15
                } : null,
                combined: analysisType === 'combined' ? {
                    pressureComponent: Math.sin(progress * Math.PI) * 0.3,
                    thermalComponent: (1 - Math.cos(progress * Math.PI)) * 0.2,
                    vibrationComponent: Math.sin(progress * Math.PI * 6) * 0.2
                } : null
            }
        }))
    };
    
    // Add record to simulation history
    window.simulationHistory.push(simulationRecord);
    
    // Update heatmap with animation
    const pipeData = pipes.map(pipe => ({
        id: pipe.userData.id,
        name: pipe.userData.name,
        start: pipe.position,
        end: pipe.userData.end,
        radius: pipe.userData.radius,
        stress: pipe.userData.stress,
        material: pipe.userData.material
    }));
    window.threeJSHelpers.createHeatmapOverlay(pipeData);
    
    // Update analysis results in real-time
    const currentResults = {
        step: currentStep,
        analysisType: analysisType,
        condition: operatingCondition,
        pipes: pipes.map(pipe => ({
            id: pipe.userData.id,
            name: pipe.userData.name,
            stress: pipe.userData.stress,
            material: pipe.userData.material,
            lastUpdate: pipe.userData.lastUpdate
        }))
    };
    
    updateAnalysisResults(currentResults);
    
    // Trigger camera movement for dynamic view
    if (currentStep % 20 === 0) { // Every 20 steps
        const highStressPipes = pipes.filter(p => p.userData.stress > 0.7);
        if (highStressPipes.length > 0) {
            // Focus camera on high stress areas
            const targetPipe = highStressPipes[0];
            window.threeJSHelpers.focusOnObject(targetPipe, {
                duration: 1000,
                easing: 'easeInOutQuad'
            });
        }
    }
}

function calculateStress(pipe, type, condition, progress) {
    let baseStress = 0;
    const operatingFactor = condition === 'normal' ? 1 : 
                          condition === 'high-load' ? 1.5 : 2;
    
    // Material stress factors
    const materialFactors = {
        'steel': 1.0,
        'rubber': 1.2,
        'aluminum': 1.1,
        'copper': 1.15
    };
    
    // Get material factor, default to 1.0 if material not found
    const materialFactor = materialFactors[pipe.userData.material] || 1.0;
    
    // Radius factor - thinner pipes experience more stress
    const radiusFactor = 1 + (0.1 - pipe.userData.radius) * 5;
    
    // Calculate base stress based on analysis type
    switch(type) {
        case 'pressure':
            // Pressure stress includes pipe radius and material factors
            baseStress = (Math.sin(progress * Math.PI) * 0.5 + 0.3) * radiusFactor;
            // Add pressure spikes
            if(progress > 0.7) {
                baseStress += Math.sin(progress * Math.PI * 10) * 0.2;
            }
            break;
            
        case 'thermal':
            // Thermal stress considers material thermal expansion
            baseStress = (1 - Math.cos(progress * Math.PI)) * 0.4 * materialFactor;
            // Add temperature fluctuations
            baseStress += Math.sin(progress * Math.PI * 8) * 0.1;
            break;
            
        case 'vibration':
            // Vibration stress includes harmonic oscillations
            baseStress = Math.sin(progress * Math.PI * 4) * 0.3;
            // Add resonance effects
            baseStress += Math.sin(progress * Math.PI * 12) * 0.15;
            // Length-based vibration factor
            const length = pipe.userData.end.distanceTo(pipe.userData.start);
            baseStress *= (1 + length * 0.1);
            break;
            
        case 'combined':
            // Combine multiple stress factors
            const pressureStress = Math.sin(progress * Math.PI) * 0.3 * radiusFactor;
            const thermalStress = (1 - Math.cos(progress * Math.PI)) * 0.2 * materialFactor;
            const vibrationStress = Math.sin(progress * Math.PI * 6) * 0.2;
            baseStress = (pressureStress + thermalStress + vibrationStress);
            break;
    }
    
    // Apply material and operating condition factors
    let finalStress = baseStress * materialFactor * operatingFactor;
    
    // Add random micro-fluctuations for realism
    finalStress += (Math.random() - 0.5) * 0.05;
    
    // Ensure stress stays within valid range [0,1]
    return Math.min(Math.max(finalStress, 0), 1);
}

function getStressColor(stress) {
    if (stress < 0.4) return 0x10b981; // Green
    if (stress < 0.7) return 0xf59e0b; // Yellow
    return 0xef4444; // Red
}

// Calculate total length of pipes
function calculateTotalLength(pipes) {
    return pipes.reduce((total, pipe) => {
        const start = new THREE.Vector3(pipe.start.x, pipe.start.y, pipe.start.z);
        const end = new THREE.Vector3(pipe.end.x, pipe.end.y, pipe.end.z);
        return total + start.distanceTo(end);
    }, 0).toFixed(2);
}


function togglePause() {
    simulationPaused = !simulationPaused;
    const pauseButton = document.getElementById('pause-simulation');
    pauseButton.innerHTML = simulationPaused ? 
        '<i class="fas fa-play mr-1"></i> Resume' :
        '<i class="fas fa-pause mr-1"></i> Pause';
}

function stepSimulation() {
    if (!simulationRunning) return;
    simulationPaused = true;
    performSimulationStep();
}

async function simulationComplete() {
    simulationRunning = false;
    
    // Keep simulation controls visible but disable interactive elements
    const simControls = document.getElementById('simulation-controls');
    const buttons = simControls.querySelectorAll('button:not([onclick="exportSimulationData()"])');
    const selects = simControls.querySelectorAll('select');
    
    buttons.forEach(btn => btn.disabled = true);
    selects.forEach(select => select.disabled = true);
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50';
    loadingDiv.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 text-white text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Generating detailed analysis report...</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    try {
        // Collect simulation data
        const analysisType = document.getElementById('analysis-type').value;
        const operatingCondition = document.getElementById('operating-condition').value;
        const pipes = scene.children.filter(child => child.userData && child.userData.id);
        const criticalPipes = pipes.filter(pipe => pipe.userData.stress > 0.7);
        const highStressPipes = pipes.filter(pipe => pipe.userData.stress > 0.4 && pipe.userData.stress <= 0.7);
        
        // Generate detailed report using API service
        const simulationData = {
            analysisType,
            operatingCondition,
            pipes: pipes.map(pipe => ({
                id: pipe.userData.id,
                name: pipe.userData.name,
                stress: pipe.userData.stress,
                material: pipe.userData.material
            }))
        };
        
        const detailedReport = await window.AnalysisAPIService.generateDetailedReport(simulationData);
        
        // Update UI with basic results and report
        updateAnalysisResults({
            status: 'complete',
            summary: {
                totalPipes: pipes.length,
                criticalPipes: criticalPipes.length,
                highStressPipes: highStressPipes.length,
                analysisType: analysisType,
                operatingCondition: operatingCondition
            }
        });
        
        // Update side panel with report details
        updateSidePanelWithReport(detailedReport);
        
    } catch (error) {
        console.error('Error completing simulation:', error);
        alert('Error generating analysis report. Please try again.');
    } finally {
        // Remove loading indicator
        document.body.removeChild(loadingDiv);
    }
}

function updateSidePanelWithReport(report) {
    try {
        // Ensure all report sections exist with fallbacks
        const safeReport = {
            summary: report.summary || 'Analysis complete',
            recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
            materialSuggestions: Array.isArray(report.materialSuggestions) ? report.materialSuggestions : [],
            maintenanceSchedule: Array.isArray(report.maintenanceSchedule) ? report.maintenanceSchedule : [],
            safetyConsiderations: Array.isArray(report.safetyConsiderations) ? report.safetyConsiderations : [],
            reliabilityProjections: Array.isArray(report.reliabilityProjections) ? report.reliabilityProjections : []
        };

        // Update Analysis Summary with improved styling
        const summaryContainer = document.getElementById('analysis-summary');
        summaryContainer.innerHTML = `
            <div class="bg-gray-800 bg-opacity-70 rounded-lg p-4 border border-gray-700 mb-4">
                <h3 class="text-xl font-semibold text-blue-400 mb-3">Analysis Summary</h3>
                <p class="text-gray-300">${safeReport.summary}</p>
            </div>
            <button onclick="showFullReport()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full">
                View Full Report
            </button>
        `;

        // Update Recommendations with improved styling
        const recommendationsContainer = document.getElementById('ai-recommendations');
        recommendationsContainer.innerHTML = `
            <div class="bg-gray-800 bg-opacity-70 rounded-lg p-4 border border-gray-700 mb-4">
                <h3 class="text-lg font-semibold text-blue-400 mb-3">Key Recommendations</h3>
                <ul class="space-y-2">
                    ${safeReport.recommendations.map(rec => `
                        <li class="text-gray-300 flex items-start">
                            <i class="fas fa-info-circle text-blue-500 mr-2 mt-1"></i>
                            <span>${rec}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        // Update Material Suggestions with improved styling
        const materialSuggestionsContainer = document.getElementById('material-suggestions');
        materialSuggestionsContainer.innerHTML = `
            <div class="bg-gray-800 bg-opacity-70 rounded-lg p-4 border border-gray-700">
                <h3 class="text-lg font-semibold text-blue-400 mb-3">Material Recommendations</h3>
                <div class="space-y-3">
                    ${safeReport.materialSuggestions.map(suggestion => `
                        <div class="flex items-start">
                            <i class="fas fa-tools text-blue-500 mr-2 mt-1"></i>
                            <p class="text-gray-300">${suggestion}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Store report data for modal view
        window.currentReport = safeReport;

    } catch (error) {
        console.error('Error updating side panel:', error);
        alert('Error displaying analysis results. Please try again.');
    }
}

function showFullReport() {
    if (!window.currentReport) {
        console.error('No report data available');
        return;
    }
    
    const report = window.currentReport;
    const modalContainer = document.createElement('div');
    modalContainer.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
    
    // Define sections with their corresponding keys and icons
    const sections = [
        { title: 'Executive Summary', key: 'summary', icon: 'fa-chart-bar' },
        { title: 'Recommendations', key: 'recommendations', icon: 'fa-lightbulb' },
        { title: 'Material Suggestions', key: 'materialSuggestions', icon: 'fa-tools' },
        { title: 'Maintenance Schedule', key: 'maintenanceSchedule', icon: 'fa-calendar-check' },
        { title: 'Safety Considerations', key: 'safetyConsiderations', icon: 'fa-shield-alt' },
        { title: 'Reliability Projections', key: 'reliabilityProjections', icon: 'fa-chart-line' }
    ];
    
    modalContainer.innerHTML = `
    <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-gray-900 rounded-lg shadow-2xl w-11/12 md:w-3/4 lg:w-3/5 h-[90vh] mx-auto flex flex-col">
            <!-- Header -->
            <div class="sticky top-0 z-10 flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-gray-900">
                <h2 class="text-2xl font-bold text-white flex items-center">
                    <i class="fas fa-file-alt mr-3 text-blue-400"></i>
                    Detailed Analysis Report
                </h2>
                <button class="text-gray-400 hover:text-white transition-colors" 
                        onclick="this.closest('.fixed').remove()">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <!-- Scrollable Content -->
            <div class="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
                ${sections.map(section => {
                    const content = section.key === 'summary' ? 
                        report[section.key] || 'No summary available' :
                        Array.isArray(report[section.key]) ? report[section.key] : [];
                        
                    return `
                        <div class="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors">
                            <h3 class="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                                <i class="fas ${section.icon} mr-3"></i>
                                ${section.title}
                            </h3>
                            ${section.key === 'summary' ?
                                `<p class="text-gray-300">${content}</p>` :
                                `<ul class="list-none text-gray-300 space-y-3">
                                    ${Array.isArray(content) ? content.map(item => `
                                        <li class="flex items-start">
                                            <i class="fas fa-check-circle text-blue-400 mt-1 mr-3"></i>
                                            <span>${item}</span>
                                        </li>
                                    `).join('') : ''}
                                </ul>`
                            }
                        </div>
                    `;
                }).join('')}
            </div>
            
            <!-- Footer -->
            <div class="sticky bottom-0 z-10 px-6 py-4 border-t border-gray-700 bg-gray-900">
                <div class="flex justify-end space-x-4">
                    <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            onclick="exportReport('pdf')">
                        <i class="fas fa-file-pdf mr-2"></i>
                        Export as PDF
                    </button>
                    <button class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                            onclick="exportReport('excel')">
                        <i class="fas fa-file-excel mr-2"></i>
                        Export as Excel
                    </button>
                </div>
            </div>
        </div>
    </div>
`;


    document.body.appendChild(modalContainer);

    // Add click event to close modal when clicking outside
    modalContainer.addEventListener('click', function(e) {
        if (e.target === modalContainer) {
            modalContainer.remove();
        }
    });

    // Ensure the close button works properly
    const closeButton = modalContainer.querySelector('button[onclick]');
    closeButton.onclick = function() {
        modalContainer.remove();
    };
}


// Helper function to convert simulation data to CSV format
function convertToCSV(data) {
    // Define headers based on analysis type
    const baseHeaders = ['Step', 'Time', 'Analysis Type', 'Operating Condition'];
    const pipeHeaders = ['Pipe ID', 'Name', 'Stress Level', 'Material'];
    
    // Add analysis-specific headers
    const analysisHeaders = {
        pressure: ['Radius Factor', 'Pressure Spikes'],
        thermal: ['Material Expansion', 'Temperature Fluctuation'],
        vibration: ['Amplitude', 'Frequency', 'Resonance Effect'],
        combined: ['Pressure Component', 'Thermal Component', 'Vibration Component']
    };
    
    // Get the analysis type from the first record
    const analysisType = data[0]?.analysisType || 'pressure';
    const specificHeaders = analysisHeaders[analysisType] || [];
    
    const allHeaders = [...baseHeaders, ...pipeHeaders, ...specificHeaders];
    let csv = allHeaders.join(',') + '\n';
    
    // Ensure data is properly structured
    if (!Array.isArray(data) || data.length === 0) {
        console.error('Invalid simulation data structure');
        return csv;
    }

    try {
        data.forEach((record, recordIndex) => {
            if (!Array.isArray(record.pipes)) {
                console.error(`Invalid pipes data at record ${recordIndex}`);
                return;
            }

            record.pipes.forEach((pipe, pipeIndex) => {
                try {
                    // Ensure analysisData exists
                    const analysisData = pipe.analysisData && pipe.analysisData[record.analysisType] 
                        ? pipe.analysisData[record.analysisType] 
                        : {};

                    // Create base row data with fallbacks
                    const row = [
                        record.step || recordIndex + 1,
                        record.timestamp || new Date().toISOString(),
                        record.analysisType || analysisType,
                        record.condition || 'normal',
                        pipe.id || `pipe_${pipeIndex}`,
                        pipe.name || `Pipe ${pipeIndex}`,
                        pipe.stress ? (pipe.stress * 100).toFixed(2) + '%' : '0%',
                        pipe.material || 'steel'
                    ];

                    // Add analysis-specific data with proper error handling
                    switch(record.analysisType) {
                        case 'pressure':
                            row.push(
                                (analysisData.radiusFactor || 1).toFixed(4),
                                (analysisData.pressureSpikes || 0).toFixed(4)
                            );
                            break;
                        case 'thermal':
                            row.push(
                                (analysisData.materialExpansion || 0).toFixed(4),
                                (analysisData.temperatureFluctuation || 0).toFixed(4)
                            );
                            break;
                        case 'vibration':
                            row.push(
                                (analysisData.amplitude || 0).toFixed(4),
                                (analysisData.frequency || 0).toFixed(4),
                                (analysisData.resonanceEffect || 0).toFixed(4)
                            );
                            break;
                        case 'combined':
                            row.push(
                                (analysisData.pressureComponent || 0).toFixed(4),
                                (analysisData.thermalComponent || 0).toFixed(4),
                                (analysisData.vibrationComponent || 0).toFixed(4)
                            );
                            break;
                        default:
                            // Add empty columns for unknown analysis type
                            specificHeaders.forEach(() => row.push('0'));
                    }

                    // Add the row to CSV
                    csv += row.join(',') + '\n';
                } catch (pipeError) {
                    console.error(`Error processing pipe ${pipeIndex} in record ${recordIndex}:`, pipeError);
                }
            });
        });
    } catch (error) {
        console.error('Error generating CSV:', error);
    }
    
    return csv;
}

// Function to export simulation data to Excel
function exportSimulationData() {
    const simulationData = window.simulationHistory || [];
    if (simulationData.length === 0) {
        alert('No simulation data available to export');
        return;
    }
    
    const csv = convertToCSV(simulationData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'simulation_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to generate PDF report
async function exportReportAsPDF() {
    if (!window.currentReport) {
        alert('No report data available');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const report = window.currentReport;
        
        // Add title
        doc.setFontSize(20);
        doc.text('Detailed Analysis Report', 20, 20);
        
        let yPos = 40;
        
        // Add sections
        const sections = [
            { title: 'Executive Summary', content: report.summary },
            { title: 'Recommendations', content: report.recommendations },
            { title: 'Material Suggestions', content: report.materialSuggestions },
            { title: 'Maintenance Schedule', content: report.maintenanceSchedule },
            { title: 'Safety Considerations', content: report.safetyConsiderations },
            { title: 'Reliability Projections', content: report.reliabilityProjections }
        ];
        
        sections.forEach(section => {
            // Add section title
            doc.setFontSize(16);
            doc.text(section.title, 20, yPos);
            yPos += 10;
            
            // Add section content
            doc.setFontSize(12);
            if (typeof section.content === 'string') {
                doc.text(section.content, 20, yPos);
                yPos += 10;
            } else if (Array.isArray(section.content)) {
                section.content.forEach(item => {
                    // Check if we need a new page
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text('• ' + item, 20, yPos);
                    yPos += 10;
                });
            }
            
            yPos += 10;
        });
        
        doc.save('analysis_report.pdf');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

// Function to export report as Excel
function exportReportAsExcel() {
    if (!window.currentReport) {
        alert('No report data available');
        return;
    }
    
    const report = window.currentReport;
    let csv = 'Section,Content\n';
    
    // Add summary
    csv += `Executive Summary,"${report.summary}"\n\n`;
    
    // Add other sections
    const sections = [
        { title: 'Recommendations', content: report.recommendations },
        { title: 'Material Suggestions', content: report.materialSuggestions },
        { title: 'Maintenance Schedule', content: report.maintenanceSchedule },
        { title: 'Safety Considerations', content: report.safetyConsiderations },
        { title: 'Reliability Projections', content: report.reliabilityProjections }
    ];
    
    sections.forEach(section => {
        if (Array.isArray(section.content)) {
            section.content.forEach((item, index) => {
                csv += `${index === 0 ? section.title : ''},"${item}"\n`;
            });
            csv += '\n';
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analysis_report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportReport(format) {
    if (format === 'pdf') {
        exportReportAsPDF();
    } else if (format === 'excel') {
        exportReportAsExcel();
    }
}

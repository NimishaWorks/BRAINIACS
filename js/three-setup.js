/**
 * Three.js Setup and Configuration
 * Handles the 3D visualization setup for PipeRouteAI
 */

// Global Three.js variables
let scene, camera, renderer, controls;
let canvasContainer;
let isInitialized = false;

// Vehicle and pipe system objects
let vehicleModel;
let pipeSystem;
let heatmapOverlay;

// Lighting
let ambientLight, directionalLight;

// Raycaster for object interaction
let raycaster, mouse;

// Current view mode
let currentView = '3d';

/**
 * Initialize the Three.js scene
 * @param {string} containerId - The ID of the container element
 * @param {Object} options - Configuration options
 */
function initThreeJS(containerId, options = {}) {
    // Default options
    const defaultOptions = {
        showVehicle: true,
        showPipes: true,
        showHeatmap: false,
        backgroundColor: 0x111827, // Dark background
        enableShadows: false,
        highPerformance: false
    };
    
    // Merge options
    const config = { ...defaultOptions, ...options };
    
    // Get the container
    canvasContainer = document.getElementById(containerId);
    if (!canvasContainer) {
        console.error(`Container with ID "${containerId}" not found.`);
        return;
    }
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(config.backgroundColor);
    
    // Add fog for depth
    scene.fog = new THREE.FogExp2(config.backgroundColor, 0.002);
    
    // Create camera
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    const aspectRatio = containerWidth / containerHeight;
    
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.set(5, 3, 10);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: config.highPerformance });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Enable shadows if configured
    if (config.enableShadows) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    // Add renderer to container
    canvasContainer.innerHTML = '';
    canvasContainer.appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 1.5;
    
    // Setup lighting
    setupLighting(config.enableShadows);
    
    // Setup grid
    setupGrid();
    
    // Initialize raycaster for interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
    
    // Start animation loop
    animate();
    
    // Load models if configured
    if (config.showVehicle) {
        loadVehicleModel();
    }
    
    if (config.showPipes) {
        createPipeSystem();
    }
    
    if (config.showHeatmap) {
        createHeatmapOverlay();
    }
    
    isInitialized = true;
}

/**
 * Set up scene lighting
 * @param {boolean} enableShadows - Whether to enable shadows
 */
function setupLighting(enableShadows) {
    // Ambient light
    ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Directional light (sun-like)
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    
    if (enableShadows) {
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
    }
    
    scene.add(directionalLight);
    
    // Add a blue point light for futuristic effect
    const blueLight = new THREE.PointLight(0x3b82f6, 1, 20);
    blueLight.position.set(-5, 2, -5);
    scene.add(blueLight);
    
    // Add a purple point light for futuristic effect
    const purpleLight = new THREE.PointLight(0x8b5cf6, 1, 20);
    purpleLight.position.set(5, 2, -5);
    scene.add(purpleLight);
}

/**
 * Set up grid for reference
 */
function setupGrid() {
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);
}

/**
 * Handle window resize
 */
function onWindowResize() {
    if (!canvasContainer || !camera || !renderer) return;
    
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    
    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(containerWidth, containerHeight);
}

/**
 * Handle mouse movement for hover effects
 * @param {Event} event - Mouse event
 */
function onMouseMove(event) {
    if (!canvasContainer || !raycaster || !mouse || !scene || !camera) return;
    
    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with pipe segments
    if (pipeSystem) {
        const intersects = raycaster.intersectObjects(pipeSystem.children, true);
        
        // Reset all pipe materials
        pipeSystem.children.forEach(pipe => {
            if (pipe.userData.originalMaterial) {
                pipe.material = pipe.userData.originalMaterial;
            }
        });
        
        // Highlight hovered pipe
        if (intersects.length > 0) {
            const hoveredPipe = intersects[0].object;
            
            // Store original material if not already stored
            if (!hoveredPipe.userData.originalMaterial) {
                hoveredPipe.userData.originalMaterial = hoveredPipe.material.clone();
            }
            
            // Create highlight material
            const highlightMaterial = hoveredPipe.material.clone();
            highlightMaterial.emissive = new THREE.Color(0x3b82f6);
            highlightMaterial.emissiveIntensity = 0.5;
            
            hoveredPipe.material = highlightMaterial;
            
            // Change cursor
            renderer.domElement.style.cursor = 'pointer';
        } else {
            // Reset cursor
            renderer.domElement.style.cursor = 'default';
        }
    }
}

/**
 * Handle mouse click for selecting objects
 * @param {Event} event - Mouse event
 */
function onMouseClick(event) {
    if (!canvasContainer || !raycaster || !mouse || !scene || !camera) return;
    
    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with pipe segments
    if (pipeSystem) {
        const intersects = raycaster.intersectObjects(pipeSystem.children, true);
        
        if (intersects.length > 0) {
            const selectedPipe = intersects[0].object;
            
            // Dispatch custom event with selected pipe data
            const selectEvent = new CustomEvent('pipeSelected', {
                detail: {
                    pipeId: selectedPipe.userData.id || 'unknown',
                    pipeName: selectedPipe.userData.name || 'Pipe Segment',
                    pipeData: selectedPipe.userData
                }
            });
            
            document.dispatchEvent(selectEvent);
            
            // Show notification with pipe name
            if (window.showNotification && selectedPipe.userData.name) {
                window.showNotification(`Selected: ${selectedPipe.userData.name}`, 'info');
            }
        }
    }
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    if (controls) {
        controls.update();
    }
    
    // Add any animations here
    if (pipeSystem) {
        // Subtle pipe pulsing animation for selected pipes
        pipeSystem.children.forEach(pipe => {
            if (pipe.userData.selected) {
                const time = Date.now() * 0.001;
                const pulseFactor = Math.sin(time * 2) * 0.1 + 1;
                pipe.scale.set(pulseFactor, pulseFactor, pulseFactor);
            }
        });
    }
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

/**
 * Load the vehicle model
 * This is a placeholder that creates a realistic car shape with detailed components
 * In a real application, you would load a detailed 3D model
 */
function loadVehicleModel() {
    // Create a group for the vehicle
    vehicleModel = new THREE.Group();
    vehicleModel.name = 'vehicle';
    
    // Create a more realistic car body with curved edges
    const bodyGroup = new THREE.Group();
    
    // Main body - use BufferGeometry for more control
    const bodyGeometry = new THREE.BoxGeometry(4, 0.8, 2, 10, 1, 10);
    // Modify vertices to create a more curved shape
    const bodyPositions = bodyGeometry.attributes.position;
    for (let i = 0; i < bodyPositions.count; i++) {
        const x = bodyPositions.getX(i);
        const y = bodyPositions.getY(i);
        const z = bodyPositions.getZ(i);
        
        // Round the top edges
        if (y > 0.3) {
            bodyPositions.setZ(i, z * (0.9 + 0.1 * Math.cos(x * Math.PI / 4)));
        }
        
        // Taper the front and rear
        if (Math.abs(x) > 1.5) {
            bodyPositions.setZ(i, z * (0.85 + 0.15 * (1 - Math.abs(x) / 2)));
        }
        
        // Add some curvature to the sides
        bodyPositions.setZ(i, z * (1 + 0.05 * Math.sin(y * Math.PI)));
    }
    
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2563eb,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        shininess: 80
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    bodyGroup.add(body);
    
    // Add body details - hood and trunk lines
    const lineGeometry = new THREE.BoxGeometry(0.05, 0.02, 1.8);
    const lineMaterial = new THREE.MeshPhongMaterial({ color: 0x1e3a8a });
    
    const hoodLine = new THREE.Mesh(lineGeometry, lineMaterial);
    hoodLine.position.set(0.8, 0.9, 0);
    bodyGroup.add(hoodLine);
    
    const trunkLine = new THREE.Mesh(lineGeometry, lineMaterial);
    trunkLine.position.set(-0.8, 0.9, 0);
    bodyGroup.add(trunkLine);
    
    // Add headlights and taillights
    const lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const headlightMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
    const taillightMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
    
    const headlightLeft = new THREE.Mesh(lightGeometry, headlightMaterial);
    headlightLeft.position.set(1.9, 0.6, 0.8);
    bodyGroup.add(headlightLeft);
    
    const headlightRight = new THREE.Mesh(lightGeometry, headlightMaterial);
    headlightRight.position.set(1.9, 0.6, -0.8);
    bodyGroup.add(headlightRight);
    
    const taillightLeft = new THREE.Mesh(lightGeometry, taillightMaterial);
    taillightLeft.position.set(-1.9, 0.6, 0.8);
    bodyGroup.add(taillightLeft);
    
    const taillightRight = new THREE.Mesh(lightGeometry, taillightMaterial);
    taillightRight.position.set(-1.9, 0.6, -0.8);
    bodyGroup.add(taillightRight);
    
    // Create a more realistic cabin with curved windshield
    const cabinGroup = new THREE.Group();
    
    // Main cabin
    const cabinGeometry = new THREE.BoxGeometry(2, 0.8, 1.8, 2, 1, 2);
    // Modify vertices for curved windshield
    const cabinPositions = cabinGeometry.attributes.position;
    for (let i = 0; i < cabinPositions.count; i++) {
        const x = cabinPositions.getX(i);
        const y = cabinPositions.getY(i);
        
        // Slope the windshield
        if (x > 0.5) {
            cabinPositions.setY(i, y + (x - 0.5) * 0.2);
        }
        
        // Round the roof
        if (y > 0.3) {
            cabinPositions.setZ(i, cabinPositions.getZ(i) * 0.9);
        }
    }
    
    const cabinMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1e40af,
        transparent: true,
        opacity: 0.6,
        shininess: 90
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(-0.5, 1.4, 0);
    cabinGroup.add(cabin);
    
    // Add windows with glass effect
    const windshieldGeometry = new THREE.PlaneGeometry(0.8, 0.7);
    const windowMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xadd8e6,
        transparent: true,
        opacity: 0.4,
        shininess: 100,
        side: THREE.DoubleSide
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.rotation.x = Math.PI / 10;
    windshield.rotation.y = Math.PI / 2;
    windshield.position.set(0.3, 1.6, 0);
    cabinGroup.add(windshield);
    
    // Create detailed wheels with rims and tires
    const wheelGroup = new THREE.Group();
    
    function createDetailedWheel(x, y, z) {
        const wheelGroup = new THREE.Group();
        
        // Tire
        const tireGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 24);
        const tireMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x1f2937,
            roughness: 0.8
        });
        const tire = new THREE.Mesh(tireGeometry, tireMaterial);
        
        // Rim
        const rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.22, 16);
const rimMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xd1d5db,
    metalness: 0.8,
    roughness: 0.2
});
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        
        // Hub cap
        const hubGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.23, 16);
const hubMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x9ca3af,
    metalness: 0.9,
    roughness: 0.1
});
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        
        // Spokes
        for (let i = 0; i < 5; i++) {
            const spokeGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.02);
            const spokeMaterial = new THREE.MeshPhongMaterial({ color: 0xd1d5db });
            const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
            spoke.rotation.z = (Math.PI / 5) * i;
            wheelGroup.add(spoke);
        }
        
        wheelGroup.add(tire);
        wheelGroup.add(rim);
        wheelGroup.add(hub);
        
        wheelGroup.rotation.z = Math.PI / 2;
        wheelGroup.position.set(x, y, z);
        
        return wheelGroup;
    }
    
    // Create all four wheels
    const wheelFL = createDetailedWheel(1.2, 0.4, -1);
    const wheelFR = createDetailedWheel(1.2, 0.4, 1);
    const wheelRL = createDetailedWheel(-1.2, 0.4, -1);
    const wheelRR = createDetailedWheel(-1.2, 0.4, 1);
    
    wheelGroup.add(wheelFL);
    wheelGroup.add(wheelFR);
    wheelGroup.add(wheelRL);
    wheelGroup.add(wheelRR);
    
    // Create a detailed engine block
    const engineGroup = new THREE.Group();
    engineGroup.userData.componentName = "Engine";
    
    // Engine block base
    const engineBlockGeometry = new THREE.BoxGeometry(1.2, 0.7, 1.4);
const engineBlockMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x6b7280,
    transparent: true,
    opacity: 0.9,
    metalness: 0.7,
    roughness: 0.3
});
    const engineBlock = new THREE.Mesh(engineBlockGeometry, engineBlockMaterial);
    engineGroup.add(engineBlock);
    
    // Cylinder heads (V configuration)
    const cylinderBankGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.5);
const cylinderBankMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4b5563,
    metalness: 0.8,
    roughness: 0.2
});
    
    const leftBank = new THREE.Mesh(cylinderBankGeometry, cylinderBankMaterial);
    leftBank.position.set(0, 0.35, -0.3);
    leftBank.rotation.x = Math.PI / 12;
    engineGroup.add(leftBank);
    
    const rightBank = new THREE.Mesh(cylinderBankGeometry, cylinderBankMaterial);
    rightBank.position.set(0, 0.35, 0.3);
    rightBank.rotation.x = -Math.PI / 12;
    engineGroup.add(rightBank);
    
    // Intake manifold
    const intakeGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.8);
const intakeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xdc2626,
    metalness: 0.5,
    roughness: 0.5
});
    const intake = new THREE.Mesh(intakeGeometry, intakeMaterial);
    intake.position.set(0.2, 0.5, 0);
    engineGroup.add(intake);
    
    // Air filter
    const airFilterGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16);
    const airFilterMaterial = new THREE.MeshPhongMaterial({ color: 0xfbbf24 });
    const airFilter = new THREE.Mesh(airFilterGeometry, airFilterMaterial);
    airFilter.rotation.z = Math.PI / 2;
    airFilter.position.set(0.6, 0.5, 0);
    engineGroup.add(airFilter);
    
    // Valve covers
    const valveCoverGeometry = new THREE.BoxGeometry(0.7, 0.1, 0.4);
const valveCoverMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x374151,
    metalness: 0.6,
    roughness: 0.4
});
    
    const leftValveCover = new THREE.Mesh(valveCoverGeometry, valveCoverMaterial);
    leftValveCover.position.set(0, 0.45, -0.3);
    leftValveCover.rotation.x = Math.PI / 12;
    engineGroup.add(leftValveCover);
    
    const rightValveCover = new THREE.Mesh(valveCoverGeometry, valveCoverMaterial);
    rightValveCover.position.set(0, 0.45, 0.3);
    rightValveCover.rotation.x = -Math.PI / 12;
    engineGroup.add(rightValveCover);
    
    // Pulleys and belts
    const pulleyGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
    const pulleyMaterial = new THREE.MeshPhongMaterial({ color: 0x9ca3af });
    
    const mainPulley = new THREE.Mesh(pulleyGeometry, pulleyMaterial);
    mainPulley.rotation.x = Math.PI / 2;
    mainPulley.position.set(-0.5, 0.2, 0);
    engineGroup.add(mainPulley);
    
    const secondaryPulley = new THREE.Mesh(pulleyGeometry, pulleyMaterial);
    secondaryPulley.rotation.x = Math.PI / 2;
    secondaryPulley.position.set(-0.5, 0.4, -0.2);
    engineGroup.add(secondaryPulley);
    
    // Belt
    const beltGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 20, Math.PI);
    const beltMaterial = new THREE.MeshPhongMaterial({ color: 0x1f2937 });
    const belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.rotation.y = Math.PI / 2;
    belt.position.set(-0.5, 0.3, -0.1);
    engineGroup.add(belt);
    
    // Position the engine group
    engineGroup.position.set(1, 0.8, 0);
    
    // Add engine label
    addComponentLabel(engineGroup, "Engine");
    
    // Create a detailed exhaust system
    const exhaustGroup = new THREE.Group();
    exhaustGroup.userData.componentName = "Exhaust";
    
    // Main exhaust pipe
    const exhaustPipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 12);
    const exhaustPipeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x9ca3af,
        metalness: 0.7
    });
    const exhaustPipe = new THREE.Mesh(exhaustPipeGeometry, exhaustPipeMaterial);
    exhaustPipe.rotation.z = Math.PI / 2;
    exhaustPipe.position.set(-1.8, 0.3, 0.6);
    exhaustGroup.add(exhaustPipe);
    
    // Muffler
    const mufflerGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 16);
    const mufflerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x6b7280,
        metalness: 0.6
    });
    const muffler = new THREE.Mesh(mufflerGeometry, mufflerMaterial);
    muffler.rotation.z = Math.PI / 2;
    muffler.position.set(-1.2, 0.3, 0.6);
    exhaustGroup.add(muffler);
    
    // Exhaust tip
    const exhaustTipGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.2, 12);
    const exhaustTipMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xd1d5db,
        metalness: 0.9,
        shininess: 100
    });
    const exhaustTip = new THREE.Mesh(exhaustTipGeometry, exhaustTipMaterial);
    exhaustTip.rotation.z = Math.PI / 2;
    exhaustTip.position.set(-2.7, 0.3, 0.6);
    exhaustGroup.add(exhaustTip);
    
    // Add exhaust label
    addComponentLabel(exhaustGroup, "Exhaust");
    
    // Create a realistic fuel tank
    const fuelTankGroup = new THREE.Group();
    fuelTankGroup.userData.componentName = "Fuel Tank";
    
    // Main tank body - use a combination of shapes for realism
    const tankBaseGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16, 1, false, 0, Math.PI);
    const tankBaseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x475569,
        transparent: true,
        opacity: 0.8,
        metalness: 0.6
    });
    const tankBase = new THREE.Mesh(tankBaseGeometry, tankBaseMaterial);
    tankBase.rotation.z = Math.PI / 2;
    tankBase.rotation.y = Math.PI / 2;
    fuelTankGroup.add(tankBase);
    
    // Tank top
    const tankTopGeometry = new THREE.BoxGeometry(1.2, 0.2, 1.2);
    const tankTop = new THREE.Mesh(tankTopGeometry, tankBaseMaterial);
    tankTop.position.set(0, 0.4, 0);
    fuelTankGroup.add(tankTop);
    
    // Fuel cap
    const fuelCapGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
    const fuelCapMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1f2937,
        metalness: 0.7
    });
    const fuelCap = new THREE.Mesh(fuelCapGeometry, fuelCapMaterial);
    fuelCap.position.set(0, 0.53, 0.4);
    fuelTankGroup.add(fuelCap);
    
    // Mounting brackets
    const bracketGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.4);
    const bracketMaterial = new THREE.MeshPhongMaterial({ color: 0x6b7280 });
    
    const bracket1 = new THREE.Mesh(bracketGeometry, bracketMaterial);
    bracket1.position.set(0.5, 0, 0.4);
    fuelTankGroup.add(bracket1);
    
    const bracket2 = new THREE.Mesh(bracketGeometry, bracketMaterial);
    bracket2.position.set(-0.5, 0, 0.4);
    fuelTankGroup.add(bracket2);
    
    // Position the fuel tank group
    fuelTankGroup.position.set(-1.8, 0.6, 0.8);
    
    // Add fuel tank label
    addComponentLabel(fuelTankGroup, "Fuel Tank");
    
    // Create a detailed fuel filter
    const fuelFilterGroup = new THREE.Group();
    fuelFilterGroup.userData.componentName = "Fuel Filter";
    
    // Main filter body
    const filterBodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16);
    const filterBodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const filterBody = new THREE.Mesh(filterBodyGeometry, filterBodyMaterial);
    filterBody.rotation.z = Math.PI / 2;
    fuelFilterGroup.add(filterBody);
    
    // Filter end caps
    const endCapGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16);
    const endCapMaterial = new THREE.MeshPhongMaterial({ color: 0x9ca3af });
    
    const leftCap = new THREE.Mesh(endCapGeometry, endCapMaterial);
    leftCap.rotation.z = Math.PI / 2;
    leftCap.position.set(-0.22, 0, 0);
    fuelFilterGroup.add(leftCap);
    
    const rightCap = new THREE.Mesh(endCapGeometry, endCapMaterial);
    rightCap.rotation.z = Math.PI / 2;
    rightCap.position.set(0.22, 0, 0);
    fuelFilterGroup.add(rightCap);
    
    // Inlet/outlet pipes
    const connectorGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
    const connectorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xd1d5db,
        metalness: 0.7
    });
    
    const inletPipe = new THREE.Mesh(connectorGeometry, connectorMaterial);
    inletPipe.rotation.z = Math.PI / 2;
    inletPipe.position.set(-0.3, 0, 0);
    fuelFilterGroup.add(inletPipe);
    
    const outletPipe = new THREE.Mesh(connectorGeometry, connectorMaterial);
    outletPipe.rotation.z = Math.PI / 2;
    outletPipe.position.set(0.3, 0, 0);
    fuelFilterGroup.add(outletPipe);
    
    // Position the fuel filter group
    fuelFilterGroup.position.set(-0.5, 0.8, 0.8);
    
    // Add fuel filter label
    addComponentLabel(fuelFilterGroup, "Fuel Filter");
    
// Create a detailed fuel pump
const fuelPumpGroup = new THREE.Group();
fuelPumpGroup.userData.componentName = "Fuel Pump";

// Main pump body
const pumpBodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 16);
const pumpBodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xdc2626,
    transparent: true,
    opacity: 0.9,
    metalness: 0.6,
    roughness: 0.4
});
const pumpBody = new THREE.Mesh(pumpBodyGeometry, pumpBodyMaterial);
pumpBody.rotation.z = Math.PI / 2;
fuelPumpGroup.add(pumpBody);

// Pump motor section
const motorGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16);
const motorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x374151,
    metalness: 0.7,
    roughness: 0.3
});
const motor = new THREE.Mesh(motorGeometry, motorMaterial);
motor.rotation.z = Math.PI / 2;
motor.position.set(0.15, 0, 0);
fuelPumpGroup.add(motor);

// Electrical connector
const connectorGeometry2 = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const connectorMaterial2 = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.8,
    roughness: 0.2
});
const connector2 = new THREE.Mesh(connectorGeometry2, connectorMaterial2);
connector2.position.set(0.3, 0.1, 0);
fuelPumpGroup.add(connector2);

// Position the fuel pump group
fuelPumpGroup.position.set(0.5, 0.6, 0.8);

// Create a radiator
const radiatorGroup = new THREE.Group();
radiatorGroup.userData.componentName = "Radiator";

// Main radiator body
const radiatorBodyGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
const radiatorBodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    metalness: 0.7,
    roughness: 0.3
});
const radiatorBody = new THREE.Mesh(radiatorBodyGeometry, radiatorBodyMaterial);
radiatorGroup.add(radiatorBody);

// Radiator fins
const finGeometry = new THREE.BoxGeometry(0.7, 0.5, 0.02);
const finMaterial = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.8,
    roughness: 0.2
});
for (let i = 0; i < 5; i++) {
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.position.z = -0.03 - i * 0.02;
    radiatorGroup.add(fin);
}

// Radiator hoses
const hoseGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
const hoseMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.4,
    roughness: 0.6
});
const upperHose = new THREE.Mesh(hoseGeometry, hoseMaterial);
upperHose.position.set(0.3, 0.25, 0.3);
upperHose.rotation.z = Math.PI / 4;
radiatorGroup.add(upperHose);

const lowerHose = new THREE.Mesh(hoseGeometry, hoseMaterial);
lowerHose.position.set(-0.3, -0.25, 0.3);
lowerHose.rotation.z = -Math.PI / 4;
radiatorGroup.add(lowerHose);

// Position the radiator group
radiatorGroup.position.set(1.5, 0.8, 0);

// Add radiator label
addComponentLabel(radiatorGroup, "Radiator");

// Add all parts to the vehicle group
vehicleModel.add(body);
vehicleModel.add(cabin);
vehicleModel.add(wheelFL);
vehicleModel.add(wheelFR);
vehicleModel.add(wheelRL);
vehicleModel.add(wheelRR);
vehicleModel.add(engineGroup);
vehicleModel.add(exhaustGroup);
vehicleModel.add(fuelTankGroup);
vehicleModel.add(fuelFilterGroup);
vehicleModel.add(fuelPumpGroup);
vehicleModel.add(radiatorGroup);
    
    // Add vehicle to scene
    scene.add(vehicleModel);
    
    // Add wireframe to show the vehicle's structure
    const wireframeGeometry = new THREE.EdgesGeometry(bodyGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x4b5563, linewidth: 2 });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframe.position.copy(body.position);
    vehicleModel.add(wireframe);
    
    const cabinWireframeGeometry = new THREE.EdgesGeometry(cabinGeometry);
    const cabinWireframe = new THREE.LineSegments(cabinWireframeGeometry, wireframeMaterial);
    cabinWireframe.position.copy(cabin.position);
    vehicleModel.add(cabinWireframe);
    
    // Position the vehicle
    vehicleModel.position.y = 0.4;
    
    // Add a subtle animation
    const vehicleAnimation = () => {
        const time = Date.now() * 0.001;
        vehicleModel.position.y = 0.4 + Math.sin(time) * 0.05;
        requestAnimationFrame(vehicleAnimation);
    };
    
    vehicleAnimation();
}

/**
 * Add a text label to a component
 * @param {THREE.Mesh} component - The component to label
 * @param {string} text - The label text
 */
function addComponentLabel(component, text) {
    // Create a canvas for the label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    context.strokeStyle = '#3b82f6';
    context.lineWidth = 4;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // Draw text
    context.font = 'bold 36px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create sprite material
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(material);
    
    // Scale and position the sprite
    sprite.scale.set(1, 0.5, 1);
    
    // Position above the component
    const componentBox = new THREE.Box3().setFromObject(component);
    const componentHeight = componentBox.max.y - componentBox.min.y;
    sprite.position.set(0, componentHeight / 2 + 0.3, 0);
    
    // Add sprite to component
    component.add(sprite);
}

/**
 * Create a pipe system
 * This is a placeholder that creates a simple pipe system
 * In a real application, this would be generated based on AI recommendations
 */
function createPipeSystem() {
    // Create a group for the pipe system
    pipeSystem = new THREE.Group();
    pipeSystem.name = 'pipes';
    
    // Define pipe segments
    const pipeSegments = [
        {
            id: 'pipe1',
            name: 'Fuel Inlet',
            start: new THREE.Vector3(-2, 0.5, 0.8),
            end: new THREE.Vector3(-1, 0.8, 0.8),
            radius: 0.08,
            color: 0x10b981, // Green
            material: 'rubber',
            stress: 0.2 // Low stress
        },
        {
            id: 'pipe2',
            name: 'Main Fuel Line',
            start: new THREE.Vector3(-1, 0.8, 0.8),
            end: new THREE.Vector3(0.5, 0.8, 0.8),
            radius: 0.08,
            color: 0x10b981, // Green
            material: 'rubber',
            stress: 0.3 // Low stress
        },
        {
            id: 'pipe3',
            name: 'Engine Bend',
            start: new THREE.Vector3(0.5, 0.8, 0.8),
            end: new THREE.Vector3(1, 1.2, 0.5),
            radius: 0.08,
            color: 0xf59e0b, // Yellow
            material: 'rubber',
            stress: 0.6 // Medium stress
        },
        {
            id: 'pipe4',
            name: 'Engine Connection',
            start: new THREE.Vector3(1, 1.2, 0.5),
            end: new THREE.Vector3(1.5, 1.2, 0),
            radius: 0.08,
            color: 0xef4444, // Red
            material: 'rubber',
            stress: 0.9 // High stress
        },
        {
            id: 'pipe5',
            name: 'Return Line Start',
            start: new THREE.Vector3(1.5, 1.2, 0),
            end: new THREE.Vector3(1, 0.5, -0.5),
            radius: 0.06,
            color: 0x3b82f6, // Blue
            material: 'aluminum',
            stress: 0.4 // Medium-low stress
        },
        {
            id: 'pipe6',
            name: 'Return Line Middle',
            start: new THREE.Vector3(1, 0.5, -0.5),
            end: new THREE.Vector3(0, 0.5, -0.8),
            radius: 0.06,
            color: 0x3b82f6, // Blue
            material: 'aluminum',
            stress: 0.3 // Low stress
        },
        {
            id: 'pipe7',
            name: 'Return Line End',
            start: new THREE.Vector3(0, 0.5, -0.8),
            end: new THREE.Vector3(-2, 0.5, -0.8),
            radius: 0.06,
            color: 0x3b82f6, // Blue
            material: 'aluminum',
            stress: 0.2 // Low stress
        }
    ];
    
    // Create each pipe segment
    pipeSegments.forEach(segment => {
        createPipeSegment(segment);
    });
    
    // Add pipe system to scene
    scene.add(pipeSystem);
}

/**
 * Create a single pipe segment
 * @param {Object} segment - Pipe segment data
 * @returns {THREE.Mesh} The created pipe mesh
 */
function createPipeSegment(segment) {
    // Ensure pipeSystem is initialized
    if (!pipeSystem) {
        pipeSystem = new THREE.Group();
        pipeSystem.name = 'pipes';
        scene.add(pipeSystem);
    }
    
    // Calculate pipe direction and length
    const direction = new THREE.Vector3().subVectors(segment.end, segment.start);
    const length = direction.length();
    
    // Create geometry
    const geometry = new THREE.CylinderGeometry(segment.radius, segment.radius, length, 16, 1, false);
    
    // Rotate and position the cylinder to align with start and end points
    geometry.translate(0, length / 2, 0);
    geometry.rotateX(Math.PI / 2);
    
    // Create material
    const material = new THREE.MeshPhongMaterial({ 
        color: segment.color,
        shininess: 30,
        transparent: true,
        opacity: 0.9
    });
    
    // Create mesh
    const pipe = new THREE.Mesh(geometry, material);
    
    // Store the original material for hover effects
    pipe.userData.originalMaterial = material.clone();
    
    // Store segment data in userData
    pipe.userData = {
        ...pipe.userData,
        ...segment,
        selected: false
    };
    
    // Position and orient the pipe
    pipe.position.copy(segment.start);
    
    // Orient the pipe to point from start to end
    pipe.lookAt(segment.end);
    
    // Add to pipe system
    pipeSystem.add(pipe);
    
    // Add a joint sphere at the connection points
    const jointGeometry = new THREE.SphereGeometry(segment.radius * 1.2, 16, 16);
    const jointMaterial = new THREE.MeshPhongMaterial({ 
        color: segment.color,
        shininess: 50,
        transparent: true,
        opacity: 0.9
    });
    
    // Add joint at the end point (except for the last segment)
    const joint = new THREE.Mesh(jointGeometry, jointMaterial);
    joint.position.copy(segment.end);
    pipeSystem.add(joint);
    
    return pipe;
}

/**
 * Create a heatmap overlay for stress visualization
 * @param {Array} pipeSegments - Optional array of pipe segments to visualize
 */
function createHeatmapOverlay(pipeSegments) {
    // Create a group for the heatmap
    heatmapOverlay = new THREE.Group();
    heatmapOverlay.name = 'heatmap';
    
    // If pipe segments are provided, create heatmap from them
    if (pipeSegments) {
        // Convert pipe segments to Three.js format if needed
        const segments = pipeSegments.map(segment => {
            // If segment already has Vector3 objects, use them
            if (segment.start instanceof THREE.Vector3) {
                return segment;
            }
            
            // Otherwise convert from plain objects
            return {
                ...segment,
                start: new THREE.Vector3(segment.start.x, segment.start.y, segment.start.z),
                end: new THREE.Vector3(segment.end.x, segment.end.y, segment.end.z)
            };
        });
        
        // Create heatmap for each segment
        segments.forEach(segment => {
            // Skip segments with low stress
            if (segment.stress < 0.4) return;
            
            // Calculate pipe direction and length
            const direction = new THREE.Vector3().subVectors(segment.end, segment.start);
            const length = direction.length();
            
            // Create a glow effect based on stress
            const glowColor = getHeatmapColor(segment.stress);
            const glowRadius = segment.radius * (1 + segment.stress);
            
            // Create glow geometry
            const glowGeometry = new THREE.CylinderGeometry(
                glowRadius, 
                glowRadius, 
                length, 
                16, 
                1, 
                true
            );
            
            // Position and rotate
            glowGeometry.translate(0, length / 2, 0);
            glowGeometry.rotateX(Math.PI / 2);
            
            // Create glow material
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: 0.4,
                side: THREE.BackSide
            });
            
            // Create glow mesh
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            
            // Position and orient
            glow.position.copy(segment.start);
            glow.lookAt(segment.end);
            
            // Add to heatmap group
            heatmapOverlay.add(glow);
            
            // For high stress points, add a pulsing warning indicator
            if (segment.stress > 0.7) {
                createStressIndicator(segment.end, glowColor);
            }
        });
    }
    // Otherwise use existing pipe system if available
    else if (pipeSystem) {
        // For each pipe segment, create a heatmap visualization
        pipeSystem.children.forEach(pipe => {
            // Skip joints (spheres)
            if (pipe.geometry.type !== 'CylinderGeometry') return;
            
            // Get stress value from pipe data
            const stress = pipe.userData.stress || 0;
            
            // Skip low stress areas
            if (stress < 0.4) return;
            
            // Create a glow effect based on stress
            const glowColor = getHeatmapColor(stress);
            const glowRadius = pipe.userData.radius * (1 + stress);
            
            // Create glow geometry (slightly larger than the pipe)
            const glowGeometry = new THREE.CylinderGeometry(
                glowRadius, 
                glowRadius, 
                pipe.geometry.parameters.height, 
                16, 
                1, 
                true
            );
            
            // Position and rotate like the original pipe
            glowGeometry.translate(0, pipe.geometry.parameters.height / 2, 0);
            glowGeometry.rotateX(Math.PI / 2);
            
            // Create glow material
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: 0.4,
                side: THREE.BackSide
            });
            
            // Create glow mesh
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            
            // Position like the original pipe
            glow.position.copy(pipe.position);
            glow.rotation.copy(pipe.rotation);
            
            // Add to heatmap group
            heatmapOverlay.add(glow);
            
            // For high stress points, add a pulsing warning indicator
            if (stress > 0.7) {
                createStressIndicator(pipe.userData.end, glowColor);
            }
        });
    }
    
    // Add heatmap to scene
    scene.add(heatmapOverlay);
}

/**
 * Create a pulsing stress indicator at a specific point
 * @param {THREE.Vector3} position - Position for the indicator
 * @param {number} color - Color for the indicator
 */
function createStressIndicator(position, color) {
    // Create a sphere geometry
    const geometry = new THREE.SphereGeometry(0.15, 16, 16);
    
    // Create a material that will pulse
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7
    });
    
    // Create the mesh
    const indicator = new THREE.Mesh(geometry, material);
    indicator.position.copy(position);
    
    // Add to heatmap group
    heatmapOverlay.add(indicator);
    
    // Add a pulsing animation
    const pulseAnimation = () => {
        const time = Date.now() * 0.002;
        const scale = 0.8 + Math.sin(time) * 0.3;
        indicator.scale.set(scale, scale, scale);
        
        // Also pulse opacity
        material.opacity = 0.4 + Math.sin(time) * 0.3;
        
        requestAnimationFrame(pulseAnimation);
    };
    
    pulseAnimation();
}

/**
 * Get a color for the heatmap based on stress value
 * @param {number} stress - Stress value (0-1)
 * @returns {number} - Color as a hex value
 */
function getHeatmapColor(stress) {
    if (stress < 0.4) {
        return 0x10b981; // Green for low stress
    } else if (stress < 0.7) {
        return 0xf59e0b; // Yellow for medium stress
    } else {
        return 0xef4444; // Red for high stress
    }
}

/**
 * Change the current view (3D, top, side, front)
 * @param {string} view - The view to change to
 */
function changeView(view) {
    if (!camera || !controls) return;
    
    currentView = view;
    
    switch (view) {
        case '3d':
            // Reset to default 3D view
            camera.position.set(5, 3, 10);
            break;
            
        case 'top':
            // Top-down view
            camera.position.set(0, 15, 0);
            break;
            
        case 'side':
            // Side view
            camera.position.set(15, 0, 0);
            break;
            
        case 'front':
            // Front view
            camera.position.set(0, 0, 15);
            break;
    }
    
    // Look at the center
    camera.lookAt(0, 0, 0);
    controls.update();
}

/**
 * Toggle the visibility of the vehicle model
 * @param {boolean} visible - Whether the vehicle should be visible
 */
function toggleVehicleVisibility(visible) {
    if (vehicleModel) {
        // Only toggle visibility of body parts, not components
        vehicleModel.children.forEach(child => {
            // Check if the child is a component (has componentName in userData)
            if (child.userData && child.userData.componentName) {
                // Keep components visible
                child.visible = true;
            } else {
                // Toggle visibility of body parts (body, cabin, wheels, etc.)
                child.visible = visible;
            }
            
            // Handle wireframes separately
            if (child.type === 'LineSegments') {
                child.visible = visible;
            }
        });
    }
}

/**
 * Toggle the visibility of the heatmap overlay
 * @param {boolean} visible - Whether the heatmap should be visible
 */
function toggleHeatmapVisibility(visible) {
    if (heatmapOverlay) {
        heatmapOverlay.visible = visible;
    }
}

/**
 * Select a pipe segment by ID
 * @param {string} pipeId - The ID of the pipe to select
 */
function selectPipeSegment(pipeId) {
    if (!pipeSystem) return;
    
    // Reset all selections
    pipeSystem.children.forEach(pipe => {
        pipe.userData.selected = false;
        pipe.scale.set(1, 1, 1);
    });
    
    // Find and select the pipe
    const selectedPipe = pipeSystem.children.find(pipe => pipe.userData.id === pipeId);
    
    if (selectedPipe) {
        selectedPipe.userData.selected = true;
        
        // Highlight the selected pipe
        const highlightMaterial = selectedPipe.material.clone();
        highlightMaterial.emissive = new THREE.Color(0x3b82f6);
        highlightMaterial.emissiveIntensity = 0.7;
        selectedPipe.material = highlightMaterial;
        
        // Dispatch event with pipe data
        const selectEvent = new CustomEvent('pipeSelected', {
            detail: {
                pipeId: selectedPipe.userData.id,
                pipeName: selectedPipe.userData.name,
                pipeData: selectedPipe.userData
            }
        });
        
        document.dispatchEvent(selectEvent);
    }
}

/**
 * Update a pipe segment's properties
 * @param {string} pipeId - The ID of the pipe to update
 * @param {Object} properties - New properties for the pipe
 */
function updatePipeSegment(pipeId, properties) {
    if (!pipeSystem) return;
    
    // Find the pipe
    const pipe = pipeSystem.children.find(pipe => pipe.userData.id === pipeId);
    
    if (pipe) {
        // Store original properties
        const originalRadius = pipe.userData.radius;
        const originalStart = pipe.userData.start;
        const originalEnd = pipe.userData.end;
        
        // Update userData
        pipe.userData = { ...pipe.userData, ...properties };
        
        // Update visual properties if needed
        if (properties.color !== undefined) {
            pipe.material.color.setHex(properties.color);
            pipe.userData.originalMaterial.color.setHex(properties.color);
        }
        
        if (properties.radius !== undefined) {
            // Store the old pipe's position and rotation
            const oldPosition = pipe.position.clone();
            const oldRotation = pipe.rotation.clone();
            
            // Remove the old pipe from the scene
            pipeSystem.remove(pipe);
            
            // Create a new pipe with the updated radius
            const newPipeData = {
                id: pipe.userData.id,
                name: pipe.userData.name,
                start: originalStart,
                end: originalEnd,
                radius: properties.radius,
                color: pipe.material.color.getHex(),
                material: pipe.userData.material,
                stress: pipe.userData.stress,
                component: pipe.userData.component || ''
            };
            
            // Create the new pipe segment
            createPipeSegment(newPipeData);
            
            // Find the newly created pipe
            const newPipe = pipeSystem.children.find(p => p.userData.id === pipeId);
            
            // Show notification about the diameter change
            if (window.showNotification) {
                const percentChange = ((properties.radius / originalRadius) - 1) * 100;
                const changeText = percentChange > 0 ? 
                    `increased by ${percentChange.toFixed(0)}%` : 
                    `decreased by ${Math.abs(percentChange).toFixed(0)}%`;
                
                window.showNotification(`Pipe diameter ${changeText}`, 'info');
            }
        }
        
        // Recreate heatmap if stress changed
        if ((properties.stress !== undefined || properties.radius !== undefined) && heatmapOverlay) {
            scene.remove(heatmapOverlay);
            createHeatmapOverlay();
        }
    }
}

/**
 * Clear all pipes from the scene
 */
function clearPipes() {
    if (pipeSystem) {
        scene.remove(pipeSystem);
        pipeSystem = new THREE.Group();
        pipeSystem.name = 'pipes';
        scene.add(pipeSystem);
    } else {
        pipeSystem = new THREE.Group();
        pipeSystem.name = 'pipes';
        scene.add(pipeSystem);
    }
}

/**
 * Clear the heatmap overlay from the scene
 */
function clearHeatmap() {
    if (heatmapOverlay) {
        scene.remove(heatmapOverlay);
        heatmapOverlay = new THREE.Group();
        heatmapOverlay.name = 'heatmap';
    }
}

/**
 * Add an object to the scene
 * @param {THREE.Object3D} object - The object to add to the scene
 */
function addToScene(object) {
    if (scene) {
        scene.add(object);
    }
}

// Easing functions
const easingFunctions = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
};

// Linear interpolation helper
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

/**
 * Focus camera on a specific object with animation
 * @param {THREE.Object3D} object - The object to focus on
 * @param {Object} options - Animation options
 */
function focusOnObject(object, options = {}) {
    const duration = options.duration || 1000;
    const easing = options.easing || 'easeInOutQuad';
    
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    
    const targetPos = object.position.clone().add(new THREE.Vector3(2, 2, 2));
    const targetTarget = object.position.clone();
    
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easedProgress = easingFunctions[easing](progress);
        
        camera.position.lerpVectors(startPos, targetPos, easedProgress);
        controls.target.lerpVectors(startTarget, targetTarget, easedProgress);
        controls.update();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Export functions for use in other modules
window.threeJSHelpers = {
    initThreeJS,
    changeView,
    toggleVehicleVisibility,
    toggleHeatmapVisibility,
    selectPipeSegment,
    updatePipeSegment,
    clearPipes,
    clearHeatmap,
    addToScene,
    createPipeSegment,
    createHeatmapOverlay,
    focusOnObject
};

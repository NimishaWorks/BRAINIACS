let modelA, modelB;
let sceneA, sceneB, cameraA, cameraB, rendererA, rendererB, controlsA, controlsB;
let carModelA, carModelB;

document.addEventListener('DOMContentLoaded', () => {
    initializeThreeJS();
    setupEventListeners();
});

function initializeThreeJS() {
    const containerA = document.getElementById('model-a-container');
    const containerB = document.getElementById('model-b-container');

    // Initialize scenes for both models
    sceneA = new THREE.Scene();
    sceneB = new THREE.Scene();

    // Set up cameras
    const aspect = containerA.clientWidth / containerA.clientHeight;
    cameraA = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    cameraB = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

    // Set up renderers
    rendererA = new THREE.WebGLRenderer({ antialias: true });
    rendererB = new THREE.WebGLRenderer({ antialias: true });
    rendererA.setSize(containerA.clientWidth, containerA.clientHeight);
    rendererB.setSize(containerB.clientWidth, containerB.clientHeight);
    containerA.appendChild(rendererA.domElement);
    containerB.appendChild(rendererB.domElement);

    // Set up controls
    controlsA = new THREE.OrbitControls(cameraA, rendererA.domElement);
    controlsB = new THREE.OrbitControls(cameraB, rendererB.domElement);

    // Set up lighting
    setupLighting(sceneA);
    setupLighting(sceneB);

    // Load car models
    loadCarModel(sceneA, (car) => { carModelA = car; });
    loadCarModel(sceneB, (car) => { carModelB = car; });

    // Set initial camera positions
    cameraA.position.set(5, 3, 10);
    cameraB.position.set(5, 3, 10);

    // Start rendering
    animate();
}

function setupLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 1, 20);
    blueLight.position.set(-5, 2, -5);
    scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0x8b5cf6, 1, 20);
    purpleLight.position.set(5, 2, -5);
    scene.add(purpleLight);
}

function loadCarModel(scene, callback) {
    const vehicleModel = new THREE.Group();
    vehicleModel.name = 'vehicle';

    // Create a more realistic car body with curved edges
    const bodyGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(4, 0.8, 2, 10, 1, 10);
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

    // Create wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const wheelPositions = [
        [-1.5, 0.4, 1], [1.5, 0.4, 1],
        [-1.5, 0.4, -1], [1.5, 0.4, -1]
    ];

    wheelPositions.forEach(position => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(...position);
        wheel.rotation.z = Math.PI / 2;
        bodyGroup.add(wheel);
    });

    vehicleModel.add(bodyGroup);

    // Add engine
    const engineGroup = new THREE.Group();
    const engineGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    const engineMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const engineMesh = new THREE.Mesh(engineGeometry, engineMaterial);
    engineMesh.position.set(1, 1.75, 0);
    engineGroup.add(engineMesh);
    vehicleModel.add(engineGroup);

    // Add fuel tank
    const fuelTankGroup = new THREE.Group();
    const fuelTankGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 32);
    const fuelTankMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const fuelTankMesh = new THREE.Mesh(fuelTankGeometry, fuelTankMaterial);
    fuelTankMesh.position.set(-1.5, 0.6, 0);
    fuelTankMesh.rotation.z = Math.PI / 2;
    fuelTankGroup.add(fuelTankMesh);
    vehicleModel.add(fuelTankGroup);

    scene.add(vehicleModel);
    callback(vehicleModel);
}

function setupEventListeners() {
    document.getElementById('fileInputA').addEventListener('change', (event) => handleFileUpload(event, 'A'));
    document.getElementById('fileInputB').addEventListener('change', (event) => handleFileUpload(event, 'B'));
    document.getElementById('toggleCarA').addEventListener('click', () => toggleCar('A'));
    document.getElementById('toggleCarB').addEventListener('click', () => toggleCar('B'));
}

function handleFileUpload(event, modelId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            try {
                const jsonData = JSON.parse(content);
                if (modelId === 'A') {
                    modelA = jsonData;
                    document.getElementById('fileNameA').textContent = file.name;
                    visualizeModel(sceneA, jsonData, carModelA);
                } else {
                    modelB = jsonData;
                    document.getElementById('fileNameB').textContent = file.name;
                    visualizeModel(sceneB, jsonData, carModelB);
                }
                if (modelA && modelB) {
                    compareModels();
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                alert('Invalid JSON file. Please upload a valid model file.');
            }
        };
        reader.readAsText(file);
    }
}

function visualizeModel(scene, modelData, carModel) {
    // Clear existing pipe objects from the scene
    scene.children.forEach(child => {
        if (child.name === 'pipes') {
            scene.remove(child);
        }
    });

    // Create pipe system
    const pipeSystem = new THREE.Group();
    pipeSystem.name = 'pipes';

    modelData.routingData.pipeSegments.forEach(segment => {
        const pipe = createPipeSegment(segment);
        pipeSystem.add(pipe);
    });

    scene.add(pipeSystem);

    // Create heatmap overlay
    createHeatmapOverlay(scene, modelData.routingData.pipeSegments);

    // Adjust car model visibility
    if (carModel) {
        carModel.visible = true;
    }
}

function createPipeSegment(segment) {
    const start = new THREE.Vector3(segment.start.x, segment.start.y, segment.start.z);
    const end = new THREE.Vector3(segment.end.x, segment.end.y, segment.end.z);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    const geometry = new THREE.CylinderGeometry(segment.radius, segment.radius, length, 32);
    const material = new THREE.MeshPhongMaterial({ color: segment.color });
    const pipe = new THREE.Mesh(geometry, material);

    pipe.position.copy(start);
    pipe.position.addScaledVector(direction, 0.5);
    pipe.lookAt(end);
    pipe.rotateX(Math.PI / 2);

    return pipe;
}

function createHeatmapOverlay(scene, pipeSegments) {
    const heatmapOverlay = new THREE.Group();
    heatmapOverlay.name = 'heatmap';

    pipeSegments.forEach(segment => {
        if (segment.stress > 0.4) {
            const start = new THREE.Vector3(segment.start.x, segment.start.y, segment.start.z);
            const end = new THREE.Vector3(segment.end.x, segment.end.y, segment.end.z);
            const direction = new THREE.Vector3().subVectors(end, start);
            const length = direction.length();

            const glowRadius = segment.radius * (1 + segment.stress);
            const glowGeometry = new THREE.CylinderGeometry(glowRadius, glowRadius, length, 32, 1, true);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: getHeatmapColor(segment.stress),
                transparent: true,
                opacity: 0.4,
                side: THREE.BackSide
            });

            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(start);
            glow.position.addScaledVector(direction, 0.5);
            glow.lookAt(end);
            glow.rotateX(Math.PI / 2);

            heatmapOverlay.add(glow);
        }
    });

    scene.add(heatmapOverlay);
}

function getHeatmapColor(stress) {
    if (stress < 0.4) return 0x10b981;
    if (stress < 0.7) return 0xf59e0b;
    return 0xef4444;
}

function toggleCar(modelId) {
    const car = modelId === 'A' ? carModelA : carModelB;
    if (car) {
        car.visible = !car.visible;
    }
}

function compareModels() {
    const comparisonResults = document.getElementById('comparison-results');
    comparisonResults.innerHTML = `
        <table class="w-full text-left border-collapse">
            <thead>
                <tr>
                    <th class="py-4 px-6 bg-gray-700 font-bold uppercase text-sm text-gray-300 border-b border-gray-600">Metric</th>
                    <th class="py-4 px-6 bg-gray-700 font-bold uppercase text-sm text-gray-300 border-b border-gray-600">Model A</th>
                    <th class="py-4 px-6 bg-gray-700 font-bold uppercase text-sm text-gray-300 border-b border-gray-600">Model B</th>
                    <th class="py-4 px-6 bg-gray-700 font-bold uppercase text-sm text-gray-300 border-b border-gray-600">Difference</th>
                </tr>
            </thead>
            <tbody>
                ${createComparisonRow("Vehicle Type", modelA.routingConfig.vehicleType, modelB.routingConfig.vehicleType)}
                ${createComparisonRow("Total Length", modelA.routingData.stats.length, modelB.routingData.stats.length, "m")}
                ${createComparisonRow("Number of Bends", modelA.routingData.stats.bends, modelB.routingData.stats.bends)}
                ${createComparisonRow("Clearance", modelA.routingData.stats.clearance, modelB.routingData.stats.clearance, "cm")}
                ${createComparisonRow("Optimization Score", modelA.routingData.stats.score, modelB.routingData.stats.score)}
            </tbody>
        </table>
    `;
}

function createComparisonRow(metric, valueA, valueB, unit = "") {
    const difference = isNaN(valueA) || isNaN(valueB) ? "N/A" : (valueB - valueA).toFixed(2);
    const differenceClass = difference > 0 ? "text-green-500" : difference < 0 ? "text-red-500" : "";
    
    return `
        <tr>
            <td class="py-4 px-6 border-b border-gray-600">${metric}</td>
            <td class="py-4 px-6 border-b border-gray-600">${valueA}${unit}</td>
            <td class="py-4 px-6 border-b border-gray-600">${valueB}${unit}</td>
            <td class="py-4 px-6 border-b border-gray-600 ${differenceClass}">${difference}${unit}</td>
        </tr>
    `;
}

function animate() {
    requestAnimationFrame(animate);
    controlsA.update();
    controlsB.update();
    rendererA.render(sceneA, cameraA);
    rendererB.render(sceneB, cameraB);
}
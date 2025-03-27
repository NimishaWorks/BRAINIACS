/**
 * VR Mode Implementation for PipeRouteAI
 * Enables VR viewing of pipe routing models using WebXR API
 * Compatible with mobile VR headsets like Honor 8 Pro
 */

// Global variables for VR
let vrEnabled = false;
let vrButton = null;
let vrSession = null;

// Initialize VR functionality
function initVRMode() {
    // Check if WebXR is supported
    if ('xr' in navigator) {
        // Check if the browser supports VR
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                // Create VR button if VR is supported
                createVRButton();
            } else {
                // Check if AR is supported as fallback
                navigator.xr.isSessionSupported('immersive-ar').then((arSupported) => {
                    if (arSupported) {
                        createVRButton(true); // Create button with AR mode
                    } else {
                        // Check if inline (magic window) mode is supported as final fallback
                        navigator.xr.isSessionSupported('inline').then((inlineSupported) => {
                            if (inlineSupported) {
                                createVRButton(false, true); // Create button with inline mode
                            } else {
                                console.log('WebXR not fully supported on this device');
                                createMobileVRFallback(); // Create fallback for mobile VR headsets
                            }
                        });
                    }
                });
            }
        }).catch((error) => {
            console.error('Error checking XR support:', error);
            createMobileVRFallback(); // Create fallback for mobile VR headsets
        });
    } else {
        console.log('WebXR not supported on this browser');
        createMobileVRFallback(); // Create fallback for mobile VR headsets
    }
}

// Create VR button
function createVRButton(arMode = false, inlineMode = false) {
    // Create button element
    vrButton = document.createElement('button');
    vrButton.className = 'btn-outline';
    
    if (arMode) {
        vrButton.innerHTML = '<i class="fas fa-vr-cardboard mr-1"></i> AR View';
    } else if (inlineMode) {
        vrButton.innerHTML = '<i class="fas fa-vr-cardboard mr-1"></i> 3D View';
    } else {
        vrButton.innerHTML = '<i class="fas fa-vr-cardboard mr-1"></i> VR Mode';
    }
    
    // Add button to the visualization controls
    const visualizationControls = document.querySelector('.visualization-container + div + div .flex');
    if (visualizationControls) {
        visualizationControls.appendChild(vrButton);
    } else {
        // Fallback if the expected container isn't found
        const controlsContainer = document.querySelector('#routing-canvas-container + div + div');
        if (controlsContainer) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex mt-4 justify-center';
            buttonContainer.appendChild(vrButton);
            controlsContainer.appendChild(buttonContainer);
        }
    }
    
    // Add click event listener
    vrButton.addEventListener('click', () => {
        if (arMode) {
            startARSession();
        } else if (inlineMode) {
            startInlineSession();
        } else {
            startVRSession();
        }
    });
}

// Create mobile VR fallback for devices like Honor 8 Pro VR box
function createMobileVRFallback() {
    // Create button element
    vrButton = document.createElement('button');
    vrButton.className = 'btn-outline';
    vrButton.innerHTML = '<i class="fas fa-vr-cardboard mr-1"></i> Mobile VR';
    
    // Add button to the visualization controls
    const visualizationControls = document.querySelector('.visualization-container + div + div .flex');
    if (visualizationControls) {
        visualizationControls.appendChild(vrButton);
    } else {
        // Fallback if the expected container isn't found
        const controlsContainer = document.querySelector('#routing-canvas-container + div + div');
        if (controlsContainer) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex mt-4 justify-center';
            buttonContainer.appendChild(vrButton);
            controlsContainer.appendChild(buttonContainer);
        }
    }
    
    // Add click event listener for mobile VR mode
    vrButton.addEventListener('click', enableMobileVRMode);
}

// Start VR session
function startVRSession() {
    if (!renderer) {
        console.error('Three.js renderer not initialized');
        return;
    }
    
    // Get WebXR compatible renderer
    const xrRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: renderer.domElement
    });
    
    xrRenderer.setPixelRatio(window.devicePixelRatio);
    xrRenderer.setSize(window.innerWidth, window.innerHeight);
    xrRenderer.xr.enabled = true;
    
    // Replace the existing renderer
    renderer = xrRenderer;
    
    // Request VR session
    navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor']
    }).then((session) => {
        vrSession = session;
        session.addEventListener('end', onVRSessionEnd);
        
        // Set up the renderer to work with the XR session
        renderer.xr.setSession(session);
        
        // Update button state
        vrButton.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i> Exit VR';
        vrButton.onclick = endVRSession;
        
        // Adjust scene for VR
        prepareSceneForVR();
        
        // Start the XR animation loop
        renderer.setAnimationLoop(renderVR);
    }).catch((error) => {
        console.error('Error starting VR session:', error);
    });
}

// Start AR session
function startARSession() {
    if (!renderer) {
        console.error('Three.js renderer not initialized');
        return;
    }
    
    // Get WebXR compatible renderer
    const xrRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: renderer.domElement
    });
    
    xrRenderer.setPixelRatio(window.devicePixelRatio);
    xrRenderer.setSize(window.innerWidth, window.innerHeight);
    xrRenderer.xr.enabled = true;
    
    // Replace the existing renderer
    renderer = xrRenderer;
    
    // Request AR session
    navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
    }).then((session) => {
        vrSession = session;
        session.addEventListener('end', onVRSessionEnd);
        
        // Set up the renderer to work with the XR session
        renderer.xr.setSession(session);
        
        // Update button state
        vrButton.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i> Exit AR';
        vrButton.onclick = endVRSession;
        
        // Adjust scene for AR
        prepareSceneForAR();
        
        // Start the XR animation loop
        renderer.setAnimationLoop(renderVR);
    }).catch((error) => {
        console.error('Error starting AR session:', error);
    });
}

// Start inline session (magic window mode)
function startInlineSession() {
    if (!renderer) {
        console.error('Three.js renderer not initialized');
        return;
    }
    
    // Get WebXR compatible renderer
    const xrRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: renderer.domElement
    });
    
    xrRenderer.setPixelRatio(window.devicePixelRatio);
    xrRenderer.setSize(window.innerWidth, window.innerHeight);
    xrRenderer.xr.enabled = true;
    
    // Replace the existing renderer
    renderer = xrRenderer;
    
    // Request inline session
    navigator.xr.requestSession('inline').then((session) => {
        vrSession = session;
        session.addEventListener('end', onVRSessionEnd);
        
        // Set up the renderer to work with the XR session
        renderer.xr.setSession(session);
        
        // Update button state
        vrButton.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i> Exit 3D View';
        vrButton.onclick = endVRSession;
        
        // Start the XR animation loop
        renderer.setAnimationLoop(renderVR);
    }).catch((error) => {
        console.error('Error starting inline session:', error);
    });
}

// Enable mobile VR mode (horizontal phone view)
function enableMobileVRMode() {
    // Get the canvas container
    const canvasContainer = document.getElementById('routing-canvas-container');
    if (!canvasContainer) {
        console.error('Canvas container not found');
        return;
    }
    
    // Check if we're already in VR mode
    if (vrEnabled) {
        disableMobileVRMode();
        return;
    }
    
    // Store original dimensions and styles
    canvasContainer.dataset.originalWidth = canvasContainer.style.width;
    canvasContainer.dataset.originalHeight = canvasContainer.style.height;
    canvasContainer.dataset.originalTransform = canvasContainer.style.transform;
    
    // Make the container fullscreen in landscape
    canvasContainer.style.position = 'fixed';
    canvasContainer.style.top = '0';
    canvasContainer.style.left = '0';
    canvasContainer.style.width = '100vw';
    canvasContainer.style.height = '100vh';
    canvasContainer.style.zIndex = '9999';
    
    // Update button text
    vrButton.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i> Exit VR';
    
    // Enable touch controls
    enableTouchControls();
    
    // Set flag
    vrEnabled = true;
    
    // Add exit button
    addExitVRButton();

    // Force landscape orientation
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch((error) => {
            console.log('Unable to lock screen orientation:', error);
        });
    }
}

// Disable mobile VR mode with smooth transition
function disableMobileVRMode() {
    // Get the canvas container
    const canvasContainer = document.getElementById('routing-canvas-container');
    if (!canvasContainer) {
        console.error('Canvas container not found');
        return;
    }
    
    // Add transition for smooth exit
    canvasContainer.style.transition = 'all 0.3s ease';
    
    // Restore original dimensions and styles
    canvasContainer.style.position = '';
    canvasContainer.style.top = '';
    canvasContainer.style.left = '';
    canvasContainer.style.width = canvasContainer.dataset.originalWidth || '';
    canvasContainer.style.height = canvasContainer.dataset.originalHeight || '';
    canvasContainer.style.zIndex = '';
    canvasContainer.style.transform = canvasContainer.dataset.originalTransform || '';
    
    // Update button text
    vrButton.innerHTML = '<i class="fas fa-vr-cardboard mr-1"></i> Mobile VR';
    
    // Disable touch controls
    disableTouchControls();
    
    // Set flag
    vrEnabled = false;
    
    // Remove exit button with fade out effect
    const exitButton = document.getElementById('exit-vr-button');
    if (exitButton) {
        exitButton.style.opacity = '0';
        setTimeout(() => exitButton.remove(), 300);
    }

    // Release screen orientation lock
    if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
    }
}

// Enable touch controls for mobile VR mode
function enableTouchControls() {
    if (!renderer || !scene || !camera) {
        console.error('Three.js not properly initialized');
        return;
    }
    
    // Store original controls
    window._originalControls = controls;
    
    // Create touch controls
    const touchControls = new THREE.OrbitControls(camera, renderer.domElement);
    touchControls.enableDamping = true;
    touchControls.dampingFactor = 0.05;
    touchControls.screenSpacePanning = false;
    touchControls.minDistance = 1;
    touchControls.maxDistance = 50;
    touchControls.maxPolarAngle = Math.PI / 2;
    touchControls.rotateSpeed = 0.5;
    touchControls.panSpeed = 0.5;
    touchControls.zoomSpeed = 0.5;
    
    // Replace controls
    controls = touchControls;
    
    // Add touch event listeners for better mobile interaction
    renderer.domElement.addEventListener('touchstart', onTouchStart, false);
    renderer.domElement.addEventListener('touchmove', onTouchMove, false);
    renderer.domElement.addEventListener('touchend', onTouchEnd, false);
}

// Disable touch controls
function disableTouchControls() {
    if (!window._originalControls) {
        return;
    }
    
    // Remove touch event listeners
    renderer.domElement.removeEventListener('touchstart', onTouchStart);
    renderer.domElement.removeEventListener('touchmove', onTouchMove);
    renderer.domElement.removeEventListener('touchend', onTouchEnd);
    
    // Restore original controls
    controls = window._originalControls;
    controls.update();
    
    // Clean up
    window._originalControls = null;
}

// Handle resize for stereoscopic rendering
function onStereoResize() {
    if (!window._stereoEffect || !camera) {
        return;
    }
    
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update stereo effect size
    window._stereoEffect.setSize(window.innerWidth, window.innerHeight);
}

// Enable device orientation controls for mobile VR
function enableDeviceOrientationControls() {
    if (!camera) {
        console.error('Camera not initialized');
        return;
    }
    
    // Store original controls
    window._originalControls = controls;
    
    // Create device orientation controls
    const deviceControls = new THREE.DeviceOrientationControls(camera);
    
    // Replace controls
    controls = deviceControls;
    
    // Add update to animation loop
    window._originalAnimate = animate;
    animate = function() {
        requestAnimationFrame(animate);
        deviceControls.update();
        renderer.render(scene, camera);
    };
    
    // Start animation loop
    animate();
}

// Disable device orientation controls
function disableDeviceOrientationControls() {
    if (!window._originalControls) {
        return;
    }
    
    // Restore original controls
    controls = window._originalControls;
    
    // Restore original animation loop
    if (window._originalAnimate) {
        animate = window._originalAnimate;
        animate();
    }
    
    // Clean up
    window._originalControls = null;
    window._originalAnimate = null;
}

// Add exit VR button with improved styling
function addExitVRButton() {
    // Create exit button
    const exitButton = document.createElement('button');
    exitButton.id = 'exit-vr-button';
    exitButton.innerHTML = '<i class="fas fa-times"></i>';
    exitButton.style.position = 'fixed';
    exitButton.style.top = '20px';
    exitButton.style.right = '20px';
    exitButton.style.zIndex = '10000';
    exitButton.style.background = 'rgba(59, 130, 246, 0.8)'; // Blue color matching theme
    exitButton.style.color = 'white';
    exitButton.style.border = 'none';
    exitButton.style.borderRadius = '50%';
    exitButton.style.width = '40px';
    exitButton.style.height = '40px';
    exitButton.style.fontSize = '20px';
    exitButton.style.cursor = 'pointer';
    exitButton.style.display = 'flex';
    exitButton.style.alignItems = 'center';
    exitButton.style.justifyContent = 'center';
    exitButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    exitButton.style.transition = 'all 0.3s ease';
    
    // Add hover effect
    exitButton.addEventListener('mouseover', () => {
        exitButton.style.background = 'rgba(59, 130, 246, 1)';
        exitButton.style.transform = 'scale(1.1)';
    });
    
    exitButton.addEventListener('mouseout', () => {
        exitButton.style.background = 'rgba(59, 130, 246, 0.8)';
        exitButton.style.transform = 'scale(1)';
    });
    
    // Add click event
    exitButton.addEventListener('click', () => {
        // Get the canvas container
        const canvasContainer = document.getElementById('routing-canvas-container');
        if (!canvasContainer) {
            console.error('Canvas container not found');
            return;
        }
        
        // Remove VR mode class
        canvasContainer.classList.remove('vr-mode');
        
        // Restore original dimensions and styles
        canvasContainer.style.position = '';
        canvasContainer.style.top = '';
        canvasContainer.style.left = '';
        canvasContainer.style.width = canvasContainer.dataset.originalWidth || '';
        canvasContainer.style.height = canvasContainer.dataset.originalHeight || '';
        canvasContainer.style.zIndex = '';
        canvasContainer.style.transform = '';
        
        // Update button text
        vrButton.innerHTML = '<i class="fas fa-vr-cardboard mr-1"></i> Mobile VR';
        
        // Disable touch controls
        disableTouchControls();
        
        // Set flag
        vrEnabled = false;
        
        // Remove exit button with fade out effect
        exitButton.style.opacity = '0';
        setTimeout(() => exitButton.remove(), 300);

        // Release screen orientation lock
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    });
    
    // Add to body
    document.body.appendChild(exitButton);
}

// Remove exit VR button
function removeExitVRButton() {
    const exitButton = document.getElementById('exit-vr-button');
    if (exitButton) {
        exitButton.remove();
    }
}

// End VR session
function endVRSession() {
    if (vrSession) {
        vrSession.end();
    }
}

// Handle VR session end
function onVRSessionEnd() {
    vrSession = null;
    
    // Update button state
    if (vrButton) {
        vrButton.innerHTML = '<i class="fas fa-vr-cardboard mr-1"></i> VR Mode';
        vrButton.onclick = startVRSession;
    }
    
    // Stop XR animation loop
    renderer.setAnimationLoop(null);
    
    // Restore original animation loop
    animate();
}

// Prepare scene for VR
function prepareSceneForVR() {
    if (!scene || !camera) {
        console.error('Scene or camera not initialized');
        return;
    }
    
    // Adjust camera position for VR
    camera.position.set(0, 1.6, 3); // Position at average human height
    
    // Scale scene to be more immersive
    scene.scale.set(0.2, 0.2, 0.2);
    
    // Center the model
    if (window.vehicleModel) {
        window.vehicleModel.position.set(0, 0, -2);
    }
    
    // Add controllers
    addVRControllers();
}

// Prepare scene for AR
function prepareSceneForAR() {
    if (!scene || !camera) {
        console.error('Scene or camera not initialized');
        return;
    }
    
    // Scale scene to be appropriate for AR
    scene.scale.set(0.1, 0.1, 0.1);
    
    // Position model at camera height
    if (window.vehicleModel) {
        window.vehicleModel.position.set(0, 0, -1);
    }
}

// Add VR controllers
function addVRControllers() {
    if (!renderer || !scene) {
        console.error('Renderer or scene not initialized');
        return;
    }
    
    // Create controller objects
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);
    
    // Add controllers to scene
    scene.add(controller1);
    scene.add(controller2);
    
    // Create controller models
    const controllerModelFactory = new THREE.XRControllerModelFactory();
    
    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);
    
    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);
    
    // Add event listeners for controller interactions
    controller1.addEventListener('selectstart', onControllerSelectStart);
    controller1.addEventListener('selectend', onControllerSelectEnd);
    
    controller2.addEventListener('selectstart', onControllerSelectStart);
    controller2.addEventListener('selectend', onControllerSelectEnd);
}

// Handle controller select start
function onControllerSelectStart(event) {
    const controller = event.target;
    controller.userData.selected = true;
    
    // Highlight selected objects
    highlightIntersectedObjects(controller);
}

// Handle controller select end
function onControllerSelectEnd(event) {
    const controller = event.target;
    controller.userData.selected = false;
    
    // Interact with selected objects
    interactWithSelectedObjects(controller);
}

// Highlight objects intersected by controller
function highlightIntersectedObjects(controller) {
    // Create raycaster
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    
    // Get controller position and direction
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    
    // Check for intersections with pipe system
    if (window.pipeSystem) {
        const intersects = raycaster.intersectObjects(window.pipeSystem.children, true);
        
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            
            // Store original material
            if (!intersectedObject.userData.originalMaterial) {
                intersectedObject.userData.originalMaterial = intersectedObject.material.clone();
            }
            
            // Create highlight material
            const highlightMaterial = intersectedObject.material.clone();
            highlightMaterial.emissive = new THREE.Color(0x3b82f6);
            highlightMaterial.emissiveIntensity = 0.5;
            
            // Apply highlight material
            intersectedObject.material = highlightMaterial;
            
            // Store reference to highlighted object
            controller.userData.highlightedObject = intersectedObject;
        }
    }
}

// Interact with selected objects
function interactWithSelectedObjects(controller) {
    // Get highlighted object
    const highlightedObject = controller.userData.highlightedObject;
    
    if (highlightedObject) {
        // Restore original material
        if (highlightedObject.userData.originalMaterial) {
            highlightedObject.material = highlightedObject.userData.originalMaterial;
        }
        
        // Dispatch custom event with selected pipe data
        if (highlightedObject.userData.id) {
            const selectEvent = new CustomEvent('pipeSelected', {
                detail: {
                    pipeId: highlightedObject.userData.id,
                    pipeName: highlightedObject.userData.name || 'Pipe Segment',
                    pipeData: highlightedObject.userData
                }
            });
            
            document.dispatchEvent(selectEvent);
        }
        
        // Clear reference
        controller.userData.highlightedObject = null;
    }
}

// Render function for VR
function renderVR() {
    if (!renderer || !scene || !camera) {
        console.error('Renderer, scene, or camera not initialized');
        return;
    }
    
    // Update any animations or controls here
    
    // Render the scene
    renderer.render(scene, camera);
}

// Add StereoEffect implementation for mobile VR headsets
// This is a simplified version of THREE.StereoEffect
THREE.StereoEffect = function(renderer) {
    const _stereo = this;
    
    this.eyeSeparation = 0.064;
    
    this.setSize = function(width, height) {
        renderer.setSize(width, height);
    };
    
    this.render = function(scene, camera) {
        scene.updateMatrixWorld();
        
        if (camera.parent === null) camera.updateMatrixWorld();
        
        const size = renderer.getSize(new THREE.Vector2());
        
        renderer.setScissorTest(true);
        renderer.clear();
        
        // Render left eye
        renderer.setScissor(0, 0, size.width / 2, size.height);
        renderer.setViewport(0, 0, size.width / 2, size.height);
        
        camera.matrixWorld.decompose(cameraL.position, cameraL.quaternion, cameraL.scale);
        cameraL.translateX(-_stereo.eyeSeparation / 2);
        cameraL.updateMatrixWorld();
        
        renderer.render(scene, cameraL);
        
        // Render right eye
        renderer.setScissor(size.width / 2, 0, size.width / 2, size.height);
        renderer.setViewport(size.width / 2, 0, size.width / 2, size.height);
        
        camera.matrixWorld.decompose(cameraR.position, cameraR.quaternion, cameraR.scale);
        cameraR.translateX(_stereo.eyeSeparation / 2);
        cameraR.updateMatrixWorld();
        
        renderer.render(scene, cameraR);
        
        renderer.setScissorTest(false);
    };
    
    // Create left and right cameras
    const cameraL = new THREE.PerspectiveCamera();
    const cameraR = new THREE.PerspectiveCamera();
    
    cameraL.layers.enable(1);
    cameraR.layers.enable(2);
};

// Add DeviceOrientationControls implementation for mobile VR headsets
// This is a simplified version of THREE.DeviceOrientationControls
THREE.DeviceOrientationControls = function(object) {
    const scope = this;
    const EPS = 0.000001;
    
    this.object = object;
    this.object.rotation.reorder('YXZ');
    
    this.enabled = true;
    
    this.deviceOrientation = {};
    this.screenOrientation = 0;
    
    this.alphaOffset = 0; // radians
    
    const onDeviceOrientationChangeEvent = function(event) {
        scope.deviceOrientation = event;
    };
    
    const onScreenOrientationChangeEvent = function() {
        scope.screenOrientation = window.orientation || 0;
    };
    
    // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''
    const setObjectQuaternion = function() {
        const zee = new THREE.Vector3(0, 0, 1);
        const euler = new THREE.Euler();
        const q0 = new THREE.Quaternion();
        const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 around the x-axis
        
        return function(quaternion, alpha, beta, gamma, orient) {
            euler.set(beta, alpha, -gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us
            quaternion.setFromEuler(euler); // orient the device
            quaternion.multiply(q1); // camera looks out the back of the device, not the top
            quaternion.multiply(q0.setFromAxisAngle(zee, -orient)); // adjust for screen orientation
        };
    }();
    
    this.connect = function() {
        onScreenOrientationChangeEvent(); // run once on load
        
        // iOS 13+
        if (window.DeviceOrientationEvent !== undefined && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
            window.DeviceOrientationEvent.requestPermission().then(function(response) {
                if (response == 'granted') {
                    window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);
                    window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
                }
            }).catch(function(error) {
                console.error('THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error);
            });
        } else {
            window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);
            window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
        }
        
        scope.enabled = true;
    };
    
    this.disconnect = function() {
        window.removeEventListener('orientationchange', onScreenOrientationChangeEvent, false);
        window.removeEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
        
        scope.enabled = false;
    };
    
    this.update = function() {
        if (scope.enabled === false) return;
        
        const device = scope.deviceOrientation;
        
        if (device) {
            const alpha = device.alpha ? THREE.MathUtils.degToRad(device.alpha) + scope.alphaOffset : 0; // Z
            const beta = device.beta ? THREE.MathUtils.degToRad(device.beta) : 0; // X'
            const gamma = device.gamma ? THREE.MathUtils.degToRad(device.gamma) : 0; // Y''
            const orient = scope.screenOrientation ? THREE.MathUtils.degToRad(scope.screenOrientation) : 0; // O
            
            setObjectQuaternion(scope.object.quaternion, alpha, beta, gamma, orient);
        }
    };
    
    this.dispose = function() {
        scope.disconnect();
    };
    
    this.connect();
};

// Initialize VR mode when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure Three.js is fully initialized
    setTimeout(initVRMode, 1000);
});

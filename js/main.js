/**
 * Main JavaScript file for PipeRouteAI
 * Contains common functionality used across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // AI Chat Assistant functionality
    initChatAssistant();
    
    // Initialize any page-specific functionality
    initPageSpecificFunctions();
});

/**
 * Initialize the AI Chat Assistant
 */
function initChatAssistant() {
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendMessage = document.getElementById('send-message');
    const chatMessages = document.getElementById('chat-messages');
    
    if (chatToggle && chatWindow) {
        // Toggle chat window
        chatToggle.addEventListener('click', function() {
            chatWindow.classList.toggle('hidden');
            if (!chatWindow.classList.contains('hidden')) {
                chatInput.focus();
            }
        });
        
        // Close chat window
        if (closeChat) {
            closeChat.addEventListener('click', function() {
                chatWindow.classList.add('hidden');
            });
        }
        
        // Send message functionality
        if (sendMessage && chatInput && chatMessages) {
            const sendChatMessage = function() {
                const message = chatInput.value.trim();
                if (message) {
                    // Add user message to chat
                    addMessageToChat('user', message);
                    
                    // Clear input
                    chatInput.value = '';
                    
                    // Process with AI (will be implemented in ai-assistant.js)
                    processAIMessage(message);
                }
            };
            
            sendMessage.addEventListener('click', sendChatMessage);
            
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendChatMessage();
                }
            });
        }
    }
}

/**
 * Add a message to the chat window
 * @param {string} sender - 'user' or 'ai'
 * @param {string} message - The message text
 */
function addMessageToChat(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mb-4';
    
    const messageContent = document.createElement('div');
    
    if (sender === 'user') {
        messageDiv.className += ' text-right';
        messageContent.className = 'bg-blue-600 bg-opacity-70 rounded-lg p-3 inline-block max-w-xs';
    } else {
        messageContent.className = 'bg-blue-900 bg-opacity-50 rounded-lg p-3 inline-block max-w-xs';
    }
    
    const messageText = document.createElement('p');
    messageText.className = 'text-sm text-white';
    messageText.textContent = message;
    
    messageContent.appendChild(messageText);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Process a message with the AI assistant
 * This function is now implemented in ai-assistant.js
 * This is just a compatibility wrapper
 * @param {string} message - The user's message
 */
function processAIMessage(message) {
    // If the processAIResponse function exists in the global scope (from ai-assistant.js),
    // call it with the message
    if (typeof processAIResponse === 'function') {
        processAIResponse(message);
    } else {
        // Fallback if the function doesn't exist
        console.warn('AI assistant functionality not fully loaded. Using fallback.');
        
        // Show typing indicator
        showTypingIndicator();
        
        // Simple fallback response
        setTimeout(() => {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add a simple response
            addMessageToChat('ai', "I'm here to help with your pipe routing project. Please ask me about materials, routing strategies, or stress analysis.");
        }, 1500);
    }
}

/**
 * Show typing indicator in the chat
 * This is a compatibility function that will be replaced by the one in ai-assistant.js
 */
function showTypingIndicator() {
    // Remove any existing typing indicator
    removeTypingIndicator();
    
    // Create typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'mb-4';
    typingIndicator.id = 'ai-typing';
    
    typingIndicator.innerHTML = `
        <div class="bg-blue-900 bg-opacity-50 rounded-lg p-3 inline-block">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Remove typing indicator from the chat
 * This is a compatibility function that will be replaced by the one in ai-assistant.js
 */
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('ai-typing');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Initialize page-specific functionality
 * This detects which page we're on and calls the appropriate initialization function
 */
function initPageSpecificFunctions() {
    // Get the current page filename
    const path = window.location.pathname;
    const page = path.split("/").pop();
    
    // Initialize based on page
    switch(page) {
        case "index.html":
        case "":  // Handle root URL
            // Home page specific initialization
            break;
            
        case "routing.html":
            // Initialize routing page if the function exists
            if (typeof initRoutingPage === 'function') {
                initRoutingPage();
            }
            
            // Initialize modal handling
            const statsBtn = document.getElementById('stats-btn');
            const statsModal = document.getElementById('stats-modal');
            const closeStatsModal = document.getElementById('close-stats-modal');
            
            if (statsBtn && statsModal) {
                statsBtn.addEventListener('click', function() {
                    // Get current configuration
                    const config = {
                        pipeType: document.getElementById('pipe-type').value,
                        material: document.getElementById('edit-material').value || 'steel',
                        diameter: parseFloat(document.getElementById('edit-diameter').value || 2.0) / 100, // convert from cm to m
                        length: 3 // default length in meters
                    };
                    
                    // Get detailed statistics
                    const stats = window.pipeStats.getDetailedStats(config);
                    
                    // Update modal content with real calculations
                    const maxStressPoints = document.getElementById('max-stress-points');
                    if (maxStressPoints) {
                        maxStressPoints.innerHTML = stats.stressAnalysis.maxStressPoints.map(point => `
                            <div class="flex justify-between text-gray-300">
                                <span>${point.location}:</span>
                                <span>${point.stress} / ${point.limit} ${point.unit}</span>
                            </div>
                        `).join('');
                    }

                    const stressDistribution = document.getElementById('stress-distribution');
                    if (stressDistribution) {
                        const sd = stats.stressAnalysis.stressDistribution;
                        stressDistribution.innerHTML = `
                            <div class="flex justify-between text-gray-300">
                                <span>Hoop Stress:</span>
                                <span>${sd.hoopStress} MPa</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Thermal Stress:</span>
                                <span>${sd.thermalStress} MPa</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Total Stress:</span>
                                <span>${sd.totalStress} MPa</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Safety Factor:</span>
                                <span>${sd.safetyFactor}</span>
                            </div>
                        `;
                    }

                    const materialSpecs = document.getElementById('material-specs');
                    if (materialSpecs) {
                        const specs = stats.materialProperties.specifications;
                        materialSpecs.innerHTML = `
                            <div class="flex justify-between text-gray-300">
                                <span>Material:</span>
                                <span>${specs.material}</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Yield Strength:</span>
                                <span>${specs.yieldStrength} MPa</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Surface Roughness:</span>
                                <span>${specs.roughness} μm</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Thermal Expansion:</span>
                                <span>${specs.thermalExpansion} μm/m·°C</span>
                            </div>
                        `;
                    }

                    const temperatureEffects = document.getElementById('temperature-effects');
                    if (temperatureEffects) {
                        const temp = stats.materialProperties.temperatureEffects;
                        temperatureEffects.innerHTML = `
                            <div class="flex justify-between text-gray-300">
                                <span>Operating Temperature:</span>
                                <span>${temp.operatingTemp}°C</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Maximum Temperature:</span>
                                <span>${temp.maxTemp}°C</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Thermal Expansion:</span>
                                <span>${temp.expansion} mm</span>
                            </div>
                        `;
                    }

                    const flowRates = document.getElementById('flow-rates');
                    if (flowRates) {
                        const fr = stats.flowAnalysis.flowRates;
                        flowRates.innerHTML = `
                            <div class="flex justify-between text-gray-300">
                                <span>Current Flow Rate:</span>
                                <span>${fr.current} ${fr.unit}</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Maximum Flow Rate:</span>
                                <span>${fr.maximum} ${fr.unit}</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Minimum Flow Rate:</span>
                                <span>${fr.minimum} ${fr.unit}</span>
                            </div>
                        `;
                    }

                    const pressureDistribution = document.getElementById('pressure-distribution');
                    if (pressureDistribution) {
                        const pd = stats.flowAnalysis.pressureDistribution;
                        pressureDistribution.innerHTML = `
                            <div class="flex justify-between text-gray-300">
                                <span>Inlet Pressure:</span>
                                <span>${pd.inlet} ${pd.unit}</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Outlet Pressure:</span>
                                <span>${pd.outlet} ${pd.unit}</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Pressure Drop:</span>
                                <span>${pd.drop} ${pd.unit}</span>
                            </div>
                        `;
                    }

                    const performanceIndicators = document.getElementById('performance-indicators');
                    if (performanceIndicators) {
                        const perf = stats.performanceMetrics;
                        performanceIndicators.innerHTML = `
                            <div class="flex justify-between text-gray-300">
                                <span>Reynolds Number:</span>
                                <span>${perf.reynoldsNumber}</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Flow Regime:</span>
                                <span>${perf.flowRegime}</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Flow Velocity:</span>
                                <span>${perf.velocity} m/s</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>System Efficiency:</span>
                                <span>${perf.efficiency}%</span>
                            </div>
                        `;
                    }

                    const costAnalysis = document.getElementById('cost-analysis');
                    if (costAnalysis) {
                        // Calculate costs based on material and length
                        const materialCosts = {
                            steel: 25,      // $/meter
                            aluminum: 35,    // $/meter
                            copper: 45,      // $/meter
                            rubber: 15       // $/meter
                        };
                        
                        const baseCost = materialCosts[config.material] * config.length;
                        const bendCost = 5 * (stats.stressAnalysis.maxStressPoints.length - 1); // $5 per bend
                        const installationCost = baseCost * 0.3; // 30% of material cost
                        const totalCost = baseCost + bendCost + installationCost;
                        
                        costAnalysis.innerHTML = `
                            <div class="flex justify-between text-gray-300">
                                <span>Material Cost:</span>
                                <span>$${Math.round(baseCost)}</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Bending Cost:</span>
                                <span>$${Math.round(bendCost)}</span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Installation:</span>
                                <span>$${Math.round(installationCost)}</span>
                            </div>
                            <div class="flex justify-between text-gray-300 font-semibold">
                                <span>Total Cost:</span>
                                <span>$${Math.round(totalCost)}</span>
                            </div>
                        `;
                    }

                    // Show modal
                    statsModal.classList.add('flex');
                    statsModal.style.display = 'flex';
                });
                
                // Close modal when clicking outside
                statsModal.addEventListener('click', function(e) {
                    if (e.target === statsModal) {
                        statsModal.classList.remove('flex');
                        statsModal.style.display = 'none';
                    }
                });
                
                // Close modal with close button
                if (closeStatsModal) {
                    closeStatsModal.addEventListener('click', function() {
                        statsModal.classList.remove('flex');
                        statsModal.style.display = 'none';
                    });
                }
                
                // Close modal with escape key
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && statsModal.style.display === 'flex') {
                        statsModal.classList.remove('flex');
                        statsModal.style.display = 'none';
                    }
                });
            }
            break;
            
        case "analysis.html":
            // Initialize analysis page if the function exists
            if (typeof initAnalysisPage === 'function') {
                initAnalysisPage();
            }
            break;
            
        case "settings.html":
            // Initialize settings page if the function exists
            if (typeof initSettingsPage === 'function') {
                initSettingsPage();
            }
            break;
    }
}

/**
 * Show a notification toast
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info', or 'warning'
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'fixed top-20 right-4 z-50 flex flex-col items-end space-y-2';
        document.body.appendChild(notificationContainer);
    }
    
    // Create the notification
    const notification = document.createElement('div');
    
    // Set classes based on type
    let typeClasses = 'bg-blue-500 border-blue-700';
    let icon = 'info-circle';
    
    switch(type) {
        case 'success':
            typeClasses = 'bg-green-500 border-green-700';
            icon = 'check-circle';
            break;
        case 'error':
            typeClasses = 'bg-red-500 border-red-700';
            icon = 'exclamation-circle';
            break;
        case 'warning':
            typeClasses = 'bg-yellow-500 border-yellow-700';
            icon = 'exclamation-triangle';
            break;
    }
    
    notification.className = `${typeClasses} text-white px-4 py-3 rounded shadow-lg border-l-4 transform transition-all duration-300 flex items-center max-w-md`;
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    
    // Add icon
    notification.innerHTML = `<i class="fas fa-${icon} mr-2"></i> ${message}`;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'ml-4 text-white hover:text-gray-200';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    notification.appendChild(closeButton);
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after duration
    setTimeout(() => {
        removeNotification(notification);
    }, duration);
}

/**
 * Remove a notification with animation
 * @param {HTMLElement} notification - The notification element to remove
 */
function removeNotification(notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * Save data to localStorage
 * @param {string} key - The key to store the data under
 * @param {any} data - The data to store
 */
function saveToLocalStorage(key, data) {
    try {
        const serializedData = JSON.stringify(data);
        localStorage.setItem(key, serializedData);
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

/**
 * Load data from localStorage
 * @param {string} key - The key to retrieve data from
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} The retrieved data or defaultValue
 */
function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const serializedData = localStorage.getItem(key);
        if (serializedData === null) {
            return defaultValue;
        }
        return JSON.parse(serializedData);
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    /* Notification animations */
    @keyframes notification-in {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes notification-out {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
`;

document.head.appendChild(style);

// Make functions available globally
window.showNotification = showNotification;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;

/**
 * AI Assistant Logic
 * Handles the AI chat assistant functionality for PipeRouteAI
 * Integrates with the Google Gemini API for intelligent responses
 */

// Initialize the AI assistant
function initChatAssistant() {
    // Set up event listeners for chat input
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message');
    
    if (chatInput && sendMessageBtn) {
        sendMessageBtn.addEventListener('click', function() {
            const message = chatInput.value.trim();
            if (message) {
                addMessageToChat('user', message);
                chatInput.value = '';
                processAIResponse(message);
            }
        });
        
        chatInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                const message = chatInput.value.trim();
                if (message) {
                    addMessageToChat('user', message);
                    chatInput.value = '';
                    processAIResponse(message);
                }
            }
        });
    }
    
    // Add initial welcome message if not already present
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages && chatMessages.children.length === 0) {
        addMessageToChat('ai', "Hello! I'm your AI assistant for pipe routing. I can help with material selection, routing strategies, stress analysis, and best practices. What would you like to know?");
    }
}

/**
 * Process the user's message and get a response from the AI
 * @param {string} message - The user's message
 */
function processAIResponse(message) {
    // Show typing indicator
    showTypingIndicator();
    
    // Get current routing context if available
    let routingContext = '';
    if (window.currentRoutingConfig) {
        routingContext = `Current routing configuration: ${JSON.stringify(window.currentRoutingConfig)}. `;
    }
    
    // Prepare context for the AI
    const context = `${routingContext}The user is working with an automotive pipe routing system. Provide helpful, concise information about pipe routing, materials, stress analysis, or related topics.`;
    
    // Call the Gemini API
    if (window.geminiAPI && typeof window.geminiAPI.getAIChatResponse === 'function') {
        window.geminiAPI.getAIChatResponse(message, context)
            .then(response => {
                // Remove typing indicator
                removeTypingIndicator();
                
                // Add AI response to chat
                addMessageToChat('ai', response);
            })
            .catch(error => {
                console.error('Error getting AI response:', error);
                
                // Remove typing indicator
                removeTypingIndicator();
                
                // Add fallback response
                addMessageToChat('ai', "I'm having trouble connecting to my knowledge base. Let me try to help with what I know about pipe routing systems.");
                
                // Add fallback AI response based on keywords
                setTimeout(() => {
                    const fallbackResponse = generateFallbackResponse(message);
                    addMessageToChat('ai', fallbackResponse);
                }, 1000);
            });
    } else {
        // Fallback if Gemini API is not available
        setTimeout(() => {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Generate fallback response
            const fallbackResponse = generateFallbackResponse(message);
            
            // Add AI response to chat
            addMessageToChat('ai', fallbackResponse);
        }, 1500);
    }
}

/**
 * Show typing indicator in the chat
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
 */
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('ai-typing');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Generate a fallback response based on keywords in the user's message
 * Used when the Gemini API is unavailable
 * @param {string} message - The user's message
 * @returns {string} - The fallback response
 */
function generateFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for pipe routing related keywords
    if (lowerMessage.includes('pipe') && lowerMessage.includes('route')) {
        return "When routing pipes in automotive applications, consider these key factors:\n\n" +
               "1. Minimize length to reduce weight and cost\n" +
               "2. Avoid sharp bends that increase pressure drop\n" +
               "3. Maintain clearance from moving parts and heat sources\n" +
               "4. Use appropriate materials for the specific fluid and environment";
    }
    
    // Check for material related keywords
    if (lowerMessage.includes('material')) {
        return "Common pipe materials in automotive applications include:\n\n" +
               "• Rubber: Flexible, good for vibration absorption, temperature range -40°C to 125°C\n" +
               "• Aluminum: Lightweight, excellent thermal conductivity, good for cooling systems\n" +
               "• Steel: High strength and heat resistance, used for brake lines and exhaust\n" +
               "• Nylon: Chemical resistance, used for fuel lines, lightweight";
    }
    
    // Check for stress or pressure related keywords
    if (lowerMessage.includes('stress') || lowerMessage.includes('pressure')) {
        return "Stress points in pipe routing typically occur at:\n\n" +
               "• Sharp bends (use gradual curves with radius ≥ 3× pipe diameter)\n" +
               "• Connection points (reinforce with proper fittings)\n" +
               "• Areas near heat sources (use heat-resistant materials)\n" +
               "• Vibration zones (use flexible sections or dampeners)";
    }
    
    // Check for cooling system related keywords
    if (lowerMessage.includes('cool') || lowerMessage.includes('radiator') || lowerMessage.includes('water')) {
        return "For cooling system routing:\n\n" +
               "• Upper radiator hose connects from engine outlet to radiator top\n" +
               "• Lower radiator hose connects from radiator bottom to water pump\n" +
               "• Use rubber hoses with wire reinforcement for durability\n" +
               "• Ensure proper flow direction and avoid air pockets\n" +
               "• Consider expansion/contraction during temperature changes";
    }
    
    // Check for fuel system related keywords
    if (lowerMessage.includes('fuel')) {
        return "For fuel system routing:\n\n" +
               "• Use fuel-resistant materials (specialized rubber or nylon)\n" +
               "• Keep lines away from heat sources and moving parts\n" +
               "• Secure lines to prevent vibration fatigue\n" +
               "• Include proper filtration and pressure regulation\n" +
               "• Follow safety standards for leak prevention";
    }
    
    // Check for brake system related keywords
    if (lowerMessage.includes('brake')) {
        return "For brake line routing:\n\n" +
               "• Use rigid metal lines (steel/copper-nickel) for main runs\n" +
               "• Use flexible hoses only where movement is needed\n" +
               "• Secure lines to prevent vibration and damage\n" +
               "• Maintain proper clearance from moving parts and heat sources\n" +
               "• Follow safety standards for redundancy and failure prevention";
    }
    
    // Default response
    return "I can help with various aspects of automotive pipe routing, including material selection, " +
           "stress analysis, optimization strategies, and system-specific advice for cooling, fuel, brake, " +
           "and other systems. What specific information are you looking for?";
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

// Initialize the chat assistant when the document is ready
document.addEventListener('DOMContentLoaded', initChatAssistant);

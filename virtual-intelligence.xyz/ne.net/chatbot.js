/**
 * ChatBot.js - A lightweight JavaScript library for creating customizable chatbots
 * 
 * Version: 1.1.0
 * Author: Claude
 * License: MIT
 */

(function() {
    // ChatBot class definition
    class ChatBot {
        constructor(config = {}) {
            // Default configuration
            this.config = {
                name: config.name || 'ChatBot',
                containerSelector: config.containerSelector || 'body',
                width: config.width || '350px',
                height: config.height || '500px',
                primaryColor: config.primaryColor || '#4a86e8',
                secondaryColor: config.secondaryColor || '#f1f3f4',
                fontFamily: config.fontFamily || 'Arial, sans-serif',
                position: config.position || 'bottom-right',
                welcomeMessage: config.welcomeMessage || `Hi! I'm ${config.name || 'ChatBot'}. How can I help you?`,
                placeholder: config.placeholder || 'Type a message...',
                responses: config.responses || {},
                unknownResponse: config.unknownResponse || "I'm not sure how to respond to that. Can you try asking something else?",
                autoOpen: config.autoOpen !== undefined ? config.autoOpen : false,
                buttonIcon: config.buttonIcon || '💬',
                headerIcon: config.headerIcon || '🤖',
                typingSpeed: config.typingSpeed || 50, // ms per character
                typingVariation: config.typingVariation || 30, // variation in ms
                smartMatch: config.smartMatch !== undefined ? config.smartMatch : true,
                strictMessages: config.strictMessages || {}, // For choice-based responses
                choicesPlaceholder: config.choicesPlaceholder || 'Choose an option'
            };
            
            // Initialize state
            this.state = {
                isOpen: this.config.autoOpen,
                isTyping: false,
                conversation: [],
                awaitingChoice: false,
                currentChoices: null
            };
            
            // Initialize the UI
            this._createUI();
            
            // Train with provided dataset if it exists
            if (config.dataset) {
                this.train(config.dataset);
            }
        }
        
        // Train the chatbot with a dataset
        train(dataset) {
            if (!dataset) return;
            
            // Update name if provided in dataset
            if (dataset.name) {
                this.config.name = dataset.name;
                if (this.headerTitle) {
                    this.headerTitle.textContent = dataset.name;
                }
            }
            
            // Update responses
            if (dataset.responses && typeof dataset.responses === 'object') {
                this.config.responses = {...this.config.responses, ...dataset.responses};
            }
            
            // Update strict messages
            if (dataset.strictMessages && typeof dataset.strictMessages === 'object') {
                this.config.strictMessages = {...this.config.strictMessages, ...dataset.strictMessages};
            }
            
            return this;
        }
        
        // Create the UI components
        _createUI() {
            // Create container
            this.container = document.createElement('div');
            this.container.className = 'chatbot-container';
            
            // Apply styles to container
            const containerStyles = {
                position: 'fixed',
                width: this.config.width,
                height: this.state.isOpen ? this.config.height : '0px',
                fontFamily: this.config.fontFamily,
                transition: 'all 0.3s ease',
                zIndex: '9999',
                overflow: 'hidden',
                boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
            };
            
            // Set position
            switch (this.config.position) {
                case 'bottom-right':
                    containerStyles.right = '20px';
                    containerStyles.bottom = '80px';
                    break;
                case 'bottom-left':
                    containerStyles.left = '20px';
                    containerStyles.bottom = '80px';
                    break;
                case 'top-right':
                    containerStyles.right = '20px';
                    containerStyles.top = '20px';
                    break;
                case 'top-left':
                    containerStyles.left = '20px';
                    containerStyles.top = '20px';
                    break;
                default:
                    containerStyles.right = '20px';
                    containerStyles.bottom = '80px';
            }
            
            // Apply styles
            Object.assign(this.container.style, containerStyles);
            
            // Create and append header
            this._createHeader();
            
            // Create and append chat area
            this._createChatArea();
            
            // Create and append input area
            this._createInputArea();
            
            // Create toggle button
            this._createToggleButton();
            
            // Append the container to the document
            const parent = document.querySelector(this.config.containerSelector);
            if (parent) {
                parent.appendChild(this.container);
            } else {
                document.body.appendChild(this.container);
            }
            
            // Show welcome message if open
            if (this.state.isOpen) {
                setTimeout(() => this._addBotMessage(this.config.welcomeMessage), 500);
            }
        }
        
        // Create the header of the chatbot
        _createHeader() {
            const header = document.createElement('div');
            header.className = 'chatbot-header';
            
            Object.assign(header.style, {
                background: this.config.primaryColor,
                color: '#fff',
                padding: '12px 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
                fontWeight: 'bold'
            });
            
            // Header left section (icon + title)
            const headerLeft = document.createElement('div');
            headerLeft.style.display = 'flex';
            headerLeft.style.alignItems = 'center';
            
            // Bot icon
            const icon = document.createElement('span');
            icon.textContent = this.config.headerIcon;
            icon.style.marginRight = '8px';
            icon.style.fontSize = '18px';
            
            // Bot name
            this.headerTitle = document.createElement('span');
            this.headerTitle.textContent = this.config.name;
            
            headerLeft.appendChild(icon);
            headerLeft.appendChild(this.headerTitle);
            
            // Close button
            const closeButton = document.createElement('button');
            closeButton.textContent = '✕';
            
            Object.assign(closeButton.style, {
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                outline: 'none',
                padding: '0',
                marginLeft: '10px'
            });
            
            closeButton.addEventListener('click', () => this.toggle());
            
            header.appendChild(headerLeft);
            header.appendChild(closeButton);
            
            this.container.appendChild(header);
        }
        
        // Create the chat message area
        _createChatArea() {
            this.chatArea = document.createElement('div');
            this.chatArea.className = 'chatbot-messages';
            
            Object.assign(this.chatArea.style, {
                flex: '1',
                overflowY: 'auto',
                padding: '15px',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column'
            });
            
            this.container.appendChild(this.chatArea);
        }
        
        // Create the input area for user messages
        _createInputArea() {
            const inputArea = document.createElement('div');
            inputArea.className = 'chatbot-input-area';
            
            Object.assign(inputArea.style, {
                display: 'flex',
                padding: '10px',
                background: this.config.secondaryColor,
                borderTop: '1px solid #ddd'
            });
            
            // Create input field
            this.inputField = document.createElement('input');
            this.inputField.type = 'text';
            this.inputField.placeholder = this.config.placeholder;
            
            Object.assign(this.inputField.style, {
                flex: '1',
                border: '1px solid #ddd',
                borderRadius: '18px',
                padding: '8px 15px',
                outline: 'none',
                fontFamily: this.config.fontFamily
            });
            
            // Send button
            const sendButton = document.createElement('button');
            sendButton.textContent = '↑';
            
            Object.assign(sendButton.style, {
                background: this.config.primaryColor,
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                marginLeft: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
            });
            
            // Add event listeners
            const sendMessage = () => {
                const message = this.inputField.value.trim();
                if (message) {
                    this.send(message);
                    this.inputField.value = '';
                }
            };
            
            this.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            
            sendButton.addEventListener('click', sendMessage);
            
            inputArea.appendChild(this.inputField);
            inputArea.appendChild(sendButton);
            
            this.container.appendChild(inputArea);
            
            // Update input state
            this._updateInputState();
        }
        
        // Create the toggle button
        _createToggleButton() {
            this.toggleButton = document.createElement('button');
            this.toggleButton.className = 'chatbot-toggle';
            this.toggleButton.textContent = this.config.buttonIcon;
            
            // Set styles
            Object.assign(this.toggleButton.style, {
                position: 'fixed',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: this.config.primaryColor,
                color: '#fff',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '9998',
                transition: 'all 0.3s ease'
            });
            
            // Set position
            switch (this.config.position) {
                case 'bottom-right':
                    this.toggleButton.style.right = '20px';
                    this.toggleButton.style.bottom = '20px';
                    break;
                case 'bottom-left':
                    this.toggleButton.style.left = '20px';
                    this.toggleButton.style.bottom = '20px';
                    break;
                case 'top-right':
                    this.toggleButton.style.right = '20px';
                    this.toggleButton.style.top = '20px';
                    break;
                case 'top-left':
                    this.toggleButton.style.left = '20px';
                    this.toggleButton.style.top = '20px';
                    break;
                default:
                    this.toggleButton.style.right = '20px';
                    this.toggleButton.style.bottom = '20px';
            }
            
            // Add event listener
            this.toggleButton.addEventListener('click', () => this.toggle());
            
            // Append to document
            document.body.appendChild(this.toggleButton);
        }
        
        // Toggle the chatbot visibility
        toggle() {
            this.state.isOpen = !this.state.isOpen;
            this.container.style.height = this.state.isOpen ? this.config.height : '0px';
            
            // Show welcome message when opened for the first time
            if (this.state.isOpen && this.state.conversation.length === 0) {
                setTimeout(() => this._addBotMessage(this.config.welcomeMessage), 300);
            }
            
            // Focus on input when opened
            if (this.state.isOpen) {
                setTimeout(() => this.inputField.focus(), 300);
            }
            
            return this;
        }
        
        // Send a user message
        send(message) {
            if (!message || this.state.isTyping) return this;
            
            // If awaiting choice and message is not a valid choice, ignore
            if (this.state.awaitingChoice && this.state.currentChoices) {
                const validChoice = this.state.currentChoices.find(choice => 
                    choice.text.toLowerCase() === message.toLowerCase() ||
                    choice.value.toLowerCase() === message.toLowerCase()
                );
                
                if (!validChoice) {
                    return this;
                }
            }
            
            // Add user message to UI
            this._addUserMessage(message);
            
            // Clear choices if this was a choice selection
            if (this.state.awaitingChoice) {
                this._clearChoices();
            }
            
            // Process and get response
            const response = this._getResponse(message);
            
            // Check if response is a strict message with choices
            if (typeof response === 'object' && response.type === 'strict') {
                this._handleStrictMessage(response);
            } else {
                // Simulate typing and add bot response
                this._simulateTyping(response);
            }
            
            return this;
        }
        
        // Add a user message to the UI
        _addUserMessage(text) {
            const messageElement = document.createElement('div');
            messageElement.className = 'chatbot-message user-message';
            
            Object.assign(messageElement.style, {
                alignSelf: 'flex-end',
                background: this.config.primaryColor,
                color: '#fff',
                borderRadius: '18px 18px 4px 18px',
                padding: '8px 15px',
                marginBottom: '10px',
                maxWidth: '80%',
                wordWrap: 'break-word'
            });
            
            messageElement.textContent = text;
            this.chatArea.appendChild(messageElement);
            
            // Save to conversation history
            this.state.conversation.push({
                role: 'user',
                message: text
            });
            
            // Scroll to bottom
            this._scrollToBottom();
        }
        
        // Add a bot message to the UI
        _addBotMessage(text) {
            const messageElement = document.createElement('div');
            messageElement.className = 'chatbot-message bot-message';
            
            Object.assign(messageElement.style, {
                alignSelf: 'flex-start',
                background: this.config.secondaryColor,
                color: '#333',
                borderRadius: '18px 18px 18px 4px',
                padding: '8px 15px',
                marginBottom: '10px',
                maxWidth: '80%',
                wordWrap: 'break-word'
            });
            
            messageElement.textContent = text;
            this.chatArea.appendChild(messageElement);
            
            // Save to conversation history
            this.state.conversation.push({
                role: 'bot',
                message: text
            });
            
            // Scroll to bottom
            this._scrollToBottom();
        }
        
        // Show typing indicator
        _showTypingIndicator() {
            this.state.isTyping = true;
            
            const indicator = document.createElement('div');
            indicator.className = 'chatbot-typing-indicator';
            
            Object.assign(indicator.style, {
                alignSelf: 'flex-start',
                background: this.config.secondaryColor,
                color: '#333',
                borderRadius: '18px 18px 18px 4px',
                padding: '8px 15px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center'
            });
            
            // Create the dots
            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                
                Object.assign(dot.style, {
                    width: '8px',
                    height: '8px',
                    background: '#777',
                    borderRadius: '50%',
                    margin: '0 2px',
                    animation: 'chatBotTypingAnimation 1s infinite ease-in-out'
                });
                
                dot.style.animationDelay = `${i * 0.2}s`;
                indicator.appendChild(dot);
            }
            
            // Add animation style
            if (!document.getElementById('chatbot-typing-animation')) {
                const style = document.createElement('style');
                style.id = 'chatbot-typing-animation';
                style.innerHTML = `
                    @keyframes chatBotTypingAnimation {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-5px); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            this.chatArea.appendChild(indicator);
            this.typingIndicator = indicator;
            
            // Scroll to bottom
            this._scrollToBottom();
        }
        
        // Remove typing indicator
        _removeTypingIndicator() {
            if (this.typingIndicator && this.typingIndicator.parentNode) {
                this.typingIndicator.parentNode.removeChild(this.typingIndicator);
            }
            this.state.isTyping = false;
        }
        
        // Simulate typing and then display message
        _simulateTyping(text, callback) {
            this._showTypingIndicator();
            
            // Calculate typing time based on message length and speed
            const baseTime = Math.min(text.length * this.config.typingSpeed, 3000);
            const variation = Math.random() * this.config.typingVariation * 2 - this.config.typingVariation;
            const typingTime = Math.max(500, baseTime + variation);
            
            setTimeout(() => {
                this._removeTypingIndicator();
                this._addBotMessage(text);
                if (callback) callback();
            }, typingTime);
        }
        
        // Get a response based on user input
        _getResponse(message) {
            // Check strict messages first
            if (this.config.strictMessages[message]) {
                return this.config.strictMessages[message];
            }
            
            // Direct match
            if (this.config.responses[message]) {
                return this.config.responses[message];
            }
            
            // Smart matching (case insensitive, partial match)
            if (this.config.smartMatch) {
                const userInput = message.toLowerCase();
                
                // Check strict messages with smart matching
                for (const key in this.config.strictMessages) {
                    if (key.toLowerCase() === userInput) {
                        return this.config.strictMessages[key];
                    }
                }
                
                for (const key in this.config.strictMessages) {
                    if (userInput.includes(key.toLowerCase())) {
                        return this.config.strictMessages[key];
                    }
                }
                
                for (const key in this.config.strictMessages) {
                    if (key.toLowerCase().includes(userInput)) {
                        return this.config.strictMessages[key];
                    }
                }
                
                // Check for exact match (case insensitive)
                for (const key in this.config.responses) {
                    if (key.toLowerCase() === userInput) {
                        return this.config.responses[key];
                    }
                }
                
                // Check if user message contains any key
                for (const key in this.config.responses) {
                    if (userInput.includes(key.toLowerCase())) {
                        return this.config.responses[key];
                    }
                }
                
                // Check if any key contains user message
                for (const key in this.config.responses) {
                    if (key.toLowerCase().includes(userInput)) {
                        return this.config.responses[key];
                    }
                }
            }
            
            // Return unknown response
            return this.config.unknownResponse;
        }
        
        // Scroll to the bottom of the chat area
        _scrollToBottom() {
            setTimeout(() => {
                this.chatArea.scrollTop = this.chatArea.scrollHeight;
            }, 0);
        }
        
        // Handle strict messages with choices
        _handleStrictMessage(response) {
            this._simulateTyping(response.message, () => {
                if (response.choices && response.choices.length > 0) {
                    this._showChoices(response.choices);
                }
            });
        }
        
        // Show choice buttons to the user
        _showChoices(choices) {
            this.state.awaitingChoice = true;
            this.state.currentChoices = choices;
            
            const choicesContainer = document.createElement('div');
            choicesContainer.className = 'chatbot-choices-container';
            
            Object.assign(choicesContainer.style, {
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '15px',
                alignSelf: 'flex-start',
                maxWidth: '80%'
            });
            
            choices.forEach(choice => {
                const choiceButton = document.createElement('button');
                choiceButton.className = 'chatbot-choice-button';
                choiceButton.textContent = choice.text;
                
                Object.assign(choiceButton.style, {
                    background: '#fff',
                    color: this.config.primaryColor,
                    border: `2px solid ${this.config.primaryColor}`,
                    borderRadius: '20px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: this.config.fontFamily,
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                });
                
                // Hover effects
                choiceButton.addEventListener('mouseenter', () => {
                    choiceButton.style.background = this.config.primaryColor;
                    choiceButton.style.color = '#fff';
                });
                
                choiceButton.addEventListener('mouseleave', () => {
                    choiceButton.style.background = '#fff';
                    choiceButton.style.color = this.config.primaryColor;
                });
                
                // Click handler
                choiceButton.addEventListener('click', () => {
                    this.send(choice.value || choice.text);
                });
                
                choicesContainer.appendChild(choiceButton);
            });
            
            this.chatArea.appendChild(choicesContainer);
            this.choicesContainer = choicesContainer;
            
            // Update input state
            this._updateInputState();
            
            // Scroll to bottom
            this._scrollToBottom();
        }
        
        // Clear choice buttons
        _clearChoices() {
            if (this.choicesContainer && this.choicesContainer.parentNode) {
                this.choicesContainer.parentNode.removeChild(this.choicesContainer);
            }
            this.state.awaitingChoice = false;
            this.state.currentChoices = null;
            this._updateInputState();
        }
        
        // Update input field state based on whether we're awaiting a choice
        _updateInputState() {
            if (this.inputField) {
                if (this.state.awaitingChoice) {
                    this.inputField.disabled = true;
                    this.inputField.placeholder = this.config.choicesPlaceholder;
                    this.inputField.style.opacity = '0.6';
                } else {
                    this.inputField.disabled = false;
                    this.inputField.placeholder = this.config.placeholder;
                    this.inputField.style.opacity = '1';
                }
            }
        }
        
        // Add a custom response to the dataset
        addResponse(trigger, response) {
            if (typeof trigger === 'string' && typeof response === 'string') {
                this.config.responses[trigger] = response;
            }
            return this;
        }
        
        // Set multiple responses at once
        setResponses(responses) {
            if (typeof responses === 'object') {
                this.config.responses = {...this.config.responses, ...responses};
            }
            return this;
        }
        
        // Add a strict message with choices
        addStrictMessage(trigger, message, choices) {
            if (typeof trigger === 'string' && typeof message === 'string' && Array.isArray(choices)) {
                this.config.strictMessages[trigger] = {
                    type: 'strict',
                    message: message,
                    choices: choices.map(choice => ({
                        text: typeof choice === 'string' ? choice : choice.text,
                        value: typeof choice === 'string' ? choice : (choice.value || choice.text)
                    }))
                };
            }
            return this;
        }
        
        // Set multiple strict messages at once
        setStrictMessages(strictMessages) {
            if (typeof strictMessages === 'object') {
                this.config.strictMessages = {...this.config.strictMessages, ...strictMessages};
            }
            return this;
        }
        
        // Get the conversation history
        getConversation() {
            return [...this.state.conversation];
        }
        
        // Clear the conversation history
        clearConversation() {
            this.state.conversation = [];
            this._clearChoices();
            while (this.chatArea.firstChild) {
                this.chatArea.removeChild(this.chatArea.firstChild);
            }
            return this;
        }
        
        // Update the chatbot configuration
        updateConfig(newConfig) {
            this.config = {...this.config, ...newConfig};
            return this;
        }
    }
    
    // Expose ChatBot to global scope
    window.ChatBot = ChatBot;
})();
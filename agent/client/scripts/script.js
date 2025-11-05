
// ============================================
// Configuration Module
// ============================================
const CONFIG = {
    typingDelay: 1000,
    responseDelay: 500,
    agentName: 'AI Assistant'
};

// ============================================
// Mock Data Module
// ============================================
const MockDataService = {
    responses: [
        "Hello! I'm your AI assistant. How can I help you today?",
        "That's an interesting question. Let me think about that...",
        "I understand what you're asking. Here's what I can tell you:",
        "Based on what you've shared, I'd suggest considering the following options:",
        "Great question! The answer depends on several factors.",
        "I'm here to help! Could you provide more details about that?",
        "That's a complex topic. Let me break it down for you.",
        "I appreciate you sharing that with me. Here's my perspective:"
    ],

    getRandomResponse() {
        const randomIndex = Math.floor(Math.random() * this.responses.length);
        return this.responses[randomIndex];
    },

    // Simulate API call - replace this with real API integration
    async sendMessage(message) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    response: this.getRandomResponse()
                });
            }, CONFIG.responseDelay);
        });
    }
};

// ============================================
// UI Module
// ============================================
const UI = {
    elements: {
        chatMessages: document.getElementById('chatMessages'),
        messageInput: document.getElementById('messageInput'),
        sendButton: document.getElementById('sendButton')
    },

    createMessageElement(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🤖';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = message;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.getCurrentTime();

        contentDiv.appendChild(bubble);
        contentDiv.appendChild(time);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);

        return messageDiv;
    },

    createTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message agent';
        messageDiv.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator active';
        indicator.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

        contentDiv.appendChild(indicator);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);

        return messageDiv;
    },

    addMessage(message, type) {
        const messageElement = this.createMessageElement(message, type);
        this.elements.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    },

    showTypingIndicator() {
        const indicator = this.createTypingIndicator();
        this.elements.chatMessages.appendChild(indicator);
        this.scrollToBottom();
    },

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    },

    scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    },

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    },

    clearInput() {
        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = 'auto';
    },

    setInputState(disabled) {
        this.elements.messageInput.disabled = disabled;
        this.elements.sendButton.disabled = disabled;
    }
};

// ============================================
// Chat Controller Module
// ============================================
const ChatController = {
    async handleSendMessage() {
        const message = UI.elements.messageInput.value.trim();
        
        if (!message) return;

        // Add user message to chat
        UI.addMessage(message, 'user');
        UI.clearInput();
        UI.setInputState(true);

        // Show typing indicator
        setTimeout(() => {
            UI.showTypingIndicator();
        }, 300);

        try {
            // Send message to agent (currently using mock data)
            const result = await MockDataService.sendMessage(message);
            
            // Simulate typing delay
            setTimeout(() => {
                UI.hideTypingIndicator();
                
                if (result.success) {
                    UI.addMessage(result.response, 'agent');
                } else {
                    UI.addMessage('Sorry, I encountered an error. Please try again.', 'agent');
                }
                
                UI.setInputState(false);
                UI.elements.messageInput.focus();
            }, CONFIG.typingDelay);

        } catch (error) {
            console.error('Error sending message:', error);
            UI.hideTypingIndicator();
            UI.addMessage('Sorry, something went wrong. Please try again.', 'agent');
            UI.setInputState(false);
        }
    },

    init() {
        // Welcome message
        setTimeout(() => {
            UI.addMessage('Hello! I\'m your AI assistant. How can I help you today?', 'agent');
        }, 500);

        // Event listeners
        UI.elements.sendButton.addEventListener('click', () => {
            this.handleSendMessage();
        });

        UI.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Auto-resize textarea
        UI.elements.messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Focus input on load
        UI.elements.messageInput.focus();
    }
};

// ============================================
// Initialize Application
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    ChatController.init();
});

// ============================================
// Public API for future backend integration
// ============================================
window.ChatAPI = {
    sendMessage: MockDataService.sendMessage,
    addMessage: UI.addMessage.bind(UI),
    clearChat: () => {
        UI.elements.chatMessages.innerHTML = '';
    }
};
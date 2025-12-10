document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messagesList = document.getElementById('messages-list');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const welcomeScreen = document.getElementById('welcome-screen');
    const loadingIndicator = document.getElementById('loading-indicator');
    const body = document.body;

    // Webhook URL
    const WEBHOOK_URL = 'https://alex.alex-automatizacion.online/webhook/ee3b9eda-41f3-427a-9b7d-d832dc319424';

    // State
    let isWaitingForResponse = false;

    // --- Helper Functions ---

    function autoResizeTextarea() {
        userInput.style.height = 'auto'; // Reset height
        userInput.style.height = userInput.scrollHeight + 'px';
    }

    function toggleTheme() {
        body.classList.toggle('dark-mode');
        const icon = themeToggle.querySelector('i');
        if (body.classList.contains('dark-mode')) {
            icon.classList.replace('ph-moon', 'ph-sun');
        } else {
            icon.classList.replace('ph-sun', 'ph-moon');
        }
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function createMessageElement(content, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', isUser ? 'user' : 'ai');

        if (!isUser) {
            // Add Avatar for AI
            const avatarDiv = document.createElement('div');
            avatarDiv.classList.add('avatar');
            avatarDiv.innerHTML = '<i class="ph-fill ph-wrench"></i>';
            messageDiv.appendChild(avatarDiv);
        }

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');

        // Simple formatter for line breaks and bold text
        if (!isUser) {
            contentDiv.innerHTML = formatMessageResponse(content);
        } else {
            contentDiv.textContent = content;
        }

        messageDiv.appendChild(contentDiv);
        return messageDiv;
    }

    function formatMessageResponse(text) {
        // Basic Markdown-like formatting replacement
        // You might want to use a library like 'marked' for full markdown support
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\n/g, '<br>'); // Line breaks
        return formatted;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text || isWaitingForResponse) return;

        // UI Updates
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.disabled = true;
        welcomeScreen.classList.add('hidden'); // Hide welcome screen

        // Add User Message
        const userMsg = createMessageElement(text, true);
        messagesList.appendChild(userMsg);
        scrollToBottom();

        // Show Loading
        isWaitingForResponse = true;
        loadingIndicator.classList.remove('hidden');
        scrollToBottom();

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mensage: text }) // Note: user requested "mensage"
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const aiResponseText = data.output || "Lo siento, hubo un error al procesar tu respuesta.";

            // Add AI Message
            const aiMsg = createMessageElement(aiResponseText, false);
            messagesList.appendChild(aiMsg);

        } catch (error) {
            console.error('Error:', error);
            const errorMsg = createMessageElement("Lo siento, no pude conectar con el servidor. Por favor intenta de nuevo.", false);
            messagesList.appendChild(errorMsg);
        } finally {
            isWaitingForResponse = false;
            loadingIndicator.classList.add('hidden');
            checkInput(); // Re-validate button state
            scrollToBottom();
            userInput.focus();
        }
    }

    function checkInput() {
        if (userInput.value.trim().length > 0 && !isWaitingForResponse) {
            sendBtn.disabled = false;
        } else {
            sendBtn.disabled = true;
        }
    }

    // --- Global Helper for Suggestion Cards ---
    window.setInput = (text) => {
        userInput.value = text;
        autoResizeTextarea();
        checkInput();
        userInput.focus();
        // Optional: Auto send or just fill? 
        // ChatGPT usually just fills or sends. Let's send for better UX.
        sendMessage();
    };

    // --- Event Listeners ---

    themeToggle.addEventListener('click', toggleTheme);

    userInput.addEventListener('input', () => {
        autoResizeTextarea();
        checkInput();
    });

    // Handle Enter key (Shift+Enter for new line)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Initialize
    userInput.focus();
});

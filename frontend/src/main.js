import './styles.css'; // Adjust path if necessary

const delSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 text-gray-800" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144M368 144L144 368"/></svg>`;
const appTitle = document.getElementById('apptitle');

const sendBtn = document.getElementById('send-button');
const queryInput = document.getElementById('query-input'); // Assuming there's an input field
const modelSelect = document.getElementById('ullama-data-model'); // select model there's an input field

const chatContainer = document.getElementById('chat-container');

// Function to create a user message element
function createUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'justify-end', 'self-end');
    messageDiv.innerHTML = `<div class="bg-gray-200 text-gray-700 p-2 rounded-md">${message}</div>`;
    return messageDiv;
}

// Function to create an AI response message with a copy button
function createAIMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'justify-start', 'flex-col');

    const aiMessageContent = document.createElement('div');
    aiMessageContent.classList.add('bg-sky-800', 'text-white', 'p-2', 'rounded-md');
    aiMessageContent.innerText = message;

    // Create the copy button
    const copyButton = document.createElement('button');
    copyButton.classList.add('ml-2', 'mt-1', 'text-gray-500', 'hover:text-gray-700');
    copyButton.innerHTML = `<svg viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg" class="clipboard"><path d="M280 64h40c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280zM64 112c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V128c0-8.8-7.2-16-16-16H304v24c0 13.3-10.7 24-24 24H192 104c-13.3 0-24-10.7-24-24V112H64zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"></path></svg>`;

    // Copy the response text to the clipboard when the button is clicked
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(message).then(() => {
            copyButton.innerHTML = '<svg viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg" class="clipboard-check"><path d="M192 0c-41.8 0-77.4 26.7-90.5 64H64C28.7 64 0 92.7 0 128V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H282.5C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM305 273L177 401c-9.4 9.4-24.6 9.4-33.9 0L79 337c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L271 239c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path></svg>';
            setTimeout(() => {
                copyButton.innerHTML = '<svg viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg" class="clipboard"><path d="M280 64h40c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280zM64 112c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V128c0-8.8-7.2-16-16-16H304v24c0 13.3-10.7 24-24 24H192 104c-13.3 0-24-10.7-24-24V112H64zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"></path></svg>';
            }, 1000);
        });
    });

    messageDiv.appendChild(aiMessageContent);
    messageDiv.appendChild(copyButton);
    return messageDiv;
}

async function loadModels() {
    try {
        // Fetch data from the backend
        const response = await fetch('/api/models', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        // Check for a successful response
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        // Parse the response data
        const data = await response.json();

        // Clear the select element before adding new options
        modelSelect.innerHTML = '';

        // Iterate over the models array and create an option for each model
        data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model; // The model name
            option.innerText = model; // Display the model name
            modelSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

// Call the loadModels function to populate the select dropdown
loadModels();

sendBtn.addEventListener('click', async () => {
    const query = queryInput.value;
    queryInput.value="";
    if (!query.trim()) return; // Ignore empty queries
    const selectedModel = modelSelect.value;
    // Display the user's query as a message
    chatContainer.appendChild(createUserMessage(query));

    // Show a loading indicator (we'll just use '...' for simplicity)
    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('flex', 'justify-start');
    loadingMessage.innerHTML = `<div class="bg-gray-200 text-white p-2 rounded-md">...</div>`;
    chatContainer.appendChild(loadingMessage);

    // Scroll chat to the bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, model: selectedModel }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let aiResponse = '';

        while (!done) {
            const { value, done: streamDone } = await reader.read();
            done = streamDone;

            if (value) {
                const chunk = decoder.decode(value, { stream: true });
                const parsedChunk = JSON.parse(chunk);
                aiResponse += parsedChunk.message.content;

                // Update the loading message with the AI response incrementally
                loadingMessage.innerHTML = `<div class="bg-sky-800 text-white p-2 rounded-md">${aiResponse}</div>`;
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }

        // Replace the loading message with the final AI response
        chatContainer.removeChild(loadingMessage);
        chatContainer.appendChild(createAIMessage(aiResponse));
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } catch (error) {
        console.error('Error in frontend:', error.message);
    }
});

// Function to show the generated file list
document.addEventListener('DOMContentLoaded', () => {
    const showListButton = document.getElementById('pdfListButton');
    const fileListSection = document.getElementById('file-list');
    const fileListDiv = document.getElementById('list-items');

    // Event listener for toggle button
    showListButton.addEventListener('click', () => {
        console.log('File List toggle');
    });
});

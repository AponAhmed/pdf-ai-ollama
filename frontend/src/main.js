import './styles.css'; // Adjust path if necessary



const delSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 text-gray-800" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144M368 144L144 368"/></svg>`;
const appTitle = document.getElementById('apptitle');

const sendBtn = document.getElementById('send-button');
const queryInput = document.getElementById('query-input'); // Assuming there's an input field
const modelSelect = document.getElementById('ullama-data-model'); // select model there's an input field
const selectPDF = document.getElementById('selectPDF');
const chatContainer = document.getElementById('chat-container');
const pdfViewWrapper = document.getElementById('pdfViewWrapper');

//const NumberOfPage = 2; //How Many Pages of PDF data will use as Content

let pdfDoc = null, currentPage = 1, extractedText;

// Elements
const pdfCanvas = document.getElementById('pdf-canvas');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const readingPages = document.getElementById('readingPages');
const currentPageTxt = document.getElementById('currentPage');

// Navigation buttons
prevPageButton.addEventListener('click', () => goToPage(currentPage - 1));
nextPageButton.addEventListener('click', () => goToPage(currentPage + 1));

currentPageTxt.addEventListener('change', () => {
    const pageNumber = parseInt(currentPageTxt.value, 10); // Convert to integer
    if (!isNaN(pageNumber)) { // Check if it's a valid number
        goToPage(pageNumber);
    } else {
        console.error("Invalid page number");
    }
});


// Backend Base URL for PDF Files
const PDF_BASE_URL = "http://localhost:3000/api/pdf/";

// Function to Load and Render PDF
async function previewPDF(pdfFile) {
    const pdfUrl = `${PDF_BASE_URL}${pdfFile}`;
    await loadPDFFromUrl(pdfUrl)
}


// Function to load and render the PDF
async function loadPDFFromUrl(pdfUrl) {
    try {
        const response = await fetch(pdfUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch PDF from URL');
        }

        const arrayBuffer = await response.arrayBuffer();
        queryInput.disabled = true;

        const typedArray = new Uint8Array(arrayBuffer);
        pdfDoc = await pdfjsLib.getDocument(typedArray).promise;

        renderPage(currentPage);

        console.log('Data Process Started');

        extractTextFromAllPages(pdfDoc).then((data) => {
            extractedText = JSON.stringify(data, null, 2); // Pretty format with 2 spaces
            console.log('Data Process Complete');
            readingPages.style.display = 'none';
            queryInput.disabled = false;
            //console.log(data);
        });

    } catch (error) {
        console.error('Error loading PDF from URL:', error);
    }
}


// Render the current page
async function renderPage(pageNumber) {
    currentPageTxt.value = pageNumber;
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    pdfCanvas.height = viewport.height;
    pdfCanvas.width = viewport.width;
    const renderContext = {
        canvasContext: pdfCanvas.getContext('2d'),
        viewport: viewport
    };
    await page.render(renderContext).promise;

    // Enable/Disable page navigation buttons
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === pdfDoc.numPages;
}

// Change page
function goToPage(pageNumber) {
    console.log(pageNumber);
    if (pageNumber >= 1 && pageNumber <= pdfDoc.numPages) {
        currentPage = pageNumber;
        renderPage(currentPage);
    }
}

// // Function to extract text from the current PDF page
async function extractTextFromPDF() {
    const page = await pdfDoc.getPage(currentPage);
    const content = await page.getTextContent();
    extractedText = content.items.map(item => item.str).join('');
}

async function extractTextFromAllPages(pdfDoc) {
    readingPages.style.display = 'inline-block';
    const totalPages = pdfDoc.numPages; // Get the total number of pages
    const extractedText = []; // Array to store text from all pages

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        // if (pageNumber > NumberOfPage) {
        //     break; //
        // }
        readingPages.innerHTML = 'Reading page:' + pageNumber + ', Please wait...'
        const page = await pdfDoc.getPage(pageNumber); // Get the page
        const content = await page.getTextContent(); // Get the text content of the page
        const pageText = content.items.map(item => item.str).join('')
            .replace(/\u0000/g, '') // Remove all occurrences of \u0000 (null characters)
            .replace(/\.{2,}/g, '.'); // Replace consecutive dots (.., . ., etc.) with a single dot

        extractedText.push({ pageNumber, text: pageText }); // Store the page number and its text
    }

    return extractedText; // Return all extracted text
}




// Event Listener for the <select> Dropdown
selectPDF.addEventListener("change", (event) => {
    const selectedPDF = event.target.value;
    if (selectedPDF) {
        pdfViewWrapper.classList.remove("hidden");
        previewPDF(selectedPDF);
    } else {
        alert("Please select a valid PDF.");
    }
});

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
    queryInput.value = "";
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
            body: JSON.stringify({ query, model: selectedModel, context: extractedText }),
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


document.addEventListener('DOMContentLoaded', () => {
    const selectPDF = document.getElementById('selectPDF');
    const uploadButton = document.getElementById('upload-pdf-file');
    const pdfInput = document.getElementById('pdf-input'); // Hidden file input
    const pdfListUrl = '/api/pdfs'; // Endpoint to fetch the list of PDFs
    const chatWrap = document.getElementById('list-items');

    // Trigger the hidden file input when the upload button is clicked
    uploadButton.addEventListener('click', () => {
        pdfInput.click(); // Opens the file dialog
    });

    // Handle file selection from the file input
    pdfInput.addEventListener('change', () => {
        const file = pdfInput.files[0];
        if (file && file.type === 'application/pdf') {
            // Upload the PDF file after selection
            uploadPDF(file);
        } else {
            alert('Please select a valid PDF file.');
        }
    });

    // Function to upload the selected PDF
    async function uploadPDF(file) {
        const formData = new FormData();
        formData.append('pdf', file); // Attach the selected file to the form data

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.message === 'PDF file uploaded successfully') {
                alert('PDF uploaded successfully!');

                // Refresh the PDF list after upload
                await fetchPDFList();

                // Set the newly uploaded file as the selected item
                selectPDF.value = data.file.originalname; // Select the newly uploaded file in the dropdown
				if(pdfViewWrapper.classList.contains('hidden')){
					pdfViewWrapper.classList.remove('hidden');
				}
                previewPDF(selectPDF.value);
            } else {
                alert(data.message || 'Error uploading PDF');
            }
        } catch (error) {
            console.error('Error uploading PDF:', error);
            alert('Error uploading PDF');
        }
    }

    // Function to fetch the list of PDFs and populate the dropdown (Async)
    async function fetchPDFList() {
        try {
            const response = await fetch(pdfListUrl);
            const pdfs = await response.json();

            // Update the select dropdown
            selectPDF.innerHTML = '<option value="">Select PDF</option>'; // Reset options
            pdfs.forEach(pdf => {
                const option = document.createElement('option');
                option.value = pdf;
                option.textContent = pdf;
                selectPDF.appendChild(option);
            });

            // Populate the file list with delete buttons
            chatWrap.innerHTML = ''; // Clear existing list items
            pdfs.forEach(pdf => {
                const listItem = document.createElement('li');
                listItem.classList.add('flex', 'justify-between', 'items-center', 'p-2', 'bg-gray-100', 'rounded-md', 'my-2');

                const pdfName = document.createElement('span');
                pdfName.classList.add('text-gray-800', 'font-semibold');
                pdfName.textContent = pdf;

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('text-red-500', 'hover:text-gray-500', 'px-2', 'rounded-full', 'border', 'border-gray-500', 'bg-white', 'text-xs');
                deleteButton.innerHTML = delSvg;

                // Add delete button event
                deleteButton.addEventListener('click', () => deletePDF(pdf));

                // Append the PDF name and delete button to the list item
                listItem.appendChild(pdfName);
                listItem.appendChild(deleteButton);

                // Append the list item to the file list
                chatWrap.appendChild(listItem);
            });
        } catch (error) {
            console.error('Error fetching PDF list:', error);
        }
    }

    // Function to delete a PDF file
    async function deletePDF(pdf) {
        if (confirm(`Are you sure you want to delete ${pdf}?`)) {
            try {
                const response = await fetch(`/api/delete/${pdf}`, {
                    method: 'DELETE',
                });
                const data = await response.json();

                if (data.message === 'PDF deleted successfully') {
                    alert('PDF deleted successfully!');
                    fetchPDFList(); // Re-fetch the PDF list after deletion
                } else {
                    alert(data.message || 'Error deleting PDF');
                }
            } catch (error) {
                console.error('Error deleting PDF:', error);
                alert('Error deleting PDF');
            }
        }
    }

    // Fetch the PDF list when the page loads
    fetchPDFList();
});


// Function to show the generated file list
document.addEventListener('DOMContentLoaded', () => {
    const showListButton = document.getElementById('pdfListButton');
    const fileListSection = document.getElementById('file-list');
    const chatWrap = document.getElementById('chat-wrap');

    // Initially hide the file list sections
    fileListSection.classList.add('hidden');
    //chatWrap.style.display = 'none';

    // Event listener for the toggle button
    showListButton.addEventListener('click', () => {
        // Toggle the visibility of the file list sections
        if (fileListSection.classList.contains('hidden')) {
            fileListSection.classList.remove('hidden'); // Show the file list section
            appTitle.innerHTML = "Uploaded Files";
            modelSelect.classList.add('hidden');
            selectPDF.classList.add('hidden');
            pdfViewWrapper.classList.add('hidden');
        } else {
            fileListSection.classList.add('hidden'); // Show the file list section
            appTitle.innerHTML = "AI From PDF";
            modelSelect.classList.remove('hidden');
            selectPDF.classList.remove('hidden');
            pdfViewWrapper.classList.remove('hidden');
        }

        if (chatWrap.classList.contains('hidden')) {
            chatWrap.classList.remove('hidden'); // Show the file list items
            appTitle.innerHTML = "AI From PDF";
            modelSelect.classList.remove('hidden');
            selectPDF.classList.remove('hidden');
            pdfViewWrapper.classList.remove('hidden');
        } else {
            chatWrap.classList.add('hidden'); // Hide the file list items
            appTitle.innerHTML = "Uploaded  List";
            modelSelect.classList.add('hidden');
            selectPDF.classList.add('hidden');
            pdfViewWrapper.classList.add('hidden');
        }

        if (selectPDF.value == null) {
            pdfViewWrapper.classList.add('hidden');
        }
    });
});


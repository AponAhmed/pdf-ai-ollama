// backend/server.js

import express from 'express';
import ollama from 'ollama';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer'; // Import multer


// Get the current directory in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const router = express.Router();
const PORT = 3001;


// Ensure the PDF directory exists
const pdfDir = path.join(__dirname, 'pdf');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir);  // Create pdf directory if it doesn't exist
}
// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pdfDir);  // Save the file in the pdf directory
    },
    filename: (req, file, cb) => {
        // Keep the original file name
        cb(null, file.originalname); // Use original file name
    },
});

// Initialize multer with file size limit and file filter
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed'), false);
        }
        cb(null, true);
    },
});

// Endpoint to upload PDF files
// Endpoint to upload PDF files
router.post('/upload', upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Send success response with the uploaded file information
    res.status(200).json({
        message: 'PDF file uploaded successfully',
        file: req.file, // Send the uploaded file details
    });
});

// Endpoint to delete a PDF file
router.delete('/delete/:pdf', (req, res) => {
    const { pdf } = req.params;
    const filePath = path.join(__dirname, 'pdf', pdf);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error deleting PDF file' });
        }
        res.status(200).json({ message: 'PDF deleted successfully' });
    });
});

// Endpoint to get a list of PDF files
router.get('/pdfs', (req, res) => {
    fs.readdir(pdfDir, (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading directory' });
        }

        // Filter out only PDF files
        const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
        res.status(200).json(pdfFiles);
    });
});


router.post('/query', async (req, res) => {
    const query = req.body.query;
    const model = req.body.model ?? 'llama3.2:1b';
    const context = req.body.context;

    let prompt = `Based on the following content from the PDF document, answer the user's question:\n\nContent: "${context}"\n\nQuestion: "${query}"\n\nAnswer:`;

    if (!context || context == "") {
        prompt = query;
    }

    try {
        const response = await ollama.chat({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            stream: true, // Enable streaming
        });

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of response) {
            res.write(JSON.stringify(chunk) + '\n'); // Send each chunk as a JSON string
        }

        res.end(); // End the stream
    } catch (error) {
        console.error('Error interacting with the model:', error);
        res.status(500).send({ error: 'Error interacting with the model' });
    }
});

router.get('/models', async (req, res) => {
    try {
        // Fetch data from the external API endpoint
        const response = await fetch('http://localhost:11434/api/tags');

        if (!response.ok) {
            throw new Error('Failed to fetch models from external API');
        }

        const data = await response.json();

        // Extract just the model names
        const modelNames = data.models.map(model => model.model); // Extracts "model" field

        // Send the array of model names as a JSON response
        res.json({ models: modelNames });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

router.get('/pdf/:filename', (req, res) => {

    const filename = req.params.filename; // Get the filename from the URL
    const filePath = path.join(__dirname, 'pdf', filename); // Construct the file path

    // Serve the PDF file
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error serving file:', err);
            res.status(404).send({ error: 'File not found' });
        }
    });
});




app.use('/api', router);


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

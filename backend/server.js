// backend/server.js

import express from 'express';
import axios from 'axios';
import ollama from 'ollama';


const app = express();
const router = express.Router();
const PORT = 3001;

// Enable CORS for all origins (or you can configure specific origins)

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const UsrData = ``;


const Prompt = ``;

router.post('/query', async (req, res) => {
    const query = req.body.query;
    const model = req.body.model ?? 'llama3.2:1b';
    try {
        const response = await ollama.chat({
            model: model,
            messages: [{ role: 'user', content: `${Prompt} User Question:${query}` }],
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

app.use('/api', router);


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

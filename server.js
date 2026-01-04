import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)));
const VERSION = pkg.version;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

console.log('--- Server Configuration ---');
console.log('PORT:', PORT);
console.log('GOOGLE_GENAI_API_KEY exists:', !!process.env.GOOGLE_GENAI_API_KEY);
if (process.env.GOOGLE_GENAI_API_KEY) {
    console.log('GOOGLE_GENAI_API_KEY length:', process.env.GOOGLE_GENAI_API_KEY.length);
}
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('---------------------------');

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Config check
app.get('/api/config', (req, res) => {
    const rawKey = process.env.GOOGLE_GENAI_API_KEY;
    const apiKey = getCleanApiKey(rawKey);
    console.log(`[Config Check] Raw key exists: ${!!rawKey}, Clean key exists: ${!!apiKey}`);

    res.json({
        hasApiKey: !!apiKey,
        isProduction: process.env.NODE_ENV === 'production',
        version: VERSION
    });
});

// Robust key parsing logic
function getCleanApiKey(key) {
    if (!key) return null;
    if (key.length === 78) {
        const half = key.length / 2;
        const firstHalf = key.substring(0, half);
        const secondHalf = key.substring(half);
        if (firstHalf === secondHalf) {
            console.warn('GOOGLE_GENAI_API_KEY duplication detected. Using the single-instance key.');
            return firstHalf;
        }
    }
    return key;
}

// Gemini API Endpoint
app.post('/api/extract', async (req, res) => {
    console.log('[Extract Request] Processing new extraction request...');
    const { imageData, mimeType, model = 'gemini-1.5-flash' } = req.body;
    const cleanModel = model.replace(/^models\//, '');
    const apiKey = getCleanApiKey(process.env.GOOGLE_GENAI_API_KEY);

    if (!apiKey) {
        console.error('[Extract Request] FAILED: GOOGLE_GENAI_API_KEY is not set.');
        return res.status(500).json({ error: { message: 'GOOGLE_GENAI_API_KEY is not set on the server.' } });
    }

    if (!imageData || !mimeType) {
        return res.status(400).json({ error: { message: 'Image data and mime type are required.' } });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelInstance = genAI.getGenerativeModel({ model: cleanModel });

        const result = await modelInstance.generateContent([
            {
                text: 'Extract all text from this image. Provide the text exactly as it appears, maintaining the original formatting and structure as much as possible. If there is no text in the image, say "No text found in image".'
            },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: imageData
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        res.json({ text });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: { message: error.message || 'Failed to extract text from Gemini' } });
    }
});

// AI Generation Endpoint
app.post('/api/generate-prompt', async (req, res) => {
    const { text, model = 'gemini-1.5-flash' } = req.body;
    const cleanModel = model.replace(/^models\//, '');
    const apiKey = getCleanApiKey(process.env.GOOGLE_GENAI_API_KEY);

    if (!apiKey) {
        return res.status(500).json({ error: { message: 'GOOGLE_GENAI_API_KEY is not set on the server.' } });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelInstance = genAI.getGenerativeModel({
            model: cleanModel,
            generationConfig: { responseMimeType: 'application/json' }
        });

        const systemInstruction = `
        You are an expert prompt engineer for "Nanobana Pro" and other high-end image generation models.
        Your task is to take extracted text (from an OCR scan) and transform it into a highly detailed, artistic, and creative image generation prompt.
        
        Strictly return a JSON object with the following fields:
        - title: A creative title for the image in Traditional Chinese.
        - description: A brief, artistic description of the scene in Traditional Chinese.
        - prompt: A detailed English prompt for image generation.
        - tags: An array of 5-8 relevant creative tags.

        Analyze the tone, subject, and keywords of the text provided to inspire the scene.
    `;

        const result = await modelInstance.generateContent(`${systemInstruction}\n\nExtracted Text to analyze:\n${text}`);
        const response = await result.response;
        const resultText = response.text();

        res.json(JSON.parse(resultText));
    } catch (error) {
        console.error('AI Gen Error:', error);
        res.status(500).json({ error: { message: error.message || 'Failed to generate prompt' } });
    }
});

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

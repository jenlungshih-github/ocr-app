import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    deleteDoc,
    doc
} from "firebase/firestore";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";

// DOM Elements
const apiKeyInput = document.getElementById('apiKeyInput');
const toggleApiKey = document.getElementById('toggleApiKey');
const saveApiKey = document.getElementById('saveApiKey');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const driveLink = document.getElementById('driveLink');
const previewSection = document.getElementById('previewSection');
const imagePreview = document.getElementById('imagePreview');
const removeImage = document.getElementById('removeImage');
const tokenSection = document.getElementById('tokenSection');
const tokenCount = document.getElementById('tokenCount');
const imageSize = document.getElementById('imageSize');
const extractBtn = document.getElementById('extractBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const resultsColumn = document.getElementById('resultsColumn');
const mainGrid = document.getElementById('mainGrid');
const resultsContent = document.getElementById('resultsContent');
const copyBtn = document.getElementById('copyBtn');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const dismissError = document.getElementById('dismissError');
const apiConfigSection = document.getElementById('apiConfigSection');
const uploadSection = document.getElementById('uploadSection');

// Firebase UI Elements
const configureFirebaseBtn = document.getElementById('configureFirebaseBtn');
const firebaseConfigModal = document.getElementById('firebaseConfigModal');
const closeFirebaseConfig = document.getElementById('closeFirebaseConfig');
const saveFirebaseConfig = document.getElementById('saveFirebaseConfig');
const historyList = document.getElementById('historyList');
const historySearch = document.getElementById('historySearch');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const historySidebar = document.getElementById('historySidebar');

// Firebase State
let db = null;
let storage = null;
let app = null;
let scansUnsubscribe = null;

// State
let currentImage = null;
let currentImageData = null; // Base64 for Gemini
let estimatedTokens = 0;
let selectedModel = 'models/gemini-1.5-flash'; // Fallback

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadApiKey();
    setupEventListeners();
    initFirebase(); // Try to init if config exists

    if (getApiKey()) {
        fetchModels();
    }
});

// Load API key from session storage
function loadApiKey() {
    const savedKey = sessionStorage.getItem('gemini_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
        apiConfigSection.style.display = 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    try {
        console.log("Setting up event listeners...");
        // API Key
        toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
        saveApiKey.addEventListener('click', saveApiKeyToStorage);
        // Debug:
        // saveApiKey.addEventListener('click', () => alert('Save clicked!'));

        // Upload
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop bubbling to uploadArea
            fileInput.value = ''; // Reset value to allow selecting same file again
            fileInput.click();
        });
        fileInput.addEventListener('change', handleFileSelect);
        uploadArea.addEventListener('click', () => {
            fileInput.value = ''; // Reset value to allow selecting same file again
            fileInput.click();
        });
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);

        // Google Drive
        driveLink.addEventListener('input', handleDriveLinkInput);

        // Preview
        removeImage.addEventListener('click', clearImage);

        // Extract
        extractBtn.addEventListener('click', extractText);

        // Results
        const startOver = document.getElementById('startOverBtn');
        if (startOver) startOver.addEventListener('click', clearImage);

        copyBtn.addEventListener('click', copyToClipboard);

        // Error
        dismissError.addEventListener('click', hideError);

        // Firebase UI
        /* configureFirebaseBtn removed */
        closeFirebaseConfig.addEventListener('click', () => {
            firebaseConfigModal.classList.add('hidden');
        });
        saveFirebaseConfig.addEventListener('click', saveFirebaseConfigHandler);

        // History
        historySearch.addEventListener('input', (e) => filterHistory(e.target.value));
        toggleHistoryBtn.addEventListener('click', () => {
            historySidebar.classList.toggle('active');
        });

        console.log("Event listeners set up!");
    } catch (e) {
        alert("Script Error: " + e.message);
        console.error(e);
    }
}

// ------------------------------------------------------------------
// FIREBASE LOGIC
// ------------------------------------------------------------------

function initFirebase() {
    let firebaseConfig;
    const configStr = localStorage.getItem('firebase_config');

    if (configStr) {
        firebaseConfig = JSON.parse(configStr);
    } else {
        // Default config from user screenshot
        firebaseConfig = {
            apiKey: "AIzaSyDGpQzs6fTwGNNOPvnjCb-Xe12YFL_28F8",
            authDomain: "ocr-app-245f9.firebaseapp.com",
            projectId: "ocr-app-245f9",
            storageBucket: "ocr-app-245f9.firebasestorage.app",
            messagingSenderId: "950621032170",
            appId: "1:950621032170:web:57b766c47a1a1a634ad193"
        };
        // Save for UI consistency
        localStorage.setItem('firebase_config', JSON.stringify(firebaseConfig));
    }

    if (!firebaseConfig) return;

    try {
        // Use the config we prepared above
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        storage = getStorage(app);

        console.log('Firebase initialized');
        subscribeToHistory();
        /* dbStatus static update - no longer needed to inject HTML as it is static in HTML now, 
           but if we want to toggle dynamic status we can. 
           For now, let's just log it or ensure the element exists. 
           Actually, the HTML I wrote has "DB Connected" hardcoded. 
           So we don't need to change innerHTML unless we want to "activate" it.
           Let's just remove the innerHTML set to avoid the error. */
        const dbStatus = document.getElementById('dbStatus');
        if (dbStatus) {
            dbStatus.style.display = 'flex'; // Ensure visible on success
        }
    } catch (e) {
        console.error('Firebase init failed', e);
        showError('Firebase configuration is invalid');
    }
}

function loadFirebaseConfigInputs() {
    const configStr = localStorage.getItem('firebase_config');
    if (configStr) {
        const config = JSON.parse(configStr);
        document.getElementById('fbApiKey').value = config.apiKey || '';
        document.getElementById('fbAuthDomain').value = config.authDomain || '';
        document.getElementById('fbProjectId').value = config.projectId || '';
        document.getElementById('fbStorageBucket').value = config.storageBucket || '';
        document.getElementById('fbMessagingSenderId').value = config.messagingSenderId || '';
        document.getElementById('fbAppId').value = config.appId || '';
    }
}

function saveFirebaseConfigHandler() {
    const config = {
        apiKey: document.getElementById('fbApiKey').value.trim(),
        authDomain: document.getElementById('fbAuthDomain').value.trim(),
        projectId: document.getElementById('fbProjectId').value.trim(),
        storageBucket: document.getElementById('fbStorageBucket').value.trim(),
        messagingSenderId: document.getElementById('fbMessagingSenderId').value.trim(),
        appId: document.getElementById('fbAppId').value.trim(),
    };

    if (!config.apiKey || !config.projectId) {
        alert('API Key and Project ID are required');
        return;
    }

    localStorage.setItem('firebase_config', JSON.stringify(config));
    firebaseConfigModal.classList.add('hidden');
    showSuccess('Firebase config saved!');

    // Re-init
    initFirebase();
}

function subscribeToHistory() {
    if (!db) return;

    if (scansUnsubscribe) {
        scansUnsubscribe();
    }

    const q = query(
        collection(db, "scans"),
        orderBy("timestamp", "desc"),
        limit(50)
    );

    scansUnsubscribe = onSnapshot(q, (snapshot) => {
        const scans = [];
        snapshot.forEach((doc) => {
            scans.push({ id: doc.id, ...doc.data() });
        });
        renderHistoryList(scans);
    }, (error) => {
        console.error("History sync error:", error);
    });
}

async function saveScanToHistory(text) {
    if (!db || !storage || !currentImage) return;

    try {
        // 1. Upload Image
        const filename = `scans/${Date.now()}_${currentImage.name}`;
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, currentImage);
        const imageUrl = await getDownloadURL(snapshot.ref);

        // 2. Save Metadata
        const keywords = generateKeywords(text);

        await addDoc(collection(db, "scans"), {
            timestamp: serverTimestamp(),
            text: text,
            imageUrl: imageUrl,
            thumbnailUrl: imageUrl, // Use full image as thumb for simplicity
            tokenCount: estimatedTokens,
            keywords: keywords,
            fileMeta: {
                name: currentImage.name,
                size: currentImage.size,
                type: currentImage.type
            }
        });

        showSuccess('Saved to history');

    } catch (e) {
        console.error('Save to history failed', e);
        showError('Failed to save to history: ' + e.message);
    }
}

async function deleteScan(e, scanId, imageUrl) {
    e.stopPropagation(); // Prevent loading the scan

    if (!confirm('Are you sure you want to delete this scan history?')) return;

    try {
        // 1. Delete from Firestore
        await deleteDoc(doc(db, "scans", scanId));

        showSuccess('Scan deleted');

    } catch (err) {
        console.error("Delete failed", err);
        showError("Failed to delete: " + err.message);
    }
}

function generateKeywords(text) {
    if (!text) return [];
    // Simple keyword extraction: take first 20 words > 3 chars
    return text.split(/\s+/)
        .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .filter(w => w.length > 3)
        .slice(0, 20);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// UI: Render History
let allScans = []; // Store for client-side filtering

function renderHistoryList(scans) {
    allScans = scans;
    filterHistory(historySearch.value);
}

function filterHistory(query) {
    const q = query.toLowerCase();
    const filtered = allScans.filter(scan => {
        if (!q) return true;
        return scan.text.toLowerCase().includes(q) ||
            (scan.keywords && scan.keywords.some(k => k.includes(q)));
    });

    historyList.innerHTML = '';

    if (filtered.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <p>No matches found</p>
            </div>
        `;
        return;
    }

    filtered.forEach(scan => {
        const el = document.createElement('div');
        el.className = 'history-item';
        el.onclick = () => loadHistoryItem(scan);

        // Format date
        const date = scan.timestamp ? new Date(scan.timestamp.seconds * 1000).toLocaleDateString() : 'Just now';

        // Thumbnail handling
        const thumbUrl = scan.imageUrl || ''; // Fallback

        // File info
        const fileInfo = scan.fileMeta ?
            `<div class="history-file-info">${scan.fileMeta.name} (${formatFileSize(scan.fileMeta.size)})</div>` : '';

        el.innerHTML = `
            <img src="${thumbUrl}" class="history-thumbnail" loading="lazy">
            <div class="history-content">
                <div class="history-date">${date}</div>
                ${fileInfo}
                <div class="history-snippet" title="${scan.text}">${scan.text.substring(0, 50)}...</div>
            </div>
            <button class="delete-history-btn" aria-label="Delete">×</button>
        `;

        // Add delete listener
        el.querySelector('.delete-history-btn').addEventListener('click', (e) => deleteScan(e, scan.id, scan.imageUrl));

        historyList.appendChild(el);
    });
}

async function loadHistoryItem(scan) {
    // 1. Set text results
    resultsContent.textContent = scan.text;
    resultsSection.classList.remove('hidden');
    resultsColumn.classList.remove('hidden');

    // 2. Set image preview
    if (scan.imageUrl) {
        imagePreview.src = scan.imageUrl;
        previewSection.classList.remove('hidden');
        uploadSection.classList.add('hidden');
    }

    // 3. Set tokens
    if (scan.tokenCount) {
        tokenCount.textContent = scan.tokenCount.toLocaleString();
        imageSize.textContent = "Loaded from History";
        tokenSection.classList.remove('hidden');
    }

    // 4. Update Grid
    mainGrid.classList.add('split-view');

    // 5. Highlight active item
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    // (We'd ideally highlight the one clicked, but `this` context is tricky here without unique IDs on DOM elements)
}

// ------------------------------------------------------------------
// EXISTING LOGIC (Refactored for Module)
// ------------------------------------------------------------------

// API Key functions
function toggleApiKeyVisibility() {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;
}

function saveApiKeyToStorage() {
    const key = apiKeyInput.value.trim();
    if (!key) {
        showError('Please enter an API key');
        return;
    }

    sessionStorage.setItem('gemini_api_key', key);
    apiConfigSection.style.display = 'none';
    showSuccess('API key saved successfully!');
    fetchModels();
}

function getApiKey() {
    return sessionStorage.getItem('gemini_api_key') || apiKeyInput.value.trim();
}

// Fetch available models
async function fetchModels() {
    const apiKey = getApiKey();
    if (!apiKey) return;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) return; // Silent fail, keep fallback

        const data = await response.json();
        if (data.models) {
            // Filter for Flash models that support generateContent
            const flashModels = data.models.filter(model =>
                (model.name.includes('flash') || model.displayName?.toLowerCase().includes('flash')) &&
                model.supportedGenerationMethods?.includes('generateContent')
            );

            if (flashModels.length > 0) {
                // Sort to get the latest version (usually higher version number or 'latest')
                const preferred = flashModels.find(m => m.name.includes('1.5-flash-002')) ||
                    flashModels.find(m => m.name.includes('1.5-flash-latest')) ||
                    flashModels[0];

                selectedModel = preferred.name;
                console.log('Selected model:', selectedModel);
            }
        }
    } catch (e) {
        console.error('Failed to fetch models', e);
    }
}

// File upload handlers
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        processImageFile(file);
    } else {
        showError('Please drop a valid image file');
    }
}

// Google Drive handler
async function handleDriveLinkInput(e) {
    const url = e.target.value.trim();
    if (!url) return;

    // Check if it's a Google Drive link
    if (url.includes('drive.google.com')) {
        try {
            const directUrl = convertDriveUrl(url);
            await loadImageFromUrl(directUrl);
        } catch (error) {
            showError('Failed to load image from Google Drive. Make sure the file is shared publicly.');
        }
    }
}

function convertDriveUrl(url) {
    // Extract file ID from various Google Drive URL formats
    let fileId = null;

    // Format: https://drive.google.com/file/d/FILE_ID/view
    const match1 = url.match(/\/file\/d\/([^\/]+)/);
    if (match1) {
        fileId = match1[1];
    }

    // Format: https://drive.google.com/open?id=FILE_ID
    const match2 = url.match(/[?&]id=([^&]+)/);
    if (match2) {
        fileId = match2[1];
    }

    if (!fileId) {
        throw new Error('Invalid Google Drive URL');
    }

    // Return direct download URL
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

async function loadImageFromUrl(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();

        if (!blob.type.startsWith('image/')) {
            throw new Error('URL does not point to an image');
        }

        const file = new File([blob], 'drive-image.jpg', { type: blob.type });
        processImageFile(file);
    } catch (error) {
        throw error;
    }
}

// Process image file
async function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
    }

    // Check file size (max 20MB for Gemini)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
        showError('Image file is too large. Maximum size is 20MB.');
        return;
    }

    currentImage = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewSection.classList.remove('hidden');
        uploadSection.classList.add('hidden'); // Hide upload section

        // Calculate tokens
        calculateTokens(file);

        // Check for duplicates
        const duplicate = checkDuplicateScan(file);
        if (duplicate) {
            // Delay slightly to let preview render
            setTimeout(() => {
                if (!confirm(`You have already scanned "${file.name}".\n\nDo you want to continue?`)) {
                    clearImage();
                }
            }, 100);
        }
    };
    reader.readAsDataURL(file);

    // Convert to base64 for API
    const base64Reader = new FileReader();
    base64Reader.onload = (e) => {
        currentImageData = e.target.result.split(',')[1]; // Remove data:image/...;base64, prefix
    };
    base64Reader.readAsDataURL(file);

    // Hide results and errors
    resultsSection.classList.add('hidden');
    resultsColumn.classList.add('hidden');
    mainGrid.classList.remove('split-view');
    errorSection.classList.add('hidden');
}

// Calculate token estimation
function calculateTokens(file) {
    // Create an image to get dimensions
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
        const width = img.width;
        const height = img.height;

        // Gemini token calculation (approximate)
        // Base tokens for image: ~258 tokens
        // Additional tokens based on resolution
        const baseTokens = 258;
        const pixelTokens = Math.ceil((width * height) / 750);
        estimatedTokens = baseTokens + pixelTokens;

        // Display information
        tokenCount.textContent = estimatedTokens.toLocaleString();
        imageSize.textContent = `${width} × ${height}px (${formatFileSize(file.size)})`;
        tokenSection.classList.remove('hidden');

        URL.revokeObjectURL(url);
    };

    img.src = url;
}

// Clear image
function clearImage() {
    currentImage = null;
    currentImageData = null;
    estimatedTokens = 0;
    fileInput.value = '';
    driveLink.value = '';
    previewSection.classList.add('hidden');
    uploadSection.classList.remove('hidden'); // Show upload section
    tokenSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    resultsColumn.classList.add('hidden');
    mainGrid.classList.remove('split-view');
    errorSection.classList.add('hidden');
}

// Extract text using Gemini API
async function extractText() {
    const apiKey = getApiKey();

    if (!apiKey) {
        showError('Please enter your Gemini API key first');
        apiConfigSection.style.display = 'block';
        return;
    }

    if (!currentImageData) {
        showError('Please upload an image first');
        return;
    }

    // Show loading
    loadingSection.classList.remove('hidden');
    resultsColumn.classList.remove('hidden');
    resultsSection.classList.remove('hidden');
    errorSection.classList.add('hidden');
    mainGrid.classList.add('split-view');

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: 'Extract all text from this image. Provide the text exactly as it appears, maintaining the original formatting and structure as much as possible. If there is no text in the image, say "No text found in image".'
                                },
                                {
                                    inline_data: {
                                        mime_type: currentImage.type,
                                        data: currentImageData
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2048,
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        const extractedText = data.candidates[0]?.content?.parts[0]?.text || 'No text extracted';

        // Show results
        loadingSection.classList.add('hidden');
        resultsContent.textContent = extractedText;
        resultsSection.classList.remove('hidden');
        resultsColumn.classList.remove('hidden');
        mainGrid.classList.add('split-view');

        // Save to Firebase History
        saveScanToHistory(extractedText);

    } catch (error) {
        loadingSection.classList.add('hidden');
        showError(`Failed to extract text: ${error.message}`);
    }
}

// Copy to clipboard
async function copyToClipboard() {
    const text = resultsContent.textContent;

    try {
        await navigator.clipboard.writeText(text);

        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <svg class="btn-icon-left" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Copied!
        `;

        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    } catch (error) {
        showError('Failed to copy to clipboard');
    }
}

// Error handling
function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorSection.classList.add('hidden');
    }, 5000);
}

function hideError() {
    errorSection.classList.add('hidden');
}

function showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'card';
    successDiv.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: rgba(67, 233, 123, 0.2);
        border-color: rgba(67, 233, 123, 0.4);
        padding: 1rem 1.5rem;
        z-index: 1000;
        animation: fadeInDown 0.3s ease;
    `;
    successDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="20 6 9 17 4 12" stroke="#43e97b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span style="color: #43e97b; font-weight: 500;">${message}</span>
    </div>
`;

    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.style.animation = 'fadeInUp 0.3s ease reverse';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

function checkDuplicateScan(file) {
    if (!db || !allScans.length) return null;

    // Check if any scan has same filename and size
    return allScans.find(scan =>
        scan.fileMeta &&
        scan.fileMeta.name === file.name &&
        scan.fileMeta.size === file.size
    );
}

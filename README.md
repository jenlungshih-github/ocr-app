# Gemini Image OCR

![Version](https://img.shields.io/badge/version-1.2.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A modern web application for extracting text from images using Google's Gemini AI, with Firebase integration for persistent history and intelligent duplicate detection.

## Features

- 🖼️ **Image Upload**: Drag-and-drop or browse to select images
- 🔗 **Google Drive Integration**: Paste Drive links to load images directly
- 🤖 **AI-Powered OCR**: Uses Gemini 1.5 Flash for accurate text extraction
- 📊 **Token Estimation**: Real-time calculation of API token usage
- 💾 **Persistent History**: All scans saved to Firebase with metadata
- 🔍 **Smart Search**: Filter history by text content or keywords
- ⚠️ **Duplicate Detection**: Warns when uploading previously scanned files
- 🗑️ **History Management**: Delete individual scan records
- 🎨 **Modern UI**: Dark theme with glassmorphism effects

## Tech Stack

### Frontend
- **HTML5**: Semantic markup with modern structure
- **CSS3**: Custom properties, flexbox, animations
- **JavaScript (ES6+)**: Modules, async/await, modern APIs

### Backend Services
- **Firebase Firestore**: NoSQL database for scan metadata
- **Firebase Storage**: Cloud storage for images
- **Google Gemini API**: AI-powered text extraction

### Development Tools
- **Vite**: Modern frontend build tool for fast development and production bundling
- **Git**: Version control
- **npm**: Package management

## Version

**Current Version**: 1.2.2

### Changelog

#### v1.2.2 (2026-01-04)
- Fixed API key fetch issue in development mode by adding Vite proxy configuration
- Incremented system version to v1.2.2
- Improved diagnostic logging with `[DEBUG]` prefixes
- Added fallback logic for model selection to improve application robustness

#### v1.2.1 (2026-01-03)
- Fixed broken layout by restoring the missing `.hidden` utility class
- Resolved "API key not found" error by correctly identifying server-side configuration
- Improved error visibility by moving the error section to a global layout position
- Added diagnostic logging for easier troubleshooting

#### v1.2.0 (2026-01-03)
- Implemented Express.js backend for secure API key management and App Hosting compatibility
- Added dynamic version display in the UI and automated version tracking
- Improved API status visibility with a dedicated "API Connected" indicator
- Secured Gemini API calls by moving them to the server-side
- Added `/api/config` and `/api/extract` endpoints

#### v1.1.0 (2026-01-02)
- Migrated to Vite for better build performance and Firebase App Hosting compatibility
- Added `package.json` and `vite.config.js`
- Standardized Firebase dependency management via npm
- Updated documentation for new build process

#### v1.0.0 (2025-12-31)
- Initial release
- Core OCR functionality with Gemini 1.5 Flash
- Firebase integration for history persistence
- Duplicate detection with user confirmation
- Delete functionality for history items
- Search and filter capabilities
- Responsive UI with modern design

## Installation

### Prerequisites

- Node.js (v14 or higher)
- Firebase account
- Google Gemini API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/jenlungshih-github/ocr-app.git
   cd ocr-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   The application will prompt for Firebase configuration on first load, or you can update the fallback config in `script.js` (lines 177-184).

4. **Run locally**
   ```bash
   npm run dev
   ```
   
   Access at `http://localhost:3000` (or the port specified by Vite)

## Firebase Hosting Deployment

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```

4. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

## Production Deployment & Secret Management

Deploying this application to Firebase App Hosting requires configuration for the `GOOGLE_GENAI_API_KEY` to ensure the AI features work in a production environment.

The application is configured in `apphosting.yaml` to use a secret named `GOOGLE_GENAI_API_KEY`. This secret must be created in Google Cloud Secret Manager and the App Hosting backend needs to be granted access to it.

### Secret Setup Steps

1.  **Login to Firebase**:
    ```bash
    firebase login --reauth
    ```

2.  **Set the Secret**: This command will create the secret if it doesn't exist or update it. You will be prompted to paste your API key.
    ```bash
    npx firebase apphosting:secrets:set GOOGLE_GENAI_API_KEY
    ```

3.  **Grant Access to the Backend**: You need to grant the App Hosting backend permission to access the secret. Replace `ocr-app` with your backend ID if it's different (you can find it with `npx firebase apphosting:backends:list`).
    ```bash
    npx firebase apphosting:secrets:grantaccess GOOGLE_GENAI_API_KEY --backend=ocr-app
    ```

4.  **Deploy**:
    ```bash
    git add .
    git commit -m "Configure App Hosting secrets"
    git push origin main
    ```

## Usage

### Getting Started

1. **Enter API Key**: On first visit, enter your Gemini API key
2. **Upload Image**: Drag-and-drop or click to browse
3. **Extract Text**: Click "Extract Text" to process
4. **View Results**: Extracted text appears in the right panel
5. **Access History**: Click the history icon to view past scans

### Duplicate Detection

When uploading a file that matches a previous scan (by name and size):
- A confirmation dialog appears
- Choose "OK" to proceed or "Cancel" to abort

### Managing History

- **Search**: Type in the search box to filter scans
- **View**: Click any history item to load it
- **Delete**: Hover over an item and click the "×" button

## API Configuration

### Gemini API Key

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

The key is stored in `sessionStorage` and must be re-entered each session.

### Firebase Configuration

The app uses hardcoded Firebase config with localStorage fallback. To customize:
1. Click the "DB Settings" modal (if implemented)
2. Enter your Firebase project details
3. Save to update the configuration

## File Structure

```
ocr-app/
├── dist/                # Production build output
├── node_modules/       # Project dependencies
├── index.html          # Main HTML entry point
├── script.js           # Core application logic
├── style.css           # Styling and animations
├── package.json        # NPM dependencies and scripts
├── vite.config.js      # Vite configuration
├── firebase.json       # Firebase hosting configuration
├── .firebaserc         # Firebase project settings
├── firestore.rules     # Firestore security rules
├── storage.rules       # Storage security rules
└── README.md           # This file
```

## Data Structure

Each scan is stored in Firestore with the following schema:

```javascript
{
  timestamp: Timestamp,
  text: String,           // Extracted text
  imageUrl: String,       // Full-resolution image URL
  thumbnailUrl: String,   // Thumbnail URL (same as imageUrl)
  tokenCount: Number,     // Estimated tokens used
  keywords: Array,        // Extracted keywords for search
  fileMeta: {
    name: String,         // Original filename
    size: Number,         // File size in bytes
    type: String          // MIME type
  }
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires ES6 module support and modern JavaScript features.

## Security Considerations

⚠️ **Important**: The current Firebase rules allow unrestricted access. For production:

1. Implement Firebase Authentication
2. Update security rules to require authentication
3. Consider rate limiting for API calls
4. Store API keys securely (environment variables for server-side)

## Performance

- **Token Estimation**: Calculated client-side before API call
- **Image Optimization**: Max 20MB file size enforced
- **Real-time Updates**: Firestore listeners for instant history sync
- **Lazy Loading**: History thumbnails load on-demand

## Troubleshooting

### API Key Issues
- Ensure key is valid and has Gemini API access enabled
- Check browser console for authentication errors

### Firebase Connection
- Verify Firebase configuration is correct
- Check browser console for initialization errors
- Ensure Firestore and Storage are enabled in Firebase Console

### Image Upload Fails
- Check file size (max 20MB)
- Verify file type is a valid image format
- Ensure Storage rules allow writes

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Google Gemini AI for OCR capabilities
- Firebase for backend infrastructure
- Modern web standards for enabling rich client-side applications

## Contact

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using modern web technologies**

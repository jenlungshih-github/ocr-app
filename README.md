# Gemini Image OCR

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
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
- **http-server**: Local development server
- **Git**: Version control

## Version

**Current Version**: 1.0.0

### Changelog

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

2. **Configure Firebase**
   
   Update the Firebase configuration in `script.js` (lines 163-170):
   ```javascript
   firebaseConfig = {
       apiKey: "YOUR_FIREBASE_API_KEY",
       authDomain: "YOUR_PROJECT.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT.firebasestorage.app",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

3. **Set up Firebase Security Rules**

   **Firestore Rules** (`firestore.rules`):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /scans/{scanId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

   **Storage Rules** (`storage.rules`):
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /scans/{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

4. **Run locally**
   ```bash
   npx -y http-server . -p 8080 -c-1
   ```
   
   Access at `http://localhost:8080`

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
├── index.html          # Main HTML structure
├── script.js           # Core application logic (822 lines)
├── style.css           # Styling and animations
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

# Gemini-Powered RSS Generator

A comprehensive serverless RSS feed generator that uses Google's Gemini AI to intelligently parse and summarize content from URLs. Includes both desktop (Chrome extension) and mobile (PWA) sharing capabilities.

## 🏗️ Architecture

- **Backend**: Firebase Cloud Functions (Node.js/TypeScript)
- **Database**: Cloud Firestore for storing feed items
- **Storage**: Cloud Storage for hosting the RSS feed file
- **AI**: Google Gemini API for content parsing and summarization
- **Hosting**: Firebase Hosting for PWA
- **Desktop Client**: Chrome browser extension
- **Mobile Client**: Progressive Web App with Share Target API

## ✨ Features

- 🤖 AI-powered content parsing using Gemini API
- 🖥️ **Chrome extension** for easy desktop sharing
- 📱 **Progressive Web App** for native mobile sharing
- 🔒 Secure API endpoint with token authentication
- ⚡ Serverless architecture with automatic scaling
- 📊 Stores up to 25 latest items in RSS feed
- 🌐 Public RSS feed accessible from any RSS reader
- ⏱️ Smart caching with 1-hour TTL
- 🎯 Cross-platform compatibility

## Setup

### Prerequisites

1. Firebase CLI installed and configured
2. Google Cloud Project with Firebase enabled
3. Gemini API key from Google AI Studio

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Firebase secrets:
   ```bash
   # Set your Gemini API key
   firebase functions:secrets:set GEMINI_API_KEY
   
   # Set your API access token (generate a secure random string)
   firebase functions:secrets:set API_TOKEN
   ```

3. Deploy to Firebase:
   ```bash
   npm run build
   firebase deploy
   ```

## 📱 Client Applications

### Chrome Extension (Desktop)

1. **Installation**: Load unpacked in `chrome://extensions/`
2. **Location**: `chrome-extension/` directory
3. **Features**: One-click sharing from any webpage
4. **Documentation**: See `chrome-extension/README.md`

### Progressive Web App (Mobile)

1. **URL**: Hosted on Firebase Hosting (your-project.web.app)
2. **Location**: `pwa/` directory  
3. **Features**: Native mobile sharing via Share Target API
4. **Documentation**: See `pwa/README.md`

## 🚀 Usage

### Desktop (Chrome Extension)
1. Install extension in Chrome
2. Configure API endpoint and token
3. Navigate to any webpage
4. Click extension icon → "Share This Page"

### Mobile (PWA)
1. Visit your Firebase Hosting URL on mobile
2. Install PWA ("Add to Home Screen")
3. Share content from any app
4. Select "RSS Share" from share options

### Direct API (Programmatic)
```bash
curl -X POST https://your-region-your-project.cloudfunctions.net/ingestUrl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{"url": "https://example.com/article"}'
```

### Accessing RSS Feed

The RSS feed is available at:
```
https://storage.googleapis.com/your-project.appspot.com/feed.xml
```

## API Reference

### POST /ingestUrl

Processes a URL and adds it to the RSS feed.

**Headers:**
- `Authorization: Bearer <API_TOKEN>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "success": true,
  "message": "URL processed and feed updated successfully",
  "feedUrl": "https://storage.googleapis.com/project.appspot.com/feed.xml",
  "itemId": "generated-document-id"
}
```

## Configuration

The RSS feed can be customized by modifying the `RSSGenerator` configuration in `src/rss-generator.ts`.

## Security

- API endpoint requires authentication via Bearer token
- Firestore rules restrict direct database access
- Storage rules allow public read access only to feed.xml
- Secrets are managed via Firebase Secret Manager

## Development

### Local Development

1. Start the Firebase emulators:
   ```bash
   npm run serve
   ```

2. Build TypeScript in watch mode:
   ```bash
   npm run dev
   ```

### Testing

Run the test suite:
```bash
npm test
```

## Monitoring

- View function logs: `firebase functions:log`
- Monitor in Firebase Console: Functions, Firestore, and Storage sections
- Set up alerts for errors and usage quotas

## Cost Optimization

- Functions only run on-demand (pay-per-execution)
- RSS feed served from Cloud Storage (minimal cost)
- Gemini API calls optimized with fallbacks
- 1-hour cache headers reduce unnecessary requests
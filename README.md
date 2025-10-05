# Gemini-Powered RSS Generator

A serverless RSS feed generator that uses Google's Gemini AI to intelligently parse and summarize content from URLs.

## Architecture

- **Backend**: Firebase Cloud Functions (Node.js/TypeScript)
- **Database**: Cloud Firestore for storing feed items
- **Storage**: Cloud Storage for hosting the RSS feed file
- **AI**: Google Gemini API for content parsing and summarization

## Features

- 🤖 AI-powered content parsing using Gemini API
- 🔒 Secure API endpoint with token authentication
- ⚡ Serverless architecture with automatic scaling
- 📊 Stores up to 25 latest items in RSS feed
- 🌐 Public RSS feed accessible from any RSS reader
- ⏱️ Smart caching with 1-hour TTL

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

## Usage

### Adding URLs to RSS Feed

Send a POST request to your Cloud Function endpoint:

```bash
curl -X POST https://your-region-your-project.cloudfunctions.net/ingestUrl \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
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
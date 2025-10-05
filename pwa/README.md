# Progressive Web App (PWA) Documentation - SmartFeed

## Overview

The PWA component enables mobile users to share content to SmartFeed directly from any app using the native share button.

## Architecture

```
Mobile App Share → System Share Sheet → SmartFeed PWA → Firebase Hosting → Cloud Function
```

## Files Structure

```
pwa/
├── index.html              # Main PWA page with installation instructions
├── share-target.html       # Handles shared content from other apps
├── manifest.json          # PWA configuration and share target setup
├── sw.js                  # Service worker for offline capabilities
└── icons/                 # PWA icons for various screen sizes
```

## How It Works

### 1. PWA Installation
- User visits the hosted PWA page
- Browser prompts to "Add to Home Screen"
- PWA is installed and appears in device's app drawer
- Share target becomes available in system share sheet

### 2. Sharing Content
- User finds content in any app (browser, news app, etc.)
- Taps the system share button
- Selects "SmartFeed" from share options
- Content URL is sent to share-target.html
- Page processes the URL via Cloud Function
- User gets immediate feedback

### 3. URL Processing Flow
```
share-target.html → /api/ingest → Cloud Function → Gemini API → Firestore → RSS Generation
```

## Configuration

### Firebase Hosting Rewrites

The PWA uses Firebase Hosting rewrites to:
1. Route `/share-target` to `share-target.html`
2. Proxy `/api/ingest` to the `ingestUrl` Cloud Function

### Manifest Configuration

Key manifest.json settings:
- `share_target`: Defines how the PWA receives shared content
- `display: "standalone"`: Makes it feel like a native app
- `start_url`: Points to the main installation page

### Security

- Requests from the PWA are trusted (validated by referer)
- No API token required for PWA requests
- Cloud Function validates the source domain

## Installation Guide

### For Users

1. **Visit the PWA**: Open the hosted URL in a mobile browser
2. **Install**: Tap "Add to Home Screen" when prompted
3. **Confirm**: Follow browser prompts to install
4. **Test**: Try sharing a webpage from any app

### For Developers

1. **Deploy**: Run `firebase deploy --only hosting`
2. **Test**: Visit your Firebase Hosting URL
3. **Verify**: Check that manifest.json is accessible
4. **Debug**: Use browser dev tools to test PWA features

## Browser Support

### Full Support
- Chrome for Android (recommended)
- Edge for Android
- Samsung Internet

### Partial Support
- Firefox for Android (manual installation)
- Safari for iOS (limited share target support)

## Troubleshooting

### PWA Not Installing
- Check that manifest.json is valid
- Ensure HTTPS is enabled (required for PWA)
- Verify service worker is registered
- Check browser console for errors

### Share Target Not Appearing
- Confirm PWA is properly installed
- Check that share_target is configured correctly
- Verify the PWA is added to home screen
- Restart the browser/device if needed

### Sharing Fails
- Check network connectivity
- Verify Cloud Function is deployed
- Check Firebase Hosting rewrites are working
- Look at browser network tab for failed requests

## Testing

### Local Development
```bash
# Start Firebase emulators
firebase emulators:start --only hosting,functions

# Visit http://localhost:5000
# Test PWA installation and sharing
```

### Production Testing
1. Deploy to Firebase: `firebase deploy`
2. Visit your .web.app or .firebaseapp.com URL
3. Install PWA on mobile device
4. Test sharing from various apps

## Customization

### Branding
- Update icons in `/icons` directory
- Modify colors in manifest.json
- Customize CSS in HTML files

### Features
- Add offline support in service worker
- Implement push notifications
- Add analytics tracking
- Create custom share buttons

## Analytics

Consider adding analytics to track:
- PWA installations
- Share button usage
- Successful/failed shares
- User engagement metrics
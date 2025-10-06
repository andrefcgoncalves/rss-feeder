# Chrome Extension: SmartFeed

A Chrome browser extension that allows users to easily share the current webpage to SmartFeed - their AI-powered RSS feed.

## Features

- 🖱️ One-click sharing from any webpage
- 🔒 Pre-configured with SmartFeed endpoint
- ⚙️ Simple API token configuration
- ✅ Visual feedback for successful/failed shares
- 🚫 Automatic filtering of non-shareable pages

## Installation

### For Development/Local Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The SmartFeed extension icon should appear in your toolbar

### Configure API Token

1. Click the SmartFeed extension icon in your toolbar
2. Click "⚙️ Settings"
3. Enter your API token (the one you set in Firebase secrets)
4. Click "Save Settings"

## Usage

1. Navigate to any webpage you want to add to your RSS feed
2. Click the SmartFeed extension icon in your toolbar
3. Click "Share This Page"
4. The extension will send the URL to your SmartFeed service
5. You'll see a success message when the page is added to your feed

## Configuration

The extension is pre-configured with your SmartFeed endpoints:
- **Ingest Endpoint**: `https://ingesturl-bnedqqqzpa-uc.a.run.app` (for sharing pages)
- **Regenerate Endpoint**: `https://regeneraterss-bnedqqqzpa-uc.a.run.app` (for updating RSS)
- **API Token**: User-configurable (stored securely in Chrome storage)

## Security

- API tokens are stored securely using Chrome's storage API
- Only HTTPS endpoints are supported
- No data is transmitted to third parties
- Extension only requests minimal permissions (activeTab, storage)

## Permissions

The extension requires minimal permissions:
- **activeTab**: To read the URL of the current tab when you click the extension
- **storage**: To securely store your API token locally

## Troubleshooting

### "Cannot share this type of page"
- The extension can only share HTTP/HTTPS webpages
- Chrome internal pages (chrome://) and browser settings cannot be shared

### "Please configure your API token first"
- Make sure you've entered your API token in Settings
- The token should match the one you set in Firebase secrets

### "Network error" or "Failed to add page"
- Check that your Firebase Cloud Function is deployed and accessible
- Verify your API token is correct

### Extension icon doesn't appear
- Check that you've loaded the extension properly in Developer mode
- Try refreshing the extensions page and reloading the extension

## Development

To modify the extension:

1. Edit the relevant files in the `chrome-extension/` directory
2. Reload the extension in `chrome://extensions/`
3. Test your changes

### File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI
├── popup.js             # UI logic
├── background.js        # Service worker
└── icons/               # Extension icons
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

## Production Distribution

For production distribution:

1. Zip the entire `chrome-extension` folder
2. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Follow Chrome Web Store review process
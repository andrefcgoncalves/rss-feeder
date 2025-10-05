# Chrome Extension: Gemini RSS Share

A Chrome browser extension that allows users to easily share the current webpage to their AI-powered RSS feed.

## Features

- 🖱️ One-click sharing from any webpage
- 🔒 Secure API token storage
- ⚙️ Easy configuration interface
- ✅ Visual feedback for successful/failed shares
- 🚫 Automatic filtering of non-shareable pages

## Installation

### For Development/Local Testing

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The extension icon should appear in your toolbar

### For Production Distribution

1. Zip the entire `chrome-extension` folder
2. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Follow Chrome Web Store review process

## Configuration

Before using the extension, you need to configure it with your RSS service details:

1. Click the extension icon in your toolbar
2. Click "⚙️ Settings"
3. Enter your API endpoint URL (from Firebase deployment)
4. Enter your secure API token
5. Click "Save Settings"

### Configuration Values

- **API Endpoint URL**: Your deployed Cloud Function URL
  - Example: `https://us-central1-your-project.cloudfunctions.net/ingestUrl`
- **API Token**: The secure token you set in Firebase Secret Manager
  - This should match the `API_TOKEN` secret in your Firebase project

## Usage

1. Navigate to any webpage you want to add to your RSS feed
2. Click the extension icon
3. Review the current page URL
4. Click "Share This Page"
5. Wait for confirmation message

## Security

- API tokens are stored using Chrome's secure storage API
- Only HTTPS endpoints are supported
- No data is transmitted to third parties
- Extension only requests minimal permissions (activeTab, storage)

## Permissions

The extension requires these minimal permissions:

- **activeTab**: To read the URL of the current tab when you click the extension
- **storage**: To securely store your API configuration locally

## Troubleshooting

### "Please configure your API settings first"
- Make sure you've entered both the API endpoint URL and token in Settings

### "Cannot share this type of page"
- The extension can only share HTTP/HTTPS webpages
- Chrome internal pages (chrome://) and browser settings cannot be shared

### "Network error" or "Failed to add page"
- Check that your API endpoint URL is correct
- Verify your API token is valid
- Ensure your Firebase Cloud Function is deployed and accessible

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
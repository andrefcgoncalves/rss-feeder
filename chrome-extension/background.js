// Background service worker for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('SmartFeed extension installed');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'shareCurrentTab') {
    handleShareCurrentTab(sendResponse);
    return true; // Will respond asynchronously
  }
});

async function handleShareCurrentTab(sendResponse) {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    // Skip non-http(s) URLs
    if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
      sendResponse({ success: false, error: 'Cannot share this type of page' });
      return;
    }

    // Get stored configuration
    const config = await chrome.storage.sync.get(['apiEndpoint', 'apiToken']);
    
    if (!config.apiEndpoint || !config.apiToken) {
      sendResponse({ 
        success: false, 
        error: 'Please configure the extension settings first' 
      });
      return;
    }

    // Make API call to the RSS ingestion endpoint
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiToken}`
      },
      body: JSON.stringify({
        url: tab.url
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      sendResponse({ 
        success: true, 
        message: 'Page added to SmartFeed successfully!',
        feedUrl: result.feedUrl
      });
    } else {
      sendResponse({ 
        success: false, 
        error: result.message || 'Failed to add page to RSS feed' 
      });
    }

  } catch (error) {
    console.error('Error sharing tab:', error);
    sendResponse({ 
      success: false, 
      error: `Network error: ${error.message}` 
    });
  }
}
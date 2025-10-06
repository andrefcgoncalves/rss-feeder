// Background service worker for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('SmartFeed extension installed');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'shareUrl') {
    handleShareUrl(request, sendResponse);
    return true; // Will respond asynchronously
  }
});

async function handleShareUrl(request, sendResponse) {
  try {
    const { url, apiEndpoint, apiToken } = request;
    
    if (!url) {
      sendResponse({ success: false, error: 'No URL provided' });
      return;
    }

    // Skip non-http(s) URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      sendResponse({ success: false, error: 'Cannot share this type of page' });
      return;
    }

    // Make API call to the SmartFeed ingestion endpoint
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        url: url
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
        error: result.message || 'Failed to add page to SmartFeed' 
      });
    }

  } catch (error) {
    console.error('Error sharing URL:', error);
    sendResponse({ 
      success: false, 
      error: `Network error: ${error.message}` 
    });
  }
}
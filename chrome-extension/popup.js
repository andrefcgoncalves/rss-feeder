// Popup script for Chrome extension
document.addEventListener('DOMContentLoaded', async function() {
  const currentUrlDiv = document.getElementById('currentUrl');
  const shareBtn = document.getElementById('shareBtn');
  const shareText = document.getElementById('shareText');
  const spinner = document.getElementById('spinner');
  const configBtn = document.getElementById('configBtn');
  const configForm = document.getElementById('configForm');
  const statusDiv = document.getElementById('status');
  const apiEndpointInput = document.getElementById('apiEndpoint');
  const apiTokenInput = document.getElementById('apiToken');
  const saveConfigBtn = document.getElementById('saveConfig');
  const cancelConfigBtn = document.getElementById('cancelConfig');

  let currentTab = null;
  let isConfigMode = false;

  // Get current tab info
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    if (tab && tab.url) {
      currentUrlDiv.textContent = tab.url;
      
      // Check if URL is shareable
      if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
        shareBtn.disabled = true;
        shareText.textContent = 'Cannot share this page';
        showStatus('This type of page cannot be shared', 'error');
      }
    } else {
      currentUrlDiv.textContent = 'No active tab found';
      shareBtn.disabled = true;
    }
  } catch (error) {
    currentUrlDiv.textContent = 'Error loading tab info';
    shareBtn.disabled = true;
  }

  // Load existing configuration
  try {
    const config = await chrome.storage.sync.get(['apiEndpoint', 'apiToken']);
    if (config.apiEndpoint) {
      apiEndpointInput.value = config.apiEndpoint;
    }
    if (config.apiToken) {
      apiTokenInput.value = config.apiToken;
    }

    // Check if configuration is complete
    if (!config.apiEndpoint || !config.apiToken) {
      showStatus('Please configure your API settings first', 'error');
      shareBtn.disabled = true;
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }

  // Share button click handler
  shareBtn.addEventListener('click', async function() {
    if (!currentTab || !currentTab.url) {
      showStatus('No page to share', 'error');
      return;
    }

    setLoading(true);
    showStatus('Adding page to SmartFeed...', 'loading');

    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        action: 'shareCurrentTab'
      });

      setLoading(false);

      if (response.success) {
        showStatus('✅ ' + response.message, 'success');
        if (response.feedUrl) {
          setTimeout(() => {
            showStatus(`Feed available at: ${response.feedUrl}`, 'success');
          }, 2000);
        }
      } else {
        showStatus('❌ ' + response.error, 'error');
      }
    } catch (error) {
      setLoading(false);
      showStatus('❌ Extension error: ' + error.message, 'error');
    }
  });

  // Configuration button handlers
  configBtn.addEventListener('click', function() {
    toggleConfigMode();
  });

  saveConfigBtn.addEventListener('click', async function() {
    const endpoint = apiEndpointInput.value.trim();
    const token = apiTokenInput.value.trim();

    if (!endpoint || !token) {
      showStatus('Please fill in all configuration fields', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({
        apiEndpoint: endpoint,
        apiToken: token
      });

      showStatus('✅ Configuration saved successfully', 'success');
      shareBtn.disabled = false;
      toggleConfigMode();
    } catch (error) {
      showStatus('❌ Error saving configuration: ' + error.message, 'error');
    }
  });

  cancelConfigBtn.addEventListener('click', function() {
    toggleConfigMode();
  });

  // Helper functions
  function setLoading(loading) {
    shareBtn.disabled = loading;
    spinner.style.display = loading ? 'inline-block' : 'none';
    shareText.textContent = loading ? 'Sharing...' : 'Share This Page';
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }

  function toggleConfigMode() {
    isConfigMode = !isConfigMode;
    configForm.style.display = isConfigMode ? 'block' : 'none';
    configBtn.textContent = isConfigMode ? '📰 Back to Share' : '⚙️ Settings';
    
    if (isConfigMode) {
      statusDiv.style.display = 'none';
    }
  }
});
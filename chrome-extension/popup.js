// Popup script for Chrome extension
document.addEventListener('DOMContentLoaded', async function() {
  const currentUrlDiv = document.getElementById('currentUrl');
  const shareBtn = document.getElementById('shareBtn');
  const shareText = document.getElementById('shareText');
  const spinner = document.getElementById('spinner');
  const updateRssBtn = document.getElementById('updateRssBtn');
  const updateText = document.getElementById('updateText');
  const updateSpinner = document.getElementById('updateSpinner');
  const configBtn = document.getElementById('configBtn');
  const configForm = document.getElementById('configForm');
  const statusDiv = document.getElementById('status');
  const apiTokenInput = document.getElementById('apiToken');
  const saveConfigBtn = document.getElementById('saveConfig');
  const cancelConfigBtn = document.getElementById('cancelConfig');

  // SmartFeed API configuration
  const API_ENDPOINT = 'https://ingesturl-bnedqqqzpa-uc.a.run.app';
  const REGENERATE_ENDPOINT = 'https://regeneraterss-bnedqqqzpa-uc.a.run.app';

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
    const config = await chrome.storage.sync.get(['apiToken']);
    if (config.apiToken) {
      apiTokenInput.value = config.apiToken;
      shareBtn.disabled = false;
    } else {
      showStatus('Please configure your API token first', 'error');
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

    // Check if API token is configured
    const config = await chrome.storage.sync.get(['apiToken']);
    if (!config.apiToken) {
      showStatus('Please configure your API token first', 'error');
      toggleConfigMode();
      return;
    }

    setLoading(true);
    showStatus('Adding page to SmartFeed...', 'loading');

    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        action: 'shareUrl',
        url: currentTab.url,
        apiEndpoint: API_ENDPOINT,
        apiToken: config.apiToken
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

  // Update RSS button click handler
  updateRssBtn.addEventListener('click', async function() {
    // Check if API token is configured
    const config = await chrome.storage.sync.get(['apiToken']);
    if (!config.apiToken) {
      showStatus('Please configure your API token first', 'error');
      toggleConfigMode();
      return;
    }

    setUpdateLoading(true);
    showStatus('Regenerating RSS feed...', 'loading');

    try {
      // Call the regenerate RSS endpoint
      const response = await fetch(REGENERATE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiToken}`
        }
      });

      const result = await response.json();
      setUpdateLoading(false);

      if (response.ok && result.success) {
        showStatus('✅ ' + result.message, 'success');
        if (result.feedUrl) {
          setTimeout(() => {
            showStatus(`Feed available at: ${result.feedUrl}`, 'success');
          }, 2000);
        }
      } else {
        showStatus('❌ ' + result.message, 'error');
      }
    } catch (error) {
      setUpdateLoading(false);
      showStatus('❌ Extension error: ' + error.message, 'error');
    }
  });

  // Configuration button click handler
  configBtn.addEventListener('click', function() {
    toggleConfigMode();
  });

  // Save configuration button click handler
  saveConfigBtn.addEventListener('click', async function() {
    const apiToken = apiTokenInput.value.trim();
    
    if (!apiToken) {
      showStatus('Please fill in the API token', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({ apiToken: apiToken });
      showStatus('✅ Configuration saved successfully', 'success');
      shareBtn.disabled = false;
      toggleConfigMode();
    } catch (error) {
      showStatus('❌ Error saving configuration: ' + error.message, 'error');
    }
  });

  // Cancel configuration button click handler
  cancelConfigBtn.addEventListener('click', function() {
    toggleConfigMode();
  });

  // Helper functions
  function toggleConfigMode() {
    isConfigMode = !isConfigMode;
    configForm.style.display = isConfigMode ? 'block' : 'none';
    configBtn.textContent = isConfigMode ? '❌ Cancel' : '⚙️ Settings';
  }

  function setLoading(loading) {
    if (loading) {
      spinner.style.display = 'inline-block';
      shareText.textContent = 'Sharing...';
      shareBtn.disabled = true;
    } else {
      spinner.style.display = 'none';
      shareText.textContent = 'Share This Page';
      shareBtn.disabled = false;
    }
  }

  function setUpdateLoading(loading) {
    if (loading) {
      updateSpinner.style.display = 'inline-block';
      updateText.textContent = 'Updating...';
      updateRssBtn.disabled = true;
    } else {
      updateSpinner.style.display = 'none';
      updateText.textContent = '🔄 Update RSS';
      updateRssBtn.disabled = false;
    }
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 5000);
    }
  }
});
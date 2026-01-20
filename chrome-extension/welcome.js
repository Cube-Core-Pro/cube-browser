/**
 * Welcome Page Script
 * External script for CSP compliance in Manifest V3
 */

function openSidePanel() {
  // Try to open the side panel
  if (chrome.sidePanel) {
    chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  } else {
    // Fallback: show notification
    alert('Click the CUBE icon in your browser toolbar, then click "Open Side Panel"');
  }
  window.close();
}

// Export for onclick handlers
window.openSidePanel = openSidePanel;

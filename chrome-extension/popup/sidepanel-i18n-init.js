/**
 * CUBE Nexum - Sidepanel i18n Initialization
 * External script to avoid CSP violations
 */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof ExtensionI18n !== 'undefined') {
    ExtensionI18n.init().then(() => {
      ExtensionI18n.applyTranslations();
      console.log('[CUBE Sidepanel] i18n initialized');
    });
  }
});

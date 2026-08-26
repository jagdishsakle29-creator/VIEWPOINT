/**
 * SHASAH Production Web & API Configuration
 * Handles seamless endpoint resolution for https://shasah.com and local dev servers.
 */
(function () {
  const PRODUCTION_DOMAIN = 'https://shasah.com';
  const VERCEL_FALLBACK_DOMAIN = 'https://shasah.vercel.app';

  const isLocalDev = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

  window.APP_CONFIG = {
    appName: 'SHASAH',
    version: '1.0.0',
    productionDomain: PRODUCTION_DOMAIN,
    vercelFallbackDomain: VERCEL_FALLBACK_DOMAIN,
    isLocalDev: isLocalDev,

    /**
     * Resolves the authoritative API Base URL:
     * - In Local Development: routes to local server
     * - In Production (https://shasah.com): routes to current window.location.origin
     */
    getApiBaseUrl: function () {
      if (window.CUSTOM_API_BASE_URL) {
        return window.CUSTOM_API_BASE_URL;
      }
      if (isLocalDev && window.location.port === '3000') {
        return 'http://localhost:8000';
      }
      return window.location.origin || PRODUCTION_DOMAIN;
    }
  };

  console.log(`[SHASAH Casino] Environment: ${isLocalDev ? 'Local Development' : 'Production Web (' + PRODUCTION_DOMAIN + ')'} | API: ${window.APP_CONFIG.getApiBaseUrl()}`);
})();


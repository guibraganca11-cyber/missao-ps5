// Public configuration only. Never put family codes, PINs or secret keys here.
// Each phone stores its Apps Script endpoint and family code locally after activation.
window.MISSION_CLOUD_CONFIG = Object.freeze({
  provider: 'google-sheets',
  // The Apps Script endpoint is entered once on each phone, after deployment.
  url: '',
  publishableKey: ''
});

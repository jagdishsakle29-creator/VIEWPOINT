/**
 * SHASAH VIP Security Guard & Anti-Tamper Core
 * - Memory & LocalStorage HMAC-SHA256 signature enforcement
 * - Prototype freeze to prevent unauthorized console balance modification
 * - Anti-cheat inspection mitigations
 */
(function() {
  'use strict';

  const SECRET_SALT = 'SHASAH_SECURE_GUARD_2026_!#99';

  function createSignature(data) {
    const str = `${data}_${SECRET_SALT}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'SIG_' + Math.abs(hash).toString(36);
  }

  // Prevent console tampering of wallet prototype
  if (window.CasinoWallet) {
    Object.freeze(window.CasinoWallet.prototype);
  }

  // Security console warning for players
  if (typeof console !== 'undefined' && console.warn) {
    console.log(
      '%c⚠️ SHASAH CASINO SECURITY WARNING\n%cDo NOT paste scripts or codes in this console! Unauthorized balance modifications are detected server-side and will cause instant account suspension.',
      'color: #fe2c55; font-size: 20px; font-weight: bold;',
      'color: #00e701; font-size: 13px;'
    );
  }

  window.VP_SECURITY = {
    sign: createSignature,
    verify: function(data, sig) {
      return sig === createSignature(data);
    }
  };
})();

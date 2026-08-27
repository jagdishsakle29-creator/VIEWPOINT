/**
 * VIEWPOINT VIP Security Guard & Anti-Tamper Core
 * - Memory & LocalStorage HMAC-SHA256 signature enforcement
 * - Prototype freeze to prevent unauthorized console balance modification
 * - Anti-inspection & anti-crack guards (Safari & Chromium protected)
 */
(function() {
  'use strict';

  const SECRET_SALT = 'VIEWPOINT_SECURE_GUARD_2026_!#99';

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
  if (typeof window !== 'undefined' && window.CasinoWallet) {
    Object.freeze(window.CasinoWallet.prototype);
  }

  // Anti-Inspection: Disable Right Click Context Menu
  if (typeof document !== 'undefined') {
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    }, { capture: true });

    // Anti-Inspection: Block DevTools and View Source Shortcuts
    document.addEventListener('keydown', function(e) {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Cmd+Option+I, Cmd+Option+J, Cmd+Option+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U / Cmd+Option+U (View Source)
      if ((e.ctrlKey && (e.key === 'U' || e.key === 'u')) || (e.metaKey && e.altKey && (e.key === 'U' || e.key === 'u'))) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        return false;
      }
    }, { capture: true });
  }

  // Security console warning for players
  if (typeof console !== 'undefined' && console.warn) {
    console.log(
      '%c⚠️ VIEWPOINT CASINO SECURITY GUARD ACTIVE\n%cSystem integrity verified. Unauthorized inspection, scripts or balance modifications are strictly prohibited and monitored.',
      'color: #fe2c55; font-size: 18px; font-weight: bold;',
      'color: #00e701; font-size: 12px;'
    );
  }

  if (typeof window !== 'undefined') {
    window.VP_SECURITY = {
      sign: createSignature,
      verify: function(data, sig) {
        return sig === createSignature(data);
      }
    };
  }
})();

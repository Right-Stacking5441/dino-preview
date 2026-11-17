/* dino.game Google Consent Mode v2. Analytics is off until the visitor
   accepts. Never loads or fires GA on localhost / 127.0.0.1. */
(function () {
  var KEY = 'dino.game.analyticsConsent';
  var GA_ID = 'G-GYZFSQV2F8';
  var host = location.hostname;
  var isProd = host === 'dino.game' || host === 'www.dino.game';

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  function loadGa() {
    if (!isProd || window.__DINO_GA_LOADED) {
      return;
    }
    window.__DINO_GA_LOADED = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  function applyConsent(choice) {
    if (choice === 'granted') {
      window['ga-disable-' + GA_ID] = false;
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
      loadGa();
    } else {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
      window['ga-disable-' + GA_ID] = true;
    }
  }

  function store(choice) {
    try {
      localStorage.setItem(KEY, choice);
    } catch (e) { /* ignore */ }
  }

  function clearStoredChoice() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) { /* ignore */ }
  }

  function clearGaCookies() {
    var names = [];
    var raw = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < raw.length; i++) {
      var name = raw[i].split('=')[0].trim();
      if (name === '_ga' || name === '_gid' || name === '_gat' ||
          name.indexOf('_ga_') === 0 || name.indexOf('_gat_') === 0) {
        names.push(name);
      }
    }
    var hostName = location.hostname;
    var domains = ['', hostName];
    if (hostName.indexOf('.') !== -1) {
      domains.push('.' + hostName);
      var parts = hostName.split('.');
      if (parts.length > 2) {
        domains.push('.' + parts.slice(-2).join('.'));
      }
    }
    names.forEach(function (name) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      domains.forEach(function (domain) {
        if (!domain) {
          return;
        }
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + domain;
      });
    });
  }

  function hideBanner() {
    var el = document.getElementById('consent-banner');
    if (el) {
      el.hidden = true;
    }
    document.body.classList.remove('has-consent-banner');
  }

  function placeBanner(el) {
    var skip = document.querySelector('.skip-link');
    if (skip && skip.parentNode) {
      skip.insertAdjacentElement('afterend', el);
    } else if (document.body.firstChild) {
      document.body.insertBefore(el, document.body.firstChild);
    } else {
      document.body.appendChild(el);
    }
  }

  function bindBannerButtons(el) {
    if (el.getAttribute('data-bound') === '1') {
      return;
    }
    el.setAttribute('data-bound', '1');
    var accept = document.getElementById('consent-accept');
    var reject = document.getElementById('consent-reject');
    if (accept) {
      accept.addEventListener('click', function () {
        store('granted');
        applyConsent('granted');
        hideBanner();
      });
    }
    if (reject) {
      reject.addEventListener('click', function () {
        store('denied');
        applyConsent('denied');
        clearGaCookies();
        hideBanner();
      });
    }
  }

  function showBanner() {
    var el = document.getElementById('consent-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'consent-banner';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Analytics cookies');
      el.setAttribute('tabindex', '-1');
      el.innerHTML =
        '<p>This site uses Google Analytics only if you accept. No analytics cookies are set until you choose. See the <a href="/dino-preview/privacy/">privacy page</a>, or <a href="#cookie-settings">Cookie settings</a>.</p>' +
        '<div class="consent-actions">' +
        '<button type="button" id="consent-accept">Accept</button>' +
        '<button type="button" id="consent-reject">Reject</button>' +
        '</div>';
      placeBanner(el);
    }
    el.hidden = false;
    document.body.classList.add('has-consent-banner');
    bindBannerButtons(el);
  }

  function openCookieSettings(event) {
    if (event) {
      event.preventDefault();
    }
    // Persist denial so a withdrawal is not forgotten on reload.
    // Cookie settings still re-opens the banner so the choice can be changed.
    store('denied');
    applyConsent('denied');
    clearGaCookies();
    showBanner();
    var banner = document.getElementById('consent-banner');
    if (banner) {
      if (!banner.hasAttribute('tabindex')) {
        banner.setAttribute('tabindex', '-1');
      }
      try {
        banner.focus({preventScroll: true});
      } catch (err) {
        banner.focus();
      }
    }
  }

  window.dinoOpenCookieSettings = openCookieSettings;

  function isConsentChoiceButton(el) {
    return !!el && (el.id === 'consent-accept' || el.id === 'consent-reject');
  }

  function isGameKey(e) {
    return e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
        e.code === 'Enter' || e.key === ' ' || e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'Up' ||
        e.key === 'Down';
  }

  // While the banner itself is focused, Space/Up must not start the game
  // or activate Accept/Reject. Those buttons only respond to Space/Enter
  // after the user has Tabbed to them.
  document.addEventListener('keydown', function (e) {
    var banner = document.getElementById('consent-banner');
    if (!banner || banner.hidden) {
      return;
    }
    var active = document.activeElement;
    if (!active || !banner.contains(active)) {
      return;
    }
    if (!isGameKey(e)) {
      return;
    }
    if (isConsentChoiceButton(active) &&
        (e.code === 'Space' || e.key === ' ' || e.code === 'Enter' || e.key === 'Enter')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }, true);

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest &&
        event.target.closest('a[href="#cookie-settings"]');
    if (link) {
      openCookieSettings(event);
    }
  });

  var choice = null;
  try {
    choice = localStorage.getItem(KEY);
  } catch (e) {
    choice = null;
  }

  function init() {
    if (choice === 'granted' || choice === 'denied') {
      applyConsent(choice);
      hideBanner();
    } else {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

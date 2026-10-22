/* PV analytics consent (2026-10-13). Google Analytics 4 loads ONLY after the visitor
   clicks Accept. Before that there is no gtag script and no request to Google.
   The choice lives in localStorage["pv_analytics_consent"] ("granted" | "denied");
   if storage is unavailable there is no stored choice, so GA does not load.

   Configured by attributes on the <script> tag that loads this file:
     data-ga-id          GA4 measurement id (required; nothing happens without it)
     data-privacy-href   the site's privacy page (omit when the site has none)
     data-skip-local     present = keep the old localhost guard: no GA, no banner
   A footer <button data-pv-cookie-settings hidden> is shown by this script and
   clears the stored choice so the banner comes back.

   The shared logic is identical across PV static sites; only THEME differs. */
(function () {
  var THEME = {
    font: "'Inter',sans-serif",
    bg: "#0a0a0c",
    text: "#FFFFFF",
    border: "rgba(255,255,255,.15)",
    link: "#FFFFFF",
    btnBg: "#FFFFFF",
    btnText: "#0b1f2a",
    btnHover: "#E6E6E6",
    focus: "#FFFFFF",
    radius: "12px",
    btnRadius: "8px",
    shadow: "0 -6px 24px rgba(0,0,0,.35)"
  };

  var KEY = 'pv_analytics_consent';
  var me = document.currentScript;
  var GA_ID = me && me.getAttribute('data-ga-id');
  if (!GA_ID) return;
  var PRIVACY = me.getAttribute('data-privacy-href');

  if (me.hasAttribute('data-skip-local')) {
    var h = location.hostname;
    if (!h || h === 'localhost' || h === '127.0.0.1' || h === '[::1]' ||
        h.slice(-6) === '.local' || location.protocol === 'file:') return;
  }

  function readChoice() {
    try {
      var v = window.localStorage.getItem(KEY);
      return v === 'granted' || v === 'denied' ? v : null;
    } catch (e) { return null; }
  }
  function writeChoice(v) {
    try { window.localStorage.setItem(KEY, v); } catch (e) {}
  }
  function clearChoice() {
    try { window.localStorage.removeItem(KEY); } catch (e) {}
  }

  var gaLoaded = false;
  function loadGA() {
    if (gaLoaded) return;
    gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  var banner = null, spacer = null;

  function css() {
    var t = THEME;
    return '' +
      '.pv-consent{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;padding:12px 16px;' +
        'padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));box-sizing:border-box;pointer-events:none}' +
      '.pv-consent[hidden]{display:none}' +
      '.pv-consent__box{pointer-events:auto;max-width:880px;margin:0 auto;display:flex;align-items:center;gap:12px 20px;' +
        'flex-wrap:wrap;background:' + t.bg + ';color:' + t.text + ';border:1px solid ' + t.border + ';' +
        'border-radius:' + t.radius + ';box-shadow:' + t.shadow + ';padding:14px 16px;font-family:' + t.font + ';' +
        'font-size:15px;line-height:1.45;box-sizing:border-box}' +
      '.pv-consent__text{flex:1 1 300px;margin:0;min-width:0}' +
      '.pv-consent__text a{color:' + t.link + ';text-decoration:underline;text-underline-offset:2px;font-weight:600}' +
      '.pv-consent__actions{display:flex;gap:10px;flex:0 0 auto}' +
      '.pv-consent__btn{min-height:44px;min-width:112px;padding:10px 18px;border-radius:' + t.btnRadius + ';' +
        'border:2px solid ' + t.btnBg + ';background:' + t.btnBg + ';color:' + t.btnText + ';font:inherit;' +
        'font-weight:700;font-size:15px;line-height:1;cursor:pointer;box-sizing:border-box}' +
      '.pv-consent__btn:hover{background:' + t.btnHover + ';border-color:' + t.btnHover + '}' +
      '.pv-consent__btn:focus-visible,.pv-consent__text a:focus-visible{outline:3px solid ' + t.focus + ';outline-offset:2px}' +
      '@media (max-width:480px){.pv-consent__actions{flex:1 1 100%}.pv-consent__btn{flex:1 1 0;min-width:0}}';
  }

  function build() {
    if (banner) return;
    var style = document.createElement('style');
    style.textContent = css();
    document.head.appendChild(style);

    banner = document.createElement('div');
    banner.className = 'pv-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.hidden = true;

    var box = document.createElement('div');
    box.className = 'pv-consent__box';

    var p = document.createElement('p');
    p.className = 'pv-consent__text';
    p.appendChild(document.createTextNode(
      'We use Google Analytics cookies to count visits and see which pages are useful. They’re only set if you accept. '));
    if (PRIVACY) {
      var a = document.createElement('a');
      a.href = PRIVACY;
      a.textContent = 'Privacy policy';
      p.appendChild(a);
    }

    var actions = document.createElement('div');
    actions.className = 'pv-consent__actions';
    var accept = button('Accept', function () {
      writeChoice('granted');
      hide();
      loadGA();
    });
    var decline = button('No thanks', function () {
      writeChoice('denied');
      hide();
      if (gaLoaded) location.reload();
    });
    actions.appendChild(accept);
    actions.appendChild(decline);

    box.appendChild(p);
    box.appendChild(actions);
    banner.appendChild(box);

    // Keeps the last of the page (footer links, a final CTA) reachable above the banner.
    spacer = document.createElement('div');
    spacer.setAttribute('aria-hidden', 'true');
    spacer.className = 'pv-consent-spacer';

    document.body.appendChild(spacer);
    document.body.appendChild(banner);
    window.addEventListener('resize', fitSpacer);
  }

  function button(label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pv-consent__btn';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function fitSpacer() {
    if (!spacer || !banner) return;
    spacer.style.height = banner.hidden ? '0px' : banner.offsetHeight + 'px';
  }

  function show(focus) {
    build();
    banner.hidden = false;
    fitSpacer();
    if (focus) banner.querySelector('button').focus();
  }

  function hide() {
    if (!banner) return;
    banner.hidden = true;
    fitSpacer();
  }

  function onReady() {
    var links = document.querySelectorAll('[data-pv-cookie-settings]');
    for (var i = 0; i < links.length; i++) {
      links[i].hidden = false;
      links[i].addEventListener('click', function () {
        clearChoice();
        show(true);
      });
    }
    if (readChoice() === null) show(false);
  }

  if (readChoice() === 'granted') loadGA();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
}());

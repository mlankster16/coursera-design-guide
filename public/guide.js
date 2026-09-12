/* Coursera Design Guide — page behaviours.
   Vanilla JS, no dependencies. Drives four interactions, all wired through
   data attributes emitted by the build:

     data-click / data-enter / data-leave / data-keys / data-focus / data-blur
        the element that responds to an event; the value is the behaviour name
     data-if="NAME"     block shown when NAME is on (hidden attribute otherwise)
     data-text="NAME"   text that swaps with state (caret, Show/Hide labels)

   Behaviours: nav dropdown, accordions, info popovers, expand-all-for-print. */
(function () {
  'use strict';

  var cfg = {};
  try { cfg = JSON.parse(document.body.getAttribute('data-page-config') || '{}'); } catch (e) {}

  function show(name, on) {
    var els = document.querySelectorAll('[data-if="' + name + '"]');
    for (var i = 0; i < els.length; i++) {
      if (on) els[i].removeAttribute('hidden'); else els[i].setAttribute('hidden', '');
    }
  }
  function isOn(name) {
    var el = document.querySelector('[data-if="' + name + '"]');
    return !!el && !el.hasAttribute('hidden');
  }
  function setText(name, txt) {
    var els = document.querySelectorAll('[data-text="' + name + '"]');
    for (var i = 0; i < els.length; i++) els[i].textContent = txt;
  }
  function trigger(name) { return document.querySelector('[data-click="' + name + '"]'); }

  /* ---------- 1. nav dropdown ---------- */
  var navHost = document.querySelector('[data-nav-menu]');
  function navSet(on) {
    show('navOpen', on);
    setText('navCaret', on ? '\u2303' : '\u2304');
    var t = trigger('navToggle');
    if (t) t.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  if (navHost) {
    navHost.addEventListener('mouseenter', function () { navSet(true); });
    navHost.addEventListener('mouseleave', function () { navSet(false); });
    navHost.addEventListener('focusout', function (e) {
      if (!navHost.contains(e.relatedTarget)) navSet(false);
    });
    var navBtn = trigger('navToggle');
    if (navBtn) {
      navBtn.addEventListener('click', function (e) { e.preventDefault(); navSet(!isOn('navOpen')); });
      navBtn.addEventListener('focus', function () { navSet(true); });
      navBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navSet(!isOn('navOpen')); }
        if (e.key === 'Escape') navSet(false);
        if (e.key === 'ArrowDown' && !isOn('navOpen')) { e.preventDefault(); navSet(true); }
      });
    }
    document.addEventListener('focusin', function (e) {
      if (isOn('navOpen') && !navHost.contains(e.target)) navSet(false);
    }, true);
  }

  /* ---------- 2. accordions ---------- */
  var acc = cfg.accordion;
  if (acc) {
    for (var i = 0; i < acc.count; i++) {
      (function (n) {
        var btn = trigger(acc.toggle + n);
        if (!btn) return;
        function set(on) {
          show(acc.open + n, on);
          setText(acc.label + n, on ? acc.openTxt : acc.closed);
          btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        }
        btn.addEventListener('click', function () { set(!isOn(acc.open + n)); });
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!isOn(acc.open + n)); }
          if (e.key === 'Escape') set(false);
        });
        btn.__set = set;
      })(i);
    }
  }

  /* ---------- 3. info popovers (one open at a time) ---------- */
  var tips = cfg.tips;
  if (tips) {
    var openTip = null;
    var badgeFor = function (n) { return trigger('gt' + n); };
    var paint = function (n, on) {
      var b = badgeFor(n);
      if (!b) return;
      var gold = tips.goldFrom !== undefined && n >= tips.goldFrom;
      b.style.background = on ? (gold ? tips.goldOn : tips.on) : tips.off;
      b.style.color = on ? tips.onFg : (gold ? tips.goldOffFg : tips.offFg);
      b.setAttribute('aria-expanded', on ? 'true' : 'false');
    };
    var setTip = function (n) {
      if (openTip !== null) { show('g' + openTip, false); paint(openTip, false); }
      openTip = n;
      if (n !== null) { show('g' + n, true); paint(n, true); }
    };
    for (var k = 0; k < tips.count; k++) {
      (function (n) {
        var badge = badgeFor(n);
        if (badge) {
          badge.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            setTip(openTip === n ? null : n);
          });
          badge.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTip(openTip === n ? null : n); }
          });
        }
        var close = trigger('c' + n);
        if (close) close.addEventListener('click', function (e) { e.stopPropagation(); setTip(null); });
      })(k);
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setTip(null); });
    document.addEventListener('click', function (e) {
      if (openTip === null) return;
      var panel = document.querySelector('[data-if="g' + openTip + '"]');
      var badge = badgeFor(openTip);
      if (panel && !panel.contains(e.target) && badge && !badge.contains(e.target)) setTip(null);
    });
  }

  /* ---------- 4. print: open everything, close popovers ---------- */
  window.addEventListener('beforeprint', function () {
    if (acc) for (var i = 0; i < acc.count; i++) {
      var b = trigger(acc.toggle + i);
      if (b && b.__set) b.__set(true);
    }
    if (tips) for (var k = 0; k < tips.count; k++) show('g' + k, false);
    navSet && navSet(false);
  });
})();

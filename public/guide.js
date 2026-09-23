/* Coursera Design Guide — page behaviours.
   Vanilla JS, no dependencies. Drives four interactions, all wired through
   data attributes emitted by the build:

     data-click / data-enter / data-leave / data-keys / data-focus / data-blur
        the element that responds to an event; the value is the behaviour name
     data-if="NAME"     block shown when NAME is on (hidden attribute otherwise)
     data-text="NAME"   text that swaps with state (caret, Show/Hide labels)
     data-asset-cta="SLUG"  Learning Assets card footer: holds both the guide
        link and the "available soon" line; the page config picks which shows

   Behaviours: nav dropdown, accordions, exclusive panel groups, tab shelves,
   info popovers, sticky step bar scroll-spy, expand-all-for-print. */
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
  /* Some behaviours appear more than once under the same name — a guidance
     badge repeated in a step panel and again in the full template. Every copy
     has to respond, so popovers resolve all of them, not just the first. */
  function triggerAll(name) {
    return document.querySelectorAll('[data-click="' + name + '"]');
  }

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

  /* ---------- 1b. asset guide release state ----------
     The eight Learning Asset guides ship held back: each card carries both its
     "Explore" link and an "available soon" line, and this picks one. Releasing
     a guide is a config edit, not a markup edit — in the page config,
     "assets": {"released": ["video", "reading"]} releases those two, and
     "assets": {"released": "all"} releases the set. Default (empty list) holds
     every card. If JS does not run, the held-back state is what renders. */
  var assets = cfg.assets;
  if (assets) {
    var relAll = assets.released === 'all';
    var relList = Array.isArray(assets.released) ? assets.released : [];
    var ctas = document.querySelectorAll('[data-asset-cta]');
    for (var a = 0; a < ctas.length; a++) {
      var out = relAll || relList.indexOf(ctas[a].getAttribute('data-asset-cta')) !== -1;
      var link = ctas[a].querySelector('[data-asset-link]');
      var soon = ctas[a].querySelector('[data-asset-soon]');
      if (link) { if (out) link.removeAttribute('hidden'); else link.setAttribute('hidden', ''); }
      if (soon) { if (out) soon.setAttribute('hidden', ''); else soon.removeAttribute('hidden'); }
    }
  }

  /* ---------- 2. accordions ---------- */
  var acc = cfg.accordion;
  if (acc) {
    /* acc.unnumbered: a page with a single accordion names its behaviours
       plainly (ccToggle/ccOpen/ccLabel) rather than with a 0 suffix. */
    for (var i = 0; i < acc.count; i++) {
      (function (n) {
        var sfx = acc.unnumbered ? '' : n;
        var btn = trigger(acc.toggle + sfx);
        if (!btn) return;
        function set(on) {
          show(acc.open + sfx, on);
          setText(acc.label + sfx, on ? acc.openTxt : acc.closed);
          btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        }
        btn.addEventListener('click', function () { set(!isOn(acc.open + sfx)); });
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!isOn(acc.open + sfx)); }
          if (e.key === 'Escape') set(false);
        });
        btn.__set = set;
      })(i);
    }
  }

  /* ---------- 2b. standalone toggles ----------
     Independent collapsibles outside any numbered accordion group: each owns
     its own open state, so opening one never closes another. Declared in the
     page config as {click, panel, sign, closed, openTxt}. */
  (cfg.toggles || []).forEach(function (t) {
    var btn = trigger(t.click);
    if (!btn) return;
    var set = function (on) {
      show(t.panel, on);
      if (t.sign) setText(t.sign, on ? t.openTxt : t.closed);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    };
    set(false);
    btn.__set = set;
    btn.addEventListener('click', function () { set(!isOn(t.panel)); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!isOn(t.panel)); }
    });
  });

  /* ---------- 2c. exclusive panel groups ----------
     A stack of question panels where at most one is open at a time. Declared
     in the page config as {click, panel, label, count, closed, openTxt,
     initial, bgOn}; "initial" is the index open on load (-1 for none). The
     triggers are real <button>s, so Enter/Space come free. */
  var panelGroups = [];
  (cfg.panels || []).forEach(function (g) {
    var setOne = function (n, on) {
      show(g.panel + n, on);
      if (g.label) setText(g.label + n, on ? g.openTxt : g.closed);
      var b = trigger(g.click + n);
      if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
      var row = document.querySelector('[data-panel-row="' + g.panel + n + '"]');
      if (row && g.bgOn) row.style.background = on ? g.bgOn : '#FFFFFF';
    };
    var cur = g.initial === undefined ? -1 : g.initial;
    var apply = function () { for (var i = 0; i < g.count; i++) setOne(i, i === cur); };
    apply();
    for (var i = 0; i < g.count; i++) {
      (function (n) {
        var b = trigger(g.click + n);
        if (!b) return;
        b.addEventListener('click', function () { cur = (cur === n ? -1 : n); apply(); });
      })(i);
    }
    panelGroups.push(function () { for (var j = 0; j < g.count; j++) setOne(j, true); });
  });

  /* ---------- 2d. tab shelves ("Explore further") ----------
     A bordered shelf with N tabs across the top and one panel area beneath.
     Nothing is open on load; clicking a tab opens its panel below the whole
     row, clicking the same tab again closes it, and at most one panel per
     shelf is open. Declared in the page config as
     {click, panel, groups:[tabCount, …], onBd}: one entry per shelf, in
     document order. Triggers are real <button>s, so Enter/Space come free.
     Names are "<click><shelf>_<tab>" and "<panel><shelf>_<tab>". */
  var tabShelves = [];
  var tb = cfg.tabs;
  if (tb) {
    (tb.groups || []).forEach(function (count, gi) {
      var cur = -1;
      var setOne = function (n, on) {
        show(tb.panel + gi + '_' + n, on);
        var b = trigger(tb.click + gi + '_' + n);
        if (!b) return;
        b.setAttribute('aria-expanded', on ? 'true' : 'false');
        b.style.borderBottomColor = on ? (tb.onBd || '#012169') : 'transparent';
      };
      var apply = function () { for (var i = 0; i < count; i++) setOne(i, i === cur); };
      apply();
      for (var i = 0; i < count; i++) {
        (function (n) {
          var b = trigger(tb.click + gi + '_' + n);
          if (!b) return;
          b.addEventListener('click', function () { cur = (cur === n ? -1 : n); apply(); });
        })(i);
      }
      tabShelves.push(function () { for (var j = 0; j < count; j++) setOne(j, true); });
    });
  }

  /* ---------- 3. info popovers (one open at a time) ---------- */
  var tips = cfg.tips;
  if (tips) {
    var openTip = null;
    var badgeFor = function (n) { return triggerAll('gt' + n); };
    var paint = function (n, on) {
      var gold = tips.goldFrom !== undefined && n >= tips.goldFrom;
      var list = badgeFor(n);
      for (var p = 0; p < list.length; p++) {
        list[p].style.background = on ? (gold ? tips.goldOn : tips.on) : tips.off;
        list[p].style.color = on ? tips.onFg : (gold ? tips.goldOffFg : tips.offFg);
        list[p].setAttribute('aria-expanded', on ? 'true' : 'false');
      }
    };
    var setTip = function (n) {
      if (openTip !== null) { show('g' + openTip, false); paint(openTip, false); }
      openTip = n;
      if (n !== null) { show('g' + n, true); paint(n, true); }
    };
    for (var k = 0; k < tips.count; k++) {
      (function (n) {
        var badges = badgeFor(n);
        for (var bi = 0; bi < badges.length; bi++) {
          badges[bi].addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            setTip(openTip === n ? null : n);
          });
          badges[bi].addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTip(openTip === n ? null : n); }
          });
        }
        var closes = triggerAll('c' + n);
        for (var ci = 0; ci < closes.length; ci++) {
          closes[ci].addEventListener('click', function (e) { e.stopPropagation(); setTip(null); });
          closes[ci].addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setTip(null); }
          });
        }
      })(k);
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setTip(null); });
    document.addEventListener('click', function (e) {
      if (openTip === null) return;
      var panels = document.querySelectorAll('[data-if="g' + openTip + '"]');
      var badges = badgeFor(openTip);
      var inside = false, z;
      for (z = 0; z < panels.length; z++) if (panels[z].contains(e.target)) inside = true;
      for (z = 0; z < badges.length; z++) if (badges[z].contains(e.target)) inside = true;
      if (!inside) setTip(null);
    });
  }

  /* ---------- 5. sticky step bar: highlight the step in view ----------
     Config: "steps": {"c","fg","tint","ids":[section ids in order]}.
     The bar is [data-sticky-steps]; each step is an <a href="#id"> whose
     children are (row with circle), (title), (question). The markup ships in
     the step-1-active state, so without JS the bar is correct at the top of
     the page and simply stops tracking. */
  var steps = cfg.steps;
  var bar = document.querySelector('[data-sticky-steps]');
  if (steps && bar) {
    var links = bar.querySelectorAll('nav > a');
    var current = 0;
    var paintSteps = function (a) {
      for (var i = 0; i < links.length; i++) {
        var on = i === a, done = i < a, el = links[i];
        var circle = el.firstElementChild && el.firstElementChild.firstElementChild;
        var title = el.children[1], desc = el.children[2];
        el.style.background = on ? steps.tint : '#FFFFFF';
        el.style.borderBottomColor = on ? steps.c : 'transparent';
        el.setAttribute('aria-current', on ? 'step' : 'false');
        if (circle) {
          circle.style.background = on ? steps.c : '#FFFFFF';
          circle.style.color = on ? '#FFFFFF' : (done ? steps.fg : '#5A6472');
          circle.style.borderColor = on || done ? steps.c : '#C9CDD4';
        }
        if (title) title.style.color = on ? '#012169' : '#3A424E';
        if (desc) desc.style.color = on ? '#3A424E' : '#6B737F';
      }
    };
    var ticking = false;
    var spy = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var edge = Math.max(bar.getBoundingClientRect().bottom, 0) + 60, a = 0;
        for (var i = 0; i < steps.ids.length; i++) {
          var sec = document.getElementById(steps.ids[i]);
          if (sec && sec.getBoundingClientRect().top <= edge) a = i;
        }
        if (a !== current) { current = a; paintSteps(a); }
      });
    };
    document.addEventListener('scroll', spy, true);
    window.addEventListener('resize', spy);
    spy();
  }

  /* ---------- 4. print: open everything, close popovers ---------- */
  window.addEventListener('beforeprint', function () {
    if (acc) for (var i = 0; i < acc.count; i++) {
      var b = trigger(acc.toggle + (acc.unnumbered ? '' : i));
      if (b && b.__set) b.__set(true);
    }
    (cfg.toggles || []).forEach(function (t) {
      var b = trigger(t.click);
      if (b && b.__set) b.__set(true);
    });
    panelGroups.forEach(function (openAll) { openAll(); });
    tabShelves.forEach(function (openAll) { openAll(); });
    if (tips) for (var k = 0; k < tips.count; k++) show('g' + k, false);
    navSet && navSet(false);
  });
})();

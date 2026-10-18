/* ============================================================
   MONOLITH — lightweight enhancements (offline-safe).

   Design rule: this script may only ever ADD motion, never hide
   anything. Every "hide" state is switched off again by removing
   a class, and a safety timer guarantees that even if an event is
   missed, the whole page becomes visible again within 2.6 s.
   With JavaScript switched off, the page is simply a static,
   fully readable document.
   ============================================================ */
(function () {
  'use strict';

  var reduce = false;
  try {
    reduce = !!(window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { reduce = false; }

  /* ---------- 1. Reading progress bar + auto-hiding toolbar ----------
     A PDF reader hides its toolbar while you scroll down and brings it
     back the moment you scroll up. That is what makes a long answer
     comfortable to read on a phone.                               */
  var bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);

  var topbar = document.querySelector('.topbar');
  var lastY = window.pageYOffset || 0;

  function onScroll() {
    var h = document.documentElement;
    var y = h.scrollTop || document.body.scrollTop || 0;
    var height = h.scrollHeight - h.clientHeight;
    bar.style.width = (height > 0 ? (y / height) * 100 : 0) + '%';

    if (topbar && !document.body.classList.contains('focus-mode')) {
      if (y > 260 && y > lastY + 8) {
        topbar.classList.add('hidden');
      } else if (y < lastY - 8 || y < 140) {
        topbar.classList.remove('hidden');
      }
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. Student name / roll sync ---------- */
  var nameInput = document.querySelector('input[data-sync="name"]');
  var rollInput = document.querySelector('input[data-sync="roll"]');
  function sync() {
    [].forEach.call(document.querySelectorAll('[data-field="name"]'), function (el) {
      el.textContent = (nameInput && nameInput.value) ? nameInput.value : '\u00A0';
    });
    [].forEach.call(document.querySelectorAll('[data-field="roll"]'), function (el) {
      el.textContent = (rollInput && rollInput.value) ? rollInput.value : '\u00A0';
    });
  }
  if (nameInput) nameInput.addEventListener('input', sync);
  if (rollInput) rollInput.addEventListener('input', sync);
  sync();

  /* ---------- 3. Animation helpers ---------- */
  var EASE = 'cubic-bezier(.2,.75,.25,1)';

  function hasClass(el, name) {
    return (' ' + (el.getAttribute('class') || '') + ' ').indexOf(' ' + name + ' ') > -1;
  }

  /* Write an animation list inline. Inline styles always win, so the
     entrance can never be cancelled by the stylesheet. */
  function animate(el, specs) {
    var names = [], durs = [], eases = [], delays = [], fills = [], iters = [];
    for (var i = 0; i < specs.length; i++) {
      var s = specs[i];
      names.push(s.n);
      durs.push(s.d);
      eases.push(s.e || 'ease');
      delays.push((s.dl || 0) + 'ms');
      fills.push(s.f || 'none');
      iters.push(s.it || 1);
    }
    el.style.animationName = names.join(',');
    el.style.animationDuration = durs.join(',');
    el.style.animationTimingFunction = eases.join(',');
    el.style.animationDelay = delays.join(',');
    el.style.animationFillMode = fills.join(',');
    el.style.animationIterationCount = iters.join(',');
  }

  var PARTS = '.d-box,.d-soft,.d-fill,.d-line,.d-dash,.d-ah,text';

  /* Ambient (endless) motions, kept separate so they can outlive the
     entrance without ever being the thing that hides a shape. */
  function ambient(el) {
    var specs = [];
    if (hasClass(el, 'd-fill')) {
      specs.push({ n: 'dPulse', d: '4s', e: 'ease-in-out', it: 'infinite' });
    }
    if (hasClass(el, 'd-line') || hasClass(el, 'd-dash')) {
      el.style.strokeDasharray = '13 9';
      specs.push({ n: 'dFlow', d: '1.4s', e: 'linear', it: 'infinite' });
    }
    if (hasClass(el, 'd-ah')) {
      specs.push({ n: 'dNudge', d: '1.4s', e: 'ease-in-out', it: 'infinite' });
    }
    return specs;
  }

  function clearAnim(el) {
    el.style.opacity = '';
    el.style.transform = '';
    el.style.animationName = '';
    el.style.animationDuration = '';
    el.style.animationTimingFunction = '';
    el.style.animationDelay = '';
    el.style.animationFillMode = '';
    el.style.animationIterationCount = '';
  }

  /* Build a figure part by part, then leave it gently alive. */
  function playFigure(fig) {
    var svg = fig.querySelector('svg');
    if (!svg || svg.getAttribute('data-played') === '1') return;
    svg.setAttribute('data-played', '1');

    var parts = svg.querySelectorAll(PARTS);
    var longest = 0;
    for (var i = 0; i < parts.length; i++) {
      var el = parts[i];
      var wait = i * 34;
      if (wait > longest) longest = wait;
      var specs = [{ n: 'dIn', d: '.5s', e: EASE, dl: wait, f: 'both' }];
      var amb = ambient(el);
      for (var a = 0; a < amb.length; a++) {
        amb[a].dl = amb[a].dl || 0;
        specs.push(amb[a]);
      }
      animate(el, specs);
    }
    svg.classList.remove('js-anim');

    /* Once the entrance has played out, drop it completely and keep only the
       ambient motion. Nothing is left depending on an animation finishing, so
       a browser that freezes animations can never leave a half-drawn figure. */
    window.setTimeout(function () {
      for (var k = 0; k < parts.length; k++) {
        var el2 = parts[k];
        clearAnim(el2);
        var amb2 = ambient(el2);
        if (amb2.length) animate(el2, amb2);
      }
    }, longest + 800);
  }

  /* ---------- 4. Reveal large blocks ---------- */
  var blocks = [].slice.call(document.querySelectorAll(
    '.contents, .callout, .qblock, .diagram, .plan, .codeframe, .card, .stat, .howto'
  ));

  function show(el) {
    el.classList.remove('rv');
    el.classList.remove('rv-fade');
  }
  function showAll() {
    for (var i = 0; i < blocks.length; i++) {
      show(blocks[i]);
      if (blocks[i].classList.contains('diagram')) playFigure(blocks[i]);
    }
  }

  if (!reduce) {
    for (var b = 0; b < blocks.length; b++) {
      blocks[b].classList.add(
        blocks[b].classList.contains('qblock') ? 'rv-fade' : 'rv'
      );
    }
    var svgs = document.querySelectorAll('.diagram svg');
    for (var s = 0; s < svgs.length; s++) svgs[s].classList.add('js-anim');
  }

  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var el = entries[i].target;
        show(el);
        if (el.classList.contains('diagram')) playFigure(el);
        io.unobserve(el);
      }
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.04 });
    for (var o = 0; o < blocks.length; o++) io.observe(blocks[o]);

    /* safety net — nothing may ever stay hidden */
    window.setTimeout(showAll, 2600);
  } else {
    showAll();
  }

  /* ---------- 5. Smooth in-page jumps ---------- */
  [].forEach.call(document.querySelectorAll('a[href^="#"]'), function (a) {
    a.addEventListener('click', function () {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var t = document.getElementById(id);
      if (!t) return;
      a.blur();
      if (reduce) {
        t.scrollIntoView();
      } else {
        var y = t.getBoundingClientRect().top + window.pageYOffset - 10;
        try { window.scrollTo({ top: y, behavior: 'smooth' }); }
        catch (e) { window.scrollTo(0, y); }
      }
    });
  });

  /* ---------- 7. Focus mode ----------
     One tap clears every piece of interface so only the answer is left
     on the screen - the same trick a PDF reader uses. Press again (or
     Escape) to get the buttons back.                              */
  var focusBtn = document.getElementById('focusBtn');

  function setFocus(on) {
    document.body.classList.toggle('focus-mode', on);
    if (focusBtn) {
      focusBtn.classList.toggle('focus-on', on);
      focusBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (topbar) topbar.classList.remove('hidden');
  }

  if (focusBtn) {
    focusBtn.addEventListener('click', function () {
      setFocus(!document.body.classList.contains('focus-mode'));
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) {
      setFocus(false);
    }
  });
  window.__setFocus = setFocus;

  /* ---------- 8. Syntax highlighting ---------- */
  if (window.hljs) {
    [].forEach.call(document.querySelectorAll('pre code[class*="language-"]'), function (b) {
      try { window.hljs.highlightElement(b); } catch (e) {}
    });
  }
})();
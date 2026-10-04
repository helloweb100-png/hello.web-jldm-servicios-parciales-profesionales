'use strict';

/* ═══════════════════════════════════════════════════════════
   JLDM SERVICIOS PERICIALES PROFESIONALES
   GSAP + ScrollTrigger + Lenis. Todo degrada con gracia si una librería falla.
   ═══════════════════════════════════════════════════════════ */
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var motion = hasGsap && !reduce;
  var lenis = null;
  var WA_NUMBER = '525634555725';

  document.body.classList.add('is-loading');
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  var refreshSoon = (function () {
    var t; return function () { if (!hasGsap) return; clearTimeout(t); t = setTimeout(function () { ScrollTrigger.refresh(); }, 700); };
  }());

  /* ═══════════ SMOOTH SCROLL (Lenis) ═══════════ */
  function initLenis() {
    if (!motion || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  function scrollToEl(target) {
    var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 76;
    if (lenis) lenis.scrollTo(target, { offset: -(navH - 8), duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var target = $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    scrollToEl(target);
  });

  /* ═══════════ LOADER ═══════════ */
  function runLoader(done) {
    var loader = $('#loader');
    if (!loader) { document.body.classList.remove('is-loading'); return done(); }

    var fill = $('#ldFill'), pct = $('#ldPct'), status = $('#ldStatus');
    var msgs = [[0, 'Verificando evidencia'], [34, 'Reconstruyendo hechos'], [68, 'Preparando dictamen'], [97, 'Listo']];
    var pageLoaded = document.readyState === 'complete';
    window.addEventListener('load', function () { pageLoaded = true; }, { once: true });

    var MIN = reduce ? 250 : 2300, MAX = 5200;
    var t0 = performance.now(), shown = 0, finished = false;

    function finish() {
      if (finished) return; finished = true;
      function cleanup() { loader.style.display = 'none'; document.body.classList.remove('is-loading'); }
      if (!motion) { cleanup(); return done(); }
      var tl = gsap.timeline({ onComplete: cleanup });
      tl.to('.ld-core', { opacity: 0, y: -26, duration: .55, ease: 'power2.in' })
        .to('.ld-panel--t', { yPercent: -101, duration: 1.15, ease: 'expo.inOut' }, '>-0.05')
        .to('.ld-panel--b', { yPercent: 101, duration: 1.15, ease: 'expo.inOut' }, '<')
        .add(done, '-=0.7');
    }

    function frame(now) {
      var el = now - t0;
      var cap = (pageLoaded || el > MAX) ? 100 : 92;
      var goal = Math.min(cap, (el / MIN) * 100);
      shown += (goal - shown) * 0.1;
      if (cap === 100 && el >= MIN && shown > 99.3) shown = 100;
      var v = Math.round(shown);
      pct.textContent = v;
      fill.style.transform = 'scaleX(' + (shown / 100) + ')';
      for (var i = msgs.length - 1; i >= 0; i--) {
        if (v >= msgs[i][0]) { if (status.textContent !== msgs[i][1]) status.textContent = msgs[i][1]; break; }
      }
      if (shown >= 100) return finish();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ═══════════ MENÚ MÓVIL ═══════════ */
  var ham = $('#ham'), mob = $('#mob');
  function openMenu() {
    mob.classList.add('open'); mob.setAttribute('aria-hidden', 'false');
    ham.setAttribute('aria-expanded', 'true'); ham.setAttribute('aria-label', 'Cerrar menú');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    if (motion) gsap.fromTo('#mob nav a', { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .06, delay: .28, ease: 'power3.out' });
  }
  function closeMenu() {
    if (!mob || !mob.classList.contains('open')) return;
    mob.classList.remove('open'); mob.setAttribute('aria-hidden', 'true');
    ham.setAttribute('aria-expanded', 'false'); ham.setAttribute('aria-label', 'Abrir menú');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }
  ham.addEventListener('click', function () { mob.classList.contains('open') ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ═══════════ NAV: estado, indicador y scrollspy ═══════════ */
  function initNav() {
    var nav = $('#nav');
    if (hasGsap) {
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (self) { nav.classList.toggle('is-scrolled', self.scroll() > 40); } });
    } else nav.classList.add('is-scrolled');

    var links = $$('.nav-links a'), menu = $('.nav-menu'), ind = $('.nav-ind'), active = null;
    if (!links.length || !ind) return;

    function moveInd(el) {
      var m = menu.getBoundingClientRect(), r = el.getBoundingClientRect();
      if (m.width === 0) return;
      var x = r.left - m.left;
      if (hasGsap) {
        var hidden = parseFloat(getComputedStyle(ind).opacity) < .05;
        if (hidden) gsap.set(ind, { x: x, width: r.width });
        gsap.to(ind, { x: x, width: r.width, opacity: 1, duration: hidden ? 0 : .5, ease: 'power3.out', overwrite: true });
      } else { ind.style.transform = 'translateX(' + x + 'px)'; ind.style.width = r.width + 'px'; ind.style.opacity = 1; }
    }
    function hideInd() { if (hasGsap) gsap.to(ind, { opacity: 0, duration: .3 }); else ind.style.opacity = 0; }
    function setActive(a) {
      active = a;
      links.forEach(function (l) { l.classList.toggle('is-active', l === a); });
      a ? moveInd(a) : hideInd();
    }
    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { moveInd(a); });
      a.addEventListener('focus', function () { moveInd(a); });
    });
    menu.addEventListener('mouseleave', function () { active ? moveInd(active) : hideInd(); });

    var map = new Map();
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute('data-sec')); if (s) map.set(s, a); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map.get(en.target);
        if (en.isIntersecting) setActive(a); else if (active === a) setActive(null);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach(function (_, s) { io.observe(s); });
    window.addEventListener('resize', function () { if (active) moveInd(active); });
  }

  /* ═══════════ HELPERS DE TEXTO ═══════════ */
  function splitWords(el) {
    var text = el.textContent.trim();
    el.textContent = '';
    var frag = document.createDocumentFragment();
    var words = text.split(/\s+/);
    words.forEach(function (w, i) {
      var sw = document.createElement('span'); sw.className = 'sw';
      var si = document.createElement('span'); si.className = 'sw-i'; si.textContent = w;
      sw.appendChild(si); frag.appendChild(sw);
      if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    el.appendChild(frag);
    return $$('.sw-i', el);
  }

  /* ═══════════ HERO ═══════════ */
  function heroPrepare() {
    if (!motion) { var hl = $('.hl'); if (hl) hl.style.setProperty('--ul', 1); return; }
    gsap.set('.h1-in', { yPercent: 125 });
    gsap.set('[data-hero="up"]', { y: 32, opacity: 0 });
    gsap.set('.hero-card-in', { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set('.hero-card-in img', { scale: 1.45 });
    gsap.set('.vf, .mk', { scale: 0, opacity: 0 });
  }

  function heroIntro() {
    if (!motion) return;
    var tl = gsap.timeline();
    tl.to('.h1-in', { yPercent: 0, duration: 1.5, stagger: .13, ease: 'expo.out' }, 0)
      .to('[data-hero="up"]', { y: 0, opacity: 1, duration: 1.2, stagger: .13, ease: 'power3.out' }, .3)
      .to('.hero-card-in', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', onComplete: function () { gsap.set('.hero-card-in', { clearProps: 'clipPath' }); } }, .15)
      .to('.hero-card-in img', { scale: 1.04, duration: 2.2, ease: 'expo.out' }, .15)
      .to('.vf', { scale: 1, opacity: 1, duration: .9, stagger: .07, ease: 'back.out(2)' }, 1.1)
      .to('.mk', { scale: 1, opacity: 1, duration: .9, stagger: .15, ease: 'back.out(2.6)' }, 1.35)
      .to('.hl', { '--ul': 1, duration: 1.2, ease: 'power3.inOut' }, 1.2);

    var mks = $$('.mk'), mi = 0;
    function cycle() {
      mks.forEach(function (m, i) { m.classList.toggle('is-on', i === mi); });
      mi = (mi + 1) % mks.length;
    }
    setTimeout(function () { cycle(); setInterval(cycle, 2900); }, 2300);
  }

  function initHeroScroll() {
    if (!motion) return;
    var st = { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero-copy', { yPercent: -12, opacity: .2, ease: 'none', scrollTrigger: st });
    gsap.to('.hero-visual', { yPercent: 9, ease: 'none', scrollTrigger: st });

    if (!fine) return;
    var card = $('#heroCard'), hero = $('#hero'), glare = $('.hero-glare');
    var rx = gsap.quickTo(card, 'rotationX', { duration: .9, ease: 'power3.out' });
    var ry = gsap.quickTo(card, 'rotationY', { duration: .9, ease: 'power3.out' });
    hero.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var nx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      var ny = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      ry(clamp(nx, -1, 1) * 8); rx(clamp(ny, -1, 1) * -6);
      glare.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%');
      glare.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100) + '%');
    });
    hero.addEventListener('pointerleave', function () { rx(0); ry(0); });
  }

  /* ═══════════ PARTÍCULAS (hero) ═══════════ */
  function initParticles() {
    var cv = $('#pcanvas');
    if (!cv || reduce) return;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, pts = [], raf = 0, mouse = { x: -999, y: -999 };

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(72, Math.floor(W * H / 16000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .34, vy: (Math.random() - .5) * .34, r: Math.random() * 1.5 + .6 });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var i, j, p, q, dx, dy, d, a;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        dx = p.x - mouse.x; dy = p.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130 && d > 0) { p.x += dx / d * .9; p.y += dy / d * .9; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
        for (j = i + 1; j < pts.length; j++) {
          q = pts[j]; dx = p.x - q.x; dy = p.y - q.y; d = dx * dx + dy * dy;
          if (d < 16900) {
            a = (1 - Math.sqrt(d) / 130) * .32;
            ctx.strokeStyle = 'rgba(111,148,255,' + a + ')'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(190,208,255,.7)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    var hero = $('#hero');
    hero.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!raf) raf = requestAnimationFrame(draw); }
      else { cancelAnimationFrame(raf); raf = 0; }
    }).observe(hero);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 200); });
    resize();
  }

  /* ═══════════ CINTA POLICIAL ═══════════ */
  function initTapes() {
    var tapes = $$('.tape');
    if (!tapes.length || !motion) return;
    var tweens = [], boost = 0;

    function build() {
      tweens.forEach(function (t) { t.kill(); }); tweens.length = 0;
      tapes.forEach(function (tape, i) {
        var track = $('.tape-track', tape);
        if (!track.getAttribute('data-base')) track.setAttribute('data-base', track.firstElementChild.outerHTML);
        var base = track.getAttribute('data-base');
        track.innerHTML = base;
        var sw = track.firstElementChild.offsetWidth || 700;
        var k = Math.ceil(tape.clientWidth / sw) + 1, html = '';
        for (var j = 0; j < k * 2; j++) html += base;
        track.innerHTML = html;
        var dist = sw * k, dur = dist / 95;
        tweens.push(i % 2 === 0
          ? gsap.fromTo(track, { x: 0 }, { x: -dist, duration: dur, ease: 'none', repeat: -1 })
          : gsap.fromTo(track, { x: -dist }, { x: 0, duration: dur * 1.12, ease: 'none', repeat: -1 }));
      });
    }
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 250); });

    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (self) { boost = clamp(Math.abs(self.getVelocity()) / 240, 0, 8); } });
    gsap.ticker.add(function () {
      boost *= .93;
      var ts = 1 + boost;
      for (var i = 0; i < tweens.length; i++) tweens[i].timeScale(ts);
    });
  }

  /* ═══════════ MANIFIESTO ═══════════ */
  function initManifesto() {
    var el = $('#maniText');
    if (!el) return;
    if (!motion) { $$('.w-mark', el).forEach(function (m) { m.classList.add('on'); }); return; }
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) frag.appendChild(document.createTextNode(tok));
            else { var s = document.createElement('span'); s.className = 'w'; s.textContent = tok; frag.appendChild(s); words.push(s); }
          });
          ch.parentNode.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    }(el));
    gsap.set(words, { opacity: .14 });
    gsap.to(words, { opacity: 1, stagger: .12, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: .6 } });
    $$('.w-mark', el).forEach(function (m) {
      ScrollTrigger.create({ trigger: m, start: 'top 62%', once: true, onEnter: function () { m.classList.add('on'); } });
    });
  }

  /* ═══════════ CONTADORES ═══════════ */
  function initCounters() {
    $$('.count').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-to'));
      if (!motion) { el.textContent = to; return; }
      var o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: function () { gsap.to(o, { v: to, duration: 2.4, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } }); }
      });
    });
  }

  /* ═══════════ REVEALS GENERALES ═══════════ */
  function initReveals() {
    if (!motion) return;
    $$('[data-split]').forEach(function (h) {
      var words = splitWords(h);
      gsap.from(words, { yPercent: 118, duration: 1.2, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
    });
    $$('[data-reveal]').forEach(function (el) {
      gsap.from(el, { y: 46, opacity: 0, duration: 1.15, ease: 'power3.out', delay: parseFloat(el.getAttribute('data-delay')) || 0, scrollTrigger: { trigger: el, start: 'top 91%', once: true } });
    });
  }

  /* ═══════════ ESPECIALIDADES ═══════════ */
  function initSpecs() {
    if (!motion) return;
    var cards = $$('.stack-card');

    gsap.matchMedia().add('(min-width: 900px)', function () {
      cards.forEach(function (card, i) {
        var next = cards[i + 1];
        if (!next) return;
        var st = { trigger: next, start: 'top 90%', end: 'top 24%', scrub: true };
        gsap.to(card, { scale: .93, ease: 'none', scrollTrigger: st });
        gsap.to($('.card-shade', card), { opacity: .55, ease: 'none', scrollTrigger: st });
      });
    });

    cards.forEach(function (card) {
      gsap.from($$('.card-copy > *', card), { y: 38, opacity: 0, duration: 1.1, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 78%', once: true } });
      gsap.from($('.frame, .lens', card), { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: card, start: 'top 72%', once: true } });
    });

    $$('.parallax-img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ═══════════ LUPA FORENSE ═══════════ */
  function initLens() {
    var lens = $('#lens');
    if (!lens) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, manual = false, last = 0, raf = 0;
    cx = tx = lens.clientWidth * .56; cy = ty = lens.clientHeight * .46;

    lens.addEventListener('pointermove', function (e) {
      var r = lens.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top; manual = true; last = performance.now();
    });
    lens.addEventListener('pointerleave', function () { last = performance.now(); });

    function frame(now) {
      var w = lens.clientWidth, h = lens.clientHeight;
      if (manual && now - last > 1800) manual = false;
      if (!manual && !reduce) {
        var t = now / 1000;
        tx = w * (.5 + .3 * Math.cos(t * .55)); ty = h * (.5 + .27 * Math.sin(t * .8));
      }
      cx += (tx - cx) * .14; cy += (ty - cy) * .14;
      lens.style.setProperty('--x', cx.toFixed(1) + 'px');
      lens.style.setProperty('--y', cy.toFixed(1) + 'px');
      raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!raf) raf = requestAnimationFrame(frame); }
      else { cancelAnimationFrame(raf); raf = 0; }
    }).observe(lens);
  }

  /* ═══════════ MÉTODO (scroll horizontal pinneado) ═══════════ */
  function initProcess() {
    var sec = $('#metodo'), track = $('#procTrack'), fill = $('#procFill');
    if (!sec || !track || !motion) return;
    var cards = $$('.proc-card', track);
    var mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', function () {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: .8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) {
            fill.style.transform = 'scaleX(' + self.progress + ')';
            var edge = window.innerWidth * .64;
            cards.forEach(function (c) { c.classList.toggle('active', c.getBoundingClientRect().left < edge); });
          }
        }
      });
    });

    mm.add('(max-width: 1023.98px)', function () {
      cards.forEach(function (c) {
        gsap.from(c, { y: 54, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 90%', once: true } });
        ScrollTrigger.create({ trigger: c, start: 'top 68%', end: 'bottom 32%', toggleClass: { targets: c, className: 'active' } });
      });
    });
  }

  /* ═══════════ BENTO ═══════════ */
  function initBento() {
    var cells = $$('.cell');
    if (!cells.length) return;
    if (motion) {
      gsap.from(cells, { y: 80, opacity: 0, scale: .95, duration: 1.3, ease: 'expo.out', stagger: .1, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.bento', start: 'top 84%', once: true } });
    }
    if (fine) cells.forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ═══════════ TABS ═══════════ */
  function initTabs() {
    var list = $('.tab-list');
    if (!list) return;
    var tabs = $$('.tab', list), panels = $$('.tab-panel');

    function place() {
      var on = tabs.filter(function (t) { return t.classList.contains('is-on'); })[0];
      if (!on) return;
      list.style.setProperty('--y', on.offsetTop + 'px');
      list.style.setProperty('--h', on.offsetHeight + 'px');
    }
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, j) {
        if (j === i) { p.hidden = false; if (motion) gsap.fromTo(p, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }); }
        else p.hidden = true;
      });
      place();
      if (focus) tabs[i].focus();
      refreshSoon();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
    place();
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }

  /* ═══════════ FAQ ═══════════ */
  function initFaq() {
    $$('.faq-item').forEach(function (item) {
      var btn = $('.faq-q', item);
      btn.addEventListener('click', function () {
        var wasOpen = item.classList.contains('open');
        $$('.faq-item.open').forEach(function (o) { o.classList.remove('open'); $('.faq-q', o).setAttribute('aria-expanded', 'false'); });
        if (!wasOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
        refreshSoon();
      });
    });
  }

  /* ═══════════ FORMULARIO → WHATSAPP ═══════════ */
  function initForm() {
    var form = $('#cForm');
    if (!form) return;
    var btn = $('#submitBtn'), ok = $('#formOk');
    var messages = {
      tipo: 'Seleccione el tipo de asunto.',
      nombre: 'Escriba su nombre completo.',
      telefono: 'Ingrese un teléfono válido (mínimo 8 dígitos).',
      mensaje: 'Cuéntenos brevemente su caso (mínimo 10 caracteres).'
    };

    function check() {
      var d = new FormData(form), first = null;
      var res = {
        tipo: !!d.get('tipo'),
        nombre: String(d.get('nombre') || '').trim().length >= 3,
        telefono: String(d.get('telefono') || '').replace(/\D/g, '').length >= 8,
        mensaje: String(d.get('mensaje') || '').trim().length >= 10
      };
      Object.keys(res).forEach(function (k) {
        var msg = $('.err[data-for="' + k + '"]', form);
        var field = k === 'tipo' ? null : form.elements[k];
        msg.textContent = res[k] ? '' : messages[k];
        msg.classList.toggle('show', !res[k]);
        if (field) { field.classList.toggle('is-err', !res[k]); field.setAttribute('aria-invalid', res[k] ? 'false' : 'true'); }
        if (!res[k] && !first) first = k === 'tipo' ? $('input[name="tipo"]', form) : field;
      });
      return first;
    }

    form.addEventListener('input', function (e) {
      var n = e.target.name, msg = n && $('.err[data-for="' + n + '"]', form);
      if (msg && msg.classList.contains('show')) { msg.classList.remove('show'); e.target.classList.remove('is-err'); }
      ok.textContent = '';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = check();
      if (bad) {
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
        bad.focus(); return;
      }
      var d = new FormData(form);
      var t = '*Solicitud de dictamen pericial*\n\n';
      t += '• Nombre: ' + String(d.get('nombre')).trim() + '\n';
      t += '• Teléfono: ' + String(d.get('telefono')).trim() + '\n';
      t += '• Tipo de asunto: ' + d.get('tipo') + '\n';
      if (d.get('perfil')) t += '• Perfil: ' + d.get('perfil') + '\n';
      if (String(d.get('email') || '').trim()) t += '• Correo: ' + String(d.get('email')).trim() + '\n';
      t += '• Caso: ' + String(d.get('mensaje')).trim();
      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(t);

      btn.classList.add('is-loading'); btn.disabled = true;
      var w = window.open(url, '_blank');
      if (w) { w.opener = null; } else { window.location.href = url; }
      setTimeout(function () {
        btn.classList.remove('is-loading'); btn.disabled = false;
        ok.textContent = 'Listo. Abrimos WhatsApp con su solicitud.';
        form.reset();
      }, 900);
    });
  }

  /* ═══════════ BOTONES MAGNÉTICOS ═══════════ */
  function initMagnetic() {
    if (!motion || !fine) return;
    $$('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .55, ease: 'power3.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: .55, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .28); yTo((e.clientY - r.top - r.height / 2) * .38);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ═══════════ FOOTER + PROGRESO ═══════════ */
  function initMisc() {
    if (!hasGsap) return;
    gsap.to('#scrollbarFill', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });
    if (motion) {
      gsap.from('.foot-giant span', { yPercent: 110, duration: 1.5, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.foot-giant', start: 'top 96%', once: true } });
    }
  }

  /* ═══════════ ARRANQUE ═══════════ */
  initLenis();
  heroPrepare();
  initNav();
  initParticles();
  initTapes();
  initManifesto();
  initCounters();
  initReveals();
  initSpecs();
  initLens();
  initProcess();
  initBento();
  initTabs();
  initFaq();
  initForm();
  initMagnetic();
  initMisc();
  initHeroScroll();

  runLoader(function () {
    if (lenis) lenis.start();
    heroIntro();
    if (hasGsap) ScrollTrigger.refresh();
  });

  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (hasGsap) ScrollTrigger.refresh(); });
}());

/* MEXA Arquitectos · core.js
   Scroll suave (Lenis), revelados (GSAP + ScrollTrigger), cortina entre páginas,
   menú móvil, cursor con etiqueta, carga diferida y arranque de la maqueta 3D.
   Atributos disponibles: ver DISENO.md, sección «API de movimiento». */
(function () {
  'use strict';
  var d = document, html = d.documentElement, w = window;
  var esteScript = d.currentScript ? d.currentScript.src : '';
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var gsap = w.gsap, ST = w.ScrollTrigger;
  var lenis = null;
  w.__mexa = true;
  w.MEXA = { lenis: null, refrescar: function () { if (ST) ST.refresh(); } };

  /* ---------- imágenes diferidas ---------- */
  function imagenes(raiz) {
    (raiz || d).querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      if (img.complete && img.naturalWidth) { img.classList.add('is-loaded'); return; }
      img.addEventListener('load', function () { img.classList.add('is-loaded'); }, { once: true });
      img.addEventListener('error', function () { img.classList.add('is-loaded'); }, { once: true });
    });
  }
  imagenes();
  w.MEXA.imagenes = imagenes;

  /* ---------- scroll suave ---------- */
  if (!reduce && w.Lenis && gsap) {
    lenis = new w.Lenis({ duration: 1.05, easing: function (t) { return 1 - Math.pow(1 - t, 4); }, smoothWheel: true });
    w.MEXA.lenis = lenis;
    if (ST) lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var destino = d.querySelector(id);
    if (!destino) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(destino, { offset: -80 }); else destino.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    destino.setAttribute('tabindex', '-1'); destino.focus({ preventScroll: true });
  });

  /* ---------- cabecera: se oculta al bajar, vuelve al subir ---------- */
  var cabecera = d.querySelector('.cabecera');
  if (cabecera) {
    var yPrev = w.scrollY, pend = false;
    w.addEventListener('scroll', function () {
      if (pend) return; pend = true;
      requestAnimationFrame(function () {
        var y = w.scrollY;
        cabecera.classList.toggle('is-desplazada', y > 8);
        if (!html.classList.contains('menu-abierto')) {
          if (y > yPrev + 4 && y > 240) cabecera.classList.add('is-oculta');
          else if (y < yPrev - 4 || y <= 240) cabecera.classList.remove('is-oculta');
        }
        yPrev = y; pend = false;
      });
    }, { passive: true });
    cabecera.addEventListener('focusin', function () { cabecera.classList.remove('is-oculta'); });
  }

  /* ---------- menú móvil ---------- */
  var boton = d.querySelector('.menu-boton'), menu = d.getElementById('menu'), principal = d.querySelector('main'), pie = d.querySelector('.pie');
  function menuEstado(abrir) {
    if (!menu || !boton) return;
    menu.classList.toggle('is-abierto', abrir);
    html.classList.toggle('menu-abierto', abrir);
    boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    boton.textContent = abrir ? 'Cerrar' : 'Menú';
    menu.inert = !abrir;
    if (principal) principal.inert = abrir;
    if (pie) pie.inert = abrir;
    var salto = d.querySelector('.salto'); if (salto) salto.inert = abrir;
    if (lenis) { abrir ? lenis.stop() : lenis.start(); }
    d.body.style.overflow = abrir ? 'hidden' : '';
    if (abrir) { var a = menu.querySelector('a'); if (a) a.focus({ preventScroll: true }); }
  }
  if (menu && boton) {
    menu.inert = true;
    boton.addEventListener('click', function () { menuEstado(!menu.classList.contains('is-abierto')); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-abierto')) { menuEstado(false); boton.focus(); } });
    w.matchMedia('(min-width: 821px)').addEventListener('change', function (m) { if (m.matches) menuEstado(false); });
  }

  /* ---------- cortina entre páginas ---------- */
  var cortina = d.querySelector('.cortina');
  function esInterno(a) {
    if (!a || a.target || a.hasAttribute('download') || a.dataset.transition === 'none') return false;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return false;
    var u; try { u = new URL(a.href, location.href); } catch (err) { return false; }
    if (u.origin !== location.origin) return false;
    if (u.pathname === location.pathname && u.search === location.search) return false;
    return true;
  }
  if (cortina && !reduce) {
    d.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!esInterno(a)) return;
      e.preventDefault();
      var destino = a.href, ido = false;
      function ir() { if (ido) return; ido = true; location.href = destino; }
      cortina.classList.add('is-quieta');           /* abajo, sin animación */
      void cortina.offsetWidth;
      cortina.classList.remove('is-quieta');
      cortina.classList.add('is-entrando');         /* sube y cubre */
      cortina.addEventListener('transitionend', ir, { once: true });
      setTimeout(ir, 700);
    });
    w.addEventListener('pageshow', function (e) {
      if (e.persisted) { cortina.classList.remove('is-entrando'); cortina.classList.add('is-quieta'); }
    });
  }

  /* ---------- cursor con etiqueta ---------- */
  if (fino && !reduce && gsap) {
    var cursor = d.createElement('div');
    cursor.className = 'cursor'; cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="cursor__in"></span>';
    d.body.appendChild(cursor);
    var etiqueta = cursor.firstChild;
    var cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    var cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
    var movido = false;
    w.addEventListener('pointermove', function (e) { movido = true; cx(e.clientX); cy(e.clientY); }, { passive: true });
    d.addEventListener('pointerover', function (e) {
      var el = e.target.closest && e.target.closest('[data-cursor]');
      if (el && movido) { etiqueta.textContent = el.dataset.cursor; cursor.classList.add('is-activo'); }
      else cursor.classList.remove('is-activo');
    }, { passive: true });
    d.addEventListener('pointerleave', function () { cursor.classList.remove('is-activo'); });
  }

  /* ---------- revelados ---------- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function partirLineas(el) {
    var original = el.innerHTML;
    var palabras = el.textContent.trim().split(/\s+/);
    el.innerHTML = palabras.map(function (p) { return '<span style="display:inline-block">' + esc(p) + '</span>'; }).join(' ');
    var lineas = [], top = null;
    Array.prototype.forEach.call(el.children, function (s) {
      var t = s.offsetTop;
      if (top === null || Math.abs(t - top) > 6) { lineas.push([]); top = t; }
      lineas[lineas.length - 1].push(s.textContent);
    });
    el.innerHTML = lineas.map(function (l) { return '<span class="linea"><span class="linea__in">' + esc(l.join(' ')) + '</span></span>'; }).join(' ');
    return { partes: el.querySelectorAll('.linea__in'), deshacer: function () { el.innerHTML = original; } };
  }
  function retraso(el) { return parseFloat(el.dataset.revealDelay || 0) || 0; }

  function revelados() {
    var todos = d.querySelectorAll('[data-reveal]');
    if (reduce || !gsap || !ST) { todos.forEach(function (el) { el.style.visibility = 'visible'; }); return; }
    gsap.registerPlugin(ST);
    /* si el JS llega tarde (red lenta), lo que ya está a la vista se queda como está: sin parpadeo */
    var tarde = html.classList.contains('sin-core') || (w.performance && performance.now() > 1600);
    var alto = w.innerHeight;

    todos.forEach(function (el) {
      var tipo = el.dataset.reveal || 'fade';
      if (tarde && el.getBoundingClientRect().top < alto) { el.setAttribute('data-reveal', 'hecho'); el.style.visibility = 'visible'; return; }
      vigilar(el);
      var disparo = { trigger: el, start: 'top 88%', once: true };
      if (tipo === 'image') {
        var img = el.querySelector('img,video');
        gsap.set(el, { visibility: 'visible', clipPath: 'inset(100% 0% 0% 0%)' });
        if (img) gsap.set(img, { scale: 1.14 });
        ST.create(Object.assign({}, disparo, { onEnter: function () {
          gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, delay: retraso(el), ease: 'expo.out', clearProps: 'clipPath' });
          if (img) gsap.to(img, { scale: 1, duration: 1.6, delay: retraso(el), ease: 'expo.out' });
        } }));
      } else if (tipo === 'lines') {
        var p = partirLineas(el);
        gsap.set(el, { visibility: 'visible' });
        gsap.set(p.partes, { yPercent: 108 });
        ST.create(Object.assign({}, disparo, { onEnter: function () {
          gsap.to(p.partes, { yPercent: 0, duration: 1.05, delay: retraso(el), ease: 'expo.out', stagger: 0.085, onComplete: p.deshacer });
        } }));
      } else if (tipo === 'line') {
        gsap.set(el, { visibility: 'visible', scaleX: 0, transformOrigin: '0 50%' });
        ST.create(Object.assign({}, disparo, { onEnter: function () {
          gsap.to(el, { scaleX: 1, duration: 1.2, delay: retraso(el), ease: 'expo.out', clearProps: 'transform' });
        } }));
      } else {
        gsap.set(el, { autoAlpha: 0, y: 22 });
      }
    });
    /* los «fade» que entran juntos se escalonan 70 ms */
    ST.batch('[data-reveal="fade"],[data-reveal=""]', { start: 'top 90%', once: true, onEnter: function (lote) {
      lote.forEach(function (el, i) {
        gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.9, delay: retraso(el) + i * 0.07, ease: 'expo.out', clearProps: 'transform' });
      });
    } });

    /* deriva vertical de la foto dentro de su marco */
    d.querySelectorAll('.media[data-parallax]').forEach(function (m) {
      var img = m.querySelector('img'); if (!img) return;
      var f = parseFloat(m.dataset.parallax) || 5;
      gsap.fromTo(img, { yPercent: -f }, { yPercent: f, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* red de seguridad: nada se queda oculto. Si un bloque lleva 3 s en pantalla y sigue sin verse, se muestra */
  var vigia = ('IntersectionObserver' in w) ? new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target; vigia.unobserve(el);
      setTimeout(function () {
        var cs = getComputedStyle(el);
        var cortado = cs.clipPath && cs.clipPath !== 'none' && /inset\((9\d|100)/.test(cs.clipPath);
        var lin = el.querySelector('.linea__in');
        if (cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05 && !cortado && !lin) return;
        if (gsap.isTweening(el) || (lin && gsap.isTweening(lin))) return;
        gsap.set(el, { autoAlpha: 1, clearProps: 'transform,clipPath' });
        if (lin) gsap.set(el.querySelectorAll('.linea__in'), { yPercent: 0 });
        var im = el.querySelector('img'); if (im) gsap.set(im, { scale: 1 });
      }, 3000);
    });
  }) : null;
  function vigilar(el) { if (vigia) vigia.observe(el); }

  /* héroe de la home: se queda fijo mientras la maqueta se abre (solo escritorio y con WebGL) */
  function fijarHeroe() {
    var heroe = d.querySelector('.heroe'), caja = d.querySelector('[data-maqueta]');
    if (!heroe || !caja || reduce || !gsap || !ST || !hayWebGL()) return;
    if (!w.matchMedia('(min-width: 821px) and (min-height: 560px)').matches) return;
    w.MEXA.heroe = ST.create({ trigger: heroe, start: function () { return 'top top+=' + (cabecera ? cabecera.offsetHeight : 72); },
      end: '+=85%', pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true });
  }

  function arrancar() {
    if (gsap && ST) gsap.registerPlugin(ST);
    fijarHeroe();
    revelados();
    if (ST) w.addEventListener('load', function () { ST.refresh(); });
    maqueta();
  }
  if (d.fonts && d.fonts.ready) {
    var hecho = false, ya = function () { if (hecho) return; hecho = true; arrancar(); };
    d.fonts.ready.then(ya); setTimeout(ya, 800);
  } else arrancar();

  /* ---------- maqueta 3D del héroe (three.js en diferido) ---------- */
  function hayWebGL() {
    try { var c = d.createElement('canvas'); return !!(w.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
    catch (err) { return false; }
  }
  function maqueta() {
    var caja = d.querySelector('[data-maqueta]');
    if (!caja) return;
    var sin = function () {
      var r = caja.querySelector('img[data-src]');
      if (r) { r.src = r.dataset.src; r.removeAttribute('data-src'); }
      caja.classList.add('sin-webgl');
    };
    if (reduce || !hayWebGL() || !esteScript) { sin(); return; }
    var cargar = function () {
      import(new URL('hero.js', esteScript).href)
        .then(function (m) { m.iniciar(caja.querySelector('.maqueta__lienzo'), d.querySelector('.heroe')); })
        .catch(function () { if (w.MEXA.heroe) { w.MEXA.heroe.kill(true); w.MEXA.heroe = null; ST.refresh(); } sin(); });
    };
    /* three.js (670 KB) no compite con el primer pintado: se pide cuando el hilo queda libre */
    if (w.requestIdleCallback) w.requestIdleCallback(cargar, { timeout: 1200 }); else setTimeout(cargar, 200);
  }
})();

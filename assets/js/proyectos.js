/* MEXA Arquitectos · proyectos.js
   Índice: filtros, cambio de vista (rejilla / lista) y previsualización que sigue al puntero.
   Ficha: visor a pantalla completa con teclado y gesto táctil. Sin librerías propias; usa gsap si core.js lo cargó. */
(function () {
  'use strict';
  var d = document, w = window, html = d.documentElement;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function lenis() { return w.MEXA && w.MEXA.lenis; }
  function refrescar() { if (w.MEXA && w.MEXA.refrescar) w.MEXA.refrescar(); }

  /* =================== ÍNDICE =================== */
  var indice = d.querySelector('[data-indice]');
  if (indice) (function () {
    var lista = indice.querySelector('[data-lista]');
    var items = Array.prototype.slice.call(lista.children);
    var cuenta = indice.querySelector('[data-cuenta]');
    var vacio = indice.querySelector('[data-vacio]');
    var estado = { lugar: '', estado: '', vista: 'rejilla' };

    /* misma lógica de filas que build_proyectos.py (empaquetar) */
    function empaquetar(vis) {
      var i = 0, k = 0, n = vis.length;
      function pon(el, c, s, baja) { el.style.setProperty('--c', c); el.style.setProperty('--s', s); el.classList.toggle('pi--baja', !!baja); }
      while (i < n) {
        var a = vis[i], b = vis[i + 1], c = vis[i + 2];
        var av = a.dataset.o === 'v', bv = b && b.dataset.o === 'v';
        if (k % 3 === 2 && c) { pon(a, 1, 4, 0); pon(b, 5, 4, 1); pon(c, 9, 4, 0); i += 3; }
        else if (!b) { if (av) pon(a, 1, 4, 0); else pon(a, k % 2 === 0 ? 1 : 6, 7, 0); i += 1; }
        else {
          if (av && bv) { pon(a, 2, 4, 0); pon(b, 8, 4, 1); }
          else if (av) { pon(a, 1, 4, 0); pon(b, 6, 7, 1); }
          else if (bv) { pon(a, 1, 7, 0); pon(b, 9, 4, 1); }
          else if (k % 2 === 0) { pon(a, 1, 7, 0); pon(b, 8, 5, 1); }
          else { pon(a, 1, 5, 1); pon(b, 6, 7, 0); }
          i += 2;
        }
        k++;
      }
    }

    function aplicar() {
      var vis = [];
      items.forEach(function (li) {
        var ok = (!estado.lugar || li.dataset.lugar === estado.lugar) && (!estado.estado || li.dataset.estado === estado.estado);
        li.hidden = !ok;
        if (ok) vis.push(li);
      });
      empaquetar(vis);
      lista.dataset.vista = estado.vista;
      html.classList.toggle('vista-lista', estado.vista === 'lista');
      cuenta.textContent = vis.length === 1 ? '1 proyecto' : vis.length + ' proyectos';
      vacio.hidden = vis.length > 0;
      indice.querySelectorAll('[data-filtro]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(estado[b.dataset.filtro] === b.dataset.valor));
      });
      indice.querySelectorAll('[data-vista].filtro').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.vista === estado.vista));
      });
      /* las fotos de los que aparecen se muestran aunque su revelado aún no hubiera saltado */
      vis.forEach(function (li, i) {
        li.style.setProperty('--i', Math.min(i, 14));
        var m = li.querySelector('.media');
        if (m) { m.style.visibility = 'visible'; m.style.clipPath = 'none'; var im = m.querySelector('img'); if (im) im.style.transform = 'none'; }
      });
      return vis;
    }
    function guardar() {
      try {
        var q = new URLSearchParams();
        if (estado.lugar) q.set('lugar', estado.lugar);
        if (estado.estado) q.set('estado', estado.estado);
        if (estado.vista !== 'rejilla') q.set('vista', estado.vista);
        var s = q.toString();
        history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
        sessionStorage.setItem('mexa-vista', estado.vista);
      } catch (err) { /* sin almacenamiento: no pasa nada */ }
    }
    var ocupado = null;
    function cambiar() {
      guardar();
      if (reduce) { aplicar(); refrescar(); return; }
      clearTimeout(ocupado);
      lista.classList.add('is-cambiando');
      ocupado = setTimeout(function () {
        var vis = aplicar();
        vis.forEach(function (li) { li.classList.remove('is-entrando'); });
        void lista.offsetWidth;
        vis.forEach(function (li) { li.classList.add('is-entrando'); });
        lista.classList.remove('is-cambiando');
        refrescar();
        setTimeout(function () { vis.forEach(function (li) { li.classList.remove('is-entrando'); }); }, 1400);
      }, 230);
    }

    indice.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.filtro) { if (estado[b.dataset.filtro] === b.dataset.valor) return; estado[b.dataset.filtro] = b.dataset.valor; cambiar(); }
      else if (b.dataset.vista) { if (estado.vista === b.dataset.vista) return; estado.vista = b.dataset.vista; ocultarPrevia(); cambiar(); }
      else if (b.hasAttribute('data-limpiar')) { estado.lugar = ''; estado.estado = ''; cambiar(); }
    });

    /* estado inicial: URL y última vista usada */
    try {
      var q = new URLSearchParams(location.search), validos = function (clave, v) { return !!indice.querySelector('[data-filtro="' + clave + '"][data-valor="' + v + '"]'); };
      var v = q.get('vista') || sessionStorage.getItem('mexa-vista');
      if (v === 'lista' || v === 'rejilla') estado.vista = v;
      if (q.get('lugar') && /^[a-z]+$/.test(q.get('lugar')) && validos('lugar', q.get('lugar'))) estado.lugar = q.get('lugar');
      if (q.get('estado') && /^[a-z]+$/.test(q.get('estado')) && validos('estado', q.get('estado'))) estado.estado = q.get('estado');
    } catch (err) { /* valores por defecto */ }
    if (estado.vista !== 'rejilla' || estado.lugar || estado.estado) { aplicar(); w.addEventListener('load', refrescar); }

    /* al entrar en una ficha, el resto del listado se retira bajo la cortina */
    lista.addEventListener('click', function (e) {
      var a = e.target.closest('.pi__a');
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reduce) return;
      a.parentNode.classList.add('is-elegido'); lista.classList.add('is-saliendo'); ocultarPrevia();
    });
    w.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      lista.classList.remove('is-saliendo');
      items.forEach(function (li) { li.classList.remove('is-elegido'); });
    });

    /* previsualización que sigue al puntero (vista lista) */
    var previa = indice.querySelector('[data-previa]'), pimg = previa && previa.querySelector('img');
    var px = 0, py = 0, tx = 0, ty = 0, raf = 0, actual = null;
    function ocultarPrevia() { if (previa) previa.classList.remove('is-activa'); actual = null; }
    function paso() {
      px += (tx - px) * 0.16; py += (ty - py) * 0.16;
      previa.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)';
      raf = (previa.classList.contains('is-activa') || Math.abs(tx - px) > 0.5 || Math.abs(ty - py) > 0.5) ? requestAnimationFrame(paso) : 0;
    }
    if (previa && fino && !reduce) {
      lista.addEventListener('pointermove', function (e) {
        if (estado.vista !== 'lista') return;
        var a = e.target.closest('.pi__a');
        if (!a) { ocultarPrevia(); return; }
        var r = previa.getBoundingClientRect(), pw = r.width || 320, ph = r.height || 220;
        tx = Math.min(Math.max(12, e.clientX + 28), w.innerWidth - pw - 12);
        ty = Math.min(Math.max(12, e.clientY - ph * 0.5), w.innerHeight - ph - 12);
        if (a !== actual) {
          var nuevo = !actual; actual = a;
          previa.style.setProperty('--ar', a.dataset.prevAr || '1.5');
          pimg.src = a.dataset.prev;
          if (nuevo) { px = tx; py = ty; }
          previa.classList.add('is-activa');
        }
        if (!raf) raf = requestAnimationFrame(paso);
      }, { passive: true });
      lista.addEventListener('pointerleave', ocultarPrevia);
      w.addEventListener('scroll', function () { if (actual) ocultarPrevia(); }, { passive: true });
    }
  })();

  /* =================== FICHA: VISOR =================== */
  var ficha = d.querySelector('[data-ficha]');
  if (ficha) (function () {
    var botones = Array.prototype.slice.call(ficha.querySelectorAll('[data-visor]'));
    if (!botones.length) return;
    botones.sort(function (a, b) { return a.dataset.visor - b.dataset.visor; });
    var fotos = botones.map(function (b) {
      var im = b.querySelector('img'), cap = b.parentNode.querySelector('figcaption');
      return { src: im.getAttribute('src'), srcset: im.getAttribute('srcset'), alt: im.alt, w: im.width, h: im.height, pie: cap ? cap.textContent : '' };
    });
    var total = fotos.length, i = 0, origen = null, visor = null, img, cuentaEl, pieEl, antEl, sigEl, escena, cerrando = 0;

    function crear() {
      visor = d.createElement('dialog');
      visor.className = 'visor';
      visor.setAttribute('aria-label', 'Imágenes de ' + (ficha.dataset.nombre || 'el proyecto'));
      visor.setAttribute('data-lenis-prevent', '');
      visor.innerHTML =
        '<div class="visor__barra"><span class="visor__cuenta" aria-live="polite"></span><button type="button" class="visor__cerrar">Cerrar</button></div>' +
        '<div class="visor__escena"><img class="visor__img" alt="" draggable="false"></div>' +
        '<div class="visor__base"><span class="visor__pie"></span><span class="visor__nav">' +
        '<button type="button" class="visor__ant">Anterior</button><button type="button" class="visor__sig">Siguiente</button></span></div>';
      d.body.appendChild(visor);
      img = visor.querySelector('.visor__img'); cuentaEl = visor.querySelector('.visor__cuenta'); pieEl = visor.querySelector('.visor__pie');
      antEl = visor.querySelector('.visor__ant'); sigEl = visor.querySelector('.visor__sig'); escena = visor.querySelector('.visor__escena');
      if (total < 2) visor.querySelector('.visor__nav').hidden = true;
      visor.querySelector('.visor__cerrar').addEventListener('click', cerrar);
      antEl.addEventListener('click', function () { ir(i - 1); });
      sigEl.addEventListener('click', function () { ir(i + 1); });
      visor.addEventListener('cancel', function (e) { e.preventDefault(); cerrar(); });
      visor.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); ir(i + 1); }
        else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ir(i - 1); }
        else if (e.key === 'Home') { e.preventDefault(); ir(0); }
        else if (e.key === 'End') { e.preventDefault(); ir(total - 1); }
        else if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
      });
      gestos();
    }

    var turno = 0;
    function mostrar(dir) {
      var f = fotos[i], mio = ++turno;
      cuentaEl.textContent = (i + 1) + ' / ' + total;
      pieEl.textContent = f.pie;
      antEl.disabled = i === 0; sigEl.disabled = i === total - 1;
      img.classList.remove('is-lista', 'is-arrastre');
      img.style.setProperty('--dx', (dir || 0) * 36 + 'px');
      var entrar = function () {
        if (mio !== turno) return;
        img.sizes = '100vw'; if (f.srcset) img.srcset = f.srcset; else img.removeAttribute('srcset');
        img.src = f.src; img.alt = f.alt; img.width = f.w; img.height = f.h;
        var listo = function () { if (mio === turno) requestAnimationFrame(function () { img.classList.add('is-lista'); }); };
        if (img.decode) img.decode().then(listo, listo); else listo();
        var s = fotos[i + 1]; if (s) { var pre = new Image(); pre.sizes = '100vw'; if (s.srcset) pre.srcset = s.srcset; pre.src = s.src; }
      };
      if (reduce || !img.getAttribute('src')) entrar(); else setTimeout(entrar, 170);
    }
    function ir(n) {
      if (n < 0 || n >= total || n === i) return;
      var dir = n > i ? 1 : -1; i = n; mostrar(dir);
    }
    function abrir(n, desde) {
      if (!visor) crear();
      clearTimeout(cerrando);
      i = n; origen = desde;
      if (!visor.open) { if (visor.showModal) visor.showModal(); else visor.setAttribute('open', ''); }
      if (lenis()) lenis().stop();
      html.style.overflow = 'hidden';
      img.removeAttribute('src'); img.removeAttribute('srcset');
      mostrar(0);
      requestAnimationFrame(function () { visor.classList.add('is-abierto'); });
      visor.querySelector('.visor__cerrar').focus({ preventScroll: true });
    }
    function cerrar() {
      if (!visor || !visor.open) return;
      visor.classList.remove('is-abierto');
      cerrando = setTimeout(function () {
        if (visor.close) visor.close(); else visor.removeAttribute('open');
        html.style.overflow = '';
        if (lenis()) lenis().start();
        var b = botones[i] || origen;
        if (b) { b.focus({ preventScroll: true }); var r = b.getBoundingClientRect(); if (r.bottom < 0 || r.top > w.innerHeight) b.scrollIntoView({ block: 'center' }); }
      }, reduce ? 0 : 280);
    }

    /* gesto: arrastre horizontal cambia de foto, hacia abajo cierra; un toque sin arrastre avanza (o cierra fuera de la foto) */
    function gestos() {
      var x0 = 0, y0 = 0, dx = 0, dy = 0, activo = false, eje = '';
      escena.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        activo = true; eje = ''; x0 = e.clientX; y0 = e.clientY; dx = dy = 0;
        try { escena.setPointerCapture(e.pointerId); } catch (err) { /* no pasa nada */ }
      });
      escena.addEventListener('pointermove', function (e) {
        if (!activo) return;
        dx = e.clientX - x0; dy = e.clientY - y0;
        if (!eje && Math.abs(dx) + Math.abs(dy) > 8) eje = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (!eje || reduce) return;
        img.classList.add('is-arrastre');
        if (eje === 'x') {
          var tope = (i === 0 && dx > 0) || (i === total - 1 && dx < 0);
          img.style.setProperty('--mx', (tope ? dx * 0.25 : dx) + 'px'); img.style.setProperty('--my', '0px'); img.style.setProperty('--op', '1');
        } else {
          img.style.setProperty('--mx', '0px'); img.style.setProperty('--my', Math.max(0, dy) + 'px');
          img.style.setProperty('--op', String(Math.max(0.3, 1 - Math.max(0, dy) / 400)));
        }
      });
      function fin(e) {
        if (!activo) return; activo = false;
        img.classList.remove('is-arrastre');
        if (eje === 'x' && Math.abs(dx) > 56) { var antes = i; ir(i + (dx < 0 ? 1 : -1)); if (antes === i) img.classList.add('is-lista'); }
        else if (eje === 'y' && dy > 110) cerrar();
        else if (!eje && e.type === 'pointerup') { if (d.elementFromPoint(e.clientX, e.clientY) === img) { if (i < total - 1) ir(i + 1); else cerrar(); } else cerrar(); }
      }
      escena.addEventListener('pointerup', fin);
      escena.addEventListener('pointercancel', fin);
    }

    botones.forEach(function (b) {
      b.addEventListener('click', function () { abrir(parseInt(b.dataset.visor, 10) || 0, b); });
    });
  })();
})();

/* MEXA Arquitectos · paginas.js (estudio y contacto)
   1. Proceso: el dibujo en axonometría se traza con el scroll y las etapas se activan.
   2. [data-trazar]: una línea SVG que se dibuja una vez al entrar en pantalla.
   3. Formulario de proyecto: validación accesible en línea y correo prellenado (no se envía nada a ningún servidor). */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = w.gsap, ST = w.ScrollTrigger;
  var vivo = !reduce && gsap && ST;
  if (vivo) gsap.registerPlugin(ST);

  /* ---------- 1. proceso ---------- */
  var proceso = d.querySelector('[data-proceso]');
  if (proceso && vivo) {
    var lista = proceso.querySelector('.proceso__etapas');
    var etapas = proceso.querySelectorAll('.etapa');
    var grupos = proceso.querySelectorAll('.trazo g[data-etapa]');
    proceso.classList.add('is-vivo');
    lista.style.setProperty('--avance', 0);
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: lista, start: 'top 78%', end: 'bottom 60%', scrub: 0.6,
        onUpdate: function (s) { lista.style.setProperty('--avance', s.progress.toFixed(4)); }
      }
    });
    grupos.forEach(function (g, i) {
      var p = g.querySelectorAll('path');
      gsap.set(p, { strokeDashoffset: 1, fillOpacity: 0 });
      tl.to(p, { strokeDashoffset: 0, fillOpacity: 1, duration: 0.5, stagger: { amount: 0.4 } }, i);
    });
    tl.to({}, { duration: 0.1 }, grupos.length - 0.1);
    /* las dos primeras etapas (predio y planta) se ven de cerca; el dibujo se aleja cuando se levanta la casa */
    var svg = proceso.querySelector('.trazo');
    if (svg) { gsap.set(svg, { scale: 1.5, transformOrigin: '50% 44%' }); tl.to(svg, { scale: 1, duration: 1.2, ease: 'power1.inOut' }, 1.3); }
    etapas.forEach(function (el) {
      ST.create({
        trigger: el, start: 'top 72%',
        onEnter: function () { el.classList.add('is-activa'); },
        onLeaveBack: function () { el.classList.remove('is-activa'); }
      });
    });
  }

  /* ---------- 2. líneas que se trazan una vez ---------- */
  if (vivo) {
    d.querySelectorAll('[data-trazar]').forEach(function (p) {
      gsap.set(p, { strokeDashoffset: 1 });
      ST.create({ trigger: p, start: 'top 85%', once: true, onEnter: function () {
        gsap.to(p, { strokeDashoffset: 0, duration: 1.6, delay: 0.3, ease: 'expo.inOut' });
      } });
    });
  }

  /* ---------- 3. formulario ---------- */
  var form = d.getElementById('form-proyecto');
  if (!form) return;
  var resumen = d.getElementById('form-resumen'), listo = d.getElementById('form-listo');
  var abrir = d.getElementById('form-abrir'), copiar = d.getElementById('form-copiar');
  var copiado = d.getElementById('form-copiado'), texto = d.getElementById('form-texto');
  var destino = form.dataset.correo;
  var intentado = false;

  var reglas = {
    nombre: function (v) { return v.length < 2 ? 'Escribe tu nombre.' : ''; },
    correo: function (v) {
      if (!v) return 'Escribe tu correo electrónico.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Revisa el correo. Debe tener el formato nombre@dominio.com.';
    },
    telefono: function (v) {
      if (!v) return '';
      var n = v.replace(/\D/g, '').length;
      return (/^[\d\s()+.-]+$/.test(v) && n >= 8 && n <= 15) ? '' : 'Revisa el teléfono. Usa solo números, por ejemplo 55 1234 5678.';
    },
    tipo: function (v) { return v ? '' : 'Elige el tipo de proyecto.'; },
    ubicacion: function () { return ''; },
    mensaje: function (v) {
      if (!v) return 'Cuéntanos del proyecto.';
      return v.length < 20 ? 'Cuéntanos un poco más: al menos 20 caracteres.' : '';
    }
  };
  var nombres = { nombre: 'Nombre', correo: 'Correo electrónico', telefono: 'Teléfono', tipo: 'Tipo de proyecto', mensaje: 'Cuéntanos del proyecto' };
  function valor(c) { return (c.value || '').trim(); }
  function campo(id) { return form.elements[id]; }
  function validar(id) {
    var c = campo(id), msg = reglas[id](valor(c)), p = d.getElementById('err-' + id);
    if (msg) { c.setAttribute('aria-invalid', 'true'); p.textContent = msg; p.hidden = false; }
    else { c.removeAttribute('aria-invalid'); p.textContent = ''; p.hidden = true; }
    return msg;
  }
  var tipo = campo('tipo');
  function tipoVacio() { tipo.classList.toggle('is-vacio', !tipo.value); }
  tipoVacio();

  Object.keys(reglas).forEach(function (id) {
    var c = campo(id);
    c.addEventListener('blur', function () { if (intentado || valor(c)) validar(id); });
    c.addEventListener(c.tagName === 'SELECT' ? 'change' : 'input', function () {
      if (c.getAttribute('aria-invalid') === 'true') validar(id);
      if (c === tipo) tipoVacio();
    });
  });

  resumen.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-campo]');
    if (!a) return;
    e.preventDefault(); e.stopPropagation();
    campo(a.dataset.campo).focus();
  });

  function mensajeFinal() {
    var l = ['Nombre: ' + valor(campo('nombre')), 'Correo: ' + valor(campo('correo'))];
    if (valor(campo('telefono'))) l.push('Teléfono: ' + valor(campo('telefono')));
    l.push('Tipo de proyecto: ' + tipo.value);
    if (valor(campo('ubicacion'))) l.push('Ubicación: ' + valor(campo('ubicacion')));
    l.push('', valor(campo('mensaje')));
    return l.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    intentado = true;
    var malos = Object.keys(reglas).filter(function (id) { return validar(id); });
    if (malos.length) {
      listo.hidden = true;
      resumen.innerHTML = '<p>' + (malos.length === 1 ? 'Falta revisar 1 campo:' : 'Falta revisar ' + malos.length + ' campos:') + '</p><ul>' +
        malos.map(function (id) { return '<li><a href="#' + id + '" data-campo="' + id + '">' + nombres[id] + '</a></li>'; }).join('') + '</ul>';
      resumen.hidden = false;
      campo(malos[0]).focus();
      return;
    }
    resumen.hidden = true; resumen.innerHTML = '';
    var cuerpo = mensajeFinal();
    var asunto = 'Proyecto nuevo: ' + tipo.value + ' · ' + valor(campo('nombre'));
    var url = 'mailto:' + destino + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo);
    abrir.href = url;
    texto.textContent = 'Para: ' + destino + '\nAsunto: ' + asunto + '\n\n' + cuerpo;
    copiado.textContent = '';
    listo.hidden = false;
    listo.focus({ preventScroll: true });
    if (w.MEXA && w.MEXA.lenis) w.MEXA.lenis.scrollTo(listo, { offset: -96 }); else listo.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    if (w.MEXA && w.MEXA.refrescar) w.MEXA.refrescar();
    if (!form.hasAttribute('data-sin-abrir')) w.location.href = url;
  });

  copiar.addEventListener('click', function () {
    var t = texto.textContent;
    function bien() { copiado.textContent = 'Mensaje copiado.'; }
    function mal() {
      var r = d.createRange(); r.selectNodeContents(texto);
      var s = w.getSelection(); s.removeAllRanges(); s.addRange(r);
      copiado.textContent = 'No pudimos copiarlo de forma automática. El texto quedó seleccionado: cópialo con tu teclado.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(bien, mal); else mal();
  });
})();

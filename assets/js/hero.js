/* MEXA Arquitectos · hero.js
   Maqueta abstracta dentro del cubo isométrico del logotipo.
   Losas horizontales, muro de mampostería y volumen acristalado generados por código.
   - Carga: los volúmenes se levantan desde el suelo, uno tras otro.
   - Puntero: la maqueta gira unos grados (amortiguado).
   - Scroll: axonometría explotada (las losas se separan) y el sol recorre la maqueta.
   Solo pinta mientras el héroe está en pantalla. */
import * as THREE from '../vendor/three.module.min.js';

const ARENA = 0xB29F8C;
// centro [x,y,z], tamaño [ancho,alto,fondo], material, nivel (para la explosión)
const PIEZAS = [
  { p: [-0.50, -0.385, 0.42], s: [0.46, 1.23, 0.62], m: 'muro',   n: 0 },
  { p: [ 0.86, -0.69, -0.52], s: [0.08, 0.62, 0.80], m: 'muro',   n: 0 },
  { p: [ 0.32, -0.70,  0.22], s: [1.02, 0.60, 0.86], m: 'vidrio', n: 0 },
  { p: [ 0.12, -0.345, 0.14], s: [1.86, 0.09, 1.52], m: 'losa',   n: 1 },
  { p: [ 0.28, -0.02, -0.26], s: [0.92, 0.56, 0.78], m: 'blanco', n: 2 },
  { p: [-0.08,  0.305,-0.06], s: [1.62, 0.09, 1.50], m: 'losa',   n: 3 },
  { p: [ 0.60,  0.52, -0.40], s: [0.34, 0.34, 0.50], m: 'muro',   n: 4 }
];
const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function iniciar(cont, heroe) {
  if (!cont) return;
  // equipos modestos (móvil, poca memoria, ahorro de datos): menos píxeles y sombras más baratas
  const con = navigator.connection || {};
  const ligero = window.matchMedia('(max-width: 820px)').matches || (navigator.deviceMemory && navigator.deviceMemory <= 4) || !!con.saveData;
  const renderer = new THREE.WebGLRenderer({ antialias: !ligero || (window.devicePixelRatio || 1) < 2, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, ligero ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = ligero ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xffffff, 0);
  cont.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const escena = new THREE.Scene();
  const V = 2.45;
  const cam = new THREE.OrthographicCamera(-V, V, V, -V, 0.1, 50);
  cam.position.set(10, 10, 10); cam.lookAt(0, -0.12, 0);

  escena.add(new THREE.HemisphereLight(0xffffff, 0xcfc6ba, 1.25));
  const sol = new THREE.DirectionalLight(0xfff6ea, 2.2);
  sol.castShadow = true;
  sol.shadow.mapSize.set(ligero ? 1024 : 2048, ligero ? 1024 : 2048);
  const sc = sol.shadow.camera; sc.left = -3.5; sc.right = 3.5; sc.top = 3.5; sc.bottom = -3.5; sc.near = 0.5; sc.far = 20;
  sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02; sol.shadow.radius = 5;
  escena.add(sol); escena.add(sol.target);

  const mats = {
    losa:   new THREE.MeshStandardMaterial({ color: 0xf1ede7, roughness: 0.92 }),
    blanco: new THREE.MeshStandardMaterial({ color: 0xe4dfd7, roughness: 0.95 }),
    muro:   new THREE.MeshStandardMaterial({ color: ARENA, roughness: 1 }),
    vidrio: new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.35, metalness: 0.1 })
  };

  const grupo = new THREE.Group();
  escena.add(grupo);
  const caja = new THREE.BoxGeometry(1, 1, 1);
  const bordes = new THREE.EdgesGeometry(caja);
  const matBorde = new THREE.LineBasicMaterial({ color: 0x17140F, transparent: true, opacity: 0.5 });
  const piezas = PIEZAS.map((d, i) => {
    const m = new THREE.Mesh(caja, mats[d.m]);
    m.castShadow = true; m.receiveShadow = true;
    // aristas dibujadas: la maqueta se lee como dibujo aunque la losa sea casi blanca
    m.add(new THREE.LineSegments(bordes, matBorde));
    grupo.add(m);
    return { m, d, i };
  });

  // suelo que solo recibe sombra
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.16, color: 0x17140F }));
  suelo.rotation.x = -Math.PI / 2; suelo.position.y = -1.001; suelo.receiveShadow = true;
  grupo.add(suelo);

  // cubo del logotipo: 12 aristas finas; una vertical queda abierta, como en el isotipo
  const matLinea = new THREE.MeshBasicMaterial({ color: ARENA });
  const G = 0.012, aristas = [];
  const arista = (c, eje, largo) => {
    const s = [G, G, G]; s[eje] = largo;
    const m = new THREE.Mesh(caja, matLinea);
    m.position.set(c[0], c[1], c[2]); m.userData = { s, eje };
    grupo.add(m); aristas.push(m);
  };
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    arista([0, a, b], 0, 2);
    if (a === 1 && b === -1) arista([a, -0.55, b], 1, 0.9); else arista([a, 0, b], 1, 2);
    arista([a, b, 0], 2, 2);
  }

  let ancho = 0, alto = 0;
  const medir = () => {
    const r = cont.getBoundingClientRect();
    if (!r.width || !r.height) return;
    ancho = r.width; alto = r.height;
    renderer.setSize(ancho, alto, false);
    const k = ancho / alto;
    cam.left = -V * k; cam.right = V * k; cam.updateProjectionMatrix();
  };
  medir();
  new ResizeObserver(() => { medir(); if (typeof despertar === 'function') despertar(); }).observe(cont);

  let px = 0, py = 0, rx = 0, ry = 0, visible = true, t0 = null, previo = 0, raf = 0, lista = false;
  window.addEventListener('pointermove', (e) => {
    px = (e.clientX / window.innerWidth) * 2 - 1;
    py = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const cuadro = (ms) => {
    raf = 0;
    if (t0 === null) { t0 = ms; previo = ms; }
    const t = (ms - t0) / 1000, dt = Math.min((ms - previo) / 1000, 0.05); previo = ms;

    // avance: con el héroe fijo (escritorio) manda el progreso del pin; si no, lo que la maqueta lleva recorrido
    let av = 0;
    const pin = window.MEXA && window.MEXA.heroe;
    if (pin) av = clamp(pin.progress / 0.92, 0, 1);
    else { const r = cont.getBoundingClientRect(); av = clamp((cabeceraAlto + 24 - r.top) / Math.max(r.height * 0.6, 1), 0, 1); }
    const abre = av * av * (3 - 2 * av);
    // de cerca en reposo; se aleja al abrirse para que la axonometría quepa entera
    const zoom = 1.2 - 0.2 * abre;
    if (Math.abs(cam.zoom - zoom) > 0.0005) { cam.zoom = zoom; cam.updateProjectionMatrix(); }

    // entrada: cada volumen crece desde su base
    for (const { m, d, i } of piezas) {
      const e = expoOut(clamp((t - 0.25 - i * 0.1) / 1.25, 0, 1));
      const sy = Math.max(e, 0.001);
      const base = d.p[1] - d.s[1] / 2 + d.n * 0.26 * abre;
      m.scale.set(d.s[0], d.s[1] * sy, d.s[2]);
      m.position.set(d.p[0], base + (d.s[1] * sy) / 2, d.p[2]);
      m.visible = e > 0.002;
    }
    for (let i = 0; i < aristas.length; i++) {
      const a = aristas[i], e = expoOut(clamp((t - i * 0.04) / 1.1, 0, 1));
      const s = a.userData.s.slice(); s[a.userData.eje] *= Math.max(e, 0.001);
      a.scale.set(s[0], s[1], s[2]);
    }

    // giro amortiguado con el puntero + giro por scroll
    const k = 1 - Math.exp(-dt * 3.5);
    ry += ((px * 0.22 + abre * 0.7) - ry) * k;
    rx += ((py * 0.07) - rx) * k;
    grupo.rotation.y = ry; grupo.rotation.x = rx;
    grupo.position.y = -abre * 0.35;

    // el sol recorre la maqueta
    const ang = 0.35 + abre * 1.4;
    sol.position.set(Math.cos(ang) * 3.2, 6.4 - abre * 1.6, Math.sin(ang) * 3.2);

    renderer.render(escena, cam);
    if (!lista) { lista = true; cont.classList.add('is-lista'); }
    // en reposo (entrada terminada, sin scroll ni puntero pendientes) el bucle se detiene; lo despiertan scroll, puntero y tamaño
    const quieto = t > 2.6 && Math.abs(av - avPrev) < 0.0004 && Math.abs((px * 0.22 + abre * 0.7) - ry) < 0.0015 && Math.abs(py * 0.07 - rx) < 0.0015;
    avPrev = av;
    if (quieto) { if (++calma > 20) return; } else calma = 0;
    pedir();
  };
  let avPrev = -1, calma = 0;
  const cabeceraAlto = 64;
  const pedir = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(cuadro); };
  const despertar = () => { calma = 0; pedir(); };
  window.addEventListener('scroll', despertar, { passive: true });
  window.addEventListener('pointermove', despertar, { passive: true });
  window.addEventListener('resize', despertar, { passive: true });
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; pedir(); }, { rootMargin: '80px' }).observe(cont);
  document.addEventListener('visibilitychange', pedir);
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); const r = cont.parentElement.querySelector('img[data-src]'); if (r) { r.src = r.dataset.src; r.removeAttribute('data-src'); } cont.parentElement.classList.add('sin-webgl'); });
  pedir();
}

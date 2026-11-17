/* MEXA Arquitectos · recorrido.js
   Portada en recorrido 3D. Un edificio abstracto hecho con el vocabulario de MEXA
   (losas en voladizo, muro de mampostería, vidrio, patio) y una cámara que lo recorre con el scroll:
     intro  vista aérea
     A      fachada y voladizo de acceso        (Estudio)
     B      galería con 14 proyectos colgados    (Obra)
     C      patio y escalera                     (Proceso)
     D      azotea con las placas de premios     (Premios)
     E      salida aérea al atardecer            (Contacto)
   La luz pasa de mañana a atardecer a lo largo del recorrido. */
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const html = document.documentElement;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const suave = (t) => t * t * (3 - 2 * t);
const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/* ---------- menú móvil (con o sin 3D) ---------- */
(function menu() {
  const boton = document.querySelector('.menu-boton'), m = document.getElementById('menu');
  if (!boton || !m) return;
  const estado = (abrir) => {
    m.classList.toggle('is-abierto', abrir); html.classList.toggle('menu-abierto', abrir);
    boton.setAttribute('aria-expanded', abrir ? 'true' : 'false'); boton.textContent = abrir ? 'Cerrar' : 'Menú';
    m.inert = !abrir;
    if (abrir) { const a = m.querySelector('a'); if (a) a.focus({ preventScroll: true }); }
  };
  m.inert = true;
  boton.addEventListener('click', () => estado(!m.classList.contains('is-abierto')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && m.classList.contains('is-abierto')) { estado(false); boton.focus(); } });
  matchMedia('(min-width: 821px)').addEventListener('change', (q) => { if (q.matches) estado(false); });
})();

/* ---------- proyectos de la galería (datos literales de su web) ---------- */
const OBRA = [
  { s: 'sempai', f: '01', n: 'Sempai', m: 'Restaurante, Bosques de las Lomas, CDMX, 2019' },
  { s: 'nana', f: '01', n: 'Nana', m: 'Restaurante, Bosques de las Lomas, CDMX, 2019' },
  { s: 'casa-en-la-montana', f: '01', n: 'Casa en la montaña', m: 'Casa unifamiliar, Estado de México, 2018' },
  { s: 'casa-entre-patios', f: '02', n: 'Casa Entre Patios', m: 'Casa unifamiliar, Coyoacán, CDMX, 2017' },
  { s: 'kaax', f: '01', n: "Ka'ax", m: 'Desarrollo inmobiliario, Temozón Norte, Mérida, 2023' },
  { s: 'casa-ot', f: '01', n: 'Casa OT', m: 'Compostela, Mérida, 2023' },
  { s: 'casa-pb', f: '02', n: 'Casa PB', m: 'Privada Temozón, Mérida, 2022' },
  { s: 'rgvb', f: '01', n: 'RGVB', m: 'Valle de Bravo, 2021' },
  { s: 'oficinas-save-the-children-mexico', f: '01', n: 'Oficinas Save the Children México', m: 'Oficinas, Coyoacán, CDMX, 2019' },
  { s: 'casa-db', f: '02', n: 'Casa DB', m: 'Valle de Bravo, Estado de México, 2022' },
  { s: 'rehabilitacion-de-edificio-en-la-roma-norte', f: '02', n: 'Rehabilitación de edificio en la Roma Norte', m: 'Edificio habitacional, Roma Norte, CDMX, 2017' },
  { s: 'vivienda-social-en-ocuituco', f: '01', n: 'Vivienda social en Ocuituco', m: 'Vivienda social, Ocuituco, Morelos, 2019' },
  { s: 'centro-de-migrantes', f: '03', n: 'Centro de Migrantes', m: 'Calais, Francia, 2015' },
  { s: 'the-next-helsinki', f: '01', n: 'The Next Helsinki', m: 'Concurso internacional, Helsinki, Finlandia, 2015' }
];

const PREMIOS = [
  { a: '2019', n: 'Premio Noldi Schreck', d: 'Primer lugar en la categoría restaurante-bar', p: 'Sempai' },
  { a: '2019', n: 'Premio Firenze Entremuros', d: 'Finalistas en interiorismo corporativo y comercial', p: 'Nana' },
  { a: '2015', n: 'The Next Helsinki', d: 'Concurso internacional, proyecto seleccionado', p: 'Parc Art Helsinki' }
];

/* ruta de la cámara: [progreso, posición, punto al que mira] */
const RUTA = [
  [0.000, [24, 15, 40], [-13, 2, -6]],
  [0.070, [17, 8, 30], [-9, 2, -2]],
  [0.150, [9, 2.6, 21], [-1.5, 2, 8]],
  [0.250, [3.5, 1.8, 15.5], [0, 1.8, 6]],
  [0.315, [0, 1.65, 11.5], [0, 1.7, 2]],
  [0.400, [0, 1.62, 4], [0, 1.65, -6]],
  [0.490, [0, 1.62, -3.5], [0, 1.65, -13]],
  [0.585, [0, 1.65, -12], [0, 1.75, -21.5]],
  [0.645, [-1.4, 1.8, -19.5], [2, 2, -27]],
  [0.700, [-3, 2.4, -26.5], [5, 3, -22]],
  [0.760, [3, 3.6, -29], [5, 4.6, -19]],
  [0.820, [5, 5.4, -21], [-1, 4.6, -14]],
  [0.880, [0.5, 5.3, -21.5], [-1.8, 4.9, -14]],
  [0.925, [0, 6.5, -24], [0, 4.5, -12]],
  [0.970, [26, 20, 4], [0, 2, -6]],
  [1.000, [32, 26, 12], [0, 2, -6]]
];
const OBRA_DESDE = 0.30, OBRA_HASTA = 0.62;

if (html.classList.contains('tres-d')) iniciar();

function aEstatico() {
  html.classList.remove('tres-d'); html.classList.add('estatico', 'is-listo');
  window.scrollTo(0, 0);
}

function iniciar() {
  const lienzo = document.getElementById('lienzo');
  let sucio = true, listo = false;
  const movil = matchMedia('(max-width: 820px)').matches;
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ligero = movil || (navigator.deviceMemory && navigator.deviceMemory <= 4);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: !ligero || (devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
  } catch (e) { aEstatico(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, ligero ? 1.5 : 2));
  renderer.shadowMap.enabled = !ligero;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  lienzo.addEventListener('webglcontextlost', (e) => { e.preventDefault(); aEstatico(); });

  /* ---------- escena, cielo y luz ---------- */
  const CIELO_DIA = new THREE.Color(0xF2F0EC), CIELO_TARDE = new THREE.Color(0xEAD9C7);
  const escena = new THREE.Scene();
  escena.background = CIELO_DIA.clone();
  escena.fog = new THREE.Fog(CIELO_DIA.clone(), 34, 110);
  const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 300);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d0c4, 1.3);
  escena.add(hemi);
  escena.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sol = new THREE.DirectionalLight(0xfff8f0, 2.4);
  sol.castShadow = !ligero;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 160 });
  sol.shadow.bias = -0.0005; sol.shadow.normalBias = 0.03;
  sol.target.position.set(0, 0, -8);
  escena.add(sol, sol.target);
  const SOL_DIA = new THREE.Color(0xfff8f0), SOL_TARDE = new THREE.Color(0xffbf8a);
  const HEMI_DIA = new THREE.Color(0xffffff), HEMI_TARDE = new THREE.Color(0xffe4c8);

  /* ---------- materiales ---------- */
  const anis = renderer.capabilities.getMaxAnisotropy();
  let semilla = 7;
  const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
  // reflejos suaves solo para vidrio y agua
  let envTex = null;
  try { envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture; } catch (e) {}

  // texturas dibujadas en canvas: piedra, madera y losas
  function lienzoTex(w, h, pintar) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    pintar(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = anis;
    return t;
  }
  const rgb = (r, g, b, k) => `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`;
  const TEX_PIEDRA = lienzoTex(512, 512, (x, w, h) => {
    x.fillStyle = '#D3C6B6'; x.fillRect(0, 0, w, h);
    let y = 0;
    while (y < h) {
      const fh = h - y < 90 ? h - y : 46 + Math.floor(azar() * 38);
      const ini = Math.floor(azar() * 120);
      for (let xx = ini; xx < ini + w;) {
        const fw = 64 + Math.floor(azar() * 120), k = 0.86 + azar() * 0.2;
        x.fillStyle = rgb(178, 159, 140, k);
        for (const d of [0, -w]) x.fillRect(xx + d + 3, y + 3, fw - 6, fh - 6);
        xx += fw;
      }
      y += fh;
    }
  });
  const TEX_MADERA = lienzoTex(512, 512, (x, w, h) => {
    const n = 8, pw = w / n;
    for (let i = 0; i < n; i++) {
      for (let y = -Math.floor(azar() * h); y < h;) {
        const ph = 170 + azar() * 230, k = 0.9 + azar() * 0.16;
        for (const d of [0, h]) {
          x.fillStyle = rgb(206, 178, 144, k); x.fillRect(i * pw, y + d, pw, ph);
          x.fillStyle = 'rgba(70,45,25,.22)'; x.fillRect(i * pw, y + d, pw, 1.5);
        }
        y += ph;
      }
      x.fillStyle = 'rgba(70,45,25,.25)'; x.fillRect(i * pw, 0, 1.5, h);
      x.fillStyle = 'rgba(90,60,30,.06)';
      for (let v = 0; v < 6; v++) x.fillRect(i * pw + 4 + azar() * (pw - 8), 0, 1, h);
    }
  });
  const TEX_LOSA = lienzoTex(256, 256, (x, w, h) => {
    x.fillStyle = '#C9C0B2'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = rgb(226, 219, 208, 0.95 + azar() * 0.07); x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); }
  });
  // material con textura repetida a escala real (m = metros que cubre la textura)
  const conTex = (tex, ancho, alto, m, r, extra = {}) => {
    const t = tex.clone(); t.needsUpdate = true; t.repeat.set(ancho / m, alto / m);
    return new THREE.MeshStandardMaterial({ map: t, roughness: r, ...extra });
  };

  const std = (c, r, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
  const M = {
    losa: std(0xF4F1EC, 0.9, { emissive: 0x2c2925 }), blanco: std(0xEAE6DF, 0.95, { emissive: 0x3b3732 }),
    vidrio: std(0x2a2722, 0.12, { metalness: 0.55, envMap: envTex, envMapIntensity: 0.9 }),
    cristal: new THREE.MeshStandardMaterial({ color: 0xDCE4E1, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false, envMap: envTex, envMapIntensity: 0.6 }),
    agua: std(0x4E5C59, 0.06, { metalness: 0.7, envMap: envTex, envMapIntensity: 1 }),
    madera: std(0x9C7552, 0.7), suelo: std(0xE8E4DD, 1), pasto: std(0xD2D3BD, 1),
    tinta: std(0x17140F, 0.6), copa: std(0xA39E86, 0.95, { flatShading: true }), copa2: std(0x8C9172, 0.95, { flatShading: true }),
    ciudad: std(0xEDEAE4, 1), galeria: std(0xF2EFE9, 0.95, { emissive: 0x4f4a44 })
  };
  const caja = new THREE.BoxGeometry(1, 1, 1);
  const bordes = new THREE.EdgesGeometry(caja);
  const matBorde = new THREE.LineBasicMaterial({ color: 0x17140F, transparent: true, opacity: 0.26 });

  const edificio = new THREE.Group();
  escena.add(edificio);
  const piezas = [];
  // bloque por sus límites; «orden» decide cuándo se levanta en la entrada
  function bloque(x0, x1, y0, y1, z0, z1, mat, op = {}) {
    const { borde = true, sombra = true, orden = piezas.length * 0.35, grupo = edificio } = op;
    const m = new THREE.Mesh(caja, mat);
    m.castShadow = sombra; m.receiveShadow = true;
    if (borde) m.add(new THREE.LineSegments(bordes, matBorde));
    m.userData = { y0, h: y1 - y0, orden };
    m.scale.set(x1 - x0, y1 - y0, z1 - z0);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    grupo.add(m); piezas.push(m);
    return m;
  }
  // muchas piezas iguales (listones, parteluces, vigas) en una sola malla; se levantan juntas desde y0
  function serie(lista, mat, y0, orden, sombra = true) {
    const im = new THREE.InstancedMesh(caja, mat, lista.length), o = new THREE.Object3D();
    lista.forEach(([x0, x1, a, b, z0, z1], i) => {
      o.scale.set(x1 - x0, b - a, z1 - z0); o.position.set((x0 + x1) / 2, (a + b) / 2 - y0, (z0 + z1) / 2);
      o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    });
    im.castShadow = sombra; im.receiveShadow = true; im.frustumCulled = false;
    const g = new THREE.Group(); g.position.y = y0; g.add(im);
    g.userData = { grupo: true, orden }; edificio.add(g); piezas.push(g);
    return g;
  }
  const paso = (desde, hasta, cada, f) => { const r = []; for (let v = desde; v <= hasta + 1e-6; v += cada) r.push(f(v)); return r; };

  // suelo, jardines y caminos de piedra
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), M.suelo);
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true;
  escena.add(suelo);
  bloque(-20, -3.4, 0, 0.02, 9.2, 24, M.pasto, { borde: false, sombra: false, orden: 0 });
  bloque(-8, -3.4, 0, 0.02, -17.6, 8.2, M.pasto, { borde: false, sombra: false, orden: 0 });
  bloque(-6.6, -3, 0, 0.03, -31, -18.4, M.pasto, { borde: false, sombra: false, orden: 0.2 });
  bloque(-1.6, 1.6, 0, 0.04, 8, 26, conTex(TEX_LOSA, 3.2, 18, 1.8, 0.85), { borde: false, sombra: false, orden: 0 });

  // espejo de agua frente al muro de piedra
  bloque(-12.3, -4.3, 0, 0.13, 9.7, 14.3, M.losa, { borde: false, orden: 0.3 });
  bloque(-12, -4.6, 0.13, 0.135, 10, 14, M.agua, { borde: false, sombra: false, orden: 0.9 });

  // galería: piso de madera, muro ciego a la derecha (los cuadros), pared de vidrio con parteluces a la izquierda
  bloque(-3, 3, 0, 0.06, -18, 8, conTex(TEX_MADERA, 6, 26, 1.6, 0.6), { borde: false, sombra: false, orden: 0.5 });
  bloque(3, 3.25, 0, 3.4, -18, 8, M.galeria, { orden: 1.2 });
  bloque(-3.12, -3.06, 0.06, 3.4, -18, 8, M.cristal, { borde: false, sombra: false, orden: 1 });
  serie(paso(-18, 8, 0.55, (z) => [-3.42, -3.14, 0, 3.4, z - 0.03, z + 0.03]), M.madera, 0, 1.1);
  bloque(-3.6, -0.6, 3.4, 3.7, -18.4, 11, M.losa, { orden: 2 });
  bloque(0.6, 3.6, 3.4, 3.7, -18.4, 11, M.losa, { orden: 2.2 });
  // lucernario con vigas: la luz entra en franjas
  serie(paso(-18.2, 10.8, 0.45, (z) => [-0.62, 0.62, 3.46, 3.7, z - 0.05, z + 0.05]), M.losa, 3.4, 2.3);

  // muro de mampostería al frente
  bloque(-13, -3.25, 0, 2.8, 8.4, 9, conTex(TEX_PIEDRA, 9.75, 2.8, 1.6, 1), { orden: 1.4 });
  // pabellón de vidrio con parteluces
  bloque(3.25, 8.5, 0, 3, -4, 5.5, M.vidrio, { orden: 1.6 });
  serie([...paso(3.3, 8.45, 1.03, (x) => [x - 0.04, x + 0.04, 0, 3, 5.5, 5.6]), ...paso(-3.95, 5.45, 1.175, (z) => [8.5, 8.6, 0, 3, z - 0.04, z + 0.04])], M.tinta, 0, 1.7);
  bloque(3.25, 9, 3, 3.2, -4.4, 6, M.losa, { orden: 2.4 });
  // volumen superior en voladizo, franja acristalada y celosía de madera al sur y al oriente
  bloque(-2.6, 7, 3.7, 7, -12, 2.5, M.blanco, { orden: 3 });
  bloque(-2.3, 6.7, 4.6, 6.2, 2.5, 2.58, M.vidrio, { borde: false, orden: 3.2 });
  bloque(-2.3, 6.7, 4.6, 6.2, -12.08, -12, M.vidrio, { borde: false, orden: 3.2 });
  bloque(7, 7.08, 4.6, 6.2, -11.7, 2.2, M.vidrio, { borde: false, orden: 3.2 });
  serie([...paso(-2.45, 6.85, 0.3, (x) => [x - 0.035, x + 0.035, 3.75, 6.95, 2.62, 2.76]), ...paso(-11.85, 2.35, 0.3, (z) => [7.12, 7.26, 3.75, 6.95, z - 0.035, z + 0.035])], M.madera, 3.7, 3.5);
  // patio: muros de piedra y escalera maciza a la azotea
  bloque(-7, -6.6, 0, 2.2, -31, -18, conTex(TEX_PIEDRA, 13, 2.2, 1.6, 1), { orden: 1.8 });
  bloque(-7, 9, 0, 5, -31.4, -31, conTex(TEX_PIEDRA, 16, 5, 1.6, 1), { orden: 2 });
  bloque(-3, 3, 0, 0.05, -31, -18.4, conTex(TEX_LOSA, 6, 12.6, 1.8, 0.85), { borde: false, sombra: false, orden: 0.6 });
  const PELDANOS = 12, sube = 3.7 / PELDANOS, huella = (28 - 18.6) / PELDANOS;
  for (let i = 0; i < PELDANOS; i++) {
    const z0 = -28 + i * huella;
    bloque(4, 6, 0, sube * (i + 1), z0, z0 + huella, M.losa, { orden: 2.6 + i * 0.05 });
  }

  // árboles: tronco fino y copa de varios volúmenes
  const arboles = [];
  function arbol(x, z, k, giro) {
    const g = new THREE.Group();
    const alto = 2.6 * k;
    const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * k, 0.12 * k, alto, 7), M.tinta);
    tronco.position.y = alto / 2; tronco.castShadow = true; g.add(tronco);
    [[0, 0, 0, 1.25], [0.8, -0.35, 0.3, 0.9], [-0.7, -0.25, -0.4, 0.95], [0.15, 0.55, -0.2, 0.8]].forEach(([dx, dy, dz, r], i) => {
      const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(r * k, 1), i % 2 ? M.copa2 : M.copa);
      copa.position.set(dx * k, alto + 0.7 * k + dy * k, dz * k); copa.rotation.y = giro + i;
      copa.castShadow = true; copa.receiveShadow = true; g.add(copa);
    });
    g.position.set(x, 0, z); g.rotation.y = giro;
    escena.add(g); arboles.push(g);
  }
  arbol(-4.5, -28.5, 1, 0.3);
  arbol(-5.4, 3.5, 0.85, 1.2); arbol(-5.9, -6, 1.05, 2.1); arbol(-5.2, -14.5, 0.8, 0.7);
  arbol(-15.5, 12, 1.15, 1.7); arbol(-17.5, 18.5, 0.9, 2.6); arbol(12.5, 9, 1.1, 0.9); arbol(11.5, -9, 0.95, 2.9);

  // ciudad alrededor, tenue (da escala a las vistas aéreas)
  for (let i = 0; i < (ligero ? 14 : 26); i++) {
    const ang = azar() * Math.PI * 2, r = 34 + azar() * 34;
    const x = Math.cos(ang) * r, z = -6 + Math.sin(ang) * r, w = 4 + azar() * 7, d = 4 + azar() * 7, h = 2 + azar() * 9;
    bloque(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, M.ciudad, { borde: false, orden: 3 + azar() * 2 });
  }

  /* ---------- galería: 14 cuadros con fotos reales ---------- */
  const cargador = new THREE.LoadingManager();
  const lectorTex = new THREE.TextureLoader(cargador);
  const barra = document.querySelector('.carga');
  cargador.onProgress = (_u, hechos, total) => barra && barra.style.setProperty('--p', (hechos / total).toFixed(3));
  const ANCHO = 1.38, ALTO = 0.92, AR = ANCHO / ALTO;
  const marcoGeo = new THREE.PlaneGeometry(ANCHO + 0.08, ALTO + 0.08), fotoGeo = new THREE.PlaneGeometry(ANCHO, ALTO);
  const cuadros = OBRA.map((o, i) => {
    const z = 5 - i * (21 / 13);
    const g = new THREE.Group();
    g.position.set(2.97, 1.62, z);
    g.rotation.y = -Math.PI / 2;
    const marco = new THREE.Mesh(marcoGeo, new THREE.MeshBasicMaterial({ color: 0x17140F }));
    const mat = new THREE.MeshBasicMaterial({ color: 0xECEAE7 });
    const foto = new THREE.Mesh(fotoGeo, mat);
    foto.position.z = 0.004; foto.userData.i = i;
    g.add(marco, foto); edificio.add(g);
    lectorTex.load(`assets/img/${o.s}/${o.f}-${ligero ? '720' : '1200'}.webp`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = anis;
      const a = t.image.width / t.image.height;
      if (a > AR) { t.repeat.set(AR / a, 1); t.offset.set((1 - AR / a) / 2, 0); }
      else { t.repeat.set(1, a / AR); t.offset.set(0, (1 - a / AR) / 2); }
      mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; sucio = true;
    });
    return { g, foto, x: 2.97, z, o };
  });

  /* ---------- azotea: placas de premios ---------- */
  function placaTextura(p) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 736;
    const x = c.getContext('2d');
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 512, 736);
    x.strokeStyle = '#B29F8C'; x.lineWidth = 3; x.strokeRect(24, 24, 464, 688);
    const familia = '"Archivo", "Helvetica Neue", Arial, sans-serif';
    if ('fontStretch' in x) x.fontStretch = 'expanded';
    x.fillStyle = '#7A5C41'; x.font = `500 72px ${familia}`; x.fillText(p.a, 56, 132);
    x.fillStyle = '#17140F'; x.font = `500 42px ${familia}`;
    let y = parcelar(x, p.n, 56, 220, 400, 50);
    if ('fontStretch' in x) x.fontStretch = 'normal';
    x.fillStyle = '#6A645C'; x.font = `400 28px ${familia}`;
    parcelar(x, p.d, 56, y + 40, 400, 38);
    x.fillStyle = '#17140F'; x.font = `500 30px ${familia}`; x.fillText(p.p, 56, 668);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = anis;
    return t;
  }
  function parcelar(x, texto, px, py, ancho, alto) {
    let linea = '', y = py;
    for (const w of texto.split(' ')) {
      const prueba = linea ? linea + ' ' + w : w;
      if (x.measureText(prueba).width > ancho && linea) { x.fillText(linea, px, y); linea = w; y += alto; } else linea = prueba;
    }
    x.fillText(linea, px, y);
    return y;
  }
  const placas = [];
  const hacerPlacas = () => {
    PREMIOS.forEach((p, i) => {
      const caras = [M.blanco, M.blanco, M.blanco, M.blanco, M.blanco, new THREE.MeshBasicMaterial({ map: placaTextura(p) })];
      const m = new THREE.Mesh(caja, caras);
      const px = (1 - i) * 2.2;
      m.scale.set(1.6, 2.3, 0.08); m.position.set(px, 3.7 + 1.15, -15);
      m.castShadow = true; m.userData = { y0: 3.7, h: 2.3, orden: 3.4 + i * 0.1 };
      if (!listo) { m.scale.y = 0.0005; m.visible = false; }
      edificio.add(m); placas.push(m); piezas.push(m);
    });
    sucio = true;
  };
  (document.fonts && document.fonts.load ? document.fonts.load('500 42px "Archivo"').catch(() => {}) : Promise.resolve()).then(hacerPlacas);

  /* ---------- cubo del logotipo (aparece al final) ---------- */
  const matArena = new THREE.MeshBasicMaterial({ color: 0xB29F8C, transparent: true, opacity: 0.9, fog: false });
  const aristas = [];
  const C = [-2, 12, -6], L = 12, G = 0.14;
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    const def = [[[0, a, b], 0, 1], [[a, 0, b], 1, a === 1 && b === -1 ? 0.45 : 1], [[a, b, 0], 2, 1]];
    for (const [c, eje, largo] of def) {
      const m = new THREE.Mesh(caja, matArena);
      const centro = c.map((v, k) => C[k] + v * L);
      if (eje === 1 && largo < 1) centro[1] = C[1] - L + L * largo;
      m.position.set(centro[0], centro[1], centro[2]);
      m.userData = { eje, largo: 2 * L * largo };
      m.visible = false; escena.add(m); aristas.push(m);
    }
  }

  /* ---------- curvas de la cámara ---------- */
  const curvaPos = new THREE.CatmullRomCurve3(RUTA.map((k) => new THREE.Vector3(...k[1])), false, 'centripetal');
  const curvaMira = new THREE.CatmullRomCurve3(RUTA.map((k) => new THREE.Vector3(...k[2])), false, 'centripetal');
  const N = RUTA.length - 1, DIV = 80;
  const pos = new THREE.Vector3(), mira = new THREE.Vector3(), tmp = new THREE.Vector3();
  // la cámara avanza por distancia recorrida y la velocidad cambia sin saltos entre tramos
  curvaPos.arcLengthDivisions = N * DIV;
  const largos = curvaPos.getLengths(), P = RUTA.map((k) => k[0]), S = P.map((_, i) => largos[i * DIV]);
  const D = P.slice(0, N).map((p, i) => (S[i + 1] - S[i]) / (P[i + 1] - p));
  const V = P.map((_, i) => (i === 0 ? D[0] : i === N ? D[N - 1] : 2 / (1 / D[i - 1] + 1 / D[i])));
  function enRuta(p) {
    p = clamp(p, 0, 1);
    let i = 0;
    while (i < N - 1 && p > P[i + 1]) i++;
    const h = P[i + 1] - P[i], t = (p - P[i]) / h, t2 = t * t, t3 = t2 * t;
    const s = (2 * t3 - 3 * t2 + 1) * S[i] + (t3 - 2 * t2 + t) * h * V[i] + (-2 * t3 + 3 * t2) * S[i + 1] + (t3 - t2) * h * V[i + 1];
    const u = curvaPos.getUtoTmapping(0, s);
    curvaPos.getPoint(u, pos); curvaMira.getPoint(u, mira);
  }

  /* ---------- módulos HTML ---------- */
  const modulos = [...document.querySelectorAll('.modulo')].map((el) => ({
    el, desde: +el.dataset.desde, hasta: +el.dataset.hasta, id: el.id,
    lineas: [...el.querySelectorAll('.l')].map((l) => l.firstElementChild).filter(Boolean),
    vivo: false, tocable: false
  }));
  const ejes = [...document.querySelectorAll('.ejes a')];
  const activoEl = document.querySelector('.activo');
  const activo = activoEl && {
    enlace: activoEl.querySelector('.activo__enlace'), nombre: activoEl.querySelector('.activo__nombre'),
    meta: activoEl.querySelector('.activo__meta'), n: activoEl.querySelector('.activo__n'), i: -1
  };
  function ponerActivo(i) {
    if (!activo || activo.i === i) return;
    activo.i = i;
    if (i < 0) {
      activo.nombre.textContent = 'Galería de obra'; activo.meta.textContent = 'Ciudad de México, Mérida y otros estados';
      activo.enlace.href = 'proyectos/index.html'; activo.n.textContent = '00';
    } else {
      const o = OBRA[i];
      activo.nombre.textContent = o.n; activo.meta.textContent = o.m;
      activo.enlace.href = `proyectos/${o.s}/index.html`; activo.n.textContent = String(i + 1).padStart(2, '0');
    }
    activoEl.classList.remove('is-cambio'); void activoEl.offsetWidth; activoEl.classList.add('is-cambio');
  }

  let inicio = 0; // 0 → 1 tras la carga: anima la entrada del título y del edificio
  function pintarModulos(p) {
    let mejor = null, mejorV = 0;
    for (const md of modulos) {
      const q = (p - md.desde) / (md.hasta - md.desde);
      const vivo = q > -0.03 && q < 1.03;
      if (vivo !== md.vivo) { md.vivo = vivo; md.el.classList.toggle('is-vivo', vivo); }
      if (!vivo) continue;
      const e = clamp(q / 0.16, 0, 1) * inicio, x = clamp((q - 0.84) / 0.16, 0, 1);
      md.lineas.forEach((ln, j) => {
        const ej = suave(clamp(e * 1.6 - j * 0.1, 0, 1));
        ln.style.transform = ej >= 1 ? 'none' : `translate3d(0, ${((1 - ej) * 108).toFixed(2)}%, 0)`;
      });
      md.el.style.opacity = (1 - x).toFixed(3);
      md.el.style.transform = x > 0 ? `translate3d(0, ${(-x * 5).toFixed(2)}vh, 0)` : '';
      const tocable = e > 0.9 && x < 0.15;
      if (tocable !== md.tocable) { md.tocable = tocable; md.el.classList.toggle('is-tocable', tocable); }
      const v = Math.min(e, 1 - x);
      if (md.id && v > mejorV) { mejorV = v; mejor = md.id; }
    }
    for (const a of ejes) a.classList.toggle('is-activo', !!mejor && a.getAttribute('href') === '#' + mejor);
  }

  /* ---------- scroll suave ---------- */
  const lenis = window.Lenis ? new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 }) : null;
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let objetivo = 0, actual = 0;
  const leer = () => { objetivo = clamp(scrollY / maxScroll(), 0, 1); sucio = true; };
  addEventListener('scroll', leer, { passive: true });
  ejes.forEach((a) => a.addEventListener('click', (e) => {
    const md = modulos.find((m) => '#' + m.id === a.getAttribute('href'));
    if (!md) return;
    e.preventDefault();
    const destino = clamp(md.desde + 0.4 * (Math.min(md.hasta, 1) - md.desde), 0, 1) * maxScroll();
    if (lenis) lenis.scrollTo(destino, { duration: 2.4 }); else scrollTo({ top: destino, behavior: 'smooth' });
  }));
  const cabecera = document.querySelector('.cabecera');

  /* ---------- puntero: leve paralaje y clic en los cuadros ---------- */
  let px = 0, py = 0, sx = 0, sy = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const fotos = cuadros.map((c) => c.foto);
  const tocado = (e) => {
    if (actual < OBRA_DESDE - 0.02 || actual > OBRA_HASTA + 0.02) return null;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const h = ray.intersectObjects(fotos, false)[0];
    return h && h.distance < 9 ? h.object.userData.i : null;
  };
  addEventListener('pointermove', (e) => {
    px = (e.clientX / innerWidth) * 2 - 1; py = (e.clientY / innerHeight) * 2 - 1; sucio = true;
    if (fino) lienzo.classList.toggle('is-mano', tocado(e) !== null);
  }, { passive: true });
  let abajo = null;
  lienzo.addEventListener('pointerdown', (e) => { abajo = { x: e.clientX, y: e.clientY }; });
  lienzo.addEventListener('pointerup', (e) => {
    if (!abajo || Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y) > 8) return;
    const i = tocado(e);
    if (i !== null) location.href = `proyectos/${OBRA[i].s}/index.html`;
  });

  /* ---------- tamaño ---------- */
  let aspecto = 1;
  function medir() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    aspecto = w / h;
    cam.aspect = aspecto;
    cam.fov = aspecto < 1 ? 42 + (1 - aspecto) * 34 : 42;
    cam.updateProjectionMatrix();
    sucio = true;
  }
  addEventListener('resize', medir);
  medir();

  /* ---------- luz según el avance (mañana → atardecer) ---------- */
  const colorTmp = new THREE.Color();
  const VIDRIO_LUZ = new THREE.Color(0xF0A85E);
  function luz(p) {
    const k = suave(clamp((p - 0.55) / 0.45, 0, 1));
    const ang = 0.8 + p * 2.2, el = lerp(0.95, 0.3, k);
    sol.position.set(Math.cos(ang) * Math.cos(el) * 60, Math.sin(el) * 60, -8 + Math.sin(ang) * Math.cos(el) * 60);
    sol.color.copy(SOL_DIA).lerp(SOL_TARDE, k);
    sol.intensity = lerp(2.4, 2.0, k);
    M.vidrio.emissive.copy(VIDRIO_LUZ).multiplyScalar(k * 0.5); // las ventanas se encienden al atardecer
    hemi.color.copy(HEMI_DIA).lerp(HEMI_TARDE, k);
    colorTmp.copy(CIELO_DIA).lerp(CIELO_TARDE, k);
    escena.background.copy(colorTmp); escena.fog.color.copy(colorTmp);
  }

  /* ---------- bucle ---------- */
  let t0 = null, previo = 0, calma = 0, gal = 0;
  const GIRO = 0.66; // unos 38°
  function cuadro(ms) {
    requestAnimationFrame(cuadro);
    if (lenis) lenis.raf(ms);
    if (document.hidden) return;
    if (t0 === null) { t0 = ms; previo = ms; }
    const dt = Math.min((ms - previo) / 1000, 0.05); previo = ms;
    const t = listo ? (ms - t0) / 1000 : 0;

    const antes = actual;
    actual += (objetivo - actual) * (1 - Math.exp(-dt * lerp(lenis ? 7 : 5, 4, gal)));
    if (Math.abs(objetivo - actual) < 1e-5) actual = objetivo;
    const enMovimiento = Math.abs(actual - antes) > 1e-6;

    // entrada: el edificio se levanta pieza por pieza
    const entrando = listo && t < 4.2;
    if (listo && (entrando || inicio < 1)) {
      inicio = clamp((t - 0.35) / 1.2, 0, 1);
      for (const m of piezas) {
        const e = expoOut(clamp((t - 0.15 - m.userData.orden * 0.12) / 1.3, 0, 1));
        if (m.userData.grupo) { m.scale.y = Math.max(e, 0.0005); m.visible = e > 0.001; continue; }
        const h = Math.max(m.userData.h * e, 0.0005);
        m.scale.y = h; m.position.y = m.userData.y0 + h / 2; m.visible = e > 0.001;
      }
      arboles.forEach((a, i) => a.scale.setScalar(Math.max(expoOut(clamp((t - 0.8 - i * 0.08) / 1.4, 0, 1)), 0.001)));
      sucio = true;
    }

    const sigue = Math.abs(px - sx) > 0.0005 || Math.abs(py - sy) > 0.0005;
    if (!sucio && !enMovimiento && !entrando && !sigue) { if (++calma > 30) return; } else calma = 0;
    sucio = false;

    // cámara en la ruta
    enRuta(actual);
    // en vertical se aleja en las vistas aéreas para que el edificio quepa
    const aereo = 1 - suave(clamp((actual - 0.07) / 0.07, 0, 1)) + suave(clamp((actual - 0.93) / 0.04, 0, 1));
    if (aspecto < 1 && aereo > 0) { tmp.subVectors(pos, mira).multiplyScalar(1 + (1 - aspecto) * 0.55 * aereo); pos.copy(mira).add(tmp); }

    // en la galería la cámara camina pegada al centro y mira en diagonal al muro de los cuadros:
    // un solo giro que entra y sale suave, sin vaivén de pared a pared
    gal = suave(clamp((actual - 0.305) / 0.05, 0, 1)) * (1 - suave(clamp((actual - 0.59) / 0.045, 0, 1)));
    let foco = -1;
    if (gal > 0) {
      pos.x = lerp(pos.x, 0.15, gal);
      const dx = mira.x - pos.x, dz = mira.z - pos.z, g = GIRO * gal, c = Math.cos(g), sn = Math.sin(g);
      mira.x = pos.x + dx * c - dz * sn; mira.z = pos.z + dx * sn + dz * c;
      if (aspecto < 1) mira.y -= 1.1 * gal;
      // el cuadro activo es el más cercano al centro de la mirada
      const fx = mira.x - pos.x, fz = mira.z - pos.z, fl = Math.hypot(fx, fz);
      let mejor = 0.45;
      for (let i = 0; i < cuadros.length; i++) {
        const vx = cuadros[i].x - pos.x, vz = cuadros[i].z - pos.z;
        const ang = Math.acos(clamp((vx * fx + vz * fz) / (Math.hypot(vx, vz) * fl), -1, 1));
        if (ang < mejor) { mejor = ang; foco = i; }
      }
    }
    ponerActivo(actual >= OBRA_DESDE && actual <= OBRA_HASTA ? foco : -1);

    // paralaje del puntero (escritorio)
    const k = 1 - Math.exp(-dt * 3);
    sx += (px - sx) * k; sy += (py - sy) * k;
    if (fino) { pos.x += sx * 0.35; pos.y -= sy * 0.18; }

    cam.position.copy(pos); cam.lookAt(mira);
    luz(actual);

    // cubo del logotipo al final
    const ec = suave(clamp((actual - 0.94) / 0.06, 0, 1));
    aristas.forEach((a, i) => {
      const e = clamp(ec * 1.5 - i * 0.04, 0, 1);
      a.visible = e > 0.001;
      if (!a.visible) return;
      const s = [G, G, G]; s[a.userData.eje] = a.userData.largo * e;
      a.scale.set(s[0], s[1], s[2]);
    });

    pintarModulos(actual);
    if (cabecera) cabecera.classList.toggle('is-desplazada', actual > 0.002);
    renderer.render(escena, cam);
  }

  // listo cuando hay fuentes y al menos el arranque de las texturas (o a los 3 s)
  for (const m of piezas) { m.scale.y = 0.0005; m.visible = false; }
  arboles.forEach((a) => a.scale.setScalar(0.001));
  let hechos = false;
  const arrancar = () => {
    if (hechos) return; hechos = true;
    leer(); actual = objetivo;
    listo = true; t0 = null; html.classList.add('is-listo');
  };
  cargador.onLoad = arrancar;
  setTimeout(arrancar, 3000);
  pintarModulos(0);
  requestAnimationFrame(cuadro);
}

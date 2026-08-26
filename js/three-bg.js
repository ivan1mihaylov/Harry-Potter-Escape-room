/* ============================================================
   three-bg.js — 3D фон: плаващи свещи, прах и звезди (three.js)
   Ако three.js не се зареди, всичко просто продължава без 3D.
   ============================================================ */

let THREE = null, renderer, scene, camera, candles = [], stars, clock;
let running = false, mode = 'candles', ready = false;
let mouse = { x: 0, y: 0 }, target = { x: 0, y: 0 };
let tint = new Float32Array([1, 0.78, 0.42]);

export async function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return false;
  try {
    THREE = await import('three');
  } catch (e) {
    console.warn('three.js не се зареди — фонът остава 2D.', e);
    canvas.style.background = 'radial-gradient(ellipse at 50% 0%, #1b1526, #07060a 70%)';
    return false;
  }

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight, false);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07060a, 0.028);
  camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 260);
  camera.position.set(0, 0, 26);
  clock = new THREE.Clock();

  buildCandles();
  buildStars();

  addEventListener('resize', onResize);
  addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth - 0.5) * 2;
    target.y = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) loop(); });

  ready = true; running = true; loop();
  return true;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,236,180,.95)');
  grd.addColorStop(0.45, 'rgba(255,178,72,.42)');
  grd.addColorStop(1, 'rgba(255,140,30,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace ?? undefined;
  return t;
}

function candleTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 64, 128);
  // тяло на свещта
  const body = g.createLinearGradient(20, 0, 44, 0);
  body.addColorStop(0, 'rgba(60,52,40,.0)');
  body.addColorStop(.2, 'rgba(238,226,196,.85)');
  body.addColorStop(.55, 'rgba(255,248,222,.95)');
  body.addColorStop(1, 'rgba(120,106,78,.25)');
  g.fillStyle = body;
  g.fillRect(24, 44, 16, 80);
  // восък
  g.fillStyle = 'rgba(255,246,214,.75)';
  g.beginPath(); g.ellipse(32, 46, 8, 3.4, 0, 0, 7); g.fill();
  return new THREE.CanvasTexture(c);
}

function buildCandles() {
  const glow = glowTexture();
  const wax = candleTexture();
  const count = innerWidth < 760 ? 18 : 34;
  const gGeo = new THREE.PlaneGeometry(3.4, 3.4);
  const cGeo = new THREE.PlaneGeometry(0.55, 1.9);

  for (let i = 0; i < count; i++) {
    const group = new THREE.Group();
    const flame = new THREE.Mesh(gGeo, new THREE.MeshBasicMaterial({
      map: glow, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85,
    }));
    const stick = new THREE.Mesh(cGeo, new THREE.MeshBasicMaterial({
      map: wax, transparent: true, depthWrite: false, opacity: 0.5,
    }));
    stick.position.y = -1.25;
    group.add(stick); group.add(flame);

    group.position.set(
      (Math.random() - 0.5) * 62,
      (Math.random() - 0.5) * 40,
      -Math.random() * 62 + 4
    );
    group.userData = {
      base: group.position.clone(),
      sp: 0.25 + Math.random() * 0.7,
      ph: Math.random() * Math.PI * 2,
      amp: 0.5 + Math.random() * 1.5,
      flame, stick,
    };
    candles.push(group);
    scene.add(group);
  }
}

function buildStars() {
  const n = 900;
  const pos = new Float32Array(n * 3);
  const sz = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = 60 + Math.random() * 120;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = -Math.abs(r * Math.cos(ph)) - 20;
    sz[i] = Math.random() * 1.6 + 0.3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));
  const mat = new THREE.PointsMaterial({
    size: 1.1, sizeAttenuation: true, color: 0xdfe6ff, transparent: true,
    opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  stars = new THREE.Points(geo, mat);
  scene.add(stars);
}

function onResize() {
  if (!ready) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
}

function loop() {
  if (!running || !ready) return;
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime();

  mouse.x += (target.x - mouse.x) * 0.035;
  mouse.y += (target.y - mouse.y) * 0.035;
  camera.position.x = mouse.x * 3.2;
  camera.position.y = -mouse.y * 2.2;
  camera.lookAt(0, 0, -18);

  const candleOn = mode === 'candles' ? 1 : (mode === 'dim' ? 0.28 : 0);
  const starOn = mode === 'stars' ? 0.85 : (mode === 'dim' ? 0.4 : 0.12);

  candles.forEach((g, i) => {
    const u = g.userData;
    g.position.y = u.base.y + Math.sin(t * u.sp + u.ph) * u.amp;
    g.position.x = u.base.x + Math.cos(t * u.sp * 0.6 + u.ph) * u.amp * 0.55;
    const flick = 0.72 + Math.sin(t * (7 + i)) * 0.09 + Math.sin(t * (23 + i * 3)) * 0.06;
    u.flame.material.opacity = flick * candleOn;
    u.flame.scale.setScalar(0.86 + flick * 0.24);
    u.flame.material.color.setRGB(tint[0], tint[1], tint[2]);
    u.stick.material.opacity = 0.45 * candleOn;
  });

  if (stars) {
    stars.rotation.y = t * 0.008;
    stars.rotation.x = Math.sin(t * 0.05) * 0.05;
    stars.material.opacity += (starOn - stars.material.opacity) * 0.03;
  }

  renderer.render(scene, camera);
}

/* ---------- публично API ---------- */
export function setBgMode(m) { mode = m; }
export function setBgTint(hex) {
  if (!THREE) return;
  const c = new THREE.Color(hex);
  tint[0] = c.r; tint[1] = c.g; tint[2] = c.b;
}
export function bgPulse() {
  if (!ready) return;
  candles.forEach(g => g.userData.flame.scale.setScalar(1.9));
}
export function isBgReady() { return ready; }

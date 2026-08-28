/* ============================================================
   three-stage.js — многократно използвана 3D сцена за залите
   от Втора част. Всяка зала само си строи предметите.
   ============================================================ */

export async function createStage(container, opts = {}) {
  let THREE;
  try { THREE = await import('three'); }
  catch (e) { console.warn('three.js липсва', e); return null; }

  const {
    fov = 45, dist = 14, height = 7, look = [0, 0, 0],
    bg = 0x07060a, fogNear = 24, fogFar = 62,
    orbit = true, minPolar = 0.15, maxPolar = 1.42,
    autoSpin = 0, ground = true, groundColor = 0x14121c, groundTex = null, groundRepeat = 12,
  } = opts;

  const W = () => container.clientWidth || 480;
  const H = () => container.clientHeight || 400;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { console.warn('WebGL не е достъпен', e); return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (bg != null) scene.fog = new THREE.Fog(bg, fogNear, fogFar);

  const camera = new THREE.PerspectiveCamera(fov, W() / H(), 0.1, 300);
  const pivot = new THREE.Group();          // всичко, което се върти с влаченето
  scene.add(pivot);

  /* ---------- светлини ---------- */
  scene.add(new THREE.HemisphereLight(0x8fa8ff, 0x1a1408, 0.55));
  const key = new THREE.DirectionalLight(0xffe6b0, 1.35);
  key.position.set(9, 16, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 60;
  key.shadow.camera.left = -18; key.shadow.camera.right = 18;
  key.shadow.camera.top = 18; key.shadow.camera.bottom = -18;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6f8cff, 0.5);
  rim.position.set(-10, 6, -9);
  scene.add(rim);
  const warm = new THREE.PointLight(0xffb45a, 0.9, 40);
  warm.position.set(0, 6, 6);
  scene.add(warm);

  /* ---------- под ---------- */
  if (ground) {
    const g = new THREE.Mesh(
      new THREE.CircleGeometry(26, 64),
      new THREE.MeshStandardMaterial({
        color: groundColor, roughness: 0.95, metalness: 0.05,
        map: groundTex ? tex(THREE, groundTex, groundRepeat) : null,
      })
    );
    g.rotation.x = -Math.PI / 2;
    g.position.y = -0.02;
    g.receiveShadow = true;
    scene.add(g);
    const rings = new THREE.Mesh(
      new THREE.RingGeometry(9.6, 9.9, 96),
      new THREE.MeshBasicMaterial({ color: 0xd9b45b, transparent: true, opacity: 0.16, side: THREE.DoubleSide })
    );
    rings.rotation.x = -Math.PI / 2; rings.position.y = 0.01;
    scene.add(rings);
  }

  /* ---------- орбита с влачене ---------- */
  let theta = opts.theta ?? 0.7, phi = opts.phi ?? 0.85, radius = dist;
  let tTheta = theta, tPhi = phi, tRadius = radius;
  let dragging = false, px = 0, py = 0, moved = 0;
  const dom = renderer.domElement;

  const applyCam = () => {
    camera.position.set(
      look[0] + radius * Math.sin(phi) * Math.sin(theta),
      look[1] + radius * Math.cos(phi),
      look[2] + radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(look[0], look[1], look[2]);
  };
  phi = Math.min(maxPolar, Math.max(minPolar, phi));
  applyCam();

  dom.addEventListener('pointerdown', e => {
    dragging = true; moved = 0; px = e.clientX; py = e.clientY;
    dom.setPointerCapture(e.pointerId); dom.style.cursor = 'grabbing';
  });
  dom.addEventListener('pointermove', e => {
    if (!dragging || !orbit) return;
    const dx = e.clientX - px, dy = e.clientY - py;
    px = e.clientX; py = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    tTheta -= dx * 0.007;
    tPhi = Math.min(maxPolar, Math.max(minPolar, tPhi - dy * 0.006));
  });
  const stopDrag = () => { dragging = false; dom.style.cursor = 'grab'; };
  dom.addEventListener('pointerup', stopDrag);
  dom.addEventListener('pointercancel', stopDrag);
  dom.addEventListener('wheel', e => {
    e.preventDefault();
    tRadius = Math.min(dist * 1.9, Math.max(dist * 0.45, tRadius + Math.sign(e.deltaY) * dist * 0.09));
  }, { passive: false });

  /* ---------- избиране с мишката ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pickList = [], pickCb = null, hoverCb = null;
  const hit = (e) => {
    const r = dom.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(pickList, true)[0] || null;
  };
  dom.addEventListener('click', e => {
    if (moved > 9 || !pickCb) return;
    const h = hit(e);
    if (h) pickCb(topPickable(h.object), h);
  });
  dom.addEventListener('pointermove', e => {
    if (!hoverCb || dragging) return;
    const h = hit(e);
    hoverCb(h ? topPickable(h.object) : null);
  });
  function topPickable(o) {
    let n = o;
    while (n && !n.userData.pick && n.parent) n = n.parent;
    return n && n.userData.pick ? n : o;
  }

  /* ---------- цикъл ---------- */
  const frameCbs = [];
  let alive = true, t0 = performance.now();
  const clock = { t: 0, dt: 0 };

  const ro = new ResizeObserver(() => {
    renderer.setSize(W(), H());
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
  });
  ro.observe(container);

  function loop() {
    if (!alive) return;
    requestAnimationFrame(loop);
    const now = performance.now();
    const t = (now - t0) / 1000;
    clock.dt = Math.min(0.05, t - clock.t);
    clock.t = t;
    if (autoSpin && !dragging) tTheta += autoSpin * clock.dt;
    theta += (tTheta - theta) * 0.12;
    phi += (tPhi - phi) * 0.12;
    radius += (tRadius - radius) * 0.1;
    applyCam();
    for (const cb of frameCbs) cb(clock.t, clock.dt);
    renderer.render(scene, camera);
  }
  loop();

  const api = {
    THREE, scene, camera, renderer, pivot, dom,
    add: (o) => pivot.add(o),
    onFrame: (cb) => frameCbs.push(cb),
    setPickables: (list) => { pickList = list; },
    onPick: (cb) => { pickCb = cb; },
    onHover: (cb) => { hoverCb = cb; },
    lookAt: (x, y, z) => { look[0] = x; look[1] = y; look[2] = z; },
    setAngles: (th, ph) => { tTheta = th; tPhi = ph; },
    getAngles: () => ({ theta, phi }),
    dispose() {
      alive = false;
      delete container.__stage;
      ro.disconnect();
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      });
      try { renderer.dispose(); } catch (e) {}
      container.innerHTML = '';
    },
  };
  /* закачаме сцената за самия елемент — удобно за отстраняване на грешки */
  container.__stage = api;
  return api;
}

/* ---------- надпис върху равнинка (за глифове по 3D предмети) ---------- */
export function labelTexture(THREE, text, {
  size = 256, color = '#f3e2b4', bg = 'rgba(0,0,0,0)', font = 'bold 150px Cinzel, Georgia, serif',
} = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, size, size);
  g.font = font;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = color;
  g.shadowColor = color; g.shadowBlur = size * 0.08;
  g.fillText(text, size / 2, size / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/* ------------------------------------------------------------
   Текстури (CC0, Poly Haven) за материалите. Ако файлът липсва,
   материалът си остава с плътния цвят — нищо не се чупи.
   ------------------------------------------------------------ */
const TEX_CACHE = new Map();

export function tex(THREE, name, repeat = 1, repeatY = null) {
  const key = `${name}|${repeat}|${repeatY}`;
  if (TEX_CACHE.has(key)) return TEX_CACHE.get(key);
  const t = new THREE.TextureLoader().load(
    `assets/tex/${name}.jpg`, undefined, undefined,
    () => { t.image = null; }          /* няма файл — просто няма шарка */
  );
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeatY == null ? repeat : repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  TEX_CACHE.set(key, t);
  return t;
}

/* проверка дали браузърът изобщо може WebGL */
export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

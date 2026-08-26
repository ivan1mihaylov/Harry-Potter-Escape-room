/* ============================================================
   three-sky.js — интерактивно 3D небе за Астрономическата кула.
   Ако three.js липсва, връща 2D резервен вариант със същите звезди.
   ============================================================ */

export async function createSky(container, stars, lines, onPick) {
  let THREE;
  try { THREE = await import('three'); }
  catch (e) { return createFlatSky(container, stars, lines, onPick); }

  const w = () => container.clientWidth;
  const h = () => container.clientHeight || 420;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w(), h());
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;cursor:grab;touch-action:none';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(76, w() / h(), 0.1, 400);
  camera.position.set(0, 0, 0);
  const sky = new THREE.Group();
  scene.add(sky);

  const R = 60;
  const toVec = (t, p) => new THREE.Vector3(
    R * Math.cos(p) * Math.sin(t), R * Math.sin(p), R * Math.cos(p) * Math.cos(t));

  /* фонови звезди */
  const bgN = 1400, bgPos = new Float32Array(bgN * 3);
  for (let i = 0; i < bgN; i++) {
    const t = Math.random() * Math.PI * 2, p = Math.asin(Math.random() * 2 - 1);
    const v = toVec(t, p).multiplyScalar(1.12);
    bgPos.set([v.x, v.y, v.z], i * 3);
  }
  const bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  sky.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
    size: 0.42, color: 0xcdd8f5, transparent: true, opacity: .75, sizeAttenuation: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  /* линии на съзвездията */
  const lineVerts = [];
  lines.forEach(seg => {
    const a = stars.find(s => s.id === seg[0]), b = stars.find(s => s.id === seg[1]);
    if (!a || !b) return;
    const va = toVec(a.t, a.p), vb = toVec(b.t, b.p);
    lineVerts.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts), 3));
  sky.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
    color: 0x6a7fb8, transparent: true, opacity: .3,
  })));

  /* именуваните звезди */
  const meshes = {};
  const sphere = new THREE.SphereGeometry(1, 12, 12);
  stars.forEach(s => {
    const m = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xfff3d0 }));
    const v = toVec(s.t, s.p);
    m.position.copy(v);
    m.scale.setScalar(0.55 + (s.m || 1) * 0.4);
    m.userData.star = s;
    sky.add(m);
    // ореол
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTexture(THREE), color: 0xffe9b0, transparent: true,
      opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.position.copy(v);
    halo.scale.setScalar(6 + (s.m || 1) * 2);
    sky.add(halo);
    meshes[s.id] = { mesh: m, halo, v };
  });

  /* връзки, начертани от играча */
  const drawnGeo = new THREE.BufferGeometry();
  drawnGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 2 * 12), 3));
  const drawn = new THREE.LineSegments(drawnGeo, new THREE.LineBasicMaterial({
    color: 0xffd98a, transparent: true, opacity: .95, linewidth: 2,
  }));
  drawn.frustumCulled = false;
  sky.add(drawn);
  let drawnCount = 0;

  /* HTML етикети */
  const overlay = document.createElement('div');
  overlay.className = 'sky-overlay';
  container.appendChild(overlay);
  const labels = {};
  stars.forEach(s => {
    const d = document.createElement('button');
    d.className = 'sky-label';
    d.innerHTML = `<i></i><span>${s.name}</span>`;
    d.addEventListener('click', ev => { ev.stopPropagation(); onPick(s.id, d); });
    overlay.appendChild(d);
    labels[s.id] = d;
  });

  /* въртене с влачене */
  let rx = 0, ry = 0, trx = 0, try_ = 0, dragging = false, px = 0, py = 0, moved = 0;
  const dom = renderer.domElement;
  dom.addEventListener('pointerdown', e => { dragging = true; moved = 0; px = e.clientX; py = e.clientY; dom.setPointerCapture(e.pointerId); dom.style.cursor = 'grabbing'; });
  dom.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - px, dy = e.clientY - py;
    px = e.clientX; py = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    try_ += dx * 0.005; trx += dy * 0.005;
    trx = Math.max(-1.1, Math.min(1.1, trx));
  });
  const stop = () => { dragging = false; dom.style.cursor = 'grab'; };
  dom.addEventListener('pointerup', stop);
  dom.addEventListener('pointercancel', stop);
  dom.addEventListener('wheel', e => {
    e.preventDefault();
    camera.fov = Math.max(28, Math.min(84, camera.fov + Math.sign(e.deltaY) * 3));
    camera.updateProjectionMatrix();
  }, { passive: false });

  const ro = new ResizeObserver(() => {
    renderer.setSize(w(), h());
    camera.aspect = w() / h(); camera.updateProjectionMatrix();
  });
  ro.observe(container);

  let alive = true, t0 = performance.now();
  const proj = new THREE.Vector3();
  function loop() {
    if (!alive) return;
    requestAnimationFrame(loop);
    const t = (performance.now() - t0) / 1000;
    rx += (trx - rx) * 0.08; ry += (try_ - ry) * 0.08;
    sky.rotation.x = rx; sky.rotation.y = ry + t * 0.012;

    // трептене
    stars.forEach((s, i) => {
      const o = meshes[s.id];
      o.halo.material.opacity = 0.45 + Math.sin(t * (1.6 + i * .4)) * 0.16 + (o.picked ? 0.5 : 0);
    });

    // позициониране на етикетите; звездите извън кадър стават стрелки по ръба
    const rect = container.getBoundingClientRect();
    stars.forEach(s => {
      const o = meshes[s.id];
      proj.copy(o.v).applyMatrix4(sky.matrixWorld).project(camera);
      const lab = labels[s.id];
      let x = proj.x, y = proj.y;
      const behind = proj.z > 1;
      if (behind) { x = -x; y = -y; }
      const off = behind || Math.abs(x) > 1 || Math.abs(y) > 1;
      lab.style.display = 'flex';
      lab.classList.toggle('edge', off);
      if (off) {
        const m = Math.max(Math.abs(x), Math.abs(y)) || 1;
        x = (x / m) * 0.94; y = (y / m) * 0.94;
      }
      lab.style.left = ((x * .5 + .5) * rect.width) + 'px';
      lab.style.top = ((-y * .5 + .5) * rect.height) + 'px';
    });

    renderer.render(scene, camera);
  }
  loop();

  return {
    mark(id, order) {
      const o = meshes[id]; if (!o) return;
      o.picked = true;
      o.mesh.material.color.set(0xffd070);
      o.mesh.scale.multiplyScalar(1.9);
      labels[id].classList.add('picked');
      labels[id].dataset.order = order;
    },
    connect(idA, idB) {
      const a = meshes[idA], b = meshes[idB];
      if (!a || !b || drawnCount >= 12) return;
      const arr = drawnGeo.attributes.position.array;
      const i = drawnCount * 6;
      arr[i] = a.v.x; arr[i + 1] = a.v.y; arr[i + 2] = a.v.z;
      arr[i + 3] = b.v.x; arr[i + 4] = b.v.y; arr[i + 5] = b.v.z;
      drawnCount++;
      drawnGeo.setDrawRange(0, drawnCount * 2);
      drawnGeo.attributes.position.needsUpdate = true;
    },
    reset() {
      drawnCount = 0; drawnGeo.setDrawRange(0, 0);
      stars.forEach(s => {
        const o = meshes[s.id];
        o.picked = false;
        o.mesh.material.color.set(0xfff3d0);
        o.mesh.scale.setScalar(0.55 + (s.m || 1) * 0.4);
        labels[s.id].classList.remove('picked');
        delete labels[s.id].dataset.order;
      });
    },
    dispose() { alive = false; ro.disconnect(); try { renderer.dispose(); } catch (e) {} container.innerHTML = ''; },
    is3D: true,
  };
}

function haloTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,.95)');
  grd.addColorStop(.3, 'rgba(255,225,160,.5)');
  grd.addColorStop(1, 'rgba(255,190,90,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* ---------- 2D резервен вариант ---------- */
function createFlatSky(container, stars, lines, onPick) {
  container.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'flat-sky';
  container.appendChild(box);
  const pos = {};
  stars.forEach(s => {
    const x = ((s.t / (Math.PI * 2)) % 1 + 1) % 1 * 88 + 6;
    const y = (0.5 - s.p / Math.PI) * 80 + 10;
    pos[s.id] = { x, y };
    const b = document.createElement('button');
    b.className = 'sky-label flat';
    b.style.left = x + '%'; b.style.top = y + '%';
    b.innerHTML = `<i></i><span>${s.name}</span>`;
    b.addEventListener('click', () => onPick(s.id, b));
    box.appendChild(b);
    box._labels = box._labels || {}; box._labels[s.id] = b;
  });
  for (let i = 0; i < 90; i++) {
    const d = document.createElement('span');
    d.className = 'flat-star';
    d.style.left = Math.random() * 100 + '%'; d.style.top = Math.random() * 100 + '%';
    d.style.animationDelay = (-Math.random() * 4) + 's';
    box.appendChild(d);
  }
  return {
    mark(id, order) { const l = box._labels[id]; if (l) { l.classList.add('picked'); l.dataset.order = order; } },
    connect() {},
    reset() { Object.values(box._labels).forEach(l => { l.classList.remove('picked'); delete l.dataset.order; }); },
    dispose() { container.innerHTML = ''; },
    is3D: false,
  };
}

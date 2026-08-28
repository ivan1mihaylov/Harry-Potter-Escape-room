/* ============================================================
   common3.js — общата гора: дървета, мъгла, светулки.
   Всяка зала от Трета част стъпва върху нея.
   ============================================================ */
import { tex } from '../three-stage.js';

/* детерминиран шум, за да е гората еднаква при всяко зареждане */
export function rnd(i) {
  const x = Math.sin(i * 78.233 + 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function plantForest(stage, {
  count = 46, inner = 11, outer = 26, tint = 0x1d2a20, canopy = true,
} = {}) {
  const T = stage.THREE;
  const bark = tex(T, 'wood-dark', 1, 3);
  /* стволовете са няколко на брой и се преизползват — иначе всяко дърво
     си прави свой материал и сцената почва да куца                     */
  const trunkMats = [0x2c2118, 0x362a1e, 0x241c14].map(c =>
    new T.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0.02, map: bark }));
  const leafMats = [0, 1, 2].map(k => new T.MeshStandardMaterial({
    color: shade(tint, [0, 0.12, -0.1][k]), roughness: 1, metalness: 0,
    emissive: 0x081209, emissiveIntensity: 0.32, flatShading: true,
  }));

  const group = new T.Group();
  const trees = [];
  for (let i = 0; i < count; i++) {
    const tree = new T.Group();
    const a = rnd(i) * Math.PI * 2;
    const r = inner + rnd(i * 3 + 1) * (outer - inner);
    const h = 7 + rnd(i * 5 + 2) * 11;
    const w = 0.24 + rnd(i * 7 + 3) * 0.4;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    const tm = trunkMats[i % trunkMats.length];
    const lm = leafMats[(i * 3 + 1) % leafMats.length];

    /* стволът: закръглен, стеснен нагоре и леко наклонен */
    const trunk = new T.Mesh(new T.CylinderGeometry(w * 0.45, w * 1.35, h, 10), tm);
    trunk.position.set(x, h / 2, z);
    trunk.rotation.z = (rnd(i * 11) - 0.5) * 0.14;
    trunk.rotation.x = (rnd(i * 12) - 0.5) * 0.1;
    trunk.castShadow = true;
    tree.add(trunk);

    /* коренова плоча — дървото стъпва на земята, не стърчи от нея */
    const root = new T.Mesh(new T.ConeGeometry(w * 2.3, w * 2.6, 8), tm);
    root.position.set(x, w * 1.1, z);
    tree.add(root);

    /* клони: те правят силуета, не конусът */
    if (canopy) {
      const nb = 1 + Math.floor(rnd(i * 23) * 3);
      for (let k = 0; k < nb; k++) {
        const ba = rnd(i * 29 + k) * Math.PI * 2;
        const bh = h * (0.45 + rnd(i * 31 + k) * 0.4);
        const bl = 1.4 + rnd(i * 37 + k) * 2.4;
        const br = new T.Mesh(new T.CylinderGeometry(w * 0.16, w * 0.42, bl, 6), tm);
        br.position.set(x + Math.sin(ba) * bl * 0.34, bh + bl * 0.22, z + Math.cos(ba) * bl * 0.34);
        br.rotation.set(Math.cos(ba) * 0.9, 0, -Math.sin(ba) * 0.9);
        tree.add(br);
        /* шума на върха на клона */
        const bc = new T.Mesh(new T.IcosahedronGeometry(0.6 + rnd(i * 41 + k) * 0.5, 0), lm);
        bc.position.set(x + Math.sin(ba) * bl * 0.72, bh + bl * 0.46, z + Math.cos(ba) * bl * 0.72);
        bc.scale.set(1, 0.72, 1);
        tree.add(bc);
      }

      /* короната: гроздове от неправилни топки вместо остър конус */
      const blobs = 4 + Math.floor(rnd(i * 13) * 3);
      for (let k = 0; k < blobs; k++) {
        const cr = (1.0 + rnd(i * 17 + k) * 1.15);
        const ca = rnd(i * 43 + k) * Math.PI * 2;
        const cd = rnd(i * 47 + k) * 1.25;
        const blob = new T.Mesh(new T.IcosahedronGeometry(cr, 0), lm);
        blob.position.set(x + Math.sin(ca) * cd,
                          h * (0.82 + rnd(i * 53 + k) * 0.26),
                          z + Math.cos(ca) * cd);
        blob.scale.set(1, 0.66 + rnd(i * 59 + k) * 0.3, 1);
        blob.rotation.set(rnd(i * 61 + k) * 3, rnd(i * 67 + k) * 3, 0);
        blob.castShadow = true;
        tree.add(blob);
      }
    }
    group.add(tree);
    trees.push({ g: tree, x, z });
  }
  stage.add(group);

  /* Камерата обикаля вътре в гората и от време на време опира нос в ствол,
     който запушва целия изглед. Затова най-близките дървета се скриват.  */
  stage.onFrame(() => {
    const c = stage.camera.position;
    for (const t of trees) {
      const d = Math.hypot(t.x - c.x, t.z - c.z);
      t.g.visible = d > 6.5;
    }
  });
  return group;
}

/* по-светъл/по-тъмен нюанс на един и същи цвят */
function shade(hex, k) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return (f(r) << 16) | (f(g) << 8) | f(b);
}

/* светулки — бавни точки светлина, които се носят из сцената */
export function addFireflies(stage, { count = 90, radius = 16, height = 7, color = 0x9ff0b0 } = {}) {
  const T = stage.THREE;
  const pos = new Float32Array(count * 3);
  const seed = [];
  for (let i = 0; i < count; i++) {
    const a = rnd(i * 31) * Math.PI * 2;
    const r = 2 + rnd(i * 37) * radius;
    pos[i * 3] = Math.sin(a) * r;
    pos[i * 3 + 1] = 0.6 + rnd(i * 41) * height;
    pos[i * 3 + 2] = Math.cos(a) * r;
    seed.push({ ph: rnd(i * 43) * 6.28, sp: 0.2 + rnd(i * 47) * 0.5 });
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const mat = new T.PointsMaterial({
    color, size: 0.22, transparent: true, opacity: 0.85,
    blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const pts = new T.Points(geo, mat);
  stage.add(pts);
  const base = Float32Array.from(pos);
  stage.onFrame((t) => {
    const arr = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] = base[i * 3] + Math.sin(t * seed[i].sp + seed[i].ph) * 0.9;
      arr[i * 3 + 1] = base[i * 3 + 1] + Math.cos(t * seed[i].sp * 0.7 + seed[i].ph) * 0.6;
      arr[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * seed[i].sp + seed[i].ph) * 0.9;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = 0.6 + Math.sin(t * 1.7) * 0.25;
  });
  return pts;
}

/* лунен стълб светлина отгоре */
export function addMoonshaft(stage, { x = 0, z = 0, r = 4.5, h = 22, color = 0xbfd8ff } = {}) {
  const T = stage.THREE;
  const shaft = new T.Mesh(
    new T.CylinderGeometry(r * 0.35, r, h, 26, 1, true),
    new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.055, side: T.DoubleSide, depthWrite: false })
  );
  shaft.position.set(x, h / 2, z);
  stage.add(shaft);
  const pool = new T.Mesh(
    new T.CircleGeometry(r, 40),
    new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.12 })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x, 0.03, z);
  stage.add(pool);
  stage.onFrame((t) => {
    shaft.material.opacity = 0.04 + Math.sin(t * 0.8) * 0.02;
    pool.material.opacity = 0.09 + Math.sin(t * 0.8) * 0.04;
  });
  return { shaft, pool };
}

/* стелеща се мъгла ниско над земята */
export function addMist(stage, { count = 26, radius = 15, color = 0x8fb8a0 } = {}) {
  const T = stage.THREE;
  /* Мъглата беше плоски квадрати 14×14 — отблизо закриваха половината
     изглед като стена. Сега са дребни меки валма с размита текстура.  */
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g2 = c.getContext('2d');
  const grd = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,.9)');
  grd.addColorStop(0.45, 'rgba(255,255,255,.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g2.fillStyle = grd; g2.fillRect(0, 0, 128, 128);
  const puff = new T.CanvasTexture(c);

  const geo = new T.PlaneGeometry(5.5, 5.5);
  const list = [];
  for (let i = 0; i < count; i++) {
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({
      color, map: puff, transparent: true, opacity: 0.06,
      depthWrite: false, side: T.DoubleSide,
    }));
    const a = rnd(i * 53) * Math.PI * 2;
    const r = 4 + rnd(i * 59) * radius;
    m.position.set(Math.sin(a) * r, 0.3 + rnd(i * 61) * 1.1, Math.cos(a) * r);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = rnd(i * 67) * 6;
    m.scale.setScalar(0.7 + rnd(i * 79) * 0.8);
    stage.add(m);
    list.push({ m, sp: 0.04 + rnd(i * 71) * 0.06, ph: rnd(i * 73) * 6.28 });
  }
  stage.onFrame((t) => {
    list.forEach(o => {
      o.m.rotation.z += o.sp * 0.01;
      o.m.material.opacity = 0.05 + Math.sin(t * o.sp * 6 + o.ph) * 0.03;
    });
  });
}

/* стандартните настройки на сцената за гората */
export const FOREST_STAGE = {
  bg: 0x050a07, fogNear: 16, fogFar: 54,
  groundColor: 0x101a12, ground: true, groundTex: 'cobble-floor', groundRepeat: 18,
};

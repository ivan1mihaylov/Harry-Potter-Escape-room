/* ============================================================
   common3.js — общата гора: дървета, мъгла, светулки.
   Всяка зала от Трета част стъпва върху нея.
   ============================================================ */

/* детерминиран шум, за да е гората еднаква при всяко зареждане */
export function rnd(i) {
  const x = Math.sin(i * 78.233 + 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function plantForest(stage, {
  count = 46, inner = 11, outer = 26, tint = 0x1d2a20, canopy = true,
} = {}) {
  const T = stage.THREE;
  const trunkMat = new T.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.95, metalness: 0.02 });
  const leafMat = new T.MeshStandardMaterial({ color: tint, roughness: 1, metalness: 0,
    emissive: 0x081209, emissiveIntensity: 0.35 });

  const group = new T.Group();
  for (let i = 0; i < count; i++) {
    const a = rnd(i) * Math.PI * 2;
    const r = inner + rnd(i * 3 + 1) * (outer - inner);
    const h = 7 + rnd(i * 5 + 2) * 11;
    const w = 0.24 + rnd(i * 7 + 3) * 0.4;

    const trunk = new T.Mesh(new T.CylinderGeometry(w * 0.6, w * 1.5, h, 6), trunkMat);
    trunk.position.set(Math.sin(a) * r, h / 2, Math.cos(a) * r);
    trunk.rotation.z = (rnd(i * 11) - 0.5) * 0.12;
    trunk.castShadow = true;
    group.add(trunk);

    if (canopy) {
      const layers = 2 + Math.floor(rnd(i * 13) * 2);
      for (let k = 0; k < layers; k++) {
        const cr = (2.2 + rnd(i * 17 + k) * 1.8) * (1 - k * 0.18);
        const cone = new T.Mesh(new T.ConeGeometry(cr, cr * 2.1, 7), leafMat);
        cone.position.set(trunk.position.x, h * (0.62 + k * 0.16), trunk.position.z);
        cone.rotation.y = rnd(i * 19 + k) * 6;
        cone.castShadow = true;
        group.add(cone);
      }
    }
  }
  stage.add(group);
  return group;
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
export function addMist(stage, { count = 14, radius = 15, color = 0x8fb8a0 } = {}) {
  const T = stage.THREE;
  const geo = new T.PlaneGeometry(14, 14);
  const mat = new T.MeshBasicMaterial({
    color, transparent: true, opacity: 0.035, depthWrite: false, side: T.DoubleSide,
  });
  const list = [];
  for (let i = 0; i < count; i++) {
    const m = new T.Mesh(geo, mat.clone());
    const a = rnd(i * 53) * Math.PI * 2;
    const r = rnd(i * 59) * radius;
    m.position.set(Math.sin(a) * r, 0.4 + rnd(i * 61) * 1.4, Math.cos(a) * r);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = rnd(i * 67) * 6;
    stage.add(m);
    list.push({ m, sp: 0.04 + rnd(i * 71) * 0.06, ph: rnd(i * 73) * 6.28 });
  }
  stage.onFrame((t) => {
    list.forEach(o => {
      o.m.rotation.z += o.sp * 0.01;
      o.m.material.opacity = 0.025 + Math.sin(t * o.sp * 6 + o.ph) * 0.018;
    });
  });
}

/* стандартните настройки на сцената за гората */
export const FOREST_STAGE = {
  bg: 0x050a07, fogNear: 16, fogFar: 54,
  groundColor: 0x101a12, ground: true,
};

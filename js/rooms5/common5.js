/* ============================================================
   common5.js — Отделът на мистериите: черен камък, синьо
   пламъче, безброй свещи. Всяка камера стъпва върху това.
   ============================================================ */

/* детерминиран шум — отделът изглежда еднакво при всяко зареждане */
export function rnd(i) {
  const x = Math.sin(i * 53.117 + 7.391) * 31517.7913;
  return x - Math.floor(x);
}

/* стандартните настройки на сцената за Отдела */
export const MYSTERY_STAGE = {
  bg: 0x0a0818, fogNear: 22, fogFar: 78,
  groundColor: 0x171230, ground: true,
};

/* Отделът е тъмен по замисъл, но не и нечетлив: студен ключ отгоре,
   топъл контражур и малко общо осветление, за да се различават формите. */
export function addMysteryLight(stage, { key = 1.5, warm = 0.9, amb = 0.55 } = {}) {
  const T = stage.THREE;
  stage.scene.add(new T.AmbientLight(0x8f7fd0, amb));
  const k = new T.DirectionalLight(0xc9d8ff, key);
  k.position.set(6, 14, 8);
  stage.scene.add(k);
  const back = new T.DirectionalLight(0x7a5fd0, key * 0.5);
  back.position.set(-8, 5, -7);
  stage.scene.add(back);
  const w = new T.PointLight(0xffc98a, warm, 34);
  w.position.set(0, 5, 4);
  stage.scene.add(w);
  return { key: k, warm: w };
}

/* кръгла зала от черен полиран камък. Стените се крият,
   когато застанат между камерата и стаята.                */
export function addChamber(stage, { r = 12, h = 8, tint = 0x2b2350, seg = 24 } = {}) {
  const T = stage.THREE;
  const mat = new T.MeshStandardMaterial({
    color: tint, roughness: 0.5, metalness: 0.2, side: T.DoubleSide,
    emissive: 0x120e26, emissiveIntensity: 0.45,
  });
  const root = new T.Group();
  const panels = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const w = (2 * Math.PI * r) / seg * 1.02;
    const p = new T.Mesh(new T.PlaneGeometry(w, h), mat);
    p.position.set(Math.sin(a0) * r, h / 2, Math.cos(a0) * r);
    p.lookAt(0, h / 2, 0);
    root.add(p);
    panels.push({ m: p, n: new T.Vector3(-Math.sin(a0), 0, -Math.cos(a0)),
                  p: new T.Vector3(Math.sin(a0) * r, h / 2, Math.cos(a0) * r) });
  }
  const floor = new T.Mesh(new T.CircleGeometry(r, seg * 2),
    new T.MeshStandardMaterial({ color: 0x1b1638, roughness: 0.35, metalness: 0.45 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);
  stage.add(root);

  const cam = new T.Vector3(), rel = new T.Vector3();
  stage.onFrame(() => {
    stage.camera.getWorldPosition(cam);
    panels.forEach(o => { rel.subVectors(cam, o.p); o.m.visible = o.n.dot(rel) > 0; });
  });
  return root;
}

/* сините пламъчета, които не топлят — знакът на Отдела */
export function addBlueFlames(stage, { count = 18, r = 10, h = 5.5 } = {}) {
  const T = stage.THREE;
  const flames = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const g = new T.Group();
    const core = new T.Mesh(new T.SphereGeometry(0.11, 10, 8),
      new T.MeshBasicMaterial({ color: 0xbfe2ff }));
    const halo = new T.Mesh(new T.SphereGeometry(0.42, 12, 10),
      new T.MeshBasicMaterial({ color: 0x5aa0ff, transparent: true, opacity: 0.16,
        blending: T.AdditiveBlending, depthWrite: false }));
    g.add(core, halo);
    g.position.set(Math.sin(a) * r, h + rnd(i) * 1.4, Math.cos(a) * r);
    stage.add(g);
    flames.push({ g, ph: rnd(i * 3) * 6.28, base: g.position.y });
  }
  stage.onFrame(t => flames.forEach(o => {
    o.g.position.y = o.base + Math.sin(t * 1.1 + o.ph) * 0.22;
    o.g.children[1].material.opacity = 0.11 + Math.sin(t * 2.3 + o.ph) * 0.06;
  }));
  return flames;
}

/* прашинки, увиснали в неподвижния въздух */
export function addDust(stage, { count = 120, radius = 12, height = 8 } = {}) {
  const T = stage.THREE;
  const pos = new Float32Array(count * 3);
  const seed = [];
  for (let i = 0; i < count; i++) {
    const a = rnd(i * 17) * Math.PI * 2;
    const d = rnd(i * 23) * radius;
    pos[i * 3] = Math.sin(a) * d;
    pos[i * 3 + 1] = rnd(i * 29) * height;
    pos[i * 3 + 2] = Math.cos(a) * d;
    seed.push({ ph: rnd(i * 31) * 6.28, sp: 0.08 + rnd(i * 37) * 0.18 });
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const mat = new T.PointsMaterial({ color: 0x9fc4ff, size: 0.06, transparent: true,
    opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false });
  const pts = new T.Points(geo, mat);
  stage.add(pts);
  const base = Float32Array.from(pos);
  stage.onFrame(t => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * seed[i].sp + seed[i].ph) * 0.5;
    }
    geo.attributes.position.needsUpdate = true;
  });
  return pts;
}

/* една от дванадесетте безлики врати */
export function buildDoor(T, { w = 1.5, h = 3.2, tint = 0x3a3160 } = {}) {
  const g = new T.Group();
  const leaf = new T.Mesh(new T.BoxGeometry(w, h, 0.18),
    new T.MeshStandardMaterial({ color: tint, roughness: 0.4, metalness: 0.3,
      emissive: 0x1a1440, emissiveIntensity: 0.5 }));
  leaf.position.y = h / 2;
  const frame = new T.Mesh(new T.BoxGeometry(w + 0.22, h + 0.22, 0.1),
    new T.MeshStandardMaterial({ color: 0x6a5ca0, roughness: 0.45, metalness: 0.6,
      emissive: 0x2a2158, emissiveIntensity: 0.6 }));
  frame.position.set(0, h / 2, -0.06);
  const knob = new T.Mesh(new T.SphereGeometry(0.075, 10, 8),
    new T.MeshStandardMaterial({ color: 0x8a7fc0, roughness: 0.25, metalness: 0.8 }));
  knob.position.set(w * 0.32, h * 0.48, 0.12);
  g.add(frame, leaf, knob);
  g.userData.leaf = leaf;
  return g;
}

/* стъклена сфера с пророчество */
export function buildOrb(T, { r = 0.3, color = 0xc8b4ff } = {}) {
  const g = new T.Group();
  const glass = new T.Mesh(new T.SphereGeometry(r, 16, 14),
    new T.MeshStandardMaterial({ color, roughness: 0.08, metalness: 0.05,
      transparent: true, opacity: 0.42, emissive: color, emissiveIntensity: 0.55 }));
  const core = new T.Mesh(new T.SphereGeometry(r * 0.42, 12, 10),
    new T.MeshBasicMaterial({ color: 0xf0e8ff, transparent: true, opacity: 0.8 }));
  g.add(glass, core);
  g.userData.glass = glass;
  return g;
}

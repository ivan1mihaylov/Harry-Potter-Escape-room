/* ============================================================
   common4.js — общата Азкабан: студен камък, море, дименторски
   сенки. Всяка зала от Четвърта част стъпва върху нея.
   ============================================================ */

/* детерминиран шум — крепостта изглежда еднакво при всяко зареждане */
export function rnd(i) {
  const x = Math.sin(i * 91.7 + 4.113) * 21374.1953;
  return x - Math.floor(x);
}

/* стандартните настройки на сцената за Азкабан */
export const AZK_STAGE = {
  bg: 0x05070c, fogNear: 14, fogFar: 52,
  groundColor: 0x0d1017, ground: true,
};

/* студено море около крепостта — тъмна равнина с бавни вълни */
export function addSea(stage, { radius = 34, y = -0.35, color = 0x0a1420 } = {}) {
  const T = stage.THREE;
  const geo = new T.PlaneGeometry(radius * 2, radius * 2, 40, 40);
  const mat = new T.MeshStandardMaterial({
    color, roughness: 0.42, metalness: 0.35,
    emissive: color, emissiveIntensity: 0.35,
    transparent: true, opacity: 0.95,
  });
  const sea = new T.Mesh(geo, mat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = y;
  stage.add(sea);
  const pos = geo.attributes.position;
  const base = Float32Array.from(pos.array);
  stage.onFrame((t) => {
    const a = pos.array;
    for (let i = 0; i < a.length; i += 3) {
      const x = base[i], z = base[i + 1];
      a[i + 2] = Math.sin(x * 0.22 + t * 0.9) * 0.16 + Math.cos(z * 0.19 - t * 0.7) * 0.12;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return sea;
}

/* мокър гранит — материал, ползван из цялата част */
export function stoneMat(T, tint = 0x2a2f38) {
  return new T.MeshStandardMaterial({ color: tint, roughness: 0.92, metalness: 0.08 });
}

/* стена от каменни блокове. Четирите стени са отделни групи и всяка
   се скрива, когато се окаже между камерата и стаята — така сцената
   се гледа отвън, без да я закрива предната стена. */
export function addWalls(stage, { w = 22, h = 9, d = 22, tint = 0x22262e, floor = false } = {}) {
  const T = stage.THREE;
  const mat = stoneMat(T, tint);
  const root = new T.Group();

  if (floor) {
    const f = new T.Mesh(new T.PlaneGeometry(w, d), stoneMat(T, tint - 0x060606));
    f.rotation.x = -Math.PI / 2;
    f.position.y = -0.04;
    f.receiveShadow = true;
    root.add(f);
  }

  const sides = [
    { n: new T.Vector3(0, 0, 1),  pos: [0, h / 2, -d / 2], rot: 0,             len: w },
    { n: new T.Vector3(0, 0, -1), pos: [0, h / 2, d / 2],  rot: Math.PI,       len: w },
    { n: new T.Vector3(1, 0, 0),  pos: [-w / 2, h / 2, 0], rot: Math.PI / 2,   len: d },
    { n: new T.Vector3(-1, 0, 0), pos: [w / 2, h / 2, 0],  rot: -Math.PI / 2,  len: d },
  ];

  const groups = [];
  sides.forEach((side, si) => {
    const g = new T.Group();
    g.position.set(side.pos[0], side.pos[1], side.pos[2]);
    g.rotation.y = side.rot;

    const slab = new T.Mesh(new T.PlaneGeometry(side.len, h), mat);
    slab.receiveShadow = true;
    g.add(slab);

    for (let i = 0; i < 16; i++) {
      const u = (rnd(si * 31 + i * 5) - 0.5) * side.len * 0.9;
      const y = (rnd(si * 37 + i * 7) - 0.5) * (h - 1.4);
      const b = new T.Mesh(new T.BoxGeometry(1.4 + rnd(si * 41 + i) * 0.8, 0.6, 0.28), mat);
      b.position.set(u, y, 0.16);
      b.castShadow = true;
      g.add(b);
    }
    root.add(g);
    groups.push({ g, n: side.n, p: new T.Vector3(side.pos[0], side.pos[1], side.pos[2]) });
  });

  stage.add(root);
  const tmp = new T.Vector3(), rel = new T.Vector3();
  stage.onFrame(() => {
    stage.camera.getWorldPosition(tmp);
    groups.forEach(o => { rel.subVectors(tmp, o.p); o.g.visible = o.n.dot(rel) > 0; });
  });
  return root;
}

/* дименторска сянка — качулка от плаващи парцали */
export function buildDementor(T, { scale = 1, color = 0x11131b } = {}) {
  const g = new T.Group();
  const cloth = new T.MeshStandardMaterial({
    color, roughness: 1, metalness: 0,
    transparent: true, opacity: 0.88, side: T.DoubleSide,
  });
  const body = new T.Mesh(new T.ConeGeometry(0.85, 2.6, 12, 3, true), cloth);
  body.position.y = 1.3;
  g.add(body);
  const hood = new T.Mesh(new T.SphereGeometry(0.56, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), cloth);
  hood.position.y = 2.45;
  g.add(hood);
  const face = new T.Mesh(new T.SphereGeometry(0.4, 12, 10),
    new T.MeshBasicMaterial({ color: 0x000000 }));
  face.position.set(0, 2.32, 0.16);
  g.add(face);
  // парцали
  const rags = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = new T.Mesh(new T.PlaneGeometry(0.34, 1.5 + rnd(i * 13) * 1.1), cloth);
    r.position.set(Math.sin(a) * 0.7, 0.85, Math.cos(a) * 0.7);
    r.rotation.y = -a;
    g.add(r);
    rags.push({ m: r, ph: rnd(i * 17) * 6.28 });
  }
  g.scale.setScalar(scale);
  g.userData.animate = (t) => {
    body.rotation.y = Math.sin(t * 0.4) * 0.12;
    rags.forEach((o, i) => { o.m.rotation.x = Math.sin(t * 1.3 + o.ph) * 0.28; });
    g.position.y = Math.sin(t * 0.8 + scale) * 0.16;
  };
  return g;
}

/* мразовит дъх — бавни бели точки, които падат */
export function addFrost(stage, { count = 110, radius = 18, height = 12 } = {}) {
  const T = stage.THREE;
  const pos = new Float32Array(count * 3);
  const seed = [];
  for (let i = 0; i < count; i++) {
    const a = rnd(i * 23) * Math.PI * 2;
    const r = rnd(i * 29) * radius;
    pos[i * 3] = Math.sin(a) * r;
    pos[i * 3 + 1] = rnd(i * 31) * height;
    pos[i * 3 + 2] = Math.cos(a) * r;
    seed.push(0.25 + rnd(i * 37) * 0.6);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const mat = new T.PointsMaterial({
    color: 0xcfe4ff, size: 0.11, transparent: true, opacity: 0.55,
    blending: T.AdditiveBlending, depthWrite: false,
  });
  const pts = new T.Points(geo, mat);
  stage.add(pts);
  stage.onFrame((t, dt) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] -= seed[i] * dt;
      a[i * 3] += Math.sin(t * 0.5 + i) * dt * 0.12;
      if (a[i * 3 + 1] < 0) a[i * 3 + 1] = height;
    }
    geo.attributes.position.needsUpdate = true;
  });
  return pts;
}

/* сноп студена светлина от процеп в тавана */
export function addSlit(stage, { x = 0, z = -6, w = 0.7, h = 14, color = 0x9fc0ff } = {}) {
  const T = stage.THREE;
  const m = new T.Mesh(
    new T.BoxGeometry(w, h, 3.4),
    new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.05, depthWrite: false })
  );
  m.position.set(x, h / 2, z);
  m.rotation.x = 0.22;
  stage.add(m);
  stage.onFrame((t) => { m.material.opacity = 0.035 + Math.sin(t * 0.7) * 0.018; });
  return m;
}

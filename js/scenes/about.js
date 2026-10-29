/* about.js — fly a paper plane through the clouds past the chapters of the
   story: intro, skills (balloons), journey (floating islands), awards. */
SCENES.about = class extends CORE.BaseScene {
  constructor(opts) {
    super(opts);
    const { plane } = SK, T = ART, D = this.app.D, A = D.about;
    this.scene.background = SK.gradientTex(SK.PAL.skyDeep, "#f1f3f2", SK.PAL.sky);
    this.scene.fog = new THREE.Fog(0xdfeaf2, 8, 30);
    this.camera.fov = 55; this.camera.position.set(0, 0, 4);
    this.scene.add(this.camera);
    this.zStart = 4; this.zEnd = -92; this.scrollMax = 9000;
    this.bobbers = [];

    // the plane we ride
    const N = [0, 0, -1.5], Tl = [0, 0, 0.8], Lt = [-1.35, 0.22, 0.9], Rt = [1.35, 0.22, 0.9], K = [0, -0.5, 0.7];
    const body = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([...N, ...Tl, ...Lt, ...N, ...Rt, ...Tl], 3));
    const keel = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([...N, ...K, ...Tl], 3));
    const pl = new THREE.Group();
    pl.add(new THREE.Mesh(body, new THREE.MeshBasicMaterial({ color: 0xfbfaf6, side: THREE.DoubleSide })));
    pl.add(new THREE.Mesh(keel, new THREE.MeshBasicMaterial({ color: 0xd6e8f4, side: THREE.DoubleSide })));
    [body, keel].forEach((g) => pl.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x333333 }))));
    pl.position.set(0, -1.25, -3.6); pl.scale.setScalar(0.5); this.camera.add(pl); this.plane = pl;

    const bob = (m, amp = 0.08, sp = 1) => { m.userData.b = [m.position.x, m.position.y, m.position.z, amp, sp, Math.random() * 6]; this.bobbers.push(m); return m; };
    const put = (k, w, x, y, z, h) => { const m = plane(k, w, h); m.position.set(x, y, z); this.add(m); return m; };

    // chapter 1 — intro
    put(T.cloudBig(), 7.5, 0, -0.9, -9);
    this.avatar = T.avatarRig(1.25); this.avatar.position.set(0.2, 0.95, -8.8); this.add(this.avatar); bob(this.avatar, 0.04);
    put(T.title(A.intro.name, A.intro.sub), 6.5, 0, 2.7, -9.4);
    A.intro.quote.forEach((q, i) => bob(put(T.tag(q, i + 1), 3.6, (i ? 1 : -1) * 1.6, -2.3 - i * 0.6, -8.4 + i * 0.3), 0.04));

    // chapter 2 — skills as balloons
    put(T.sectionTitle(A.skills.title, A.skills.sub), 7, 0, 3.3, -28);
    A.skills.items.forEach((s, i) => {
      let x = -5.5 + (i % 7) * 1.85 + Math.random() * 0.6; if (Math.abs(x) < 1.2) x += x < 0 ? -1.2 : 1.2;
      const y = -2.6 + Math.floor(i / 7) * 3.0 + Math.random() * 1.2, z = -25 - Math.random() * 6;
      bob(put(T.balloon(s, i), 1.05, x, y, z), 0.12, 0.8 + Math.random() * 0.6);
    });

    // chapter 3 — journey as floating islands
    put(T.sectionTitle(A.journey.title, A.journey.sub), 7, 0, 3.5, -52);
    A.journey.islands.forEach((is, i) => {
      const n = A.journey.islands.length, x = (i - (n - 1) / 2) * 3.8, y = (i % 2 ? -1.1 : -2.3), z = -50 - (i % 3) * 1.6;
      bob(put(T.island(is.label, is.sub), 3.4, x, y, z), 0.06, 0.5 + Math.random() * 0.4);
    });

    // chapter 4 — awards as medals
    put(T.sectionTitle(A.awards.title, A.awards.sub), 7, 0, 3.4, -74);
    A.awards.items.forEach((a, i) => {
      const x = -4.2 + (i % 3) * 4.2 + Math.random() * 0.5, y = 0.9 - Math.floor(i / 3) * 2.6, z = -72 - Math.random() * 3;
      bob(put(T.medal(a), 1.2, x, y, z), 0.07, 0.9);
    });
    [...A.languages, ...A.interests].forEach((s, i) => bob(put(T.tag(s, i), 2.4, -5 + Math.random() * 10, -3 + Math.random() * 6, -82 - Math.random() * 5), 0.05));
    put(T.sectionTitle("THE END", "find the map ☰ to keep exploring"), 7, 0, 0.6, -96);

    // clouds everywhere (kept out of the flight lane)
    this.clouds = [];
    const ck = [T.cloud(), T.cloud(), T.cloud(), T.cloud()];
    for (let i = 0; i < 80; i++) {
      const c = plane(ck[i % 4], 1.4 + Math.random() * 4);
      let x = (Math.random() - 0.5) * 34, y = -9 + Math.random() * 18; if (Math.abs(x) < 6 && Math.abs(y) < 4.5) x += x < 0 ? -7 : 7;
      c.position.set(x, y, 8 - Math.random() * 110); c.userData.sp = (Math.random() - 0.5) * 0.3; c.material.opacity = 0.75 + Math.random() * 0.25;
      this.add(c); this.clouds.push(c);
    }
  }
  onEnter() { CORE.hint("SKY WALKER", this.app.D.about.hint); }
  update(dt) {
    const { lerp } = SK, t = this.time, p = this.app.scroll.v / this.scrollMax;
    this.camera.position.z = lerp(this.zStart, this.zEnd, p);
    this.camera.position.x = lerp(this.camera.position.x, this.app.pointer.x * 0.6, 1 - Math.pow(0.01, dt));
    this.camera.position.y = lerp(this.camera.position.y, this.app.pointer.y * 0.4, 1 - Math.pow(0.01, dt));
    this.parallax(dt, 0.05);
    this.plane.rotation.z = lerp(this.plane.rotation.z, -this.app.pointer.x * 0.5, 1 - Math.pow(0.01, dt));
    this.plane.rotation.x = Math.sin(t * 1.6) * 0.05 + this.app.pointer.y * 0.15;
    this.plane.position.y = -1.05 + Math.sin(t * 1.2) * 0.05;
    if (p > 0.08) CORE.unlock("sky_walker");
    this.avatar.userData.tick(t);
    this.bobbers.forEach((m) => { const b = m.userData.b; m.position.y = b[1] + Math.sin(t * b[4] + b[5]) * b[3]; m.rotation.z = Math.sin(t * b[4] * 0.7 + b[5]) * 0.02; });
    this.clouds.forEach((c) => { c.position.x += c.userData.sp * dt; });
  }
};

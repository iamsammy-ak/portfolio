/* home.js — the building entrance and the walkable corridor behind it. */
SCENES.home = class extends CORE.BaseScene {
  constructor(opts) {
    super(opts);
    const { D } = this.app; const { plane, tex, smooth, lerp } = SK;
    this.D = D;
    // sky outside; the corridor is fully enclosed so the gradient only shows at the entrance
    this.scene.background = SK.gradientTex(SK.PAL.skyDeep, "#f3ede2", SK.PAL.sky);
    this.scene.fog = new THREE.Fog(0xf3ede2, 16, 52);
    this.zStart = 9.5; this.zEnd = -56; this.scrollLen = 7000;
    this.entered = !!opts.inside;
    this.scrollMax = this.entered ? this.scrollLen : 0;
    this.camera.fov = 55; this.camera.position.set(0, 1.6, this.zStart);
    this.fade = []; this.floaters = []; this.arrows = []; this.lamps = []; this.turn = { y: 0 };
    this.yaw = { v: 0, t: 0 }; this.lastScroll = 0; this.skyBits = [];
    this.camX = { v: 0 };
    this.buildOutside();
    this.buildCorridor();
    if (this.entered) {
      // come back to where you were: the doorway of the room you left, or your last spot
      const from = opts.from && this.doors[opts.from], last = this.app.corridorState;
      let v = this.posFor(-1.5);
      if (from) { v = this.posFor(from.r.z); this.camX.v = from.side * (this.W / 2 + 1.3); this.yaw.v = this.yaw.t = from.side * Math.PI / 2; }
      else if (last) { v = last.v; this.yaw.v = this.yaw.t = last.yaw; }
      this.app.scroll.v = this.app.scroll.target = v;
    }
  }

  /* ---------- outside: a modern house in a garden, Turin on the hills behind ---------- */
  buildOutside() {
    const { plane, tex } = SK, T = ART, D = this.D;
    const N = (this.nightKit = { shade: [], fadeIn: [], fadeOut: [], swap: [] });
    const basic = (o) => { const m = new THREE.MeshBasicMaterial(o); N.shade.push(m); return m; };
    const box = (w, h, d, mats, pos) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.length === 1 ? mats[0] : mats); m.position.set(...pos); this.add(m); return m; };
    const flat = (k, w, h, pos, rot = [0, 0, 0], o = {}) => { const m = plane(k, w, h, o); m.position.set(...pos); m.rotation.set(...rot); this.add(m); N.shade.push(m.material); return m; };

    // sky dome: day and night versions cross-fade
    const dome = (top, mid, bottom) => new THREE.Mesh(new THREE.SphereGeometry(95, 32, 16), new THREE.MeshBasicMaterial({ map: SK.gradientTex(top, bottom, mid), side: THREE.BackSide, fog: false, depthWrite: false, transparent: true }));
    this.skyDay = dome("#7fb3df", "#bcd8ee", "#eef2f0"); this.skyDay.position.y = 2; this.add(this.skyDay);
    this.skyNight = dome("#0b1430", "#1f2d58", "#3a3f6a"); this.skyNight.position.y = 2; this.skyNight.scale.setScalar(0.99); this.skyNight.material.opacity = 0; this.add(this.skyNight);
    this.scene.background = new THREE.Color("#bcd8ee");
    const st = plane(T.stars(), 220, 90, { fog: false }); st.position.set(0, 40, -88); st.material.opacity = 0; this.add(st); N.fadeIn.push(st);

    // Turin on the hills, far behind the house
    const city = flat(T.turinSkyline(), 230, 50, [0, 12, -78], [0, 0, 0], { fog: false });

    // ground: lawn, a paver path, gravel strip along the house
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(140, 80), basic({ map: tex(T.lawn(512), { repeat: [40, 22] }) }));
    lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, -0.01, -10); this.add(lawn);
    flat(T.pavers(), 2.6, 9.4, [0, 0.01, 4.7], [-Math.PI / 2, 0, 0]);

    // the house: charcoal ground floor, cedar first floor cantilevered over it, flat roof
    const HW = 17, cladK = T.cladding(), cl = (w, h, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic({ map: tex(cladK, { repeat: [w / 4, h / 3.7] }) })); m.position.set(x, y, z); m.rotation.y = ry; this.add(m); return m; };
    cl(HW / 2 - 1.25, 3.7, -(HW / 2 + 1.25) / 2, 1.85, 0); cl(HW / 2 - 1.25, 3.7, (HW / 2 + 1.25) / 2, 1.85, 0);
    cl(14, 3.7, -HW / 2, 1.85, -7, -Math.PI / 2); cl(14, 3.7, HW / 2, 1.85, -7, Math.PI / 2);
    // left: a mural sprayed on the cladding; right: the studio behind a glass wall
    flat(T.graffiti("HELLO", { w: 1400, h: 560, colors: ["#ffd166", "#ef476f", "#7b2232"], tag: "AK '26", arrow: false }), 5.4, 2.4, [-4.75, 1.9, 0.02]);
    this.addGlass("studio", 5.2, 2.85, [4.6, 1.8, 0.02]);
    // side walls get graffiti too
    flat(T.graffiti("TORINO", { w: 1600, h: 520, colors: ["#bfe3d6", "#3e7c82", "#2f5f8a"], tag: "AK" }), 9, 2.9, [-HW / 2 - 0.02, 1.9, -6], [0, -Math.PI / 2, 0]);
    const wood = tex(T.woodSlats(), { repeat: [HW / 3.5, 1] });
    const woodSide = tex(T.woodSlats(), { repeat: [0.6, 1] });
    const upper = box(HW, 3.0, 1.4, [basic({ map: woodSide }), basic({ map: woodSide }), basic({ color: "#d9dcdf" }), basic({ color: "#e2c79b" }), basic({ map: wood }), basic({ color: "#3d434a" })], [0, 5.2, 0.45]);
    this.addRibbon(12, 1.15, [0, 5.45, 1.16]);
    box(HW + 0.4, 0.28, 1.9, [basic({ color: "#e6e8ea" })], [0, 6.84, 0.4]);
    // solar panels tilted on the roof
    const solar = T.solarPanel();
    for (let i = 0; i < 6; i++) flat(solar, 2.2, 1.35, [-6.2 + i * 2.48, 7.35, -0.2], [-0.95, 0, 0]);
    // recessed lights in the soffit of the overhang
    const glowK = T.glow();
    for (let x = -7; x <= 7; x += 2) { const g = plane(glowK, 0.9, 0.9, { fog: false }); g.position.set(x, 3.68, 0.9); g.rotation.x = Math.PI / 2; g.material.blending = THREE.AdditiveBlending; g.material.opacity = 0.25; g.material.depthWrite = false; this.add(g); N.fadeIn.push(g); g.userData.dayOpacity = 0.25; }
    // entrance: dark frame, canopy, neon sign, video doorbell
    box(2.9, 0.12, 0.25, [basic({ color: "#24282d" })], [0, 3.76, 0.1]);
    [-1.38, 1.38].forEach((x) => box(0.14, 3.7, 0.25, [basic({ color: "#24282d" })], [x, 1.85, 0.1]));
    box(3.8, 0.14, 1.7, [basic({ color: "#2b2f33" })], [0, 3.86, 0.85]);
    const sign = plane(T.neonSign(D.entrance.sign, D.meta.name), 3.6, 0.77, { fog: false }); sign.position.set(0, 4.25, 1.17); this.add(sign);
    flat(T.evCharger(), 0.5, 0.9, [7.6, 1.15, 0.03]);
    // wall lights either side of the door
    [-2.1, 2.1].forEach((x) => {
      box(0.18, 0.45, 0.18, [basic({ color: "#24282d" })], [x, 2.6, 0.12]);
      const g = plane(glowK, 1.4, 2.2, { fog: false }); g.position.set(x, 2.6, 0.23); g.material.blending = THREE.AdditiveBlending; g.material.depthWrite = false; g.material.opacity = 0.15; g.userData.dayOpacity = 0.15; this.add(g); N.fadeIn.push(g);
    });
    // jambs so the doorway has depth
    const jamb = new THREE.MeshBasicMaterial({ color: "#2b2f33" });
    [[-1.25, Math.PI / 2], [1.25, -Math.PI / 2]].forEach(([x, ry]) => { const j = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3.7), jamb); j.position.set(x, 1.85, -0.2); j.rotation.y = ry; this.add(j); });

    // garden: planters, shrubs, grasses, lavender, two trees, path lights
    const planterMat = basic({ color: "#c9c6bf" });
    [[-4.7, 3.6], [4.6, 3.6]].forEach(([x, w]) => {
      box(w, 0.5, 0.7, [planterMat], [x, 0.25, 0.75]);
      for (let i = 0; i < 4; i++) flat(i % 2 ? T.lavender() : T.grasses(), 1.1, i % 2 ? 0.8 : 1.1, [x - w / 2 + 0.5 + i * (w - 1) / 3, 0.5 + (i % 2 ? 0.38 : 0.52), 0.8]);
    });
    const tree = T.treeNatural();
    [[-11, 4, 9.5], [11.5, 1.5, 8]].forEach(([x, z, h]) => {
      [0, Math.PI / 2].forEach((ry) => flat(tree, h * 0.8, h, [x, h / 2, z], [0, ry, 0]));
      const sh = plane(T.glow("30,50,20", 128), h * 0.7, h * 0.35); sh.rotation.x = -Math.PI / 2; sh.position.set(x + 0.4, 0.02, z + 0.3); sh.material.opacity = 0.35; this.add(sh);
    });
    [[-7.5, 2.4, "#5f8f45"], [-2.4, 2.2, "#6c9c4c"], [7.6, 2.6, "#5f8f45"], [-13.5, 6, "#4e7e3c"], [14, 5, "#5f8f45"], [9.6, 4.6, "#6c9c4c"]].forEach(([x, z, c], i) => {
      const s = flat(T.shrub(c), 1.2 + (i % 3) * 0.3, 0.9 + (i % 3) * 0.2, [x, 0.45 + (i % 3) * 0.1, z]); s.userData.billboard = true; (this.billboards = this.billboards || []).push(s);
    });
    [2, 4.5, 7].forEach((z) => [-1.6, 1.6].forEach((x) => {
      const mat = basic({ color: "#2b2f33" });
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.5, 12), mat); post.position.set(x, 0.25, z); this.add(post);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), new THREE.MeshBasicMaterial({ color: "#fff1c9" })); cap.position.set(x, 0.47, z); this.add(cap);
      const g = plane(glowK, 0.9, 0.9, { fog: false }); g.position.set(x, 0.45, z + 0.01); g.material.blending = THREE.AdditiveBlending; g.material.depthWrite = false; g.material.opacity = 0; g.userData.dayOpacity = 0; this.add(g); N.fadeIn.push(g);
    }));

    // the cat, a flapping flock, drifting clouds, sun and moon
    const deco = (k, w, x, y, h, z = 0.06) => { const m = plane(k, w, h); m.position.set(x, y, z); this.add(m); N.shade.push(m.material); return m; };
    this.cat = deco(T.cat(), 0.8, -2.0, 0.42, undefined, 1.3);
    const sunM = plane(T.sun(), 2.2, undefined, { fog: false }); sunM.position.set(4.5, 14.5, -6); sunM.userData.spin = 0.05; this.add(sunM); this.skyBits.push(sunM); N.fadeOut.push(sunM);
    const moonM = plane(T.moon(), 3, undefined, { fog: false }); moonM.position.set(-4.5, 14.8, -6); moonM.material.opacity = 0; this.add(moonM); N.fadeIn.push(moonM);
    const ck = [T.cloud(), T.cloud(), T.cloud()];
    for (let i = 0; i < 9; i++) { const c = plane(ck[i % 3], 3 + Math.random() * 3, undefined, { fog: false }); c.position.set(-26 + i * 6.5 + Math.random() * 3, 11 + Math.random() * 6, -8 - (i % 3) * 3); c.userData.sp = 0.12 + Math.random() * 0.15; this.add(c); this.skyBits.push(c); N.fadeOut.push(c); }
    this.flock = [];
    const up = tex(T.birdPose(true)), down = tex(T.birdPose(false));
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: up, transparent: true, fog: false, depthWrite: false }));
      const row = Math.ceil(i / 2), sideOff = i % 2 ? 1 : -1;
      b.userData = { off: [i ? sideOff * row * 0.8 : 0, -row * 0.35], ph: Math.random() * 6, up, down };
      this.add(b); this.flock.push(b); N.fadeOut.push(b);
    }
    this.flockPos = { x: -30, y: 12.5, z: -7 };

    // the street lamp is a light switch for the sky; the mailbox goes to Contact
    this.buildLamp([5.6, 0, 3.4]);
    this.buildMailbox([-2.9, 0, 2.1]);

    // double glass doors on pivots
    const stk = D.entrance.stickers, half = Math.ceil(stk.length / 2);
    this.leaves = [];
    [[-1.25, 0.625, stk.slice(0, half), true, -1], [1.25, -0.625, stk.slice(half), false, 1]].forEach(([px, off, stick, hingeLeft, dir]) => {
      const pivot = new THREE.Group(); pivot.position.set(px, 0, 0.06);
      const leaf = plane(T.entranceLeaf(stick, hingeLeft), 1.25, 3.7, { side: THREE.FrontSide }); leaf.position.set(off, 1.85, 0);
      const back = plane(T.entranceLeaf([], !hingeLeft, true), 1.25, 3.7, { side: THREE.FrontSide }); back.position.set(off, 1.85, -0.01); back.rotation.y = Math.PI; pivot.add(back);
      leaf.userData.onClick = () => this.enter();
      leaf.userData.onHover = (on) => { if (this.entered) return; this.leaves.forEach(({ pivot: pv, dir: d, leaf: lf }) => { gsap.to(pv.rotation, { y: on ? d * 0.08 : 0, duration: 0.5, ease: "power2.out" }); gsap.to(lf.material.color, { ...new THREE.Color(on ? "#f3dcb6" : "#ffffff"), duration: 0.4 }); }); };
      pivot.add(leaf); this.add(pivot, true); this.interactives.push(leaf);
      this.leaves.push({ pivot, dir, leaf });
    });

    this.night = 0;
    let saved = false; try { saved = localStorage.getItem("ak_night") === "1"; } catch (_) {}
    if (saved) this.setNight(true, true);
  }

  /* a glass wall whose interior lights up at night */
  addGlass(kind, w, h, pos) {
    const { plane } = SK, T = ART;
    const day = plane(T.glassWall(kind, false), w, h); day.position.set(...pos); this.add(day); this.nightKit.shade.push(day.material);
    const night = plane(T.glassWall(kind, true), w, h, { fog: false }); night.position.set(pos[0], pos[1], pos[2] + 0.005); night.material.opacity = 0; this.add(night); this.nightKit.fadeIn.push(night);
  }
  addRibbon(w, h, pos) {
    const { plane } = SK, T = ART;
    const day = plane(T.ribbonWindow(false), w, h); day.position.set(...pos); this.add(day); this.nightKit.shade.push(day.material);
    const night = plane(T.ribbonWindow(true), w, h, { fog: false }); night.position.set(pos[0], pos[1], pos[2] + 0.005); night.material.opacity = 0; this.add(night); this.nightKit.fadeIn.push(night);
  }

  /* a real 3D street lamp: pole, arm, lantern, glow. Click it to switch day and night. */
  buildLamp([x, y, z]) {
    const T = ART, grp = new THREE.Group(); grp.position.set(x, y, z);
    const dark = new THREE.MeshBasicMaterial({ color: "#23272b" });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 16), dark); pole.position.y = 1.8; grp.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.25, 16), dark); base.position.y = 0.12; grp.add(base);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 8), dark); arm.rotation.z = Math.PI / 2; arm.position.set(-0.32, 3.55, 0); grp.add(arm);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 0.22, 20), dark); head.position.set(-0.65, 3.45, 0); grp.add(head);
    this.lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshBasicMaterial({ color: "#f3efe2" })); this.lampBulb.position.set(-0.65, 3.32, 0); grp.add(this.lampBulb);
    this.lampGlow = SK.plane(T.glow(), 3.2, 3.2, { fog: false }); this.lampGlow.position.set(-0.65, 3.2, 0.05); this.lampGlow.material.blending = THREE.AdditiveBlending; this.lampGlow.material.depthWrite = false; this.lampGlow.material.opacity = 0; grp.add(this.lampGlow);
    this.lampPool = SK.plane(T.glow("255,214,140", 128), 4, 4); this.lampPool.rotation.x = -Math.PI / 2; this.lampPool.position.set(-0.65, 0.03, 0); this.lampPool.material.blending = THREE.AdditiveBlending; this.lampPool.material.depthWrite = false; this.lampPool.material.opacity = 0; grp.add(this.lampPool);
    grp.userData.onClick = () => { CORE.sound("click"); this.setNight(this.night < 0.5); };
    grp.userData.onHover = (on) => { gsap.to(this.lampBulb.scale, { x: on ? 1.3 : 1, y: on ? 1.3 : 1, z: on ? 1.3 : 1, duration: 0.3 }); if (on && !this.lampHinted) { this.lampHinted = true; CORE.hint("THE STREET LAMP", "Click the lamp to switch between day and night"); } };
    this.add(grp); this.interactives.push(grp);
  }

  buildMailbox([x, y, z]) {
    const T = ART, grp = new THREE.Group(); grp.position.set(x, y, z);
    const dark = new THREE.MeshBasicMaterial({ color: "#2f3439" });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), dark); post.position.y = 0.5; grp.add(post);
    const front = new THREE.MeshBasicMaterial({ map: SK.tex(T.mailboxFront()) });
    const boxM = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.36), [dark, dark, new THREE.MeshBasicMaterial({ color: "#3d434a" }), dark, front, dark]); boxM.position.y = 1.25; grp.add(boxM);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.06), new THREE.MeshBasicMaterial({ color: SK.PAL.burnt })); flag.position.set(0.25, 1.38, 0.05); grp.add(flag);
    grp.userData.onClick = () => { CORE.sound("open"); gsap.to(flag.rotation, { z: -1.4, duration: 0.4 }); setTimeout(() => CORE.go("contact"), 350); };
    grp.userData.onHover = (on) => { gsap.to(grp.scale, { x: on ? 1.08 : 1, y: on ? 1.08 : 1, z: on ? 1.08 : 1, duration: 0.3 }); gsap.to(flag.rotation, { z: on ? -0.6 : 0, duration: 0.3 }); if (on) CORE.hint("THE MAILBOX", "Click the mailbox to get in touch"); };
    this.add(grp); this.interactives.push(grp);
  }

  /* cross-fade the whole outside between day and night */
  setNight(on, instant) {
    const N = this.nightKit, d = instant ? 0 : 1.6, k = { v: this.night };
    try { localStorage.setItem("ak_night", on ? "1" : "0"); } catch (_) {}
    const dayTint = new THREE.Color("#ffffff"), nightTint = new THREE.Color("#6a76a6"), fogDay = new THREE.Color("#e4edf2"), fogNight = new THREE.Color("#1c2547");
    gsap.to(k, {
      v: on ? 1 : 0, duration: d, ease: "power2.inOut",
      onUpdate: () => {
        this.night = k.v;
        N.shade.forEach((m) => m.color.copy(dayTint).lerp(nightTint, k.v));
        N.fadeIn.forEach((m) => (m.material.opacity = (m.userData.dayOpacity || 0) + (1 - (m.userData.dayOpacity || 0)) * k.v));
        N.fadeOut.forEach((m) => (m.material.opacity = 1 - k.v));
        this.skyNight.material.opacity = k.v;
        this.lampGlow.material.opacity = k.v; this.lampPool.material.opacity = k.v * 0.8;
        this.lampBulb.material.color.set(k.v > 0.5 ? "#fff3c4" : "#f3efe2");
        if (!this.entered) this.scene.fog.color.copy(fogDay).lerp(fogNight, k.v);
        this.scene.background.copy(new THREE.Color("#bcd8ee")).lerp(new THREE.Color("#0b1430"), k.v);
      },
    });
  }

  /* ---------- inside: walls with real doorways, a room behind every door ---------- */
  buildCorridor() {
    const { plane, tex } = SK, T = ART, D = this.D, P = SK.PAL;
    const W = 5, H = 3.7, L = 60, TILE = 7.5;
    const DW = 1.1, DH = 2.3; // doorway
    this.W = W;
    const mesh = (geoW, geoH, map, pos, rot, o = {}) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(geoW, geoH), new THREE.MeshBasicMaterial({ map, color: o.color, side: o.side || THREE.FrontSide }));
      m.position.set(...pos); m.rotation.set(...rot); this.add(m); return m;
    };
    mesh(W, L, tex(T.planks(), { repeat: [1, 6] }), [0, 0, -L / 2], [-Math.PI / 2, 0, 0]);
    mesh(W, L, tex(T.ceiling(), { repeat: [1, 12] }), [0, H, -L / 2], [Math.PI / 2, 0, 0]);
    const wallK = T.wall();
    mesh(W, H, tex(wallK, { repeat: [W / TILE, 1] }), [0, H / 2, -L], [0, 0, 0]);
    [[-W / 2, -1.25], [1.25, W / 2]].forEach(([a, b]) => mesh(b - a, H, tex(wallK, { repeat: [(b - a) / TILE, 1] }), [(a + b) / 2, H / 2, -0.01], [0, Math.PI, 0]));

    // side walls, cut around each doorway so you can see into the rooms
    const rooms = D.corridor.rooms;
    [-1, 1].forEach((side) => {
      const x = side * W / 2, ry = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      const holes = rooms.filter((r) => (r.side === "left" ? -1 : 1) === side).map((r) => [r.z + DW / 2, r.z - DW / 2]).sort((a, b) => b[0] - a[0]);
      // u along the wall: left walls run towards -z, right walls towards +z
      const u = (z) => (side < 0 ? -z : z) / TILE;
      const seg = (zA, zB, y0, y1) => {
        const len = zA - zB; if (len <= 0.001) return;
        const t = tex(wallK, { repeat: [len / TILE, (y1 - y0) / H], offset: [side < 0 ? u(zA) : u(zB), y0 / H] });
        mesh(len, y1 - y0, t, [x, (y0 + y1) / 2, (zA + zB) / 2], [0, ry, 0]);
      };
      let z = 0;
      holes.forEach(([a, b]) => { seg(z, a, 0, H); seg(a, b, DH, H); z = b; });
      seg(z, -L, 0, H);
    });

    // name, avatar and floating doodles near the entrance
    const flo = (k, w, x, y, z, o = {}) => {
      const m = plane(k, w); m.position.set(x, y, z); m.rotation.z = o.rz || 0;
      m.userData.base = [x, y, z]; m.userData.ph = Math.random() * 6; m.userData.amp = o.amp ?? 0.08; m.userData.spin = o.spin || 0;
      this.add(m); this.fade.push(m); this.floaters.push(m); return m;
    };
    const titleM = plane(T.title(D.meta.short, D.meta.title), 4.6); titleM.position.set(-0.55, 2.55, -7.6); this.add(titleM); this.fade.push(titleM);
    this.avatar = T.avatarRig(1.05); this.avatar.position.set(1.55, 1.05, -6.6); this.add(this.avatar);
    this.avatar.userData.parts.forEach((m) => { m.userData.fz = -6.6; this.fade.push(m); });
    flo(T.planeSketch(), 0.95, -2.0, 3.0, -5.6, { rz: 0.3, amp: 0.1 });
    flo(T.paperBall(), 0.45, -1.9, 0.25, -5, { amp: 0.0 });
    flo(T.pencil(), 0.9, 1.6, 0.14, -5.2, { rz: 0.5, amp: 0.0 });
    flo(T.mug(), 0.42, -1.6, 2.2, -6.1, { amp: 0.06 });
    flo(T.doodle("✱", 128, P.granata), 0.4, -2.1, 1.6, -6.2, { spin: 0.4 });
    flo(T.doodle("◌", 128, P.ochre), 0.3, -2.0, 3.3, -8.5, { spin: 0.3 });

    for (let z = -2.5; z > -L; z -= 11) this.pendant(0, H, z, 0.8);

    // doors: painted in the room's colour, hinged so they swing INTO the room
    const casingK = T.doorCasing(), arrowL = T.arrow(1), arrowR = T.arrow(-1);
    this.doors = {};
    rooms.forEach((r) => {
      const left = r.side === "left", side = left ? -1 : 1, x = side * W / 2, ry = left ? Math.PI / 2 : -Math.PI / 2;
      const color = P[r.color] || r.color || P.po;
      this.buildRoom(r, side, color);
      const casing = plane(casingK, 1.5, 2.5); casing.position.set(x - side * 0.012, 1.25, r.z); casing.rotation.y = ry; this.add(casing);
      // jambs give the doorway some depth
      [r.z + DW / 2, r.z - DW / 2].forEach((jz) => mesh(0.16, DH, null, [x + side * 0.08, DH / 2, jz], [0, 0, 0], { color: new THREE.Color("#efe5d2"), side: THREE.DoubleSide }));
      const pivot = new THREE.Group(); pivot.position.set(x + side * 0.03, 0, r.z + (left ? DW / 2 : -DW / 2)); pivot.rotation.y = ry;
      const doorK = T.corridorDoor(r.icon, color);
      const door = plane(doorK, DW, DH, { side: THREE.FrontSide }); door.position.set(DW / 2, DH / 2, 0);
      const back = plane(doorK, DW, DH, { side: THREE.FrontSide }); back.position.set(DW / 2, DH / 2, -0.01); back.rotation.y = Math.PI;
      pivot.add(door); pivot.add(back); this.add(pivot);
      const hit = new THREE.Mesh(new THREE.PlaneGeometry(DW + 0.3, DH + 0.2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
      hit.position.set(x - side * 0.05, DH / 2, r.z); hit.rotation.y = ry; this.add(hit); this.interactives.push(hit);
      this.doors[r.id] = { pivot, ry, r, side };
      let opening = false;
      hit.userData.onClick = () => {
        if (opening || this.app.busy || this.walking) return; opening = true;
        arrows.forEach((a) => (a.visible = false));
        this.walkInto(r);
      };
      hit.userData.onHover = (on) => {
        if (opening || this.walking) return;
        arrows.forEach((a) => (a.visible = on));
        // left ajar so you can see the lit room behind it
        gsap.to(pivot.rotation, { y: ry + (on ? 0.42 : 0), duration: 0.55, ease: "power2.out", overwrite: true });
        if (on && (this.speed || 0) < 200) CORE.sound("creak");
      };
      const sign = plane(T.signBoard(r.label, r.sub), 1.35); sign.position.set(x - side * 0.02, 3.05, r.z); sign.rotation.y = ry; this.add(sign);
      const arrows = [[arrowL, r.z - 1.05, left ? 1 : -1], [arrowR, r.z + 1.05, left ? -1 : 1]].map(([k, z, flip]) => {
        const a = plane(k, 0.5); a.position.set(x - side * 0.03, 1.3, z); a.rotation.y = ry; a.scale.x = flip; a.visible = false; a.userData.base = [x, 1.3, z]; this.add(a); this.arrows.push(a); return a;
      });
    });

    D.corridor.frames.forEach((f) => {
      const left = f.side === "left", x = left ? -W / 2 + 0.02 : W / 2 - 0.02;
      const m = plane(T.frameArt(f.lines), 1.6); m.position.set(x, f.y, f.z); m.rotation.y = left ? Math.PI / 2 : -Math.PI / 2; this.add(m);
    });
    this.hangMuseum();
    const vent = plane(T.vent(), 0.6); vent.position.set(W / 2 - 0.02, 3.05, -18); vent.rotation.y = -Math.PI / 2; this.add(vent);
    const table = plane(T.sideTable(), 1.2); table.position.set(-1.85, 0.6, -27); this.add(table);
    const pl = plane(T.plant(), 0.75); pl.position.set(1.95, 0.6, -52); this.add(pl);

    // the end of the corridor: a filing cabinet with one drawer per CV
    const es = plane(T.signBoard(D.corridor.endDoor.label, D.corridor.endDoor.sub), 1.5); es.position.set(0, 3.22, -L + 0.03); this.add(es);
    this.cabinetZ = -L + 0.05;
    CV.list().then((files) => { if (!this.disposed) this.buildCabinet(files); });
  }

  /* paintings (loaded as images), museum labels, quote prints and the graffiti stretch */
  hangMuseum() {
    const { plane, tex } = SK, T = ART, C = this.D.corridor, W = this.W;
    const onWall = (k, w, side, z, y, h, depth = 0.025) => {
      const m = plane(k, w, h); m.position.set(side * (W / 2 - depth), y, z); m.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; this.add(m); return m;
    };
    (C.paintings || []).forEach((pt) => {
      const side = pt.side === "left" ? -1 : 1;
      // reserve the frame straight away, swap in the picture once it has loaded
      const ratio0 = pt.ratio || 0.8;
      const m = onWall(T.framedPainting(null, ratio0), pt.w, side, pt.z, 2.3);
      HANG.image(pt.src).then((img) => {
        if (this.disposed) return;
        const k = T.framedPainting(img, img.height / img.width);
        m.material.map.dispose(); m.material.map = tex(k); m.material.needsUpdate = true;
        const h = pt.w * k.h / k.w; m.geometry.dispose(); m.geometry = new THREE.PlaneGeometry(pt.w, h);
      }).catch(() => {});
      const right = side < 0 ? -1 : 1; // the viewer's right when facing this wall
      onWall(T.museumLabel(pt.title, pt.artist, pt.year), 0.46, side, pt.z + right * (pt.w / 2 + 0.3), 1.85);
      this.pictureLight(side, pt.z, pt.w);
    });
    // looking back towards the entrance: a hello on one side, a thank-you on the other
    const back = (k, w, x, y, h) => { const m = plane(k, w, h); m.position.set(x, y, -0.04); m.rotation.y = Math.PI; this.add(m); return m; };
    back(T.graffiti("HI", { w: 700, h: 900, colors: ["#ffd166", "#ef476f", "#7b2232"], tag: "AK", rot: -0.08 }), 1.15, -1.88, 2.2, 1.48);
    back(T.quotePrint("Thank you for walking through. The door is always open.", "Abhishek", 4), 1.15, 1.88, 2.35);
    (C.quotes || []).forEach((q, i) => onWall(T.quotePrint(q.text, q.author, i), 1.3, q.side === "left" ? -1 : 1, q.z, 2.3));
    onWall(T.graffiti("WELCOME IN", { w: 2048, h: 880, colors: ["#bfe3d6", "#3e7c82", "#2f5f8a"], tag: "AK '26" }), 4.2, 1, -3.4, 2.6, 1.8, 0.02);
    (C.graffiti || []).forEach((gf) => {
      const len = Math.abs(gf.from - gf.to), side = gf.side === "left" ? -1 : 1;
      onWall(T.graffiti(gf.text, { colors: gf.colors, w: 2048, h: Math.round(2048 * 2.1 / len), arrow: gf.text === "SHIP IT" }), len, side, (gf.from + gf.to) / 2, 2.5, 2.1, 0.02);
    });
  }

  /* a hanging lamp: cord, brass shade lit from inside, glowing bulb and a pool of light on the floor */
  pendant(x, ceil, z, drop = 0.7) {
    const T = ART, g = new THREE.Group(); g.position.set(x, ceil, z);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, drop, 6), new THREE.MeshBasicMaterial({ color: "#222" })); cord.position.y = -drop / 2; g.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.28, 32, 1, true), new THREE.MeshBasicMaterial({ map: SK.tex(T.metal()), side: THREE.FrontSide })); shade.position.y = -drop - 0.12; g.add(shade);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.29, 0.27, 32, 1, true), new THREE.MeshBasicMaterial({ color: "#fff1c8", side: THREE.BackSide })); inner.position.y = -drop - 0.12; g.add(inner);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: "#fff8e0" })); bulb.position.y = -drop - 0.25; g.add(bulb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: SK.tex(T.glow()), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 })); halo.scale.set(1.1, 1.1, 1); halo.position.y = -drop - 0.28; g.add(halo);
    this.add(g);
    const pool = SK.plane(T.glow("255,220,160", 128), 2.6, 2.6); pool.rotation.x = -Math.PI / 2; pool.position.set(x, 0.015, z); pool.material.blending = THREE.AdditiveBlending; pool.material.depthWrite = false; pool.material.opacity = 0.32; this.add(pool);
    return g;
  }

  /* a brass picture light over a painting, washing its top half */
  pictureLight(side, z, w) {
    const T = ART, x = side * (this.W / 2), brass = new THREE.MeshBasicMaterial({ map: SK.tex(T.metal()) });
    const top = 2.3 + w * 0.48;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, w * 0.55, 16), brass); bar.rotation.x = Math.PI / 2; bar.position.set(x - side * 0.24, top + 0.08, z); this.add(bar);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), brass); arm.rotation.z = Math.PI / 2; arm.position.set(x - side * 0.12, top + 0.12, z); this.add(arm);
    const wash = SK.plane(T.glow("255,226,170", 128), w * 1.1, w * 0.9); wash.position.set(x - side * 0.03, top - w * 0.22, z); wash.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; wash.material.blending = THREE.AdditiveBlending; wash.material.depthWrite = false; wash.material.opacity = 0.32; this.add(wash);
  }

  /* a small furnished room behind each doorway — lit, coloured, with a preview of what is inside */
  buildRoom(r, side, color) {
    const { plane, tex } = SK, T = ART, D = this.D;
    const x0 = side * this.W / 2, Dp = 3.4, Wz = 3.2, Hr = 3.0, cx = x0 + side * Dp / 2;
    const face = side < 0 ? Math.PI / 2 : -Math.PI / 2; // normal pointing back at the corridor
    const box = (w, h, k, pos, rot, rep) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(k, rep ? { repeat: rep } : {}) })); m.position.set(...pos); m.rotation.set(...rot); this.add(m); return m; };
    box(Dp, Wz, T.parquet(512), [cx, 0.003, r.z], [-Math.PI / 2, 0, 0], [1.5, 1.5]);
    box(Dp, Wz, T.ceiling(512), [cx, Hr, r.z], [Math.PI / 2, 0, 0]);
    const backX = x0 + side * Dp;
    box(Wz, Hr, r.id === "lab" ? T.graffiti("CODE", { bg: "brick", w: 1024, h: 960, colors: ["#f6cf5a", "#c2562f", "#7b2232"], tag: "AK" }) : T.roomWall(color), [backX, Hr / 2, r.z], [0, face, 0]);
    const sideK = T.roomWall(color, 768, 768);
    box(Dp, Hr, sideK, [cx, Hr / 2, r.z - Wz / 2], [0, 0, 0]);
    box(Dp, Hr, sideK, [cx, Hr / 2, r.z + Wz / 2], [0, Math.PI, 0]);
    this.pendant(cx, Hr, r.z, 0.55);
    // what you glimpse through the door
    const onWall = (k, w, y, dz, h) => { const m = plane(k, w, h); m.position.set(backX - side * 0.03, y, r.z + dz); m.rotation.y = face; this.add(m); return m; };
    if (r.id === "gallery") {
      [["assets/art/the-kiss.jpg", -1.05, 0.8], ["assets/art/starry-night.jpg", 0, 1.25], ["assets/art/great-wave.jpg", 1.05, 0.8]].forEach(([src, dz, w]) => {
        const m = onWall(T.framedPainting(null, 0.8), w, 1.65, dz);
        HANG.image(src).then((img) => { if (this.disposed) return; const k = T.framedPainting(img, img.height / img.width); m.material.map.dispose(); m.material.map = tex(k); m.geometry.dispose(); m.geometry = new THREE.PlaneGeometry(w, w * k.h / k.w); }).catch(() => {});
      });
    } else if (r.id === "studio") {
      onWall(T.monitor(D.studio.items[0], 0), 1.6, 1.55, 0);
      onWall(T.sideTable(), 1.3, 0.62, 0.9);
    } else if (r.id === "lab") {
      if (GH.list[0]) onWall(T.repoCard(GH.list[0], 0), 1.1, 0.95, 0.8);
    } else if (r.id === "about") {
      onWall(T.windowSketch(), 1.5, 1.65, -0.6);
      onWall(T.quotePrint("Quality is not an act, it is a habit.", "Will Durant, on Aristotle"), 1.0, 1.7, 0.85);
    } else if (r.id === "contact") {
      onWall(T.windowSketch(), 1.5, 1.7, -0.5);
      onWall(T.signpost("HELLO"), 1.1, 0.75, 0.8);
    }
  }

  /* click a door: it swings into the room, you turn, walk through, then the page tears */
  walkInto(r) {
    const d = this.doors[r.id], side = d.side;
    this.walking = true;
    this.app.corridor = { room: r.id }; // so coming back puts you in this doorway
    CORE.sound("door");
    gsap.to(d.pivot.rotation, { y: d.ry + 1.7, duration: 1.2, ease: "power2.inOut" });
    gsap.to(this.app.scroll, { target: this.posFor(r.z), v: this.posFor(r.z), duration: 0.9, ease: "power2.inOut" });
    gsap.to(this.yaw, { t: -side * Math.PI / 2, v: -side * Math.PI / 2, duration: 0.9, ease: "power2.inOut" });
    gsap.to(this.camX, { v: side * (this.W / 2 + 1.5), duration: 1.3, delay: 0.55, ease: "power2.in" });
    setTimeout(() => CORE.go(r.id), 1350);
  }

  posFor(z) { return ((this.zStart - z) / (this.zStart - this.zEnd)) * this.scrollLen; }

  /* drawers slide out on hover with the folder peeking up; click pulls one
     all the way out and opens that CV in the folder viewer */
  buildCabinet(files) {
    const { plane } = SK, T = ART, z0 = this.cabinetZ;
    const tints = ["#fbe8b5", "#d6e6f7", "#d4ecd2", "#f9d5d3"];
    const shown = files.slice(0, 4), rows = Math.max(3, shown.length);
    const W = 2.1, k = W / 768, H = 1024 * k, cy = H / 2;
    const cab = plane(T.cabinet(rows), W, H); cab.position.set(0, cy, z0); this.add(cab);
    const gap = 22, hh = (840 - gap * (rows - 1)) / rows;
    this.drawers = [];
    // empty drawers below the real ones keep the cabinet looking like a cabinet
    for (let i = shown.length; i < rows; i++) {
      const ypx = 110 + i * (hh + gap) + hh / 2;
      const d = plane(T.drawer("", "#e9e2d5", Math.min(0.6, hh / 636)), 636 * k, hh * k); d.position.set(0, cy + (512 - ypx) * k, z0 + 0.04); this.add(d);
    }
    shown.forEach((f, i) => {
      const more = i === 3 && files.length > 4;
      const label = more ? `+${files.length - 3} more` : f.role;
      const ypx = 110 + i * (hh + gap) + hh / 2;
      const y = cy + (512 - ypx) * k, dh = hh * k;
      const grp = new THREE.Group(); grp.position.set(0, y, z0 + 0.02); this.add(grp);
      const peek = plane(T.folderPeek(tints[i % 4]), 1.2); peek.position.set(0, dh / 2 - 0.32, -0.01); grp.add(peek);
      const front = plane(T.drawer(label, tints[i % 4], Math.min(0.6, hh / 636)), 636 * k, dh); front.position.z = 0.02; grp.add(front);
      let pulling = false;
      front.userData.onHover = (on) => {
        if (pulling) return;
        gsap.to(grp.position, { z: z0 + 0.02 + (on ? 0.32 : 0), duration: 0.45, ease: "power3.out" });
        gsap.to(peek.position, { y: dh / 2 - 0.32 + (on ? 0.42 : 0), duration: 0.5, ease: "back.out(1.6)" });
        gsap.to(front.material.color, { ...new THREE.Color(on ? "#fff4dc" : "#ffffff"), duration: 0.3 });
        if (on) CORE.sound("click");
      };
      front.userData.onClick = () => {
        if (pulling || this.app.busy) return; pulling = true;
        CORE.sound("door");
        gsap.to(grp.position, { z: z0 + 0.75, duration: 0.5, ease: "power2.out" });
        gsap.to(peek.position, { y: dh / 2 + 0.55, duration: 0.5, ease: "power2.out" });
        setTimeout(() => CV.open(f.id), 280);
        setTimeout(() => { pulling = false; front.userData.onHover(false); }, 1200);
      };
      this.interactives.push(front);
      this.drawers.push(grp);
    });
  }

  dispose() {
    if (this.entered) this.app.corridorState = { v: this.app.scroll.v, yaw: this.yaw.v };
    this.disposed = true; super.dispose();
  }

  enter() {
    if (this.entered) return;
    this.entered = true;
    CORE.sound("door"); CORE.unlock("explorer");
    this.leaves.forEach(({ pivot, dir, leaf }) => {
      gsap.to(pivot.rotation, { y: dir * 1.95, duration: 1.6, ease: "power3.inOut" });
      gsap.to(leaf.material.color, { ...new THREE.Color("#cf9a5e"), duration: 1.0 });
    });
    this.scrollMax = this.scrollLen;
    document.getElementById("intro").classList.remove("is-on");
    CORE.pushRoom("hall");
    // walk in by yourself once the doors are open
    gsap.to(this.app.scroll, { target: 1150, duration: 3.2, delay: 0.9, ease: "power2.inOut" });
    setTimeout(() => CORE.hint("THE CORRIDOR", this.D.corridor.hintExplore + " · <b>drag</b> or <b>A D</b> to turn all the way round"), 1800);
  }

  /* called the moment the page swaps, while the paper is still tearing open:
     you are already walking out of the room you were in, the mirror of walking in */
  onSwap() {
    const from = this.opts.from && this.doors[this.opts.from];
    if (!from) return;
    const { pivot, ry, side } = from;
    pivot.rotation.y = ry + 1.7;
    this.walking = true;
    this.camX.v = side * (this.W / 2 + 1.6); this.yaw.v = this.yaw.t = side * Math.PI / 2;
    gsap.to(this.camX, { v: 0, duration: 1.9, ease: "power2.inOut" });
    gsap.to(this.yaw, { t: -side * 0.3, v: -side * 0.3, duration: 2.1, ease: "power2.inOut", onComplete: () => { this.walking = false; } });
    gsap.to(pivot.rotation, { y: ry, duration: 1.1, delay: 1.3, ease: "power2.inOut", onStart: () => CORE.sound("close") });
  }

  onEnter() {
    if (this.entered) CORE.hint("THE CORRIDOR", this.D.corridor.hintEnter + " · <b>drag</b> or <b>A D</b> to look around");
  }

  /* free look: drag, trackpad swipe, arrow keys or A / D turn you all the way round */
  onDrag(dx) { if (this.entered && !this.walking) this.yaw.t += dx * 0.0035; }
  onPan(dx) { if (this.entered && !this.walking) this.yaw.t += dx * 0.0022; }
  onArrow(dir) { if (this.entered && !this.walking) this.yaw.t += dir * 0.5; }
  /* scrolling walks the way you are facing: turned round, it takes you back */
  scrollSign() { return Math.cos(this.yaw.v) < -0.2 ? -1 : 1; }

  update(dt) {
    const { lerp, smooth } = SK, t = this.time, cam = this.camera;
    const p = this.scrollLen ? this.app.scroll.v / this.scrollLen : 0;
    const z = lerp(this.zStart, this.zEnd, p);
    const speed = (this.speed = Math.abs(this.app.scroll.v - this.lastScroll) / Math.max(dt, 0.001));
    this.lastScroll = this.app.scroll.v;
    cam.position.z = z;
    cam.position.x = this.camX.v;
    const out = smooth(0.5, 9.5, z); // outside the building: stand taller and look up at the façade
    // a soft step bob that only shows while walking
    this.bob = lerp(this.bob || 0, Math.min(speed / 900, 1), 1 - Math.pow(0.01, dt));
    cam.position.y = 1.6 + out * 0.5 + Math.sin(z * 2.4) * 0.025 * this.bob;
    this.parallax(dt, this.entered ? 0.12 : 0.08);
    // small glances drift back to centre while you walk; a deliberate turn stays put
    if (speed > 15 && !this.app.pointer.down && !this.walking && Math.abs(this.yaw.t) < 0.7) this.yaw.t *= Math.pow(0.35, dt);
    if (!this.walking) this.yaw.v = lerp(this.yaw.v, this.yaw.t, 1 - Math.pow(0.004, dt));
    cam.rotation.x += out * 0.2; cam.rotation.y += this.turn.y + this.yaw.v;
    cam.rotation.z = Math.sin(z * 1.2) * 0.004 * this.bob;
    if (p > 0.18) CORE.unlock("wanderer");
    // footsteps
    if (this.entered && speed > 120) { this.stepAcc = (this.stepAcc || 0) + speed * dt; if (this.stepAcc > 330) { this.stepAcc = 0; CORE.sound("step"); } }
    if (p > 0.9 && !this.cvHinted) { this.cvHinted = true; CORE.hint("MY CV", "Pull a drawer to read a version of my CV · the <b>CV</b> button opens it from anywhere", 6000); }
    if (z > -3) {
      this.skyBits.forEach((b) => { if (b.userData.sp) { b.position.x += b.userData.sp * dt; if (b.position.x > 32) b.position.x = -32; } if (b.userData.spin) b.rotation.z += dt * b.userData.spin; });
      // a small flock flaps across the sky in a loose V
      const F = this.flockPos; F.x += dt * 1.6; F.y += Math.sin(t * 0.5) * 0.004; if (F.x > 34) { F.x = -34; F.y = 11.5 + Math.random() * 3; }
      this.flock.forEach((b) => { const u = b.userData; b.position.set(F.x + u.off[1] * 1.6, F.y + Math.abs(u.off[0]) * 0.25 + Math.sin(t * 2 + u.ph) * 0.06, F.z + u.off[0]); const flap = Math.sin(t * 9 + u.ph) > 0; b.material.map = flap ? u.up : u.down; b.lookAt(cam.position); });
      if (this.cat) this.cat.rotation.z = Math.sin(t * 0.8) * 0.01;
    }
    // things near the entrance fade out as you walk through them
    // …and the big name steps aside when you turn to look at the walls
    const turned = smooth(0.35, 0.9, Math.abs(Math.sin(this.yaw.v)));
    this.fade.forEach((m) => { const d = (m.userData.fz ?? m.position.z) - z; m.material.opacity = (1 - smooth(-1.0, 0.4, d)) * (1 - turned * 0.92); });
    this.avatar.userData.tick(t);
    this.floaters.forEach((m) => { const b = m.userData.base; m.position.y = b[1] + Math.sin(t * 1.4 + m.userData.ph) * m.userData.amp; if (m.userData.spin) m.rotation.z += dt * m.userData.spin; });
    this.arrows.forEach((a) => { if (a.visible) a.position.z = a.userData.base[2] + Math.sin(t * 5) * 0.05 * (a.scale.x); });
  }
};

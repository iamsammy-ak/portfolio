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
    const before = this.scene.children.length;
    this.buildOutside();
    this.outsideGroup = new THREE.Group(); this.scene.add(this.outsideGroup);
    this.scene.children.slice(before, -1).forEach((o) => this.outsideGroup.add(o));
    this.buildCorridor();
    this.place(opts);
  }

  /* put the visitor where they should be: the entrance, the doorway of the room
     they just left, or the spot in the corridor where they last were */
  place(opts) {
    this.opts = opts; this.walking = false;
    this.entered = !!opts.inside; this.scrollMax = this.entered ? this.scrollLen : 0;
    gsap.killTweensOf([this.camX, this.yaw, this.app.scroll]);
    this.camX.v = 0; this.yaw.v = this.yaw.t = 0; this.turn.y = 0;
    Object.values(this.doors || {}).forEach((d) => { gsap.killTweensOf(d.pivot.rotation); d.pivot.rotation.y = d.ry; d.reset?.(); });
    (this.leaves || []).forEach(({ pivot, dir, leaf }) => { gsap.killTweensOf(pivot.rotation); pivot.rotation.y = this.entered ? dir * 1.95 : 0; leaf.material.color.set(this.entered ? "#cf9a5e" : "#ffffff"); });
    if (this.mailFlag) this.mailFlag.rotation.x = 0;
    let v = 0;
    if (this.entered) {
      const from = opts.from && this.doors[opts.from], last = this.app.corridorState;
      v = this.posFor(-1.5);
      if (from) { v = this.posFor(from.r.z); this.camX.v = from.side * (this.W / 2 + 1.3); this.yaw.v = this.yaw.t = from.side * Math.PI / 2; }
      else if (last) { v = last.v; this.yaw.v = this.yaw.t = last.yaw; }
    }
    this.app.scroll.v = this.app.scroll.target = v; this.lastScroll = v;
  }
  resume(opts) { this.place(opts); }
  suspend() {
    if (this.entered) this.app.corridorState = { v: this.app.scroll.v, yaw: this.yaw.v };
    this.setHover(null);
  }

  /* ---------- outside: the brick house with its tree, cat, flower box and sign — built in 3D ---------- */
  buildOutside() {
    const { plane, tex } = SK, T = ART, D = this.D;
    const N = (this.nightKit = { shade: [], fadeIn: [], fadeOut: [], swap: [] });
    const basic = (o) => { const m = new THREE.MeshBasicMaterial(o); N.shade.push(m); return m; };
    const box = (w, h, d, mat, pos, rot) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(...pos); if (rot) m.rotation.set(...rot); this.add(m); return m; };
    const flat = (k, w, h, pos, rot = [0, 0, 0], o = {}) => { const m = plane(k, w, h, o); m.position.set(...pos); m.rotation.set(...rot); this.add(m); N.shade.push(m.material); return m; };
    const stoneK = T.stone(), stoneMat = basic({ map: tex(stoneK) }), white = basic({ color: "#f3efe6" }), iron = basic({ color: "#24282b" });

    // sky dome: day and night versions cross-fade
    const dome = (top, mid, bottom) => new THREE.Mesh(new THREE.SphereGeometry(95, 32, 16), new THREE.MeshBasicMaterial({ map: SK.gradientTex(top, bottom, mid), side: THREE.BackSide, fog: false, depthWrite: false, transparent: true }));
    this.skyDay = dome("#7fb3df", "#bcd8ee", "#eef2f0"); this.skyDay.position.y = 2; this.add(this.skyDay);
    this.skyNight = dome("#0b1430", "#1f2d58", "#3a3f6a"); this.skyNight.position.y = 2; this.skyNight.scale.setScalar(0.99); this.skyNight.material.opacity = 0; this.add(this.skyNight);
    this.scene.background = new THREE.Color("#bcd8ee");
    const st = plane(T.stars(), 220, 90, { fog: false }); st.position.set(0, 40, -88); st.material.opacity = 0; this.add(st); N.fadeIn.push(st);
    flat(T.turinSkyline(), 230, 50, [0, 12, -78], [0, 0, 0], { fog: false });

    // ground: lawn, a stone pavement along the house, the path to the door
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(140, 80), basic({ map: tex(T.lawn(512), { repeat: [40, 22] }) }));
    lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, -0.01, -10); this.add(lawn);
    const pave = new THREE.Mesh(new THREE.PlaneGeometry(22, 1.6), basic({ map: tex(T.ground(512), { repeat: [11, 1] }) })); pave.rotation.x = -Math.PI / 2; pave.position.set(0, 0.005, 0.8); this.add(pave);
    flat(T.stonePath(), 3.0, 8, [0, 0.012, 5.4], [-Math.PI / 2, 0, 0]);

    // the house: brick walls with real thickness, stone corners, plinth, cornice and a tiled roof
    const HW = 18, TOP = 6.7, DEPTH = 9, brick = T.bricks();
    const brickMat = (w, h, ox = 0, oy = 0) => basic({ map: tex(brick, { repeat: [w / 8, h / 4], offset: [ox / 8, oy / 4] }) });
    const wall = (x0, x1, y0, y1) => { const w = x1 - x0, h = y1 - y0; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), brickMat(w, h, x0 + 20, y0)); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); this.add(m); };
    wall(-HW / 2, -1.25, 0, TOP); wall(1.25, HW / 2, 0, TOP); wall(-1.25, 1.25, 3.7, TOP);
    [-1, 1].forEach((s) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(DEPTH, TOP), brickMat(DEPTH, TOP)); m.position.set(s * HW / 2, TOP / 2, -DEPTH / 2); m.rotation.y = s * Math.PI / 2; this.add(m); });
    // stone quoins on the corners
    [-1, 1].forEach((s) => { for (let y = 0.25, i = 0; y < TOP; y += 0.5, i++) box(i % 2 ? 0.55 : 0.85, 0.46, 0.12, stoneMat, [s * (HW / 2 - (i % 2 ? 0.27 : 0.42)), y, 0.06]); });
    box(HW + 0.2, 0.45, 0.16, stoneMat, [0, 0.22, 0.08]);           // plinth
    box(HW + 0.2, 0.18, 0.14, stoneMat, [0, 3.98, 0.07]);           // string course between the floors
    box(HW + 0.9, 0.32, 0.7, white, [0, TOP + 0.05, 0.25]);        // cornice
    box(HW + 1.1, 0.12, 0.9, white, [0, TOP + 0.26, 0.3]);
    // pitched roof: tiles on the front slope, gables at the sides, a chimney
    const rise = 2.4, run = 3.0, slope = Math.atan2(rise, run), len = Math.hypot(rise, run);
    const roofM = new THREE.Mesh(new THREE.PlaneGeometry(HW + 1.2, len), basic({ map: tex(T.roofTiles(), { repeat: [HW / 3, len / 1.6] }), side: THREE.DoubleSide }));
    roofM.position.set(0, TOP + 0.32 + rise / 2, 0.55 - run / 2); roofM.rotation.x = -(Math.PI / 2 - slope); this.add(roofM);
    [-1, 1].forEach((s) => { const tri = new THREE.Shape(); tri.moveTo(0.55, 0); tri.lineTo(0.55 - run, 0); tri.lineTo(0.55 - run, rise); tri.closePath(); const mat = brickMat(0.6, 0.4); mat.side = THREE.DoubleSide; const m = new THREE.Mesh(new THREE.ShapeGeometry(tri), mat); m.position.set(s * (HW / 2 + 0.3), TOP + 0.32, 0); m.rotation.y = -Math.PI / 2; this.add(m); });
    box(0.9, 2.2, 0.9, brickMat(1, 2), [5.2, TOP + 2.5, -1.5]); box(1.1, 0.2, 1.1, stoneMat, [5.2, TOP + 3.65, -1.5]);
    // the door: stone pilasters, lintel with keystone, a step
    [-1.42, 1.42].forEach((x) => box(0.32, 3.9, 0.18, stoneMat, [x, 1.95, 0.09]));
    box(3.2, 0.42, 0.2, stoneMat, [0, 3.95, 0.1]); box(0.42, 0.55, 0.26, stoneMat, [0, 3.98, 0.13]);
    box(3.4, 0.2, 0.9, stoneMat, [0, 0.1, 0.45]);
    const jamb = basic({ color: "#c9b79c" });
    [[-1.25, Math.PI / 2], [1.25, -Math.PI / 2]].forEach(([x, ry]) => { const j = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3.7), jamb); j.position.set(x, 1.85, -0.2); j.rotation.y = ry; this.add(j); });

    // windows: recessed glass, white frames, stone sills, green shutters; the right one keeps its flower box
    const shutK = T.shutter();
    const windowAt = (x, y, w, h) => {
      const g = flat(T.windowGlass(false), w, h, [x, y, 0.012]);
      const lit = plane(T.windowGlass(true), w, h, { fog: false }); lit.position.set(x, y, 0.016); lit.material.opacity = 0; this.add(lit); N.fadeIn.push(lit);
      const fr = 0.12;
      box(w + fr * 2, fr, 0.16, white, [x, y + h / 2 + fr / 2, 0.08]); box(w + fr * 2, fr, 0.16, white, [x, y - h / 2 - fr / 2, 0.08]);
      [-1, 1].forEach((s) => box(fr, h, 0.16, white, [x + s * (w / 2 + fr / 2), y, 0.08]));
      box(0.06, h, 0.06, white, [x, y, 0.05]); box(w, 0.06, 0.06, white, [x, y, 0.05]);
      // inner shadow so the glass reads as set back into the wall
      const sh = plane(T.glow("20,20,30", 64), w * 1.6, h * 1.6); sh.position.set(x, y, 0.02); sh.material.opacity = 0.18; this.add(sh);
      box(w + 0.6, 0.14, 0.4, stoneMat, [x, y - h / 2 - 0.19, 0.16]);
      box(w + 0.5, 0.22, 0.12, stoneMat, [x, y + h / 2 + 0.24, 0.06]);
      [-1, 1].forEach((s) => { const sm = plane(shutK, w * 0.42, h + 0.1); sm.position.set(x + s * (w / 2 + 0.12 + w * 0.21), y, 0.06); this.add(sm); N.shade.push(sm.material); });
    };
    windowAt(4.7, 2.15, 2.1, 2.1); windowAt(-4.7, 2.15, 2.1, 2.1);
    windowAt(-4.7, 5.35, 1.6, 1.5); windowAt(4.7, 5.35, 1.6, 1.5);
    const wood = basic({ color: SK.PAL.wood });
    box(2.8, 0.42, 0.45, basic({ color: "#b98654" }), [4.7, 0.86, 0.42]);
    flat(T.flowers(), 2.7, 0.9, [4.7, 1.3, 0.38]);

    // the hanging sign on two chains from iron brackets — it sways a little in the wind
    [-1.3, 1.3].forEach((x) => { box(0.06, 0.06, 0.75, iron, [x, 5.95, 0.4]); box(0.05, 0.4, 0.05, iron, [x, 5.8, 0.05]); });
    box(2.9, 0.07, 0.07, iron, [0, 5.95, 0.75]);
    this.sign = new THREE.Group(); this.sign.position.set(0, 5.95, 0.75); this.add(this.sign);
    [-1.1, 1.1].forEach((x) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.55, 6), iron); c.position.set(x, -0.28, 0); this.sign.add(c); });
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.95, 0.08), [wood, wood, wood, wood, basic({ map: tex(T.signFace(D.entrance.sign)) }), basic({ map: tex(T.signFace(D.entrance.sign)) })]);
    board.position.y = -1.02; this.sign.add(board);

    // bunting across the front, a little proud of the wall
    const bunt = flat(T.bunting(), 12, 0.95, [0, 6.42, 0.62]);

    // garden: the tree (in front of the house now), shrubs, the cat
    const tree = T.treeNatural();
    [[-7.0, 1.9, 8.6], [11.8, 2.5, 7.5]].forEach(([x, z, h]) => {
      [0, Math.PI / 2].forEach((ry) => flat(tree, h * 0.8, h, [x, h / 2, z], [0, ry, 0]));
      const sh = plane(T.glow("30,50,20", 128), h * 0.7, h * 0.35); sh.rotation.x = -Math.PI / 2; sh.position.set(x + 0.4, 0.02, z + 0.3); sh.material.opacity = 0.35; this.add(sh);
    });
    [[-8.6, 0.9, "#5f8f45"], [-3.6, 0.9, "#6c9c4c"], [7.4, 0.9, "#5f8f45"], [-12, 4, "#4e7e3c"], [9.4, 3.6, "#6c9c4c"]].forEach(([x, z, c], i) => flat(T.shrub(c), 1.3 + (i % 2) * 0.4, 1.0 + (i % 2) * 0.25, [x, 0.5 + (i % 2) * 0.12, z]));
    const deco = (k, w, x, y, h, z) => { const m = plane(k, w, h); m.position.set(x, y, z); this.add(m); N.shade.push(m.material); return m; };
    this.cat = deco(T.cat(), 0.8, -2.0, 0.6, undefined, 0.55);

    // sun, moon, clouds and a flapping flock
    const sunM = plane(T.sun(), 2.2, undefined, { fog: false }); sunM.position.set(12.5, 9.6, -6); sunM.userData.spin = 0.05; this.add(sunM); this.skyBits.push(sunM); N.fadeOut.push(sunM);
    const moonM = plane(T.moon(), 3, undefined, { fog: false }); moonM.position.set(12.5, 9.6, -6.05); moonM.material.opacity = 0; this.add(moonM); N.fadeIn.push(moonM);
    const ck = [T.cloud(), T.cloud(), T.cloud()];
    for (let i = 0; i < 9; i++) { const c = plane(ck[i % 3], 3 + Math.random() * 3, undefined, { fog: false }); c.position.set(-26 + i * 6.5 + Math.random() * 3, 12 + Math.random() * 6, -10 - (i % 3) * 3); c.userData.sp = 0.12 + Math.random() * 0.15; this.add(c); this.skyBits.push(c); N.fadeOut.push(c); }
    this.flock = [];
    const up = tex(T.birdPose(true)), down = tex(T.birdPose(false));
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshBasicMaterial({ map: up, transparent: true, fog: false, depthWrite: false }));
      const row = Math.ceil(i / 2), sideOff = i % 2 ? 1 : -1;
      b.userData = { off: [i ? sideOff * row * 0.8 : 0, -row * 0.35], ph: Math.random() * 6, up, down };
      this.add(b); this.flock.push(b); N.fadeOut.push(b);
    }
    this.flockPos = { x: -30, y: 11.4, z: -7 };

    // a farewell sign at the end of the path, framed by the doorway as you leave
    const bye = flat(T.farewellSign(D.meta.name.split(" ")[0]), 3.4, 2.12, [0, 1.06, 12.5], [0, Math.PI, 0]);

    // the street lamp is a light switch for the sky; the mailbox goes to Contact
    this.buildLamp([7.6, 0, 1.9]);
    this.buildMailbox([-2.9, 0, 1.7]);

    // double doors on pivots
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
  }

  /* a classic cast-iron street lamp with a glass lantern. Click it to switch day and night. */
  buildLamp([x, y, z]) {
    const T = ART, grp = new THREE.Group(); grp.position.set(x, y, z);
    const green = new THREE.MeshBasicMaterial({ color: "#1f3a33" }); this.nightKit.shade.push(green);
    const part = (geo, pos) => { const m = new THREE.Mesh(geo, green); m.position.set(...pos); grp.add(m); return m; };
    part(new THREE.CylinderGeometry(0.22, 0.3, 0.5, 16), [0, 0.25, 0]);
    part(new THREE.CylinderGeometry(0.14, 0.2, 0.4, 16), [0, 0.7, 0]);
    part(new THREE.CylinderGeometry(0.06, 0.09, 2.8, 16), [0, 2.25, 0]);
    part(new THREE.CylinderGeometry(0.12, 0.08, 0.18, 16), [0, 3.7, 0]);
    part(new THREE.TorusGeometry(0.16, 0.025, 8, 24), [0, 3.4, 0]).rotation.x = Math.PI / 2;
    // lantern: four glass panes, a pyramid cap, a finial
    this.lampBulb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.42), new THREE.MeshBasicMaterial({ color: "#e9eef0", transparent: true, opacity: 0.85 })); this.lampBulb.position.set(0, 4.08, 0); grp.add(this.lampBulb);
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => part(new THREE.BoxGeometry(0.035, 0.6, 0.035), [a * 0.22, 4.08, b * 0.22]));
    part(new THREE.ConeGeometry(0.4, 0.32, 4), [0, 4.52, 0]).rotation.y = Math.PI / 4;
    part(new THREE.SphereGeometry(0.06, 10, 8), [0, 4.72, 0]);
    this.lampGlow = SK.plane(T.glow(), 3.4, 3.4, { fog: false }); this.lampGlow.position.set(0, 4.08, 0.25); this.lampGlow.material.blending = THREE.AdditiveBlending; this.lampGlow.material.depthWrite = false; this.lampGlow.material.opacity = 0; grp.add(this.lampGlow);
    this.lampPool = SK.plane(T.glow("255,214,140", 128), 5, 5); this.lampPool.rotation.x = -Math.PI / 2; this.lampPool.position.set(0, 0.03, 0); this.lampPool.material.blending = THREE.AdditiveBlending; this.lampPool.material.depthWrite = false; this.lampPool.material.opacity = 0; grp.add(this.lampPool);
    const tag = SK.plane(T.lampTag(), 0.9, 0.62); tag.position.set(0.12, 2.35, 0.12); tag.rotation.z = -0.06; grp.add(tag); this.lampTagM = tag;
    this.lampPulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: SK.tex(T.glow("255,230,150")), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6 })); this.lampPulse.position.set(0, 4.08, 0.1); grp.add(this.lampPulse);
    grp.userData.onClick = () => CORE.setNight(!this.app.night);
    grp.userData.onHover = (on) => { gsap.to(this.lampBulb.scale, { x: on ? 1.12 : 1, y: on ? 1.12 : 1, z: on ? 1.12 : 1, duration: 0.3 }); if (on && !this.lampHinted) { this.lampHinted = true; CORE.hint("THE STREET LAMP", "Click the lamp to switch between day and night"); } };
    this.add(grp); this.interactives.push(grp);
  }

  /* the blue round-topped mailbox with its coral flag. Click it to go to Contact. */
  buildMailbox([x, y, z]) {
    const grp = new THREE.Group(); grp.position.set(x, y, z);
    const blue = new THREE.MeshBasicMaterial({ color: "#4f86b0" }), dark = new THREE.MeshBasicMaterial({ color: "#2c3a44" });
    this.nightKit.shade.push(blue, dark);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), dark); post.position.y = 0.52; grp.add(post);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.6), blue); body.position.y = 1.2; grp.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.6, 20, 1, false, 0, Math.PI), blue); top.rotation.set(Math.PI / 2, 0, Math.PI / 2); top.position.y = 1.35; grp.add(top);
    const front = new THREE.Mesh(new THREE.CircleGeometry(0.21, 20, 0, Math.PI), dark); front.position.set(0, 1.35, 0.301); grp.add(front);
    const frontLow = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), dark); frontLow.position.set(0, 1.2, 0.301); grp.add(frontLow);
    const flagPivot = (this.mailFlag = new THREE.Group()); flagPivot.position.set(0.23, 1.25, -0.1); grp.add(flagPivot);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.08), new THREE.MeshBasicMaterial({ color: SK.PAL.coral })); flag.position.y = 0.15; flagPivot.add(flag);
    grp.userData.onClick = () => { CORE.sound("open"); gsap.to(flagPivot.rotation, { x: -1.4, duration: 0.4 }); setTimeout(() => CORE.go("contact"), 350); };
    grp.userData.onHover = (on) => { gsap.to(grp.scale, { x: on ? 1.08 : 1, y: on ? 1.08 : 1, z: on ? 1.08 : 1, duration: 0.3 }); gsap.to(flagPivot.rotation, { x: on ? -0.7 : 0, duration: 0.3 }); if (on) CORE.hint("THE MAILBOX", "Click the mailbox to get in touch"); };
    this.add(grp); this.interactives.push(grp);
  }

  /* cross-fade the whole outside between day and night */
  /* the corridor and rooms get the generic night tint; the outside has its own richer version */
  applyNight(on, instant) {
    this.setNight(on, instant);
    if (!this.nightSkip) {
      const s = new Set(this.nightKit.shade);
      this.outsideGroup.traverse((o) => [].concat(o.material || []).forEach((m) => s.add(m)));
      this.nightSkip = s;
    }
    this.nightTint = "#b5a793";
    super.applyNight(on, instant);
  }

  setNight(on, instant) {
    const N = this.nightKit, d = instant ? 0 : 1.6, k = { v: this.night };
    const dayTint = new THREE.Color("#ffffff"), nightTint = new THREE.Color("#6a76a6"), fogDay = new THREE.Color("#e4edf2"), fogNight = new THREE.Color("#1c2547");
    gsap.to(k, {
      v: on ? 1 : 0, duration: d, ease: "power2.inOut",
      onUpdate: () => {
        this.night = k.v;
        const mul = dayTint.clone().lerp(nightTint, k.v);
        N.shade.forEach((m) => { m.userData.dayColor = m.userData.dayColor || m.color.clone(); m.color.copy(m.userData.dayColor).multiply(mul); });
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

    for (let z = -6; z > -L; z -= 11) this.pendant(0, H, z, 0.8);

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
      this.doors[r.id].reset = () => { opening = false; arrows.forEach((a) => (a.visible = false)); };
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
    // a banner across the hall just inside the door: welcome on the way in, thank-you on the way out
    const bWelcome = SK.plane(T.banner("HELLO & WELCOME", "#2f5f8a", ["#bfe3d6", "#f6cf5a", "#ffd166"]), 4.3, 0.88);
    bWelcome.position.set(0, 3.1, -0.98); this.add(bWelcome);
    const bThanks = SK.plane(T.banner("THANK YOU FOR VISITING", "#7b2232"), 4.4, 0.95);
    bThanks.position.set(0, 3.08, -1.02); bThanks.rotation.y = Math.PI; this.add(bThanks);
    [-1.9, 1.9].forEach((x) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.25, 6), new THREE.MeshBasicMaterial({ color: "#2b2b2b" })); c.position.set(x, 3.6, -1.01); this.add(c); });
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
    setTimeout(() => CORE.sound("step"), 700); setTimeout(() => CORE.sound("step"), 1050);
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
    if (!this.entered && !this.app.lampTip) { this.app.lampTip = true; setTimeout(() => { if (!this.entered) CORE.hint("TIP", "Click the <b>street lamp</b> to switch day and night · the <b>mailbox</b> takes you to Contact", 7000); }, 2500); }
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
    this.outsideGroup.visible = !this.entered || z > -6 || Math.cos(this.yaw.v) < 0.35;
    if (this.lampPulse && z > 0) { const k = 1 - this.night; this.lampPulse.material.opacity = (0.25 + Math.sin(t * 2.4) * 0.2) * k; this.lampPulse.scale.setScalar(1.1 + Math.sin(t * 2.4) * 0.25); this.lampTagM.rotation.z = -0.06 + Math.sin(t * 1.3) * 0.04; }
    if (this.sign) this.sign.rotation.x = Math.sin(t * 0.9) * 0.035;
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

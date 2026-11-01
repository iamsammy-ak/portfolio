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

  /* ---------- outside: brick façade, tree, cat, sign, doors ---------- */
  buildOutside() {
    const { plane, tex } = SK, T = ART, D = this.D;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ map: tex(T.ground(512), { repeat: [16, 8] }) }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 20); this.add(ground);
    const path = plane(T.stonePath(), 3.2, 9); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 4.5); this.add(path);

    const brick = T.bricks();
    const piece = (x0, x1, y0, y1) => {
      const pw = x1 - x0, ph = y1 - y0;
      const t = tex(brick, { repeat: [pw / 8, ph / 4], offset: [(x0 + 20) / 8, y0 / 4] });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: t }));
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); this.add(m);
    };
    const TOP = 6.7; // a two-storey façade with sky above it
    piece(-20, -1.25, 0, TOP); piece(1.25, 20, 0, TOP); piece(-1.25, 1.25, 3.7, TOP);
    const roofM = plane(T.roof(), 42, 0.9); roofM.position.set(0, TOP + 0.3, 0.12); this.add(roofM);
    // sky furniture: sun, drifting clouds, birds
    const sunM = plane(T.sun(), 1.6); sunM.position.set(3.4, 9.3, -0.4); this.add(sunM); this.skyBits.push(Object.assign(sunM, { userData: { ...sunM.userData, spin: 0.05 } }));
    const ck = [T.cloud(), T.cloud()];
    for (let i = 0; i < 6; i++) { const c = plane(ck[i % 2], 2.2 + Math.random() * 2); c.position.set(-12 + i * 4.6 + Math.random() * 2, 7.9 + Math.random() * 2.2, -0.3 - (i % 3) * 0.1); c.userData.sp = 0.08 + Math.random() * 0.1; this.add(c); this.skyBits.push(c); }
    const bk = T.bird();
    for (let i = 0; i < 4; i++) { const b = plane(bk, 0.5 + Math.random() * 0.3); b.position.set(2 + i * 1.3, 8.6 + (i % 2) * 0.6, -0.2); b.userData.sp = 0.3 + Math.random() * 0.2; b.userData.ph = i; this.add(b); this.skyBits.push(b); }
    const bunt = plane(T.bunting(), 11, 1.07); bunt.position.set(0, 6.25, 0.14); this.add(bunt);
    // jambs so the opening has depth
    const jamb = tex(T.wall(512, true));
    [[-1.25, Math.PI / 2], [1.25, -Math.PI / 2]].forEach(([x, ry]) => { const j = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3.7), new THREE.MeshBasicMaterial({ map: jamb })); j.position.set(x, 1.85, -0.2); j.rotation.y = ry; this.add(j); });
    const lintel = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.4), new THREE.MeshBasicMaterial({ map: jamb })); lintel.position.set(0, 3.7, -0.2); lintel.rotation.x = Math.PI / 2; this.add(lintel);

    const deco = (k, w, x, y, h, z = 0.06) => { const m = plane(k, w, h); m.position.set(x, y, z); this.add(m); return m; };
    deco(T.tree(), 9.5, -6.6, 4.75, 9.5, 0.08);
    this.cat = deco(T.cat(), 0.8, -2.5, 0.62, undefined, 0.1);
    deco(T.mouse(), 0.5, -4.4, 2.6);
    deco(T.windowSketch(), 2.3, 4.7, 2.95);
    deco(T.planter(), 3.2, 4.8, 1.17);
    deco(T.bug(), 0.4, 3.6, 5.2);
    deco(T.hangingSign(D.entrance.sign), 3.4, 0, 5.0, undefined, 0.1);
    deco(T.lampPost(), 0.9, 7.6, 1.8, 3.6, 0.3);
    deco(T.mailbox(), 0.7, -2.9, 0.7, 1.4, 1.6);

    // double doors on pivots
    const st = D.entrance.stickers, half = Math.ceil(st.length / 2);
    this.leaves = [];
    [[-1.25, 0.625, st.slice(0, half), true, -1], [1.25, -0.625, st.slice(half), false, 1]].forEach(([px, off, stick, hingeLeft, dir]) => {
      const pivot = new THREE.Group(); pivot.position.set(px, 0, 0.06);
      const leaf = plane(T.entranceLeaf(stick, hingeLeft), 1.25, 3.7, { side: THREE.FrontSide }); leaf.position.set(off, 1.85, 0);
      const back = plane(T.entranceLeaf([], !hingeLeft, true), 1.25, 3.7, { side: THREE.FrontSide }); back.position.set(off, 1.85, -0.01); back.rotation.y = Math.PI; pivot.add(back);
      leaf.userData.onClick = () => this.enter();
      // hover: both leaves warm up a little and crack open
      leaf.userData.onHover = (on) => { if (this.entered) return; this.leaves.forEach(({ pivot: pv, dir: d, leaf: lf }) => { gsap.to(pv.rotation, { y: on ? d * 0.08 : 0, duration: 0.5, ease: "power2.out" }); gsap.to(lf.material.color, { ...new THREE.Color(on ? "#f3dcb6" : "#ffffff"), duration: 0.4 }); }); };
      pivot.add(leaf); this.add(pivot, true); this.interactives.push(leaf);
      this.leaves.push({ pivot, dir, leaf });
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

    const lampK = T.lamp();
    for (let z = -8; z > -L; z -= 12) { const l = plane(lampK, 1.6, 0.8); l.position.set(0, H - 0.02, z); l.rotation.x = Math.PI / 2; this.add(l); }

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
      pivot.add(door); pivot.add(back); this.add(pivot); this.interactives.push(door);
      this.doors[r.id] = { pivot, ry, r, side };
      let opening = false;
      door.userData.onClick = () => {
        if (opening || this.app.busy || this.walking) return; opening = true;
        arrows.forEach((a) => (a.visible = false));
        this.walkInto(r);
      };
      door.userData.onHover = (on) => {
        if (opening || this.walking) return;
        arrows.forEach((a) => (a.visible = on));
        // left ajar so you can see the lit room behind it
        gsap.to(pivot.rotation, { y: ry + (on ? 0.42 : 0), duration: 0.55, ease: "power2.out" });
        if (on) CORE.sound("creak");
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
    });
    (C.quotes || []).forEach((q) => onWall(T.quotePrint(q.text, q.author), 1.3, q.side === "left" ? -1 : 1, q.z, 2.3));
    (C.graffiti || []).forEach((gf) => {
      const len = Math.abs(gf.from - gf.to), side = gf.side === "left" ? -1 : 1;
      onWall(T.graffiti(gf.text, { colors: gf.colors, w: 2048, h: Math.round(2048 * 2.1 / len), arrow: gf.text === "SHIP IT" }), len, side, (gf.from + gf.to) / 2, 2.5, 2.1, 0.02);
    });
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
    const lamp = plane(T.lamp(), 1.2, 0.6); lamp.position.set(cx, Hr - 0.02, r.z); lamp.rotation.x = Math.PI / 2; this.add(lamp);
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

  onEnter() {
    const from = this.opts.from && this.doors[this.opts.from];
    if (from) {
      // step back out of the room you were in, then the door swings shut behind you
      const { pivot, ry, side } = from;
      pivot.rotation.y = ry + 1.7;
      this.walking = true;
      gsap.to(this.camX, { v: 0, duration: 1.4, ease: "power2.out" });
      gsap.to(this.yaw, { t: -side * 0.35, v: -side * 0.35, duration: 1.6, ease: "power2.inOut" });
      gsap.to(pivot.rotation, { y: ry, duration: 1.1, delay: 0.9, ease: "power2.inOut", onStart: () => CORE.sound("close") });
      setTimeout(() => { this.walking = false; }, 1500);
    }
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
    const speed = Math.abs(this.app.scroll.v - this.lastScroll) / Math.max(dt, 0.001);
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
    this.skyBits.forEach((b) => { if (b.userData.sp) { b.position.x += b.userData.sp * dt; if (b.position.x > 16) b.position.x = -16; } if (b.userData.spin) b.rotation.z += dt * b.userData.spin; if (b.userData.ph !== undefined) b.position.y += Math.sin(t * 3 + b.userData.ph) * 0.002; });
    // things near the entrance fade out as you walk through them
    // …and the big name steps aside when you turn to look at the walls
    const turned = smooth(0.35, 0.9, Math.abs(Math.sin(this.yaw.v)));
    this.fade.forEach((m) => { const d = (m.userData.fz ?? m.position.z) - z; m.material.opacity = (1 - smooth(-1.0, 0.4, d)) * (1 - turned * 0.92); });
    this.avatar.userData.tick(t);
    this.floaters.forEach((m) => { const b = m.userData.base; m.position.y = b[1] + Math.sin(t * 1.4 + m.userData.ph) * m.userData.amp; if (m.userData.spin) m.rotation.z += dt * m.userData.spin; });
    this.arrows.forEach((a) => { if (a.visible) a.position.z = a.userData.base[2] + Math.sin(t * 5) * 0.05 * (a.scale.x); });
    if (this.cat) this.cat.rotation.z = Math.sin(t * 0.8) * 0.01;
  }
};

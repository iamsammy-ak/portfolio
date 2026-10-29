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
    if (this.entered) {
      const v = ((this.zStart - (-1.5)) / (this.zStart - this.zEnd)) * this.scrollLen;
      this.app.scroll.v = this.app.scroll.target = v;
    }
    this.buildOutside();
    this.buildCorridor();
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

  /* ---------- inside: floor, walls, doors, frames, doodles ---------- */
  buildCorridor() {
    const { plane, tex } = SK, T = ART, D = this.D;
    const W = 5, H = 3.7, L = 60;
    const surf = (geoW, geoH, k, repeat, pos, rot) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(geoW, geoH), new THREE.MeshBasicMaterial({ map: tex(k, { repeat }) }));
      m.position.set(...pos); m.rotation.set(...rot); this.add(m); return m;
    };
    surf(W, L, T.planks(), [1, 6], [0, 0, -L / 2], [-Math.PI / 2, 0, 0]);
    surf(W, L, T.ceiling(), [1, 6], [0, H, -L / 2], [Math.PI / 2, 0, 0]);
    const wallK = T.wall();
    surf(L, H, wallK, [8, 1], [-W / 2, H / 2, -L / 2], [0, Math.PI / 2, 0]);
    surf(L, H, wallK, [8, 1], [W / 2, H / 2, -L / 2], [0, -Math.PI / 2, 0]);
    surf(W, H, wallK, [1, 1], [0, H / 2, -L], [0, 0, 0]);
    // back of the façade (seen only when looking back) — plain wall
    [[-W / 2, -1.25], [1.25, W / 2]].forEach(([a, b]) => surf(b - a, H, wallK, [1, 1], [(a + b) / 2, H / 2, -0.01], [0, Math.PI, 0]));

    // name, avatar and floating doodles near the entrance
    const flo = (k, w, x, y, z, o = {}) => {
      const m = plane(k, w); m.position.set(x, y, z); m.rotation.z = o.rz || 0;
      m.userData.base = [x, y, z]; m.userData.ph = Math.random() * 6; m.userData.amp = o.amp ?? 0.08; m.userData.spin = o.spin || 0;
      this.add(m); this.fade.push(m); this.floaters.push(m); return m;
    };
    // the name sits high on the back wall; the character stands to its right so neither hides the other
    const titleM = plane(T.title(D.meta.short, D.meta.title), 4.6); titleM.position.set(-0.55, 2.55, -7.6); this.add(titleM); this.fade.push(titleM);
    this.avatar = T.avatarRig(1.05); this.avatar.position.set(1.55, 1.05, -6.6); this.add(this.avatar);
    this.avatar.userData.parts.forEach((m) => { m.userData.fz = -6.6; this.fade.push(m); });
    flo(T.planeSketch(), 0.95, -2.0, 3.0, -5.6, { rz: 0.3, amp: 0.1 });
    flo(T.paperBall(), 0.45, -1.9, 0.25, -5, { amp: 0.0 });
    flo(T.pencil(), 0.9, 1.6, 0.14, -5.2, { rz: 0.5, amp: 0.0 });
    flo(T.mug(), 0.42, -1.6, 2.2, -6.1, { amp: 0.06 });
    flo(T.doodle("✱", 128, SK.PAL.coral), 0.4, -2.1, 1.6, -6.2, { spin: 0.4 });
    flo(T.doodle("#1", 128, SK.PAL.blue), 0.6, 2.1, 3.2, -9, { amp: 0.05 });
    flo(T.doodle("◌", 128, SK.PAL.sunDeep), 0.3, -2.0, 3.3, -8.5, { spin: 0.3 });

    // ceiling lamps
    const lampK = T.lamp();
    for (let z = -8; z > -L; z -= 12) { const l = plane(lampK, 1.6, 0.8); l.position.set(0, H - 0.02, z); l.rotation.x = Math.PI / 2; this.add(l); }

    // doors to the rooms
    const arrowL = T.arrow(1), arrowR = T.arrow(-1);
    D.corridor.rooms.forEach((r) => {
      const left = r.side === "left", x = left ? -W / 2 + 0.02 : W / 2 - 0.02, ry = left ? Math.PI / 2 : -Math.PI / 2;
      // door hangs on a hinge (pivot) so it can swing into the room when clicked
      const pivot = new THREE.Group(); pivot.position.set(x, 0, r.z + (left ? 0.55 : -0.55)); pivot.rotation.y = ry;
      const door = plane(T.corridorDoor(r.icon), 1.1, 2.2, { side: THREE.FrontSide }); door.position.set(0.55, 1.1, 0);
      const back = plane(T.entranceLeaf([], true, true), 1.1, 2.2, { side: THREE.FrontSide }); back.position.set(0.55, 1.1, -0.01); back.rotation.y = Math.PI;
      pivot.add(door); pivot.add(back); this.add(pivot); this.interactives.push(door);
      door.userData.room = r; let opening = false;
      door.userData.onClick = () => {
        if (opening || this.app.busy) return; opening = true;
        CORE.sound("door"); arrows.forEach((a) => (a.visible = false));
        gsap.to(pivot.rotation, { y: ry - 1.25, duration: 0.9, ease: "power2.inOut" });
        gsap.to(door.material.color, { ...new THREE.Color("#cf9a5e"), duration: 0.6 });
        // glide towards the doorway, then tear into the room
        gsap.to(this.app.scroll, { target: ((this.zStart - r.z) / (this.zStart - this.zEnd)) * this.scrollLen, duration: 0.9, ease: "power2.inOut" });
        gsap.to(this.turn, { y: left ? 0.4 : -0.4, duration: 0.9, ease: "power2.inOut" });
        setTimeout(() => CORE.go(r.id), 650);
      };
      door.userData.onHover = (on) => {
        if (opening) return;
        arrows.forEach((a) => (a.visible = on));
        gsap.to(pivot.rotation, { y: ry - (on ? 0.12 : 0), duration: 0.45, ease: "power2.out" });
        gsap.to(door.material.color, { ...new THREE.Color(on ? "#f3dcb6" : "#ffffff"), duration: 0.35 });
      };
      const sign = plane(T.signBoard(r.label, r.sub), 1.35); sign.position.set(x, 2.78, r.z); sign.rotation.y = ry; this.add(sign);
      const arrows = [[arrowL, r.z - 1.0, left ? 1 : -1], [arrowR, r.z + 1.0, left ? -1 : 1]].map(([k, z, flip]) => {
        const a = plane(k, 0.5); a.position.set(x, 1.3, z); a.rotation.y = ry; a.scale.x = flip; a.visible = false; a.userData.base = [x, 1.3, z]; this.add(a); this.arrows.push(a); return a;
      });
    });

    // framed sketches, vent, table, plant
    D.corridor.frames.forEach((f) => {
      const left = f.side === "left", x = left ? -W / 2 + 0.02 : W / 2 - 0.02;
      const m = plane(T.frameArt(f.lines), 1.6); m.position.set(x, f.y, f.z); m.rotation.y = left ? Math.PI / 2 : -Math.PI / 2; this.add(m);
    });
    const vent = plane(T.vent(), 0.6); vent.position.set(W / 2 - 0.02, 3.05, -18); vent.rotation.y = -Math.PI / 2; this.add(vent);
    const table = plane(T.sideTable(), 1.2); table.position.set(-1.85, 0.6, -27); this.add(table);
    const pl = plane(T.plant(), 0.75); pl.position.set(1.95, 0.6, -52); this.add(pl);

    // the door at the very end → CV
    const end = plane(T.endDoor("cv"), 2.6, 2.9); end.position.set(0, 1.45, -L + 0.03);
    end.userData.onClick = () => { CORE.sound("click"); window.open(D.meta.links.cv, "_blank"); };
    end.userData.onHover = (on) => gsap.to(end.scale, { x: on ? 1.03 : 1, y: on ? 1.03 : 1, duration: 0.3 });
    this.add(end, true);
    const es = plane(T.signBoard(D.corridor.endDoor.label), 1.3); es.position.set(0, 3.28, -L + 0.03); this.add(es);
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
    // walk in by yourself once the doors are open
    gsap.to(this.app.scroll, { target: 1150, duration: 3.2, delay: 0.9, ease: "power2.inOut" });
    setTimeout(() => CORE.hint("WANDERER", this.D.corridor.hintExplore + " · <b>drag</b> or <b>← →</b> to look around"), 1800);
  }

  onEnter() {
    if (this.entered) CORE.hint("EXPLORER", this.D.corridor.hintEnter + " · <b>drag</b> or <b>← →</b> to look around");
  }

  /* look left / right: drag, trackpad swipe or arrow keys */
  onDrag(dx) { if (this.entered) this.yaw.t = SK.clamp(this.yaw.t + dx * 0.0035, -1.15, 1.15); }
  onPan(dx) { if (this.entered) this.yaw.t = SK.clamp(this.yaw.t + dx * 0.0022, -1.15, 1.15); }
  onArrow(dir) { if (this.entered) this.yaw.t = SK.clamp(this.yaw.t + dir * 0.38, -1.15, 1.15); }

  update(dt) {
    const { lerp, smooth } = SK, t = this.time, cam = this.camera;
    const p = this.scrollLen ? this.app.scroll.v / this.scrollLen : 0;
    const z = lerp(this.zStart, this.zEnd, p);
    cam.position.z = z;
    const out = smooth(0.5, 9.5, z); // outside the building: stand taller and look up at the façade
    cam.position.y = 1.6 + out * 0.5 + Math.sin(z * 2.2) * 0.018;
    this.parallax(dt, this.entered ? 0.16 : 0.08);
    // head turn eases towards the target and drifts back to centre while you walk
    const moving = Math.abs(this.app.scroll.v - this.lastScroll) > 0.4; this.lastScroll = this.app.scroll.v;
    if (moving && !this.app.pointer.down) this.yaw.t *= Math.pow(0.25, dt);
    this.yaw.v = lerp(this.yaw.v, this.yaw.t, 1 - Math.pow(0.004, dt));
    cam.rotation.x += out * 0.2; cam.rotation.y += this.turn.y + this.yaw.v;
    if (p > 0.18) CORE.unlock("wanderer");
    this.skyBits.forEach((b) => { if (b.userData.sp) { b.position.x += b.userData.sp * dt; if (b.position.x > 16) b.position.x = -16; } if (b.userData.spin) b.rotation.z += dt * b.userData.spin; if (b.userData.ph !== undefined) b.position.y += Math.sin(t * 3 + b.userData.ph) * 0.002; });
    // things near the entrance fade out as you walk through them
    this.fade.forEach((m) => { const d = (m.userData.fz ?? m.position.z) - z; m.material.opacity = 1 - smooth(-1.0, 0.4, d); });
    this.avatar.userData.tick(t);
    this.floaters.forEach((m) => { const b = m.userData.base; m.position.y = b[1] + Math.sin(t * 1.4 + m.userData.ph) * m.userData.amp; if (m.userData.spin) m.rotation.z += dt * m.userData.spin; });
    this.arrows.forEach((a) => { if (a.visible) a.position.z = a.userData.base[2] + Math.sin(t * 5) * 0.05 * (a.scale.x); });
    if (this.cat) this.cat.rotation.z = Math.sin(t * 0.8) * 0.01;
  }
};

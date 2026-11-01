/* lab.js — "The Lab": a workshop bench with a rolodex. Every card is a public
   GitHub repo (live from the API, see js/github.js). Scroll, drag or use the
   arrow keys to flip cards; click the front card to read it. */
SCENES.lab = class extends CORE.BaseScene {
  constructor(opts) {
    super(opts);
    const { plane, tex } = SK, T = ART;
    this.dragScroll = true;
    this.scene.background = SK.gradientTex("#e4cfa6", "#efe0c2", "#e9d6b2");
    this.camera.fov = 46;
    this.STEP = 520; // scroll units per card
    this.idle = 0; this.lastTarget = 0; this.front = -1; this.flip = 0;

    // workshop: pegboard wall, bench top, a few tools
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), new THREE.MeshBasicMaterial({ map: tex(T.pegboard(), { repeat: [5, 2.3] }) }));
    wall.position.set(0, 3.6, -2.6); this.add(wall);
    const bench = new THREE.Mesh(new THREE.PlaneGeometry(22, 8), new THREE.MeshBasicMaterial({ map: tex(T.planks(), { repeat: [3, 1] }) }));
    bench.rotation.x = -Math.PI / 2; bench.position.set(0, 0, 1.4); this.add(bench);
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(22, 0.35), new THREE.MeshBasicMaterial({ color: new THREE.Color(SK.PAL.woodDark) }));
    edge.position.set(0, -0.17, 5.4); this.add(edge);
    [["wrench", -4.4, 3.5, 0.1], ["ruler", -5.3, 3.3, -0.06], ["saw", 4.2, 3.4, 0.05], ["screwdriver", 5.1, 3.55, -0.08]].forEach(([k, x, y, rz]) => {
      const m = plane(T.tool(k), 0.75); m.position.set(x, y, -2.5); m.rotation.z = rz; m.userData.base = rz; this.add(m);
      (this.swing = this.swing || []).push(m);
    });
    const lamp = plane(T.lamp(), 2.2, 1.1); lamp.position.set(0, 4.6, -2.4); this.add(lamp);
    this.mug = plane(T.mug(), 0.55); this.mug.position.set(2.45, 0.3, 1.2); this.add(this.mug);
    const pen = plane(T.pencil(), 1.0); pen.position.set(-2.4, 0.06, 1.6); pen.rotation.set(-Math.PI / 2, 0, 0.4); this.add(pen);

    // the rolodex
    this.wheel = new THREE.Group(); this.wheel.position.set(0, 0.6, 0); this.add(this.wheel);
    this.cards = [];
    this.build(GH.list);
    // when the live list arrives (or changes), redraw the cards in place
    this.off = GH.onChange((list) => { if (!this.disposed) this.build(list); });
    GH.refresh();

    this.camera.position.set(0, 2.55, 4.7);
    this.camTarget = new THREE.Vector3(0, 1.75, 0);
    this.lookAhead = { x: 0, y: 0 };
  }

  build(list) {
    const { plane } = SK, T = ART;
    this.cards.forEach(({ pivot }) => { pivot.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); }); this.wheel.remove(pivot); });
    this.interactives = this.interactives.filter((o) => !o.userData.repo);
    this.cards = []; this.repos = list;
    list.forEach((r, i) => {
      const pivot = new THREE.Group();
      const card = plane(T.repoCard(r, i), 2.45); // ~1.6 tall
      card.position.y = 0.72 + card.userData.size[1] / 2;
      card.userData.repo = r; card.userData.i = i;
      card.userData.onClick = () => this.pick(i);
      card.userData.onHover = (on) => { if (i === this.front) gsap.to(card.scale, { x: on ? 1.04 : 1, y: on ? 1.04 : 1, duration: 0.3 }); };
      pivot.add(card); this.wheel.add(pivot); this.interactives.push(card);
      this.cards.push({ pivot, card });
    });
    // base, caption and the language sticky note get redrawn with the counts
    if (this.base) { this.base.material.map.dispose(); this.scene.remove(this.base); }
    this.base = plane(T.rolodexBase(`${list.length} repos on GitHub`), 3.1); this.base.position.set(0, 0.95, 0.3); this.add(this.base);
    const counts = Object.entries(list.reduce((a, r) => ((a[r.language || "Other"] = (a[r.language || "Other"] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
    if (this.note) { this.note.material.map.dispose(); this.scene.remove(this.note); }
    this.note = plane(T.langNote(counts), 1.55); this.note.position.set(-2.9, 2.0, -2.45); this.note.rotation.z = 0.05; this.add(this.note);
    this.scrollMax = Math.max(0, (list.length - 1) * this.STEP);
  }

  /* click: the front card opens, any other card is flipped to the front */
  pick(i) {
    if (i !== this.front) { this.app.scroll.target = i * this.STEP; CORE.sound("click"); return; }
    const r = this.repos[i];
    const links = [{ label: "Open on GitHub", url: r.url }];
    if (r.live) links.unshift({ label: "Open the live demo", url: r.live });
    CORE.modal({
      badge: r.language || "Repo", title: r.title,
      period: [r.pushed && "Updated " + new Date(r.pushed + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), `★ ${r.stars ?? 0}`].filter(Boolean).join(" · "),
      summary: r.description, bullets: r.bullets, tags: r.topics, links,
    });
    CORE.unlock("tinkerer");
  }

  onEnter() { CORE.hint("TINKERER", this.app.D.github.hint); }
  onDrag(dx, dy) { this.app.scroll.target -= dy * 4 + dx * 1.5; }
  onPan(dx) { this.app.scroll.target += dx * 2; }
  onArrow(dir) { this.step(dir); }
  onStep(dir) { this.step(dir); }
  step(dir) { this.app.scroll.target = SK.clamp((Math.round(this.app.scroll.target / this.STEP) + dir) * this.STEP, 0, this.scrollMax); }

  dispose() { this.disposed = true; this.off?.(); super.dispose(); }

  update(dt) {
    const { clamp, lerp } = SK, s = this.app.scroll, t = this.time;
    // settle on the nearest card once input stops
    if (Math.abs(s.target - this.lastTarget) > 0.5) this.idle = 0; else this.idle += dt;
    this.lastTarget = s.target;
    if (this.idle > 0.18 && !this.app.pointer.down) s.target = lerp(s.target, Math.round(s.target / this.STEP) * this.STEP, 1 - Math.pow(0.0005, dt));

    const f = s.v / this.STEP, front = clamp(Math.round(f), 0, this.cards.length - 1);
    if (front !== this.front) {
      if (this.front !== -1) { CORE.sound("pop"); this.flip = 1; }
      this.front = front;
    }
    this.flip = Math.max(0, this.flip - dt * 3);

    // cards fan around the axle: the ones still to come lean back in a tight
    // stack, the ones already read fold forward and fade out
    this.cards.forEach(({ pivot, card }, i) => {
      const d = i - f, a = Math.abs(d);
      const ang = d >= 0 ? (a < 1 ? a * 0.5 : 0.5 + (a - 1) * 0.15) : -(a < 1 ? a * 1.25 : 1.25 + (a - 1) * 0.12);
      pivot.rotation.x = -ang;
      const m = card.material;
      m.opacity = d >= 0 ? 1 : clamp(1 - a * 1.4, 0, 1);
      m.visible = m.opacity > 0.02 && ang > -2.6 && ang < 2.6;
      const shade = d > 0 ? clamp(1 - Math.min(a, 6) * 0.07, 0.6, 1) : 1;
      m.color.setScalar(shade);
      card.renderOrder = 100 - Math.round(a * 4);
      m.depthWrite = d >= -0.2;
    });
    this.wheel.position.y = 0.6 + Math.sin(this.flip * Math.PI) * 0.03;

    // camera: a gentle head turn towards the mouse while staying on the front card
    this.lookAhead.x = lerp(this.lookAhead.x, this.app.pointer.x * 0.35, 1 - Math.pow(0.01, dt));
    this.lookAhead.y = lerp(this.lookAhead.y, this.app.pointer.y * 0.18, 1 - Math.pow(0.01, dt));
    this.camera.position.set(this.lookAhead.x, 2.55 + this.lookAhead.y, 4.7);
    this.camera.lookAt(this.camTarget);
    (this.swing || []).forEach((m, i) => (m.rotation.z = m.userData.base + Math.sin(t * 0.9 + i) * 0.03));
  }

  resize(w, h) {
    super.resize(w, h);
    // keep the whole card in view on tall phone screens
    this.camera.fov = w / h < 0.8 ? 70 : w / h < 1.2 ? 56 : 46;
    this.camera.updateProjectionMatrix();
  }
};

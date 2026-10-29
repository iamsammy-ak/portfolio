/* studio.js — "The Office": a floating cluster of screens, one per role.
   Drag (or scroll) to rotate the cluster, click a screen to read it. */
SCENES.studio = class extends CORE.BaseScene {
  constructor(opts) {
    super(opts);
    const { plane } = SK, T = ART, D = this.app.D;
    this.wrapScroll = true; this.dragScroll = true;
    this.camera.fov = 50; this.camera.position.set(0, 0, 9.5);
    this.cluster = new THREE.Group(); this.add(this.cluster);
    this.rot = { x: 0, y: 0 }; this.target = { x: 0, y: 0 }; this.vel = { x: 0, y: 0 }; this.dragged = 0;

    const items = D.studio.items, n = items.length, R = 3.1;
    this.screens = [];
    items.forEach((it, i) => {
      // fibonacci sphere
      const y = 1 - ((i + 0.5) / n) * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996;
      const pos = new THREE.Vector3(Math.cos(a) * r * R, y * R * 0.75, Math.sin(a) * r * R);
      const m = plane(T.monitor(it, i), 2.5); m.position.copy(pos); this.screens.push(m);
      m.userData.onClick = () => { CORE.modal(it); };
      m.userData.onHover = (on) => gsap.to(m.scale, { x: on ? 1.08 : 1, y: on ? 1.08 : 1, duration: 0.3 });
      this.cluster.add(m); this.interactives.push(m);
    });
    const av = plane(T.avatar(false), 1.1); av.position.set(0, -0.2, 0); this.cluster.add(av);
    const glyphs = ["</>", "{ }", "∑", "0101", "SQL", "β", "Δ", "✎", "⌘", "λ", "π", "∞"];
    const ring = new THREE.Group(); this.cluster.add(ring); this.ring = ring;
    const P = SK.PAL, inks = [P.coral, P.blue, P.sunDeep, P.leafDark, P.lilac];
    glyphs.forEach((g, i) => {
      const m = plane(T.doodle(g, 160, inks[i % inks.length]), 0.5 + Math.random() * 0.4);
      const a = (i / glyphs.length) * Math.PI * 2, r = 5 + Math.random() * 1.5, y = -3 + Math.random() * 6;
      m.position.set(Math.cos(a) * r, y, Math.sin(a) * r); m.material.opacity = 0.75; ring.add(m);
    });
    // confetti
    for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ color: new THREE.Color(inks[i % inks.length]) })); d.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10); d.rotation.z = Math.random() * 3; ring.add(d); }
    this.lastV = 0;
  }
  onEnter() { CORE.hint("DIRECTOR", this.app.D.studio.hint); }
  onArrow(dir) { this.target.y += dir * 0.5; }
  onPan(dx) { this.target.y += dx * 0.003; }
  onDrag(dx, dy) {
    this.target.y += dx * 0.006; this.target.x = SK.clamp(this.target.x + dy * 0.004, -0.9, 0.9);
    this.dragged += Math.abs(dx) + Math.abs(dy);
    if (this.dragged > 60) CORE.unlock("director");
  }
  update(dt) {
    const v = this.app.scroll.v; this.target.y += (v - this.lastV) * 0.0025; this.lastV = v;
    if (!this.app.pointer.down) this.target.y += dt * 0.08;
    const k = 1 - Math.pow(0.002, dt);
    this.rot.y = SK.lerp(this.rot.y, this.target.y, k); this.rot.x = SK.lerp(this.rot.x, this.target.x, k);
    this.cluster.rotation.set(this.rot.x, this.rot.y, 0);
    this.ring.rotation.y = -this.rot.y * 0.4;
    // screens always face you so they stay readable while the cluster turns
    this.cluster.updateMatrixWorld();
    this.screens.forEach((m, i) => { m.position.y += Math.sin(this.time * 1.2 + i) * 0.0008; m.lookAt(this.camera.position); });
    this.parallax(dt, 0.03);
  }
};

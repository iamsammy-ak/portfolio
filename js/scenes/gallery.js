/* gallery.js — a rooftop balcony; projects hang from a clothesline and slide
   sideways as you scroll (infinite loop). Click a poster to inspect it. */
SCENES.gallery = class extends CORE.BaseScene {
  constructor(opts) {
    super(opts);
    const { plane, tex } = SK, T = ART, D = this.app.D;
    this.wrapScroll = true; this.dragScroll = true;
    this.scene.background = SK.gradientTex(SK.PAL.skyDeep, SK.PAL.horizon, SK.PAL.sky);
    this.scene.fog = new THREE.Fog(0xe4ecf1, 14, 30);
    this.camera.fov = 50; this.camera.position.set(0, 1.7, 7);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshBasicMaterial({ map: tex(T.parquet(), { repeat: [10, 10] }) }));
    floor.rotation.x = -Math.PI / 2; this.add(floor);
    const rail = plane(T.railing(), 30, 1.7); rail.position.set(0, 0.85, 0.4); this.add(rail);
    const sky = plane(T.skyline(), 48, 9); sky.position.set(0, 4.5, -15); this.add(sky);

    this.clouds = [];
    const ck = [T.cloud(), T.cloud(), T.cloud()];
    for (let i = 0; i < 18; i++) {
      const c = plane(ck[i % 3], 2 + Math.random() * 3); c.position.set(-20 + Math.random() * 40, 5.5 + Math.random() * 5, -6 - Math.random() * 7);
      c.userData.sp = 0.05 + Math.random() * 0.1; this.add(c); this.clouds.push(c);
    }

    // clothesline
    this.lineY = (x) => 5.1 - 0.55 * (1 - (x / 15) ** 2);
    const pts = []; for (let x = -16; x <= 16; x += 0.5) pts.push(new THREE.Vector3(x, this.lineY(x), -2.5));
    [0, 0.025].forEach((o) => { const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => p.clone().add(new THREE.Vector3(0, o, 0)))); this.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x333333 }))); });
    [[-16, 0.4], [16, 0.4]].forEach(([x]) => { const post = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 6), new THREE.MeshBasicMaterial({ color: 0x9a6b3f })); post.position.set(x, 3, -2.5); this.add(post); });

    // a rooftop wall behind the line, covered in graffiti
    [["STAY CURIOUS", ["#cdb6ec", "#7b5cc4", "#3b2a6b"]], ["TORINO", ["#bfe3d6", "#3e7c82", "#2f5f8a"]], ["BUILD · MEASURE · LEARN", ["#f6cf5a", "#e2574b", "#7b2232"]], ["SHIP IT", ["#ffd166", "#ef476f", "#7b2232"]], ["DATA > GUT", ["#b6dfad", "#3e7c82", "#2e5e4e"]]].forEach(([text, colors], i) => {
      const wallG = plane(T.graffiti(text, { bg: "brick", w: 1536, h: 600, colors, arrow: false, tag: i === 2 ? "AK '26" : "AK" }), 12.02, 4.7);
      wallG.position.set((i - 2) * 12, 2.35, -7.5); this.add(wallG);
    });

    // posters: hackathon projects plus the newest repos from GitHub (two copies so the loop never shows a gap)
    const fromGitHub = GH.list.slice(0, D.gallery.githubCount ?? 5).map((r) => ({
      title: r.title, badge: r.language || "Code", event: r.description || "", date: r.pushed ? "Updated " + new Date(r.pushed + "T12:00:00").toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "",
      summary: r.description, bullets: r.bullets, tags: r.topics, links: [...(r.live ? [{ label: "Open the live demo", url: r.live }] : []), { label: "Open on GitHub", url: r.url }],
    }));
    const projects = [...D.gallery.projects, ...fromGitHub];
    const copies = projects.length < 7 ? 2 : 1;
    this.spacing = 3.1; this.loop = projects.length * copies * this.spacing;
    this.posters = [];
    for (let c = 0; c < copies; c++) projects.forEach((pr, i) => {
      const grp = new THREE.Group();
      const m = plane(T.poster(pr, i), 1.75); m.position.y = -m.userData.size[1] / 2 + 0.05;
      m.userData.onClick = () => { CORE.modal(pr); CORE.unlock("art_critic"); };
      m.userData.onHover = (on) => gsap.to(grp.scale, { x: on ? 1.06 : 1, y: on ? 1.06 : 1, duration: 0.3 });
      grp.add(m); grp.userData.base = (c * projects.length + i) * this.spacing; grp.userData.ph = Math.random() * 6;
      this.add(grp); this.interactives.push(m); this.posters.push(grp);
    });
    this.lastV = 0; this.vel = 0;
  }
  onEnter() { CORE.hint("THE GALLERY", this.app.D.gallery.hint); }
  onDrag(dx) { this.app.scroll.target -= dx * 2.5; }
  onArrow(dir) { this.app.scroll.target += dir * this.spacing / 0.0045; }
  update(dt) {
    const t = this.time, v = this.app.scroll.v;
    this.vel = SK.lerp(this.vel, (v - this.lastV) / Math.max(dt, 0.001), 0.1); this.lastV = v;
    const off = -v * 0.0045;
    this.posters.forEach((g) => {
      let x = ((g.userData.base + off + this.loop / 2) % this.loop + this.loop) % this.loop - this.loop / 2;
      g.position.set(x, this.lineY(x), -2.5);
      g.rotation.z = Math.sin(t * 1.3 + g.userData.ph) * 0.03 + SK.clamp(this.vel * 0.00012, -0.25, 0.25);
    });
    this.clouds.forEach((c) => { c.position.x += c.userData.sp * dt; if (c.position.x > 22) c.position.x = -22; });
    this.parallax(dt, 0.04);
  }
};

/* contact.js — a wooden pier over a sketched sea; each contact method is a
   signpost planted in the water. Click one to reach out. */
SCENES.contact = class extends CORE.BaseScene {
  constructor(opts) {
    super(opts);
    const { plane, tex } = SK, T = ART, D = this.app.D;
    this.scene.background = SK.gradientTex(SK.PAL.skyDeep, SK.PAL.horizon, SK.PAL.sky);
    this.scene.fog = new THREE.Fog(0xe0ebf2, 18, 60);
    this.camera.fov = 52; this.camera.position.set(0, 2.4, 7); this.pitch = -0.17;
    this.wrapScroll = true;

    this.waterTex = tex(T.water(), { repeat: [14, 14] });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshBasicMaterial({ map: this.waterTex }));
    water.rotation.x = -Math.PI / 2; this.add(water);

    const pier = plane(T.pier(), 3.4, 6.4); pier.rotation.x = -Math.PI / 2; pier.position.set(0, 0.05, 3.9); this.add(pier);
    const lh = plane(T.lighthouse(), 4.6); lh.position.set(-8, 3.3, -22); this.add(lh);
    this.boat = plane(T.boat(), 1.7); this.boat.position.set(-5.5, 0.38, -12); this.add(this.boat);

    this.clouds = [];
    const ck = [T.cloud(), T.cloud(), T.cloud()];
    for (let i = 0; i < 22; i++) {
      const c = plane(ck[i % 3], 2 + Math.random() * 4); c.position.set(-34 + Math.random() * 68, 4 + Math.random() * 7, -18 - Math.random() * 30);
      c.userData.sp = 0.08 + Math.random() * 0.12; this.add(c); this.clouds.push(c);
    }

    const spots = [[-3.1, -3.4], [-1.2, -5.6], [0.7, -2.5], [2.7, -4.6], [4.2, -7], [-4.6, -6.4]];
    this.posts = [];
    D.contact.methods.forEach((m, i) => {
      const [x, z] = spots[i % spots.length];
      const s = plane(T.signpost(m.label), 2.6); s.position.set(x, 1.15, z);
      s.userData.base = [x, 1.15, z, Math.random() * 6];
      s.userData.onClick = () => {
        CORE.sound("click"); CORE.unlock("sociable");
        if (m.url.startsWith("mailto:")) location.href = m.url; else window.open(m.url, "_blank", "noopener");
      };
      s.userData.onHover = (on) => gsap.to(s.scale, { x: on ? 1.1 : 1, y: on ? 1.1 : 1, duration: 0.3 });
      this.add(s, true); this.posts.push(s);
    });
  }
  onEnter() { CORE.hint("SOCIABLE", this.app.D.contact.hint); }
  update(dt) {
    const t = this.time;
    this.waterTex.offset.x += dt * 0.012; this.waterTex.offset.y += dt * 0.007;
    this.posts.forEach((s) => { const b = s.userData.base; s.position.y = b[1] + Math.sin(t * 1.1 + b[3]) * 0.06; s.rotation.z = Math.sin(t * 0.9 + b[3]) * 0.035; });
    this.boat.position.y = 0.38 + Math.sin(t * 1.3) * 0.08; this.boat.rotation.z = Math.sin(t * 1.1) * 0.08; this.boat.position.x += dt * 0.08; if (this.boat.position.x > 14) this.boat.position.x = -16;
    this.clouds.forEach((c) => { c.position.x += c.userData.sp * dt; if (c.position.x > 36) c.position.x = -36; });
    this.camera.position.z = 7 + Math.sin(t * 0.6) * 0.05; this.camera.position.y = 2.4 + Math.sin(t * 0.8) * 0.03;
    this.parallax(dt, 0.05); this.camera.rotation.x += this.pitch;
  }
};

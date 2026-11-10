/* avatar3d.js — Abhishek's own 3D model (assets/models/abhishek.glb, made on
   Higgsfield from four renders, textured). The model was generated with hands
   in pockets, so its rig can't wave cleanly; it stands in its natural pose,
   breathes, turns to face the visitor and says hello with a speech bubble. */
window.AVATAR3D = (() => {
  const URL = "assets/models/abhishek.glb";
  let pending = null;
  // GLTFLoader and SkeletonUtils arrive as ES modules (see index.html); wait for them
  const ready = () => window.GLTF_LIBS || new Promise((res) => addEventListener("gltf-libs", () => res(window.GLTF_LIBS), { once: true }));
  function load() {
    if (!pending) pending = Promise.resolve(ready()).then((L) => new Promise((res, rej) => new L.GLTFLoader().load(URL + "?v=1", res, undefined, rej)));
    return pending;
  }

  function bubbleTexture() {
    const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d");
    g.fillStyle = "#fffdf7"; g.strokeStyle = "#2b2b2b"; g.lineWidth = 8; g.lineJoin = "round";
    g.beginPath(); g.roundRect(24, 24, 464, 150, 70); g.moveTo(170, 172); g.lineTo(140, 236); g.lineTo(230, 172); g.fill(); g.stroke();
    g.fillStyle = "#fffdf7"; g.fillRect(166, 160, 70, 18);
    g.fillStyle = "#d2514a"; g.font = "700 96px Caveat, cursive"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("Hello! 👋", 256, 102);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  /* returns a Group immediately; the model appears inside it once loaded */
  function create(height = 1.78) {
    const g = new THREE.Group(), u = (g.userData = { ready: false, t: 0, face: 0 });
    const holder = new THREE.Group(); g.add(holder);
    const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTexture(), transparent: true, depthWrite: false }));
    bubble.position.set(0.32, height + 0.32, 0); bubble.scale.set(0.001, 0.001, 1); g.add(bubble);
    load().then((gltf) => {
      const model = window.GLTF_LIBS.SkeletonUtils.clone(gltf.scene);
      model.scale.setScalar(height / 1.78);
      model.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
      holder.add(model);
      u.ready = true;
      g.dispatchEvent({ type: "loaded" });
    }).catch((e) => console.warn("3D avatar failed to load", e));
    /* breathe, turn a little towards the visitor, and pop the hello bubble every few seconds */
    u.tick = (dt, camPos) => {
      u.t += dt;
      holder.scale.set(1, 1 + Math.sin(u.t * 1.6) * 0.006, 1);
      holder.rotation.z = Math.sin(u.t * 0.7) * 0.012;
      if (camPos) {
        const wp = g.getWorldPosition(new THREE.Vector3());
        let want = Math.atan2(camPos.x - wp.x, camPos.z - wp.z) - g.rotation.y;
        want = Math.atan2(Math.sin(want), Math.cos(want));
        u.face += (Math.max(-0.6, Math.min(0.6, want)) - u.face) * (1 - Math.pow(0.05, dt));
        holder.rotation.y = u.face;
      }
      const cycle = u.t % 6, s = cycle < 3.2 ? Math.min(1, cycle * 4) * (1 + Math.sin(Math.min(cycle, 0.6) * 10) * 0.08 * Math.max(0, 1 - cycle)) : Math.max(0, 1 - (cycle - 3.2) * 4);
      bubble.scale.set(0.62 * s + 0.001, 0.31 * s + 0.001, 1);
    };
    return g;
  }

  /* soft lights so the textured, PBR model reads well in a room that has none */
  function lights(scene) {
    if (scene.userData.avatarLights) return;
    scene.userData.avatarLights = true;
    scene.add(new THREE.HemisphereLight("#fff6e8", "#5b4a3a", 1.2));
    const d = new THREE.DirectionalLight("#ffffff", 1.1); d.position.set(2, 5, 6); scene.add(d);
  }
  return { create, load, lights };
})();

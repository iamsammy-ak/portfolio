/* avatar3d.js — Abhishek's own 3D model (assets/models/abhishek.glb, made on
   Higgsfield from four renders, textured). The model was generated with both
   hands in his pockets, so the rig's own wave tears the jacket. Instead the
   right forearm is folded away through the skeleton and a modelled forearm and
   hand are attached at the elbow, raised in a real side-to-side wave. */
window.AVATAR3D = (() => {
  const URL = "assets/models/abhishek.glb";
  const ELBOW = new THREE.Vector3(-0.25, 1.15, -0.04); // right elbow in model space (metres)
  let pending = null;
  const ready = () => window.GLTF_LIBS || new Promise((res) => addEventListener("gltf-libs", () => res(window.GLTF_LIBS), { once: true }));
  function load() {
    if (!pending) pending = Promise.resolve(ready()).then((L) => new Promise((res, rej) => new L.GLTFLoader().load(URL + "?v=1", res, undefined, rej)));
    return pending;
  }

  /* navy pinstripe, like the suit */
  const suitTex = (() => {
    const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d");
    g.fillStyle = "#232838"; g.fillRect(0, 0, 64, 256);
    g.fillStyle = "rgba(170,175,205,0.55)"; for (let x = 4; x < 64; x += 12) g.fillRect(x, 0, 1.5, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
  })();

  /* forearm in the jacket sleeve, a white shirt cuff and an open hand */
  function wavingArm() {
    const suit = new THREE.MeshStandardMaterial({ map: suitTex, roughness: 0.85 });
    const shirt = new THREE.MeshStandardMaterial({ color: "#f2f0ea", roughness: 0.7 });
    const skin = new THREE.MeshStandardMaterial({ color: "#b27b58", roughness: 0.6 });
    const elbow = new THREE.Group();                                    // pivots at the elbow
    elbow.add(new THREE.Mesh(new THREE.SphereGeometry(0.047, 16, 12), suit));
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.05, 0.29, 16), suit); fore.position.y = 0.145; elbow.add(fore);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.04, 0.035, 16), shirt); cuff.position.y = 0.302; elbow.add(cuff);
    const wrist = new THREE.Group(); wrist.position.y = 0.32; wrist.scale.setScalar(1.12); elbow.add(wrist);   // the hand flicks at the wrist
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.026), skin); palm.position.y = 0.045; wrist.add(palm);
    [-0.027, -0.009, 0.009, 0.027].forEach((x, i) => {
      const len = [0.06, 0.07, 0.068, 0.055][i];
      const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, len - 0.017, 4, 8), skin); f.position.set(x * 1.05, 0.088 + len / 2, 0); f.rotation.z = -x * 2.2; wrist.add(f);
    });
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.035, 4, 8), skin); thumb.position.set(0.046, 0.035, 0.008); thumb.rotation.z = -0.9; wrist.add(thumb);
    elbow.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    return { elbow, wrist };
  }

  function bubbleTexture() {
    const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d");
    g.fillStyle = "#fffdf7"; g.strokeStyle = "#2b2b2b"; g.lineWidth = 8; g.lineJoin = "round";
    g.beginPath(); g.roundRect(24, 24, 464, 150, 70); g.moveTo(170, 172); g.lineTo(140, 236); g.lineTo(230, 172); g.fill(); g.stroke();
    g.fillStyle = "#fffdf7"; g.fillRect(166, 160, 70, 18);
    g.fillStyle = "#d2514a"; g.font = "700 104px Caveat, cursive"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("Hello!", 256, 102);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  /* returns a Group immediately; the model appears inside it once loaded */
  function create(height = 1.78) {
    const g = new THREE.Group(), u = (g.userData = { ready: false, t: 0, face: 0 });
    const holder = new THREE.Group(); holder.scale.setScalar(height / 1.78); g.add(holder);
    const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTexture(), transparent: true, depthWrite: false }));
    bubble.position.set(-0.55 * height / 1.78, height + 0.18, 0); bubble.scale.set(0.001, 0.001, 1); g.add(bubble);
    let arm = null;
    load().then((gltf) => {
      const model = window.GLTF_LIBS.SkeletonUtils.clone(gltf.scene);
      model.traverse((o) => {
        if (o.isMesh) o.frustumCulled = false;
        // fold the pocketed right forearm and hand into the elbow; the modelled arm replaces them
        if (o.isBone && o.name === "RightForeArm") o.scale.setScalar(0.0001);
      });
      holder.add(model);
      arm = wavingArm(); arm.elbow.position.copy(ELBOW); holder.add(arm.elbow);
      u.ready = true;
      g.dispatchEvent({ type: "loaded" });
    }).catch((e) => console.warn("3D avatar failed to load", e));

    /* wave, breathe, turn a little towards the visitor, and say hello */
    u.tick = (dt, camPos) => {
      u.t += dt; const t = u.t;
      holder.children[0] && holder.children[0].scale.set(1, 1 + Math.sin(t * 1.6) * 0.006, 1);
      if (arm) {
        // forearm raised beside the head, swinging side to side; the hand flicks at the wrist
        arm.elbow.rotation.set(0.12, 0, 0.42 + Math.sin(t * 7) * 0.3); // leaning out, clear of the body
        arm.wrist.rotation.z = Math.sin(t * 7 - 0.6) * 0.28;
      }
      if (camPos) {
        const wp = g.getWorldPosition(new THREE.Vector3());
        let want = Math.atan2(camPos.x - wp.x, camPos.z - wp.z) - g.rotation.y;
        want = Math.atan2(Math.sin(want), Math.cos(want));
        u.face += (Math.max(-0.6, Math.min(0.6, want)) - u.face) * (1 - Math.pow(0.05, dt));
        holder.rotation.y = u.face;
      }
      const cycle = t % 6, s = cycle < 3.2 ? Math.min(1, cycle * 4) : Math.max(0, 1 - (cycle - 3.2) * 4);
      bubble.scale.set(0.62 * s * height / 1.78 + 0.001, 0.31 * s * height / 1.78 + 0.001, 1);
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

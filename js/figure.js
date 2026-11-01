/* figure.js — Abhishek as a figurine. Four renders (front, three-quarter,
   profile, back) are shown on a camera-facing card; as you move round it the
   card picks the view that matches your angle (mirrored for the other side)
   and cross-fades, the same way a 360° product viewer works. */
window.FIGURE = (() => {
  const VER = "2";
  const FILES = { front: "assets/me/front.webp", three: "assets/me/three-quarter.webp", profile: "assets/me/profile.webp", back: "assets/me/back.webp" };
  const loader = new THREE.TextureLoader();
  const tex = {};
  Object.entries(FILES).forEach(([k, f]) => {
    tex[k] = loader.load(f + "?v=" + VER, (t) => { t.userData.aspect = t.image.width / t.image.height; });
    tex[k].colorSpace = THREE.SRGBColorSpace; tex[k].anisotropy = 4; tex[k].userData.aspect = 0.45;
  });

  // which render to show for an angle (radians, 0 = looking at the front; negative = from his right)
  function pick(rel) {
    const a = Math.abs(rel), mirror = rel > 0;
    if (a < 0.4) return ["front", false];
    if (a < 1.15) return ["three", mirror];
    if (a < 2.35) return ["profile", mirror];
    return ["back", false];
  }

  function create(height = 1.9) {
    const g = new THREE.Group();
    const card = () => {
      const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex.front, transparent: true, alphaTest: 0.08, depthWrite: true }));
      m.scale.set(height * 0.45, height, 1); g.add(m); return m;
    };
    const a = card(), b = card(); b.material.opacity = 0; b.position.z = -0.002;
    // a soft contact shadow under the base
    const shadowC = document.createElement("canvas"); shadowC.width = shadowC.height = 128; const sx = shadowC.getContext("2d");
    const gr = sx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(0,0,0,0.35)"); gr.addColorStop(1, "rgba(0,0,0,0)"); sx.fillStyle = gr; sx.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(height * 0.42, height * 0.18), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowC), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.005; g.add(shadow);
    let cur = "", fade = 1;
    const world = new THREE.Vector3();
    const show = (mesh, key, mirror) => { const t = tex[key]; mesh.material.map = t; mesh.material.needsUpdate = true; const w = height * (t.userData.aspect || 0.45); mesh.scale.set(mirror ? -w : w, height, 1); };
    g.userData.update = (camPos, dt, facing = 0, parentYaw = 0) => {
      g.getWorldPosition(world);
      const toCam = Math.atan2(camPos.x - world.x, camPos.z - world.z);
      // the card always faces you; the picture on it tells you which side you are looking at
      g.rotation.y = toCam - parentYaw;
      let rel = toCam - facing; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      const [key, mirror] = pick(rel), id = key + mirror;
      if (id !== cur) {
        // the old view stays on the back card and fades out under the new one
        if (cur) { b.material.map = a.material.map; b.scale.copy(a.scale); b.material.opacity = 1; fade = 0; }
        show(a, key, mirror); cur = id;
      }
      if (fade < 1) { fade = Math.min(1, fade + dt * 5); b.material.opacity = 1 - fade; }
      // breathing
      a.scale.y = b.scale.y = height * (1 + Math.sin(performance.now() / 900) * 0.004);
    };
    g.userData.cards = [a, b];
    return g;
  }

  return { create };
})();

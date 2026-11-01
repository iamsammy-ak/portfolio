/* pets.js — Sofia the German Shepherd and the house cat, built from 3D
   primitives with cartoon (toon) shading and ink outlines so they sit in the
   hand-drawn world. Each pet returns a THREE.Group with a tick(t, dt, ctx). */
window.PETS = (() => {
  // three-step toon ramp: light, mid, shadow
  const ramp = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
  const ink = new THREE.MeshBasicMaterial({ color: "#2a2420", side: THREE.BackSide });
  const toon = (color, map) => new THREE.MeshToonMaterial({ color, map: map || null, gradientMap: ramp });
  function part(geo, mat, pos, rot, scale, outline = 1.06) {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scale) m.scale.set(...scale);
    if (outline) { const o = new THREE.Mesh(geo, ink); o.scale.setScalar(outline); m.add(o); }
    return m;
  }
  const sphere = (r) => new THREE.SphereGeometry(r, 20, 14);
  const cyl = (r0, r1, h) => new THREE.CylinderGeometry(r0, r1, h, 14);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Sofia ---------- */
  function dog(name = "Sofia") {
    const g = new THREE.Group(), tan = toon("#c98a4a"), light = toon("#e2ad72"), black = toon("#2b2522"), red = toon("#c23b30"), gold = toon("#e9c45a");
    const body = new THREE.Group(); body.position.y = 0.52; g.add(body);
    body.add(part(new THREE.CapsuleGeometry(0.17, 0.48, 6, 16), tan, [0, 0, 0], [0, 0, Math.PI / 2]));
    body.add(part(sphere(0.2), black, [-0.04, 0.09, 0], null, [1.55, 0.6, 0.98], 1.03));        // the black saddle
    body.add(part(sphere(0.16), light, [0.28, -0.04, 0], null, [1, 1.05, 0.95]));                 // chest
    const neck = part(cyl(0.085, 0.11, 0.3), tan, [0.4, 0.14, 0], [0, 0, -0.75]); body.add(neck);
    body.add(part(new THREE.TorusGeometry(0.1, 0.022, 8, 20), red, [0.42, 0.13, 0], [0, Math.PI / 2, -0.75], null, 1.08));
    body.add(part(new THREE.CircleGeometry(0.03, 12), gold, [0.49, 0.03, 0.06], [0, 0.6, 0], null, 0));
    // head
    const head = new THREE.Group(); head.position.set(0.55, 0.3, 0); body.add(head);
    head.add(part(sphere(0.13), tan, [0, 0, 0], null, [1.05, 0.95, 0.92]));
    head.add(part(sphere(0.09), black, [-0.03, 0.06, 0], null, [1, 0.6, 1], 1.03));
    head.add(part(cyl(0.045, 0.075, 0.2), light, [0.14, -0.04, 0], [0, 0, -Math.PI / 2]));
    head.add(part(sphere(0.035), black, [0.25, -0.03, 0]));
    [-1, 1].forEach((s) => {
      head.add(part(sphere(0.018), black, [0.08, 0.04, s * 0.075], null, null, 0));
      head.add(part(new THREE.ConeGeometry(0.055, 0.16, 12), black, [-0.03, 0.15, s * 0.065], [s * 0.18, 0, -0.1]));
    });
    // legs on hip pivots so they can swing
    const legs = [];
    [[0.26, 1], [0.26, -1], [-0.24, 1], [-0.24, -1]].forEach(([x, s]) => {
      const hip = new THREE.Group(); hip.position.set(x, -0.05, s * 0.1); body.add(hip);
      hip.add(part(cyl(0.045, 0.04, 0.42), x > 0 ? light : tan, [0, -0.21, 0]));
      hip.add(part(sphere(0.052), light, [0.02, -0.43, 0], null, [1.3, 0.7, 1]));
      legs.push(hip);
    });
    // a bushy tail in three pieces
    // one continuous bushy tail pointing back and down from the rump, black at the tip
    const tail = new THREE.Group(); tail.position.set(-0.4, 0.05, 0); body.add(tail);
    tail.add(part(new THREE.CapsuleGeometry(0.05, 0.22, 4, 10), tan, [-0.14, -0.065, 0], [0, 0, 2.0]));
    tail.add(part(new THREE.CapsuleGeometry(0.058, 0.14, 4, 10), black, [-0.31, -0.15, 0], [0, 0, 2.0]));
    g.userData = { name, kind: "dog", body, head, legs, tail, x: 2.6, z: 1.75, target: 2.6, heading: 1, state: "idle", timer: 1.5, phase: 0 };
    g.scale.setScalar(1.4);
    g.userData.tick = (t, dt, ctx) => {
      const u = g.userData;
      u.timer -= dt;
      if (u.state === "idle" && u.timer <= 0) { u.target = ctx.minX + Math.random() * (ctx.maxX - ctx.minX); u.state = Math.abs(u.target - u.x) > 0.4 ? "walk" : "idle"; u.timer = 2 + Math.random() * 3; }
      if (u.state === "walk") {
        const dir = Math.sign(u.target - u.x); u.heading = dir;
        u.x += dir * 0.62 * dt; u.phase += dt * 9;
        if (Math.abs(u.target - u.x) < 0.05) { u.state = "idle"; u.timer = 2 + Math.random() * 3.5; }
      } else u.phase = lerp(u.phase, Math.round(u.phase / Math.PI) * Math.PI, 0.1);
      const walking = u.state === "walk";
      g.position.x = u.x; g.position.z = u.z;
      g.rotation.y = lerp(g.rotation.y, u.heading > 0 ? 0 : Math.PI, 1 - Math.pow(0.002, dt));
      const sw = Math.sin(u.phase) * 0.55;
      u.legs.forEach((l, i) => (l.rotation.z = (i === 0 || i === 3 ? sw : -sw) * (walking ? 1 : 0)));
      u.body.position.y = 0.52 + (walking ? Math.abs(Math.sin(u.phase)) * 0.03 : Math.sin(t * 2) * 0.006);
      u.tail.rotation.y = Math.sin(t * (walking ? 6 : 11)) * (walking ? 0.25 : 0.55);
      u.tail.rotation.z = walking ? -0.1 : -0.35; // held higher when she is happy and still
      // while standing still she looks at you
      let look = 0;
      if (!walking) { look = Math.atan2(-(ctx.cam.z - g.position.z), ctx.cam.x - g.position.x) - g.rotation.y; look = Math.atan2(Math.sin(look), Math.cos(look)); }
      u.head.rotation.y = lerp(u.head.rotation.y, Math.max(-1.1, Math.min(1.1, look)), 1 - Math.pow(0.02, dt));
      u.head.rotation.z = Math.sin(t * 1.7) * 0.05;
    };
    return g;
  }

  /* ---------- the cat: an orange tabby sitting by the door ---------- */
  function cat() {
    const stripes = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 128; const x = c.getContext("2d"); x.fillStyle = "#f0b46e"; x.fillRect(0, 0, 256, 128); x.fillStyle = "#c97a3a"; for (let i = 0; i < 9; i++) { x.beginPath(); x.ellipse(14 + i * 30, 64, 6, 70, 0.15, 0, Math.PI * 2); x.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const g = new THREE.Group(), fur = toon("#ffffff", stripes), plain = toon("#f0b46e"), white = toon("#fbf3e6"), pink = toon("#f2a39a"), dark = toon("#2b2522"), green = toon("#7fc36a");
    g.add(part(sphere(0.13), fur, [0, 0.16, 0], null, [0.85, 1.25, 0.8]));
    g.add(part(sphere(0.09), white, [0.07, 0.13, 0], null, [0.6, 1.1, 0.7], 0));
    [-1, 1].forEach((s) => { g.add(part(cyl(0.022, 0.02, 0.17), plain, [0.08, 0.085, s * 0.05])); g.add(part(sphere(0.03), white, [0.09, 0.005, s * 0.05], null, [1.3, 0.6, 1])); g.add(part(sphere(0.075), fur, [-0.03, 0.06, s * 0.08], null, [1.3, 0.8, 0.6])); });
    const head = new THREE.Group(); head.position.set(0.03, 0.37, 0); g.add(head);
    head.add(part(sphere(0.085), fur, null, null, [1, 0.92, 1.05]));
    head.add(part(sphere(0.04), white, [0.07, -0.025, 0], null, [0.8, 0.7, 1.1], 0));
    head.add(part(sphere(0.012), pink, [0.11, -0.01, 0], null, null, 0));
    const eyes = [];
    [-1, 1].forEach((s) => {
      const e = part(sphere(0.017), green, [0.07, 0.022, s * 0.038], null, [0.6, 1, 1], 0); head.add(e); eyes.push(e);
      e.add(part(sphere(0.008), dark, [0.012, 0, 0], null, [0.6, 1.6, 0.6], 0));
      head.add(part(new THREE.ConeGeometry(0.035, 0.075, 4), plain, [-0.005, 0.085, s * 0.045], [s * 0.25, 0, 0]));
    });
    const tail = new THREE.Group(); tail.position.set(-0.1, 0.03, 0); g.add(tail);
    const segs = [];
    let parent = tail;
    for (let i = 0; i < 5; i++) { const seg = new THREE.Group(); seg.position.set(i ? -0.07 : 0, 0, 0); parent.add(seg); seg.add(part(new THREE.CapsuleGeometry(0.02, 0.05, 4, 8), i === 4 ? toon("#c97a3a") : plain, [-0.035, 0, 0], [0, 0, Math.PI / 2])); segs.push(seg); parent = seg; }
    g.userData = { kind: "cat", head, eyes, segs, blink: 2 };
    g.scale.setScalar(1.7);
    g.userData.tick = (t, dt, ctx) => {
      const u = g.userData;
      u.segs.forEach((s, i) => { s.rotation.y = Math.sin(t * 1.6 - i * 0.6) * 0.32; s.rotation.z = i === 0 ? 0.3 : 0.12; });
      const want = Math.max(-0.9, Math.min(0.9, ctx.pointer.x * 0.9));
      u.head.rotation.y = lerp(u.head.rotation.y, want, 1 - Math.pow(0.02, dt));
      u.head.rotation.z = Math.sin(t * 0.8) * 0.06 + ctx.pointer.y * 0.15;
      u.blink -= dt; const closed = u.blink < 0.12; if (u.blink < 0) u.blink = 2.5 + Math.random() * 3;
      u.eyes.forEach((e) => (e.scale.y = closed ? 0.1 : 1));
    };
    return g;
  }

  return { dog, cat };
})();

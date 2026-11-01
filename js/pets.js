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
    g.userData = { name, kind: "dog", body, head, legs, tail, x: 2.7, z: 1.8, tx: 2.7, tz: 1.8, heading: -Math.PI / 2, state: "sit", timer: 0, phase: 0, sit: 1, lie: 0, path: [] };
    g.scale.setScalar(1.4);
    const u = g.userData;
    // walk a list of points; then call done()
    u.go = (points, next) => { u.path = points.slice(); u.after = next; u.state = "walk"; [u.tx, u.tz] = u.path.shift(); };
    u.bark = () => { if (u.state === "sit") { u.state = "idle"; u.timer = 0.6; } };
    // walk in, then turn round to lie facing the door
    u.toBed = (door, inside) => { if (u.state === "sleep" || u.state === "bed") return; u.state = "bed"; u.go([door, inside], () => { u.heading = Math.atan2(-(door[1] - inside[1]), door[0] - inside[0]); u.state = "sleep"; }); u.state = "walk"; u.bedTrip = true; };
    u.wake = (door, out) => { if (u.state !== "sleep" && !u.bedTrip) return; u.bedTrip = false; u.go([door, out], () => { u.state = "sit"; }); };
    u.place = (x, z, state) => { u.x = u.tx = x; u.z = u.tz = z; u.state = state; u.path = []; u.bedTrip = state === "sleep"; u.sit = state === "sit" ? 1 : 0; u.lie = state === "sleep" ? 1 : 0; };
    u.tick = (t, dt, ctx) => {
      u.timer -= dt;
      if (u.state === "idle" && u.timer <= 0) {
        const r = ctx.roam; u.go([[r[0] + Math.random() * (r[1] - r[0]), r[2] + Math.random() * (r[3] - r[2])]], () => { u.state = "idle"; u.timer = 2 + Math.random() * 3.5; });
      }
      const moving = u.state === "walk";
      if (moving) {
        const dx = u.tx - u.x, dz = u.tz - u.z, d = Math.hypot(dx, dz);
        u.heading = Math.atan2(-dz, dx);
        const step = Math.min(d, 0.65 * dt); u.x += (dx / (d || 1)) * step; u.z += (dz / (d || 1)) * step; u.phase += dt * 9;
        if (d < 0.03) { if (u.path.length) [u.tx, u.tz] = u.path.shift(); else { u.state = "idle"; u.timer = 2; const f = u.after; u.after = null; f && f(); } }
      } else u.phase = lerp(u.phase, Math.round(u.phase / Math.PI) * Math.PI, 0.1);
      g.position.x = u.x; g.position.z = u.z;
      let dh = u.heading - g.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      g.rotation.y += dh * (1 - Math.pow(0.002, dt));
      // poses: sitting folds the back legs and lifts the chest, sleeping lies her down
      u.sit = lerp(u.sit, u.state === "sit" ? 1 : 0, 1 - Math.pow(0.01, dt));
      u.lie = lerp(u.lie, u.state === "sleep" ? 1 : 0, 1 - Math.pow(0.02, dt));
      const sw = Math.sin(u.phase) * 0.55 * (moving ? 1 : 0);
      u.legs.forEach((l, i) => {
        const front = i < 2;
        l.rotation.z = (i === 0 || i === 3 ? sw : -sw) + (front ? -u.sit * 0.45 + u.lie * 1.3 : u.sit * 1.25 + u.lie * -1.3);
      });
      u.body.rotation.z = u.sit * 0.45;
      u.body.position.y = 0.52 - u.sit * 0.12 - u.lie * 0.32 + (moving ? Math.abs(Math.sin(u.phase)) * 0.03 : Math.sin(t * 2) * 0.006 * (1 - u.lie));
      u.tail.rotation.y = u.state === "sleep" ? 0 : Math.sin(t * (moving ? 6 : 11)) * (moving ? 0.25 : 0.55);
      u.tail.rotation.z = moving ? -0.1 : u.sit > 0.5 ? 0.6 : -0.35;
      let look = 0;
      if (!moving && u.state !== "sleep") { look = Math.atan2(-(ctx.cam.z - g.position.z), ctx.cam.x - g.position.x) - g.rotation.y; look = Math.atan2(Math.sin(look), Math.cos(look)); }
      u.head.rotation.y = lerp(u.head.rotation.y, Math.max(-1.1, Math.min(1.1, look)), 1 - Math.pow(0.02, dt));
      u.head.rotation.z = u.state === "sleep" ? -0.5 - u.sit * 0.45 : Math.sin(t * 1.7) * 0.05 - u.sit * 0.4;
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
    g.userData = { kind: "cat", name: "Luna", head, eyes, segs, blink: 2, state: "sit", path: [], x: 0, z: 0, hop: 0, face: -Math.PI / 2 };
    g.scale.setScalar(1.7);
    const u = g.userData;
    u.place = (x, z, state, face) => { u.x = x; u.z = z; u.state = state; u.path = []; if (face !== undefined) u.face = face; g.visible = true; };
    u.go = (points, next) => { u.path = points.slice(); u.after = next; u.state = "walk"; };
    u.tick = (t, dt, ctx) => {
      if (u.state === "walk") {
        const [tx, tz] = u.path[0], dx = tx - u.x, dz = tz - u.z, d = Math.hypot(dx, dz);
        u.face = Math.atan2(-dz, dx);
        const step = Math.min(d, 0.75 * dt); u.x += (dx / (d || 1)) * step; u.z += (dz / (d || 1)) * step; u.hop += dt * 11;
        if (d < 0.02) { u.path.shift(); if (!u.path.length) { const f = u.after; u.after = null; u.state = "sit"; f && f(); } }
      }
      g.position.set(u.x, u.state === "walk" ? Math.abs(Math.sin(u.hop)) * 0.06 : 0, u.z);
      let dh = u.face - g.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); g.rotation.y += dh * (1 - Math.pow(0.003, dt));
      const sleeping = u.state === "sleep";
      u.segs.forEach((s, i) => { s.rotation.y = sleeping ? 0.5 : Math.sin(t * 1.6 - i * 0.6) * 0.32; s.rotation.z = i === 0 ? 0.3 : 0.12; });
      const want = sleeping || u.state === "walk" ? 0 : Math.max(-0.9, Math.min(0.9, ctx.pointer.x * 0.9));
      u.head.rotation.y = lerp(u.head.rotation.y, want, 1 - Math.pow(0.02, dt));
      u.head.rotation.z = sleeping ? -0.35 : Math.sin(t * 0.8) * 0.06 + ctx.pointer.y * 0.15;
      u.blink -= dt; const closed = sleeping || u.blink < 0.12; if (u.blink < 0) u.blink = 2.5 + Math.random() * 3;
      u.eyes.forEach((e) => (e.scale.y = closed ? 0.1 : 1));
    };
    return g;
  }

  /* a little wooden shelter with a real doorway cut into the front, a pitched roof and a nameplate */
  function shelter({ w = 1.2, h = 0.85, d = 1.3, wall = "#b9825a", trim = "#f3efe6", roof = "#7b2232", name = "", round = false }) {
    const g = new THREE.Group(), wm = toon(wall), tm = toon(trim), rm = toon(roof), dark = new THREE.MeshBasicMaterial({ color: "#1b1512" });
    // inside is dark so the doorway reads as an opening
    const inner = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, h * 0.94, d * 0.94), new THREE.MeshBasicMaterial({ color: "#2a211b", side: THREE.BackSide })); inner.position.y = h / 2; g.add(inner);
    g.add(part(new THREE.BoxGeometry(0.06, h, d), wm, [-w / 2, h / 2, 0]));
    g.add(part(new THREE.BoxGeometry(0.06, h, d), wm, [w / 2, h / 2, 0]));
    g.add(part(new THREE.BoxGeometry(w, h, 0.06), wm, [0, h / 2, -d / 2]));
    g.add(part(new THREE.BoxGeometry(w + 0.08, 0.06, d + 0.08), toon("#4a3526"), [0, 0.03, 0]));  // floor, dark so the doorway reads as an opening
    // front wall with the doorway cut out
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(0, h + w * 0.42); sh.lineTo(-w / 2, h); sh.closePath();
    const hole = new THREE.Path(), dw = w * (round ? 0.5 : 0.52), dh = h * 0.7;
    if (round) { hole.absarc(0, h * 0.45, dw / 2, 0, Math.PI * 2, true); }
    else { hole.moveTo(-dw / 2, 0.06); hole.lineTo(dw / 2, 0.06); hole.lineTo(dw / 2, dh - dw / 2); hole.absarc(0, dh - dw / 2, dw / 2, 0, Math.PI, false); hole.lineTo(-dw / 2, 0.06); }
    sh.holes.push(hole);
    const front = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false }), wm); front.position.z = d / 2 - 0.06; g.add(front);
    const back = new THREE.Shape(); back.moveTo(-w / 2, h); back.lineTo(w / 2, h); back.lineTo(0, h + w * 0.42); back.closePath();
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(back), wm); gable.position.z = -d / 2; gable.rotation.y = Math.PI; g.add(gable);
    // roof: two slopes meeting at the ridge
    const slope = Math.hypot(w / 2, w * 0.42) + 0.12, ang = Math.atan2(w * 0.42, w / 2);
    [-1, 1].forEach((s) => g.add(part(new THREE.BoxGeometry(slope, 0.06, d + 0.24), rm, [s * w / 4, h + w * 0.21 + 0.03, 0], [0, 0, -s * ang])));
    // a nameplate over the door
    if (name) {
      const c = document.createElement("canvas"); c.width = 256; c.height = 96; const x = c.getContext("2d");
      x.fillStyle = "#f6ead2"; x.fillRect(0, 0, 256, 96); x.strokeStyle = "#5c3a21"; x.lineWidth = 8; x.strokeRect(4, 4, 248, 88);
      x.fillStyle = "#3a2618"; x.font = "700 52px Caveat, cursive"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(name, 128, 50);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.5, w * 0.19), new THREE.MeshBasicMaterial({ map: t }));
      plate.position.set(0, round ? h * 0.92 : h * 0.86 + 0.06, d / 2 + 0.005); g.add(plate);
    }
    g.userData.door = d / 2 + 0.35; // how far in front of the centre the doorway is
    return g;
  }

  return { dog, cat, shelter };
})();

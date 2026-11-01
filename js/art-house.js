/* art-house.js — the modern house, its garden, the Turin skyline and the
   night sky. Same pencil-and-wash language as art.js, with more tone and
   light so the outside reads as a real place. Adds to window.ART. */
(() => {
  const { R, TAU, canvas, paper, Pen, PAL: C } = SK;
  const pick = (a) => a[(Math.random() * a.length) | 0];

  /* charcoal fibre-cement panels */
  function cladding(w = 1024, h = 1024) {
    const k = canvas(w, h), g = k.g;
    paper(g, w, h, { base: "#3d434a", grain: 0.08 });
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(255,255,255,0.04)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,0.06)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const p = new Pen(g, { width: 2, jitter: 0.5, passes: 1, ink: "#1f2327", alpha: 0.8 });
    for (let x = 0; x <= w; x += w / 4) { p.line(x, 0, x, h); g.fillStyle = "rgba(255,255,255,0.06)"; g.fillRect(x + 2, 0, 3, h); }
    for (let y = 0; y <= h; y += h / 2) { p.line(0, y, w, y); }
    for (let i = 0; i < 40; i++) { const x = R(w), y = R(h); p.line(x, y, x, y + R(30, 120), { alpha: 0.12, width: 1 }); }
    return k;
  }

  /* vertical cedar slats */
  function woodSlats(w = 1024, h = 512) {
    const k = canvas(w, h), g = k.g;
    g.fillStyle = "#2c2018"; g.fillRect(0, 0, w, h);
    const p = new Pen(g, { width: 1, jitter: 0.6, passes: 1, ink: "#4a3020" });
    const tones = ["#b9824f", "#a8713f", "#c48f5b", "#9e6a3c", "#b37b48"];
    for (let x = 0; x < w; x += 34) {
      const c = pick(tones); g.fillStyle = c; g.fillRect(x + 3, 0, 28, h);
      g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(x + 3, 0, 4, h);
      g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(x + 27, 0, 4, h);
      for (let j = 0; j < 3; j++) { const gx = x + R(8, 26); p.curve([[gx, 0], [gx + R(-3, 3), h / 2], [gx + R(-3, 3), h]], false, { alpha: 0.35 }); }
    }
    return k;
  }

  /* a big glass wall with a furnished interior behind it; night = warm and lit */
  function glassWall(kind = "living", night = false, w = 1024, h = 560) {
    const k = canvas(w, h), g = k.g;
    const back = g.createLinearGradient(0, 0, 0, h);
    if (night) { back.addColorStop(0, "#ffd99a"); back.addColorStop(1, "#f2a95e"); } else { back.addColorStop(0, "#d8d2c6"); back.addColorStop(1, "#b9b1a4"); }
    g.fillStyle = back; g.fillRect(0, 0, w, h);
    const p = new Pen(g, { width: 2.2, jitter: 0.8, passes: 1, ink: night ? "#5a3a1a" : "#3a3a3a" });
    const shade = (c) => (night ? c : c);
    g.fillStyle = night ? "#e8a55b" : "#a59b8c"; g.fillRect(0, h * 0.8, w, h * 0.2); // floor
    if (kind === "living") {
      // bookshelf
      p.rect(60, 70, 240, 380, { fill: shade("#8a5a34") });
      for (let s = 0; s < 4; s++) { p.line(60, 160 + s * 90, 300, 160 + s * 90, { width: 3 }); let x = 72; while (x < 286) { const bw = R(12, 26); p.rect(x, 160 + s * 90 - R(50, 78), bw, 0, {}); g.fillStyle = pick([C.granata, C.po, C.ochre, C.teal, C.burnt, "#e9e1d0"]); const bh = R(48, 76); g.fillRect(x, 160 + s * 90 - bh, bw - 2, bh); x += bw; } }
      // sofa
      p.rrect(380, 330, 420, 120, 24, { fill: C.teal });
      p.rrect(380, 290, 420, 70, 20, { fill: "#4f9198" });
      p.rrect(420, 300, 90, 60, 14, { fill: C.ochre });
      // pendant lamp + plant
      p.line(600, 0, 600, 120, { width: 1.6 });
      p.stroke([[560, 120], [640, 120], [620, 160], [580, 160]], true, { fill: night ? "#fff2c4" : "#e1c067" });
      p.rrect(860, 360, 90, 90, 10, { fill: "#d7d2c8" });
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + R(-1.2, 1.2); p.curve([[905, 360], [905 + Math.cos(a) * 60, 360 + Math.sin(a) * 60 - 30], [905 + Math.cos(a) * 110, 360 + Math.sin(a) * 120]], false, { width: 5, ink: C.leafDark, alpha: 0.9 }); }
    } else {
      // studio: desk, glowing monitor, chair, whiteboard
      p.rect(90, 70, 330, 210, { fill: "#f7f5ef" });
      for (let i = 0; i < 5; i++) p.line(120, 110 + i * 32, 120 + R(120, 260), 110 + i * 32, { passes: 1, ink: pick([C.po, C.granata, C.tram]), width: 3 });
      p.rect(470, 300, 460, 22, { fill: "#6f4a2c" });
      p.rect(500, 322, 16, 120, { fill: "#4a4a4a" }); p.rect(890, 322, 16, 120, { fill: "#4a4a4a" });
      p.rect(560, 150, 260, 150, { fill: "#2a2f35" });
      g.fillStyle = night ? "#9ad7ff" : "#7fb6d9"; g.fillRect(572, 162, 236, 126);
      for (let i = 0; i < 5; i++) { g.fillStyle = pick(["#ffffff", C.sun, C.mint]); g.fillRect(590, 176 + i * 20, R(60, 170), 8); }
      p.rect(670, 300, 40, 0);
      p.rrect(600, 340, 120, 110, 20, { fill: "#33373d" });
    }
    if (!night) {
      // sky reflections on the glass
      const rf = g.createLinearGradient(0, 0, w, h); rf.addColorStop(0, "rgba(190,220,245,0.55)"); rf.addColorStop(0.6, "rgba(190,220,245,0.15)"); rf.addColorStop(1, "rgba(255,255,255,0.3)");
      g.fillStyle = rf; g.fillRect(0, 0, w, h);
      g.save(); g.globalAlpha = 0.45; g.fillStyle = "#fff"; [[0.15, 0.06], [0.24, 0.03], [0.62, 0.05]].forEach(([x, ww]) => { g.beginPath(); g.moveTo(w * x, 0); g.lineTo(w * (x + ww), 0); g.lineTo(w * (x + ww - 0.18), h); g.lineTo(w * (x - 0.18), h); g.closePath(); g.fill(); }); g.restore();
    } else {
      const gl = g.createRadialGradient(w / 2, h * 0.3, 20, w / 2, h * 0.4, w * 0.7); gl.addColorStop(0, "rgba(255,240,200,0.45)"); gl.addColorStop(1, "rgba(255,240,200,0)"); g.fillStyle = gl; g.fillRect(0, 0, w, h);
    }
    // black aluminium frame and mullions
    g.fillStyle = "#24282d";
    g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16); g.fillRect(0, 0, 16, h); g.fillRect(w - 16, 0, 16, h);
    [w / 3, (2 * w) / 3].forEach((x) => g.fillRect(x - 6, 0, 12, h));
    return k;
  }

  /* long upper-floor ribbon window */
  function ribbonWindow(night = false, w = 2048, h = 260) {
    const k = canvas(w, h), g = k.g;
    const b = g.createLinearGradient(0, 0, 0, h);
    if (night) { b.addColorStop(0, "#ffe2a8"); b.addColorStop(1, "#f0b067"); } else { b.addColorStop(0, "#bcd4e6"); b.addColorStop(1, "#8fa9bd"); }
    g.fillStyle = b; g.fillRect(0, 0, w, h);
    const p = new Pen(g, { width: 2, jitter: 0.8, passes: 1, ink: night ? "#6a4220" : "#45525c" });
    // shelves, a plant, a reading lamp: hints of an upstairs office
    for (let x = 120; x < w; x += 420) {
      p.rect(x, 90, 200, 130, { fill: night ? "#d98a43" : "#7c8f9e", alpha: 0.7 });
      for (let i = 0; i < 6; i++) { g.fillStyle = pick([C.granata, C.po, C.ochre, C.teal]); g.globalAlpha = night ? 0.85 : 0.45; g.fillRect(x + 12 + i * 30, 100 + R(0, 20), 22, 50); g.globalAlpha = 1; }
      p.circle(x + 300, 150, 34, { fill: night ? C.leaf : "#7fa08a", alpha: 0.8 });
    }
    if (!night) { g.save(); g.globalAlpha = 0.35; g.fillStyle = "#fff"; for (let i = 0; i < 6; i++) { const x = R(w); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 60, 0); g.lineTo(x - 40, h); g.lineTo(x - 100, h); g.fill(); } g.restore(); }
    g.fillStyle = "#24282d"; g.fillRect(0, 0, w, 12); g.fillRect(0, h - 12, w, 12);
    for (let x = 0; x <= w; x += w / 8) g.fillRect(x - 5, 0, 10, h);
    return k;
  }

  /* neon sign on a dark plate */
  function neonSign(text, sub) {
    const k = canvas(1400, 300), g = k.g;
    g.fillStyle = "#1c2025"; roundRect(g, 10, 10, 1380, 280, 40); g.fill();
    g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 4; roundRect(g, 26, 26, 1348, 248, 30); g.stroke();
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "800 132px Inter, system-ui, sans-serif";
    for (const [blur, col] of [[48, "#4ff0ff"], [24, "#4ff0ff"], [8, "#c9fbff"]]) { g.shadowColor = col; g.shadowBlur = blur; g.fillStyle = blur > 10 ? "#7ff6ff" : "#f4feff"; g.fillText(text, 700, sub ? 128 : 150); }
    if (sub) { g.shadowBlur = 18; g.shadowColor = "#ffb23f"; g.fillStyle = "#ffd58a"; g.font = "600 46px Inter, system-ui, sans-serif"; g.fillText(sub, 700, 232); }
    return k;
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  /* Turin: hills with the Basilica of Superga, the city and the Mole Antonelliana */
  function turinSkyline(w = 4096, h = 900) {
    const k = canvas(w, h), g = k.g, p = new Pen(g, { width: 2.4, jitter: 1, passes: 1, ink: "#4f5d6c", alpha: 0.6 });
    const hill = (pts, col) => { g.beginPath(); g.moveTo(0, h); pts.forEach(([x, y]) => g.lineTo(x * w, y * h)); g.lineTo(w, h); g.closePath(); g.fillStyle = col; g.fill(); p.stroke(pts.map(([x, y]) => [x * w, y * h]), false); };
    hill([[0, 0.55], [0.12, 0.42], [0.25, 0.5], [0.38, 0.38], [0.52, 0.47], [0.66, 0.34], [0.8, 0.45], [1, 0.4]], "#a9bccd");
    // Superga on the highest hill
    const sx = 0.66 * w, sy = 0.34 * h;
    g.fillStyle = "#e9e3d6"; g.fillRect(sx - 70, sy - 70, 140, 70); p.rect(sx - 70, sy - 70, 140, 70);
    g.beginPath(); g.arc(sx, sy - 70, 46, Math.PI, 0); g.fillStyle = "#d9cfbd"; g.fill(); p.stroke([[sx - 46, sy - 70], [sx - 30, sy - 106], [sx, sy - 118], [sx + 30, sy - 106], [sx + 46, sy - 70]], false);
    p.line(sx, sy - 118, sx, sy - 150); [-95, 95].forEach((d) => { g.fillStyle = "#e9e3d6"; g.fillRect(sx + d - 12, sy - 110, 24, 110); p.rect(sx + d - 12, sy - 110, 24, 110); });
    hill([[0, 0.7], [0.15, 0.6], [0.3, 0.66], [0.45, 0.58], [0.6, 0.64], [0.75, 0.57], [0.9, 0.63], [1, 0.6]], "#9db795");
    // the city: low ochre and terracotta blocks
    for (let x = 0; x < w; x += R(40, 90)) {
      const bh = R(40, 120), bw = R(40, 80);
      g.fillStyle = pick(["#e6c58f", "#dca677", "#e9d6b4", "#d39a6f", "#efe3cf"]); g.fillRect(x, h * 0.78 - bh, bw, bh + h * 0.22);
      for (let wy = h * 0.78 - bh + 12; wy < h * 0.78 - 8; wy += 22) for (let wx = x + 8; wx < x + bw - 10; wx += 16) { g.fillStyle = "rgba(60,70,90,0.35)"; g.fillRect(wx, wy, 6, 9); }
    }
    // Mole Antonelliana
    const mx = 0.3 * w, base = h * 0.78;
    g.fillStyle = "#efe8da";
    g.fillRect(mx - 60, base - 170, 120, 170); p.rect(mx - 60, base - 170, 120, 170);
    for (let i = -50; i <= 50; i += 20) p.line(mx + i, base - 160, mx + i, base - 10, { alpha: 0.4 });
    g.beginPath(); g.moveTo(mx - 64, base - 170); g.quadraticCurveTo(mx - 50, base - 330, mx - 14, base - 380); g.lineTo(mx + 14, base - 380); g.quadraticCurveTo(mx + 50, base - 330, mx + 64, base - 170); g.closePath(); g.fillStyle = "#cfd5d9"; g.fill();
    p.stroke([[mx - 64, base - 170], [mx - 50, base - 300], [mx - 14, base - 380]], false); p.stroke([[mx + 64, base - 170], [mx + 50, base - 300], [mx + 14, base - 380]], false);
    g.fillStyle = "#efe8da"; g.fillRect(mx - 16, base - 450, 32, 72); p.rect(mx - 16, base - 450, 32, 72);
    g.beginPath(); g.moveTo(mx - 14, base - 450); g.lineTo(mx, base - 640); g.lineTo(mx + 14, base - 450); g.closePath(); g.fillStyle = "#d9dee2"; g.fill(); p.stroke([[mx - 14, base - 450], [mx, base - 640], [mx + 14, base - 450]], true);
    p.circle(mx, base - 648, 6, { fill: C.sun });
    return k;
  }

  function lawn(s = 512) {
    const k = canvas(s, s), g = k.g; paper(g, s, s, { base: "#7aa957", grain: 0.05 });
    for (let i = 0; i < 1400; i++) { const x = R(s), y = R(s); g.strokeStyle = pick(["#5f8f45", "#8fbf62", "#6c9c4c", "#a2cc72", "#4f7d3a"]); g.lineWidth = R(1, 2.2); g.globalAlpha = R(0.4, 0.9); g.beginPath(); g.moveTo(x, y); g.lineTo(x + R(-3, 3), y - R(5, 13)); g.stroke(); }
    g.globalAlpha = 1; return k;
  }

  function pavers(w = 512, h = 1024) {
    const k = canvas(w, h), g = k.g; paper(g, w, h, { base: "#6f9a4f", grain: 0.04 });
    const p = new Pen(g, { width: 1.6, jitter: 0.6, passes: 1, ink: "#5d5a54", alpha: 0.7 });
    for (let y = 20; y < h; y += 200) { const c = pick(["#d9d6cf", "#cfccc4", "#e1ded7"]); p.rect(40, y, w - 80, 170, { fill: c }); for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(0,0,0,0.05)"; g.fillRect(R(44, w - 44), R(y, y + 168), 3, 3); } }
    return k;
  }

  /* a fuller, more natural tree: many leaf clusters lit from the top-left */
  function treeNatural(w = 1024, h = 1280) {
    const k = canvas(w, h), g = k.g, p = new Pen(g, { width: 2.4, jitter: 1, passes: 1, ink: "#3c2a1c" });
    // trunk and branches
    const bark = g.createLinearGradient(w * 0.44, 0, w * 0.56, 0); bark.addColorStop(0, "#5b4030"); bark.addColorStop(0.5, "#8a6447"); bark.addColorStop(1, "#4a3426");
    g.fillStyle = bark; g.beginPath(); g.moveTo(w * 0.45, h); g.quadraticCurveTo(w * 0.47, h * 0.7, w * 0.44, h * 0.48); g.lineTo(w * 0.56, h * 0.48); g.quadraticCurveTo(w * 0.53, h * 0.7, w * 0.56, h); g.closePath(); g.fill();
    p.stroke([[w * 0.45, h], [w * 0.47, h * 0.7], [w * 0.44, h * 0.48]], false); p.stroke([[w * 0.56, h], [w * 0.53, h * 0.7], [w * 0.56, h * 0.48]], false);
    [[0.5, 0.55, 0.3, 0.32], [0.5, 0.52, 0.7, 0.3], [0.5, 0.5, 0.52, 0.18]].forEach(([x0, y0, x1, y1]) => { g.strokeStyle = "#6b4c36"; g.lineWidth = 18; g.lineCap = "round"; g.beginPath(); g.moveTo(w * x0, h * y0); g.quadraticCurveTo(w * (x0 + x1) / 2, h * (y0 - 0.05), w * x1, h * y1); g.stroke(); });
    // canopy
    const tones = ["#3f6b35", "#4e7e3c", "#5f8f45", "#74a24f", "#8bb85a", "#a9cf72"];
    for (let i = 0; i < 260; i++) {
      const a = R(TAU), rr = Math.sqrt(Math.random());
      const x = w * 0.5 + Math.cos(a) * rr * w * 0.42, y = h * 0.33 + Math.sin(a) * rr * h * 0.26;
      const light = (1 - (x / w)) * 0.5 + (1 - y / (h * 0.6)) * 0.5; // brighter top-left
      const t = Math.max(0, Math.min(tones.length - 1, Math.round(light * (tones.length - 1) + R(-1, 1))));
      g.fillStyle = tones[t]; g.globalAlpha = 0.92;
      g.beginPath(); g.ellipse(x, y, R(26, 60), R(20, 46), R(TAU), 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 120; i++) { const x = w * 0.5 + R(-0.4, 0.4) * w, y = h * 0.33 + R(-0.24, 0.24) * h; p.curve([[x, y], [x + R(-10, 10), y + R(4, 10)], [x + R(-14, 14), y + R(10, 18)]], false, { width: 1.2, alpha: 0.3, ink: "#2f4f27" }); }
    return k;
  }

  function shrub(tone = "#5f8f45", w = 400, h = 300) {
    const k = canvas(w, h), g = k.g;
    for (let i = 0; i < 90; i++) { const a = R(Math.PI, TAU), rr = Math.sqrt(Math.random()); const x = w / 2 + Math.cos(a) * rr * w * 0.42, y = h * 0.92 + Math.sin(a) * rr * h * 0.8; const light = 1 - x / w * 0.6 - (1 - y / h) * -0.2; g.fillStyle = pick(["#3f6b35", tone, "#7aa957", "#93c06a"]); g.globalAlpha = 0.95; g.beginPath(); g.ellipse(x, y, R(18, 34), R(14, 26), 0, 0, TAU); g.fill(); }
    g.globalAlpha = 1; return k;
  }

  function grasses(w = 400, h = 400) {
    const k = canvas(w, h), g = k.g;
    for (let i = 0; i < 70; i++) { const x0 = w / 2 + R(-40, 40), a = R(-1.1, 1.1), L = R(h * 0.5, h * 0.95); g.strokeStyle = pick(["#9bb36a", "#b7c98a", "#7f9c55", "#d2c98e"]); g.lineWidth = R(2, 4); g.beginPath(); g.moveTo(x0, h); g.quadraticCurveTo(x0 + Math.sin(a) * L * 0.4, h - L * 0.6, x0 + Math.sin(a) * L * 0.9, h - L); g.stroke(); }
    for (let i = 0; i < 18; i++) { g.fillStyle = "rgba(230,214,170,0.8)"; g.beginPath(); g.ellipse(w / 2 + R(-140, 140), R(h * 0.08, h * 0.3), 6, 22, R(-0.6, 0.6), 0, TAU); g.fill(); }
    return k;
  }

  function lavender(w = 400, h = 300) {
    const k = canvas(w, h), g = k.g;
    for (let i = 0; i < 46; i++) { const x0 = w / 2 + R(-120, 120), top = R(h * 0.1, h * 0.45); g.strokeStyle = "#7c9a5e"; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, h); g.lineTo(x0 + R(-12, 12), top); g.stroke(); for (let j = 0; j < 7; j++) { g.fillStyle = pick(["#8b6fc0", "#a688d6", "#7559ad"]); g.beginPath(); g.ellipse(x0 + R(-3, 3), top + j * 7, 5, 6, 0, 0, TAU); g.fill(); } }
    return k;
  }

  /* the front of a modern mailbox (drawn on a box face) */
  function mailboxFront() {
    const k = canvas(256, 320), g = k.g, p = new Pen(g, { width: 2, jitter: 0.5, passes: 1, ink: "#111" });
    g.fillStyle = "#2f3439"; g.fillRect(0, 0, 256, 320);
    g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(0, 0, 256, 18);
    p.rrect(40, 70, 176, 22, 8, { fill: "#16191c" });
    g.fillStyle = C.ochre; g.font = "700 64px Inter, sans-serif"; g.textAlign = "center"; g.fillText("07", 128, 200);
    g.fillStyle = "#c9cdd2"; g.font = "600 22px Inter, sans-serif"; g.fillText("say hello", 128, 268);
    return k;
  }

  function solarPanel() {
    const k = canvas(512, 320), g = k.g;
    g.fillStyle = "#c9cfd6"; g.fillRect(0, 0, 512, 320);
    g.fillStyle = "#1f3554"; g.fillRect(10, 10, 492, 300);
    g.strokeStyle = "#4b6b94"; g.lineWidth = 2;
    for (let x = 10; x <= 502; x += 492 / 8) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x, 310); g.stroke(); }
    for (let y = 10; y <= 310; y += 75) { g.beginPath(); g.moveTo(10, y); g.lineTo(502, y); g.stroke(); }
    const gr = g.createLinearGradient(0, 0, 512, 320); gr.addColorStop(0, "rgba(255,255,255,0.25)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(10, 10, 492, 300);
    return k;
  }

  function evCharger() {
    const k = canvas(200, 360), g = k.g, p = new Pen(g, { width: 2, jitter: 0.5, passes: 1 });
    p.rrect(30, 20, 140, 200, 24, { fill: "#eef1f3" });
    g.fillStyle = "#3ccf8e"; g.fillRect(70, 60, 60, 8);
    p.circle(100, 150, 26, { fill: "#2a2f35" });
    p.curve([[100, 176], [80, 260], [130, 300], [90, 350]], false, { width: 7, ink: "#2a2f35" });
    return k;
  }

  /* sky bits */
  function moon() {
    const k = canvas(512, 512), g = k.g;
    const glow = g.createRadialGradient(256, 256, 60, 256, 256, 250); glow.addColorStop(0, "rgba(255,248,220,0.6)"); glow.addColorStop(1, "rgba(255,248,220,0)");
    g.fillStyle = glow; g.fillRect(0, 0, 512, 512);
    const body = g.createRadialGradient(220, 220, 20, 256, 256, 120); body.addColorStop(0, "#fffbea"); body.addColorStop(1, "#e9dfb8");
    g.fillStyle = body; g.beginPath(); g.arc(256, 256, 118, 0, TAU); g.fill();
    [[220, 230, 22], [292, 210, 14], [280, 300, 26], [210, 300, 12]].forEach(([x, y, r]) => { g.fillStyle = "rgba(180,170,130,0.35)"; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
    return k;
  }
  function stars(w = 2048, h = 1024) {
    const k = canvas(w, h), g = k.g;
    for (let i = 0; i < 700; i++) { const x = R(w), y = R(h), r = Math.random() < 0.06 ? R(1.6, 2.8) : R(0.5, 1.4); g.fillStyle = `rgba(255,255,${Math.random() < 0.3 ? 220 : 255},${R(0.5, 1)})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    return k;
  }
  /* a gull in two poses so it can flap */
  function birdPose(up) {
    const k = canvas(256, 128), g = k.g;
    g.strokeStyle = "#2b2f36"; g.lineWidth = 7; g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath();
    if (up) { g.moveTo(20, 30); g.quadraticCurveTo(80, 40, 128, 78); g.quadraticCurveTo(176, 40, 236, 30); }
    else { g.moveTo(24, 96); g.quadraticCurveTo(80, 70, 128, 72); g.quadraticCurveTo(176, 70, 232, 96); }
    g.stroke(); g.fillStyle = "#2b2f36"; g.beginPath(); g.ellipse(128, 76, 12, 7, 0, 0, TAU); g.fill();
    return k;
  }
  /* a soft round glow for lamps */
  function glow(color = "255,214,140", s = 256) {
    const k = canvas(s, s), g = k.g, gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, `rgba(${color},0.95)`); gr.addColorStop(0.25, `rgba(${color},0.45)`); gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, s, s); return k;
  }
  /* brushed brass / metal vertical gradient for lamp shades */
  function metal(top = "#e6c66e", bottom = "#8a6420") {
    const k = canvas(64, 256), g = k.g, gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.5, bottom); gr.addColorStop(1, top);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    for (let x = 0; x < 64; x += 4) { g.fillStyle = `rgba(255,255,255,${R(0, 0.12)})`; g.fillRect(x, 0, 2, 256); }
    return k;
  }

  Object.assign(window.ART, {
    cladding, woodSlats, glassWall, ribbonWindow, neonSign, turinSkyline, lawn, pavers, treeNatural, shrub, grasses, lavender,
    mailboxFront, solarPanel, evCharger, moon, stars, birdPose, glow, metal,
  });
})();

/* ---------- the classic brick house, rebuilt from parts ---------- */
(() => {
  const { R, TAU, canvas, paper, Pen, PAL: C } = SK;
  const pick = (a) => a[(Math.random() * a.length) | 0];

  /* terracotta roof tiles in overlapping rows */
  function roofTiles(w = 1024, h = 512) {
    const k = canvas(w, h), g = k.g; g.fillStyle = "#8f4a2c"; g.fillRect(0, 0, w, h);
    const p = new Pen(g, { width: 1.6, jitter: 0.5, passes: 1, ink: "#4a2414", alpha: 0.7 });
    for (let y = 0, r = 0; y < h + 40; y += 40, r++) for (let x = (r % 2) * 32 - 32; x < w + 64; x += 64) {
      const gr = g.createLinearGradient(0, y, 0, y + 44); const base = pick(["#c4673f", "#b85c37", "#cf7347", "#b0532f"]);
      gr.addColorStop(0, base); gr.addColorStop(1, "#7d3a20"); g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 62, y); g.quadraticCurveTo(x + 64, y + 30, x + 31, y + 44); g.quadraticCurveTo(x - 2, y + 30, x, y); g.fill();
      p.stroke([[x, y], [x + 1, y + 28], [x + 31, y + 44], [x + 62, y + 28], [x + 62, y]], false);
    }
    return k;
  }

  /* pale limestone for sills, quoins and the door surround */
  function stone(w = 256, h = 256) {
    const k = canvas(w, h), g = k.g; paper(g, w, h, { base: "#e6dccb", grain: 0.09, smudges: 3 });
    const p = new Pen(g, { width: 1.4, jitter: 0.6, passes: 1, ink: "#8c7f6a", alpha: 0.5 });
    for (let i = 0; i < 6; i++) { const x = R(w), y = R(h); p.line(x, y, x + R(-30, 30), y + R(10, 40), { alpha: 0.2 }); }
    return k;
  }

  /* green louvred shutter */
  function shutter(w = 256, h = 640) {
    const k = canvas(w, h), g = k.g, p = new Pen(g, { width: 2, jitter: 0.6, passes: 1, ink: "#16302a" });
    g.fillStyle = C.tram; g.fillRect(0, 0, w, h);
    p.rect(8, 8, w - 16, h - 16, { alpha: 0.6 });
    for (let y = 30; y < h - 20; y += 22) { g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(22, y, w - 44, 6); g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(22, y + 7, w - 44, 4); }
    return k;
  }

  /* what you see through the window glass (the frame itself is 3D) */
  function windowGlass(night = false) {
    const k = canvas(512, 512), g = k.g, p = new Pen(g, { width: 2, jitter: 0.8, passes: 1 });
    const b = g.createLinearGradient(0, 0, 0, 512);
    if (night) { b.addColorStop(0, "#ffd99a"); b.addColorStop(1, "#f0a65c"); } else { b.addColorStop(0, "#cfe3f1"); b.addColorStop(1, "#9fbfd6"); }
    g.fillStyle = b; g.fillRect(0, 0, 512, 512);
    // a glimpse of the room: shelf, lamp, plant
    g.globalAlpha = night ? 0.85 : 0.35;
    g.fillStyle = "#8a5a34"; g.fillRect(40, 300, 170, 12); g.fillRect(40, 380, 170, 12);
    for (let i = 0; i < 7; i++) { g.fillStyle = pick([C.granata, C.po, C.ochre, C.teal]); g.fillRect(48 + i * 22, 250, 16, 50); }
    g.fillStyle = C.leafDark; g.beginPath(); g.arc(120, 360, 22, 0, TAU); g.fill();
    g.globalAlpha = 1;
    // the coral curtain gathered on the right
    p.stroke([[300, 0], [512, 0], [512, 512], [380, 512], [350, 300]], true, { fill: C.coralSoft, alpha: 0.9 });
    for (let i = 0; i < 5; i++) p.curve([[318 + i * 34, 4], [334 + i * 32, 240], [350 + i * 30, 508]], false, { alpha: 0.25, width: 1.4 });
    if (!night) { g.save(); g.globalAlpha = 0.5; g.fillStyle = "#fff"; [[60, 40], [150, 24]].forEach(([x, ww]) => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + ww, 0); g.lineTo(x + ww - 160, 512); g.lineTo(x - 160, 512); g.fill(); }); g.restore(); }
    return k;
  }

  /* just the yellow board of the hanging sign */
  function signFace(text) {
    const k = canvas(1024, 360), p = new Pen(k.g, { width: 3, jitter: 1 });
    p.stroke([[12, 14], [1010, 8], [1014, 346], [8, 352]], true, { fill: C.sun });
    p.stroke([[40, 40], [984, 34], [990, 320], [34, 326]], true, { alpha: 0.5, width: 1.6 });
    for (let i = 0; i < 8; i++) p.curve([[50, 60 + i * 32], [512 + R(-80, 80), 64 + i * 32], [980, 58 + i * 32]], false, { alpha: 0.1, width: 1 });
    p.text(text, 512, 186, { size: 150, outline: 10, outlineColor: "#2b2b2b", color: "#fffaf0", maxWidth: 880 });
    p.text(text, 512, 186, { size: 150, color: "#2b2b2b", maxWidth: 880, alpha: 0.85 });
    return k;
  }

  /* the flowers that sit in the window box (the box itself is 3D) */
  function flowers(w = 768, h = 260) {
    const k = canvas(w, h), p = new Pen(k.g, { width: 2, jitter: 1 });
    const blooms = [C.coral, C.sun, C.lilac, C.coralSoft, C.peach, "#ffffff"];
    for (let i = 0; i < 26; i++) { const x = R(30, w - 30), y = R(h * 0.35, h * 0.95); p.curve([[x, h], [x + R(-10, 10), (h + y) / 2], [x + R(-6, 6), y]], false, { width: 3, ink: C.leafDark, passes: 1 }); p.ellipse(x + R(-14, 14), y + R(0, 20), 16, 9, { fill: pick(["#6b985a", "#7fb06a", "#5f8f45"]), passes: 1, width: 1 }); }
    for (let i = 0; i < 18; i++) { const x = R(40, w - 40), y = R(h * 0.2, h * 0.6), c = pick(blooms); for (let q = 0; q < 6; q++) { const a = (q / 6) * TAU; p.ellipse(x + Math.cos(a) * 13, y + Math.sin(a) * 11, 11, 14, { fill: c, passes: 1, width: 1 }); } p.circle(x, y, 7, { fill: C.sunDeep, passes: 1, width: 1 }); }
    return k;
  }

  Object.assign(window.ART, { roofTiles, stone, shutter, windowGlass, signFace, flowers });
})();

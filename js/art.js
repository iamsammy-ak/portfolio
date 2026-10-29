/* art.js — procedural pencil-sketch artwork. Each function returns a canvas
   object {c,g,w,h} from SK.canvas, ready to become a texture. */
window.ART = (() => {
  const { R, TAU, canvas, paper, Pen, PAL: C } = SK;
  const G = (a) => `rgba(40,40,40,${a})`;
  const W = (a) => `rgba(120,80,40,${a})`; // warm wood shadow
  const LIGHT = "#ece8df", MID = "#dcd8cf", PAPER = "#f7f6f2";
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  /* ---------- surfaces ---------- */
  function paperTex(s = 512) { const k = canvas(s, s); paper(k.g, s, s, { base: C.paper, grain: 0.07 }); return k; }

  /* the pavement outside: warm paper with pebbles and grass tufts */
  function ground(s = 512) {
    const k = canvas(s, s); paper(k.g, s, s, { base: "#efe9dc", grain: 0.06 });
    const p = new Pen(k.g, { width: 1.2, jitter: 0.8, passes: 1 });
    for (let i = 0; i < 26; i++) p.ellipse(R(s), R(s), R(3, 7), R(2, 5), { fill: G(0.06), alpha: 0.35 });
    for (let i = 0; i < 40; i++) { const x = R(s), y = R(s); for (let b = 0; b < 3; b++) p.line(x + b * 4, y, x + b * 4 + R(-4, 4), y - R(6, 14), { ink: C.leafDark, alpha: 0.45 }); }
    return k;
  }

  function bricks(w = 2048, h = 1024) {
    const k = canvas(w, h); paper(k.g, w, h, { base: C.cream, grain: 0.05, smudges: 10 });
    const p = new Pen(k.g, { width: 1.5, jitter: 0.9, passes: 1, alpha: 0.75 });
    const bh = 52, bw = 128, gap = 7;
    for (let y = 0, row = 0; y < h + bh; y += bh, row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let x = -bw; x < w + bw; x += bw) {
        const bx = x + off + gap / 2 + R(-2, 2), by = y + gap / 2 + R(-1, 1), bwid = bw - gap + R(-6, 2), bhei = bh - gap + R(-3, 1);
        // mostly pencil bricks, every third one gets a terracotta wash
        const fill = Math.random() < 0.34 ? `rgba(205,140,110,${R(0.12, 0.3)})` : G(R(0.02, 0.08));
        p.rect(bx, by, bwid, bhei, { fill });
        if (Math.random() < 0.18) p.hatch([[bx, by], [bx + bwid, by], [bx + bwid, by + bhei], [bx, by + bhei]], R(5, 9), R(-0.9, -0.5), 0.12);
      }
    }
    return k;
  }

  function planks(w = 1024, h = 2048, n = 8) {
    const k = canvas(w, h); paper(k.g, w, h, { base: C.woodFloor, grain: 0.05 });
    const p = new Pen(k.g, { width: 1.4, jitter: 0.7, passes: 1, alpha: 0.7, ink: "#6b4a2b" });
    const pw = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * pw;
      p.rect(x, 0, pw, h, { fill: W(R(0.02, 0.1)), alpha: 0 });
      p.line(x, 0, x, h, { width: 2.2, alpha: 0.7 });
      let y = R(-300, 0);
      while (y < h) { y += R(420, 900); if (y < h) p.line(x + 3, y, x + pw - 3, y, { width: 2.4, alpha: 0.75 }); }
      const gn = R(5, 9) | 0;
      for (let g = 0; g < gn; g++) {
        const gx = x + R(8, pw - 8), f = R(150, 420), ph = R(6), amp = R(3, 12), pts = [];
        for (let yy = 0; yy <= h; yy += 100) pts.push([gx + Math.sin(yy / f + ph) * amp, yy]);
        p.curve(pts, false, { width: R(0.6, 1.2), alpha: R(0.18, 0.4), passes: 1 });
      }
      if (Math.random() < 0.6) { const kx = x + R(16, pw - 16), ky = R(h); p.ellipse(kx, ky, R(5, 9), R(10, 22), { alpha: 0.5, fill: W(0.15) }); p.ellipse(kx, ky, R(2, 4), R(5, 9), { alpha: 0.4 }); }
    }
    return k;
  }

  function parquet(s = 1024) {
    const k = canvas(s, s); paper(k.g, s, s, { base: "#eadcc3", grain: 0.05 });
    const p = new Pen(k.g, { width: 1.3, jitter: 0.7, passes: 1, alpha: 0.55, ink: "#6b4a2b" });
    const g = k.g, L = 128, Wd = 42;
    g.save(); g.translate(s / 2, s / 2); g.rotate(Math.PI / 4);
    for (let i = -8; i < 8; i++) for (let j = -8; j < 8; j++) {
      const x = i * L, y = j * L;
      if ((i + j) % 2) { for (let q = 0; q < 3; q++) p.rect(x, y + q * Wd, L, Wd, { fill: W(R(0.03, 0.12)) }); }
      else { for (let q = 0; q < 3; q++) p.rect(x + q * Wd, y, Wd, L, { fill: W(R(0.03, 0.12)) }); }
    }
    g.restore();
    return k;
  }

  function ceiling(s = 1024) {
    const k = canvas(s, s); paper(k.g, s, s, { grain: 0.04, smudges: 10 });
    const p = new Pen(k.g, { width: 1, jitter: 1.5, passes: 1 });
    for (let i = 0; i < 16; i++) {
      const pts = []; let x = R(s), y = R(s); const n = (R(3, 7)) | 0;
      for (let j = 0; j < n; j++) { pts.push([x, y]); x += R(-180, 180); y += R(-180, 180); }
      p.stroke(pts, false, { width: R(0.6, 1.4), alpha: R(0.18, 0.4) });
    }
    for (let x = 0; x <= s; x += s / 2) p.line(x, 0, x, s, { alpha: 0.15 });
    for (let y = 0; y <= s; y += s / 2) p.line(0, y, s, y, { alpha: 0.15 });
    return k;
  }

  /* corridor wall: warm cream, wainscot on the lower third, wooden skirting at the floor.
     The texture is laid once vertically, so y=s is floor level. */
  function wall(s = 1024, plain = false) {
    const k = canvas(s, s); paper(k.g, s, s, { base: C.cream, grain: 0.045, smudges: 4 });
    if (plain) return k;
    const p = new Pen(k.g, { width: 2, jitter: 1, passes: 1 });
    p.rect(-4, s * 0.64, s + 8, s * 0.36, { fill: "#efe3cf", alpha: 0.5 });
    for (let x = 0; x < s; x += s / 4) p.rect(x + 18, s * 0.69, s / 4 - 36, s * 0.24, { alpha: 0.35, width: 1.6 });
    p.line(-4, s * 0.64, s + 4, s * 0.64, { width: 3, alpha: 0.6 });
    p.rect(-4, s * 0.955, s + 8, s * 0.05, { fill: C.wood, alpha: 0.8 });
    p.line(-4, s * 0.955, s + 4, s * 0.955, { width: 2.4, alpha: 0.7 });
    return k;
  }

  function water(s = 1024) {
    const k = canvas(s, s); paper(k.g, s, s, { base: C.water, grain: 0.03 });
    const p = new Pen(k.g, { width: 1.2, jitter: 0.5, passes: 1 });
    for (let i = 0; i < 520; i++) {
      const x = R(s), y = R(s), len = R(40, 170), amp = R(4, 14), pts = [];
      for (let t = 0; t <= 1.001; t += 0.125) pts.push([x + t * len, y + Math.sin(t * Math.PI * R(1, 2)) * amp]);
      const white = Math.random() < 0.45;
      p.curve(pts, false, { width: R(0.8, 1.8), alpha: white ? R(0.5, 0.9) : R(0.2, 0.45), ink: white ? "#ffffff" : C.blue });
      if (Math.random() < 0.3) { const sp = [], cx = x + len, cy = y; for (let a = 0; a < Math.PI * 2.5; a += 0.4) sp.push([cx + Math.cos(a) * a * 2.2, cy - Math.sin(a) * a * 1.6]); p.curve(sp, false, { alpha: 0.35, width: 1, ink: C.blue }); }
    }
    return k;
  }

  /* ---------- entrance pieces ---------- */
  function tree() {
    const k = canvas(1024, 1024), p = new Pen(k.g, { width: 2.2, jitter: 1.2 });
    const puffs = [[520, 300, 230, 150], [330, 380, 180, 130], [700, 400, 190, 130], [420, 200, 170, 110], [620, 220, 160, 100], [530, 440, 220, 120]];
    const greens = ["#b4d49a", "#a7cb8c", "#c1dba8", "#9fc487"];
    p.stroke([[470, 1010], [478, 760], [492, 640], [500, 560], [540, 560], [552, 650], [562, 760], [572, 1010]], false, { fill: "#cfae86", width: 2.4 });
    [[495, 600, 380, 440], [520, 580, 520, 300], [545, 600, 680, 420], [500, 650, 300, 560], [550, 640, 740, 520]].forEach(([x1, y1, x2, y2]) => p.curve([[x1, y1], [(x1 + x2) / 2 + R(-30, 30), (y1 + y2) / 2], [x2, y2]], false, { width: 2.4 }));
    for (let i = 0; i < 18; i++) p.line(480 + R(0, 80), R(640, 990), 480 + R(0, 80), R(640, 990), { alpha: 0.3, width: 1, ink: "#6b4a2b" });
    puffs.forEach(([x, y, rx, ry], i) => p.puff(x, y, rx, ry, 9, { fill: greens[i % greens.length], passes: 1 }));
    puffs.forEach(([x, y, rx, ry]) => { p.puff(x, y, rx, ry, 9, { passes: 1, alpha: 0.6 }); p.hatch([[x - rx, y - ry], [x + rx, y - ry], [x + rx, y + ry], [x - rx, y + ry]].map(([a, b]) => [a, b]), 16, -0.7, 0.05); });
    // a few darker leaf strokes for depth
    for (let i = 0; i < 40; i++) { const [x, y, rx, ry] = puffs[i % puffs.length]; p.curve([[x + R(-rx, rx) * 0.8, y + R(-ry, ry) * 0.8], [x + R(-rx, rx) * 0.8, y + R(-ry, ry) * 0.8]], false, { ink: C.leafDark, alpha: 0.35, width: 1.4, passes: 1 }); }
    return k;
  }

  function cat() {
    const k = canvas(256, 400), p = new Pen(k.g, { width: 2, jitter: 0.9 });
    const FUR = "#f1c48e", STRIPE = "#c98a4e";
    p.curve([[200, 330], [240, 300], [245, 230], [225, 200]], false, { width: 3 });
    p.ellipse(128, 290, 70, 100, { fill: FUR });
    for (let i = 0; i < 4; i++) p.curve([[90, 230 + i * 30], [128, 236 + i * 30], [166, 230 + i * 30]], false, { ink: STRIPE, alpha: 0.6, width: 3, passes: 1 });
    p.circle(128, 150, 58, { fill: FUR });
    p.stroke([[80, 115], [70, 50], [120, 100]], true, { fill: FUR });
    p.stroke([[176, 115], [186, 50], [136, 100]], true, { fill: FUR });
    [[104, 104], [128, 98], [152, 104]].forEach(([x, y]) => p.line(x, y, x, y + 22, { ink: STRIPE, alpha: 0.6, width: 3, passes: 1 }));
    p.ellipse(104, 150, 7, 9, { fill: "#2d4a2a", passes: 1 }); p.ellipse(152, 150, 7, 9, { fill: "#2d4a2a", passes: 1 });
    p.stroke([[122, 172], [134, 172], [128, 180]], true, { fill: C.coralSoft, passes: 1 });
    [[60, 165, 110, 178], [60, 185, 110, 184], [196, 165, 146, 178], [196, 185, 146, 184]].forEach(([a, b, c, d]) => p.line(a, b, c, d, { width: 1, passes: 1 }));
    p.ellipse(100, 380, 26, 12, { fill: FUR }); p.ellipse(156, 380, 26, 12, { fill: FUR });
    return k;
  }

  function mouse() {
    const k = canvas(160, 420), p = new Pen(k.g, { width: 2, jitter: 0.8 });
    p.curve([[80, 0], [86, 90], [74, 180], [80, 250]], false, { width: 1.6 });
    p.ellipse(80, 330, 46, 72, { fill: PAPER });
    p.line(80, 262, 80, 330, { width: 1.4 }); p.line(36, 320, 124, 320, { width: 1.4 });
    p.rrect(72, 290, 16, 26, 6, { fill: LIGHT });
    return k;
  }

  function bug() {
    const k = canvas(128, 128), p = new Pen(k.g, { width: 1.6, jitter: 0.6 });
    // a ladybird
    p.ellipse(64, 70, 28, 36, { fill: C.coral }); p.circle(64, 30, 14, { fill: "#2b2b2b" });
    p.line(64, 40, 64, 104, { passes: 1 });
    [[50, 60], [78, 62], [54, 86], [76, 88]].forEach(([x, y]) => p.circle(x, y, 4, { fill: "#2b2b2b", passes: 1, width: 1 }));
    for (let i = 0; i < 3; i++) { p.line(40, 55 + i * 16, 8, 45 + i * 18, { passes: 1 }); p.line(88, 55 + i * 16, 120, 45 + i * 18, { passes: 1 }); }
    p.line(56, 20, 44, 4, { passes: 1 }); p.line(72, 20, 84, 4, { passes: 1 });
    return k;
  }

  function windowSketch() {
    const k = canvas(512, 512), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    p.rect(40, 40, 432, 400, { fill: "#f4efe5" });
    p.rect(70, 70, 372, 340, { fill: "#d6e8f4", hatch: { spacing: 14, angle: -0.8, alpha: 0.06 } });
    // reflection streaks
    [[110, 380, 300, 90], [160, 400, 360, 110]].forEach(([a, b, c, d]) => p.line(a, b, c, d, { ink: "#ffffff", width: 8, alpha: 0.55, passes: 1 }));
    // curtain on the right pane
    p.stroke([[300, 72], [440, 72], [440, 408], [340, 408], [320, 300]], true, { fill: C.coralSoft, alpha: 0.8 });
    for (let i = 0; i < 5; i++) p.curve([[318 + i * 26, 76], [330 + i * 26, 240], [338 + i * 20, 404]], false, { alpha: 0.25, width: 1.2 });
    p.line(256, 70, 256, 410, { width: 3 }); p.line(70, 240, 442, 240, { width: 3 });
    p.rect(20, 440, 472, 36, { fill: C.wood });
    return k;
  }

  function planter() {
    const k = canvas(768, 300), p = new Pen(k.g, { width: 2.2, jitter: 1 });
    p.stroke([[20, 190], [748, 190], [720, 290], [48, 290]], true, { fill: C.wood });
    for (let i = 0; i < 6; i++) p.curve([[40, 205 + i * 14], [380 + R(-60, 60), 208 + i * 14], [730, 204 + i * 14]], false, { alpha: 0.18, width: 1, ink: C.woodDark });
    p.line(20, 212, 748, 212, { alpha: 0.5 });
    const blooms = [C.coral, C.sun, C.lilac, C.coralSoft, C.peach];
    for (let i = 0; i < 9; i++) {
      const x = 70 + i * 80, h = R(60, 130);
      if (i % 3 === 0) { p.rrect(x - 18, 190 - h, 36, h, 16, { fill: C.leaf }); p.rrect(x - 40, 200 - h * 0.5, 22, h * 0.35, 10, { fill: C.leaf }); }
      else if (i % 3 === 1) { p.line(x, 190, x, 176, { width: 2 }); for (let q = 0; q < 6; q++) { const a = (q / 6) * TAU; p.ellipse(x + Math.cos(a) * 18, 150 + Math.sin(a) * 14, 14, 20, { fill: blooms[i % blooms.length], passes: 1 }); } p.circle(x, 150, 9, { fill: C.sunDeep, passes: 1 }); }
      else { p.puff(x, 150, 30, 28, 6, { fill: C.leaf }); for (let q = 0; q < 3; q++) p.circle(x + R(-18, 18), 150 + R(-14, 14), 6, { fill: blooms[(i + q) % blooms.length], passes: 1, width: 1 }); }
    }
    return k;
  }

  function stonePath() {
    const k = canvas(512, 1024), p = new Pen(k.g, { width: 2, jitter: 1 });
    for (let y = 60; y < 1000; y += 95) {
      const t = y / 1024, half = 90 + t * 160;
      for (let x = 256 - half; x < 256 + half; x += R(70, 110)) {
        const cx = x + 40, cy = y + R(-10, 10), pts = [], n = 7;
        for (let i = 0; i < n; i++) { const a = (i / n) * TAU; pts.push([cx + Math.cos(a) * R(28, 48), cy + Math.sin(a) * R(22, 38)]); }
        p.stroke(pts, true, { fill: pick(["#e6ddd0", "#ddd3c4", "#e9e1d4", "#d9d2c8"]) });
      }
      for (let g = 0; g < 10; g++) { const gx = 256 + (Math.random() < 0.5 ? -1 : 1) * (half + R(0, 40)), gy = y + R(-30, 30); p.stroke([[gx, gy + 10], [gx + R(-6, 6), gy - 14]], false, { passes: 1, width: 1.4, ink: C.leafDark, alpha: 0.6 }); }
    }
    return k;
  }

  /* roof tiles strip along the top of the façade */
  function roof(w = 2048, h = 160) {
    const k = canvas(w, h), p = new Pen(k.g, { width: 2, jitter: 0.9, passes: 1 });
    p.rect(-4, 40, w + 8, h - 40, { fill: C.terracotta });
    for (let row = 0; row < 3; row++) for (let x = -40 + (row % 2) * 40; x < w + 40; x += 80) p.curve([[x, 60 + row * 36], [x + 40, 46 + row * 36], [x + 80, 60 + row * 36]], false, { width: 1.8, alpha: 0.6, ink: "#8a4a2a" });
    p.rect(-4, 24, w + 8, 22, { fill: C.wood }); p.line(-4, 24, w + 4, 24, { width: 3 });
    return k;
  }

  function sun() {
    const k = canvas(256, 256), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; p.line(128 + Math.cos(a) * 78, 128 + Math.sin(a) * 78, 128 + Math.cos(a) * R(96, 118), 128 + Math.sin(a) * R(96, 118), { ink: C.sunDeep, alpha: 0.8, passes: 1, width: 2.6 }); }
    p.circle(128, 128, 66, { fill: C.sun }); p.circle(128, 128, 54, { alpha: 0.4, ink: "#ffffff", width: 4, passes: 1 });
    return k;
  }

  function bird() {
    const k = canvas(128, 64), p = new Pen(k.g, { width: 2.2, jitter: 0.8 });
    p.curve([[10, 40], [34, 18], [60, 36], [86, 18], [112, 40]], false, { passes: 1, alpha: 0.75 });
    return k;
  }

  /* string of pennant flags */
  function bunting(w = 2048, h = 200) {
    const k = canvas(w, h), p = new Pen(k.g, { width: 2.2, jitter: 1 });
    const cols = [C.coral, C.sun, C.sky, C.leaf, C.lilac, C.peach, C.mint];
    const sag = (x) => 30 + Math.sin((x / w) * Math.PI) * 60;
    const pts = []; for (let x = 0; x <= w; x += 64) pts.push([x, sag(x)]);
    p.curve(pts, false, { width: 2.4 });
    for (let x = 40, i = 0; x < w - 40; x += 92, i++) { const y = sag(x); p.stroke([[x, y], [x + 70, sag(x + 70)], [x + 35, y + 96]], true, { fill: cols[i % cols.length] }); }
    return k;
  }

  function lampPost() {
    const k = canvas(256, 1024), p = new Pen(k.g, { width: 2.6, jitter: 1 });
    const g = k.g, gr = g.createRadialGradient(128, 150, 10, 128, 150, 150); gr.addColorStop(0, "rgba(255,236,170,0.9)"); gr.addColorStop(1, "rgba(255,236,170,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
    p.stroke([[100, 990], [156, 990], [146, 940], [110, 940]], true, { fill: "#4a4a48" });
    p.rect(118, 220, 20, 720, { fill: "#5c5c5a" });
    p.stroke([[88, 220], [168, 220], [152, 110], [104, 110]], true, { fill: "#fff1b0" });
    p.stroke([[80, 110], [176, 110], [128, 70]], true, { fill: "#4a4a48" });
    p.line(128, 70, 128, 50, { width: 4 }); p.circle(128, 44, 7, { fill: "#4a4a48", passes: 1 });
    for (let i = 0; i < 6; i++) p.line(122, 260 + i * 100, 134, 300 + i * 100, { passes: 1, alpha: 0.3, ink: "#ffffff", width: 2 });
    return k;
  }

  function mailbox() {
    const k = canvas(256, 512), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    p.rect(118, 260, 20, 240, { fill: C.wood });
    p.rrect(40, 150, 176, 120, 36, { fill: C.blue });
    p.rect(40, 210, 176, 60, { fill: C.blue, passes: 0 }); p.rect(40, 210, 176, 60, { alpha: 0 });
    p.rrect(66, 182, 124, 30, 14, { fill: "#2b2b2b", passes: 1 });
    p.line(40, 270, 216, 270, { width: 2.4 });
    p.rect(206, 120, 12, 70, { fill: C.coral }); p.stroke([[218, 120], [252, 132], [218, 150]], true, { fill: C.coral });
    p.text("✉", 128, 240, { size: 30, color: "#ffffff", alpha: 0.9 });
    return k;
  }

  function sticker(p, x, y, w, h, text, color, rot) {
    p.g.save(); p.g.translate(x, y); p.g.rotate(rot);
    p.rrect(-w / 2, -h / 2, w, h, 10, { fill: color, passes: 1, width: 1.6 });
    p.text(text, 0, 1, { size: h * 0.46, font: "sans", weight: 800, color: "#2b2b2b", maxWidth: w - 14 });
    p.g.restore();
  }

  /* one leaf of the entrance door. wood=true draws the warm wooden back */
  function entranceLeaf(stickers, hingeLeft, wood = false) {
    const k = canvas(320, 960), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    if (wood) {
      p.rect(8, 8, 304, 944, { fill: "#c99a62" });
      for (let i = 0; i < 14; i++) p.curve([[20 + i * 21, 10], [24 + i * 21 + R(-8, 8), 480], [20 + i * 21, 950]], false, { width: R(0.8, 1.6), alpha: R(0.2, 0.45), ink: "#7a4f26", passes: 1 });
      p.rect(34, 40, 252, 600, { fill: "#b8864f" }); p.rect(34, 680, 252, 240, { fill: "#b8864f" });
      p.rect(56, 62, 208, 556, { alpha: 0.5, ink: "#7a4f26" }); p.rect(56, 702, 208, 196, { alpha: 0.5, ink: "#7a4f26" });
    } else {
      p.rect(8, 8, 304, 944, { fill: "#f3efe6" });
      p.rect(34, 40, 252, 600, { fill: "#e6f0f7", hatch: { spacing: 18, angle: -0.8, alpha: 0.05 } });
      p.line(60, 560, 230, 90, { ink: "#ffffff", width: 10, alpha: 0.5, passes: 1 });
      p.rect(34, 680, 252, 240, { fill: "#e9e2d5" });
      p.rect(60, 706, 200, 190, { alpha: 0.6 });
    }
    const hx = hingeLeft ? 262 : 58;
    p.rrect(hx - 8, 470, 16, 60, 6, { fill: wood ? "#e8c66a" : "#dcbd6a" }); p.line(hx, 470, hx, 530, { width: 3 });
    stickers.forEach((s, i) => sticker(p, 90 + (i % 2) * 140 + R(-10, 10), 110 + Math.floor(i / 2) * 130 + R(-10, 10), 112, 52, s.text, s.color, R(-0.2, 0.2)));
    return k;
  }

  function hangingSign(text) {
    const k = canvas(768, 560), p = new Pen(k.g, { width: 2.6, jitter: 1.2 });
    p.stroke([[120, 30], [660, 24], [668, 84], [112, 90]], true, { fill: C.wood });
    for (let i = 0; i < 5; i++) p.curve([[140, 40 + i * 10], [400 + R(-40, 40), 44 + i * 10], [640, 40 + i * 10]], false, { alpha: 0.3, width: 1, ink: C.woodDark });
    [200, 570].forEach((x) => { for (let y = 90; y < 250; y += 22) p.ellipse(x, y + 11, 6, 11, { passes: 1, width: 1.6 }); });
    p.stroke([[80, 250], [690, 244], [700, 440], [72, 448]], true, { fill: C.sun });
    p.stroke([[100, 270], [670, 264], [680, 420], [92, 428]], true, { alpha: 0.5, width: 1.4 });
    for (let i = 0; i < 6; i++) p.curve([[110, 285 + i * 24], [380 + R(-60, 60), 288 + i * 24], [660, 282 + i * 24]], false, { alpha: 0.12, width: 1 });
    p.text(text, 384, 350, { size: 96, outline: 7, outlineColor: "#2b2b2b", color: "#fffaf0", maxWidth: 560 });
    p.text(text, 384, 350, { size: 96, color: "#2b2b2b", maxWidth: 560, alpha: 0.85 });
    return k;
  }

  /* ---------- corridor pieces ---------- */
  function signBoard(text, sub) {
    const k = canvas(512, 260), p = new Pen(k.g, { width: 2.4, jitter: 1.2 });
    p.stroke([[20, 30], [492, 22], [500, 230], [14, 238]], true, { fill: "#e9d2a9" });
    p.stroke([[36, 46], [478, 40], [484, 214], [30, 222]], true, { alpha: 0.45, width: 1.4 });
    for (let i = 0; i < 5; i++) p.curve([[44, 60 + i * 32], [260 + R(-50, 50), 62 + i * 32], [470, 58 + i * 32]], false, { alpha: 0.2, width: 1, ink: C.woodDark });
    [[48, 50], [462, 46], [50, 212], [464, 206]].forEach(([x, y]) => p.circle(x, y, 5, { fill: "#8a8a86", passes: 1 }));
    const words = text.split(" ");
    if (words.length > 1 && text.length > 9) {
      const a = words.slice(0, Math.ceil(words.length / 2)).join(" "), b = words.slice(Math.ceil(words.length / 2)).join(" ");
      p.text(a, 256, 95, { size: 60, maxWidth: 420 }); p.text(b, 256, 165, { size: 60, maxWidth: 420 });
    } else p.text(text, 256, 118, { size: 72, maxWidth: 440 });
    if (sub) p.text(sub, 256, 215, { size: 26, font: "hand", weight: 500, alpha: 0.7 });
    return k;
  }

  function icon(p, kind, cx, cy, s) {
    const g = p.g; g.save(); g.translate(cx, cy);
    if (kind === "frames") {
      [[-s * 0.3, -s * 0.25, "#9bd0ee"], [s * 0.3, -s * 0.2, "#f0c56b"], [0, s * 0.35, "#b5e0a3"]].forEach(([x, y, col]) => {
        p.rect(x - s * 0.26, y - s * 0.2, s * 0.52, s * 0.4, { fill: PAPER });
        p.rect(x - s * 0.2, y - s * 0.14, s * 0.4, s * 0.28, { fill: col, passes: 1 });
        p.stroke([[x - s * 0.18, y + s * 0.1], [x - s * 0.06, y - s * 0.05], [x + s * 0.04, y + s * 0.04], [x + s * 0.18, y - s * 0.08]], false, { passes: 1 });
      });
    } else if (kind === "screens") {
      [[-s * 0.25, -s * 0.3, 0.5], [s * 0.3, -s * 0.1, 0.42], [-s * 0.05, s * 0.35, 0.5]].forEach(([x, y, w]) => {
        p.rect(x - s * w / 2, y - s * w * 0.32, s * w, s * w * 0.64, { fill: "#e3e3e0" });
        p.rect(x - s * w / 2 + 6, y - s * w * 0.32 + 6, s * w - 12, s * w * 0.64 - 20, { fill: "#9bd0ee", passes: 1 });
        p.line(x - s * 0.1, y + s * w * 0.4, x + s * 0.1, y + s * w * 0.4, { passes: 1 });
      });
    } else if (kind === "plane") {
      p.puff(-s * 0.3, -s * 0.35, s * 0.2, s * 0.1, 5, { fill: C.cloud }); p.puff(s * 0.35, s * 0.3, s * 0.16, s * 0.09, 5, { fill: C.cloud });
      p.stroke([[-s * 0.5, s * 0.1], [s * 0.5, -s * 0.4], [s * 0.05, s * 0.45], [-s * 0.05, s * 0.12]], true, { fill: "#f6f6f3" });
      p.stroke([[-s * 0.05, s * 0.12], [s * 0.5, -s * 0.4], [s * 0.05, s * 0.45]], true, { fill: "#d6e8f4" });
      p.line(-s * 0.05, s * 0.12, s * 0.5, -s * 0.4, { passes: 1 });
    } else if (kind === "mail") {
      p.rect(-s * 0.45, -s * 0.3, s * 0.9, s * 0.6, { fill: C.sun });
      p.stroke([[-s * 0.45, -s * 0.3], [0, s * 0.08], [s * 0.45, -s * 0.3]], false, { width: 2 });
      p.circle(s * 0.3, -s * 0.18, s * 0.08, { fill: C.coral, passes: 1 });
      p.text("@", 0, s * 0.45 + 10, { size: s * 0.5, color: C.blue });
    } else if (kind === "cv") {
      p.rect(-s * 0.32, -s * 0.45, s * 0.64, s * 0.9, { fill: "#fdfcf8" });
      p.circle(-s * 0.12, -s * 0.25, s * 0.1, { fill: C.sun, passes: 1 });
      for (let i = 0; i < 5; i++) p.line(-s * 0.24, -s * 0.05 + i * s * 0.12, s * 0.22, -s * 0.05 + i * s * 0.12, { passes: 1, alpha: 0.6, width: 3, ink: i === 0 ? C.coral : undefined });
    }
    g.restore();
  }

  /* a room door — kept light so the hover / open tint (wood) multiplies cleanly */
  function corridorDoor(kind) {
    const k = canvas(512, 1024), p = new Pen(k.g, { width: 2.6, jitter: 1.1 });
    p.rect(6, 6, 500, 1012, { fill: "#f1ebe0" });
    p.rect(40, 40, 432, 960, { fill: "#f9f7f2" });
    p.rect(80, 80, 352, 380, { fill: "#fdfcf9" });
    p.rect(80, 520, 352, 420, { fill: "#ece5d8" });
    p.rect(104, 544, 304, 372, { alpha: 0.5, width: 1.6 });
    p.rrect(416, 480, 40, 14, 6, { fill: "#e1c067" }); p.circle(436, 487, 10, { fill: "#d9b24e", passes: 1 });
    icon(p, kind, 256, 270, 240);
    return k;
  }

  function endDoor(kind) {
    const k = canvas(1024, 1024), p = new Pen(k.g, { width: 3, jitter: 1.2 });
    p.rect(10, 10, 1004, 1004, { fill: "#ebe3d6" });
    [60, 522].forEach((x) => {
      p.rect(x, 60, 442, 950, { fill: "#f9f7f2" });
      p.rect(x + 50, 110, 342, 380, { fill: "#fdfcf9" });
      p.rect(x + 50, 560, 342, 400, { fill: "#ece5d8" });
    });
    p.rrect(470, 500, 30, 80, 8, { fill: "#e1c067" }); p.rrect(524, 500, 30, 80, 8, { fill: "#e1c067" });
    icon(p, kind, 281, 300, 220); icon(p, kind, 743, 300, 220);
    return k;
  }

  function frameArt(lines) {
    const k = canvas(768, 560), p = new Pen(k.g, { width: 2.6, jitter: 1.1 });
    p.rect(10, 10, 748, 540, { fill: C.wood });
    p.rect(48, 48, 672, 464, { fill: "#fdfcf8" });
    [[10, 10, 48, 48], [758, 10, 720, 48], [10, 550, 48, 512], [758, 550, 720, 512]].forEach(([a, b, c, d]) => p.line(a, b, c, d, { passes: 1 }));
    p.hatch([[10, 10], [758, 10], [720, 48], [48, 48]], 9, -0.6, 0.12);
    p.hatch([[10, 550], [758, 550], [720, 512], [48, 512]], 9, -0.6, 0.12);
    // a yellow marker highlight behind the first line
    const n = lines.length, size = n > 2 ? 56 : 72;
    const y0 = 280 - ((n - 1) / 2) * size * 1.25;
    p.g.save(); p.g.globalAlpha = 0.7; p.g.fillStyle = C.sun; p.g.fillRect(384 - Math.min(300, lines[0].length * size * 0.26), y0 - size * 0.32, Math.min(600, lines[0].length * size * 0.52), size * 0.62); p.g.restore();
    lines.forEach((l, i) => p.text(l, 384, 280 + (i - (n - 1) / 2) * (size * 1.25), { size, font: "hand", weight: 700, maxWidth: 620, rotate: R(-0.03, 0.03) }));
    return k;
  }

  /* the character. part: "full" | "body" | "arm" — body and arm are drawn
     separately so the waving arm can be animated on its own plane. */
  const SHOULDER = [352, 300];
  function avatar(waving = true, part = "full") {
    const k = canvas(512, 1024), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    // navy pinstripe double-breasted suit, white shirt, purple tie, wavy dark hair, full beard
    const SUIT = "#2c3047", STRIPE = "#9aa1bd", SKIN = "#c98f63", HAIR = "#241d1a", TIE = "#7d5f93", SHOE = "#3a2a1e";
    const pin = (pts) => { const ink = p.ink; p.ink = STRIPE; p.hatch(pts, 13, Math.PI / 2, 0.55); p.ink = ink; };
    if (part !== "arm") {
      // trousers + shoes
      const legL = [[182, 590], [252, 590], [248, 930], [186, 930]], legR = [[260, 590], [330, 590], [326, 930], [264, 930]];
      p.stroke(legL, true, { fill: SUIT }); pin(legL); p.stroke(legR, true, { fill: SUIT }); pin(legR);
      p.ellipse(214, 952, 44, 18, { fill: SHOE }); p.ellipse(298, 952, 44, 18, { fill: SHOE });
      // jacket
      const jacket = [[176, 262], [336, 262], [352, 300], [348, 604], [164, 604], [160, 300]];
      p.stroke(jacket, true, { fill: SUIT }); pin(jacket);
      // left arm down (sleeve + cuff + hand)
      const armL = [[160, 300], [118, 332], [108, 486], [144, 490], [156, 390]];
      p.stroke(armL, true, { fill: SUIT }); pin(armL);
      p.stroke([[110, 470], [144, 474], [144, 490], [108, 486]], true, { fill: "#f7f7f4", passes: 1 });
      p.circle(126, 506, 22, { fill: SKIN });
      if (!waving) { const armR = [[352, 300], [394, 332], [404, 486], [368, 490], [356, 390]]; p.stroke(armR, true, { fill: SUIT }); pin(armR); p.circle(386, 506, 22, { fill: SKIN }); }
      // shirt V, tie, lapels, buttons
      p.stroke([[214, 262], [298, 262], [256, 372]], true, { fill: "#f7f7f4" });
      p.stroke([[246, 268], [266, 268], [272, 340], [256, 420], [240, 340]], true, { fill: TIE });
      for (let y = 290; y < 410; y += 16) for (let x = 246; x < 268; x += 10) p.circle(x + (y % 32 ? 4 : 0), y, 1.6, { fill: "#d9c8e3", passes: 1, width: 0.5 });
      p.line(214, 262, 226, 470, { width: 2.2, ink: "#1a1d2e", passes: 1 }); p.line(298, 262, 286, 470, { width: 2.2, ink: "#1a1d2e", passes: 1 });
      [[226, 430], [286, 430], [226, 500], [286, 500]].forEach(([x, y]) => p.circle(x, y, 6, { fill: "#15161f", passes: 1 }));
      p.line(198, 560, 236, 562, { width: 2.4, ink: "#1a1d2e", passes: 1 }); p.line(276, 562, 314, 560, { width: 2.4, ink: "#1a1d2e", passes: 1 });
      // neck + ears + head
      p.stroke([[234, 214], [278, 214], [284, 264], [228, 264]], true, { fill: SKIN });
      p.circle(182, 152, 12, { fill: SKIN }); p.circle(330, 152, 12, { fill: SKIN });
      p.circle(256, 148, 74, { fill: SKIN });
      // beard + moustache
      p.curve([[192, 166], [200, 206], [226, 234], [256, 242], [286, 234], [312, 206], [320, 166], [302, 194], [256, 206], [210, 194]], true, { fill: HAIR, passes: 1, alpha: 0.95 });
      p.curve([[232, 180], [256, 173], [280, 180], [268, 188], [244, 188]], true, { fill: HAIR, passes: 1 });
      p.curve([[240, 204], [256, 211], [272, 204]], false, { width: 2, ink: "#d9a98b", passes: 1 });
      // eyes + brows + nose
      p.ellipse(232, 148, 7, 5, { fill: "#1d1a18", passes: 1 }); p.ellipse(280, 148, 7, 5, { fill: "#1d1a18", passes: 1 });
      p.curve([[218, 134], [232, 128], [248, 133]], false, { width: 4, ink: HAIR, passes: 1 }); p.curve([[264, 133], [280, 128], [294, 134]], false, { width: 4, ink: HAIR, passes: 1 });
      p.curve([[256, 150], [250, 168], [258, 172]], false, { width: 1.8, passes: 1 });
      // wavy hair: back mass, then a messy fringe over the forehead
      p.puff(256, 72, 92, 50, 10, { fill: HAIR, passes: 1 });
      p.puff(206, 96, 36, 20, 5, { fill: HAIR, passes: 1 }); p.puff(306, 94, 38, 20, 5, { fill: HAIR, passes: 1 }); p.puff(256, 84, 34, 22, 5, { fill: HAIR, passes: 1 });
      for (let i = 0; i < 7; i++) p.curve([[190 + i * 22, 50 + (i % 2) * 8], [196 + i * 22, 74], [188 + i * 22, 98]], false, { width: 1.6, ink: "#4a403a", alpha: 0.6, passes: 1 });
    }
    if (part !== "body" && waving) {
      const armR = [[352, 300], [392, 318], [430, 230], [468, 150], [440, 136], [404, 210], [364, 280]];
      p.stroke(armR, true, { fill: SUIT }); pin(armR);
      p.stroke([[438, 156], [466, 168], [474, 150], [446, 138]], true, { fill: "#f7f7f4", passes: 1 });
      p.circle(458, 128, 24, { fill: SKIN });
      p.text("hi!", 400, 66, { size: 40, font: "hand", weight: 700, rotate: 0.2, color: "#d2514a" });
    }
    return k;
  }
  /* body + separately-pivoted waving arm. group.userData.tick(t) animates it */
  function avatarRig(w = 1.3) {
    const h = w * 2, g = new THREE.Group();
    const body = SK.plane(avatar(true, "body"), w, h);
    const arm = SK.plane(avatar(true, "arm"), w, h);
    const px = (SHOULDER[0] / 512 - 0.5) * w, py = (0.5 - SHOULDER[1] / 1024) * h;
    arm.geometry.translate(-px, -py, 0); arm.position.set(px, py, 0.003);
    g.add(body); g.add(arm);
    g.userData.parts = [body, arm];
    g.userData.tick = (t) => { arm.rotation.z = Math.sin(t * 4.2) * 0.28 + 0.06; body.rotation.z = Math.sin(t * 2.1) * 0.012; };
    return g;
  }

  function title(text, sub, w = 1536, h = 600) {
    const k = canvas(w, h), p = new Pen(k.g, { width: 2 });
    const size = Math.min(220, (w - 100) / (text.length * 0.62));
    p.bubble(text, w / 2, sub ? h * 0.42 : h / 2, { size, maxWidth: w - 60 });
    if (sub) {
      // yellow marker swipe behind the subtitle
      const ss = Math.min(70, size * 0.36); p.g.save(); p.g.font = p.font({ size: ss, font: "hand", weight: 600 }); const tw = Math.min(w - 80, p.g.measureText(sub).width) + 40;
      p.g.globalAlpha = 0.85; p.g.fillStyle = C.sun; p.g.fillRect(w / 2 - tw / 2, h * 0.8 - ss * 0.22, tw, ss * 0.5); p.g.restore();
      p.text(sub, w / 2, h * 0.8, { size: ss, font: "hand", weight: 600, alpha: 0.9, maxWidth: w - 80 });
    }
    return k;
  }

  function sectionTitle(text, sub) { return title(text, sub, 1536, 560); }

  function lamp() {
    const k = canvas(512, 256), p = new Pen(k.g, { width: 2.2, jitter: 0.8 });
    const g = k.g, gr = g.createRadialGradient(256, 128, 20, 256, 128, 260); gr.addColorStop(0, "rgba(255,238,190,0.95)"); gr.addColorStop(1, "rgba(255,238,190,0)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    p.rect(60, 60, 392, 136, { fill: "#fff6da" });
    for (let i = 1; i < 6; i++) p.line(60 + i * 65.3, 60, 60 + i * 65.3, 196, { passes: 1, alpha: 0.5 });
    for (let i = 1; i < 3; i++) p.line(60, 60 + i * 45.3, 452, 60 + i * 45.3, { passes: 1, alpha: 0.5 });
    return k;
  }

  function vent() {
    const k = canvas(256, 192), p = new Pen(k.g, { width: 2, jitter: 0.8 });
    p.rect(10, 10, 236, 172, { fill: "#f0ede6" });
    for (let i = 0; i < 7; i++) p.line(30, 36 + i * 20, 226, 36 + i * 20, { width: 2.4, alpha: 0.7 });
    return k;
  }

  function sideTable() {
    const k = canvas(512, 512), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    p.stroke([[30, 190], [482, 190], [470, 226], [42, 226]], true, { fill: C.wood });
    [[60, 226, 40], [412, 226, 40]].forEach(([x, y, w]) => { p.rect(x, y, w, 270, { fill: C.woodLight }); for (let i = 0; i < 6; i++) p.line(x + 6, y + 20 + i * 40, x + w - 6, y + 24 + i * 40, { passes: 1, alpha: 0.25, ink: C.woodDark }); });
    p.line(100, 420, 412, 420, { width: 3 });
    p.stroke([[210, 190], [302, 190], [290, 118], [222, 118]], true, { fill: C.terracotta });
    for (let q = 0; q < 7; q++) { const a = (q / 7) * TAU; p.ellipse(256 + Math.cos(a) * 36, 90 + Math.sin(a) * 18, 18, 30, { fill: C.leaf, passes: 1 }); }
    p.circle(256, 90, 10, { fill: C.coral, passes: 1 });
    return k;
  }

  function plant() {
    const k = canvas(384, 640), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    p.stroke([[120, 520], [264, 520], [250, 630], [134, 630]], true, { fill: C.terracotta });
    p.rect(104, 496, 176, 30, { fill: "#e3a878" });
    p.line(192, 500, 192, 300, { width: 3, ink: "#6b4a2b" });
    [[192, 230, 120, 110], [120, 300, 80, 70], [268, 310, 84, 72], [150, 180, 70, 60], [240, 190, 72, 60]].forEach(([x, y, rx, ry], i) => p.puff(x, y, rx, ry, 8, { fill: i % 2 ? "#a7cb8c" : C.leaf }));
    for (let i = 0; i < 12; i++) p.curve([[192 + R(-100, 100), 240 + R(-80, 80)], [192 + R(-100, 100), 240 + R(-80, 80)]], false, { ink: C.leafDark, alpha: 0.35, width: 1.4, passes: 1 });
    return k;
  }

  function pencil() {
    const k = canvas(512, 112), p = new Pen(k.g, { width: 2, jitter: 0.8 });
    p.stroke([[60, 30], [430, 30], [430, 82], [60, 82]], true, { fill: C.sun });
    p.line(60, 48, 430, 48, { passes: 1, alpha: 0.4 }); p.line(60, 64, 430, 64, { passes: 1, alpha: 0.4 });
    p.stroke([[60, 30], [8, 56], [60, 82]], true, { fill: "#f3e3c8" }); p.stroke([[26, 47], [8, 56], [26, 65]], true, { fill: "#333", passes: 1 });
    p.rect(430, 30, 30, 52, { fill: "#cfd3d8" }); p.rrect(460, 30, 40, 52, 10, { fill: C.coralSoft });
    return k;
  }

  function mug() {
    const k = canvas(256, 256), p = new Pen(k.g, { width: 2.2, jitter: 0.9 });
    p.rect(60, 80, 120, 140, { fill: C.coral }); p.ellipse(120, 80, 60, 18, { fill: "#f4e9df" });
    p.ellipse(120, 80, 48, 12, { fill: "#8a5a3c", passes: 1, alpha: 0.6 });
    p.curve([[180, 110], [230, 112], [232, 170], [180, 180]], false, { width: 6, passes: 1, ink: C.coral }); p.curve([[180, 110], [230, 112], [232, 170], [180, 180]], false, { width: 2.4 });
    p.curve([[180, 125], [214, 128], [214, 160], [180, 165]], false, { width: 2 });
    [[90, 60], [120, 50], [150, 60]].forEach(([x, y]) => p.curve([[x, y], [x + 6, y - 16], [x - 4, y - 30]], false, { alpha: 0.4, width: 1.4 }));
    return k;
  }

  function paperBall() {
    const k = canvas(256, 256), p = new Pen(k.g, { width: 2, jitter: 1 });
    p.puff(128, 128, 90, 84, 9, { fill: "#f4f2ec" });
    for (let i = 0; i < 10; i++) p.stroke([[128 + R(-60, 60), 128 + R(-60, 60)], [128 + R(-60, 60), 128 + R(-60, 60)]], false, { passes: 1, alpha: 0.5, width: 1.2 });
    return k;
  }

  function planeSketch() {
    const k = canvas(512, 320), p = new Pen(k.g, { width: 2.2, jitter: 0.9 });
    p.stroke([[30, 190], [480, 40], [250, 290], [220, 200]], true, { fill: "#f6f6f3" });
    p.stroke([[220, 200], [480, 40], [300, 230]], true, { fill: "#d6e8f4" });
    p.line(220, 200, 480, 40, { width: 2 });
    return k;
  }

  function arrow(dir = 1) {
    const k = canvas(256, 160), p = new Pen(k.g, { width: 3.4, jitter: 1, ink: C.coral });
    const g = k.g; if (dir < 0) { g.translate(256, 0); g.scale(-1, 1); }
    p.curve([[20, 40], [120, 50], [210, 120]], false, { width: 3 });
    p.stroke([[160, 118], [212, 122], [196, 72]], false, { width: 3 });
    return k;
  }

  function doodle(ch, size = 128, color) {
    const k = canvas(size, size), p = new Pen(k.g);
    p.text(ch, size / 2, size / 2, { size: size * 0.7, font: "hand", weight: 700, alpha: color ? 0.85 : 0.55, color });
    return k;
  }

  /* ---------- gallery ---------- */
  /* white cloud with a blue-grey underside, drawn for a sky background */
  function cloud() {
    const k = canvas(512, 300), p = new Pen(k.g, { width: 2.2, jitter: 1 });
    p.puff(256, 170, 190, 80, (R(6, 10)) | 0, { fill: C.cloudShade, passes: 1, alpha: 0 });
    p.puff(256, 150, 190, 80, (R(6, 10)) | 0, { fill: C.cloud, passes: 1, alpha: 0.7 });
    if (Math.random() < 0.5) p.puff(300 + R(-80, 80), 110, 100, 50, 6, { fill: C.cloud, passes: 1, alpha: 0.7 });
    return k;
  }

  function skyline() {
    const w = 4096, h = 768, k = canvas(w, h), p = new Pen(k.g, { width: 1.8, jitter: 1, passes: 1 });
    const tints = ["#e8dfd4", "#dfe4ea", "#e9e0e6", "#e3e8dc", "#eadfcf"];
    let x = 0;
    while (x < w) {
      const bw = R(80, 220), bh = R(240, 620), bx = x + R(-10, 10);
      p.rect(bx, h - bh, bw, bh, { fill: pick(tints), alpha: 0.6 });
      if (Math.random() < 0.3) p.line(bx + bw / 2, h - bh, bx + bw / 2, h - bh - R(40, 120), { alpha: 0.5 });
      for (let wy = h - bh + 30; wy < h - 40; wy += 34) for (let wx = bx + 16; wx < bx + bw - 16; wx += 28) if (Math.random() < 0.6) p.rect(wx, wy, 12, 16, { fill: Math.random() < 0.3 ? C.sun : G(0.08), alpha: 0.4, width: 1 });
      x += bw + R(10, 60);
    }
    for (let i = 0; i < 6; i++) { const cx = R(w), cy = h - R(500, 700); p.line(cx, h, cx, cy, { alpha: 0.5 }); p.line(cx - 120, cy, cx + 200, cy, { alpha: 0.5 }); p.line(cx + 200, cy, cx + 200, cy + 60, { alpha: 0.4 }); }
    x = 0;
    while (x < w) {
      const rw = R(220, 420), rh = R(90, 150), rx = x;
      p.stroke([[rx, h], [rx, h - rh], [rx + rw / 2, h - rh - R(60, 120)], [rx + rw, h - rh], [rx + rw, h]], true, { fill: pick(["#f1e9dc", "#ecdfd3", "#f0ebe2"]), alpha: 0.9 });
      p.stroke([[rx, h - rh], [rx + rw / 2, h - rh - 60], [rx + rw, h - rh]], false, { fill: C.coralSoft, alpha: 0.5, passes: 1 });
      if (Math.random() < 0.6) p.rect(rx + R(20, rw - 60), h - rh - R(30, 60), 26, 60, { fill: "#e2d6c8" });
      if (Math.random() < 0.35) { const tx = rx + R(40, rw - 60); p.rect(tx, h - rh - 110, 60, 50, { fill: C.water }); p.line(tx + 6, h - rh - 60, tx + 10, h - rh, { alpha: 0.6 }); p.line(tx + 54, h - rh - 60, tx + 50, h - rh, { alpha: 0.6 }); }
      x += rw + R(0, 30);
    }
    return k;
  }

  function railing() {
    const w = 4096, h = 512, k = canvas(w, h), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    for (let x = 28; x < w; x += 64) {
      const L = [[x - 8, 70], [x - 16, 120], [x - 6, 180], [x - 14, 260], [x - 5, 330], [x - 12, 400], [x - 8, 440]];
      const Rr = L.map(([px, py]) => [x + (x - px), py]).reverse();
      p.curve([...L, ...Rr], true, { fill: "#f1ece2", passes: 1 });
    }
    p.rect(0, 40, w, 34, { fill: C.wood }); p.rect(0, 440, w, 30, { fill: C.wood });
    p.line(0, 90, w, 90, { alpha: 0.4 });
    return k;
  }

  const POSTER_TINTS = ["#f9d5d3", "#d6e6f7", "#fbe8b5", "#d4ecd2", "#e8d9f5", "#fde0c4", "#cfeaea"];
  function poster(pr, i = 0) {
    const k = canvas(512, 660), p = new Pen(k.g, { width: 2.2, jitter: 1 });
    const tint = POSTER_TINTS[i % POSTER_TINTS.length];
    p.rect(14, 44, 484, 600, { fill: "#fdfcf9" });
    p.rect(30, 60, 452, 86, { fill: tint });
    p.text(pr.title, 256, 103, { size: 44, maxWidth: 420 });
    p.rect(44, 170, 424, 300, { fill: "#f7f6f2" });
    p.rect(44, 170, 424, 36, { fill: "#e6e5e1" });
    [[66, C.coral], [84, C.sun], [102, C.leaf]].forEach(([cx, col]) => p.circle(cx, 188, 6, { passes: 1, fill: col }));
    p.rect(70, 230, 240, 120, { fill: "#f0efe9" });
    p.stroke([[80, 340], [130, 290], [180, 320], [240, 260], [300, 300]], false, { width: 3, ink: C.coral });
    for (let i2 = 0; i2 < 5; i2++) p.line(330, 240 + i2 * 26, 330 + R(60, 120), 240 + i2 * 26, { passes: 1, alpha: 0.6, width: 2.4 });
    for (let i2 = 0; i2 < 3; i2++) p.rrect(70, 370 + i2 * 30, R(180, 380), 18, 6, { fill: i2 === 0 ? C.water : "#e9e8e4", passes: 1 });
    if (pr.badge) {
      const gold = /1st/i.test(pr.badge) ? C.sun : /2nd/i.test(pr.badge) ? "#d9dde2" : C.water;
      p.g.save(); p.g.translate(412, 150); p.g.rotate(-0.25);
      p.ellipse(0, 0, 66, 66, { fill: gold }); p.ellipse(0, 0, 50, 50, { alpha: 0.5 });
      p.text(pr.badge, 0, 0, { size: 20, font: "sans", weight: 800, maxWidth: 90 });
      p.g.restore();
    }
    p.paragraph(pr.event, 44, 488, 424, { size: 24, font: "hand", weight: 700, maxLines: 2 });
    p.text(pr.date, 44, 580, { size: 22, font: "sans", weight: 600, align: "left", alpha: 0.6 });
    p.text((pr.tags || []).slice(0, 3).join("  ·  "), 468, 580, { size: 18, font: "sans", weight: 600, align: "right", alpha: 0.6, maxWidth: 300 });
    p.rect(236, 0, 40, 70, { fill: pick([C.coral, C.sun, C.blue, C.leaf]) }); p.line(256, 10, 256, 60, { passes: 1 });
    return k;
  }

  /* ---------- office / studio ---------- */
  function monitor(it, i = 0) {
    const k = canvas(640, 512), p = new Pen(k.g, { width: 2.2, jitter: 1 });
    p.rect(10, 10, 620, 400, { fill: "#dfe4ea" });
    p.rect(34, 34, 572, 330, { fill: "#fcfcfa" });
    p.rect(34, 34, 572, 28, { fill: POSTER_TINTS[i % POSTER_TINTS.length] }); [[52, C.coral], [70, C.sun], [88, C.leaf]].forEach(([cx, col]) => p.circle(cx, 48, 5, { passes: 1, fill: col }));
    p.text(it.title, 320, 100, { size: 34, maxWidth: 540 });
    p.text(it.org + "  ·  " + it.period, 320, 148, { size: 26, font: "hand", weight: 700, alpha: 0.8, maxWidth: 540, color: C.blue });
    let y = 182;
    (it.bullets || []).slice(0, 2).forEach((b) => { y += p.paragraph("• " + b, 56, y, 530, { size: 17, font: "sans", weight: 500, maxLines: 3, lh: 1.3, alpha: 0.85 }) + 8; });
    p.text((it.tags || []).join("  ·  "), 320, 348, { size: 16, font: "sans", weight: 700, alpha: 0.55, maxWidth: 540 });
    p.rect(290, 410, 60, 50, { fill: "#cfd5dc" }); p.rect(210, 460, 220, 22, { fill: "#cfd5dc" });
    p.text("ABHISHEK", 320, 395, { size: 12, font: "sans", weight: 800, alpha: 0.35 });
    return k;
  }

  /* ---------- about ---------- */
  const PASTELS = ["#f6b3ad", "#a9cfee", "#f8dc7e", "#b6dfad", "#cdb6ec", "#f9c8a0", "#9fd9d4"];
  function balloon(label, i = 0) {
    const k = canvas(256, 520), p = new Pen(k.g, { width: 2.2, jitter: 1 });
    p.ellipse(128, 150, 98, 122, { fill: PASTELS[i % PASTELS.length] });
    p.curve([[70, 90], [60, 150], [74, 200]], false, { alpha: 0.6, width: 4, ink: "#ffffff" });
    p.stroke([[118, 272], [138, 272], [128, 288]], true, { fill: "#555", passes: 1 });
    p.curve([[128, 290], [150, 340], [110, 400], [140, 460], [120, 510]], false, { width: 1.6 });
    p.text(label, 128, 150, { size: 34, maxWidth: 150, font: label.length > 8 ? "hand" : undefined, weight: 700 });
    return k;
  }

  function island(label, sub) {
    const k = canvas(1024, 800), p = new Pen(k.g, { width: 2.6, jitter: 1.2 });
    const rock = [[150, 440], [120, 520], [200, 560], [240, 640], [340, 660], [420, 740], [520, 720], [600, 760], [700, 690], [780, 640], [820, 560], [900, 500], [880, 440]];
    p.stroke(rock, true, { fill: "#d9cbb8", hatch: { spacing: 10, angle: -0.7, alpha: 0.18 } });
    for (let i = 0; i < 14; i++) { const x = R(220, 820), y0 = 560 + R(0, 120); p.curve([[x, y0], [x + R(-20, 20), y0 + 60], [x + R(-30, 30), y0 + 120]], false, { width: 1.4, alpha: 0.6, ink: "#8a6a4a" }); }
    p.ellipse(512, 440, 390, 72, { fill: C.leaf });
    for (let i = 0; i < 30; i++) p.line(180 + i * 22, 440 + R(-40, 40), 186 + i * 22, 425 + R(-40, 40), { passes: 1, alpha: 0.5, width: 1.4, ink: C.leafDark });
    const size = Math.min(170, 820 / (label.length * 0.62));
    for (let i = 10; i > 0; i--) p.text(label, 512 + i, 290 + i * 1.4, { size, outline: size * 0.12, outlineColor: "#8c8b87", color: "#8c8b87", maxWidth: 820 });
    p.bubble(label, 512, 290, { size, maxWidth: 820 });
    p.stroke([[352, 470], [672, 470], [676, 560], [348, 560]], true, { fill: "#e9d2a9" });
    p.line(380, 470, 380, 440, { width: 3 }); p.line(644, 470, 644, 440, { width: 3 });
    p.text(sub, 512, 515, { size: 38, maxWidth: 300, font: "hand", weight: 700 });
    return k;
  }

  function medal(text) {
    const k = canvas(384, 512), p = new Pen(k.g, { width: 2.2, jitter: 1 });
    p.stroke([[150, 0], [234, 0], [250, 200], [134, 200]], true, { fill: C.coral });
    p.stroke([[178, 0], [206, 0], [212, 200], [172, 200]], true, { fill: "#fdfcf8", passes: 1, alpha: 0.5 });
    p.circle(192, 300, 130, { fill: C.sun }); p.circle(192, 300, 104, { alpha: 0.55, fill: "#fbe08a" });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; p.line(192 + Math.cos(a) * 104, 300 + Math.sin(a) * 104, 192 + Math.cos(a) * 130, 300 + Math.sin(a) * 130, { passes: 1, alpha: 0.35 }); }
    p.paragraph(text, 192, 262, 170, { size: 24, font: "hand", weight: 700, align: "center", maxLines: 3, lh: 1.2 });
    return k;
  }

  function cloudBig() {
    const k = canvas(1024, 512), p = new Pen(k.g, { width: 2.6, jitter: 1.2 });
    p.puff(512, 330, 420, 150, 11, { fill: C.cloudShade, alpha: 0 });
    p.puff(512, 300, 420, 150, 11, { fill: C.cloud });
    p.puff(380, 200, 200, 110, 7, { fill: C.cloud }); p.puff(650, 220, 220, 120, 8, { fill: C.cloud });
    return k;
  }

  function tag(text, i = 0) {
    const k = canvas(384, 128), p = new Pen(k.g, { width: 2, jitter: 0.9 });
    p.rrect(12, 20, 360, 88, 30, { fill: "#fdfcf8" });
    p.rrect(12, 20, 60, 88, 30, { fill: PASTELS[i % PASTELS.length], passes: 0 });
    p.circle(42, 64, 10, { fill: "#fdfcf8", passes: 1 });
    p.text(text, 212, 64, { size: 36, font: "hand", weight: 700, maxWidth: 290 });
    return k;
  }

  /* ---------- contact ---------- */
  function lighthouse() {
    const k = canvas(512, 768), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    p.puff(256, 700, 220, 60, 8, { fill: "#d9cbb8", hatch: { spacing: 9, alpha: 0.15 } });
    p.stroke([[196, 660], [316, 660], [288, 200], [224, 200]], true, { fill: "#fbfaf6" });
    [[270, 330], [420, 480], [560, 620]].forEach(([a, b]) => { const w1 = 224 + (a - 200) * (-28) / 460, w2 = 224 + (b - 200) * (-28) / 460; p.stroke([[w1, a], [512 - w1, a], [512 - w2, b], [w2, b]], true, { fill: C.coral, passes: 1, alpha: 0.6 }); });
    p.rect(190, 182, 132, 22, { fill: "#4a4a4a" });
    p.rect(226, 112, 60, 70, { fill: "#fff1a8" }); p.line(256, 112, 256, 182, { passes: 1 }); p.line(226, 147, 286, 147, { passes: 1 });
    p.stroke([[214, 112], [298, 112], [256, 60]], true, { fill: C.coral });
    for (let i = 0; i < 5; i++) p.line(300 + i * 4, 140 - i * 10, 480, 90 - i * 28, { passes: 1, alpha: 0.35, width: 2, ink: C.sunDeep });
    return k;
  }

  function boat() {
    const k = canvas(512, 256), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    p.stroke([[40, 150], [472, 150], [400, 220], [112, 220]], true, { fill: C.wood });
    p.stroke([[256, 40], [130, 150], [382, 150]], true, { fill: "#fbfaf6" });
    p.stroke([[256, 40], [200, 94], [312, 94]], true, { fill: C.coral, passes: 1, alpha: 0.7 });
    p.line(256, 40, 256, 150, { passes: 1, alpha: 0.5 }); p.line(40, 150, 112, 220, { alpha: 0.4, passes: 1 });
    return k;
  }

  function pier() {
    const k = canvas(512, 1024), p = new Pen(k.g, { width: 2.4, jitter: 1 });
    paper(k.g, 512, 1024, { base: "#e2c89f", grain: 0.04 });
    for (let i = 0; i < 9; i++) {
      const y = i * 114;
      p.rect(0, y + 4, 512, 106, { fill: pick(["#ecd8b6", "#e8d1aa", "#efdcbd"]) });
      for (let g = 0; g < 4; g++) p.curve([[10, y + 20 + g * 22], [256 + R(-80, 80), y + 24 + g * 22], [500, y + 18 + g * 22]], false, { alpha: 0.25, width: 1, ink: C.woodDark });
      [30, 482].forEach((x) => p.circle(x, y + 57, 5, { fill: "#6b6b66", passes: 1 }));
    }
    p.rect(0, 0, 18, 1024, { fill: C.wood }); p.rect(494, 0, 18, 1024, { fill: C.wood });
    return k;
  }

  function signpost(label) {
    const k = canvas(512, 512), p = new Pen(k.g, { width: 2.6, jitter: 1.1 });
    p.puff(256, 470, 90, 32, 6, { fill: "#d9cbb8", hatch: { spacing: 8, alpha: 0.18 } });
    p.rect(236, 220, 40, 250, { fill: C.wood });
    for (let i = 0; i < 5; i++) p.line(244, 240 + i * 40, 268, 244 + i * 40, { passes: 1, alpha: 0.3, ink: C.woodDark });
    p.g.save(); p.g.translate(256, 170); p.g.rotate(R(-0.06, 0.06));
    p.stroke([[-170, -55], [170, -62], [176, 56], [-176, 62]], true, { fill: "#edd7ad" });
    p.stroke([[-150, -38], [150, -44], [156, 40], [-156, 46]], true, { alpha: 0.4, width: 1.4 });
    [[-160, -45], [160, -50], [-162, 50], [164, 46]].forEach(([x, y]) => p.circle(x, y, 5, { fill: "#8a8a86", passes: 1 }));
    p.text(label, 0, 2, { size: 54, maxWidth: 290 });
    p.g.restore();
    return k;
  }

  return {
    paperTex, ground, bricks, planks, parquet, ceiling, wall, water,
    tree, cat, mouse, bug, windowSketch, planter, stonePath, entranceLeaf, hangingSign, roof, sun, bird, bunting, lampPost, mailbox,
    signBoard, corridorDoor, endDoor, frameArt, avatar, avatarRig, title, sectionTitle, lamp, vent, sideTable, plant, pencil, mug, paperBall, planeSketch, arrow, doodle,
    cloud, cloudBig, skyline, railing, poster, monitor, balloon, island, medal, tag,
    lighthouse, boat, pier, signpost,
  };
})();

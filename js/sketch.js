/* sketch.js — hand-drawn 2D helpers. Everything in the 3D world is drawn
   with these on <canvas> and used as textures, so the whole site looks like
   one pencil sketch. */
window.SK = (() => {
  const R = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const TAU = Math.PI * 2;
  const INK = "#2b2b2b";

  /* the sketchbook's watercolour box — every wash in the world comes from here */
  const PAL = {
    paper: "#f7f4ec", ink: INK,
    sky: "#c3dcf0", skyDeep: "#a6c9e6", horizon: "#eef2f3", cloud: "#fcfcfa", cloudShade: "#d9e5ee",
    leaf: "#b4d49a", leafDark: "#6b985a", grass: "#c9dfae",
    wood: "#d9b685", woodDark: "#9a6b3f", woodLight: "#ecd8b6", woodFloor: "#eedcbf",
    sun: "#f6cf5a", sunDeep: "#e0ae2e", coral: "#e2574b", coralSoft: "#f2a39a", lilac: "#c9b3e6", mint: "#bfe3d6", peach: "#f7c59f", blue: "#5f93b8",
    water: "#bfdcee", stone: "#e6ddd0", brick: "#dfc3b1", cream: "#f6efe3", terracotta: "#d9986a",
  };

  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    return { c, g: c.getContext("2d"), w, h };
  }

  /* paper background with grain + optional smudges */
  function paper(g, w, h, o = {}) {
    g.fillStyle = o.base || "#f6f5f1";
    g.fillRect(0, 0, w, h);
    const grain = o.grain ?? 0.05;
    const n = Math.floor((w * h) / 120);
    for (let i = 0; i < n; i++) {
      const v = (R(140, 230)) | 0;
      g.fillStyle = `rgba(${v},${v},${v},${R(grain * 0.3, grain)})`;
      g.fillRect(R(w), R(h), R(1, 2.5), R(1, 2.5));
    }
    for (let i = 0; i < (o.smudges || 0); i++) {
      const x = R(w), y = R(h), r = R(60, 220);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(0,0,0,${R(0.01, 0.03)})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  class Pen {
    constructor(g, o = {}) {
      this.g = g;
      this.ink = o.ink || INK;
      this.w = o.width || 1.6;
      this.j = o.jitter ?? 1.1;
      this.passes = o.passes || 2;
      this.alpha = o.alpha ?? 0.85;
    }
    set(o) { Object.assign(this, o); return this; }

    _path(pts, closed) {
      const g = this.g;
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      if (closed) g.closePath();
    }
    _jit(pts, closed, j) {
      const out = [], n = pts.length, segs = closed ? n : n - 1;
      for (let i = 0; i < segs; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const k = Math.max(1, Math.round(len / 14));
        for (let s = 0; s < k; s++) {
          const t = s / k;
          out.push([a[0] + (b[0] - a[0]) * t + R(-j, j), a[1] + (b[1] - a[1]) * t + R(-j, j)]);
        }
      }
      if (!closed) out.push([pts[n - 1][0] + R(-j, j) * 0.5, pts[n - 1][1] + R(-j, j) * 0.5]);
      return out;
    }
    /* core: stroke a polyline with jittered multi-pass pencil lines */
    stroke(pts, closed = false, o = {}) {
      if (pts.length < 2) return this;
      const g = this.g;
      g.save();
      g.lineCap = "round"; g.lineJoin = "round";
      if (o.fill) { this._path(pts, true); g.fillStyle = o.fill; g.fill(); }
      if (o.hatch) this.hatch(pts, o.hatch.spacing || 7, o.hatch.angle ?? -0.75, o.hatch.alpha ?? 0.2);
      const passes = o.passes ?? this.passes;
      const j = o.jitter ?? this.j;
      for (let p = 0; p < passes; p++) {
        this._path(this._jit(pts, closed, j), closed);
        g.strokeStyle = o.ink || this.ink;
        g.globalAlpha = (o.alpha ?? this.alpha) * (p === 0 ? 1 : 0.5);
        g.lineWidth = (o.width ?? this.w) * R(0.75, 1.15);
        g.stroke();
      }
      g.restore();
      return this;
    }
    line(x1, y1, x2, y2, o) { return this.stroke([[x1, y1], [x2, y2]], false, o); }
    rect(x, y, w, h, o) { return this.stroke([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true, o); }
    rrect(x, y, w, h, r, o) {
      const pts = [];
      const arc = (cx, cy, a0, a1) => { for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
      arc(x + w - r, y + r, -Math.PI / 2, 0); arc(x + w - r, y + h - r, 0, Math.PI / 2);
      arc(x + r, y + h - r, Math.PI / 2, Math.PI); arc(x + r, y + r, Math.PI, Math.PI * 1.5);
      return this.stroke(pts, true, o);
    }
    ellipse(cx, cy, rx, ry, o = {}) {
      const n = o.n || Math.max(14, Math.round((rx + ry) / 3));
      const pts = [], a0 = R(TAU);
      for (let i = 0; i < n; i++) { const a = a0 + (i / n) * TAU; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
      return this.stroke(pts, true, o);
    }
    circle(cx, cy, r, o) { return this.ellipse(cx, cy, r, r, o); }
    /* smooth curve through points (catmull-rom) */
    curve(pts, closed = false, o = {}) {
      const s = [], n = pts.length;
      if (n < 2) return this;
      const P = (i) => pts[closed ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i))];
      const segs = closed ? n : n - 1;
      for (let i = 0; i < segs; i++) {
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        for (let t = 0; t < 8; t++) {
          const u = t / 8, u2 = u * u, u3 = u2 * u;
          s.push([
            0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
            0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
          ]);
        }
      }
      if (!closed) s.push(pts[n - 1]);
      return this.stroke(s, closed, { jitter: 0.6, ...o });
    }
    /* cloud-like puffy outline */
    puff(cx, cy, rx, ry, bumps = 7, o = {}) {
      const pts = [], n = bumps * 12, a0 = R(TAU), ph = R(TAU);
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * TAU;
        const k = 1 + 0.16 * Math.abs(Math.sin((i / n) * Math.PI * bumps + ph));
        pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
      }
      return this.stroke(pts, true, { passes: 1, ...o });
    }
    hatch(pts, spacing = 7, angle = -0.75, alpha = 0.2) {
      const g = this.g;
      g.save();
      this._path(pts, true); g.clip();
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
      const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2, d = Math.hypot(maxx - minx, maxy - miny);
      g.translate(cx, cy); g.rotate(angle);
      g.strokeStyle = this.ink; g.globalAlpha = alpha; g.lineWidth = this.w * 0.55; g.lineCap = "round";
      for (let y = -d / 2; y < d / 2; y += spacing) {
        g.beginPath(); g.moveTo(-d / 2 + R(-4, 4), y + R(-1, 1)); g.lineTo(d / 2 + R(-4, 4), y + R(-1, 1)); g.stroke();
      }
      g.restore();
      return this;
    }
    font(o = {}) {
      const fam = o.font === "hand" ? "'Caveat', cursive" : o.font === "sans" ? "'Inter', system-ui, sans-serif" : o.font || "'Gloria Hallelujah', 'Caveat', cursive";
      return `${o.weight || 700} ${o.size || 32}px ${fam}`;
    }
    text(str, x, y, o = {}) {
      const g = this.g;
      g.save();
      g.font = this.font(o);
      g.textAlign = o.align || "center"; g.textBaseline = o.baseline || "middle";
      if (o.rotate) { g.translate(x, y); g.rotate(o.rotate); x = 0; y = 0; }
      if (o.maxWidth) { const m = g.measureText(str).width; if (m > o.maxWidth) { const s = (o.size || 32) * o.maxWidth / m; g.font = this.font({ ...o, size: s }); } }
      g.globalAlpha = o.alpha ?? 1;
      if (o.outline) { g.lineJoin = "round"; g.lineWidth = o.outline; g.strokeStyle = o.outlineColor || this.ink; g.strokeText(str, x, y); }
      g.fillStyle = o.color || this.ink;
      g.fillText(str, x, y);
      g.restore();
      return this;
    }
    /* comic "bubble" lettering: thick ink outline, white fill, drop shadow */
    bubble(str, x, y, o = {}) {
      const size = o.size || 120;
      this.text(str, x + 5, y + 6, { ...o, size, outline: size * 0.16, outlineColor: "rgba(0,0,0,0.18)", color: "rgba(0,0,0,0)" });
      this.text(str, x, y, { ...o, size, outline: size * 0.14, outlineColor: o.ink || this.ink, color: o.color || "#fbfaf7" });
      return this;
    }
    /* word-wrapped paragraph; returns total height */
    paragraph(str, x, y, maxW, o = {}) {
      const g = this.g;
      g.font = this.font(o);
      const words = String(str).split(/\s+/), lines = [];
      let cur = "";
      for (const w of words) {
        const t = cur ? cur + " " + w : w;
        if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
      }
      if (cur) lines.push(cur);
      const lh = (o.size || 20) * (o.lh || 1.3);
      const max = o.maxLines || 99;
      lines.slice(0, max).forEach((l, i) => this.text(l, x, y + i * lh, { ...o, align: o.align || "left", baseline: "top" }));
      return Math.min(lines.length, max) * lh;
    }
  }

  /* ---------- three.js glue ---------- */
  function tex(c, o = {}) {
    const t = new THREE.CanvasTexture(c.c || c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
    if (o.offset) t.offset.set(o.offset[0], o.offset[1]);
    t.needsUpdate = true;
    return t;
  }
  /* a plane with the canvas on it; height follows the canvas aspect unless given */
  function plane(k, w, h, o = {}) {
    if (h === undefined) h = w * k.h / k.w;
    const t = tex(k, o);
    const m = new THREE.MeshBasicMaterial({
      map: t, transparent: true, side: o.side || THREE.DoubleSide,
      alphaTest: o.alphaTest ?? 0.05, depthWrite: o.depthWrite ?? true, fog: o.fog ?? true,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    mesh.userData.size = [w, h];
    return mesh;
  }
  /* vertical sky gradient used as a scene background (top colour → bottom colour) */
  function gradientTex(top, bottom, mid) {
    const k = canvas(4, 512), gr = k.g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, top); if (mid) gr.addColorStop(0.55, mid); gr.addColorStop(1, bottom);
    k.g.fillStyle = gr; k.g.fillRect(0, 0, 4, 512);
    const t = new THREE.CanvasTexture(k.c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
    return t;
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  return { R, TAU, INK, PAL, canvas, paper, Pen, tex, plane, gradientTex, lerp, clamp, smooth };
})();

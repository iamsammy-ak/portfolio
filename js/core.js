/* core.js — renderer, input, scene lifecycle, paper-tear transitions, HUD. */
window.SCENES = {};
window.CORE = (() => {
  const D = window.PORTFOLIO;
  const { clamp, lerp } = SK;
  const $ = (s) => document.querySelector(s);

  const app = {
    D, renderer: null, current: null, busy: false, started: false,
    scroll: { v: 0, target: 0 },
    pointer: { x: 0, y: 0, px: 0, py: 0, down: false, moved: 0, dx: 0, dy: 0 },
    audio: true, ach: new Set(),
    w: innerWidth, h: innerHeight,
  };
  try { app.ach = new Set(JSON.parse(localStorage.getItem("ak_ach") || "[]")); } catch (_) {}
  try { app.audio = localStorage.getItem("ak_audio") !== "off"; } catch (_) {}

  /* ---------- base scene ---------- */
  class BaseScene {
    constructor(opts = {}) {
      this.app = app; this.opts = opts;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(SK.PAL.paper);
      this.camera = new THREE.PerspectiveCamera(52, app.w / app.h, 0.1, 220);
      this.interactives = [];
      this.scrollMax = 0; this.wrapScroll = false;
      this.time = 0; this.hovered = null;
      this.look = { x: 0, y: 0 };
    }
    add(obj, interactive = false) { this.scene.add(obj); if (interactive) this.interactives.push(obj); return obj; }
    /* subtle "head turn" towards the mouse */
    parallax(dt, amt = 0.06) {
      this.look.x = lerp(this.look.x, -app.pointer.x * amt, 1 - Math.pow(0.001, dt));
      this.look.y = lerp(this.look.y, app.pointer.y * amt * 0.6, 1 - Math.pow(0.001, dt));
      this.camera.rotation.set(this.look.y, this.look.x, 0);
    }
    update(dt) {}
    onDrag(dx, dy) {}
    setHover(obj) {
      if (obj === this.hovered) return;
      if (this.hovered?.userData.onHover) this.hovered.userData.onHover(false);
      this.hovered = obj;
      if (obj?.userData.onHover) obj.userData.onHover(true);
      document.body.classList.toggle("is-pointer", !!obj);
    }
    resize(w, h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    dispose() {
      this.scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      document.body.classList.remove("is-pointer");
    }
  }

  /* ---------- paper tear overlay ---------- */
  const TEAR = (() => {
    const root = $("#tear"), L = $("#tear .tear__half--l"), Rh = $("#tear .tear__half--r");
    const pct = $("#tearPct"), loader = $("#tearLoader");
    function zig() {
      const pts = []; let x = 50;
      for (let y = 0; y <= 100; y += 100 / 18) { pts.push([x, y]); x = clamp(x + (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 3), 44, 56); }
      pts[pts.length - 1][1] = 100;
      return pts;
    }
    function shape() {
      const z = zig();
      const l = "polygon(0 0," + z.map(([x, y]) => `${x}% ${y}%`).join(",") + ",0 100%)";
      const r = "polygon(100% 0," + z.map(([x, y]) => `${x}% ${y}%`).join(",") + ",100% 100%)";
      L.style.clipPath = l; Rh.style.clipPath = r;
      const path = z.map(([x, y]) => `${x},${y}`).join(" ");
      root.querySelectorAll(".tear__edge polyline").forEach((p) => p.setAttribute("points", path));
    }
    const api = {
      shape,
      async open() {
        await gsap.to([L, Rh], { x: (i) => (i === 0 ? "-104%" : "104%"), duration: 1.35, ease: "power3.inOut", stagger: 0 });
        root.classList.add("is-open");
      },
      async close() {
        shape(); root.classList.remove("is-open");
        gsap.set(loader, { autoAlpha: 0 });
        await gsap.to([L, Rh], { x: "0%", duration: 1.0, ease: "power3.inOut" });
      },
      async load(work) {
        gsap.set(loader, { autoAlpha: 1 });
        const o = { v: 0 };
        const tl = gsap.to(o, { v: 92, duration: 2.2, ease: "power1.out", onUpdate: () => (pct.textContent = Math.round(o.v) + "%") });
        await work();
        await tl; await gsap.to(o, { v: 100, duration: 0.35, onUpdate: () => (pct.textContent = Math.round(o.v) + "%") });
        await gsap.to(loader, { autoAlpha: 0, duration: 0.3 });
      },
    };
    shape();
    return api;
  })();

  /* ---------- sounds (tiny synth, no files) ---------- */
  let actx = null;
  function sound(kind) {
    if (!app.audio) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.connect(g); g.connect(actx.destination);
      const P = { click: [520, 0.08, "triangle"], door: [180, 0.5, "sawtooth"], unlock: [660, 0.35, "sine"], whoosh: [240, 0.6, "sine"], pop: [880, 0.12, "square"] }[kind] || [440, 0.1, "sine"];
      o.type = P[2]; o.frequency.setValueAtTime(P[0], t);
      if (kind === "unlock") o.frequency.exponentialRampToValueAtTime(P[0] * 1.5, t + 0.15);
      if (kind === "door" || kind === "whoosh") o.frequency.exponentialRampToValueAtTime(P[0] * 0.5, t + P[1]);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(kind === "door" ? 0.05 : 0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + P[1]);
      o.start(t); o.stop(t + P[1] + 0.05);
    } catch (_) {}
  }

  /* ---------- HUD ---------- */
  const hint = (() => {
    const el = $("#hint"), tt = $("#hint .hint__title"), tx = $("#hint .hint__text");
    let timer = 0;
    return (title, text, ms = 5000) => {
      tt.textContent = title; tx.innerHTML = text;
      el.classList.add("is-on"); clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove("is-on"), ms);
    };
  })();

  function unlock(id) {
    if (app.ach.has(id)) return;
    const a = D.achievements.find((x) => x.id === id); if (!a) return;
    app.ach.add(id);
    try { localStorage.setItem("ak_ach", JSON.stringify([...app.ach])); } catch (_) {}
    sound("unlock");
    hint("ACHIEVEMENT UNLOCKED", `<b>${a.title}</b> — ${a.label}`, 4000);
    renderAch();
    // red dot on the trophy until the panel is opened
    $("#btnAch").classList.add("has-new");
  }
  function renderAch() {
    const list = $("#achList");
    list.innerHTML = D.achievements.map((a) => `<li class="${app.ach.has(a.id) ? "is-done" : ""}"><span class="ach__ic">${app.ach.has(a.id) ? "✔" : "🔒"}</span><div><b>${a.title}</b><small>${a.label}</small></div></li>`).join("");
    $("#achCount").textContent = `${app.ach.size} / ${D.achievements.length} EXPLORED`;
    $("#achBar").style.width = (app.ach.size / D.achievements.length) * 100 + "%";
  }

  /* entrance screen overlay */
  function buildIntro() {
    const m = D.meta, e = D.entrance;
    $("#introHello").textContent = m.hello || "";
    $("#introName").textContent = m.name;
    $("#introRole").textContent = m.role || m.title;
    $("#introTag").textContent = m.tagline || "";
    const links = [["LinkedIn", m.links.linkedin], ["GitHub", m.links.github], ["CV", m.links.cv]].filter(([, u]) => u);
    $("#introLinks").innerHTML = links.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l} <span aria-hidden="true">↗</span></a>`).join("");
    $("#introCueText").textContent = e.cue || "click the door to come in";
    $("#introStats").innerHTML = (e.stats || []).map((s) => `<div class="intro__stat"><b>${s.big}</b><small>${s.small}</small></div>`).join("");
  }

  /* map: a hand-drawn sheet with the corridor + rooms */
  function buildMap() {
    const rooms = D.corridor.rooms;
    const svg = $("#mapSvg");
    const icons = {
      frames: `<path d="M-26 10 L-26 -14 L-6 -14 L-6 10 Z M-2 6 L-2 -20 L22 -20 L22 6 Z M-30 14 L28 14" />`,
      screens: `<rect x="-20" y="-24" width="30" height="18" rx="2"/><rect x="-6" y="-8" width="30" height="18" rx="2"/><rect x="-24" y="4" width="28" height="18" rx="2"/>`,
      plane: `<path d="M-28 6 L26 -20 L4 14 L-2 4 Z M-2 4 L26 -20" /><path d="M-30 20 q10 -8 20 0 q10 8 20 0" />`,
      mail: `<path d="M-28 -10 L28 -10 L28 14 L-28 14 Z M-28 -10 L0 8 L28 -10" /><path d="M-30 20 q10 -6 20 0 q10 6 20 0" />`,
    };
    let s = `<rect class="mp__floor" x="250" y="90" width="28" height="330" /><g class="mp__line"><path d="M250 420 L250 90" /><path d="M250 420 L250 90" transform="translate(28 0)" /></g>`;
    s += `<g class="mp__end" transform="translate(264 60)"><rect x="-24" y="-28" width="48" height="56"/><path d="M0 -28 L0 28 M-18 2 L-10 2 M10 2 L18 2"/><text y="-38" class="mp__inf">∞</text></g>`;
    rooms.forEach((r) => {
      const y = 380 + (r.z / 50) * 290, left = r.side === "left";
      const bx = left ? 232 : 282;
      s += `<g class="mp__room" data-room="${r.id}" transform="translate(${bx} ${y})"><rect x="-16" y="-16" width="32" height="32"/></g>`;
      const ix = left ? 120 : 400;
      s += `<g class="mp__icon" transform="translate(${ix} ${y - 10})">${icons[r.icon] || ""}</g>`;
      s += `<text class="mp__label" x="${ix}" y="${y + 36}" text-anchor="middle">${r.label}</text>`;
    });
    s += `<g class="mp__pin" id="mapPin"><circle r="14" class="mp__pinring"/><path class="mp__pinbody" d="M0 -4 l-6 -14 l12 0 z M-5 -18 l10 0 M0 -4 l0 10" /><text class="mp__you" x="20" y="-10">you are here</text></g>`;
    svg.innerHTML = s;
    svg.querySelectorAll(".mp__room").forEach((g) => g.addEventListener("click", () => { closeMap(); go(g.dataset.room); }));
    svg.querySelector(".mp__end").addEventListener("click", () => { closeMap(); go("home", { inside: true }); });
  }
  function setPin(name) {
    const pin = $("#mapPin"); if (!pin) return;
    const r = D.corridor.rooms.find((x) => x.id === name);
    if (!r) { pin.setAttribute("transform", "translate(264 440)"); return; }
    const y = 380 + (r.z / 50) * 290, bx = r.side === "left" ? 232 : 282;
    pin.setAttribute("transform", `translate(${bx} ${y + 2})`);
  }
  const openMap = () => { $("#map").classList.add("is-on"); sound("click"); };
  const closeMap = () => $("#map").classList.remove("is-on");

  /* project / experience modal */
  function modal(item) {
    const m = $("#modal");
    $("#modalBody").innerHTML = `
      ${item.badge ? `<span class="modal__badge">${item.badge}</span>` : ""}
      <h2>${item.title}</h2>
      <p class="modal__meta">${[item.org, item.event, item.period, item.date].filter(Boolean).join(" · ")}</p>
      ${item.summary ? `<p class="modal__sum">${item.summary}</p>` : ""}
      ${item.bullets?.length ? `<ul>${item.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>` : ""}
      ${item.tags?.length ? `<p class="modal__tags">${item.tags.map((t) => `<span>${t}</span>`).join("")}</p>` : ""}
      ${item.link ? `<a class="modal__link" href="${item.link}" target="_blank" rel="noopener">Open project ↗</a>` : ""}`;
    m.classList.add("is-on"); sound("pop");
  }
  const closeModal = () => $("#modal").classList.remove("is-on");

  function setAudio(on) {
    app.audio = on; $("#btnAudio").classList.toggle("is-off", !on);
    try { localStorage.setItem("ak_audio", on ? "on" : "off"); } catch (_) {}
  }

  /* ---------- scene switching ---------- */
  async function go(name, opts = {}) {
    if (app.busy) return;
    if (app.current?.name === name && !opts.force) return;
    app.busy = true; closeModal(); closeMap(); $("#ach").classList.remove("is-on");
    sound("whoosh");
    await TEAR.close();
    swap(name, opts);
    await TEAR.open();
    app.busy = false;
    app.current?.onEnter?.();
  }
  function swap(name, opts) {
    if (app.current) app.current.dispose();
    app.scroll.v = 0; app.scroll.target = 0;
    const S = SCENES[name] || SCENES.home;
    app.current = new S(opts); app.current.name = name;
    app.current.resize(app.w, app.h);
    $("#btnBack").classList.toggle("is-hidden", name === "home");
    document.body.classList.toggle("is-drag", !!app.current.dragScroll);
    $("#intro").classList.toggle("is-on", name === "home" && !opts.inside);
    setPin(name);
    document.title = `${name === "home" ? "" : name[0].toUpperCase() + name.slice(1) + " — "}${D.meta.name} · Portfolio`;
    try { history.replaceState(null, "", "#" + (name === "home" ? "" : name)); } catch (_) {}
  }

  /* ---------- input ---------- */
  function bindInput() {
    const c = app.renderer.domElement;
    addEventListener("wheel", (e) => {
      if (!app.current || app.busy || $("#modal").classList.contains("is-on") || $("#map").classList.contains("is-on")) return;
      const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? app.h : 1;
      const dy = e.deltaY * k, dx = e.deltaX * k;
      // sideways trackpad swipes: look around in the corridor, slide the clothesline in the gallery
      if (Math.abs(dx) > Math.abs(dy)) { if (app.current.onPan) app.current.onPan(dx); else app.scroll.target += dx; }
      else app.scroll.target += dy;
    }, { passive: true });
    let lastT = null;
    c.addEventListener("pointerdown", (e) => {
      app.pointer.down = true; app.pointer.moved = 0; app.pointer.px = e.clientX; app.pointer.py = e.clientY;
      document.body.classList.add("is-down");
      if (e.pointerType === "touch") lastT = e.clientY;
      c.setPointerCapture?.(e.pointerId);
    });
    addEventListener("pointermove", (e) => {
      app.pointer.x = (e.clientX / app.w) * 2 - 1; app.pointer.y = -((e.clientY / app.h) * 2 - 1);
      if (app.pointer.down) {
        const dx = e.clientX - app.pointer.px, dy = e.clientY - app.pointer.py;
        app.pointer.moved += Math.abs(dx) + Math.abs(dy);
        app.pointer.px = e.clientX; app.pointer.py = e.clientY;
        if (e.pointerType === "touch" && app.current && !app.current.dragScroll) { app.scroll.target -= dy * 2.2; }
        if (app.current && !app.busy) app.current.onDrag(dx, dy);
      }
    });
    addEventListener("pointerup", (e) => {
      const wasTap = app.pointer.down && app.pointer.moved < 8;
      app.pointer.down = false; document.body.classList.remove("is-down");
      if (wasTap && app.current && !app.busy) {
        if (e.pointerType === "touch") { app.pointer.x = (e.clientX / app.w) * 2 - 1; app.pointer.y = -((e.clientY / app.h) * 2 - 1); raycast(); }
        if (app.current.hovered?.userData.onClick) app.current.hovered.userData.onClick();
      }
    });
    addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") app.scroll.target += 120;
      if (e.key === "ArrowUp" || e.key === "PageUp") app.scroll.target -= 120;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { const d = e.key === "ArrowLeft" ? -1 : 1; if (app.current?.onArrow) app.current.onArrow(d); else app.scroll.target += d * 160; }
      if (e.key === "Enter" && app.current?.hovered?.userData.onClick) app.current.hovered.userData.onClick();
      if (e.key === "Escape") { closeModal(); closeMap(); $("#ach").classList.remove("is-on"); }
    });
    addEventListener("resize", () => {
      app.w = innerWidth; app.h = innerHeight;
      app.renderer.setSize(app.w, app.h);
      app.current?.resize(app.w, app.h);
    });
    $("#btnMap").addEventListener("click", openMap);
    $("#mapClose").addEventListener("click", closeMap);
    $("#btnBack").addEventListener("click", () => go("home", { inside: true }));
    $("#btnAudio").addEventListener("click", () => { setAudio(!app.audio); sound("click"); });
    $("#btnAch").addEventListener("click", () => { $("#ach").classList.toggle("is-on"); $("#btnAch").classList.remove("has-new"); sound("click"); });
    $("#achClose").addEventListener("click", () => $("#ach").classList.remove("is-on"));
    $("#modalClose").addEventListener("click", closeModal);
    $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
    $("#map").addEventListener("click", (e) => { if (e.target.id === "map") closeMap(); });
  }

  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  function raycast() {
    const s = app.current; if (!s || !s.interactives.length) return;
    v2.set(app.pointer.x, app.pointer.y);
    ray.setFromCamera(v2, s.camera);
    const hits = ray.intersectObjects(s.interactives, true);
    let obj = hits[0]?.object || null;
    while (obj && !obj.userData.onClick && obj.parent) obj = obj.parent;
    s.setHover(obj && obj.userData.onClick ? obj : null);
  }

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const s = app.current; if (!s) return;
    if (!s.wrapScroll) app.scroll.target = clamp(app.scroll.target, 0, s.scrollMax);
    app.scroll.v = lerp(app.scroll.v, app.scroll.target, 1 - Math.pow(0.05, dt));
    s.time += dt;
    s.update(dt);
    if (!app.pointer.down) raycast();
    app.renderer.render(s.scene, s.camera);
  }

  async function boot() {
    app.renderer = new THREE.WebGLRenderer({ canvas: $("#gl"), antialias: true, powerPreference: "high-performance" });
    app.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    app.renderer.setSize(app.w, app.h);
    app.renderer.outputColorSpace = THREE.SRGBColorSpace;
    bindInput(); buildIntro(); buildMap(); renderAch(); setAudio(app.audio);
    await TEAR.load(async () => {
      await document.fonts.ready;
      await Promise.all(["700 20px 'Gloria Hallelujah'", "700 20px 'Caveat'", "600 20px 'Inter'"].map((f) => document.fonts.load(f).catch(() => {})));
      swap("home", {});
    });
    loop();
    await TEAR.open();
    app.busy = false;
    app.current.onEnter?.();
  }

  return { app, BaseScene, go, hint, unlock, sound, modal, boot };
})();

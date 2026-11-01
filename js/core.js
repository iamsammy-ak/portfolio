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
  app.night = false;
  try { app.night = localStorage.getItem("ak_night") === "1"; } catch (_) {}

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
    /* night: tint every surface, swap the sky, light up the stars. Scenes can
       set outdoor, nightTint, nightBg and nightSkip (a Set of materials to leave alone). */
    applyNight(on, instant) {
      if (!this._nm) {
        this._nm = [];
        const skip = this.nightSkip || new Set();
        this.scene.traverse((o) => [].concat(o.material || []).forEach((m) => { if (m && m.color && m.blending !== THREE.AdditiveBlending && !skip.has(m) && !this._nm.includes(m)) this._nm.push(m); }));
        this._dayBg = this.scene.background;
        if (this.outdoor) {
          this._nightBg = this.nightBg || SK.gradientTex("#0b1430", "#3a3f6a", "#1f2d58");
          const st = SK.plane(ART.stars(), 260, 110, { fog: false }); st.position.set(0, 40, -110); st.material.opacity = 0; st.material.depthWrite = false; this.scene.add(st);
          const mo = SK.plane(ART.moon(), 7, undefined, { fog: false }); mo.position.set(14, 26, -100); mo.material.opacity = 0; mo.material.depthWrite = false; this.scene.add(mo);
          this._nightSky = [st, mo];
        } else this._nightBg = this.nightBg || null;
        this._dayFog = this.scene.fog ? this.scene.fog.color.clone() : null;
      }
      const tint = new THREE.Color(this.nightTint || (this.outdoor ? "#7c86b8" : "#a99c8a")), white = new THREE.Color(1, 1, 1);
      const fogNight = new THREE.Color(this.outdoor ? "#1a2244" : "#2c2a30");
      const k = { v: this._nk || 0 };
      gsap.to(k, {
        v: on ? 1 : 0, duration: instant ? 0 : 1.4, ease: "power2.inOut", overwrite: true,
        onUpdate: () => {
          this._nk = k.v;
          const mul = white.clone().lerp(tint, k.v);
          this._nm.forEach((m) => { m.userData.dayColor = m.userData.dayColor || m.color.clone(); m.color.copy(m.userData.dayColor).multiply(mul); });
          (this._nightSky || []).forEach((m) => (m.material.opacity = k.v));
          if (this._dayFog && this.scene.fog) this.scene.fog.color.copy(this._dayFog).lerp(fogNight, k.v);
          if (this._nightBg) this.scene.background = k.v > 0.5 ? this._nightBg : this._dayBg;
          else if (this._dayBg && this._dayBg.isColor) this.scene.background = this._dayBg.clone().lerp(new THREE.Color("#262a3a"), k.v);
        },
      });
    }
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

  /* ---------- sounds: see js/audio.js ---------- */
  const sound = (kind) => AUDIO.sound(kind);

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
    $("#introLinks").innerHTML = links.map(([l, u]) => l === "CV" ? `<a href="#cv" data-cv>CV <span aria-hidden="true">↗</span></a>` : `<a href="${u}" target="_blank" rel="noopener">${l} <span aria-hidden="true">↗</span></a>`).join("");
    $("#introLinks [data-cv]")?.addEventListener("click", (e) => { e.preventDefault(); CV.open(); });
    $("#introBrief")?.addEventListener("click", (e) => { e.preventDefault(); openBrief(); });
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
      code: `<rect x="-28" y="-20" width="56" height="36" rx="4"/><path d="M-10 -8 L-18 -1 L-10 6 M10 -8 L18 -1 L10 6 M4 -11 L-4 9" />`,
    };
    let s = `<rect class="mp__floor" x="250" y="90" width="28" height="330" /><g class="mp__line"><path d="M250 420 L250 90" /><path d="M250 420 L250 90" transform="translate(28 0)" /></g>`;
    s += `<g class="mp__end" transform="translate(264 60)"><rect x="-24" y="-28" width="48" height="56"/><path d="M-24 -9 L24 -9 M-24 10 L24 10 M-6 -19 L6 -19 M-6 0 L6 0 M-6 19 L6 19"/><text y="-38" class="mp__inf">my CVs</text></g>`;
    rooms.forEach((r) => {
      const y = 400 + (r.z / 50) * 300, left = r.side === "left";
      const bx = left ? 232 : 282;
      s += `<g class="mp__room" data-room="${r.id}" transform="translate(${bx} ${y})"><rect x="-16" y="-16" width="32" height="32"/></g>`;
      const ix = left ? 186 : 342;
      s += `<g class="mp__icon" transform="translate(${ix} ${y}) scale(0.8)">${icons[r.icon] || ""}</g>`;
      s += `<text class="mp__label" x="${left ? ix - 34 : ix + 34}" y="${y + 6}" text-anchor="${left ? "end" : "start"}">${r.label}</text>`;
    });
    s += `<g class="mp__pin" id="mapPin"><circle r="14" class="mp__pinring"/><path class="mp__pinbody" d="M0 -4 l-6 -14 l12 0 z M-5 -18 l10 0 M0 -4 l0 10" /><text class="mp__you" x="20" y="-10">you are here</text></g>`;
    svg.innerHTML = s;
    svg.querySelectorAll(".mp__room").forEach((g) => g.addEventListener("click", () => { closeMap(); go(g.dataset.room); }));
    svg.querySelector(".mp__end").addEventListener("click", () => { closeMap(); CV.open(); });
  }
  function setPin(name) {
    const pin = $("#mapPin"); if (!pin) return;
    const r = D.corridor.rooms.find((x) => x.id === name);
    if (!r) { pin.setAttribute("transform", "translate(264 440)"); return; }
    const y = 400 + (r.z / 50) * 300, bx = r.side === "left" ? 232 : 282;
    pin.setAttribute("transform", `translate(${bx} ${y + 2})`);
  }
  const openMap = () => { $("#map").classList.add("is-on"); sound("click"); };
  const closeMap = () => $("#map").classList.remove("is-on");

  /* ---------- "At a glance": a plain one-page summary for recruiters ---------- */
  function buildBrief() {
    const m = D.meta, A = D.about, esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const repos = GH.list.slice(0, 4);
    const projects = D.gallery.projects.slice(0, 3);
    $("#briefBody").innerHTML = `
      <header class="brief__head">
        <div>
          <h2 class="brief__name">${esc(m.name)}</h2>
          <p class="brief__role">${esc(m.role)} · ${esc(m.location)}</p>
          <p class="brief__avail">${esc(m.availability || "")}</p>
        </div>
        <nav class="brief__cta" aria-label="Contact">
          <button class="cv__btn cv__btn--main" type="button" data-cv>Read my CV</button>
          <a class="cv__btn" href="mailto:${esc(m.email)}">Email me</a>
          <a class="cv__btn" href="${esc(m.links.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
          <a class="cv__btn" href="${esc(m.links.github)}" target="_blank" rel="noopener">GitHub</a>
        </nav>
      </header>
      <p class="brief__sum">${esc(m.summary || "")}</p>
      <div class="brief__grid">
        <section class="brief__main">
          <h3>Experience</h3>
          <ol class="brief__xp">${D.studio.items.map((it) => `<li><div class="brief__xphead"><b>${esc(it.title)}</b><span>${esc(it.period)}</span></div><p class="brief__org">${esc(it.org)}</p>${it.bullets?.length ? `<ul>${it.bullets.slice(0, 2).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}</li>`).join("")}</ol>
          <h3>Selected work</h3>
          <ul class="brief__work">
            ${projects.map((p) => `<li><b>${esc(p.title)}</b> <span class="brief__tag">${esc(p.badge || "")}</span><p>${esc(p.summary)}</p></li>`).join("")}
            ${repos.map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener"><b>${esc(r.title)}</b></a> <span class="brief__tag">${esc(r.language || "Code")}</span><p>${esc(r.description || "")}</p></li>`).join("")}
          </ul>
        </section>
        <aside class="brief__side">
          <h3>Education</h3>
          <ul class="brief__plain">${(D.education || []).map((e) => `<li><b>${esc(e.degree)}</b><br>${esc(e.school)} · ${esc(e.years)}</li>`).join("")}</ul>
          <h3>Skills</h3>
          <p class="brief__chips">${A.skills.items.map((s) => `<span>${esc(s)}</span>`).join("")}</p>
          <h3>Certificates</h3>
          <ul class="brief__plain">${A.awards.items.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
          <h3>Languages</h3>
          <ul class="brief__plain">${A.languages.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
        </aside>
      </div>`;
    $("#briefBody [data-cv]").addEventListener("click", () => { closeBrief(); CV.open(); });
  }
  function openBrief(fromHistory) {
    buildBrief(); $("#brief").classList.add("is-on"); sound("open");
    if (!fromHistory) try { history.pushState({ room: "brief" }, "", "#brief"); } catch (_) {}
    setTimeout(() => $("#briefClose").focus({ preventScroll: true }), 50);
  }
  function closeBrief(fromHistory) {
    const el = $("#brief"); if (!el || !el.classList.contains("is-on")) return;
    el.classList.remove("is-on");
    if (!fromHistory && history.state?.room === "brief") history.back();
  }

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
      ${(item.links || (item.link ? [{ label: "Open project", url: item.link }] : [])).length ? `<p class="modal__links">${(item.links || [{ label: "Open project", url: item.link }]).map((l, i) => `<a class="modal__link${i === 0 ? " is-main" : ""}" href="${l.url}" target="_blank" rel="noopener">${l.label} ↗</a>`).join("")}</p>` : ""}`;
    m.classList.add("is-on"); sound("pop");
  }
  const closeModal = () => $("#modal").classList.remove("is-on");

  function setAudio(on) {
    app.audio = on; $("#btnAudio").classList.toggle("is-off", !on); AUDIO.setOn(on);
    $("#soundOn")?.setAttribute("aria-checked", on);
    try { localStorage.setItem("ak_audio", on ? "on" : "off"); } catch (_) {}
  }

  /* ---------- day and night, for the whole site ---------- */
  function setNight(on, instant) {
    app.night = !!on;
    try { localStorage.setItem("ak_night", on ? "1" : "0"); } catch (_) {}
    app.current?.applyNight?.(app.night, instant);
    AUDIO.setNight(app.night);
    if (!instant) sound(on ? "night" : "day");
    document.querySelectorAll("#soundPanel [data-night]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.night === (on ? "1" : "0"))));
    document.body.classList.toggle("is-night", app.night);
  }

  /* ---------- sound & light panel ---------- */
  function bindSoundPanel() {
    const panel = $("#soundPanel"), V = AUDIO.volumes;
    [["volMusic", "music"], ["volAmb", "amb"], ["volSfx", "sfx"]].forEach(([id, kind]) => {
      const el = $("#" + id); el.value = Math.round(V[kind] * 100);
      el.addEventListener("input", () => { AUDIO.setVolume(kind, el.value / 100); if (kind === "sfx") sound("tick"); });
    });
    $("#soundOn").addEventListener("click", () => { setAudio(!app.audio); if (app.audio) AUDIO.startMusic(); });
    panel.querySelectorAll("[data-night]").forEach((b) => b.addEventListener("click", () => setNight(b.dataset.night === "1")));
    const now = () => ($("#soundNow").textContent = AUDIO.title);
    AUDIO.onChange(now); now();
    $("#btnAudio").addEventListener("click", () => { panel.classList.toggle("is-on"); sound("click"); });
    $("#soundClose").addEventListener("click", () => panel.classList.remove("is-on"));
  }

  /* upload textures and compile shaders while the paper still covers the screen */
  function prewarm(s) {
    try {
      app.renderer.compile(s.scene, s.camera);
      s.scene.traverse((o) => [].concat(o.material || []).forEach((m) => { if (m && m.map) app.renderer.initTexture(m.map); }));
    } catch (_) {}
  }

  /* ---------- scene switching ---------- */
  const keyOf = (name, opts) => (name === "home" ? (opts.inside ? "hall" : "") : name);
  function pushRoom(key) { try { if (location.hash.slice(1) !== key) history.pushState({ room: key }, "", "#" + key); } catch (_) {} }
  async function go(name, opts = {}) {
    if (app.busy) return;
    if (app.current?.name === name && !opts.force && !(name === "home" && opts.inside && !app.current.entered)) return;
    app.busy = true; closeModal(); closeMap(); closeBrief(); $("#ach").classList.remove("is-on");
    if (!opts.fromHistory) pushRoom(keyOf(name, opts));
    AUDIO.setMood(name === "home" ? (opts.inside ? "hall" : "outside") : name);
    sound("tear");
    await TEAR.close();
    swap(name, opts);
    app.current?.onSwap?.();
    await TEAR.open();
    app.busy = false;
    app.current?.onEnter?.();
  }
  // the browser's back / forward buttons walk you between rooms
  function onPop() {
    const key = location.hash.slice(1);
    if (CV.isOpen && key !== "cv") { CV.close(true); return; }
    if (key === "cv") { CV.open(); return; }
    if (key === "brief") { openBrief(true); return; }
    if ($("#brief").classList.contains("is-on")) closeBrief(true);
    const from = app.current?.name;
    if (key === "" ) go("home", { fromHistory: true, force: app.current?.entered });
    else if (key === "hall") go("home", { inside: true, from, fromHistory: true });
    else if (SCENES[key]) go(key, { fromHistory: true });
  }
  function swap(name, opts) {
    // the house + corridor is the heaviest scene: build it once and keep it
    if (app.current && app.current === app.home) app.current.suspend?.();
    else if (app.current) app.current.dispose();
    app.scroll.v = 0; app.scroll.target = 0;
    if (name === "home" && app.home) { app.current = app.home; app.current.resume(opts); }
    else {
      const S = SCENES[name] || SCENES.home;
      app.current = new S(opts); app.current.name = name;
      if (name === "home") app.home = app.current;
    }
    app.current.resize(app.w, app.h);
    app.current.applyNight(app.night, true);
    prewarm(app.current);
    $("#btnBack").classList.toggle("is-hidden", name === "home");
    document.body.classList.toggle("is-drag", !!app.current.dragScroll);
    $("#intro").classList.toggle("is-on", name === "home" && !opts.inside);
    setPin(name);
    document.title = `${name === "home" ? "" : name[0].toUpperCase() + name.slice(1) + " — "}${D.meta.name} · Portfolio`;
  }

  /* ---------- input ---------- */
  function bindInput() {
    const c = app.renderer.domElement;
    addEventListener("wheel", (e) => {
      // a sideways trackpad swipe is the browser's "go back" gesture; over the 3D world it must only turn you
      const inPanel = e.target.closest?.(".cv__desk, .sheet, .ach, .cv__rail");
      if (!inPanel) e.preventDefault();
      if (!app.current || app.busy || CV.isOpen || $("#modal").classList.contains("is-on") || $("#map").classList.contains("is-on")) return;
      const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? app.h : 1;
      const dy = e.deltaY * k, dx = e.deltaX * k;
      // sideways trackpad swipes: look around in the corridor, slide the clothesline in the gallery
      const sign = app.current.scrollSign ? app.current.scrollSign() : 1;
      if (Math.abs(dx) > Math.abs(dy)) { if (app.current.onPan) app.current.onPan(dx); else app.scroll.target += dx; }
      else app.scroll.target += SK.clamp(dy, -160, 160) * sign;
    }, { passive: false });
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
        if (e.pointerType === "touch" && app.current && !app.current.dragScroll) { app.scroll.target -= dy * 2.2 * (app.current.scrollSign ? app.current.scrollSign() : 1); }
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
      if (CV.isOpen || e.target.closest?.("input, textarea, a, button") && e.key === " ") return;
      if ($("#brief").classList.contains("is-on")) { if (e.key === "Escape") closeBrief(); return; }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const step = { ArrowDown: 1, PageDown: 1, " ": 1, ArrowUp: -1, PageUp: -1, w: -1, s: 1 }[k];
      if (step) {
        const sign = app.current?.scrollSign ? app.current.scrollSign() : 1;
        // W walks forward, S walks back, whichever way you are facing
        const d = k === "w" ? 1 : k === "s" ? -1 : step;
        if (app.current?.onStep) app.current.onStep(k === "w" || k === "s" ? (k === "w" ? 1 : -1) : step);
        else app.scroll.target += (k === "w" || k === "s" ? d * sign : step) * 220;
      }
      if (k === "a" || k === "d") app.current?.onArrow?.(k === "a" ? -1 : 1);
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.target.closest?.("[role=tablist]")) { const d = e.key === "ArrowLeft" ? -1 : 1; if (app.current?.onArrow) app.current.onArrow(d); else app.scroll.target += d * 160; }
      if (e.key === "Enter" && app.current?.hovered?.userData.onClick) app.current.hovered.userData.onClick();
      if (e.key === "Escape") { closeModal(); closeMap(); $("#ach").classList.remove("is-on"); $("#soundPanel").classList.remove("is-on"); }
    });
    addEventListener("resize", () => {
      app.w = innerWidth; app.h = innerHeight;
      app.renderer.setSize(app.w, app.h);
      app.current?.resize(app.w, app.h);
    });
    $("#btnMap").addEventListener("click", openMap);
    $("#btnCV").addEventListener("click", () => CV.open());
    $("#mapClose").addEventListener("click", closeMap);
    $("#btnBack").addEventListener("click", () => go("home", { inside: true, from: app.current?.name }));
    $("#btnBrief").addEventListener("click", () => openBrief());
    $("#briefClose").addEventListener("click", () => closeBrief());
    $("#brief").addEventListener("click", (e) => { if (e.target.id === "brief") closeBrief(); });
    addEventListener("popstate", onPop);
    // music starts the first time someone interacts (browsers block autoplay)
    const kick = () => { if (app.audio) AUDIO.startMusic(); removeEventListener("pointerdown", kick); removeEventListener("keydown", kick); };
    addEventListener("pointerdown", kick); addEventListener("keydown", kick);
    bindSoundPanel();
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
    // heavy, cinematic easing: the camera glides to where the wheel pointed it
    app.scroll.v = lerp(app.scroll.v, app.scroll.target, 1 - Math.pow(0.04, dt));
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
    document.body.classList.toggle("is-night", app.night);
    document.querySelectorAll("#soundPanel [data-night]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.night === (app.night ? "1" : "0"))));
    GH.refresh();
    const want = location.hash.slice(1);
    await TEAR.load(async () => {
      await document.fonts.ready;
      await Promise.all(["700 20px 'Gloria Hallelujah'", "700 20px 'Caveat'", "600 20px 'Inter'", "400 20px 'Sedgwick Ave Display'", "400 20px 'Permanent Marker'"].map((f) => document.fonts.load(f).catch(() => {})));
      swap("home", {});
    });
    loop();
    await TEAR.open();
    app.busy = false;
    app.current.onEnter?.();
    // shared links: #lab, #gallery … open that room, #cv opens the CV folder
    try { history.replaceState({ room: "" }, "", location.pathname + location.search); } catch (_) {}
    if (want === "cv") CV.open();
    else if (want === "brief") openBrief();
    else if (want === "hall") go("home", { inside: true });
    else if (SCENES[want] && want !== "home") go(want);
  }

  return { app, BaseScene, go, hint, unlock, sound, modal, boot, pushRoom, setNight };
})();

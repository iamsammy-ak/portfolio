/* cv.js — the CV folder.
   Every CV becomes a tab. PDFs are rendered on the page with pdf.js (loaded
   only when the folder is first opened), so the latest file is always what
   people read. On the live site any PDF dropped into assets/cv/ is found
   through the GitHub API and gets its own tab. */
window.CV = (() => {
  const P = window.PORTFOLIO, C = P.cv || { files: [] };
  const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  const TINTS = ["#fbe8b5", "#d6e6f7", "#d4ecd2", "#f9d5d3", "#e8d9f5", "#fde0c4"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s) => document.querySelector(s);

  const pretty = (f) => f.replace(/\.pdf$/i, "").replace(/^.*\//, "").replace(/[-_]+/g, " ").replace(/\s*cv\s*$/i, "").trim().replace(/\b\w/g, (c) => c.toUpperCase()) || "CV";
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  /* ---------- which CVs exist ---------- */
  function repoSlug() {
    // https://<user>.github.io/<repo>/  →  <user>/<repo>
    const h = location.hostname.match(/^([^.]+)\.github\.io$/i);
    if (!h) return null;
    const seg = location.pathname.split("/").filter(Boolean)[0];
    return `${h[1]}/${seg && !/\.html?$/.test(seg) ? seg : h[1] + ".github.io"}`;
  }
  let listing = null;
  function list() {
    if (listing) return listing;
    const base = (C.files || []).map((f) => ({ ...f, id: slug(f.role), role: f.role || pretty(f.file) }));
    const repo = repoSlug();
    if (!repo || !C.folder) return (listing = Promise.resolve(base));
    listing = fetch(`https://api.github.com/repos/${repo}/contents/${C.folder}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((items) => {
        const out = base.slice();
        (Array.isArray(items) ? items : []).filter((it) => /\.pdf$/i.test(it.name)).forEach((it) => {
          const known = out.find((f) => f.file === it.path);
          const v = `?v=${it.sha.slice(0, 7)}`; // new upload → new URL → no stale cache
          if (known) known.file = it.path + v;
          else out.push({ id: slug(pretty(it.name)), role: pretty(it.name), file: it.path + v, note: "" });
        });
        return out;
      })
      .catch(() => base);
    return listing;
  }

  /* ---------- pdf.js, loaded on demand ---------- */
  let pdfjs = null;
  function loadPdfJs() {
    if (pdfjs) return pdfjs;
    pdfjs = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = PDFJS + "pdf.min.js";
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js"; res(window.pdfjsLib); };
      s.onerror = () => rej(new Error("pdf.js unavailable"));
      document.head.appendChild(s);
    });
    return pdfjs;
  }

  /* ---------- DOM ---------- */
  const el = {};
  let files = [], current = null, isOpen = false, busy = false, lastFocus = null;
  const rendered = new Map(); // id → <div> of page canvases, so switching back is instant

  function build() {
    if (el.root) return;
    el.root = $("#cv"); el.folder = $("#cvFolder"); el.tabs = $("#cvTabs"); el.desk = $("#cvDesk");
    el.sheet = $("#cvSheet"); el.pages = $("#cvPages"); el.pocket = $("#cvPocket");
    el.title = $("#cvTitle"); el.note = $("#cvNote"); el.meta = $("#cvMeta");
    el.dl = $("#cvDownload"); el.open = $("#cvOpen"); el.mail = $("#cvMail"); el.status = $("#cvStatus");
    $("#cvClose").addEventListener("click", close);
    el.root.addEventListener("click", (e) => { if (e.target.dataset.close !== undefined) close(); });
    el.root.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.stopPropagation(); close(); }
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && files.length > 1 && !e.target.closest(".cv__desk")) {
        e.preventDefault();
        const i = files.indexOf(current), n = files.length;
        show(files[(i + (e.key === "ArrowLeft" ? -1 : 1) + n) % n]);
        el.tabs.querySelector('[aria-selected="true"]')?.focus();
      }
      if (e.key === "Tab") { // keep focus inside the folder
        const f = [...el.folder.querySelectorAll("button, a[href], [tabindex='0']")].filter((x) => x.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  function renderTabs() {
    el.tabs.innerHTML = files.map((f, i) => `<button role="tab" class="cv__tab" id="cvtab-${f.id}" data-id="${f.id}" style="--tint:${f.color || TINTS[i % TINTS.length]}" aria-selected="false" tabindex="-1">${f.role}</button>`).join("");
    el.tabs.querySelectorAll(".cv__tab").forEach((b) => b.addEventListener("click", () => show(files.find((f) => f.id === b.dataset.id))));
    el.tabs.classList.toggle("is-single", files.length < 2);
  }

  const fmtDate = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  async function stamp(f) {
    if (f.updated !== undefined || location.protocol === "file:") return f.updated;
    try {
      const r = await fetch(f.file, { method: "HEAD", cache: "no-cache" });
      const lm = r.headers.get("last-modified");
      f.updated = lm ? new Date(lm) : null;
    } catch (_) { f.updated = null; }
    return f.updated;
  }

  async function renderPdf(f) {
    if (rendered.has(f.id)) return rendered.get(f.id);
    const wrap = document.createElement("div");
    wrap.className = "cv__doc";
    try {
      const lib = await loadPdfJs();
      const doc = await lib.getDocument(f.file).promise;
      f.pages = doc.numPages;
      const width = Math.min(el.desk.clientWidth - 32, 860);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        const vp = page.getViewport({ scale: (width * dpr) / page.getViewport({ scale: 1 }).width });
        const cnv = document.createElement("canvas");
        cnv.width = vp.width; cnv.height = vp.height; cnv.className = "cv__page";
        cnv.setAttribute("role", "img"); cnv.setAttribute("aria-label", `${f.role} CV, page ${n} of ${doc.numPages}`);
        await page.render({ canvasContext: cnv.getContext("2d"), viewport: vp }).promise;
        wrap.appendChild(cnv);
      }
    } catch (err) {
      // file:// pages and blocked CDNs: let the browser's own viewer show it
      f.pages = 0;
      wrap.innerHTML = `<iframe class="cv__frame" src="${f.file}#view=FitH" title="${f.role} CV"></iframe>`;
    }
    rendered.set(f.id, wrap);
    return wrap;
  }

  function fillRail(f) {
    el.title.textContent = f.role;
    el.note.textContent = f.note || "";
    el.note.hidden = !f.note;
    const bits = [];
    if (f.updated) bits.push(`Updated ${fmtDate(f.updated)}`);
    if (f.pages) bits.push(`${f.pages} page${f.pages > 1 ? "s" : ""}`);
    el.meta.textContent = bits.join(" · ");
    el.dl.href = f.file; el.dl.setAttribute("download", `Abhishek_Kumar_CV_${f.role.replace(/\s+/g, "_")}.pdf`);
    el.open.href = f.file;
    el.mail.href = `mailto:${P.meta.email}?subject=${encodeURIComponent(`About your ${f.role} CV`)}`;
  }

  async function show(f) {
    if (!f || (f === current && el.pages.firstChild) || busy) return;
    busy = true;
    const first = !current || !el.pages.firstChild;
    current = f;
    el.tabs.querySelectorAll(".cv__tab").forEach((b) => {
      const on = b.dataset.id === f.id;
      b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1;
    });
    el.desk.setAttribute("aria-labelledby", `cvtab-${f.id}`);
    el.root.classList.add("is-shuffling");
    // the old sheet slides back into the folder pocket…
    if (!first) await gsap.to(el.sheet, { yPercent: 70, rotation: 1.6, duration: reduce ? 0 : 0.38, ease: "power2.in" });
    else gsap.set(el.sheet, { yPercent: 70, rotation: 1.6 });
    el.status.hidden = false;
    fillRail(f);
    const [doc] = await Promise.all([renderPdf(f), stamp(f)]);
    fillRail(f);
    el.status.hidden = true;
    el.pages.replaceChildren(doc);
    el.desk.scrollTop = 0;
    // …and the new one is pulled out
    await gsap.to(el.sheet, { yPercent: 0, rotation: -0.5, duration: reduce ? 0 : 0.7, ease: "power3.out" });
    el.root.classList.remove("is-shuffling");
    busy = false;
    window.CORE?.unlock("recruiter");
  }

  async function open(id) {
    build();
    if (isOpen) { if (id) show(files.find((f) => f.id === id) || files[0]); return; }
    isOpen = true; lastFocus = document.activeElement;
    files = await list();
    if (!files.length) { isOpen = false; return; }
    renderTabs();
    document.body.classList.add("cv-open");
    el.root.hidden = false; el.root.setAttribute("aria-hidden", "false");
    window.CORE?.sound("whoosh");
    gsap.fromTo(el.root.querySelector(".cv__scrim"), { opacity: 0 }, { opacity: 1, duration: reduce ? 0 : 0.35 });
    gsap.set(el.sheet, { yPercent: 70, rotation: 1.6 });
    await gsap.fromTo(el.folder, { yPercent: 105, rotation: -4 }, { yPercent: 0, rotation: -0.4, duration: reduce ? 0 : 0.75, ease: "back.out(1.15)" });
    $("#cvClose").focus({ preventScroll: true });
    current = null;
    await show(files.find((f) => f.id === id) || files[0]);
    try { if (location.hash !== "#cv") history.pushState({ room: "cv" }, "", "#cv"); } catch (_) {}
  }

  async function close(fromHistory) {
    if (!isOpen) return;
    if (!fromHistory && history.state?.room === "cv") { history.back(); return; }
    isOpen = false;
    window.CORE?.sound("close");
    gsap.to(el.root.querySelector(".cv__scrim"), { opacity: 0, duration: reduce ? 0 : 0.3 });
    await gsap.to(el.folder, { yPercent: 105, rotation: 3, duration: reduce ? 0 : 0.5, ease: "power2.in" });
    el.root.hidden = true; el.root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cv-open");
    lastFocus?.focus?.({ preventScroll: true });
  }

  return { list, open, close, get isOpen() { return isOpen; } };
})();

/* main.js — boot the experience */
(() => {
  if (!window.THREE || !window.gsap) {
    document.body.insertAdjacentHTML("beforeend", "<p style='position:fixed;inset:0;display:grid;place-items:center;font-family:Inter,sans-serif'>Couldn't load three.js / GSAP — check your internet connection.</p>");
    return;
  }
  CORE.boot();
})();

/* audio.js — every sound on the site is synthesised here with Web Audio:
   a soft generative lo-fi loop and the paper / wood / footstep effects.
   Nothing is downloaded. To use your own (licensed) track instead of the
   generated music, set PORTFOLIO.audio.music to an mp3 path in data.js. */
window.AUDIO = (() => {
  const cfg = (window.PORTFOLIO && window.PORTFOLIO.audio) || {};
  let ctx = null, master, sfxBus, musicBus, wet, on = true, musicWanted = false, musicPlaying = false, timer = 0, track = null;

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = on ? 0.9 : 0; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    // a small room reverb from decaying noise
    const conv = ctx.createConvolver(), len = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    conv.buffer = ir; wet = ctx.createGain(); wet.gain.value = 0.32; conv.connect(wet); wet.connect(master);
    wet.input = conv;
    document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
    return ctx;
  }

  const noise = (() => { let buf = null; return () => { if (buf) return buf; buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return buf; }; })();
  function env(g, t, a, peak, dec) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function osc(type, f, t, dur, peak, dest, a = 0.005) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(g); g.connect(dest); env(g, t, a, peak, dur); o.start(t); o.stop(t + a + dur + 0.05); return o; }
  function noiseHit(t, dur, peak, filter, f, q = 1, dest = sfxBus, rate = 1) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise(); s.playbackRate.value = rate; fl.type = filter; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    s.connect(fl); fl.connect(g); g.connect(dest); env(g, t, 0.004, peak, dur); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    return fl;
  }

  /* ---------- effects ---------- */
  const FX = {
    click(t) { osc("triangle", 1250, t, 0.05, 0.06, sfxBus); },
    pop(t) { const o = osc("sine", 520, t, 0.12, 0.07, sfxBus); o.frequency.exponentialRampToValueAtTime(980, t + 0.08); },
    flip(t) { noiseHit(t, 0.06, 0.12, "highpass", 2600, 0.7); osc("triangle", 700, t, 0.04, 0.03, sfxBus); },
    step(t) { noiseHit(t, 0.08, 0.16, "lowpass", 420 + Math.random() * 160, 0.8, sfxBus, 0.7 + Math.random() * 0.4); },
    creak(t, dur = 0.5) {
      const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(95 + Math.random() * 30, t); o.frequency.linearRampToValueAtTime(140 + Math.random() * 40, t + dur);
      lfo.frequency.value = 9 + Math.random() * 6; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.frequency);
      bp.type = "bandpass"; bp.frequency.value = 1100; bp.Q.value = 7;
      o.connect(bp); bp.connect(g); g.connect(sfxBus); env(g, t, 0.06, 0.05, dur);
      o.start(t); lfo.start(t); o.stop(t + dur + 0.2); lfo.stop(t + dur + 0.2);
    },
    door(t) { FX.creak(t, 0.9); FX.close(t + 0.95, 0.5); },
    close(t, k = 1) { const o = osc("sine", 110, t, 0.28, 0.16 * k, sfxBus); o.frequency.exponentialRampToValueAtTime(48, t + 0.25); noiseHit(t, 0.05, 0.08 * k, "lowpass", 900); },
    tear(t) {
      // paper: band-passed noise, swept down, with a ripped "crackle" envelope
      const f = noiseHit(t, 0.75, 0.22, "bandpass", 3200, 1.4);
      f.frequency.exponentialRampToValueAtTime(700, t + 0.7);
      for (let i = 0; i < 9; i++) noiseHit(t + i * 0.07 + Math.random() * 0.03, 0.03, 0.12, "highpass", 3000);
    },
    whoosh(t) { FX.tear(t); },
    unlock(t) { [784, 1175, 1568].forEach((f, i) => { osc("sine", f, t + i * 0.09, 0.9, 0.05, wet.input); osc("sine", f, t + i * 0.09, 0.5, 0.035, sfxBus); }); },
    open(t) { noiseHit(t, 0.25, 0.08, "bandpass", 1800, 0.8); osc("sine", 300, t, 0.2, 0.03, wet.input); },
  };

  function sound(kind) {
    if (!on || !init()) return;
    if (ctx.state === "suspended") ctx.resume();
    const f = FX[kind] || FX.click;
    try { f(ctx.currentTime + 0.01); } catch (_) {}
  }

  /* ---------- generative music: a slow lo-fi progression in F ---------- */
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59], [46, 50, 53, 57], [48, 52, 55, 58]]; // Fmaj7 Em7 Dm7 Cmaj7 Bbmaj7 C7
  const ORDER = [0, 1, 2, 3, 0, 1, 4, 5];
  const SCALE = [65, 67, 69, 72, 74, 76, 77, 79, 81]; // F major pentatonic-ish, up high like a music box
  const BEAT = 60 / 70;
  let next = 0, bar = 0, mel = 4;

  function pad(t, notes, dur) {
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 0.3; lp.connect(musicBus); lp.connect(wet.input);
    notes.forEach((m, i) => [-6, 6].forEach((det) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = i === 0 ? "sine" : "triangle"; o.frequency.value = N(m); o.detune.value = det;
      o.connect(g); g.connect(lp); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022, t + 1.4); g.gain.setValueAtTime(0.022, t + dur - 1.2); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
      o.start(t); o.stop(t + dur + 0.7);
    }));
  }
  function bell(t, m, v = 1) {
    [1, 2.01, 3.99].forEach((h, i) => osc(i ? "sine" : "triangle", N(m) * h, t, 1.6 / (i + 1), 0.03 * v / (i + 1), i ? musicBus : wet.input));
    osc("sine", N(m), t, 1.4, 0.028 * v, musicBus);
  }
  function bass(t, m) { const o = osc("sine", N(m - 12), t, BEAT * 1.6, 0.07, musicBus, 0.03); return o; }
  function hat(t) { noiseHit(t, 0.03, 0.018, "highpass", 7000, 0.7, musicBus); }
  function schedule() {
    while (next < ctx.currentTime + 0.6) {
      const ch = CHORDS[ORDER[bar % ORDER.length]], t = next, len = BEAT * 4;
      pad(t, ch, len);
      bass(t, ch[0]); bass(t + BEAT * 2.5, ch[0] + (bar % 2 ? 7 : 0));
      for (let e = 0; e < 8; e++) {
        const te = t + e * BEAT / 2 + (e % 2 ? 0.04 : 0); // a touch of swing
        if (e % 2) hat(te);
        if (Math.random() < (e % 2 ? 0.25 : 0.5)) { mel = Math.max(0, Math.min(SCALE.length - 1, mel + [-2, -1, -1, 0, 1, 1, 2][(Math.random() * 7) | 0])); bell(te, SCALE[mel], 0.7 + Math.random() * 0.4); }
      }
      next += len; bar++;
    }
  }

  function startMusic() {
    musicWanted = true;
    if (!on || musicPlaying || !init()) return;
    if (ctx.state === "suspended") ctx.resume();
    musicPlaying = true;
    if (cfg.music) {
      track = track || Object.assign(new Audio(cfg.music), { loop: true, volume: 0.35 });
      track.play().catch(() => { musicPlaying = false; });
      return;
    }
    next = ctx.currentTime + 0.1;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 4);
    schedule(); timer = setInterval(schedule, 200);
  }
  function stopMusic() {
    musicPlaying = false; clearInterval(timer);
    if (track) track.pause();
    if (ctx) { musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.4); }
  }

  function setOn(v) {
    on = v;
    if (ctx) master.gain.setTargetAtTime(v ? 0.9 : 0, ctx.currentTime, 0.15);
    if (!v) stopMusic(); else if (musicWanted) startMusic();
  }

  return { sound, setOn, startMusic, stopMusic, get on() { return on; } };
})();

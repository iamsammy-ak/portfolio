/* audio.js — every sound on the site is synthesised here with Web Audio.
   Each room has its own generative piece (a "mood"), plus an ambience layer
   (birds, crickets, wind, waves) and the effects: footsteps, door locks,
   creaks, paper tears. Nothing is downloaded. To use your own licensed track
   instead of the generated music, set PORTFOLIO.audio.music in data.js. */
window.AUDIO = (() => {
  const cfg = (window.PORTFOLIO && window.PORTFOLIO.audio) || {};
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (_) {} return null; };
  const vol = { master: 0.9, music: +(store("ak_vol_music") ?? 0.6), amb: +(store("ak_vol_amb") ?? 0.6), sfx: +(store("ak_vol_sfx") ?? 0.8) };
  let ctx = null, master, sfxBus, musicBus, ambBus, wet, on = true, musicWanted = false, musicPlaying = false, timer = 0, track = null;
  let moodName = "outside", mood = null, night = false;

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = on ? vol.master : 0; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = vol.sfx; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = 0; ambBus.connect(master);
    const conv = ctx.createConvolver(), len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    conv.buffer = ir; wet = ctx.createGain(); wet.gain.value = 0.3; conv.connect(wet); wet.connect(master); wet.input = conv;
    document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
    return ctx;
  }

  const noise = (() => { let buf = null; return () => { if (buf) return buf; buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return buf; }; })();
  function env(g, t, a, peak, dec) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function osc(type, f, t, dur, peak, dest, a = 0.005, pan = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(g);
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(dest); } else g.connect(dest);
    env(g, t, a, peak, dur); o.start(t); o.stop(t + a + dur + 0.05); return o;
  }
  function noiseHit(t, dur, peak, type, f, q = 1, dest = sfxBus, rate = 1, pan = 0) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise(); s.playbackRate.value = rate; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    s.connect(fl); fl.connect(g);
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(dest); } else g.connect(dest);
    env(g, t, 0.004, peak, dur); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    return fl;
  }

  /* ---------- effects ---------- */
  let foot = 1;
  const FX = {
    click(t) { osc("triangle", 1250, t, 0.05, 0.06, sfxBus); },
    tick(t) { osc("sine", 1800, t, 0.03, 0.025, sfxBus); },
    pop(t) { const o = osc("sine", 520, t, 0.12, 0.07, sfxBus); o.frequency.exponentialRampToValueAtTime(980, t + 0.08); },
    flip(t) { noiseHit(t, 0.06, 0.12, "highpass", 2600, 0.7); osc("triangle", 700, t, 0.04, 0.03, sfxBus); },
    // heel then toe on a wooden floor, alternating left and right foot
    step(t) {
      foot = -foot; const p = foot * 0.25, r = 0.85 + Math.random() * 0.3;
      const o = osc("sine", 95 * r, t, 0.09, 0.16, sfxBus, 0.003, p); o.frequency.exponentialRampToValueAtTime(55, t + 0.08);
      noiseHit(t, 0.07, 0.12, "lowpass", 380 * r, 0.9, sfxBus, r, p);
      noiseHit(t + 0.055, 0.035, 0.07, "bandpass", 1900 * r, 1.4, sfxBus, r, p);
      noiseHit(t + 0.02, 0.18, 0.02, "bandpass", 240, 6, wet.input, 1, p); // the boards ring a little
    },
    creak(t, dur = 0.55) {
      const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(90 + Math.random() * 30, t); o.frequency.linearRampToValueAtTime(150 + Math.random() * 50, t + dur);
      lfo.frequency.value = 8 + Math.random() * 7; lg.gain.value = 16; lfo.connect(lg); lg.connect(o.frequency);
      bp.type = "bandpass"; bp.frequency.value = 1050; bp.Q.value = 7;
      o.connect(bp); bp.connect(g); g.connect(sfxBus); g.connect(wet.input); env(g, t, 0.06, 0.055, dur);
      o.start(t); lfo.start(t); o.stop(t + dur + 0.2); lfo.stop(t + dur + 0.2);
    },
    // a key turning in an old lock: two metal clicks, the bolt sliding, the latch letting go
    latch(t) {
      [0, 0.13].forEach((d) => { noiseHit(t + d, 0.025, 0.2, "bandpass", 3400, 3); osc("square", 2600, t + d, 0.02, 0.03, sfxBus); });
      const f = noiseHit(t + 0.22, 0.2, 0.09, "bandpass", 1200, 2); f.frequency.exponentialRampToValueAtTime(2600, t + 0.4);
      const o = osc("sine", 190, t + 0.42, 0.18, 0.12, sfxBus); o.frequency.exponentialRampToValueAtTime(90, t + 0.58);
      noiseHit(t + 0.42, 0.05, 0.14, "lowpass", 1500);
    },
    door(t) { FX.latch(t); FX.creak(t + 0.5, 1.0); noiseHit(t + 0.6, 0.9, 0.05, "lowpass", 600, 0.5, wet.input); },
    close(t, k = 1) { const o = osc("sine", 110, t, 0.28, 0.16 * k, sfxBus); o.frequency.exponentialRampToValueAtTime(48, t + 0.25); noiseHit(t, 0.05, 0.09 * k, "lowpass", 900); noiseHit(t + 0.08, 0.02, 0.1 * k, "bandpass", 3200, 3); },
    tear(t) {
      const f = noiseHit(t, 0.75, 0.2, "bandpass", 3200, 1.4); f.frequency.exponentialRampToValueAtTime(700, t + 0.7);
      for (let i = 0; i < 9; i++) noiseHit(t + i * 0.07 + Math.random() * 0.03, 0.03, 0.1, "highpass", 3000);
    },
    whoosh(t) { FX.tear(t); },
    unlock(t) { [784, 1175, 1568].forEach((f, i) => { osc("sine", f, t + i * 0.09, 0.9, 0.05, wet.input); osc("sine", f, t + i * 0.09, 0.5, 0.035, sfxBus); }); },
    open(t) { noiseHit(t, 0.25, 0.08, "bandpass", 1800, 0.8); osc("sine", 300, t, 0.2, 0.03, wet.input); },
    // Sofia: two short barks; the cat: a rising-falling meow
    woof(t) {
      [0, 0.24].forEach((d) => {
        const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(260, t + d); o.frequency.exponentialRampToValueAtTime(150, t + d + 0.16);
        f.type = "bandpass"; f.frequency.value = 700; f.Q.value = 2.5; o.connect(f); f.connect(g); g.connect(sfxBus); g.connect(wet.input);
        env(g, t + d, 0.01, 0.22, 0.16); o.start(t + d); o.stop(t + d + 0.25);
        noiseHit(t + d, 0.1, 0.12, "bandpass", 900, 1.5);
      });
    },
    meow(t) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(820, t + 0.25); o.frequency.linearRampToValueAtTime(480, t + 0.7);
      lfo.frequency.value = 7; lg.gain.value = 12; lfo.connect(lg); lg.connect(o.frequency);
      f.type = "bandpass"; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1600, t + 0.3); f.frequency.linearRampToValueAtTime(800, t + 0.7); f.Q.value = 3;
      o.connect(f); f.connect(g); g.connect(sfxBus); g.connect(wet.input); env(g, t, 0.06, 0.12, 0.65);
      o.start(t); lfo.start(t); o.stop(t + 0.8); lfo.stop(t + 0.8);
    },
    night(t) { osc("square", 2200, t, 0.015, 0.04, sfxBus); [880, 660, 523].forEach((f, i) => osc("sine", f, t + 0.06 + i * 0.11, 0.8, 0.04, wet.input)); },
    day(t) { osc("square", 2200, t, 0.015, 0.04, sfxBus); [523, 660, 880].forEach((f, i) => osc("sine", f, t + 0.06 + i * 0.11, 0.8, 0.04, wet.input)); },
  };

  function sound(kind) {
    if (!on || !init()) return;
    if (ctx.state === "suspended") ctx.resume();
    try { (FX[kind] || FX.click)(ctx.currentTime + 0.01); } catch (_) {}
  }

  /* ---------- music: one generative piece per room ---------- */
  const Q = { maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], d7: [0, 4, 7, 10], m9: [0, 3, 7, 10, 14], sus: [0, 5, 7, 10], maj: [0, 4, 7, 12], min: [0, 3, 7, 12], add9: [0, 4, 7, 14] };
  const PENTA = { major: [0, 2, 4, 7, 9], minor: [0, 3, 5, 7, 10] };
  const MOODS = {
    outside: { title: "Garden morning", bpm: 76, meter: 4, key: 60, scale: "major", chords: [[60, "maj7"], [57, "m7"], [53, "maj7"], [55, "add9"]], lead: "pluck", beat: "soft", amb: "birds", level: 0.5 },
    hall:    { title: "Corridor lo-fi", bpm: 70, meter: 4, key: 65, scale: "major", chords: [[53, "maj7"], [52, "m7"], [50, "m7"], [48, "maj7"], [46, "maj7"], [48, "d7"]], lead: "bell", beat: "lofi", amb: null, level: 0.55 },
    gallery: { title: "Rooftop waltz", bpm: 84, meter: 3, key: 69, scale: "major", chords: [[57, "maj"], [54, "m7"], [50, "maj7"], [52, "sus"]], lead: "bell", beat: "none", amb: "wind", level: 0.5 },
    studio:  { title: "Office focus", bpm: 92, meter: 4, key: 62, scale: "minor", chords: [[50, "m9"], [46, "maj7"], [43, "m9"], [45, "sus"]], lead: "pluck", beat: "pulse", amb: null, level: 0.5 },
    lab:     { title: "Lab sequencer", bpm: 104, meter: 4, key: 64, scale: "minor", chords: [[52, "min"], [48, "maj"], [55, "maj"], [50, "maj"]], lead: "arp", beat: "tick", amb: null, level: 0.45 },
    about:   { title: "Story in the clouds", bpm: 58, meter: 4, key: 70, scale: "major", chords: [[58, "maj7"], [55, "m7"], [51, "maj7"], [53, "add9"]], lead: "piano", beat: "none", amb: "wind", level: 0.55 },
    contact: { title: "Seaside", bpm: 66, meter: 4, key: 67, scale: "major", chords: [[55, "maj7"], [52, "m7"], [48, "maj7"], [50, "sus"]], lead: "bell", beat: "none", amb: "waves", level: 0.5 },
  };
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let next = 0, bar = 0, mel = 4;

  function pad(t, notes, dur, bright = 900) {
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = bright; lp.Q.value = 0.3; lp.connect(musicBus); lp.connect(wet.input);
    notes.forEach((m, i) => [-6, 6].forEach((det) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = i === 0 ? "sine" : "triangle"; o.frequency.value = N(m); o.detune.value = det;
      o.connect(g); g.connect(lp); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.02, t + Math.min(1.4, dur / 3)); g.gain.setValueAtTime(0.02, t + dur - 0.8); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
      o.start(t); o.stop(t + dur + 0.7);
    }));
  }
  const LEAD = {
    bell(t, m, v) { [1, 2.01, 3.99].forEach((h, i) => osc(i ? "sine" : "triangle", N(m) * h, t, 1.6 / (i + 1), 0.028 * v / (i + 1), i ? musicBus : wet.input)); osc("sine", N(m), t, 1.4, 0.026 * v, musicBus); },
    pluck(t, m, v) { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.4); lp.connect(musicBus); lp.connect(wet.input); osc("triangle", N(m), t, 0.45, 0.06 * v, lp); osc("sine", N(m) * 2, t, 0.2, 0.02 * v, lp); },
    arp(t, m, v) { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500; lp.Q.value = 4; lp.connect(musicBus); lp.connect(wet.input); osc("square", N(m), t, 0.16, 0.022 * v, lp); },
    piano(t, m, v) { osc("triangle", N(m), t, 1.8, 0.05 * v, musicBus, 0.004); osc("sine", N(m) * 2, t, 0.9, 0.018 * v, wet.input, 0.004); osc("sine", N(m) / 2, t, 1.2, 0.015 * v, musicBus, 0.01); },
  };
  function kick(t, k = 1) { const o = osc("sine", 120, t, 0.25, 0.12 * k, musicBus); o.frequency.exponentialRampToValueAtTime(45, t + 0.2); }
  function hat(t, k = 1) { noiseHit(t, 0.03, 0.016 * k, "highpass", 7000, 0.7, musicBus); }

  function schedule() {
    const M = mood; if (!M) return;
    const beat = 60 / M.bpm, steps = M.meter * 2;
    const scale = []; [0, 12].forEach((o) => PENTA[M.scale].forEach((s) => scale.push(M.key + o + s)));
    while (next < ctx.currentTime + 0.6) {
      const [root, q] = M.chords[bar % M.chords.length], ch = Q[q].map((i) => root + i), t = next, len = beat * M.meter;
      pad(t, ch, len, M.lead === "arp" ? 1300 : 900);
      osc("sine", N(root - 12), t, beat * 1.6, 0.06, musicBus, 0.03);
      if (M.meter === 4) osc("sine", N(root - 12 + (bar % 2 ? 7 : 0)), t + beat * 2.5, beat, 0.045, musicBus, 0.03);
      for (let e = 0; e < steps; e++) {
        const te = t + e * beat / 2 + (M.beat === "lofi" && e % 2 ? 0.04 : 0);
        if (M.beat === "lofi") { if (e % 2) hat(te); if (e === 0 || e === 4) kick(te, 0.7); }
        if (M.beat === "pulse") { if (e % 2 === 0) kick(te, 0.55); if (e % 2) hat(te, 1.2); }
        if (M.beat === "tick") { hat(te, 0.8); hat(te + beat / 4, 0.5); }
        if (M.beat === "soft" && e % 2) hat(te, 0.6);
        if (M.lead === "arp") { LEAD.arp(te, ch[e % ch.length] + 12, 1); LEAD.arp(te + beat / 4, ch[(e + 2) % ch.length] + 12, 0.7); continue; }
        const p = M.lead === "piano" ? (e % 2 ? 0.2 : 0.55) : (e % 2 ? 0.25 : 0.5);
        if (Math.random() < p) { mel = Math.max(0, Math.min(scale.length - 1, mel + [-2, -1, -1, 0, 1, 1, 2][(Math.random() * 7) | 0])); LEAD[M.lead](te, scale[mel], 0.7 + Math.random() * 0.4); }
      }
      next += len; bar++;
    }
  }

  /* ---------- ambience: birds by day, crickets by night, wind, waves ---------- */
  let ambNodes = [], ambTimer = 0;
  function stopAmb() { ambNodes.forEach((n) => { try { n.stop(); } catch (_) {} }); ambNodes = []; clearInterval(ambTimer); }
  function loopNoise(type, f, q, gain, lfoRate, lfoDepth, param = "gain") {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    s.buffer = noise(); s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = gain;
    lfo.frequency.value = lfoRate; lg.gain.value = lfoDepth; lfo.connect(lg); lg.connect(param === "gain" ? g.gain : fl.frequency);
    s.connect(fl); fl.connect(g); g.connect(ambBus); s.start(); lfo.start(); ambNodes.push(s, lfo);
  }
  function chirp(t) { const n = 2 + ((Math.random() * 4) | 0), base = 2200 + Math.random() * 1800, pan = Math.random() * 1.6 - 0.8; for (let i = 0; i < n; i++) { const o = osc("sine", base, t + i * 0.09, 0.07, 0.025, ambBus, 0.005, pan); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), t + i * 0.09 + 0.06); } }
  function cricket(t) { const pan = Math.random() * 1.4 - 0.7; for (let i = 0; i < 3; i++) osc("sine", 4300 + Math.random() * 300, t + i * 0.05, 0.03, 0.012, ambBus, 0.003, pan); }
  function startAmb() {
    stopAmb(); if (!mood) return;
    const kind = mood.amb === "birds" && night ? "crickets" : mood.amb;
    if (kind === "waves") loopNoise("lowpass", 520, 0.6, 0.12, 0.09, 0.09);
    if (kind === "wind") loopNoise("bandpass", 600, 0.8, 0.05, 0.07, 260, "freq");
    if (kind === "birds") { loopNoise("lowpass", 300, 0.5, 0.015, 0.05, 0.01); ambTimer = setInterval(() => { if (Math.random() < 0.55) chirp(ctx.currentTime + 0.05); }, 1300); }
    if (kind === "crickets") { ambTimer = setInterval(() => { for (let i = 0; i < 4; i++) if (Math.random() < 0.6) cricket(ctx.currentTime + i * 0.22); }, 900); }
  }

  function fadeTo(param, v, sec) { const t = ctx.currentTime; param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(v, t + sec); }

  function startMusic() {
    musicWanted = true;
    if (!on || musicPlaying || !init()) return;
    if (ctx.state === "suspended") ctx.resume();
    musicPlaying = true;
    mood = MOODS[moodName] || MOODS.hall;
    fadeTo(ambBus.gain, vol.amb * 0.9, 3); startAmb();
    if (cfg.music) {
      track = track || Object.assign(new Audio(cfg.music), { loop: true });
      track.volume = Math.min(1, vol.music * 0.6); track.play().catch(() => { musicPlaying = false; });
      return;
    }
    next = ctx.currentTime + 0.1; bar = 0;
    fadeTo(musicBus.gain, mood.level * vol.music, 4);
    schedule(); timer = setInterval(schedule, 200);
  }
  function stopMusic() {
    musicPlaying = false; clearInterval(timer); stopAmb();
    if (track) track.pause();
    if (ctx) { fadeTo(musicBus.gain, 0, 0.6); fadeTo(ambBus.gain, 0, 0.6); }
  }

  /* change room: the old piece fades out, the room's own piece fades in */
  function setMood(name) {
    if (!MOODS[name] || name === moodName) return;
    moodName = name;
    listeners.forEach((f) => f());
    if (!musicPlaying || !ctx || cfg.music) return;
    fadeTo(musicBus.gain, 0, 0.7); fadeTo(ambBus.gain, 0, 0.7);
    setTimeout(() => {
      if (!musicPlaying) return;
      mood = MOODS[moodName]; next = Math.max(ctx.currentTime + 0.05, next); bar = 0; mel = 4;
      fadeTo(musicBus.gain, mood.level * vol.music, 2.2); fadeTo(ambBus.gain, vol.amb * 0.9, 2.2); startAmb();
    }, 750);
  }
  function setNight(v) { night = v; if (musicPlaying && mood && mood.amb === "birds") startAmb(); }

  function setOn(v) {
    on = v;
    if (ctx) fadeTo(master.gain, v ? vol.master : 0, 0.2);
    if (!v) stopMusic(); else if (musicWanted) startMusic();
    listeners.forEach((f) => f());
  }
  function setVolume(kind, v) {
    vol[kind] = v; store("ak_vol_" + kind, String(v));
    if (!ctx) return;
    if (kind === "sfx") fadeTo(sfxBus.gain, v, 0.1);
    if (kind === "amb" && musicPlaying) fadeTo(ambBus.gain, v * 0.9, 0.1);
    if (kind === "music" && musicPlaying) { if (track) track.volume = Math.min(1, v * 0.6); else fadeTo(musicBus.gain, (mood?.level || 0.5) * v, 0.1); }
  }

  const listeners = [];
  return {
    sound, setOn, startMusic, stopMusic, setMood, setNight, setVolume,
    get on() { return on; }, get volumes() { return { ...vol }; },
    get title() { return cfg.music ? "Your track" : (MOODS[moodName] || MOODS.hall).title; },
    onChange(f) { listeners.push(f); },
  };
})();

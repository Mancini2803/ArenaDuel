/*
 * audio.js
 * Sintetizador mínimo com WebAudio. Nenhum arquivo de som é necessário.
 * O AudioContext só é criado depois da primeira tecla (regra dos navegadores).
 */
(function (A) {
  'use strict';

  let actx = null;
  let muted = false;

  function init() {
    if (actx) return;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      actx = Ctor ? new Ctor() : null;
    } catch (e) { actx = null; }
  }

  function tone(freq, dur, type, vol, slide, delay) {
    if (!actx || muted) return;
    const t0 = actx.currentTime + (delay || 0);
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol || 0.05, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol) {
    if (!actx || muted) return;
    const n = Math.floor(actx.sampleRate * dur);
    const buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = actx.createBufferSource(), g = actx.createGain();
    s.buffer = buf; g.gain.value = vol || 0.08;
    s.connect(g); g.connect(actx.destination); s.start();
  }

  A.audio = {
    init,
    isMuted: () => muted,
    setMuted(v) { muted = !!v; },
    toggleMute() { muted = !muted; return muted; },
    sfx: {
      shoot: () => tone(520, 0.09, 'square', 0.04, -300),
      hit: () => { tone(180, 0.15, 'sawtooth', 0.07, -120); noise(0.12, 0.07); },
      wall: () => tone(260, 0.05, 'triangle', 0.04, -80),
      crate: () => { noise(0.18, 0.08); tone(140, 0.1, 'square', 0.04, -60); },
      pick: () => { tone(660, 0.08, 'square', 0.05); tone(990, 0.12, 'square', 0.05, 0, 0.07); },
      dash: () => tone(300, 0.14, 'sawtooth', 0.04, 500),
      shield: () => tone(880, 0.1, 'triangle', 0.06, -400),
      beep: () => tone(440, 0.12, 'square', 0.05),
      go: () => tone(880, 0.3, 'square', 0.06),
      win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.06, 0, i * 0.12)); },
      ko: () => { tone(220, 0.5, 'sawtooth', 0.08, -180); noise(0.4, 0.1); },
      menu: () => tone(700, 0.05, 'square', 0.04)
    }
  };
})(window.Arena = window.Arena || {});

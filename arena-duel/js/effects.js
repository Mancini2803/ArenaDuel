/*
 * effects.js
 * Partículas, textos flutuantes, imagens residuais do dash, tremor e flash de tela.
 * Respeita prefers-reduced-motion (menos partículas e tremor).
 */
(function (A) {
  'use strict';

  const reduce = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fx = A.fx = {
    particles: [],
    texts: [],
    afterimages: [],
    shake: 0,
    flash: 0,
    reduce,

    reset() {
      fx.particles.length = 0; fx.texts.length = 0; fx.afterimages.length = 0;
      fx.shake = 0; fx.flash = 0;
    },

    burst(x, y, color, n, speed, life, size, grav) {
      if (reduce) n = Math.ceil(n / 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.9);
        fx.particles.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: life * (0.6 + Math.random() * 0.6), max: life,
          color, size: size || 1, grav: grav || 0
        });
      }
    },

    /** Partícula parada que some rápido (rastro de tiro, faíscas). */
    spark(x, y, color, life, vy) {
      fx.particles.push({ x, y, vx: 0, vy: vy || 0, life, max: life, color, size: 1, grav: 0 });
    },

    text(x, y, s, color) { fx.texts.push({ x, y, s, color, life: 0.9, max: 0.9 }); },

    addShake(v) { fx.shake = Math.max(fx.shake, reduce ? v * 0.25 : v); },

    afterimage(p) { fx.afterimages.push({ x: p.x, y: p.y, life: 0.22, max: 0.22, i: p.i }); },

    /** dt já vem com câmera lenta aplicada; rawDt é o tempo real. */
    update(dt, rawDt) {
      fx.shake = Math.max(0, fx.shake - rawDt * 22);
      fx.flash = Math.max(0, fx.flash - rawDt);
      for (let i = fx.particles.length - 1; i >= 0; i--) {
        const p = fx.particles[i];
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; p.vx *= 0.985;
        if (p.life <= 0) fx.particles.splice(i, 1);
      }
      for (let i = fx.texts.length - 1; i >= 0; i--) {
        const x = fx.texts[i];
        x.life -= dt; x.y -= 14 * dt;
        if (x.life <= 0) fx.texts.splice(i, 1);
      }
      for (let i = fx.afterimages.length - 1; i >= 0; i--) {
        fx.afterimages[i].life -= dt;
        if (fx.afterimages[i].life <= 0) fx.afterimages.splice(i, 1);
      }
    }
  };
})(window.Arena = window.Arena || {});

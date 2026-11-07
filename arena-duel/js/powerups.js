/*
 * powerups.js
 * Itens que aparecem na arena: coração, raio, escudo e tiro triplo.
 */
(function (A) {
  'use strict';

  const { COLS, ROWS, T, POWER, PLAYER } = A.config;
  const g = A.g;

  A.powerups = {
    /** Cria um item. Sem coordenadas, escolhe um tile livre ao acaso. */
    spawn(x, y) {
      if (g.powerups.length >= POWER.maxOnField) return;
      if (x == null) {
        for (let k = 0; k < 40; k++) {
          const tx = 2 + Math.floor(Math.random() * (COLS - 4));
          const ty = 1 + Math.floor(Math.random() * (ROWS - 2));
          if (A.maps.grid[ty][tx].t === 0) { x = tx * T + T / 2; y = ty * T + T / 2; break; }
        }
        if (x == null) return;
      }
      const type = POWER.types[Math.floor(Math.random() * POWER.types.length)];
      g.powerups.push({ x, y, type, life: POWER.lifetime, pop: 0 });
      A.fx.burst(x, y, '#ffffff', 10, 60, 0.4, 1);
    },

    /** Faz os itens ficarem pulsando e sumirem depois de um tempo. */
    update(dt) {
      for (let i = g.powerups.length - 1; i >= 0; i--) {
        const pu = g.powerups[i];
        pu.life -= dt; pu.pop += dt;
        if (pu.life <= 0) g.powerups.splice(i, 1);
      }
    },

    tryPickup(p) {
      for (let i = g.powerups.length - 1; i >= 0; i--) {
        const pu = g.powerups[i];
        if (Math.hypot(pu.x - p.x, pu.y - p.y) < 9) {
          A.powerups.collect(p, pu);
          g.powerups.splice(i, 1);
        }
      }
    },

    collect(p, pu) {
      A.audio.sfx.pick();
      A.fx.burst(pu.x, pu.y, POWER.colors[pu.type], 16, 90, 0.5, 2);
      if (pu.type === 'heart') { p.hp = Math.min(PLAYER.maxHp, p.hp + 2); A.fx.text(p.x, p.y - 12, '+VIDA', POWER.colors.heart); }
      if (pu.type === 'bolt') { p.rapid = POWER.duration; A.fx.text(p.x, p.y - 12, 'RAPIDO', POWER.colors.bolt); }
      if (pu.type === 'shield') { p.shield = POWER.duration; A.fx.text(p.x, p.y - 12, 'ESCUDO', POWER.colors.shield); }
      if (pu.type === 'triple') { p.triple = POWER.duration; A.fx.text(p.x, p.y - 12, 'TRIPLO', POWER.colors.triple); }
    }
  };
})(window.Arena = window.Arena || {});

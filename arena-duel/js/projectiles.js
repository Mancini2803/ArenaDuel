/*
 * projectiles.js
 * Tiros: disparo, movimento em sub-passos, ricochete, dano em caixas e jogadores.
 * Um tiro nunca machuca quem atirou.
 */
(function (A) {
  'use strict';

  const { T, COLS, ROWS, COL, GUN } = A.config;
  const g = A.g;

  function hurtCrate(tx, ty) {
    const c = A.maps.grid[ty][tx];
    if (c.t !== 2) return;
    c.hp--; c.hit = 0.12;
    A.fx.burst(tx * T + 8, ty * T + 8, COL.crateHi, 6, 70, 0.4, 2, 120);
    A.audio.sfx.crate();
    if (c.hp <= 0) {
      c.t = 0;
      A.fx.burst(tx * T + 8, ty * T + 8, COL.crate, 18, 110, 0.7, 2, 160);
      A.fx.burst(tx * T + 8, ty * T + 8, COL.crateLo, 10, 90, 0.7, 2, 160);
      A.fx.addShake(3);
      if (Math.random() < 0.4) A.powerups.spawn(tx * T + 8, ty * T + 8);
    }
  }

  A.projectiles = {
    /** Dispara na direção em que o jogador está olhando (respeita o cooldown). */
    shoot(p) {
      if (p.cd > 0 || !p.alive) return;
      p.cd = p.rapid > 0 ? GUN.rapidCooldown : GUN.cooldown;
      const len = Math.hypot(p.fx, p.fy) || 1, dx = p.fx / len, dy = p.fy / len;
      const base = Math.atan2(dy, dx);
      const angles = p.triple > 0 ? [-GUN.spread, 0, GUN.spread] : [0];
      for (const da of angles) {
        const a = base + da;
        g.bullets.push({
          x: p.x + Math.cos(a) * 9, y: p.y + Math.sin(a) * 9 - 1,
          vx: Math.cos(a) * GUN.speed, vy: Math.sin(a) * GUN.speed,
          owner: p.i, bounces: GUN.bounces, life: GUN.life,
          col: p.i === 0 ? COL.p1 : COL.p2
        });
      }
      g.stats[p.i].shots += angles.length;
      p.kx -= dx * 38; p.ky -= dy * 38; // recuo
      p.squash = 0.08;
      A.fx.burst(p.x + dx * 10, p.y + dy * 10 - 1, '#ffffff', 4, 60, 0.18, 1);
      A.audio.sfx.shoot();
    },

    update(dt) {
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        b.life -= dt;
        let remove = b.life <= 0;
        const steps = 3; // sub-passos para o tiro não atravessar paredes finas
        for (let s = 0; s < steps && !remove; s++) {
          const nx = b.x + b.vx * dt / steps, ny = b.y + b.vy * dt / steps;
          const hitX = A.maps.solidAt(nx, b.y), hitY = A.maps.solidAt(b.x, ny);
          if (hitX || hitY) {
            const tx = Math.floor((hitX ? nx : b.x) / T), ty = Math.floor((hitY ? ny : b.y) / T);
            if (tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS) hurtCrate(tx, ty);
            A.fx.burst(b.x, b.y, b.col, 5, 60, 0.25, 1);
            if (b.bounces > 0) {
              b.bounces--; A.audio.sfx.wall();
              if (hitX) b.vx *= -1;
              if (hitY) b.vy *= -1;
              if (!hitX && !hitY) { b.vx *= -1; b.vy *= -1; }
            } else remove = true;
            break;
          }
          b.x = nx; b.y = ny;
          for (const p of g.players) {
            if (p.i === b.owner || !p.alive) continue;
            if (Math.abs(p.x - b.x) < 6 && Math.abs(p.y - b.y) < 7) {
              g.stats[b.owner].hits++;
              A.game.damage(p, b.x - b.vx * 0.02, b.y - b.vy * 0.02);
              remove = true;
              break;
            }
          }
          if (remove) break;
        }
        if (Math.random() < 0.7) A.fx.spark(b.x, b.y, b.col, 0.14);
        if (remove) g.bullets.splice(i, 1);
      }
    }
  };
})(window.Arena = window.Arena || {});

/*
 * player.js
 * Criação e atualização dos jogadores (humanos e bot): leitura de teclas,
 * movimento com colisão, dash, recuo, tiro e coleta de power-ups.
 */
(function (A) {
  'use strict';

  const { AW, AH, PLAYER } = A.config;
  const g = A.g;

  const KEYS = [
    { l: 'KeyA', r: 'KeyD', u: 'KeyW', d: 'KeyS', fire: ['KeyF', 'Space'], dash: ['KeyG'] },
    { l: 'ArrowLeft', r: 'ArrowRight', u: 'ArrowUp', d: 'ArrowDown', fire: ['KeyL'], dash: ['KeyK'] }
  ];

  function readInput(p) {
    const inp = A.input, k = KEYS[p.i];
    let mx = (inp.isDown(k.r) ? 1 : 0) - (inp.isDown(k.l) ? 1 : 0);
    let my = (inp.isDown(k.d) ? 1 : 0) - (inp.isDown(k.u) ? 1 : 0);
    let fire = k.fire.some(inp.isDown), dash = k.dash.some(inp.was);
    if (p.i === 0 && g.mode === 1) { // no modo solo o P1 também aceita setas, L e K
      mx += (inp.isDown('ArrowRight') ? 1 : 0) - (inp.isDown('ArrowLeft') ? 1 : 0);
      my += (inp.isDown('ArrowDown') ? 1 : 0) - (inp.isDown('ArrowUp') ? 1 : 0);
      fire = fire || inp.isDown('KeyL');
      dash = dash || inp.was('KeyK');
      mx = Math.max(-1, Math.min(1, mx));
      my = Math.max(-1, Math.min(1, my));
    }
    return { mx, my, fire, dash, speed: 1 };
  }

  /** Move por eixo separado, então o jogador desliza nas paredes. */
  function moveEntity(p, dx, dy) {
    const h = PLAYER.half;
    const nx = p.x + dx;
    if (!A.maps.boxBlocked(nx, p.y, h)) p.x = nx;
    const ny = p.y + dy;
    if (!A.maps.boxBlocked(p.x, ny, h)) p.y = ny;
  }

  A.player = {
    make(i, mode) {
      return {
        i, x: i === 0 ? 40 : AW - 40, y: AH / 2,
        vx: 0, vy: 0, kx: 0, ky: 0,
        fx: i === 0 ? 1 : -1, fy: 0, faceAng: i === 0 ? 0 : Math.PI,
        hp: PLAYER.maxHp, alive: true,
        cd: 0, dashT: 0, dashCd: 0, ddx: 0, ddy: 0,
        hitFlash: 0, squash: 0, walk: 0, moving: false,
        rapid: 0, triple: 0, shield: 0,
        bot: i === 1 && mode === 1,
        ai: { strafe: 1, strafeT: 1, think: 0, stuck: 0, lx: 0, ly: 0, jitter: 0, jx: 0, jy: 0, ang: Math.PI }
      };
    },

    update(p, o, dt) {
      if (!p.alive) return;
      const inp = p.bot ? A.ai.botInput(p, o, dt) : readInput(p);

      p.cd -= dt; p.dashCd -= dt; p.hitFlash -= dt; p.squash -= dt;
      p.rapid = Math.max(0, p.rapid - dt);
      p.triple = Math.max(0, p.triple - dt);
      p.shield = Math.max(0, p.shield - dt);

      const len = Math.hypot(inp.mx, inp.my);
      let dx = 0, dy = 0;
      p.moving = len > 0.01;
      if (p.moving) {
        dx = inp.mx / Math.max(1, len); dy = inp.my / Math.max(1, len);
        if (!p.bot) { // humano mira para onde anda
          p.fx = inp.mx / len; p.fy = inp.my / len; p.faceAng = Math.atan2(p.fy, p.fx);
        }
      }

      if (inp.dash && p.dashCd <= 0 && g.state === 'play') {
        p.dashT = PLAYER.dashTime; p.dashCd = PLAYER.dashCooldown;
        if (!p.moving) { dx = p.fx; dy = p.fy; }
        p.ddx = dx; p.ddy = dy;
        A.audio.sfx.dash();
        A.fx.burst(p.x, p.y + 4, '#ffffff', 8, 50, 0.3, 1);
      }

      let speed = PLAYER.speed * (inp.speed || 1);
      if (p.dashT > 0) {
        p.dashT -= dt; dx = p.ddx; dy = p.ddy; speed = PLAYER.dashSpeed;
        A.fx.afterimage(p);
      }
      p.vx = dx * speed + p.kx; p.vy = dy * speed + p.ky;
      moveEntity(p, p.vx * dt, p.vy * dt);
      p.kx *= Math.pow(0.0008, dt); p.ky *= Math.pow(0.0008, dt);

      if (p.moving) p.walk += dt * (p.dashT > 0 ? 24 : 11);
      if (p.moving && Math.random() < dt * 9) A.fx.burst(p.x, p.y + 5, 'rgba(255,255,255,0.35)', 1, 14, 0.3, 1);

      if (inp.fire && g.state === 'play') A.projectiles.shoot(p);
      A.powerups.tryPickup(p);
    }
  };
})(window.Arena = window.Arena || {});

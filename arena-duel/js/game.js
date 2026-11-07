/*
 * game.js
 * Regras da partida e máquina de estados:
 *   menu -> countdown -> play -> roundend -> (countdown | matchend) -> ...
 * Também trata dano, K.O., pausa e estatísticas.
 */
(function (A) {
  'use strict';

  const { AW, AH, COL, MATCH } = A.config;
  const g = A.g, fx = A.fx;

  const ACTIVE = ['countdown', 'play', 'roundend'];

  const game = A.game = {
    startMatch() {
      g.scores = [0, 0];
      g.round = 1;
      g.stats = A.newStats();
      game.startRound();
    },

    startRound() {
      A.maps.build(g.mapIdx);
      g.players = [A.player.make(0, g.mode), A.player.make(1, g.mode)];
      g.bullets = [];
      g.powerups = [];
      fx.reset();
      g.spawnT = 3 + Math.random() * 2;
      g.stateT = MATCH.countdown;
      g.state = 'countdown';
      g.winner = -1;
      g.timeScale = 1;
      g.lastCount = 4;
    },

    toMenu() {
      g.state = 'menu';
      g.paused = false;
      g.players = []; g.bullets = []; g.powerups = [];
      fx.reset();
    },

    /** Pausa sozinho quando a aba perde o foco no meio da partida. */
    autoPause() {
      if (ACTIVE.includes(g.state)) g.paused = true;
    },

    /** Aplica 1 de dano (ou gasta o escudo). bx, by = de onde veio o tiro (para o empurrão). */
    damage(p, bx, by) {
      if (!p.alive || g.state !== 'play') return;
      if (p.shield > 0) {
        p.shield = 0;
        A.audio.sfx.shield(); fx.addShake(2);
        fx.burst(p.x, p.y, COL.p1, 14, 90, 0.4, 1);
        fx.text(p.x, p.y - 12, 'BLOQUEOU', COL.p1);
        return;
      }
      p.hp -= 1; p.hitFlash = 0.18;
      g.hitStop = 0.05; fx.addShake(4); fx.flash = 0.12;
      const a = Math.atan2(p.y - by, p.x - bx);
      p.kx += Math.cos(a) * 110; p.ky += Math.sin(a) * 110;
      const col = p.i === 0 ? COL.p1 : COL.p2;
      fx.burst(p.x, p.y, col, 14, 100, 0.5, 2, 90);
      fx.burst(p.x, p.y, '#ffffff', 6, 70, 0.25, 1);
      fx.text(p.x, p.y - 12, '-1', '#ffffff');
      A.audio.sfx.hit();

      if (p.hp <= 0) {
        p.alive = false; p.hp = 0;
        g.winner = 1 - p.i;
        g.scores[g.winner]++;
        fx.burst(p.x, p.y, col, 40, 160, 0.9, 2, 120);
        fx.burst(p.x, p.y, '#ffffff', 20, 120, 0.6, 1);
        fx.addShake(9);
        A.audio.sfx.ko();
        g.state = 'roundend'; g.stateT = MATCH.roundEnd; g.timeScale = 0.25;
      }
    },

    /** Impede que os dois jogadores fiquem um dentro do outro. */
    separate() {
      const [a, b] = g.players;
      if (!a.alive || !b.alive) return;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d < 10 && d > 0.01) {
        const push = (10 - d) / 2, nx = dx / d, ny = dy / d;
        if (!A.maps.boxBlocked(a.x - nx * push, a.y - ny * push, 4)) { a.x -= nx * push; a.y -= ny * push; }
        if (!A.maps.boxBlocked(b.x + nx * push, b.y + ny * push, 4)) { b.x += nx * push; b.y += ny * push; }
      }
    },

    /** Entrada de pausa + atualização. Chamada uma vez por frame. */
    tick(dt) {
      const inp = A.input;
      if (ACTIVE.includes(g.state)) {
        if (inp.was('KeyP')) g.paused = !g.paused;
        else if (inp.was('Escape')) {
          if (g.paused) game.toMenu(); else g.paused = true;
        }
      }
      if (!g.paused) game.update(dt);
    },

    update(rawDt) {
      g.t += rawDt;
      if (g.hitStop > 0) { g.hitStop -= rawDt; return; }
      const dt = rawDt * g.timeScale;

      fx.update(dt, rawDt);
      A.maps.update(dt);

      if (g.state === 'menu') { A.menu.update(); return; }

      if (g.state === 'matchend') {
        g.stateT += rawDt;
        if (A.input.was('Escape')) game.toMenu();
        else if (A.input.was('Enter') || A.input.was('Space') || A.input.was('KeyR')) {
          A.audio.sfx.menu(); game.startMatch();
        }
        return;
      }

      if (g.state === 'countdown') {
        g.stateT -= dt;
        const c = Math.ceil(g.stateT);
        if (c !== g.lastCount && c >= 1 && c <= 3) { g.lastCount = c; A.audio.sfx.beep(); }
        if (g.stateT <= 0) { g.state = 'play'; A.audio.sfx.go(); fx.addShake(3); }
        return;
      }

      // play ou roundend (o roundend continua rodando em câmera lenta)
      for (const p of g.players) A.player.update(p, g.players[1 - p.i], dt);
      game.separate();
      A.projectiles.update(dt);
      A.powerups.update(dt);

      if (g.state === 'play') {
        g.spawnT -= dt;
        if (g.spawnT <= 0) { A.powerups.spawn(); g.spawnT = 6 + Math.random() * 4; }
      } else if (g.state === 'roundend') {
        g.stateT -= rawDt;
        if (g.stateT < 2.0) g.timeScale = Math.min(1, g.timeScale + rawDt * 1.5);
        if (g.stateT <= 0) {
          if (g.scores[g.winner] >= MATCH.roundsToWin) {
            g.state = 'matchend'; g.stateT = 0; g.timeScale = 1;
            A.audio.sfx.win();
            fx.burst(AW / 2, AH / 2, COL.gold, 60, 150, 1.2, 2, 80);
          } else {
            g.round++;
            game.startRound();
          }
        }
      }
    }
  };
})(window.Arena = window.Arena || {});

/*
 * menu.js
 * Menu inicial: modo de jogo, mapa e dificuldade do bot.
 * Navegue com W/S ou setas; esquerda/direita troca mapa e dificuldade; Enter confirma.
 */
(function (A) {
  'use strict';

  const g = A.g;
  const ROW0 = 106, ROWH = 14, COUNT = 4;

  const cycle = (v, dir, n) => (v + dir + n) % n;

  const menu = A.menu = {
    sel: 0,
    count: COUNT,

    rowY: i => ROW0 + i * ROWH,

    labels() {
      return [
        '1 JOGADOR  VS BOT',
        '2 JOGADORES LOCAL',
        'MAPA: ' + A.maps.list[g.mapIdx].name,
        'BOT: ' + A.config.DIFFS[g.diffIdx].name
      ];
    },

    /** Troca o valor das linhas de mapa (2) e dificuldade (3). */
    change(row, dir) {
      if (row === 2) g.mapIdx = cycle(g.mapIdx, dir, A.maps.list.length);
      else if (row === 3) g.diffIdx = cycle(g.diffIdx, dir, A.config.DIFFS.length);
      else return;
      A.audio.sfx.menu();
      A.settings.save();
    },

    activate(row) {
      A.audio.sfx.menu();
      if (row === 0) { g.mode = 1; A.game.startMatch(); }
      else if (row === 1) { g.mode = 2; A.game.startMatch(); }
      else menu.change(row, 1);
    },

    /** Qual linha está na altura y (coordenadas da tela interna)? -1 se nenhuma. */
    hit(y) {
      for (let i = 0; i < COUNT; i++) {
        const iy = menu.rowY(i);
        if (y >= iy - 4 && y <= iy + 10) return i;
      }
      return -1;
    },

    update() {
      const inp = A.input;
      if (inp.was('ArrowUp') || inp.was('KeyW')) { menu.sel = cycle(menu.sel, -1, COUNT); A.audio.sfx.menu(); }
      if (inp.was('ArrowDown') || inp.was('KeyS')) { menu.sel = cycle(menu.sel, 1, COUNT); A.audio.sfx.menu(); }
      if (inp.was('ArrowLeft') || inp.was('KeyA')) menu.change(menu.sel, -1);
      if (inp.was('ArrowRight') || inp.was('KeyD')) menu.change(menu.sel, 1);
      if (inp.was('Enter') || inp.was('Space') || inp.was('KeyF') || inp.was('KeyL')) menu.activate(menu.sel);

      // faíscas subindo no fundo do título
      if (Math.random() < 0.3) {
        A.fx.particles.push({
          x: Math.random() * A.config.W, y: A.config.H + 2,
          vx: (Math.random() - 0.5) * 10, vy: -(20 + Math.random() * 30),
          life: 3, max: 3, color: Math.random() < 0.5 ? A.config.COL.p1 : A.config.COL.p2, size: 1, grav: 0
        });
      }
    }
  };
})(window.Arena = window.Arena || {});

/*
 * maps.js
 * Mapas, grade de tiles, colisão e linha de visão.
 *
 * Cada mapa é escrito só com a metade esquerda (10 colunas) e espelhado,
 * então a arena é sempre justa para os dois lados.
 *   #  parede (indestrutível)
 *   c  caixa (quebra com 2 tiros, pode soltar power-up)
 *   .  chão
 * Mantenha livre a coluna 2 da linha do meio (5): é onde o jogador nasce.
 */
(function (A) {
  'use strict';

  const { COLS, ROWS, T, AW, AH, COL } = A.config;

  const LIST = [
    {
      name: 'CLASSICO',
      left: [
        '##########',
        '#.........',
        '#.##...c..',
        '#.#.....c.',
        '#......##.',
        '#......#..',
        '#......##.',
        '#.#.....c.',
        '#.##...c..',
        '#.........',
        '##########'
      ]
    },
    {
      name: 'PILARES',
      left: [
        '##########',
        '#.........',
        '#.#...#...',
        '#.........',
        '#...#...#.',
        '#.........',
        '#...#...#.',
        '#.........',
        '#.#...#...',
        '#.........',
        '##########'
      ]
    },
    {
      name: 'CAIXOTE',
      left: [
        '##########',
        '#.c.....c.',
        '#.........',
        '#...c.cc..',
        '#..c......',
        '#.....c.c.',
        '#..c......',
        '#...c.cc..',
        '#.........',
        '#.c.....c.',
        '##########'
      ]
    }
  ];

  const mirror = left => left.map(r => r + r.split('').reverse().join(''));

  const M = A.maps = {
    list: LIST,
    grid: null,
    floor: null,

    layout: idx => mirror(LIST[idx % LIST.length].left),

    /** Monta a grade e pré-renderiza o chão do mapa escolhido. */
    build(idx) {
      const layout = M.layout(idx);
      M.grid = layout.map(row => row.split('').map(ch =>
        ch === '#' ? { t: 1 } : ch === 'c' ? { t: 2, hp: 2, hit: 0 } : { t: 0 }));

      const cv = document.createElement('canvas');
      cv.width = AW; cv.height = AH;
      const f = cv.getContext('2d');
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        f.fillStyle = (x + y) % 2 ? COL.floorA : COL.floorB;
        f.fillRect(x * T, y * T, T, T);
        for (let i = 0; i < 4; i++) {
          f.fillStyle = 'rgba(255,255,255,0.035)';
          f.fillRect(x * T + Math.floor(Math.random() * 15), y * T + Math.floor(Math.random() * 15), 1, 1);
        }
      }
      f.fillStyle = 'rgba(255,255,255,0.05)';
      for (let y = T; y < AH - T; y += 8) f.fillRect(AW / 2 - 1, y, 2, 4);
      M.floor = cv;
    },

    /** true se o ponto (px, py) está dentro de parede, caixa ou fora da arena. */
    solidAt(px, py) {
      const tx = Math.floor(px / T), ty = Math.floor(py / T);
      if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
      return M.grid[ty][tx].t !== 0;
    },

    boxBlocked(x, y, h) {
      return M.solidAt(x - h, y - h) || M.solidAt(x + h, y - h) ||
             M.solidAt(x - h, y + h) || M.solidAt(x + h, y + h);
    },

    /** Linha de visão entre dois pontos (testa de 4 em 4 pixels). */
    hasLOS(a, b) {
      const dx = b.x - a.x, dy = b.y - a.y, n = Math.ceil(Math.hypot(dx, dy) / 4);
      for (let i = 1; i < n; i++) if (M.solidAt(a.x + dx * i / n, a.y + dy * i / n)) return false;
      return true;
    },

    /** Faz o tremor das caixas atingidas diminuir. */
    update(dt) {
      if (!M.grid) return;
      for (const row of M.grid) for (const c of row) if (c.hit > 0) c.hit -= dt;
    }
  };
})(window.Arena = window.Arena || {});

/*
 * config.js
 * Constantes do jogo: tamanho da tela, paleta, regras e dificuldades do bot.
 * Mexa aqui para ajustar o balanceamento sem tocar na lógica.
 */
(function (A) {
  'use strict';

  const W = 320, H = 200, HUD = 24, T = 16, COLS = 20, ROWS = 11;

  A.config = {
    // Tela interna (pixel art). O canvas é ampliado por CSS.
    W, H, HUD, T, COLS, ROWS,
    AW: COLS * T, // largura da arena em pixels
    AH: ROWS * T, // altura da arena em pixels

    FONT: '"Press Start 2P", "Courier New", monospace',

    COL: {
      floorA: '#1d1838', floorB: '#221c42',
      wall: '#4b3f86', wallHi: '#6e5fc0', wallLo: '#2c2457',
      crate: '#b8793a', crateHi: '#dba15c', crateLo: '#6d4120', crateStroke: '#3d2410',
      p1: '#4ad8ff', p1d: '#1f8fb8', p2: '#ff5e7a', p2d: '#b83552',
      gold: '#ffd23f', white: '#ffffff', ink: '#efe9ff', muted: '#9d94c4'
    },

    PLAYER: {
      speed: 72,          // px/s
      dashSpeed: 250,     // px/s durante o dash
      dashTime: 0.15,     // s
      dashCooldown: 1.2,  // s
      maxHp: 5,
      half: 4             // meia-largura da caixa de colisão
    },

    GUN: {
      cooldown: 0.34,
      rapidCooldown: 0.14,
      speed: 190,
      bounces: 1,         // quantos ricochetes cada tiro faz
      life: 2.2,
      spread: 0.22        // ângulo do tiro triplo (rad)
    },

    POWER: {
      duration: 6,        // s de efeito (raio, escudo, triplo)
      lifetime: 12,       // s que o item fica no chão
      maxOnField: 3,
      types: ['heart', 'bolt', 'shield', 'triple'],
      colors: { heart: '#ff4d6d', bolt: '#ffd23f', shield: '#4ad8ff', triple: '#d65bff' }
    },

    MATCH: {
      roundsToWin: 2,     // melhor de 3
      countdown: 3.2,     // s
      roundEnd: 2.6       // s
    },

    // Parâmetros do bot por dificuldade
    DIFFS: [
      { name: 'FACIL', turn: 5, err: 0.32, fire: 0.5, dodge: 0.25, spd: 0.82, react: 0.30 },
      { name: 'NORMAL', turn: 8, err: 0.14, fire: 0.8, dodge: 0.65, spd: 1.0, react: 0.17 },
      { name: 'DIFICIL', turn: 13, err: 0.04, fire: 1.0, dodge: 1.0, spd: 1.08, react: 0.08 }
    ]
  };
})(window.Arena = window.Arena || {});

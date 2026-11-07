/*
 * state.js
 * Estado compartilhado do jogo (A.g). Os módulos leem e escrevem aqui.
 *
 * state: 'menu' | 'countdown' | 'play' | 'roundend' | 'matchend'
 * mode:  1 = jogador vs bot, 2 = dois jogadores locais
 */
(function (A) {
  'use strict';

  A.newStats = () => [{ shots: 0, hits: 0 }, { shots: 0, hits: 0 }];

  A.g = {
    state: 'menu',
    paused: false,
    mode: 1,
    diffIdx: 1,
    mapIdx: 0,

    players: [],
    bullets: [],
    powerups: [],

    scores: [0, 0],
    round: 1,
    winner: -1,
    stats: A.newStats(),

    t: 0,            // relógio para animações
    stateT: 0,       // temporizador do estado atual
    timeScale: 1,    // câmera lenta no K.O.
    hitStop: 0,      // congelamento curto ao levar dano
    spawnT: 4,       // próximo power-up
    lastCount: 4
  };
})(window.Arena = window.Arena || {});

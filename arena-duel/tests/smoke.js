/*
 * tests/smoke.js
 * Testes de fumaça sem navegador: carrega os mesmos scripts do index.html (na mesma ordem)
 * com um DOM falso e confere mapas, dano, escudo, ricochete e uma partida inteira bot x bot.
 *
 * Rode com:  node tests/smoke.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');

/* ---------- Números aleatórios com semente: o teste dá o mesmo resultado sempre ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
Math.random = mulberry32(12345);

/* ---------- DOM falso ---------- */
const noop = () => {};
const ctxStub = new Proxy({}, {
  get: (_, k) => (k === 'measureText' ? s => ({ width: String(s).length * 8 }) : noop),
  set: () => true
});
const canvasStub = {
  width: 320, height: 200, style: {},
  getContext: () => ctxStub,
  parentElement: { clientWidth: 800, requestFullscreen: () => Promise.resolve() },
  addEventListener: noop, focus: noop,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 200 })
};
const elementStub = { addEventListener: noop, textContent: '' };
const store = new Map();
const frames = [];

// Algumas versões do Node já definem estes nomes como propriedades só de leitura.
const setGlobal = (name, value) =>
  Object.defineProperty(global, name, { value, writable: true, configurable: true });

setGlobal('window', global);
setGlobal('document', {
  getElementById: id => (id === 'game' ? canvasStub : elementStub),
  createElement: () => canvasStub,
  addEventListener: noop, hidden: false, fonts: null
});
setGlobal('localStorage', {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v))
});
setGlobal('performance', { now: () => 0 });
setGlobal('requestAnimationFrame', fn => { frames.push(fn); });
setGlobal('addEventListener', noop);

/* ---------- Carrega os scripts na ordem do index.html ---------- */
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
assert(scripts.length >= 10, 'index.html deve listar os scripts de js/');
for (const rel of scripts) {
  const file = path.join(root, rel);
  assert(fs.existsSync(file), 'script listado no index.html não existe: ' + rel);
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: rel });
}
const A = global.Arena;
const g = A.g;

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}

const DT = 1 / 60;
const step = (n, dt) => { for (let i = 0; i < (n || 1); i++) { A.game.update(dt || DT); A.input.endFrame(); } };
const press = code => { A.input.press(code, false); };
const release = code => { A.input.release(code); };

/* ---------- Testes ---------- */

console.log('Arena Duel: testes de fumaça');

test('todos os mapas têm 20x11, borda de parede e spawns livres', () => {
  const { COLS, ROWS } = A.config;
  A.maps.list.forEach((m, i) => {
    const layout = A.maps.layout(i);
    assert.strictEqual(layout.length, ROWS, m.name + ': linhas');
    layout.forEach(row => assert.strictEqual(row.length, COLS, m.name + ': colunas'));
    assert(/^#+$/.test(layout[0]) && /^#+$/.test(layout[ROWS - 1]), m.name + ': borda de cima e de baixo');
    layout.forEach(row => assert(row[0] === '#' && row[COLS - 1] === '#', m.name + ': bordas laterais'));
    const mid = layout[5];
    assert.strictEqual(mid[2], '.', m.name + ': spawn do P1 livre');
    assert.strictEqual(mid[COLS - 3], '.', m.name + ': spawn do P2 livre');
    A.maps.build(i);
    A.maps.list.length; // build não pode lançar erro
  });
});

test('colisão: bordas são sólidas e o centro da arena é livre', () => {
  A.maps.build(0);
  assert(A.maps.solidAt(2, 2), 'canto é parede');
  assert(A.maps.solidAt(-5, 50), 'fora da arena é sólido');
  assert(!A.maps.solidAt(40, 88), 'spawn do P1 é livre');
});

test('menu: escolher 2 jogadores e Enter inicia a partida, contagem vira jogo', () => {
  g.mapIdx = 0; g.diffIdx = 1;
  assert.strictEqual(g.state, 'menu');
  press('KeyS'); step(1); release('KeyS'); // desce para "2 JOGADORES"
  press('Enter'); step(1); release('Enter');
  assert.strictEqual(g.mode, 2);
  assert.strictEqual(g.state, 'countdown');
  step(Math.ceil(A.config.MATCH.countdown * 60) + 5);
  assert.strictEqual(g.state, 'play');
  assert.strictEqual(g.players.length, 2);
  assert(!g.players[1].bot, 'no modo 2P ninguém é bot');
});

test('jogador se move e não atravessa a parede', () => {
  const p = g.players[0];
  const x0 = p.x;
  press('KeyD'); step(30); release('KeyD');
  assert(p.x > x0, 'andou para a direita');
  press('KeyW'); step(300); release('KeyW');
  assert(p.y > A.config.T, 'não passou da parede de cima (y=' + p.y.toFixed(1) + ')');
});

test('atirar cria um tiro e conta nas estatísticas', () => {
  g.bullets.length = 0;
  const p = g.players[0];
  p.cd = 0;
  const shots0 = g.stats[0].shots;
  A.projectiles.shoot(p);
  assert.strictEqual(g.bullets.length, 1);
  assert.strictEqual(g.stats[0].shots, shots0 + 1);
  p.cd = 0; p.triple = 5;
  A.projectiles.shoot(p);
  assert.strictEqual(g.bullets.length, 4, 'tiro triplo cria 3 tiros');
  p.triple = 0;
});

test('tiro ricocheteia uma vez e depois some', () => {
  g.bullets.length = 0;
  g.bullets.push({ x: 300 - 2, y: 88, vx: 190, vy: 0, owner: 0, bounces: 1, life: 5, col: '#fff' });
  const b = g.bullets[0];
  for (let i = 0; i < 20 && b.bounces === 1; i++) A.projectiles.update(DT);
  assert.strictEqual(b.bounces, 0, 'gastou o ricochete');
  assert(b.vx < 0, 'inverteu a direção');
  for (let i = 0; i < 300 && g.bullets.length; i++) A.projectiles.update(DT);
  assert.strictEqual(g.bullets.length, 0, 'sumiu ao bater de novo');
});

test('escudo bloqueia um dano; depois o dano tira 1 de vida', () => {
  const p = g.players[1];
  p.shield = 6; p.hp = 5;
  A.game.damage(p, 0, 0);
  assert.strictEqual(p.hp, 5);
  assert.strictEqual(p.shield, 0);
  A.game.damage(p, 0, 0);
  assert.strictEqual(p.hp, 4);
});

test('coração recupera vida sem passar do máximo', () => {
  const p = g.players[1];
  p.hp = 4;
  A.powerups.collect(p, { type: 'heart', x: p.x, y: p.y });
  assert.strictEqual(p.hp, A.config.PLAYER.maxHp);
});

test('K.O.: ponto para o vencedor e próximo round começa', () => {
  const p = g.players[1];
  g.hitStop = 0; p.shield = 0; p.hp = 1;
  const before = g.scores[0];
  A.game.damage(p, 0, 0);
  assert.strictEqual(g.state, 'roundend');
  assert.strictEqual(g.scores[0], before + 1);
  assert.strictEqual(g.winner, 0);
  step(60 * 3); // o fim de round dura 2,6 s
  assert.strictEqual(g.state, 'countdown', 'novo round (ainda não acabou a partida)');
  assert.strictEqual(g.round, 2);
});

test('pausa congela o jogo e Esc volta ao menu', () => {
  step(60 * 4); // até o play
  assert.strictEqual(g.state, 'play');
  press('KeyP'); A.game.tick(DT); A.input.endFrame();
  assert(g.paused);
  const t0 = g.t; A.game.tick(DT);
  assert.strictEqual(g.t, t0, 'relógio parado');
  press('Escape'); A.game.tick(DT); A.input.endFrame();
  assert.strictEqual(g.state, 'menu');
  assert(!g.paused);
});

test('bot x bot: partida completa termina sem erro, em todos os mapas e dificuldades', () => {
  for (let diff = 0; diff < A.config.DIFFS.length; diff++) {
    for (let map = 0; map < A.maps.list.length; map++) {
      g.mode = 1; g.diffIdx = diff; g.mapIdx = map;
      A.game.startMatch();
      let frames = 0;
      while (g.state !== 'matchend' && frames < 60 * 60 * 6) { // limite de 6 min de jogo
        g.players.forEach(p => { p.bot = true; });
        A.game.update(DT); A.input.endFrame(); frames++;
      }
      assert.strictEqual(g.state, 'matchend',
        'partida travou (mapa ' + A.maps.list[map].name + ', dificuldade ' + A.config.DIFFS[diff].name + ')');
      assert(Math.max(g.scores[0], g.scores[1]) === A.config.MATCH.roundsToWin, 'alguém venceu 2 rounds');
      assert(g.stats[0].shots + g.stats[1].shots > 0, 'houve tiros');
      A.game.toMenu();
    }
  }
});

test('configurações são salvas e carregadas', () => {
  g.diffIdx = 2; g.mapIdx = 1; A.audio.setMuted(true);
  A.settings.save();
  g.diffIdx = 0; g.mapIdx = 0; A.audio.setMuted(false);
  A.settings.load();
  assert.strictEqual(g.diffIdx, 2);
  assert.strictEqual(g.mapIdx, 1);
  assert(A.audio.isMuted());
});

test('laço principal roda frames sem erro (menu e partida)', () => {
  assert(frames.length > 0, 'main.js pediu um frame');
  A.game.toMenu();
  for (let i = 0; i < 120; i++) { const fn = frames.pop(); if (!fn) break; fn(i * 16.7); }
  press('Enter');
  for (let i = 0; i < 300; i++) { const fn = frames.pop(); if (!fn) break; fn(2000 + i * 16.7); }
  A.render.frame();
});

console.log('\n' + passed + ' testes passaram' + (process.exitCode ? ', com falhas' : ''));

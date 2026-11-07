/*
 * render.js
 * Desenha cada frame: menu, arena, jogadores, tiros, efeitos, HUD e telas de overlay.
 * Só lê o estado (A.g); não altera regras do jogo.
 */
(function (A) {
  'use strict';

  const { W, H, HUD, T, COLS, ROWS, AW, AH, COL, PLAYER, POWER } = A.config;
  const g = A.g, fx = A.fx, D = A.draw;
  const R = D.R, text = D.text;

  const centered = (s, y, color, size) => text(s, W / 2, y, color, size, 'center');

  /* ---------- Arena ---------- */

  function drawArena() {
    const ctx = D.ctx;
    ctx.drawImage(A.maps.floor, 0, 0);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = A.maps.grid[y][x], px = x * T, py = y * T;
      if (c.t === 1) {
        R(px, py, T, T, COL.wall);
        R(px, py, T, 2, COL.wallHi); R(px, py, 2, T, COL.wallHi);
        R(px, py + T - 2, T, 2, COL.wallLo); R(px + T - 2, py, 2, T, COL.wallLo);
        R(px + 6, py + 6, 4, 4, COL.wallLo);
      } else if (c.t === 2) {
        const off = c.hit > 0 ? (Math.random() < 0.5 ? 1 : -1) : 0;
        R(px + 1 + off, py + 1, T - 2, T - 2, COL.crate);
        R(px + 1 + off, py + 1, T - 2, 2, COL.crateHi);
        R(px + 1 + off, py + T - 3, T - 2, 2, COL.crateLo);
        for (let k = 0; k < T - 4; k++) {
          R(px + 2 + k + off, py + 2 + k, 2, 2, COL.crateStroke);
          R(px + T - 4 - k + off, py + 2 + k, 2, 2, COL.crateStroke);
        }
        if (c.hp === 1) {
          R(px + 4 + off, py + 3, 1, 4, '#000'); R(px + 5 + off, py + 7, 1, 3, '#000'); R(px + 10 + off, py + 8, 1, 4, '#000');
        }
        if (c.hit > 0) R(px + 1 + off, py + 1, T - 2, T - 2, 'rgba(255,255,255,0.35)');
      }
    }
  }

  function drawPowerups() {
    for (const pu of g.powerups) {
      if (pu.life < 2.5 && Math.floor(pu.life * 8) % 2 === 0) continue; // pisca antes de sumir
      const bob = Math.round(Math.sin(g.t * 4 + pu.x) * 1.5);
      const scale = Math.min(1, pu.pop * 5);
      R(pu.x - 5, pu.y + 6, 10, 2, 'rgba(0,0,0,0.35)');
      const pulse = 7 + Math.round(Math.sin(g.t * 6));
      D.ring(pu.x, pu.y + bob, pulse * scale, POWER.colors[pu.type]);
      if (scale > 0.6) D.icon(pu.type, pu.x, pu.y + bob);
    }
  }

  function drawPlayer(p, opts) {
    if (!p.alive) return;
    const main = p.i === 0 ? COL.p1 : COL.p2, dark = p.i === 0 ? COL.p1d : COL.p2d;
    const x = Math.round(p.x), y = Math.round(p.y), t = g.t;
    R(x - 5, y + 5, 10, 3, 'rgba(0,0,0,0.38)');

    const step = Math.floor(p.walk) % 2;
    const bob = p.moving ? (step ? -1 : 0) : (Math.sin(t * 3 + p.i) > 0.3 ? -1 : 0);
    const sq = p.squash > 0 ? 1 : 0;
    const leg = p.moving ? (step ? -1 : 1) : 0;

    R(x - 4, y + 2 + leg, 3, 3, '#1a1530'); R(x + 1, y + 2 - leg, 3, 3, '#1a1530'); // pernas
    R(x - 4, y - 3 + bob + sq, 8, 6 - sq, main);                                   // corpo
    R(x - 4, y + 1 + bob, 8, 2, dark);

    const len = Math.hypot(p.fx, p.fy) || 1, dx = p.fx / len, dy = p.fy / len;
    for (let k = 3; k < 9; k++) R(x + dx * k - 1, y + dy * k - 1 + bob, 2, 2, k > 6 ? '#e8e2ff' : '#8f86b8'); // arma
    R(x + dx * 9 - 1, y + dy * 9 - 1 + bob, 2, 2, '#ffffff');

    R(x - 4, y - 9 + bob, 8, 6, main);                                             // capacete
    R(x - 4, y - 9 + bob, 8, 1, 'rgba(255,255,255,0.35)');
    R(x - 3, y - 7 + bob, 6, 3, '#120d24');
    const ex = Math.round(dx), ey = Math.round(dy * 0.5);                         // olhos seguem a mira
    R(x - 2 + ex, y - 7 + bob + ey, 1, 2, '#ffffff'); R(x + 1 + ex, y - 7 + bob + ey, 1, 2, '#ffffff');

    if (p.hitFlash > 0) R(x - 4, y - 9 + bob, 8, 12, 'rgba(255,255,255,0.8)');
    if (p.shield > 0 && (p.shield > 1.5 || Math.floor(p.shield * 8) % 2)) {
      D.ring(x, y - 3 + bob, 11 + Math.round(Math.sin(t * 8)), COL.p1);
    }
    if (p.rapid > 0 && Math.random() < 0.4) fx.spark(x + (Math.random() - 0.5) * 8, y - 8, POWER.colors.bolt, 0.3, -20);
    if (p.triple > 0 && Math.random() < 0.3) fx.spark(x + (Math.random() - 0.5) * 8, y - 8, POWER.colors.triple, 0.3, -20);

    if (!opts || !opts.noTag) text(p.i === 0 ? 'P1' : (p.bot ? 'BOT' : 'P2'), x, y - 19 + bob, main, 8, 'center');
  }

  function drawBullets() {
    for (const b of g.bullets) {
      R(b.x - 2, b.y - 2, 4, 4, b.col);
      R(b.x - 1, b.y - 1, 2, 2, '#ffffff');
      R(b.x - 3, b.y + 3, 6, 1, 'rgba(0,0,0,0.3)');
    }
  }

  function drawEffects() {
    const ctx = D.ctx;
    for (const p of fx.particles) {
      ctx.globalAlpha = Math.min(1, Math.max(0, p.life / p.max) * 1.5);
      R(p.x, p.y, p.size, p.size, p.color);
    }
    for (const a of fx.afterimages) {
      ctx.globalAlpha = a.life / a.max * 0.5;
      R(a.x - 4, a.y - 9, 8, 14, a.i === 0 ? COL.p1 : COL.p2);
    }
    ctx.globalAlpha = 1;
    for (const x of fx.texts) {
      ctx.globalAlpha = Math.min(1, x.life / x.max * 2);
      text(x.s, x.x, x.y, x.color, 8, 'center');
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- HUD ---------- */

  function drawHeart(x, y, full) {
    D.sprite(['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'], { r: full ? POWER.colors.heart : '#3a2f5e' }, x, y);
  }

  function drawHUD() {
    R(0, 0, W, HUD, '#0a0818');
    R(0, HUD - 1, W, 1, '#2d2552');
    for (const p of g.players) {
      const left = p.i === 0, base = left ? 6 : W - 6, main = left ? COL.p1 : COL.p2;
      text(left ? 'P1' : (p.bot ? 'BOT' : 'P2'), base, 3, main, 8, left ? 'left' : 'right');
      for (let h = 0; h < PLAYER.maxHp; h++) {
        const hx = left ? base + 30 + h * 7 : base - 35 - (PLAYER.maxHp - 1 - h) * 7;
        drawHeart(hx, 3, h < p.hp);
      }
      // barra do dash
      const dw = 22, fill = Math.round(dw * (1 - Math.max(0, p.dashCd) / PLAYER.dashCooldown));
      const bx = left ? base : base - dw;
      R(bx, 14, dw, 3, '#2a2250'); R(bx, 14, fill, 3, p.dashCd <= 0 ? '#ffffff' : '#8f86b8');
      // barras dos efeitos ativos
      let ex = left ? base + 28 : base - 36;
      for (const [k, c] of [['rapid', POWER.colors.bolt], ['triple', POWER.colors.triple], ['shield', POWER.colors.shield]]) {
        if (p[k] > 0) {
          R(ex, 14, 10, 3, '#2a2250'); R(ex, 14, Math.round(p[k] / POWER.duration * 10), 3, c);
          ex += left ? 12 : -12;
        }
      }
    }
    text('ROUND ' + g.round, W / 2, 3, COL.ink, 8, 'center');
    for (let i = 0; i < 2; i++) { // pontos de vitória
      R(W / 2 - 18 - i * 7, 14, 5, 5, g.scores[0] > i ? COL.p1 : '#2a2250');
      R(W / 2 + 14 + i * 7, 14, 5, 5, g.scores[1] > i ? COL.p2 : '#2a2250');
    }
  }

  /* ---------- Telas ---------- */

  function drawMenu() {
    const ctx = D.ctx, t = g.t, menu = A.menu;
    R(0, 0, W, H, '#0a0818');
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) if (((x + y) / 16) % 2) R(x, y, 16, 16, '#0e0b20');
    const off = Math.floor(t * 20) % 16;
    for (let y = -16 + off; y < H; y += 16) R(0, y, W, 1, 'rgba(120,100,220,0.12)');
    drawEffects();

    // título ondulando, letra por letra
    const title = 'ARENA DUEL';
    ctx.font = '16px ' + A.config.FONT; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    let cx = Math.round((W - ctx.measureText(title).width) / 2);
    for (let i = 0; i < title.length; i++) {
      const ch = title[i], w = ctx.measureText(ch).width, yy = 22 + Math.round(Math.sin(t * 3 + i * 0.6) * 3);
      ctx.fillStyle = '#000'; ctx.fillText(ch, cx + 2, yy + 2);
      ctx.fillStyle = i < 5 ? COL.p1 : COL.p2; ctx.fillText(ch, cx, yy);
      cx += w;
    }

    // dois lutadores de enfeite e um tiro de ping-pong
    const a = A.player.make(0, 2), b = A.player.make(1, 2);
    a.x = 62; b.x = W - 62; a.y = 76 + Math.sin(t * 2) * 3; b.y = 76 + Math.cos(t * 2) * 3;
    a.moving = b.moving = true; a.walk = t * 8; b.walk = t * 8 + 1;
    drawPlayer(a, { noTag: true }); drawPlayer(b, { noTag: true });
    const bx = 70 + ((t * 90) % 180), dir = Math.floor((t * 90) / 180) % 2, px = dir ? W - bx : bx;
    R(px - 2, 74, 4, 4, dir ? COL.p2 : COL.p1); R(px - 1, 75, 2, 2, '#fff');

    const labels = menu.labels();
    for (let i = 0; i < menu.count; i++) {
      const y = menu.rowY(i), sel = i === menu.sel;
      if (sel) {
        R(W / 2 - 84, y - 3, 168, 14, '#241d45');
        R(W / 2 - 84, y - 3, 168, 1, '#4b3f86'); R(W / 2 - 84, y + 10, 168, 1, '#4b3f86');
        text('>', W / 2 - 78 + Math.round(Math.sin(t * 8) * 1.5), y, COL.gold, 8);
        if (i >= 2) text('< >', W / 2 + 80, y, COL.gold, 8, 'right');
      }
      centered(labels[i], y, sel ? '#ffffff' : COL.muted);
    }
    if (Math.floor(t * 2) % 2 === 0) centered('ENTER PARA JOGAR', 170, COL.gold);
    centered('W/S ESCOLHE  A/D TROCA', 184, '#6f66a0');
  }

  function drawOverlay() {
    const ctx = D.ctx, t = g.t;
    if (g.state === 'countdown') {
      const c = Math.ceil(g.stateT), frac = g.stateT - Math.floor(g.stateT);
      const s = c >= 1 && c <= 3 ? String(c) : 'LUTAR!';
      const size = 16 + Math.round((1 - frac) * 8);
      ctx.globalAlpha = 0.35; R(0, HUD, W, AH, '#000'); ctx.globalAlpha = 1;
      centered('ROUND ' + g.round, HUD + 30, COL.ink, 8);
      centered(A.maps.list[g.mapIdx].name, HUD + 44, COL.muted, 8);
      centered(s, HUD + AH / 2 - size / 2, COL.gold, size);
    }
    if (g.state === 'roundend' && g.winner >= 0) {
      const wc = g.winner === 0 ? COL.p1 : COL.p2, name = g.winner === 0 ? 'P1' : (g.mode === 1 ? 'BOT' : 'P2');
      ctx.globalAlpha = 0.5; R(0, HUD + AH / 2 - 30, W, 58, '#000'); ctx.globalAlpha = 1;
      centered('K.O.!', HUD + AH / 2 - 24 + Math.round(Math.sin(t * 14) * 1), COL.gold, 16);
      centered(name + ' VENCEU O ROUND', HUD + AH / 2 + 6, wc, 8);
    }
    if (g.state === 'matchend') {
      const wc = g.winner === 0 ? COL.p1 : COL.p2;
      const name = g.winner === 0 ? 'JOGADOR 1' : (g.mode === 1 ? 'O BOT' : 'JOGADOR 2');
      ctx.globalAlpha = 0.72; R(0, 0, W, H, '#05030d'); ctx.globalAlpha = 1;
      centered('FIM DE PARTIDA', 28, COL.ink, 8);
      centered(name, 46 + Math.round(Math.sin(t * 5) * 2), wc, 16);
      centered('VENCEU!', 68, COL.gold, 16);
      centered(g.scores[0] + ' x ' + g.scores[1], 98, COL.ink, 16);
      const acc = g.stats.map(s => s.shots ? Math.min(100, Math.round(s.hits / s.shots * 100)) : 0);
      centered('PRECISAO DE TIRO', 128, COL.muted, 8);
      text('P1 ' + acc[0] + '%', W / 2 - 20, 142, COL.p1, 8, 'right');
      text((g.mode === 1 ? 'BOT ' : 'P2 ') + acc[1] + '%', W / 2 + 20, 142, COL.p2, 8, 'left');
      if (Math.floor(t * 2) % 2 === 0) centered('ENTER: REVANCHE', 166, COL.gold);
      centered('ESC: MENU', 182, '#6f66a0');
      drawEffects();
    }
    if (g.paused) {
      ctx.globalAlpha = 0.65; R(0, 0, W, H, '#05030d'); ctx.globalAlpha = 1;
      centered('PAUSADO', H / 2 - 20, COL.gold, 16);
      centered('P: CONTINUAR', H / 2 + 8, COL.ink, 8);
      centered('ESC: MENU', H / 2 + 24, COL.muted, 8);
    }
  }

  /* ---------- Frame ---------- */

  A.render = {
    frame() {
      const ctx = D.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      if (g.state === 'menu') { drawMenu(); if (g.paused) drawOverlay(); return; }

      R(0, 0, W, H, '#05030d');
      drawHUD();

      const sx = fx.shake > 0 ? Math.round((Math.random() * 2 - 1) * fx.shake) : 0;
      const sy = fx.shake > 0 ? Math.round((Math.random() * 2 - 1) * fx.shake) : 0;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, HUD, W, AH); ctx.clip();
      ctx.translate(sx, HUD + sy);
      drawArena();
      drawPowerups();
      for (const p of g.players.slice().sort((a, b) => a.y - b.y)) drawPlayer(p); // quem está mais embaixo fica na frente
      drawBullets();
      drawEffects();
      if (fx.flash > 0) { ctx.globalAlpha = fx.flash * 2.2; R(0, 0, AW, AH, '#ffffff'); ctx.globalAlpha = 1; }
      ctx.restore();
      drawOverlay();
    }
  };
})(window.Arena = window.Arena || {});

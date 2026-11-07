/*
 * draw.js
 * Primitivas de desenho em pixel art: retângulo, texto, anel e sprites por mapa de caracteres.
 * Precisa de draw.init(ctx) antes de usar.
 */
(function (A) {
  'use strict';

  const { FONT } = A.config;

  // Ícones dos power-ups: cada letra é uma cor da paleta, '.' é transparente.
  const ICONS = {
    heart: { map: ['.rr.rr.', 'rrwrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], pal: { r: '#ff4d6d', w: '#ffc2cf' } },
    bolt: { map: ['...yy.', '..yy..', '.yyyy.', '...yy.', '..yy..', '.yy...'], pal: { y: '#ffd23f' } },
    shield: { map: ['ccccccc', 'cwwcccd', 'cwccccd', 'cccccdd', '.cccdd.', '..cdd..', '...d...'], pal: { c: '#4ad8ff', w: '#d8f6ff', d: '#1f8fb8' } },
    triple: { map: ['m..m..m', '.m.m.m.', '..mmm..', '...m...', '...m...'], pal: { m: '#d65bff' } }
  };

  const D = A.draw = {
    ctx: null,

    init(ctx) { D.ctx = ctx; },

    /** Retângulo com coordenadas arredondadas (mantém o visual de pixel). */
    R(x, y, w, h, color) {
      D.ctx.fillStyle = color;
      D.ctx.fillRect(Math.round(x), Math.round(y), w, h);
    },

    text(s, x, y, color, size, align, shadow) {
      const ctx = D.ctx;
      ctx.font = (size || 8) + 'px ' + FONT;
      ctx.textBaseline = 'top';
      ctx.textAlign = align || 'left';
      if (shadow !== false) { ctx.fillStyle = '#000'; ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1); }
      ctx.fillStyle = color || '#fff';
      ctx.fillText(s, Math.round(x), Math.round(y));
    },

    /** Círculo vazio feito de pixels (não usa arco suavizado). */
    ring(cx, cy, r, color) {
      const ctx = D.ctx, n = Math.max(12, r * 5);
      ctx.fillStyle = color;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
      }
    },

    /** Desenha um sprite descrito por linhas de caracteres. */
    sprite(map, pal, x, y) {
      for (let j = 0; j < map.length; j++) for (let i = 0; i < map[j].length; i++) {
        const c = map[j][i];
        if (c !== '.') D.R(x + i, y + j, 1, 1, pal[c]);
      }
    },

    icon(type, cx, cy) {
      const ic = ICONS[type], w = ic.map[0].length, h = ic.map.length;
      D.sprite(ic.map, ic.pal, Math.round(cx - w / 2), Math.round(cy - h / 2));
    }
  };
})(window.Arena = window.Arena || {});

/*
 * storage.js
 * Salva e carrega as preferências (dificuldade, mapa, som) no navegador.
 * Tudo dentro de try/catch: se o armazenamento estiver bloqueado, o jogo segue normal.
 */
(function (A) {
  'use strict';

  const KEY = 'arenaDuel.settings.v1';

  A.settings = {
    load() {
      try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return;
        const s = JSON.parse(raw);
        const g = A.g;
        if (Number.isInteger(s.diffIdx) && s.diffIdx >= 0 && s.diffIdx < A.config.DIFFS.length) g.diffIdx = s.diffIdx;
        if (Number.isInteger(s.mapIdx) && s.mapIdx >= 0 && s.mapIdx < A.maps.list.length) g.mapIdx = s.mapIdx;
        if (typeof s.muted === 'boolean') A.audio.setMuted(s.muted);
      } catch (e) { /* sem armazenamento: ignora */ }
    },
    save() {
      try {
        const g = A.g;
        window.localStorage.setItem(KEY, JSON.stringify({
          diffIdx: g.diffIdx, mapIdx: g.mapIdx, muted: A.audio.isMuted()
        }));
      } catch (e) { /* ignora */ }
    }
  };
})(window.Arena = window.Arena || {});

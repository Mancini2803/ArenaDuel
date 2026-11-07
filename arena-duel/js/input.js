/*
 * input.js
 * Teclado. isDown(code) vale enquanto a tecla está segurada;
 * was(code) vale só no frame em que ela foi apertada (use para dash, menu, pausa).
 * Os códigos são os de KeyboardEvent.code (ex.: 'KeyW', 'ArrowUp', 'Space').
 */
(function (A) {
  'use strict';

  const down = new Set();
  const pressed = new Set();
  const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

  const input = A.input = {
    press(code, repeat) {
      if (!repeat) pressed.add(code);
      down.add(code);
    },
    release(code) { down.delete(code); },
    clear() { down.clear(); },
    isDown: code => down.has(code),
    was: code => pressed.has(code),
    endFrame() { pressed.clear(); },

    attach(win) {
      win.addEventListener('keydown', e => {
        if (PREVENT.has(e.code)) e.preventDefault(); // evita rolar a página
        A.audio.init();
        input.press(e.code, e.repeat);
      });
      win.addEventListener('keyup', e => input.release(e.code));
      win.addEventListener('blur', () => input.clear());
    }
  };
})(window.Arena = window.Arena || {});

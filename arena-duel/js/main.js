/*
 * main.js
 * Ponto de entrada: prepara o canvas, liga teclado/mouse/botões e roda o laço do jogo.
 */
(function (A) {
  'use strict';

  const { W, H } = A.config;
  const g = A.g;

  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  A.draw.init(ctx);

  /* Ajusta o tamanho do canvas. Em escala inteira (2x, 3x...) o pixel art fica mais nítido. */
  function fit() {
    const wrapW = Math.min(cv.parentElement.clientWidth - 24, 960);
    const availH = Math.max(window.innerHeight - 140, 200);
    let s = Math.min(wrapW / W, availH / H);
    if (s >= 2) s = Math.floor(s);
    cv.style.width = Math.floor(W * s) + 'px';
    cv.style.height = Math.floor(H * s) + 'px';
  }
  window.addEventListener('resize', fit);
  fit();

  /* Botões da página */
  const btnMute = document.getElementById('btnMute');
  const btnFull = document.getElementById('btnFull');
  const syncMuteLabel = () => { btnMute.textContent = 'Som: ' + (A.audio.isMuted() ? 'desligado' : 'ligado'); };
  function toggleMute() { A.audio.toggleMute(); syncMuteLabel(); A.settings.save(); }

  btnMute.addEventListener('click', () => { A.audio.init(); toggleMute(); cv.focus(); });
  btnFull.addEventListener('click', () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else cv.parentElement.requestFullscreen().catch(() => {});
    } catch (e) { /* tela cheia não disponível */ }
    cv.focus();
  });
  document.addEventListener('fullscreenchange', () => setTimeout(fit, 50));

  /* Mouse: clicar numa linha do menu */
  cv.addEventListener('mousedown', e => {
    cv.focus(); A.audio.init();
    if (g.state !== 'menu') return;
    const r = cv.getBoundingClientRect();
    const row = A.menu.hit((e.clientY - r.top) / r.height * H);
    if (row >= 0) { A.menu.sel = row; A.menu.activate(row); }
  });

  A.input.attach(window);
  document.addEventListener('visibilitychange', () => { if (document.hidden) A.game.autoPause(); });

  /* Preferências salvas */
  A.settings.load();
  syncMuteLabel();

  /* Laço principal */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (A.input.was('KeyM')) toggleMute();
    A.game.tick(dt);
    A.render.frame();
    A.input.endFrame();
    requestAnimationFrame(frame);
  }

  // Espera a fonte pixel carregar (no máximo 1,5 s) para o texto não piscar.
  const boot = () => requestAnimationFrame(frame);
  if (document.fonts && document.fonts.load) {
    Promise.race([
      Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('16px "Press Start 2P"')]),
      new Promise(resolve => setTimeout(resolve, 1500))
    ]).then(boot, boot);
  } else boot();
})(window.Arena = window.Arena || {});

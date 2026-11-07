/*
 * ai.js
 * Bot baseado em regras (sem aprendizado de máquina).
 * A cada frame ele decide: para onde mirar, como se mover, se desvia e se atira.
 * A dificuldade só muda números (ver DIFFS em config.js).
 */
(function (A) {
  'use strict';

  const g = A.g;

  const angDiff = (a, b) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };

  A.ai = {
    /** p = bot, o = oponente. Devolve o mesmo formato que a leitura de teclado. */
    botInput(p, o, dt) {
      const D = A.config.DIFFS[g.diffIdx], ai = p.ai;
      ai.strafeT -= dt; ai.think -= dt; ai.jitter -= dt;
      if (ai.strafeT <= 0) { ai.strafe = Math.random() < 0.5 ? -1 : 1; ai.strafeT = 0.8 + Math.random() * 1.4; }

      // 1) Mira: aponta para onde o alvo estará, com erro aleatório.
      const dist = Math.hypot(o.x - p.x, o.y - p.y) || 1;
      const lead = dist / A.config.GUN.speed * 0.6;
      const tx = o.x + o.vx * lead, ty = o.y + o.vy * lead;
      if (ai.think <= 0) {
        ai.think = D.react;
        ai.ang = Math.atan2(ty - p.y, tx - p.x) + (Math.random() * 2 - 1) * D.err;
      }
      const dAng = angDiff(p.faceAng, ai.ang), step = D.turn * dt; // giro com velocidade limitada
      p.faceAng += Math.abs(dAng) < step ? dAng : Math.sign(dAng) * step;
      p.fx = Math.cos(p.faceAng); p.fy = Math.sin(p.faceAng);

      // 2) Movimento: aproxima, recua ou anda de lado, conforme a distância.
      const ux = (o.x - p.x) / dist, uy = (o.y - p.y) / dist;
      const toward = dist > 95 ? 1 : dist < 55 ? -1 : 0;
      let mx = ux * toward + -uy * ai.strafe * 0.9;
      let my = uy * toward + ux * ai.strafe * 0.9;

      // 3) Desvio: se um tiro vem na direção do bot, sai da linha (e pode dar dash).
      let dashNow = false;
      for (const b of g.bullets) {
        if (b.owner === p.i) continue;
        const rx = p.x - b.x, ry = p.y - b.y, sp = Math.hypot(b.vx, b.vy);
        const along = (rx * b.vx + ry * b.vy) / sp;       // distância até o tiro, ao longo da trajetória
        if (along < 0 || along > 90) continue;
        const perp = (rx * -b.vy + ry * b.vx) / sp;       // distância lateral até a trajetória
        if (Math.abs(perp) < 9 && Math.random() < D.dodge * 0.35 + 0.05) {
          const side = perp >= 0 ? 1 : -1;
          mx += (-b.vy / sp) * side * 2.4;
          my += (b.vx / sp) * side * 2.4;
          if (along < 38 && p.dashCd <= 0 && Math.random() < D.dodge * 0.5) dashNow = true;
        }
      }

      // 4) Power-ups por perto atraem o bot (coração só se estiver ferido).
      let best = null, bd = 80;
      for (const pu of g.powerups) {
        if (pu.type === 'heart' && p.hp >= A.config.PLAYER.maxHp) continue;
        const d = Math.hypot(pu.x - p.x, pu.y - p.y);
        if (d < bd) { bd = d; best = pu; }
      }
      if (best) { mx += (best.x - p.x) / bd * 1.6; my += (best.y - p.y) / bd * 1.6; }

      // 5) Se ficou preso, anda numa direção aleatória por um instante.
      if (ai.jitter > 0) { mx = ai.jx; my = ai.jy; }
      else {
        ai.stuck += dt;
        if (ai.stuck > 0.4) {
          if (Math.hypot(p.x - ai.lx, p.y - ai.ly) < 3) {
            const a = Math.random() * Math.PI * 2;
            ai.jx = Math.cos(a); ai.jy = Math.sin(a); ai.jitter = 0.5; ai.strafe *= -1;
          }
          ai.lx = p.x; ai.ly = p.y; ai.stuck = 0;
        }
      }
      const m = Math.hypot(mx, my);
      if (m > 1) { mx /= m; my /= m; }

      // 6) Atira só com linha de visão, mirando perto o bastante e passando no sorteio.
      const los = A.maps.hasLOS(p, o);
      const aimed = Math.abs(angDiff(p.faceAng, Math.atan2(o.y - p.y, o.x - p.x))) < 0.14 + D.err * 0.4;
      const fire = los && aimed && Math.random() < D.fire * 0.35 + (p.rapid > 0 ? 0.2 : 0);

      return { mx, my, speed: D.spd, fire, dash: dashNow };
    }
  };
})(window.Arena = window.Arena || {});

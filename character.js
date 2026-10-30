/* =================================================================
   ORS avatar — "Pip"  (sleek-vector, genderless; NOT Mario)
   One procedurally-drawn identity, premium-shaded, used in BOTH the
   side-scrolling homepage and the top-down HQ room.

   Design: an oversized rounded helmet-dome with a glossy wrap visor,
   a compact capsule body, short capsule limbs, the ORS four-point
   spark as a chest emblem + antenna tip. Rim-lit, soft contact
   shadow, squash/stretch, a distance-based run cycle, blink, eye
   gaze, a collect "cheer", and a pipe-entry sink.

   ORSChar.draw(ctx, {
     x, y,            // FEET-centre position
     facing,          // 1 right | -1 left
     scale,           // 1 ≈ 66px tall
     vx, vy, grounded,// motion (drives state unless `state` given)
     phase,           // run-cycle accumulator (radians); optional
     t,               // seconds (idle breathe / blink / spark spin)
     sink,            // 0..1 descend-into-pipe (lower + squash + fade)
     cheer            // 0..1 collect reaction
   })
================================================================= */
(function (global) {
  const C = {
    hi:   '#F6EFDC',   // warm cream body light
    mid:  '#E8DEC4',
    lo:   '#C9BC9D',   // warm shade
    edge: 'rgba(246,221,150,.8)',  // warm gold rim light
    visor:'#2B2015',   // espresso visor
    visor2:'#45331F',
    eye:  '#F4D58C',   // warm amber eyes
    eyeHot:'#FFF7E6',
    star: '#E7B23A',   // mustard emblem
    lime: '#C6D84A',
    line: 'rgba(255,250,238,.5)',
    dark: 'rgba(28,20,12,.9)',
  };

  function star4(ctx, R, waist) {
    waist = waist == null ? 0.42 : waist;
    const p = [0, 1, 2, 3].map(i => {
      const a = i * Math.PI / 2 - Math.PI / 2;
      return [Math.cos(a) * R, Math.sin(a) * R];
    });
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 0; i < 4; i++) {
      const a = p[i], b = p[(i + 1) % 4];
      ctx.quadraticCurveTo((a[0] + b[0]) / 2 * waist, (a[1] + b[1]) / 2 * waist, b[0], b[1]);
    }
    ctx.closePath();
  }

  // capsule limb: thick round-capped line with a shading gradient
  function limb(ctx, x1, y1, x2, y2, w, c1, c2) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.strokeStyle = g; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function draw(ctx, o) {
    const s = o.scale == null ? 1 : o.scale;
    const facing = o.facing || 1;
    const vx = o.vx || 0, vy = o.vy || 0, t = o.t || 0;
    const grounded = o.grounded !== false;
    const sink = Math.max(0, Math.min(1, o.sink || 0));
    const cheer = Math.max(0, Math.min(1, o.cheer || 0));
    const speed = Math.abs(vx);
    const running = grounded && speed > 14;
    const phase = o.phase != null ? o.phase : t * 10;

    // ---- squash / stretch ----
    let sx = 1, sy = 1;
    if (sink > 0) { sy = 1 - sink * 0.62; sx = 1 + sink * 0.28; }
    else if (!grounded) {
      const str = Math.max(-1, Math.min(1, vy / 760));
      sy = 1 - str * 0.17; sx = 1 + str * 0.12;        // stretch up, squash before landing
    } else {
      const br = Math.sin(t * 2.3) * 0.015;
      sy = 1 - br; sx = 1 + br;
      if (running) { const k = Math.abs(Math.sin(phase)) * 0.05; sy -= k; sx += k; }
    }

    const bob = running ? Math.abs(Math.sin(phase)) * 3.4 * s : 0;
    const lean = grounded ? Math.max(-0.16, Math.min(0.16, vx / 1300)) : vx / 2400;
    const alpha = 1 - sink * 0.9;

    // ================= CONTACT SHADOW (world-aligned) =================
    ctx.save();
    ctx.globalAlpha = alpha * (grounded ? 0.34 : 0.16) * (1 - sink * 0.6);
    ctx.fillStyle = '#000';
    const shW = 16 * s * (running ? 1 - Math.abs(Math.sin(phase)) * .12 : 1);
    ctx.beginPath(); ctx.ellipse(o.x, o.y + 2 * s, shW, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ================= BODY SPACE =================
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(o.x, o.y - bob + sink * 30 * s);
    ctx.scale(facing * s, s);
    ctx.rotate(lean);
    ctx.scale(sx, sy);

    const armUp = cheer * -18;

    // ---------- LEGS ----------
    const sw = running ? Math.sin(phase) * 7 : 0;
    const liftF = running ? Math.max(0, Math.sin(phase)) * 6 : 0;
    const liftB = running ? Math.max(0, -Math.sin(phase)) * 6 : 0;
    // back leg
    limb(ctx, -5, -18, -6 - sw, -2 - liftB, 7.5, C.lo, '#9f9a88');
    foot(ctx, -6 - sw, -2 - liftB, -1);
    // front leg
    limb(ctx, 4, -18, 5 + sw, -2 - liftF, 8, C.mid, C.lo);
    foot(ctx, 5 + sw, -2 - liftF, 1);

    // ---------- BACK ARM ----------
    const asw = running ? Math.sin(phase) * 5 : Math.sin(t * 2.3) * 1.3;
    limb(ctx, -9, -34, -13 - asw, -24 + armUp, 6, '#b7b1a0', '#a39d8c');

    // ---------- BODY ----------
    const bg = ctx.createLinearGradient(-13, -38, 10, -14);
    bg.addColorStop(0, C.hi); bg.addColorStop(.55, C.mid); bg.addColorStop(1, C.lo);
    ctx.fillStyle = bg;
    roundRectPath(ctx, -12.5, -38, 25, 27, 12); ctx.fill();
    // rim light (upper-left)
    ctx.strokeStyle = C.edge; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, -25, 12.5, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke();
    // ambient occlusion where head meets body
    ctx.fillStyle = 'rgba(70,66,52,.18)';
    roundRectPath(ctx, -12.5, -38, 25, 7, 6); ctx.fill();

    // chest emblem — ORS spark
    ctx.save(); ctx.translate(1.5, -25); ctx.rotate(t * 0.7);
    ctx.shadowColor = 'rgba(231,178,58,.75)'; ctx.shadowBlur = 8;
    ctx.fillStyle = C.star; star4(ctx, 5); ctx.fill();
    ctx.restore();

    // ---------- HEAD / HELMET ----------
    const hy = -52;
    const hg = ctx.createRadialGradient(-7, hy - 7, 3, -2, hy, 22);
    hg.addColorStop(0, '#FBF7EC'); hg.addColorStop(.6, C.mid); hg.addColorStop(1, C.lo);
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.ellipse(0, hy, 19.5, 18.5, 0, 0, Math.PI * 2); ctx.fill();
    // rim light
    ctx.strokeStyle = C.edge; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, hy, 18.6, Math.PI * 1.02, Math.PI * 1.9); ctx.stroke();
    // soft base shadow
    ctx.strokeStyle = 'rgba(120,114,96,.3)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, hy, 18.6, Math.PI * 0.12, Math.PI * 0.78); ctx.stroke();

    // antenna + spark
    ctx.strokeStyle = C.lo; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-1, hy - 18); ctx.lineTo(-4, hy - 27); ctx.stroke();
    ctx.save(); ctx.translate(-4, hy - 29); ctx.rotate(t * 1.5);
    ctx.shadowColor = 'rgba(244,213,140,.92)'; ctx.shadowBlur = 7;
    ctx.fillStyle = C.eye; star4(ctx, 3); ctx.fill(); ctx.restore();

    // visor
    const vg = ctx.createLinearGradient(0, hy - 6, 0, hy + 11);
    vg.addColorStop(0, C.visor2); vg.addColorStop(1, C.visor);
    ctx.fillStyle = vg;
    roundRectPath(ctx, -15, hy - 5.5, 30, 16, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; roundRectPath(ctx, -15, hy - 5.5, 30, 16, 8); ctx.stroke();

    // eyes
    const blink = ((t % 4.4) > 4.26 || Math.sin(t * 0.6) > 0.985) ? 0.12 : 1;
    const happy = cheer > 0.2 ? 1 : 0;
    const gaze = running ? 2.4 : 1.3;
    ctx.save();
    ctx.shadowColor = 'rgba(244,213,140,.92)'; ctx.shadowBlur = 9;
    const ex = 5.6, ey = hy + 2.2;
    for (const sgn of [-1, 1]) {
      ctx.fillStyle = C.eye;
      if (happy) { // upward crescent
        ctx.lineWidth = 2.4; ctx.strokeStyle = C.eye; ctx.shadowBlur = 9;
        ctx.beginPath(); ctx.arc(sgn * ex + gaze, ey + 1, 3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.ellipse(sgn * ex + gaze, ey, 2.7, 3.6 * blink, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.eyeHot;
        ctx.beginPath(); ctx.ellipse(sgn * ex + gaze + .7, ey - 1, 1.05, 1.3 * blink, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();

    // visor gloss
    ctx.globalAlpha = alpha * 0.22; ctx.fillStyle = '#fff';
    roundRectPath(ctx, -12, hy - 3.5, 12, 4.5, 2.2); ctx.fill();
    ctx.globalAlpha = alpha;

    // ---------- FRONT ARM ----------
    limb(ctx, 9, -34, 13 + asw, -24 + armUp, 6.5, C.mid, C.lo);
    // little hand
    ctx.fillStyle = C.hi; ctx.beginPath(); ctx.arc(13 + asw, -24 + armUp, 3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function foot(ctx, x, y, dir) {
    ctx.fillStyle = C.visor;
    roundRectPath(ctx, x - 4.5 + (dir > 0 ? 1 : -1) * 1.5, y - 2, 9, 6, 3);
    ctx.fill();
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // compact head badge for UI (agent portrait / HUD)
  function portrait(ctx, x, y, r, col) {
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(-r * .3, -r * .3, 2, 0, 0, r);
    g.addColorStop(0, '#FBF7EC'); g.addColorStop(1, C.lo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    const vg = ctx.createLinearGradient(0, -r * .3, 0, r * .5);
    vg.addColorStop(0, C.visor2); vg.addColorStop(1, C.visor);
    ctx.fillStyle = vg; roundRectPath(ctx, -r * .82, -r * .28, r * 1.64, r * .8, r * .4); ctx.fill();
    ctx.fillStyle = col || C.eye; ctx.shadowColor = col || C.eye; ctx.shadowBlur = r * .4;
    ctx.beginPath(); ctx.arc(-r * .3, r * .08, r * .14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * .3, r * .08, r * .14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  global.ORSChar = { draw, portrait, star4, COL: C };
})(window);

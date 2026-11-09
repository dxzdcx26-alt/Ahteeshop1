/* Particle เว็บ: snow | sock | coin | ghost — ตั้งค่าจาก window.SITE_PARTICLE = {type, amount} */
(function () {
  var cfg = window.SITE_PARTICLE || {};
  var type = cfg.type;
  var SPEED = Math.max(0.2, Math.min(3, +cfg.speed || 1));
  if (!type || type === 'none') return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cv = document.createElement('canvas');
  cv.id = 'site-particles';
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1015';
  document.body.appendChild(cv);
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  // ---------- วาด sprite ล่วงหน้า ----------
  function sprite(size, draw) {
    var c = document.createElement('canvas');
    c.width = c.height = Math.ceil(size * DPR);
    var g = c.getContext('2d');
    g.scale(DPR, DPR);
    draw(g, size);
    return c;
  }
  function snowflake(g, s) {
    g.shadowColor = 'rgba(60,80,120,.35)'; g.shadowBlur = s / 6;
    var r = s / 2, grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.45, 'rgba(255,255,255,.85)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(r, r, r, 0, Math.PI * 2); g.fill();
  }
  function crystal(g, s) {
    g.shadowColor = 'rgba(60,80,120,.35)'; g.shadowBlur = s / 8;
    var r = s / 2; g.translate(r, r); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = s / 14; g.lineCap = 'round';
    for (var i = 0; i < 6; i++) {
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * .9);
      g.moveTo(0, -r * .5); g.lineTo(r * .22, -r * .68); g.moveTo(0, -r * .5); g.lineTo(-r * .22, -r * .68);
      g.stroke(); g.rotate(Math.PI / 3);
    }
  }
  function sock(color) {
    return function (g, s) {
      var u = s / 10; g.translate(u * .5, u * .3);
      g.fillStyle = color; g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = u * .25;
      g.beginPath();
      g.moveTo(u * 2, u * 2); g.lineTo(u * 6, u * 2); g.lineTo(u * 6, u * 5.6);
      g.quadraticCurveTo(u * 6.2, u * 6.4, u * 7, u * 6.6); g.lineTo(u * 8, u * 7);
      g.quadraticCurveTo(u * 9.4, u * 7.8, u * 8.6, u * 9); g.quadraticCurveTo(u * 8, u * 9.6, u * 6.6, u * 9.3);
      g.lineTo(u * 3.6, u * 8.6); g.quadraticCurveTo(u * 2, u * 8.2, u * 2, u * 6.4); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)'; // ลายจุด
      [[3, 4], [4.8, 3.6], [3.6, 6.4], [5.4, 5.2], [6.8, 8]].forEach(function (p) { g.beginPath(); g.arc(u * p[0], u * p[1], u * .35, 0, 7); g.fill(); });
      g.fillStyle = '#ffffff'; g.beginPath(); // ขอบขาวด้านบน
      if (g.roundRect) g.roundRect(u * 1.5, u * .4, u * 5, u * 2, u * .8); else g.rect(u * 1.5, u * .4, u * 5, u * 2);
      g.fill();
      g.fillStyle = '#e5e7eb'; g.fillRect(u * 1.5, u * 1.9, u * 5, u * .5);
    };
  }
  function coin(g, s) {
    var r = s / 2, grd = g.createRadialGradient(r * .7, r * .6, r * .1, r, r, r);
    grd.addColorStop(0, '#fff6c2'); grd.addColorStop(.45, '#ffd34d'); grd.addColorStop(1, '#c98a00');
    g.fillStyle = grd; g.beginPath(); g.arc(r, r, r * .96, 0, 7); g.fill();
    g.strokeStyle = '#a66f00'; g.lineWidth = s * .06; g.beginPath(); g.arc(r, r, r * .78, 0, 7); g.stroke();
    g.fillStyle = '#9a6400'; g.font = 'bold ' + (s * .55) + 'px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('฿', r, r * 1.04);
  }
  function ghost(g, s) {
    var u = s / 10; g.translate(0, u * .3);
    g.shadowColor = 'rgba(180,140,255,.8)'; g.shadowBlur = u * 1.6;
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.beginPath(); g.moveTo(u * 1.5, u * 9); g.lineTo(u * 1.5, u * 4.5);
    g.bezierCurveTo(u * 1.5, u * .6, u * 8.5, u * .6, u * 8.5, u * 4.5); g.lineTo(u * 8.5, u * 9);
    g.quadraticCurveTo(u * 7.6, u * 8, u * 6.8, u * 9); g.quadraticCurveTo(u * 5.9, u * 8, u * 5, u * 9);
    g.quadraticCurveTo(u * 4.1, u * 8, u * 3.2, u * 9); g.quadraticCurveTo(u * 2.4, u * 8, u * 1.5, u * 9); g.fill();
    g.shadowBlur = 0; g.fillStyle = '#1f1235';
    g.beginPath(); g.ellipse(u * 3.9, u * 4.6, u * .6, u * .85, 0, 0, 7); g.ellipse(u * 6.1, u * 4.6, u * .6, u * .85, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(u * 5, u * 6.3, u * .55, u * .4, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,120,170,.55)';
    g.beginPath(); g.arc(u * 3.1, u * 5.7, u * .45, 0, 7); g.arc(u * 6.9, u * 5.7, u * .45, 0, 7); g.fill();
  }
  function pumpkin(g, s) {
    var u = s / 10;
    g.fillStyle = '#ff8a1f'; g.strokeStyle = '#c75a00'; g.lineWidth = u * .3;
    [[5, 5.8, 2.6], [3.4, 5.9, 2], [6.6, 5.9, 2]].forEach(function (p) { g.beginPath(); g.ellipse(u * p[0], u * p[1], u * p[2], u * 3.2, 0, 0, 7); g.fill(); g.stroke(); });
    g.fillStyle = '#3f6212'; g.fillRect(u * 4.6, u * 1.6, u * .9, u * 1.6);
    g.fillStyle = '#3b1d00';
    g.beginPath(); g.moveTo(u * 3.2, u * 5); g.lineTo(u * 4.2, u * 4.2); g.lineTo(u * 4.4, u * 5.3); g.fill();
    g.beginPath(); g.moveTo(u * 6.8, u * 5); g.lineTo(u * 5.8, u * 4.2); g.lineTo(u * 5.6, u * 5.3); g.fill();
    g.beginPath(); g.moveTo(u * 3, u * 6.6); g.quadraticCurveTo(u * 5, u * 8.6, u * 7, u * 6.6); g.quadraticCurveTo(u * 5, u * 7.4, u * 3, u * 6.6); g.fill();
  }

  var sprites = [];
  var base = 26;
  if (type === 'snow') sprites = [sprite(16, snowflake), sprite(22, crystal)];
  if (type === 'sock') { base = 34; sprites = [sprite(38, sock('#e11d48')), sprite(38, sock('#16a34a')), sprite(38, sock('#dc2626')), sprite(24, snowflake)]; }
  if (type === 'coin') { base = 30; sprites = [sprite(34, coin)]; }
  if (type === 'ghost') { base = 36; sprites = [sprite(42, ghost), sprite(42, ghost), sprite(36, pumpkin)]; }
  if (!sprites.length) return;

  // ---------- อนุภาค ----------
  var P = [];
  function count() {
    var n = Math.round((W * H) / (type === 'snow' ? 14000 : 42000) * (cfg.amount || 1));
    if (reduce) n = Math.round(n / 3);
    return Math.max(6, Math.min(type === 'snow' ? 160 : 45, n));
  }
  function make(initial) {
    var k = Math.floor(Math.random() * sprites.length);
    var scale = type === 'snow' ? (.35 + Math.random() * .8) : (.55 + Math.random() * .6);
    if (type === 'sock' && k === 3) scale = .3 + Math.random() * .5;
    var up = type === 'ghost';
    return {
      k: k, s: scale,
      x: Math.random() * W,
      y: initial ? Math.random() * H : (up ? H + 40 : -40),
      vy: (up ? -1 : 1) * (type === 'snow' ? (.35 + scale * .9) : (.5 + Math.random() * .9)),
      sway: .4 + Math.random() * 1.2, ph: Math.random() * 6.28, sp: .006 + Math.random() * .012,
      rot: Math.random() * 6.28, vr: (Math.random() - .5) * (type === 'coin' ? 0 : .02),
      flip: Math.random() * 6.28, a: type === 'snow' ? (.45 + Math.random() * .5) : (.75 + Math.random() * .25)
    };
  }
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var n = count();
    while (P.length < n) P.push(make(true));
    P.length = n;
  }
  window.addEventListener('resize', resize);
  resize();

  // วนเฟรมได้ทีละลูปเดียวเท่านั้น (เดิมสลับแท็บแล้วกลับมา ลูปซ้อนกันทำให้ particle วิ่งเร็วขึ้นเรื่อยๆ)
  var raf = 0, last = 0;
  function start() { if (raf) return; last = 0; raf = requestAnimationFrame(tick); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  function tick(t) {
    raf = 0;
    var dt = last ? Math.min(3, (t - last) / 16.67) * SPEED : SPEED; last = t;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < P.length; i++) {
      var p = P[i], img = sprites[p.k];
      p.ph += p.sp * dt; p.y += p.vy * dt; p.x += Math.sin(p.ph) * p.sway * .5 * dt; p.rot += p.vr * dt; p.flip += .05 * dt;
      if (p.y > H + 50 || p.y < -60 || p.x < -60 || p.x > W + 60) { P[i] = make(false); continue; }
      var w = img.width / DPR * p.s, h = img.height / DPR * p.s;
      ctx.save(); ctx.globalAlpha = p.a; ctx.translate(p.x, p.y);
      if (type === 'coin') ctx.scale(Math.max(.12, Math.abs(Math.cos(p.flip))), 1);
      else ctx.rotate(type === 'ghost' ? Math.sin(p.ph) * .18 : p.rot);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    raf = requestAnimationFrame(tick);
  }
  start();
})();

// Starfield: 3 parallax layers, twinkle, mouse + scroll parallax, shooting stars
(() => {
  const c = document.getElementById('stars'), x = c.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, dpr, layers = [], shooters = [];
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const LAYERS = [
    { n: 140, r: [.3, .9],  a: [.2, .55], par: 8,  scroll: .04, drift: .01, color: '#d4d4d8' },
    { n: 70,  r: [.7, 1.4], a: [.35, .8], par: 18, scroll: .09, drift: .02, color: '#ffffff' },
    { n: 9,   r: [2.2, 4],  a: [.25, .6], par: 40, scroll: .18, drift: .04, color: '#71717a', soft: true }
  ];
  const size = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const k = Math.min(1, w * h / 900000 + .35);
    layers = LAYERS.map(L => ({ ...L, stars: Array.from({ length: Math.round(L.n * k) }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: rnd(...L.r), a: rnd(...L.a),
      ph: Math.random() * 6.28, sp: rnd(.4, 1.6), tw: Math.random() < .6
    })) }));
  };
  const spawnShooter = () => {
    const dir = Math.random() < .5 ? 1 : -1;
    shooters.push({ x: rnd(0, w), y: rnd(0, h * .5), vx: dir * rnd(7, 11), vy: rnd(2.5, 4.5), life: 1 });
  };
  addEventListener('pointermove', e => { mouse.tx = e.clientX / w - .5; mouse.ty = e.clientY / h - .5; }, { passive: true });
  addEventListener('resize', size);
  let last = 0, nextShot = 3000;
  const draw = t => {
    const dt = Math.min(50, t - last) || 16; last = t;
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
    x.clearRect(0, 0, w, h);
    const sy = scrollY, span = h + 12;
    for (const L of layers) {
      for (const s of L.stars) {
        if (!reduce) { s.y -= L.drift * dt * .06; if (s.y < -6) s.y += span; }
        const px = s.x - mouse.x * L.par;
        const py = (((s.y - sy * L.scroll) % span) + span) % span - 6 - mouse.y * L.par;
        let a = s.a;
        if (s.tw && !reduce) a *= .6 + .4 * Math.sin(t / 1000 * s.sp + s.ph);
        x.globalAlpha = a;
        if (L.soft) {
          const g = x.createRadialGradient(px, py, 0, px, py, s.r * 2.4);
          g.addColorStop(0, L.color); g.addColorStop(1, 'rgba(113,113,122,0)');
          x.fillStyle = g; x.beginPath(); x.arc(px, py, s.r * 2.4, 0, 6.283); x.fill();
        } else { x.fillStyle = L.color; x.beginPath(); x.arc(px, py, s.r, 0, 6.283); x.fill(); }
      }
    }
    if (!reduce) {
      nextShot -= dt;
      if (nextShot < 0 && shooters.length < 2) { spawnShooter(); nextShot = rnd(4000, 9000); }
      for (const m of shooters) {
        m.x += m.vx; m.y += m.vy; m.life -= .018;
        const g = x.createLinearGradient(m.x, m.y, m.x - m.vx * 9, m.y - m.vy * 9);
        g.addColorStop(0, 'rgba(151,237,255,' + Math.max(0, m.life) + ')'); g.addColorStop(1, 'rgba(151,237,255,0)');
        x.globalAlpha = 1; x.strokeStyle = g; x.lineWidth = 1.5; x.beginPath();
        x.moveTo(m.x, m.y); x.lineTo(m.x - m.vx * 9, m.y - m.vy * 9); x.stroke();
      }
      shooters = shooters.filter(m => m.life > 0);
      requestAnimationFrame(draw);
    }
  };
  size();
  if (reduce) draw(0); else requestAnimationFrame(draw);
})();

// Card deck: hover tilt + click to shuffle
(() => {
  const fan = document.getElementById('fan'); if (!fan) return;
  const cards = [...fan.querySelectorAll('.card')];
  let order = cards.slice(), busy = false;
  const apply = () => order.forEach((el, i) => {
    el.style.setProperty('--i', i); el.style.zIndex = 10 - i;
    el.classList.toggle('front', i === 0); el.classList.toggle('dashed', i === cards.length - 1);
  });
  apply();
  const shuffle = () => {
    if (busy) return; busy = true;
    const front = order[0];
    front.classList.add('flying');
    setTimeout(() => {
      order = [...order.slice(1), front];
      front.classList.remove('flying'); front.classList.add('landing');
      apply();
      setTimeout(() => { front.classList.remove('landing'); busy = false; }, 450);
    }, 320);
  };
  fan.addEventListener('click', shuffle);
  fan.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shuffle(); } });
  fan.addEventListener('pointermove', e => {
    const r = fan.getBoundingClientRect(), n = order[0].querySelector('.card-in');
    n.style.setProperty('--tx', (((e.clientX - r.left) / r.width - .5) * 14).toFixed(1) + 'deg');
    n.style.setProperty('--ty', ((-((e.clientY - r.top) / r.height - .5)) * 14).toFixed(1) + 'deg');
  });
  fan.addEventListener('pointerleave', () => cards.forEach(c => {
    const n = c.querySelector('.card-in'); n.style.setProperty('--tx', '0deg'); n.style.setProperty('--ty', '0deg');
  }));
})();

// Scroll reveal
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
}), { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Active nav pill
const links = [...document.querySelectorAll('.pill a')];
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });

// Scroll-driven scenes
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const clamp = v => Math.min(1, Math.max(0, v));
  const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };
  const ht = document.getElementById('heroTrack'), fan = ht.querySelector('.fan'), copy = ht.querySelector('.grid > div');
  const wt = document.getElementById('workTrack'), rail = document.getElementById('rail');
  let ticking = false;
  const update = () => {
    ticking = false;
    const p = prog(ht);
    fan.style.setProperty('--p', p.toFixed(4));
    copy.style.transform = `translateY(${-p * 80}px)`;
    copy.style.opacity = 1 - clamp(p * 1.8);
    const q = prog(wt), max = rail.scrollWidth - innerWidth;
    rail.style.transform = `translateX(${-q * Math.max(0, max)}px)`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

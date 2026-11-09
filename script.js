// Starfield
(() => {
  const c = document.getElementById('stars'), x = c.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, stars = [];
  const size = () => {
    w = c.width = innerWidth; h = c.height = innerHeight;
    stars = Array.from({ length: Math.min(220, Math.floor(w * h / 8000)) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() < .06 ? 3 : Math.random() * 1.2 + .3,
      v: Math.random() * .12 + .02, a: Math.random() * .5 + .25
    }));
  };
  const draw = () => {
    x.clearRect(0, 0, w, h);
    for (const s of stars) {
      x.globalAlpha = s.a; x.fillStyle = s.r > 2 ? '#71717a' : '#d4d4d8';
      x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.283); x.fill();
      if (!reduce) { s.y -= s.v; if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; } }
    }
    if (!reduce) requestAnimationFrame(draw);
  };
  addEventListener('resize', () => { size(); if (reduce) draw(); });
  size(); draw();
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

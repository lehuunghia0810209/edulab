import { getMotionState } from './motion-controller.js';

// Interactive particle field behind the hero copy: a sparse constellation that drifts,
// eases away from the pointer and bursts on a click on empty sky. One 2D canvas, one rAF
// loop that only runs while the hero is visible, the tab is shown and motion is allowed.
const REPEL_RADIUS = 130;
const LINK_DISTANCE = 120;

export function initHeroParticles() {
  const hero = document.querySelector('.planet-hero');
  if (!hero || typeof HTMLCanvasElement === 'undefined') return () => {};
  // Phones and touch screens have no hover for the field to answer, and measured with 4x CPU
  // throttling the canvas start-up alone cost ~340ms of long tasks, so they keep the plain
  // hero (video planets, starfield, all controls) and skip the field.
  if (window.innerWidth < 768 || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  // Creating a 2D context has a one-time start-up cost, so the whole field is built only
  // after the page has loaded and gone idle; it never competes with the hero entrance.
  let dispose = () => {};
  let idle = 0;
  const build = () => { dispose = setupParticles(hero); };
  const whenIdle = () => { idle = 'requestIdleCallback' in window ? requestIdleCallback(build, { timeout: 1500 }) : setTimeout(build, 300); };
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
  return () => {
    window.removeEventListener('load', whenIdle);
    if ('cancelIdleCallback' in window) cancelIdleCallback(idle); else clearTimeout(idle);
    dispose();
  };
}

function setupParticles(hero) {
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-particles';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  hero.querySelector('.planet-shade')?.after(canvas);

  const events = new AbortController();
  const pointer = { x: -9999, y: -9999, active: false };
  let particles = [];
  let width = 0;
  let height = 0;
  let ratio = 1;
  let frame = 0;
  let visible = true;
  let compact = false;
  let tick = 0;

  function seed() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    compact = width < 768;
    ratio = Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    // Density follows the area, capped so a 4K screen does not pay for thousands of links.
    const count = Math.round(Math.min(compact ? 38 : 96, (width * height) / (compact ? 9000 : 13000)));
    particles = Array.from({ length: count }, (_, index) => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return { x, y, homeX: x, homeY: y, vx: 0, vy: 0, size: index % 7 === 0 ? 1.7 : 1, phase: Math.random() * Math.PI * 2, life: Infinity };
    });
    draw(0);
  }

  function step(time) {
    const t = time / 1000;
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      if (p.life !== Infinity) {
        p.life -= 1;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        continue;
      }
      // Slow orbital drift around the home point plus a spring back after any push.
      const targetX = p.homeX + Math.cos(t * 0.21 + p.phase) * 14;
      const targetY = p.homeY + Math.sin(t * 0.17 + p.phase) * 10;
      p.vx += (targetX - p.x) * 0.006;
      p.vy += (targetY - p.y) * 0.006;
      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < REPEL_RADIUS && distance > 0.1) {
          const force = (1 - distance / REPEL_RADIUS) * 0.9;
          p.vx += (dx / distance) * force;
          p.vy += (dy / distance) * force;
        }
      }
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  // Draw calls dominate the cost on software-rasterised canvases (many phones), so
  // segments and dots are bucketed by opacity and each bucket is one path, one stroke/fill.
  const LINK_ALPHA = [0.05, 0.1, 0.15, 0.22, 0.32, 0.42];
  const DOT_ALPHA = [0.3, 0.55, 0.8];
  const linkBuckets = LINK_ALPHA.map(() => []);
  const dotBuckets = { small: DOT_ALPHA.map(() => []), large: DOT_ALPHA.map(() => []) };

  function draw(time) {
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const t = time / 1000;
    linkBuckets.forEach(bucket => { bucket.length = 0; });
    for (const group of Object.values(dotBuckets)) group.forEach(bucket => { bucket.length = 0; });
    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];
      if (a.life !== Infinity) continue;
      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        if (b.life !== Infinity) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (Math.abs(dx) > LINK_DISTANCE || Math.abs(dy) > LINK_DISTANCE) continue;
        const distance = Math.hypot(dx, dy);
        if (distance > LINK_DISTANCE) continue;
        const nearPointer = pointer.active && Math.hypot((a.x + b.x) / 2 - pointer.x, (a.y + b.y) / 2 - pointer.y) < REPEL_RADIUS * 1.4;
        // Closer pairs land in brighter buckets; pairs near the pointer use the top three.
        const level = Math.min(2, Math.floor((1 - distance / LINK_DISTANCE) * 3)) + (nearPointer ? 3 : 0);
        linkBuckets[level].push(a.x, a.y, b.x, b.y);
      }
    }
    context.lineWidth = 0.6;
    linkBuckets.forEach((bucket, level) => {
      if (!bucket.length) return;
      context.strokeStyle = `rgba(121, 220, 232, ${LINK_ALPHA[level]})`;
      context.beginPath();
      for (let k = 0; k < bucket.length; k += 4) {
        context.moveTo(bucket[k], bucket[k + 1]);
        context.lineTo(bucket[k + 2], bucket[k + 3]);
      }
      context.stroke();
    });
    for (const p of particles) {
      const twinkle = p.life === Infinity ? 0.55 + Math.sin(t * 1.3 + p.phase) * 0.3 : Math.min(1, p.life / 40);
      const level = Math.min(2, Math.max(0, Math.round((twinkle - 0.3) / 0.25)));
      dotBuckets[p.size > 1 ? 'large' : 'small'][level].push(p);
    }
    for (const [kind, group] of Object.entries(dotBuckets)) {
      group.forEach((bucket, level) => {
        if (!bucket.length) return;
        context.fillStyle = kind === 'large' ? `rgba(160, 234, 242, ${DOT_ALPHA[level]})` : `rgba(255, 255, 255, ${DOT_ALPHA[level] * 0.8})`;
        context.beginPath();
        for (const p of bucket) {
          context.moveTo(p.x + p.size, p.y);
          context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        context.fill();
      });
    }
    if (pointer.active && !compact) {
      // A faint orbit ring marks the pointer's field of influence.
      context.strokeStyle = 'rgba(121, 220, 232, 0.16)';
      context.beginPath();
      context.arc(pointer.x, pointer.y, REPEL_RADIUS * 0.55, 0, Math.PI * 2);
      context.stroke();
    }
  }

  // Phones and touch screens have no hover to react to, so the field stays a still
  // constellation there and the loop only runs while a tap burst is in flight.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const isStill = () => compact || !finePointer.matches;

  function loop(time) {
    frame = requestAnimationFrame(loop);
    if (isStill()) {
      if ((tick = (tick + 1) % 2) !== 0) return;
      if (!particles.some(p => p.life !== Infinity)) {
        cancelAnimationFrame(frame);
        frame = 0;
        draw(time);
        return;
      }
    }
    step(time);
    draw(time);
  }

  function start() {
    if (!frame) frame = requestAnimationFrame(loop);
  }

  function sync() {
    const run = visible && !document.hidden && getMotionState().canAnimate;
    canvas.classList.toggle('is-running', run);
    if (run) start();
    if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function burst(x, y) {
    const pieces = compact ? 10 : 18;
    for (let i = 0; i < pieces; i += 1) {
      const angle = (i / pieces) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 2.2 + Math.random() * 2.6;
      particles.push({ x, y, homeX: x, homeY: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 1.3, phase: 0, life: 46 });
    }
  }

  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }, { passive: true, signal: events.signal });
  hero.addEventListener('pointerleave', () => { pointer.active = false; }, { signal: events.signal });
  hero.addEventListener('pointerdown', event => {
    if (!canvas.classList.contains('is-running') || event.button !== 0 || event.target.closest('a, button')) return;
    const rect = hero.getBoundingClientRect();
    burst(event.clientX - rect.left, event.clientY - rect.top);
    start();
  }, { passive: true, signal: events.signal });
  document.addEventListener('visibilitychange', sync, { signal: events.signal });
  document.addEventListener('edulab:motion-change', sync, { signal: events.signal });

  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }, { threshold: 0 });
  observer.observe(hero);
  let resizeFrame = 0;
  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(seed);
  });
  resizeObserver.observe(hero);
  seed();
  sync();

  return () => {
    events.abort();
    observer.disconnect();
    resizeObserver.disconnect();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(resizeFrame);
    canvas.remove();
  };
}

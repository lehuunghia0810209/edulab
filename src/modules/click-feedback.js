import { getMotionState } from './motion-controller.js';

// Contextual press feedback through one delegated listener. Effects are fire-and-forget
// Web Animations: nothing waits for them, nothing calls preventDefault, so links and
// buttons act at once. Disabled whenever motion is not allowed.
const EASE = 'cubic-bezier(.16,1,.3,1)';

function spawn(host, className, x, y) {
  const fx = document.createElement('span');
  fx.className = className;
  fx.setAttribute('aria-hidden', 'true');
  fx.style.left = x + 'px';
  fx.style.top = y + 'px';
  host.append(fx);
  return fx;
}

function ripple(host, event) {
  const rect = host.getBoundingClientRect();
  const size = Math.hypot(rect.width, rect.height) * 2;
  const fx = spawn(host, 'fx-ripple', event.clientX - rect.left, event.clientY - rect.top);
  fx.animate(
    [{ width: '0px', height: '0px', opacity: 0.55 }, { width: size + 'px', height: size + 'px', opacity: 0 }],
    { duration: 620, easing: EASE },
  ).onfinish = () => fx.remove();
}

function orbit(host) {
  const rect = host.getBoundingClientRect();
  const fx = spawn(host, 'fx-orbit', rect.width / 2, rect.height / 2);
  fx.animate(
    [{ transform: 'translate(-50%, -50%) scale(.7)', opacity: 0.9 }, { transform: 'translate(-50%, -50%) scale(1.45)', opacity: 0 }],
    { duration: 700, easing: EASE },
  ).onfinish = () => fx.remove();
}

const EFFECTS = [
  ['.planet-side', orbit],
  ['.btn-primary, .planet-primary-cta, .header-cta', ripple],
  ['.lab-card', host => host.animate(
    [{ boxShadow: '0 0 0 0 color-mix(in srgb, var(--lab-accent) 55%, transparent)' }, { boxShadow: '0 0 0 14px color-mix(in srgb, var(--lab-accent) 0%, transparent)' }],
    { duration: 560, easing: EASE },
  )],
  ['.theme-toggle', host => host.querySelectorAll('svg').forEach(svg => svg.animate(
    [{ rotate: '0deg' }, { rotate: '180deg' }], { duration: 520, easing: EASE },
  ))],
  ['.faq-trigger', host => host.querySelector('.faq-icon-box')?.animate(
    [{ scale: 1 }, { scale: 0.82 }, { scale: 1.08 }, { scale: 1 }], { duration: 420, easing: 'ease-out' },
  )],
  ['.nav-link, .footer-links a, .footer-links button, .faq-contact-link, .nexus-node, .back-to-top', host => host.animate(
    [{ scale: 1 }, { scale: 0.95 }, { scale: 1 }], { duration: 260, easing: 'ease-out' },
  )],
];

export function initClickFeedback() {
  const events = new AbortController();
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !getMotionState().canAnimate || !(event.target instanceof Element)) return;
    for (const [selector, effect] of EFFECTS) {
      const host = event.target.closest(selector);
      if (host) return effect(host, event);
    }
  }, { passive: true, signal: events.signal });
  return () => events.abort();
}

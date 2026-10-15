import { getMotionState } from './motion-controller.js';

export function initEntranceAnimation() {
  const root = document.documentElement;
  document.body.classList.add('js-ready');

  if (!root.classList.contains('anim')) return;

  let started = false;
  function startSequence() {
    if (started) return;
    started = true;
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        root.classList.add('play');
        setTimeout(function() {
          root.classList.remove('anim', 'play');
        }, 2150);
      });
    });
  }

  if (document.fonts && document.fonts.ready) {
    const guard = setTimeout(startSequence, 500);
    document.fonts.ready.then(function() {
      clearTimeout(guard);
      startSequence();
    }).catch(startSequence);
  } else {
    startSequence();
  }
}

export function initScrollReveals() {
  const revealEls = [...document.querySelectorAll('.reveal-section')];
  const motionGroups = {
    'kham-pha-lab': '.section-header-row, .lab-card',
    nexus: '.nexus-section-copy > *, .nexus-stage',
    'bo-kham-pha': '.section-header-row, .explorer-controls, .explorer-workspace',
    've-edulab': '.eyebrow, .section-title, .section-desc, .philosophy-row',
    'cach-hoat-dong': '.section-header-row, .step-node',
    'he-sinh-thai': '.section-header-row, .eco-detail-bar',
    faq: '.faq-layout > *, .faq-item',
  };
  revealEls.forEach(function(section) {
    const selector = motionGroups[section.id] || '.final-cta-box > *';
    section.querySelectorAll(selector).forEach(function(item, index) {
      item.classList.add('motion-item');
      item.style.setProperty('--motion-order', index);
    });
  });
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function(el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function(el) { el.classList.add('is-visible'); });
  }

  const timeline = document.querySelector('.steps-timeline');
  if (!timeline) return;
  let ticking = false;
  function updateTimeline() {
    ticking = false;
    const rect = timeline.getBoundingClientRect();
    const progress = getMotionState().canAnimate ? Math.max(0, Math.min(1, (window.innerHeight * 0.82 - rect.top) / (rect.height + window.innerHeight * 0.35))) : 1;
    timeline.style.setProperty('--timeline-progress', progress.toFixed(3));
  }
  function queueTimelineUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateTimeline);
  }
  window.addEventListener('scroll', queueTimelineUpdate, { passive: true });
  window.addEventListener('resize', queueTimelineUpdate);
  document.addEventListener('edulab:motion-change', queueTimelineUpdate);
  updateTimeline();
}

export function initFooterYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}


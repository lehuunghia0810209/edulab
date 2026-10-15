import { getMotionState } from './motion-controller.js';

export function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(function(item) {
    const trigger = item.querySelector('.faq-trigger');
    const panel = item.querySelector('.faq-panel');
    if (!trigger || !panel) return;
    trigger.addEventListener('click', function() {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      item.classList.toggle('is-open', !isOpen);
      panel.getAnimations().forEach(animation => animation.cancel());
      if (!getMotionState().canAnimate) {
        panel.hidden = isOpen;
        return;
      }
      if (!isOpen) panel.hidden = false;
      const animation = panel.animate(
        isOpen
          ? [{ opacity: 1, height: panel.scrollHeight + 'px' }, { opacity: 0, height: '0px' }]
          : [{ opacity: 0, height: '0px' }, { opacity: 1, height: panel.scrollHeight + 'px' }],
        { duration: 300, easing: 'cubic-bezier(.4,0,.2,1)' },
      );
      animation.onfinish = () => { panel.hidden = isOpen; };
    });
  });
}

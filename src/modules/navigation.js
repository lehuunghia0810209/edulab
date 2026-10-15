import { getMotionState } from './motion-controller.js';

export function initNavigation() {
  const header = document.getElementById('site-header');
  const burger = document.getElementById('burger-btn');
  const navMenu = document.getElementById('primary-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const progress = document.getElementById('scroll-progress');
  const backToTop = document.getElementById('back-to-top');
  const mobile = window.matchMedia('(max-width: 1030px)');
  const background = document.querySelectorAll('main, footer, #back-to-top');

  function setMenuOpen(open, restoreFocus = false) {
    if (!header || !burger) return;
    header.setAttribute('data-menu-open', open ? 'true' : 'false');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng');
    document.body.style.overflow = open && mobile.matches ? 'hidden' : '';
    background.forEach(function(element) { element.toggleAttribute('inert', open && mobile.matches); });
    if (navMenu) {
      navMenu.toggleAttribute('inert', mobile.matches && !open);
      navMenu.setAttribute('aria-hidden', mobile.matches && !open ? 'true' : 'false');
    }
    if (restoreFocus) burger.focus();
  }

  setMenuOpen(false);
  mobile.addEventListener('change', function() { setMenuOpen(false); });

  if (burger) {
    burger.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!header || !mobile.matches) return;
      const isOpen = header.getAttribute('data-menu-open') === 'true';
      setMenuOpen(!isOpen);
      if (!isOpen && navLinks[0]) navLinks[0].focus();
    });
  }

  navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      if (header && header.getAttribute('data-menu-open') === 'true') {
        setMenuOpen(false);
      }
    });
  });

  document.addEventListener('keydown', function(e) {
    if (!mobile.matches || !header || header.getAttribute('data-menu-open') !== 'true') return;

    if (e.key === 'Escape') {
      setMenuOpen(false, true);
      return;
    }

    if (e.key === 'Tab') {
      const focusable = Array.from(header.querySelectorAll('a[href], button:not([disabled])'))
        .filter(function(el) {
          return !el.closest('[inert]') &&
            el.getClientRects().length > 0 &&
            getComputedStyle(el).visibility !== 'hidden';
        });
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || !header.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !header.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener('scroll', function() {
    const scrollY = window.scrollY || window.pageYOffset;
    if (header) {
      header.classList.toggle('is-scrolled', scrollY > 24);
    }
    if (backToTop) {
      backToTop.classList.toggle('is-shown', scrollY > 520);
    }
    if (progress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;
      progress.style.transform = 'scaleX(' + ratio + ')';
    }
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: getMotionState().canAnimate ? 'smooth' : 'auto' });
    });
  }

  /* Active Section Indicator via IntersectionObserver */
  if ('IntersectionObserver' in window) {
    const sections = ['top', 'kham-pha-lab', 've-edulab', 'he-sinh-thai', 'faq']
      .map(function(id) { return document.getElementById(id); })
      .filter(Boolean);

    const navObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const activeId = entry.target.id;
          navLinks.forEach(function(link) {
            link.classList.toggle('is-active', link.getAttribute('data-nav-section') === activeId);
          });
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });

    sections.forEach(function(sec) { navObserver.observe(sec); });
  }
}

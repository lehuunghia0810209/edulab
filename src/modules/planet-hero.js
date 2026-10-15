import { getMotionState } from './motion-controller.js';

const ORDER = ['earth', 'venus', 'mars'];
const PLANETS = {
  earth: {
    title: 'EARTH',
    name: 'Trái Đất',
    lede: 'Từ hành tinh xanh của chúng ta, bắt đầu hành trình khám phá khoa học qua năm không gian học tập tương tác của EduLab.',
  },
  venus: {
    title: 'VENUS',
    name: 'Sao Kim',
    lede: 'Một thế giới nóng rực sau lớp mây dày. Khơi gợi câu hỏi, quan sát hiện tượng và khám phá khoa học cùng EduLab.',
  },
  mars: {
    title: 'MARS',
    name: 'Sao Hỏa',
    lede: 'Hành tinh đỏ với những sa mạc và núi lửa khổng lồ. Tiếp tục hành trình tìm hiểu vũ trụ qua các phòng Lab của EduLab.',
  },
};

export function initPlanetHero() {
  const hero = document.querySelector('.planet-hero');
  if (!hero) return;

  const title = document.getElementById('planet-title-text');
  const lede = document.getElementById('planet-lede');
  const buttons = [...hero.querySelectorAll('.planet-side')];
  const videos = [...hero.querySelectorAll('.planet-sky video')];
  const posters = [...hero.querySelectorAll('.planet-poster')];
  const labels = {
    left: document.getElementById('planet-left-label'),
    right: document.getElementById('planet-right-label'),
  };
  let featured = null;
  let visible = true;

  function warm(planet) {
    const video = videos.find(item => item.dataset.planet === planet);
    if (!video || video.getAttribute('src')) return;
    video.preload = 'auto';
    video.src = video.dataset.src;
    video.load();
  }

  function syncVideo() {
    videos.forEach(video => {
      const shouldPlay = video.dataset.planet === featured && visible && !document.hidden && getMotionState().canAnimate;
      if (!shouldPlay) {
        video.pause();
        video.classList.remove('is-playing');
      } else {
        video.play().catch(() => video.classList.remove('is-playing'));
      }
    });
  }

  function revealText() {
    if (!getMotionState().canAnimate) return;
    for (const element of [title, lede]) {
      element.getAnimations().forEach(animation => animation.cancel());
      element.animate(
        [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: element === title ? 620 : 480, easing: 'cubic-bezier(.16,1,.3,1)' },
      );
    }
  }

  function show(planet) {
    if (!PLANETS[planet] || featured === planet) return;
    const switching = featured !== null;
    featured = planet;
    hero.dataset.featured = planet;
    title.textContent = PLANETS[planet].title;
    lede.textContent = PLANETS[planet].lede;

    const remaining = ORDER.filter(item => item !== planet);
    buttons.forEach((button, index) => {
      const sidePlanet = remaining[index];
      button.dataset.planet = sidePlanet;
      button.setAttribute('aria-label', `Khám phá ${PLANETS[sidePlanet].name}`);
      labels[button.dataset.slot].textContent = PLANETS[sidePlanet].title;
      button.querySelectorAll('img').forEach(image => {
        image.classList.toggle('is-shown', image.dataset.planet === sidePlanet);
      });
      const shownImage = button.querySelector(`img[data-planet="${sidePlanet}"]`);
      button.classList.toggle('has-fallback', shownImage?.classList.contains('is-broken'));
    });
    posters.forEach(poster => poster.classList.toggle('is-active', poster.dataset.planet === planet));
    hero.classList.toggle('has-poster-fallback', posters.some(poster => poster.dataset.planet === planet && poster.classList.contains('is-broken')));
    videos.forEach(video => video.classList.remove('is-playing'));
    if (getMotionState().canAnimate) warm(planet);
    syncVideo();
    if (switching) revealText();
  }

  videos.forEach(video => {
    video.addEventListener('playing', () => {
      if (video.dataset.planet === featured && visible && !document.hidden && getMotionState().canAnimate) {
        video.classList.add('is-playing');
      } else {
        video.pause();
      }
    });
    video.addEventListener('error', () => {
      video.classList.remove('is-playing');
      video.classList.add('is-broken');
    });
  });
  posters.forEach(poster => {
    const match = poster.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    if (!match) return;
    const probe = new Image();
    probe.onerror = () => {
      poster.classList.add('is-broken');
      if (poster.dataset.planet === featured) hero.classList.add('has-poster-fallback');
    };
    probe.src = match[1];
  });
  hero.querySelectorAll('.planet-side img').forEach(image => {
    const markBroken = () => {
      image.classList.add('is-broken');
      if (image.classList.contains('is-shown')) image.closest('.planet-side')?.classList.add('has-fallback');
    };
    image.addEventListener('error', markBroken);
    if (image.complete && image.naturalWidth === 0) markBroken();
  });
  buttons.forEach(button => {
    button.addEventListener('click', () => show(button.dataset.planet));
    button.addEventListener('pointerenter', () => { if (getMotionState().canAnimate) warm(button.dataset.planet); });
    button.addEventListener('focus', () => { if (getMotionState().canAnimate) warm(button.dataset.planet); });
  });
  document.addEventListener('visibilitychange', syncVideo);
  document.addEventListener('edulab:motion-change', syncVideo);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncVideo();
    }, { threshold: 0.05 });
    observer.observe(hero);
  }
  show('earth');
}

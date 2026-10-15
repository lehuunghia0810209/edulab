const STORAGE_KEY = 'edulab-motion';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let preference = readPreference();

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'running' || saved === 'paused' ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, preference); } catch {}
}

export function getMotionState() {
  const userPaused = preference === 'paused';
  const systemPaused = preference === 'auto' && reducedMotion.matches;
  return {
    preference,
    userPaused,
    systemPaused,
    temporarilyPaused: document.hidden,
    canAnimate: !userPaused && !systemPaused,
  };
}

function publish(source) {
  const state = getMotionState();
  document.documentElement.dataset.motion = state.canAnimate ? 'on' : 'off';
  document.documentElement.dataset.motionPreference = state.preference;
  document.dispatchEvent(new CustomEvent('edulab:motion-change', { detail: { ...state, source } }));
  return state;
}

export function pauseMotion() {
  preference = 'paused';
  persist();
  return publish('user');
}

export function resumeMotion() {
  preference = 'running';
  persist();
  return publish('user');
}

export function toggleMotion() {
  return getMotionState().canAnimate ? pauseMotion() : resumeMotion();
}

export function bindMotionToggle(button) {
  const events = new AbortController();
  function render() {
    const running = getMotionState().canAnimate;
    button.disabled = false;
    button.innerHTML = `<span aria-hidden="true">${running ? 'Ⅱ' : '▶'}</span><span>${running ? 'Tạm dừng chuyển động' : 'Tiếp tục chuyển động'}</span>`;
    button.setAttribute('aria-label', running ? 'Tạm dừng chuyển động' : 'Tiếp tục chuyển động');
    button.setAttribute('aria-pressed', String(!running));
    button.title = running ? 'Tạm dừng chuyển động trang trí' : 'Tiếp tục chuyển động trang trí';
    button.dataset.state = running ? 'running' : 'paused';
  }
  button.addEventListener('click', toggleMotion, { signal: events.signal });
  document.addEventListener('edulab:motion-change', render, { signal: events.signal });
  render();
  return () => events.abort();
}

reducedMotion.addEventListener('change', () => {
  if (preference === 'auto') publish('system');
});
publish('init');

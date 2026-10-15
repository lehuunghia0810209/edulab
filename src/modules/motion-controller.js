const STORAGE_KEY = 'edulab-reduce-motion';
const LEGACY_KEY = 'edulab-motion';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let preference = readPreference();
let initialized = false;

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') return 'reduce';
    if (saved === 'false') return 'allow';
    return saved === null && localStorage.getItem(LEGACY_KEY) === 'running' ? 'allow' : 'auto';
  } catch {
    return 'auto';
  }
}

function persist() {
  try {
    if (preference === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference === 'reduce' ? 'true' : 'false');
  } catch {}
}

export function getMotionState() {
  const userPaused = preference === 'reduce';
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
  document.dispatchEvent(new CustomEvent('edulab:motion-change', { detail: { ...state, source } }));
  return state;
}

export function pauseMotion() {
  preference = 'reduce';
  persist();
  return publish('user');
}

export function resumeMotion() {
  preference = 'allow';
  persist();
  return publish('user');
}

export function toggleMotion() {
  return getMotionState().canAnimate ? pauseMotion() : resumeMotion();
}

export function initializeMotionSystem() {
  if (initialized) return getMotionState();
  initialized = true;
  persist();
  reducedMotion.addEventListener('change', onSystemPreferenceChange);
  return publish('init');
}

export function bindReducedMotionPreference(input) {
  if (!input) return () => {};
  const events = new AbortController();
  function render() {
    input.checked = !getMotionState().canAnimate;
    input.title = reducedMotion.matches ? 'Thiết bị đang yêu cầu giảm chuyển động' : 'Giảm chuyển động trang trí';
  }
  input.addEventListener('change', () => input.checked ? pauseMotion() : resumeMotion(), { signal: events.signal });
  document.addEventListener('edulab:motion-change', render, { signal: events.signal });
  render();
  return () => events.abort();
}

function onSystemPreferenceChange() {
  if (preference === 'auto') publish('system');
}

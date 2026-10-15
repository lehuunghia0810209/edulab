export function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  function syncLabel() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#07161D' : '#F5F7F3');
  }
  syncLabel();

  toggleBtn.addEventListener('click', function() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    syncLabel();
    try {
      localStorage.setItem('edulab-theme', next);
    } catch (e) {}
  });
}

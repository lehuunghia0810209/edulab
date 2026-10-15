let toastTimer = null;

export function normalizeVN(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function showStatusToast(message) {
  const toast = document.getElementById('status-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-active');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toast.classList.remove('is-active');
  }, 3200);
}

export function createLabActionElement(lab, compact) {
  const hasUrl = Boolean(lab.url && lab.url.trim().length > 0);
  if (hasUrl) {
    const link = document.createElement('a');
    link.href = lab.url.trim();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'btn btn-primary';
    if (compact) link.style.padding = '10px 18px';
    const span = document.createElement('span');
    span.textContent = compact ? 'Xem Lab' : 'Khám phá Lab';
    link.appendChild(span);
    return link;
  } else {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-disabled-state';
    if (compact) btn.style.padding = '10px 18px';
    btn.setAttribute('aria-label', lab.name + ' (' + lab.subject + '): Chưa cập nhật liên kết');
    btn.textContent = 'Chưa cập nhật liên kết';
    btn.addEventListener('click', function() {
      showStatusToast(lab.name + ' (' + lab.subject + '): Chưa cập nhật liên kết ngoài trong cấu hình.');
    });
    return btn;
  }
}

import { CATEGORY_LABELS, LABS, LAB_ILLUSTRATIONS } from '../data/labs.js';
import { createLabActionElement, normalizeVN } from '../utils/helpers.js';
import { getMotionState } from './motion-controller.js';

export function initLabExplorer() {
  const searchInput = document.getElementById('lab-search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  const resetBtn = document.getElementById('reset-search-btn');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const tabList = document.getElementById('explorer-tab-list');
  const emptyState = document.getElementById('explorer-empty');
  const previewPanel = document.getElementById('explorer-preview-panel');

  const previewNumber = document.getElementById('preview-number');
  const previewTitle = document.getElementById('preview-title');
  const previewCategory = document.getElementById('preview-category');
  const previewVisual = document.getElementById('preview-visual-stage');
  const previewDesc = document.getElementById('preview-description');
  const previewSubjectName = document.getElementById('preview-subject-name');
  const previewStatusPill = document.getElementById('preview-status-pill');
  const previewActionSlot = document.getElementById('preview-action-slot');

  let activeFilter = 'all';
  let searchQuery = '';
  let currentLabId = LABS[0].id;
  let renderedLabId = null;

  function renderPreviewPanel(labId) {
    if (renderedLabId === labId) return;
    renderedLabId = labId;
    const idx = LABS.findIndex(function(l) { return l.id === labId; });
    const lab = idx !== -1 ? LABS[idx] : LABS[0];
    const num = String((idx !== -1 ? idx : 0) + 1).padStart(2, '0');
    const hasUrl = Boolean(lab.url && lab.url.trim().length > 0);
    previewPanel.dataset.lab = lab.id;

    previewNumber.textContent = 'LAB ' + num + ' — ' + lab.subject.toUpperCase();
    previewTitle.textContent = lab.name;
    previewCategory.textContent = CATEGORY_LABELS[lab.category] || lab.category;
    previewVisual.innerHTML = LAB_ILLUSTRATIONS[lab.id] || '';
    previewDesc.textContent = lab.description;
    previewSubjectName.textContent = lab.subject;

    previewStatusPill.innerHTML = '';
    const dot = document.createElement('span');
    dot.className = 'status-dot' + (hasUrl ? ' is-ready' : '');
    const txt = document.createElement('span');
    txt.textContent = hasUrl ? 'Trạng thái: Đã cấu hình liên kết ngoài' : 'Trạng thái: Chưa cập nhật liên kết';
    previewStatusPill.appendChild(dot);
    previewStatusPill.appendChild(txt);

    previewActionSlot.innerHTML = '';
    previewActionSlot.appendChild(createLabActionElement(lab, false));
    if (getMotionState().canAnimate) {
      previewPanel.getAnimations().forEach(animation => animation.cancel());
      previewPanel.animate(
        [{ opacity: 0.45, transform: 'translateX(18px)' }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' },
      );
    }
  }

  function renderExplorerList() {
    const qNorm = normalizeVN(searchQuery);
    const filtered = LABS.filter(function(lab) {
      const matchCat = activeFilter === 'all' || lab.category === activeFilter;
      if (!matchCat) return false;
      if (!qNorm) return true;
      const hay = normalizeVN(lab.name + ' ' + lab.subject + ' ' + lab.description);
      return hay.indexOf(qNorm) !== -1;
    });

    const existing = new Map([...tabList.children].map(button => [button.dataset.lab, button]));
    const visibleIds = new Set(filtered.map(lab => lab.id));
    for (const button of [...tabList.children]) if (!visibleIds.has(button.dataset.lab)) button.remove();
    document.getElementById('explorer-result-count').textContent = `${filtered.length} / 5 phòng Lab`;

    if (filtered.length === 0) {
      emptyState.hidden = false;
      if (previewPanel) previewPanel.hidden = true;
      return;
    }

    emptyState.hidden = true;
    if (previewPanel) previewPanel.hidden = false;

    /* Keep selection valid within filtered set */
    if (!filtered.some(function(l) { return l.id === currentLabId; })) {
      currentLabId = filtered[0].id;
    }

    filtered.forEach(function(lab, index) {
      const globalIdx = LABS.findIndex(function(l) { return l.id === lab.id; });
      const num = String(globalIdx + 1).padStart(2, '0');
      const isSelected = lab.id === currentLabId;

      if (existing.has(lab.id)) {
        const button = existing.get(lab.id);
        button.hidden = false;
        button.classList.toggle('is-selected', isSelected);
        button.setAttribute('aria-pressed', String(isSelected));
        if (tabList.children[index] !== button) tabList.insertBefore(button, tabList.children[index] || null);
        return;
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'explorer-tab-item' + (isSelected ? ' is-selected' : '');
      btn.dataset.lab = lab.id;
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

      const left = document.createElement('div');
      left.className = 'explorer-tab-left';

      const numSpan = document.createElement('span');
      numSpan.className = 'explorer-tab-num';
      numSpan.textContent = num;

      const textWrap = document.createElement('div');
      const titleSpan = document.createElement('span');
      titleSpan.className = 'explorer-tab-title';
      titleSpan.textContent = lab.name;

      const subSpan = document.createElement('span');
      subSpan.className = 'explorer-tab-sub';
      subSpan.textContent = lab.subject;

      textWrap.appendChild(titleSpan);
      textWrap.appendChild(subSpan);
      left.appendChild(numSpan);
      left.appendChild(textWrap);

      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';

      btn.appendChild(left);
      btn.appendChild(arrow);

      btn.addEventListener('click', function() {
        currentLabId = lab.id;
        renderExplorerList();
      });

      tabList.insertBefore(btn, tabList.children[index] || null);
    });

    const selectedButton = tabList.querySelector('[aria-pressed="true"]:not([hidden])');
    if (selectedButton) tabList.style.setProperty('--selection-y', `${selectedButton.offsetTop}px`);

    renderPreviewPanel(currentLabId);
  }

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchQuery = searchInput.value;
      if (clearBtn) clearBtn.hidden = searchQuery.length === 0;
      renderExplorerList();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.hidden = true;
      renderExplorerList();
      searchInput.focus();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      searchInput.value = '';
      searchQuery = '';
      activeFilter = 'all';
      if (clearBtn) clearBtn.hidden = true;
      filterBtns.forEach(function(b) {
        b.classList.toggle('is-active', b.getAttribute('data-filter') === 'all');
        b.setAttribute('aria-pressed', b.getAttribute('data-filter') === 'all' ? 'true' : 'false');
      });
      renderExplorerList();
      if (searchInput) searchInput.focus();
    });
  }

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      activeFilter = btn.getAttribute('data-filter') || 'all';
      filterBtns.forEach(function(b) {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      renderExplorerList();
    });
  });

  filterBtns.forEach(function(b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === 'all' ? 'true' : 'false'); });
  renderExplorerList();
}

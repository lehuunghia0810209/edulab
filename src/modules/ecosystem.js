import { LABS } from '../data/labs.js';
import { createLabActionElement } from '../utils/helpers.js';
import { getMotionState } from './motion-controller.js';

export function initEcosystemDiagram() {
  const row = document.getElementById('eco-nodes-row');
  const detailCode = document.getElementById('eco-detail-code');
  const detailTitle = document.getElementById('eco-detail-title');
  const detailDesc = document.getElementById('eco-detail-desc');
  const detailAction = document.getElementById('eco-detail-action');

  if (!row) return;

  const hub = row.closest('.eco-hub-wrap');
  const positions = [[16,24],[84,24],[84,76],[16,76],[50,88]];
  const network = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  network.setAttribute('viewBox', '0 0 1000 520');
  network.setAttribute('preserveAspectRatio', 'none');
  network.setAttribute('aria-hidden', 'true');
  network.classList.add('eco-network');
  network.innerHTML = LABS.map((lab,index) => {
    const [x,y] = positions[index];
    const path = `M500 234 Q${x*10} 234 ${x*10} ${y*5.2}`;
    return `<g data-connection="${lab.id}"><path d="${path}" class="network-track"/><path d="${path}" class="ambient network-flow" style="animation-delay:-${index*1.3}s"/></g>`;
  }).join('');
  hub.prepend(network);
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.id = 'eco-reset-btn';
  reset.className = 'text-link eco-reset';
  reset.textContent = 'Xem tổng quan ↗';
  reset.addEventListener('click', () => updateEcosystemSelection(null));
  document.querySelector('.eco-architecture').prepend(reset);

  let activeEcoId = LABS[0].id;

  function updateEcosystemSelection(labId) {
    activeEcoId = labId;
    const idx = LABS.findIndex(function(l) { return l.id === labId; });
    const lab = idx !== -1 ? LABS[idx] : null;
    const num = String((idx !== -1 ? idx : 0) + 1).padStart(2, '0');
    row.dataset.active = lab?.id || '';
    network.querySelectorAll('[data-connection]').forEach(connection => connection.classList.toggle('is-active', connection.dataset.connection === lab?.id));

    const buttons = row.querySelectorAll('.eco-node-btn');
    buttons.forEach(function(btn) {
      const match = btn.getAttribute('data-eco-lab') === lab?.id;
      btn.classList.toggle('is-active', match);
      btn.setAttribute('aria-pressed', match ? 'true' : 'false');
    });

    detailCode.textContent = lab ? num + ' / ' + lab.name.toUpperCase() : 'EDULAB / CONNECTED KNOWLEDGE';
    detailTitle.textContent = lab ? lab.name + ' — Phòng Lab ' + lab.subject : 'Năm lĩnh vực. Một điểm khởi đầu.';
    detailDesc.textContent = lab ? lab.description + ' Website độc lập trong hệ sinh thái EduLab.' : 'Chọn một môn học trên bản đồ để khám phá.';
    detailAction.innerHTML = '';
    if (lab) detailAction.appendChild(createLabActionElement(lab, true));
    if (getMotionState().canAnimate) {
      const detail = document.getElementById('eco-detail-bar');
      detail.getAnimations().forEach(animation => animation.cancel());
      detail.animate(
        [{ opacity: 0.55, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' },
      );
    }
  }

  row.innerHTML = '';
  LABS.forEach(function(lab, index) {
    const num = String(index + 1).padStart(2, '0');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'eco-node-btn';
    btn.setAttribute('data-eco-lab', lab.id);
    btn.style.setProperty('--node-x', positions[index][0] + '%');
    btn.style.setProperty('--node-y', positions[index][1] + '%');
    btn.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');

    const idxSpan = document.createElement('span');
    idxSpan.className = 'eco-node-idx';
    idxSpan.textContent = num;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'eco-node-name';
    nameSpan.textContent = lab.name;

    const subjSpan = document.createElement('span');
    subjSpan.className = 'eco-node-subj';
    subjSpan.textContent = lab.subject;

    btn.appendChild(idxSpan);
    btn.appendChild(nameSpan);
    btn.appendChild(subjSpan);

    btn.addEventListener('click', function() {
      updateEcosystemSelection(lab.id);
    });
    btn.addEventListener('focus', function() {
      updateEcosystemSelection(lab.id);
    });

    row.appendChild(btn);
  });

  updateEcosystemSelection(activeEcoId);
}

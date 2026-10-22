import { CATEGORY_LABELS, CONTACT_EMAIL, EXA, LABS, LAB_ILLUSTRATIONS } from '../data/labs.js';
import { createLabActionElement, showStatusToast } from '../utils/helpers.js';

export function renderLabDiscoveryAndFooter() {
  const grid = document.getElementById('labs-discovery-grid');
  const footerList = document.getElementById('footer-lab-links');

  if (grid) {
    grid.innerHTML = '';
    LABS.forEach(function(lab, index) {
      const num = String(index + 1).padStart(2, '0');
      const hasUrl = Boolean(lab.url && lab.url.trim().length > 0);

      const article = document.createElement('article');
      article.className = 'lab-card';
      article.dataset.lab = lab.id;

      const top = document.createElement('div');
      top.className = 'lab-card-top';

      const badge = document.createElement('span');
      badge.className = 'lab-index-badge';
      badge.textContent = num;

      const cat = document.createElement('span');
      cat.className = 'lab-category-tag';
      cat.textContent = CATEGORY_LABELS[lab.category] || lab.category;

      top.appendChild(badge);
      top.appendChild(cat);

      const art = document.createElement('div');
      art.className = 'lab-artwork-box';
      art.innerHTML = LAB_ILLUSTRATIONS[lab.id] || '';

      const body = document.createElement('div');
      body.className = 'lab-card-body';

      const subj = document.createElement('span');
      subj.className = 'lab-subject-vn';
      subj.textContent = lab.subject;

      const title = document.createElement('h3');
      title.className = 'lab-name-en';
      title.textContent = lab.name;

      const desc = document.createElement('p');
      desc.className = 'lab-desc-text';
      desc.textContent = lab.description;

      body.appendChild(subj);
      body.appendChild(title);
      body.appendChild(desc);

      const footer = document.createElement('div');
      footer.className = 'lab-card-footer';

      const status = document.createElement('div');
      status.className = 'lab-status-pill';
      const dot = document.createElement('span');
      dot.className = 'status-dot' + (hasUrl ? ' is-ready' : '');
      const statusText = document.createElement('span');
      statusText.textContent = hasUrl ? 'Sẵn sàng kết nối' : 'Chưa cập nhật liên kết';
      status.appendChild(dot);
      status.appendChild(statusText);

      footer.appendChild(status);
      footer.appendChild(createLabActionElement(lab, true));

      article.appendChild(top);
      article.appendChild(art);
      article.appendChild(body);
      article.appendChild(footer);
      grid.appendChild(article);
    });
  }

  if (footerList) {
    footerList.replaceChildren(...LABS.map(createFooterProductItem));
  }

  document.getElementById('footer-exa-links')?.replaceChildren(createFooterProductItem(EXA));

  const exaSlot = document.getElementById('exa-action-slot');
  if (exaSlot) {
    exaSlot.replaceChildren(createLabActionElement(EXA, false, 'Vào Exa'));
    if (!EXA.url) {
      const note = document.createElement('p');
      note.className = 'exa-cta-note';
      note.textContent = 'Liên kết tới Exa chưa được cấu hình trên trang này.';
      exaSlot.parentElement.append(note);
    }
  }

  const contact = document.getElementById('footer-contact');
  if (contact && CONTACT_EMAIL) {
    const link = document.createElement('a');
    link.href = 'mailto:' + CONTACT_EMAIL;
    link.textContent = 'Liên hệ';
    contact.replaceChildren(link);
    contact.hidden = false;
  }
}

function createFooterProductItem(product) {
  const li = document.createElement('li');
  const label = product.name + ' — ' + product.subject;
  if (product.url) {
    const a = document.createElement('a');
    a.href = product.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = label;
    li.appendChild(a);
  } else {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    const note = document.createElement('span');
    note.className = 'footer-link-note';
    note.textContent = 'Chưa cập nhật liên kết';
    btn.appendChild(note);
    btn.addEventListener('click', function() {
      showStatusToast(product.name + ' (' + product.subject + '): Chưa cập nhật liên kết.');
    });
    li.appendChild(btn);
  }
  return li;
}

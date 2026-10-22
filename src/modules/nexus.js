import { LABS } from '../data/labs.js';
import { createLabActionElement } from '../utils/helpers.js';

export function initHeroNexus() {
  const viewport = document.getElementById('nexus-viewport');
  const coreBtn = document.getElementById('nexus-core-btn');
  const resetBtn = document.getElementById('nexus-reset-btn');
  const nodes = document.querySelectorAll('.nexus-node');
  const spokes = document.querySelectorAll('.nexus-spoke-line');

  const hudCode = document.getElementById('nexus-hud-code');
  const hudName = document.getElementById('nexus-hud-name');
  const hudDesc = document.getElementById('nexus-hud-desc');
  const hudCtaSlot = document.getElementById('nexus-hud-cta-slot');
  const hud = document.getElementById('nexus-hud');
  document.querySelector('.nexus-section-copy')?.append(hud);
  const controls = document.createElement('div');
  controls.className = 'galaxy-controls';
  nodes.forEach(node => controls.append(node));
  viewport.append(controls);

  let selectedLabId = null;
  let webgl = null;

  function updateNexusSelection(labId) {
    if (selectedLabId === labId) {
      selectedLabId = null;
    } else {
      selectedLabId = labId;
    }

    const idx = LABS.findIndex(function(l) { return l.id === selectedLabId; });
    const lab = idx !== -1 ? LABS[idx] : null;
    if (viewport) viewport.dataset.selected = selectedLabId || '';

    nodes.forEach(function(node) {
      const isMatch = node.getAttribute('data-lab') === selectedLabId;
      node.classList.toggle('is-selected', isMatch);
      node.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });

    spokes.forEach(function(spoke) {
      const isMatch = spoke.getAttribute('data-spoke') === selectedLabId;
      spoke.classList.toggle('is-highlighted', isMatch);
    });
    if (webgl) webgl.select(selectedLabId);
    if (coreBtn) coreBtn.disabled = !selectedLabId;

    if (lab) {
      document.getElementById('nexus-hud')?.classList.add('has-selection');
      const numStr = String(idx + 1).padStart(2, '0');
      hudCode.textContent = 'LAB ' + numStr + ' / ' + lab.subject.toUpperCase();
      hudName.textContent = lab.name;
      hudDesc.textContent = lab.description;
      hudCtaSlot.innerHTML = '';
      hudCtaSlot.appendChild(createLabActionElement(lab, true));
      if (resetBtn) resetBtn.hidden = false;
    } else {
      document.getElementById('nexus-hud')?.classList.remove('has-selection');
      hudCode.textContent = 'ATLAS CORE';
      hudName.textContent = 'EduLab Knowledge Nexus';
      hudDesc.textContent = 'Chọn một quỹ đạo hoặc tên môn học để tìm hướng khám phá của bạn.';
      hudCtaSlot.innerHTML = '<a href="#kham-pha-lab" class="btn btn-secondary" style="padding:10px 18px;">Danh sách Lab</a>';
      if (resetBtn) resetBtn.hidden = true;
    }
  }

  nodes.forEach(function(node) {
    node.addEventListener('click', function() {
      updateNexusSelection(node.getAttribute('data-lab'));
    });
  });
  if (coreBtn) coreBtn.disabled = true;

  if (coreBtn) {
    coreBtn.addEventListener('click', function() {
      if (selectedLabId !== null) updateNexusSelection(selectedLabId);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      if (selectedLabId !== null) updateNexusSelection(selectedLabId);
    });
  }

  if (viewport && 'IntersectionObserver' in window) {
    let started = false;
    async function loadScene() {
      if (webgl || !window.WebGLRenderingContext) return;
      try {
        const { mountNexusScene } = await import('../three/nexus-scene.js');
        webgl = mountNexusScene(viewport, LABS, updateNexusSelection);
        webgl.select(selectedLabId);
        viewport.style.transform = '';
        viewport.classList.add('has-webgl');
        const canvas = viewport.querySelector('.nexus-canvas');
        canvas.addEventListener('webglcontextlost', function(event) {
          event.preventDefault();
          webgl?.dispose();
          webgl = null;
          viewport.classList.remove('has-webgl');
        }, { once: true });
        canvas.addEventListener('webglcontextrestored', function() {
          loadScene();
        }, { once: true });
      } catch (error) {
        viewport.querySelector('.nexus-canvas')?.remove();
        console.warn('WebGL Nexus không khởi tạo được; đang dùng giao diện dự phòng.', error);
      }
    }
    const observer = new IntersectionObserver(function(entries) {
      if (!started && entries[0].isIntersecting) {
        started = true;
        observer.disconnect();
        loadScene();
      }
    }, { rootMargin: '250px' });
    observer.observe(viewport);
  }

  const canParallax = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  if (canParallax && viewport) {
    let rafId = null;
    viewport.addEventListener('pointermove', function(e) {
      if (webgl || document.documentElement.dataset.motion !== 'on') return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function() {
        const rect = viewport.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) - 0.5;
        const ny = ((e.clientY - rect.top) / rect.height) - 0.5;
        const rotY = (nx * 10).toFixed(2);
        const rotX = (-ny * 10).toFixed(2);
        viewport.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
      });
    });

    viewport.addEventListener('pointerleave', function() {
      viewport.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }
}

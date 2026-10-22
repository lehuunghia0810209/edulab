import * as THREE from 'three';

import { getMotionState } from '../modules/motion-controller.js';

const PALETTES = {
  dark: { labs: [0x7edbe2, 0x9fbff4, 0xe4cd98, 0x88cbb6, 0xb5a8de], line: 0x8fb4bd, core: 0x8bdbd4, text: '#edf2ed' },
  light: { labs: [0x1f8a93, 0x3d64b0, 0x9a7a2c, 0x2f8a6c, 0x6b58b0], line: 0x4f7178, core: 0x176e70, text: '#173b43' },
};
const RADII = [2.05, 2.45, 2.85, 3.25, 3.65];
const BOUNDARY = 4.15;
const TILT = -.9;
const SPIN = .05;
const LABEL_OFFSET = .38;
const LABEL_HEIGHT_PX = 32;

const circle = (radius, segments = 192) => Array.from({ length: segments }, (_, i) => {
  const angle = i / segments * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
});
const ticks = (inner, outer, count, major, majorOuter) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = i / count * Math.PI * 2, end = i % major === 0 ? majorOuter : outer;
    points.push(new THREE.Vector3(Math.cos(angle) * inner, Math.sin(angle) * inner, 0), new THREE.Vector3(Math.cos(angle) * end, Math.sin(angle) * end, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
};
const line = (opacity, dashed) => dashed
  ? new THREE.LineDashedMaterial({ transparent: true, opacity, dashSize: .07, gapSize: .11, depthWrite: false })
  : new THREE.LineBasicMaterial({ transparent: true, opacity, depthWrite: false });
const ring = (inner, outer, opacity) => new THREE.Mesh(new THREE.RingGeometry(inner, outer, 72), new THREE.MeshBasicMaterial({ transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));

export function mountNexusScene(viewport, labs, onSelect) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.domElement.className = 'nexus-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  viewport.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  // Orthographic projection keeps every tilted orbit concentric with the core; perspective would push the ellipse centres below the logo.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -50, 50);
  camera.position.set(0, 0, 20);
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-4, 6, 9);
  scene.add(key);

  const plane = new THREE.Group();
  plane.rotation.x = TILT;
  const markers = new THREE.Group();
  const core = new THREE.Group();
  const world = new THREE.Group();
  world.add(plane, markers, core);
  scene.add(world);
  const themed = [];

  const boundary = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circle(BOUNDARY, 240)), line(.26, true));
  boundary.computeLineDistances();
  const scale = new THREE.LineSegments(ticks(BOUNDARY - .07, BOUNDARY - .02, 120, 10, BOUNDARY + .06), line(.3));
  const inner = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circle(1.7, 160)), line(.24, true));
  inner.computeLineDistances();
  plane.add(boundary, scale, inner);
  themed.push([boundary, 'line'], [scale, 'line'], [inner, 'line']);

  const dustPositions = [];
  for (let i = 0; i < 260; i++) {
    const angle = i * 2.39996, radius = 1.15 + (i * 7 % 97) / 97 * 3.1;
    dustPositions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, ((i * 13) % 9 - 4) * .012);
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ size: .022, transparent: true, opacity: .5, depthWrite: false }));
  plane.add(dust);
  themed.push([dust, 'line']);

  const coreRing = ring(.69, .702, .6);
  const coreTicks = new THREE.LineSegments(ticks(.76, .79, 72, 6, .82), line(.5));
  const coreDash = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circle(.93, 128)), line(.42, true));
  coreDash.computeLineDistances();
  core.add(coreRing, coreTicks, coreDash);
  themed.push([coreRing, 'core'], [coreTicks, 'core'], [coreDash, 'core']);

  const sphere = new THREE.SphereGeometry(.12, 32, 20);
  const textures = [];
  const nodes = labs.map((lab, index) => {
    const radius = RADII[index];
    const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circle(radius)), line(.3));
    const pivot = new THREE.Group();
    const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 40 }, (_, i) => {
      const angle = -.62 + i / 39 * .62;
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    })), line(.75));
    pivot.add(trail);
    plane.add(orbit, pivot);

    const node = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({ metalness: .35, roughness: .32 }));
    node.userData.labId = lab.id;
    const glow = new THREE.Mesh(new THREE.CircleGeometry(.2, 48), new THREE.MeshBasicMaterial({ transparent: true, opacity: .14, depthWrite: false }));
    glow.position.z = -.02;
    const halo = ring(.2, .212, .75);
    const outer = ring(.29, .296, .28);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    node.add(glow, halo, outer, hit);

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 80;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));

    const link = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), line(.12));
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(.03, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: .9 }));
    markers.add(link, pulse, node, label);
    themed.push([orbit, index], [trail, index], [node, index], [glow, index], [halo, index], [outer, index], [link, index], [pulse, index]);
    return { lab, index, radius, orbit, pivot, trail, node, halo, outer, label, canvas, texture, link, pulse, button: viewport.querySelector(`[data-lab="${lab.id}"]`) };
  });

  function drawLabel(item, palette) {
    const context = item.canvas.getContext('2d');
    context.clearRect(0, 0, item.canvas.width, item.canvas.height);
    context.font = '600 34px "Be Vietnam Pro", system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = palette.text;
    context.fillText(item.lab.name, item.canvas.width / 2, item.canvas.height / 2);
    item.texture.needsUpdate = true;
  }
  function applyTheme() {
    const palette = PALETTES[document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'];
    for (const [object, key] of themed) object.material.color.setHex(typeof key === 'number' ? palette.labs[key] : palette[key]);
    nodes.forEach(item => {
      item.node.material.emissive.setHex(palette.labs[item.index]).multiplyScalar(.18);
      drawLabel(item, palette);
    });
    draw();
  }

  const events = new AbortController();
  let selected = null, hovered = null, visible = false, disposed = false, frame = 0, last = 0, elapsed = 0, pixelsPerUnit = 100;
  const pointer = new THREE.Vector2(), tiltTarget = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const projected = new THREE.Vector3();
  const canMove = () => getMotionState().canAnimate;
  const toWorld = (radius, angle, target) => target.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0).applyEuler(plane.rotation);

  function draw(dt = 0) {
    if (disposed) return;
    plane.rotation.x = THREE.MathUtils.damp(plane.rotation.x, TILT + tiltTarget.y, 4, dt || 1);
    plane.rotation.y = THREE.MathUtils.damp(plane.rotation.y, tiltTarget.x, 4, dt || 1);
    world.scale.setScalar(THREE.MathUtils.damp(world.scale.x, selected ? 1.06 : 1, 4, dt || 1));
    world.updateMatrixWorld();
    nodes.forEach(item => {
      const { lab, index, radius, orbit, pivot, trail, node, halo, outer, label, link, pulse, button } = item;
      // A shared spin with small bounded offsets keeps the five Labs evenly spaced while each orbit breathes on its own rhythm.
      const angle = -1.1 + index * Math.PI * 2 / 5 + elapsed * SPIN + Math.sin(elapsed * (.19 + index * .037) + index * 1.7) * .16;
      pivot.rotation.z = angle;
      toWorld(radius, angle, node.position);
      const active = selected === lab.id, focus = (active ? 1.5 : hovered === lab.id ? 1.25 : 1) * (1 + node.position.z * .05);
      node.scale.setScalar(dt ? THREE.MathUtils.damp(node.scale.x, focus, 6, dt) : focus);
      halo.scale.setScalar(1 + Math.sin(elapsed * 1.4 + index * 1.3) * .08);
      outer.rotation.z = elapsed * .3;
      orbit.material.opacity = active ? .85 : selected ? .1 : .3;
      trail.material.opacity = active ? 1 : selected ? .2 : .75;
      link.material.opacity = active ? .55 : selected ? .04 : .12;
      label.material.opacity = active || !selected ? 1 : .35;
      label.position.copy(node.position).y -= LABEL_OFFSET * node.scale.x;
      const labelHeight = LABEL_HEIGHT_PX / pixelsPerUnit / world.scale.x;
      label.scale.set(labelHeight * 4, labelHeight, 1);
      link.geometry.attributes.position.setXYZ(1, node.position.x, node.position.y, node.position.z);
      link.geometry.attributes.position.needsUpdate = true;
      pulse.position.copy(node.position).multiplyScalar((elapsed * .16 + index * .21) % 1);
      projected.copy(node.position).applyMatrix4(world.matrixWorld).project(camera);
      button?.setAttribute('data-canvas-point', `${((projected.x + 1) / 2).toFixed(4)},${((1 - projected.y) / 2).toFixed(4)}`);
    });
    boundary.rotation.z = elapsed * .012;
    inner.rotation.z = -elapsed * .03;
    dust.rotation.z = elapsed * .014;
    coreTicks.rotation.z = -elapsed * .05;
    coreDash.rotation.z = elapsed * .08;
    renderer.render(scene, camera);
  }
  function tick(now) {
    frame = 0;
    if (disposed || !visible || document.hidden || !canMove()) return;
    const dt = Math.min((now - (last || now)) / 1000, .05);
    last = now;
    elapsed += dt;
    draw(dt);
    frame = requestAnimationFrame(tick);
  }
  function syncLoop() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (disposed) return;
    if (visible && !document.hidden && canMove()) frame = requestAnimationFrame(tick);
    else draw();
  }

  const bounds = [];
  for (let i = 0; i < 96; i++) {
    const angle = i / 96 * Math.PI * 2;
    bounds.push(toWorld(BOUNDARY + .06, angle, new THREE.Vector3()));
    const labelPoint = toWorld(RADII[RADII.length - 1], angle, new THREE.Vector3());
    labelPoint.y -= LABEL_OFFSET + .16;
    bounds.push(labelPoint);
  }
  // Fit the system into the area above the Lab buttons and anchor its exact centre there; the HTML badge uses the same point.
  function resize() {
    const width = viewport.clientWidth, height = viewport.clientHeight;
    if (!width || !height) return;
    const available = height - (viewport.querySelector('.galaxy-controls')?.offsetHeight || 0) - 12;
    const fill = .92;
    const unit = Math.min(width / 2 * fill / Math.max(...bounds.map(point => Math.abs(point.x))), available / 2 * fill / Math.max(...bounds.map(point => Math.abs(point.y))));
    const centreY = available / 2;
    camera.left = -width / 2 / unit;
    camera.right = width / 2 / unit;
    camera.top = centreY / unit;
    camera.bottom = -(height - centreY) / unit;
    camera.updateProjectionMatrix();
    pixelsPerUnit = unit;
    nodes.forEach(item => { item.label.visible = width >= 520; });
    viewport.style.setProperty('--nexus-core-size', `${Math.round(Math.max(48, 1.24 * unit))}px`);
    viewport.style.setProperty('--nexus-core-y', `${centreY}px`);
    renderer.setSize(width, height, false);
    draw();
  }
  function hit(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    let object = raycaster.intersectObjects(nodes.map(item => item.node), true)[0]?.object;
    while (object && !object.userData.labId) object = object.parent;
    return object?.userData.labId || null;
  }
  renderer.domElement.addEventListener('pointermove', event => {
    hovered = hit(event);
    renderer.domElement.style.cursor = hovered ? 'pointer' : '';
    if (canMove() && event.pointerType === 'mouse') tiltTarget.set(pointer.x * .06, -pointer.y * .05);
    else if (!canMove()) draw();
  }, { signal: events.signal });
  renderer.domElement.addEventListener('pointerleave', () => { hovered = null; tiltTarget.set(0, 0); }, { signal: events.signal });
  renderer.domElement.addEventListener('click', event => { const id = hit(event); if (id) onSelect(id); }, { signal: events.signal });
  document.addEventListener('visibilitychange', syncLoop, { signal: events.signal });
  document.addEventListener('edulab:motion-change', syncLoop, { signal: events.signal });
  document.fonts?.ready.then(applyTheme);
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncLoop(); });
  const resizeObserver = new ResizeObserver(resize);
  observer.observe(viewport);
  resizeObserver.observe(viewport);
  applyTheme();
  resize();
  return {
    select(id) { selected = id; if (!canMove()) draw(); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      events.abort();
      observer.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      textures.forEach(texture => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      viewport.style.removeProperty('--nexus-core-size');
      viewport.style.removeProperty('--nexus-core-y');
    },
  };
}

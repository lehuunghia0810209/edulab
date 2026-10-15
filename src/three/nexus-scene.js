import * as THREE from 'three';

import { getMotionState } from '../modules/motion-controller.js';

const COLORS = [0x7edbe2, 0x9fbff4, 0xe4cd98, 0x88cbb6, 0xb5a8de];

export function mountNexusScene(viewport, labs, onSelect) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.domElement.className = 'nexus-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  viewport.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 40);
  camera.position.set(0, 0, 10.7);
  const galaxy = new THREE.Group();
  scene.add(galaxy);
  scene.add(new THREE.AmbientLight(0xffffff, 2));
  const key = new THREE.DirectionalLight(0xe6faff, 3);
  key.position.set(-3, 5, 8);
  scene.add(key);
  const sphere = new THREE.SphereGeometry(.11, 24, 16);
  const nodes = [];
  const orbitPoint = (index, phase) => new THREE.Vector3(Math.cos(phase) * (1.85 + index * .30), Math.sin(phase) * (1.85 + index * .30) * .66, Math.sin(phase) * .48).applyAxisAngle(new THREE.Vector3(0,0,1), -.32 + index * .12);
  labs.forEach((lab, index) => {
    const color = COLORS[index];
    const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:160}, (_,i) => orbitPoint(index, i/160*Math.PI*2))), new THREE.LineBasicMaterial({color, transparent:true, opacity:.28}));
    galaxy.add(orbit);
    const node = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({color, metalness:.45, roughness:.3}));
    node.userData.labId = lab.id;
    const halo = new THREE.Mesh(new THREE.RingGeometry(.17,.183,48), new THREE.MeshBasicMaterial({color, transparent:true, opacity:.6, side:THREE.DoubleSide}));
    node.add(halo);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(.27,12,8), new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    node.add(hit);
    galaxy.add(node);
    const link = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]), new THREE.LineBasicMaterial({color,transparent:true,opacity:.17}));
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(.035,8,6), new THREE.MeshBasicMaterial({color}));
    galaxy.add(link,pulse);
    nodes.push({lab, index, orbit, node, halo, link, pulse, button:viewport.querySelector(`[data-lab="${lab.id}"]`)});
  });
  const dustPositions = [];
  for(let i=0;i<180;i++) {
    const angle=i*2.39996, radius=.65+(i%53)*.055;
    dustPositions.push(Math.cos(angle)*radius, Math.sin(angle)*radius*.68, -.6-(i%7)*.12);
  }
  const dustGeometry=new THREE.BufferGeometry();
  dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0x9abbca,size:.018,transparent:true,opacity:.65}));
  galaxy.add(dust);
  const coreOrbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:96},(_,i) => new THREE.Vector3(Math.cos(i/96*Math.PI*2)*.7,Math.sin(i/96*Math.PI*2)*.7,0))),new THREE.LineBasicMaterial({color:0x7edbe2,transparent:true,opacity:.35}));
  galaxy.add(coreOrbit);
  const events = new AbortController();
  let selected=null, hovered=null, visible=false, disposed=false, frame=0, last=0, elapsed=0;
  const pointer=new THREE.Vector2(), cameraTarget=new THREE.Vector2();
  const raycaster=new THREE.Raycaster();
  const projected=new THREE.Vector3();
  const canMove=()=>getMotionState().canAnimate;
  function draw(dt=0) {
    camera.position.x=THREE.MathUtils.damp(camera.position.x,cameraTarget.x,4,dt||1);
    camera.position.y=THREE.MathUtils.damp(camera.position.y,cameraTarget.y,4,dt||1);
    camera.position.z=THREE.MathUtils.damp(camera.position.z,selected?10:10.7,4,dt||1);
    camera.updateMatrixWorld();
    nodes.forEach(({lab,index,orbit,node,halo,link,pulse,button})=>{
      const phase=Math.PI/2-index*Math.PI*2/5+elapsed*(.065+index*.006);
      node.position.copy(orbitPoint(index,phase));
      orbit.rotation.z = Math.sin(elapsed * .09 + index) * .06;
      node.position.applyAxisAngle(new THREE.Vector3(0,0,1), orbit.rotation.z);
      const active=selected===lab.id, scale=active?1.65:hovered===lab.id?1.35:1;
      node.scale.setScalar(dt?THREE.MathUtils.damp(node.scale.x,scale,5,dt):scale);
      orbit.material.opacity=active?.9:selected?.12:.28;
      halo.material.opacity=active?1:.6;
      link.material.opacity=active?.55:.13;
      const positions=link.geometry.attributes.position;
      positions.setXYZ(1,node.position.x,node.position.y,node.position.z);positions.needsUpdate=true;
      pulse.position.copy(node.position).multiplyScalar((elapsed*.14+index*.21)%1);
      projected.copy(node.position).project(camera);
      button?.setAttribute('data-canvas-point',`${((projected.x+1)/2).toFixed(4)},${((1-projected.y)/2).toFixed(4)}`);
    });
    dust.rotation.z=elapsed*.018;
    coreOrbit.rotation.y=Math.sin(elapsed*.25)*.18;
    coreOrbit.scale.setScalar(1+Math.sin(elapsed*.65)*.045);
    renderer.render(scene,camera);
  }
  function tick(now) {
    frame=0;
    if(disposed||!visible||document.hidden||!canMove())return;
    const dt=Math.min((now-(last||now))/1000,.05);last=now;elapsed+=dt;
    draw(dt);frame=requestAnimationFrame(tick);
  }
  function syncLoop() {
    cancelAnimationFrame(frame);frame=0;last=0;
    if(disposed)return;
    if(visible&&!document.hidden&&canMove())frame=requestAnimationFrame(tick);else draw();
  }
  function resize() {
    if(!viewport.clientWidth||!viewport.clientHeight)return;
    camera.aspect=viewport.clientWidth/viewport.clientHeight;
    camera.fov=camera.aspect<.85?52:42;camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth,viewport.clientHeight,false);draw();
  }
  function hit(event) {
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    let object=raycaster.intersectObjects(nodes.map(item=>item.node),true)[0]?.object;
    while(object&&!object.userData.labId)object=object.parent;
    return object?.userData.labId||null;
  }
  renderer.domElement.addEventListener('pointermove',event=>{
    hovered=hit(event);renderer.domElement.style.cursor=hovered?'pointer':'';
    if(canMove()&&event.pointerType==='mouse')cameraTarget.set(pointer.x*.16,pointer.y*.12);
  },{signal:events.signal});
  renderer.domElement.addEventListener('pointerleave',()=>{hovered=null;cameraTarget.set(0,0);},{signal:events.signal});
  renderer.domElement.addEventListener('click',event=>{const id=hit(event);if(id)onSelect(id);},{signal:events.signal});
  document.addEventListener('visibilitychange',syncLoop,{signal:events.signal});
  document.addEventListener('edulab:motion-change',syncLoop,{signal:events.signal});
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;syncLoop();});
  const resizeObserver=new ResizeObserver(resize);
  observer.observe(viewport);resizeObserver.observe(viewport);resize();
  return {select(id){selected=id;if(!canMove())draw();},dispose(){
    disposed=true;cancelAnimationFrame(frame);events.abort();observer.disconnect();resizeObserver.disconnect();
    const geometries=new Set(),materials=new Set();
    scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)materials.add(object.material);});
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
    renderer.dispose();renderer.domElement.remove();
  }};
}

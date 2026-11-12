import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

// The car and wheels below are the same game assets used in WRECK RALLY.
// The display island is a presentation scene, not an emulation of game physics.
const canvas = document.getElementById('hero-canvas');
const container = document.getElementById('hero-scene');
const status = document.getElementById('scene-status');
const fallback = document.getElementById('scene-fallback');

if (canvas && container) startShowroom();

async function startShowroom() {
  let sceneFailed=false;
  function showFallback() {
    sceneFailed=true;
    container.dataset.scene='fallback';
    canvas.hidden=true;
    if(fallback)fallback.hidden=false;
    if(status)status.textContent='WRECK RALLYのゲーム画面';
  }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'});
  } catch {
    showFallback();
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4, 4, 3.5, -3.5, .1, 60);
  const cameraHome = new THREE.Vector3(7.1, 5.4, 9.5);
  const cameraFocus = new THREE.Vector3(0, .7, 0);
  camera.position.copy(cameraHome);
  camera.lookAt(cameraFocus);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const fill = new THREE.HemisphereLight(0xe9fbff, 0x3a7996, 2.6);
  scene.add(fill);
  const sun = new THREE.DirectionalLight(0xfff2d4, 3.4);
  sun.position.set(-3, 8, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {left:-6, right:6, top:6, bottom:-6, near:.5, far:25});
  sun.shadow.normalBias = .025;
  sun.shadow.bias = -.0002;
  sun.shadow.radius = 4;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xb7ebff, 1.6);
  rim.position.set(5, 3, -6);
  scene.add(rim);

  const makeMaterial = color => new THREE.MeshStandardMaterial({color, roughness:.75, metalness:0, flatShading:true});
  const colors = {
    blue:makeMaterial(0x22aada), blueDark:makeMaterial(0x087bab), navy:makeMaterial(0x1b1f4a),
    yellow:makeMaterial(0xffcf39), white:makeMaterial(0xf4f7e4), orange:makeMaterial(0xff732a),
    green:makeMaterial(0x10a85d), greenDark:makeMaterial(0x008756), bark:makeMaterial(0x677d7b)
  };
  const island = new THREE.Group();
  scene.add(island);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(3.15,3.02,.35,12), [colors.blue,colors.blue,colors.blueDark]);
  pedestal.position.y = -.20;
  pedestal.receiveShadow = true;
  pedestal.castShadow = true;
  island.add(pedestal);
  const underside = new THREE.Mesh(new THREE.CylinderGeometry(3.0,2.82,.18,12), colors.navy);
  underside.position.y = -.45;
  island.add(underside);
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(3.18,3.18,.065,12), colors.yellow);
  edge.position.y = -.055;
  edge.receiveShadow = true;
  island.add(edge);
  const surface = new THREE.Mesh(new THREE.CylinderGeometry(3.14,3.14,.05,12), colors.blue);
  surface.position.y = -.012;
  surface.receiveShadow = true;
  island.add(surface);
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * Math.PI * 2;
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(.22,.085), i%2 ? colors.white : colors.yellow);
    dash.rotation.x = -Math.PI/2;
    dash.rotation.z = -a;
    dash.position.set(Math.cos(a)*2.88,.025,Math.sin(a)*2.88);
    island.add(dash);
  }

  // A broad transparent shadow keeps the floating island grounded in the layout.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext('2d');
  const shadowGradient = shadowContext.createRadialGradient(64,64,5,64,64,64);
  shadowGradient.addColorStop(0,'rgba(15,54,90,.30)');
  shadowGradient.addColorStop(.55,'rgba(15,54,90,.16)');
  shadowGradient.addColorStop(1,'rgba(15,54,90,0)');
  shadowContext.fillStyle = shadowGradient;
  shadowContext.fillRect(0,0,128,128);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(9,7), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
  blob.rotation.x = -Math.PI/2;
  blob.position.y = -.61;
  scene.add(blob);

  function addTree(x,z,scale) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,.95,5),colors.bark);
    trunk.position.y = .46;
    tree.add(trunk);
    [[0,1.18,0,.6],[.26,1.55,-.03,.55],[-.27,1.58,.06,.53],[0,1.93,0,.45]].forEach(([px,py,pz,r],index)=>{
      const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(r,0), index%2?colors.green:colors.greenDark);
      leaves.position.set(px,py,pz);
      leaves.castShadow = true;
      tree.add(leaves);
    });
    tree.position.set(x,0,z);
    tree.scale.setScalar(scale);
    island.add(tree);
  }
  addTree(-1.95,-1.65,.88);
  addTree(1.85,-1.55,1.05);
  function addCone(x,z,scale=1) {
    const cone = new THREE.Group();
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.53,.09,.53),colors.orange);
    foot.position.y=.055; cone.add(foot);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.035,.23,.66,6),colors.orange);
    body.position.y=.42; cone.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,.1,6),colors.white);
    band.position.y=.51; cone.add(band);
    cone.position.set(x,.025,z); cone.scale.setScalar(scale);
    cone.traverse(o=>{if(o.isMesh)o.castShadow=true;}); island.add(cone);
  }
  addCone(-1.85,1.52,.9);
  addCone(2.16,.5,.78);

  const coins=[];
  function addCoin(x,y,z,scale=1) {
    const coin=new THREE.Group();
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.1,12),colors.yellow);
    rim.rotation.x=Math.PI/2;
    coin.add(rim);
    const face=new THREE.Mesh(new THREE.CircleGeometry(.245,12),makeMaterial(0xffdf62));
    face.position.z=.054;
    coin.add(face);
    const starShape=new THREE.Shape();
    for(let i=0;i<10;i++) {const a=i*Math.PI/5+Math.PI/2;const r=i%2?.084:.17;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?starShape.lineTo(x,y):starShape.moveTo(x,y);}
    starShape.closePath();
    const star=new THREE.Mesh(new THREE.ShapeGeometry(starShape),colors.white);
    star.position.z=.06;
    coin.add(star);
    coin.position.set(x,y,z);coin.scale.setScalar(scale);coin.rotation.y=.5;
    scene.add(coin);coins.push({object:coin,y,phase:coins.length*1.7});
  }
  addCoin(-2.45,1.27,.15,1.05);
  addCoin(2.2,2.45,-.6,.85);
  addCoin(-.4,2.9,-1.8,.7);

  const vehicle = new THREE.Group();
  vehicle.position.y=.035;
  scene.add(vehicle);
  let modelReady=false,targetYaw=-.2,currentYaw=-.2;
  let idleTime=0,viewWidth=0,viewHeight=0;
  let lastInteraction=0,inView=true,raf=0,timer=0,lastFrame=0;
  const introDuration=1.32;
  const idleFrameInterval=1000/30;
  const inertiaDecay=7;
  let introElapsed=0,dragStart=null,lastX=0;
  let angularVelocity=0,dragVelocity=0,lastDragTime=0;
  const parallax=new THREE.Vector2();
  const parallaxTarget=new THREE.Vector2();
  const mouseParallax=matchMedia('(hover: hover) and (pointer: fine)');
  // app.js applies the OS preference initially and owns the explicit pause/resume choice.
  const isPaused=()=>document.documentElement.classList.contains('motion-paused');
  if(status)status.textContent='車両を準備しています…';
  canvas.style.touchAction='pan-y';

  function stopFrame(){if(raf)cancelAnimationFrame(raf);if(timer)clearTimeout(timer);raf=timer=0;lastFrame=0;}
  function requestFrame(immediate=false) {
    if(sceneFailed||!inView||document.hidden||raf||!modelReady)return;
    if(timer) {
      if(!immediate)return;
      clearTimeout(timer);timer=0;
    }
    if(immediate)raf=requestAnimationFrame(render);
    else {
      // Schedule ahead of the next 30 fps deadline, rather than adding a full
      // timeout after rendering and then waiting for another display refresh.
      const delay=Math.max(0,lastFrame+idleFrameInterval-performance.now()-4);
      timer=setTimeout(()=>{timer=0;raf=requestAnimationFrame(render);},delay);
    }
  }
  function needsFullRate() {
    return introElapsed<introDuration || !!dragStart || Math.abs(angularVelocity)>.008 ||
      Math.abs(targetYaw-currentYaw)>.0005 || parallax.distanceToSquared(parallaxTarget)>.000004;
  }
  function render(now) {
    raf=0;
    if(!modelReady||!inView||document.hidden)return;
    const dt=Math.min((now-(lastFrame||now))/1000,.06);
    lastFrame=now;
    const paused=isPaused();
    if(paused) {
      angularVelocity=dragVelocity=0;
      currentYaw=targetYaw;
      introElapsed=introDuration;
      parallax.set(0,0);
      parallaxTarget.set(0,0);
    } else {
      if(!dragStart&&Math.abs(angularVelocity)>.008) {
        const decay=Math.exp(-inertiaDecay*dt);
        targetYaw+=angularVelocity*(1-decay)/inertiaDecay;
        angularVelocity*=decay;
        if(Math.abs(angularVelocity)<=.008)angularVelocity=0;
      }
      currentYaw+=(1-Math.exp(-dt*(dragStart?18:10)))*(targetYaw-currentYaw);
      idleTime+=dt;
      introElapsed=Math.min(introDuration,introElapsed+dt);
      if(!dragStart)parallax.lerp(parallaxTarget,1-Math.exp(-dt*4.5));
    }
    const idleTurn=now-lastInteraction>3500&&!paused&&!dragStart?Math.sin(idleTime*.28)*.045:0;
    vehicle.rotation.y=currentYaw+idleTurn;
    updateCamera();
    coins.forEach(({object,y,phase})=>{
      object.position.y=y+(paused?0:Math.sin(idleTime*1.1+phase)*.075);
      object.rotation.y=.5+(paused?0:Math.sin(idleTime*.65+phase)*.18);
    });
    renderer.render(scene,camera);
    if(!paused)requestFrame(needsFullRate());
  }
  function updateCamera() {
    // A single eased arrival makes the scene feel composed without bouncing the car.
    const t=Math.min(1,introElapsed/introDuration);
    const remaining=Math.pow(1-t,3);
    camera.position.set(
      cameraHome.x-.52*remaining+parallax.x*.28,
      cameraHome.y+.30*remaining-parallax.y*.20,
      cameraHome.z+.36*remaining-parallax.x*.12
    );
    camera.lookAt(cameraFocus);
    const zoom=1-.045*remaining;
    if(Math.abs(camera.zoom-zoom)>.00001){camera.zoom=zoom;camera.updateProjectionMatrix();}
  }
  function resize() {
    if(sceneFailed)return;
    const rect=container.getBoundingClientRect();
    const width=Math.round(rect.width),height=Math.round(rect.height);
    if(!width||!height)return;
    if(width===viewWidth&&height===viewHeight)return;
    viewWidth=width;viewHeight=height;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,width<600?1.25:1.5));
    renderer.setSize(width,height,false);
    const aspect=width/height;
    const span=aspect<.95?7.3:aspect<1.3?6.75:6.15;
    camera.left=-span*aspect/2;camera.right=span*aspect/2;
    camera.top=span/2;camera.bottom=-span/2;
    camera.updateProjectionMatrix();
    requestFrame(true);
  }
  const resizeObserver=new ResizeObserver(resize);
  resizeObserver.observe(container);
  const visibilityObserver=new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting;
    if(inView){lastFrame=0;requestFrame(true);}else {cancelDrag();stopFrame();}
  },{rootMargin:'80px'});
  visibilityObserver.observe(container);
  const onVisibilityChange=()=>{if(document.hidden){cancelDrag();stopFrame();}else requestFrame(true);};
  document.addEventListener('visibilitychange',onVisibilityChange);
  const motionObserver=new MutationObserver(()=>{
    if(isPaused()) {
      cancelDrag();
      introElapsed=introDuration;
      parallaxTarget.set(0,0);
      stopFrame();
    }
    requestFrame(true);
  });
  motionObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  function disposeShowroom() {
    modelReady=false;
    cancelDrag();
    stopFrame();
    resizeObserver.disconnect();visibilityObserver.disconnect();motionObserver.disconnect();
    document.removeEventListener('visibilitychange',onVisibilityChange);
    renderer.dispose();
  }

  function rotate(amount){
    if(!modelReady)return;
    targetYaw+=amount;lastInteraction=performance.now();introElapsed=introDuration;
    requestFrame(true);
  }
  container.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||!mouseParallax.matches||isPaused()||dragStart)return;
    const rect=container.getBoundingClientRect();
    parallaxTarget.set(
      THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1),
      THREE.MathUtils.clamp((event.clientY-rect.top)/rect.height*2-1,-1,1)
    );
    requestFrame(true);
  });
  container.addEventListener('pointerleave',()=>{
    if(!dragStart){parallaxTarget.set(0,0);requestFrame(true);}
  });
  canvas.addEventListener('pointerdown',event=>{
    if(!modelReady||event.button!==0)return;
    if(dragStart)return;
    targetYaw=currentYaw=vehicle.rotation.y;
    lastInteraction=performance.now();
    angularVelocity=dragVelocity=0;
    dragStart={x:event.clientX,y:event.clientY,id:event.pointerId,moved:false};lastX=event.clientX;
    lastDragTime=performance.now();
    parallaxTarget.copy(parallax);
    introElapsed=introDuration;
    if(event.pointerType==='mouse')canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!dragStart||event.pointerId!==dragStart.id)return;
    const dx=event.clientX-dragStart.x,dy=event.clientY-dragStart.y;
    if(event.pointerType!=='mouse'&&Math.abs(dy)>Math.abs(dx)+5){cancelDrag();return;}
    if(Math.abs(dx)>3) {
      const now=performance.now();
      const sampleTime=Math.max((now-lastDragTime)/1000,1/120);
      const angle=(event.clientX-lastX)*.012;
      const sampleVelocity=THREE.MathUtils.clamp(angle/sampleTime,-2.4,2.4);
      dragVelocity+=(1-Math.exp(-sampleTime*18))*(sampleVelocity-dragVelocity);
      dragStart.moved=true;
      rotate(angle);lastX=event.clientX;lastDragTime=now;
    }
  });
  function releasePointer(pointerId) {
    if(pointerId!==undefined&&canvas.hasPointerCapture(pointerId))canvas.releasePointerCapture(pointerId);
  }
  function cancelDrag() {
    const pointerId=dragStart?.id;
    if(dragStart)targetYaw=currentYaw;
    dragStart=null;angularVelocity=dragVelocity=0;
    releasePointer(pointerId);
    parallaxTarget.set(0,0);
    requestFrame(true);
  }
  function finishDrag(event) {
    if(!dragStart||event.pointerId!==dragStart.id)return;
    const pointerId=dragStart.id;
    const recent=performance.now()-lastDragTime<90;
    angularVelocity=dragStart.moved&&recent&&!isPaused()?THREE.MathUtils.clamp(dragVelocity*.38,-.85,.85):0;
    dragStart=null;dragVelocity=0;
    releasePointer(pointerId);
    parallaxTarget.set(0,0);
    requestFrame(true);
  }
  canvas.addEventListener('pointerup',finishDrag);
  canvas.addEventListener('pointercancel',cancelDrag);
  canvas.addEventListener('lostpointercapture',()=>{if(dragStart)cancelDrag();});
  canvas.addEventListener('pointerleave',event=>{if(dragStart&&event.pointerType!=='mouse')cancelDrag();});
  canvas.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();cancelDrag();rotate(event.key==='ArrowLeft'?-.22:.22);
    }
  });
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();showFallback();disposeShowroom();
  });

  try {
    const loader=new GLTFLoader();
    const [body,tire]=await Promise.all([
      loader.loadAsync(new URL('./assets/car/Cars1.gltf',import.meta.url).href),
      loader.loadAsync(new URL('./assets/car/Cars_Tire1.gltf',import.meta.url).href)
    ]);
    // A context loss during loading must not restore an unusable canvas.
    if(sceneFailed)return;
    let tireMesh;
    tire.scene.traverse(object=>{if(object.isMesh&&!tireMesh)tireMesh=object;});
    if(!tireMesh)throw new Error('Wheel mesh is missing');
    const car=body.scene;
    const anchors=[];
    car.traverse(object=>{if(/Wheel_Crossover_(?:BL|BR|FL|FR)_/.test(object.name))anchors.push(object);});
    if(anchors.length!==4)throw new Error('Wheel anchors are missing');
    anchors.forEach(anchor=>{
      const wheel=tireMesh.clone();wheel.position.set(0,0,0);wheel.quaternion.identity();wheel.scale.set(1,1,1);
      anchor.add(wheel);
    });
    car.traverse(object=>{
      if(!object.isMesh)return;
      object.castShadow=true;object.receiveShadow=true;
      for(const material of Array.isArray(object.material)?object.material:[object.material]){
        material.roughness=.67;material.metalness=0;
        if(material.map)material.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      }
    });
    vehicle.add(car);vehicle.scale.setScalar(1.08);
    resize();
    modelReady=true;
    if(isPaused())introElapsed=introDuration;
    vehicle.rotation.y=currentYaw;
    updateCamera();
    renderer.render(scene,camera);
    if(fallback)fallback.hidden=true;
    canvas.hidden=false;
    container.dataset.scene='ready';
    if(status)status.textContent='ドラッグで車を回転できます';
    requestFrame(true);
  } catch(error) {
    console.warn('The game model could not be displayed.',error.message);
    showFallback();disposeShowroom();
  }
}

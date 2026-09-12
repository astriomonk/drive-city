import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const $ = s => document.querySelector(s);
const canvas = $('#game'), mphEl = $('#mph'), bar = $('#speedbar'), trafficEl = $('#traffic'), statusEl = $('#status');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd5f5);
scene.fog = new THREE.Fog(0x9fd5f5, 420, 1450);
const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, .1, 1900);
const clock = new THREE.Clock();

scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x35513e, 2.5));
const sun = new THREE.DirectionalLight(0xfff5df, 4.5);
sun.position.set(-300, 430, 220);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -650; sun.shadow.camera.right = 650;
sun.shadow.camera.top = 650; sun.shadow.camera.bottom = -650;
scene.add(sun);

const mat = (color, roughness=.55, metalness=.05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const roadMat = mat(0x202832, .72, .12);
const sidewalkMat = mat(0x70777d, .9, 0);
const grassMat = mat(0x426d45, 1, 0);
const laneMat = mat(0xf3e5a8, .8, .05);
const glassMat = mat(0x5aa8c9, .14, .62);
const darkMat = mat(0x090d12, .2, .75);
const chromeMat = mat(0xb8c1c7, .16, .9);
const whiteMat = mat(0xf6f7f2, .25, .15);
const redMat = mat(0xff172b, .2, .25);
const world = new THREE.Group();
scene.add(world);

const CITY = 7, BLOCK = 100, ROAD_W = 24, LIMIT = 770;
function box(w,h,d,m,x,y,z,parent=world){
  const q = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
  q.position.set(x,y,z); q.castShadow=true; q.receiveShadow=true; parent.add(q); return q;
}
function cyl(r,h,m,x,y,z,parent=world){
  const q = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),m);
  q.position.set(x,y,z); q.castShadow=true; q.receiveShadow=true; parent.add(q); return q;
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800,1800), grassMat);
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; world.add(ground);

// Roads, sidewalks and lane markings
for(let i=-CITY;i<=CITY;i++){
  box(ROAD_W,.18,1800,roadMat,i*BLOCK,.03,0);
  box(1800,.18,ROAD_W,roadMat,0,.04,i*BLOCK);
  box(ROAD_W+5,.12,1800,sidewalkMat,i*BLOCK,.13,0);
  box(1800,.12,ROAD_W+5,sidewalkMat,0,.14,i*BLOCK);
}
for(let i=-CITY;i<=CITY;i++){
  for(let p=-870;p<870;p+=18){
    box(.18,.035,8,laneMat,i*BLOCK,.145,p);
    box(8,.035,.18,laneMat,p,.155,i*BLOCK);
  }
}

// Random-but-repeatable city generation
let seed=731927;
const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
const buildingMats=[
  mat(0x283746,.5,.35),mat(0x3e5262,.46,.4),mat(0x536a78,.48,.35),
  mat(0x30333a,.55,.3),mat(0x697986,.5,.3),mat(0x244858,.42,.45)
];

function tree(x,z,s=1){
  cyl(1.05*s,5*s,mat(0x5b3c28,.95),x,2.5*s,z);
  const crown= new THREE.Mesh(new THREE.IcosahedronGeometry(4.5*s,1),mat(0x286441,.9));
  crown.position.set(x,7*s,z); crown.castShadow=true; world.add(crown);
}

for(let gx=-CITY;gx<CITY;gx++) for(let gz=-CITY;gz<CITY;gz++){
  const cx=gx*BLOCK+50, cz=gz*BLOCK+50;
  if(rnd()<.14){
    box(74,.16,74,grassMat,cx,.11,cz);
    for(let n=0;n<8;n++) tree(gx*BLOCK+12+rnd()*76,gz*BLOCK+12+rnd()*76,.7+rnd()*.45);
  } else {
    const count=2+Math.floor(rnd()*3);
    for(let n=0;n<count;n++){
      const w=16+rnd()*22,d=16+rnd()*22;
      const towerChance=rnd();
      const h=towerChance<.18 ? 150+rnd()*150 : 35+rnd()*105;
      const x=gx*BLOCK+12+rnd()*76,z=gz*BLOCK+12+rnd()*76;
      const bm=buildingMats[Math.floor(rnd()*buildingMats.length)];
      box(w,h,d,bm,x,h/2,z);
      // Glass facade strips make the skyline look much more detailed.
      if(rnd()<.8){
        const facade=mat(new THREE.Color().setHSL(.52+rnd()*.08,.35,.34+rnd()*.18),.2,.65);
        box(w*.76,.9,d*.06,facade,x,h*.62,z-d*.51);
        box(w*.76,.9,d*.06,facade,x,h*.78,z+d*.51);
      }
      // Rooftop mechanical details
      if(h>115){ box(w*.28,5,d*.28,darkMat,x,h+2.5,z); }
    }
  }
}

// Street furniture: sparse so startup stays fast.
const lampMat=mat(0x30353a,.35,.55), lightMat=mat(0xffefb0,.15,.2);
for(let i=-CITY;i<=CITY;i++) for(let p=-750;p<=750;p+=100){
  for(const side of [-1,1]){
    const x=i*BLOCK+side*18, z=p;
    cyl(.22,8,lampMat,x,4,z);
    box(1.2,.28,1.2,lightMat,x,8,z);
  }
}

// Traffic lights at intersections
function trafficLight(x,z,rot=0){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rot; world.add(g);
  box(.22,7,.22,lampMat,0,3.5,0,g);
  box(1.1,2.5,.3,darkMat,.55,6.2,0,g);
  [5.55,6.2,6.85].forEach((y,j)=>{const c=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),mat(j===0?0xff2020:j===1?0xffc928:0x36e879,.3));c.position.set(.55,y,.18);g.add(c);});
}
for(let i=-CITY;i<=CITY;i++) for(let j=-CITY;j<=CITY;j++){
  if((i+j)%2===0){ trafficLight(i*BLOCK+18,j*BLOCK+18,0); trafficLight(i*BLOCK-18,j*BLOCK-18,Math.PI); }
}

// Low, wide supercar with a random paint color each play.
function makeSupercar(color){
  const g=new THREE.Group();
  const body=mat(color,.18,.72), carbon=mat(0x080b0f,.2,.82);
  const blackGlass=mat(0x07131d,.08,.8);
  const wheelMat=mat(0x08090b,.28,.7);
  const tireMat=mat(0x070707,.82,.02);
  const headMat=mat(0xdff7ff,.08,.35);

  box(4.65,.72,9.6,body,0,1.28,0,g);
  box(4.05,.42,7.2,body,0,1.75,-.15,g);
  box(3.05,1.15,3.9,blackGlass,0,2.35,-.35,g);
  box(3.5,.18,7.7,carbon,0,1.72,.25,g);
  box(3.5,.18,2.5,carbon,0,2.92,-2.5,g);
  // Aggressive front splitter and rear wing
  box(5.1,.16,1.05,carbon,0,.9,4.75,g);
  box(5.2,.22,.45,carbon,0,2.95,-4.0,g);
  box(.22,1.2,.35,carbon,-2.0,3.05,-4.0,g); box(.22,1.2,.35,carbon,2.0,3.05,-4.0,g);
  // Wheels
  for(const x of [-2.35,2.35]) for(const z of [-3.05,3.05]){
    const w=new THREE.Mesh(new THREE.CylinderGeometry(.78,.78,.48,20),wheelMat);
    w.rotation.z=Math.PI/2; w.position.set(x,.72,z); w.castShadow=true; g.add(w);
    const t=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,.42,20),tireMat);
    t.rotation.z=Math.PI/2; t.position.set(x,.72,z); t.castShadow=true; g.add(t);
  }
  for(const x of [-1.35,1.35]){
    box(.72,.24,.16,headMat,x,1.55,4.82,g);
    box(.7,.2,.12,redMat,x,1.55,-4.82,g);
  }
  // Side intakes and exhausts
  box(.35,.5,1.8,carbon,-2.1,1.35,-.6,g); box(.35,.5,1.8,carbon,2.1,1.35,-.6,g);
  box(.5,.25,.18,chromeMat,-.8,1.18,-4.9,g); box(.5,.25,.18,chromeMat,.8,1.18,-4.9,g);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return g;
}

const player=makeSupercar(new THREE.Color().setHSL(rnd(),.86,.55));
scene.add(player);
let pos=new THREE.Vector3(), heading=0, speed=0;
const keys={};
addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyR'){pos.set(0,0,0);heading=0;speed=0;}});
addEventListener('keyup',e=>keys[e.code]=false);

// Faster, more convincing traffic.
const traffic=[], trafficColors=[0x1e73ff,0xff304f,0xffbf27,0x39d98a,0xa66cff,0xf2f5f7,0x22252b];
for(let i=0;i<30;i++){
  const horizontal=rnd()<.5, lane=(rnd()<.5?-5:5), r=(Math.floor(rnd()*(CITY*2+1))-CITY)*BLOCK;
  const c=makeSupercar(trafficColors[Math.floor(rnd()*trafficColors.length)]);
  const d=rnd()<.5?-1:1;
  if(horizontal)c.position.set(rnd()<.5?-760:760,0,r+lane); else c.position.set(r+lane,0,rnd()<.5?-760:760);
  scene.add(c); traffic.push({c,horizontal,lane,d,v:65+rnd()*90,stopped:false});
}

function trafficUpdate(dt){
  for(const t of traffic){
    const axis=t.horizontal?'x':'z';
    t.c.position[axis]+=t.d*t.v*dt;
    t.c.position.y=0;
    t.c.rotation.y=t.horizontal?(t.d>0?Math.PI/2:-Math.PI/2):(t.d>0?0:Math.PI);
    if(t.c.position[axis]>800)t.c.position[axis]=-800;
    if(t.c.position[axis]<-800)t.c.position[axis]=800;
  }
}

function update(dt){
  const forward=keys.KeyW||keys.ArrowUp;
  const reverse=keys.KeyS||keys.ArrowDown;
  const steer=(keys.KeyA||keys.ArrowLeft?-1:0)+(keys.KeyD||keys.ArrowRight?1:0);

  // Real gameplay speed: 500 MPH is now genuinely very fast on the road.
  if(forward) speed += (keys.Space?360:230)*dt;
  if(keys.Space && !forward) speed += 180*dt;
  if(reverse) speed -= 260*dt;
  speed *= Math.pow(.992,dt*60);
  speed=THREE.MathUtils.clamp(speed,-90,500);

  const mph=Math.abs(speed);
  const steerStrength=.9+Math.min(mph/150,2.8);
  heading -= steer*dt*steerStrength;
  // World movement is scaled so 200 MPH visibly flies by instead of crawling.
  const distancePerFrame = speed*dt*.62;
  pos.x += Math.sin(heading)*distancePerFrame;
  pos.z += Math.cos(heading)*distancePerFrame;
  pos.x=THREE.MathUtils.clamp(pos.x,-850,850); pos.z=THREE.MathUtils.clamp(pos.z,-850,850);
  player.position.set(pos.x,0,pos.z); player.rotation.y=heading;

  for(const t of traffic){
    if(player.position.distanceTo(t.c.position)<7){
      speed*=.45;
      const push=new THREE.Vector3().subVectors(player.position,t.c.position).normalize();
      pos.addScaledVector(push,.8);
    }
  }
}

function cameraUpdate(dt){
  const mph=Math.abs(speed);
  const desiredFov=68+Math.min(mph/12,28);
  camera.fov=THREE.MathUtils.lerp(camera.fov,desiredFov,1-Math.pow(.001,dt));
  camera.updateProjectionMatrix();
  const distance=15+Math.min(mph*.045,13);
  const height=6.5+Math.min(mph*.018,4);
  const target=new THREE.Vector3(-Math.sin(heading)*distance,height,-Math.cos(heading)*distance).add(player.position);
  camera.position.lerp(target,1-Math.pow(.0008,dt));
  camera.lookAt(pos.x+Math.sin(heading)*10,1.7,pos.z+Math.cos(heading)*10);
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.033);
  update(dt); trafficUpdate(dt); cameraUpdate(dt);
  const v=Math.round(Math.abs(speed));
  mphEl.innerHTML=v+' <small>MPH</small>';
  bar.style.width=Math.min(v/500*100,100)+'%';
  trafficEl.textContent='TRAFFIC: '+traffic.length;
  statusEl.textContent=v>=300?'DRIVE CITY · HYPER SPEED':v>=200?'DRIVE CITY · SUPER SPEED':'DRIVE CITY · LIVE';
  renderer.render(scene,camera);
}

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
animate();

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const $=s=>document.querySelector(s), canvas=$('#game'), mphEl=$('#mph'), bar=$('#speedbar'), trafficEl=$('#traffic'), statusEl=$('#status');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.35)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.3;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x071525); scene.fog=new THREE.Fog(0x071525,420,1500);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,1900), clock=new THREE.Clock();
scene.add(new THREE.HemisphereLight(0x9bc8ff,0x101820,2.2));
const sun=new THREE.DirectionalLight(0xfff2d6,4.2); sun.position.set(-300,450,220); sun.castShadow=true; sun.shadow.mapSize.set(1536,1536); sun.shadow.camera.left=-700; sun.shadow.camera.right=700; sun.shadow.camera.top=700; sun.shadow.camera.bottom=-700; scene.add(sun);
const moon=new THREE.DirectionalLight(0x477cff,.65); moon.position.set(300,180,-400); scene.add(moon);
const mat=(c,r=.55,m=.05,e=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,emissive:e});
const road=mat(0x171b22,.68,.25), asphalt2=mat(0x242a32,.75,.15), sidewalk=mat(0x646a70,.88), curb=mat(0x9a9da0,.7), grass=mat(0x183b2c,1), dark=mat(0x070a0e,.22,.85), chrome=mat(0xc7d1d8,.13,.95), glass=mat(0x071d2b,.07,.9), red=mat(0xff1638,.2,.35,0x220006), white=mat(0xdff8ff,.08,.3,0x75cfff);
const world=new THREE.Group(); scene.add(world); const CITY=7,BLOCK=100,LIMIT=850;
function box(w,h,d,m,x,y,z,p=world){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;p.add(q);return q}
function cyl(r,h,m,x,y,z,p=world){const q=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),m);q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;p.add(q);return q}
// Ground and roads
box(1800,.2,1800,grass,0,-.12,0);
for(let i=-CITY;i<=CITY;i++){
  box(30,.22,1800,curb,i*BLOCK,.02,0); box(1800,.22,30,curb,0,.02,i*BLOCK);
  box(24,.25,1800,road,i*BLOCK,.12,0); box(1800,.25,24,road,0,.13,i*BLOCK);
  box(2,.28,1800,asphalt2,i*BLOCK-11,.14,0); box(2,.28,1800,asphalt2,i*BLOCK+11,.14,0);
  box(1800,.28,2,asphalt2,0,.15,i*BLOCK-11); box(1800,.28,2,asphalt2,0,.15,i*BLOCK+11);
}
for(let i=-CITY;i<=CITY;i++)for(let p=-870;p<870;p+=20){box(.16,.035,8,mat(0xffe8a1,.7,.1),i*BLOCK,.29,p);box(8,.035,.16,mat(0xffe8a1,.7,.1),p,.30,i*BLOCK)}
let seed=483921;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
// Window texture: gives towers a much more finished look without external image assets.
function windowTexture(base='office'){
  const c=document.createElement('canvas');c.width=256;c.height=512;const x=c.getContext('2d');
  x.fillStyle=base==='warm'?'#252b34':'#182b3a';x.fillRect(0,0,256,512);
  for(let y=12;y<500;y+=24)for(let xx=10;xx<250;xx+=22){const on=rnd()>.28;x.fillStyle=on?(rnd()>.7?'#ffd98a':'#72b9df'):'#101a24';x.fillRect(xx,y,12,10)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const facadeMats=[0x263746,0x354a59,0x435b69,0x202c38,0x526775,0x1f4557];
for(let gx=-CITY;gx<CITY;gx++)for(let gz=-CITY;gz<CITY;gz++){
  const cx=gx*BLOCK+50,cz=gz*BLOCK+50;
  if(rnd()<.13){
    box(74,.12,74,mat(0x244f38,.98),cx,.06,cz);
    for(let n=0;n<9;n++){const x=gx*BLOCK+12+rnd()*76,z=gz*BLOCK+12+rnd()*76,s=.65+rnd()*.5;cyl(.8*s,4*s,mat(0x3b2920,.95),x,2*s,z);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(4*s,1),mat(0x1c613c,.9));crown.position.set(x,6*s,z);crown.castShadow=true;world.add(crown)}
  }else{
    for(let n=0;n<2+Math.floor(rnd()*3);n++){
      const w=15+rnd()*24,d=15+rnd()*24,tall=rnd(),h=tall<.22?170+rnd()*190:48+rnd()*115,x=gx*BLOCK+12+rnd()*76,z=gz*BLOCK+12+rnd()*76;
      const bm=mat(facadeMats[Math.floor(rnd()*facadeMats.length)],.42,.48);box(w,h,d,bm,x,h/2,z);
      // glowing window strips on several faces
      if(h>75){const wm=new THREE.MeshStandardMaterial({map:windowTexture(rnd()>.5?'warm':'cool'),roughness:.3,metalness:.35,emissive:0x22313a,emissiveIntensity:.32});wm.map.wrapS=wm.map.wrapT=THREE.RepeatWrapping;box(w*.82,h*.72,.08,wm,x,h*.54,z-d/2-.05);}
      if(h>140){box(w*.3,5,d*.3,dark,x,h+2.5,z);box(w*.7,.25,.8,mat(0x7cc7ff,.2,.7,0x163a55),x,h*.82,z-d/2-.08)}
      // rooftop HVAC
      if(rnd()<.65)for(let k=0;k<2;k++)box(2+rnd()*3,2,2+rnd()*3,dark,x-w*.25+k*w*.5,h+1,z);
    }
  }
}
// Neon signs and billboards
function sign(text,color,x,y,z,rot=0){const c=document.createElement('canvas');c.width=512;c.height=128;const q=c.getContext('2d');q.fillStyle='#070b12';q.fillRect(0,0,512,128);q.font='bold 52px Arial';q.textAlign='center';q.textBaseline='middle';q.shadowBlur=22;q.shadowColor=color;q.fillStyle=color;q.fillText(text,256,66);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));s.scale.set(15,3.75,1);s.position.set(x,y,z);s.rotation.y=rot;world.add(s)}
const neon=['NOVA','VELOCITY','CITY 24','MIDNIGHT','VOLT','APEX','DRIVE','NIGHTLINE'];
for(let i=0;i<34;i++){const horizontal=rnd()<.5,x=(Math.floor(rnd()*(CITY*2))-CITY)*BLOCK+(rnd()>.5?14:-14),z=(Math.floor(rnd()*(CITY*2))-CITY)*BLOCK+(rnd()>.5?14:-14);sign(neon[Math.floor(rnd()*neon.length)],rnd()>.5?'#ff3d81':'#42d9ff',horizontal?x:(Math.floor(rnd()*(CITY*2))-CITY)*BLOCK+28,18+rnd()*28,horizontal?z:(Math.floor(rnd()*(CITY*2))-CITY)*BLOCK+28,horizontal?0:Math.PI/2)}
// Street lamps
const lamp=mat(0x22272c,.35,.7), glow=mat(0xffdf9b,.12,.2,0x9b5d18);for(let i=-CITY;i<=CITY;i++)for(let p=-750;p<=750;p+=100)for(const side of[-1,1]){const x=i*BLOCK+side*18,z=p;cyl(.18,8,lamp,x,4,z);box(1.1,.25,1.1,glow,x,8,z)}
// Traffic lights with actual signal state
const signals=[];function signal(x,z,axis){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);box(.24,7,.24,lamp,0,3.5,0,g);box(1.1,2.6,.34,dark,.55,6.2,0,g);const lights=[0xff233d,0xffc82e,0x35ed79].map(c=>{const m=mat(c,.25,.1,0x000000);const q=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8),m);g.add(q);return {q,m}});lights.forEach((a,i)=>a.q.position.set(.55,5.55+i*.65,.19));signals.push({lights,t:Math.random()*7});}
for(let i=-CITY;i<=CITY;i+=1)for(let j=-CITY;j<=CITY;j+=1)if((i+j)%2===0){signal(i*BLOCK+17,j*BLOCK-17,'x');signal(i*BLOCK-17,j*BLOCK+17,'z')}
function updateSignals(dt){for(const s of signals){s.t=(s.t+dt)%12;const phase=s.t<5?2:s.t<6?1:0;s.lights.forEach((a,i)=>a.m.emissive=new THREE.Color(i===phase?[0xff233d,0xffc82e,0x35ed79][i]:0x000000));}}
// Supercar
function makeSupercar(color){const g=new THREE.Group(),body=mat(color,.14,.82),carbon=mat(0x05070a,.17,.9),tire=mat(0x050505,.82,.02),rim=mat(0x8f9ba5,.16,.95),blue=mat(0x06243a,.05,.9),light=mat(0xd8f6ff,.08,.3,0x6bbfff),tail=mat(0xff1534,.15,.3,0x66000a);
  box(4.7,.7,9.7,body,0,1.2,0,g);box(4.25,.3,7.8,body,0,1.65,.1,g);box(3.05,1.05,4.0,blue,0,2.28,-.25,g);box(4.9,.14,1.05,carbon,0,.86,4.7,g);box(5.25,.2,.4,carbon,0,2.9,-4.15,g);box(.2,1.2,.35,carbon,-2.0,3.05,-4.15,g);box(.2,1.2,.35,carbon,2.0,3.05,-4.15,g);
  for(const x of[-2.35,2.35])for(const z of[-3.05,3.05]){const a=new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.48,20),tire);a.rotation.z=Math.PI/2;a.position.set(x,.68,z);g.add(a);const r=new THREE.Mesh(new THREE.CylinderGeometry(.57,.57,.5,20),rim);r.rotation.z=Math.PI/2;r.position.set(x,.68,z);g.add(r)}
  for(const x of[-1.35,1.35]){box(.78,.2,.14,light,x,1.48,4.86,g);box(.75,.18,.12,tail,x,1.5,-4.88,g)}
  box(.38,.5,1.8,carbon,-2.1,1.32,-.65,g);box(.38,.5,1.8,carbon,2.1,1.32,-.65,g);box(.5,.23,.18,chrome,-.8,1.15,-4.95,g);box(.5,.23,.18,chrome,.8,1.15,-4.95,g);g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g}
const player=makeSupercar(new THREE.Color().setHSL(rnd(),.86,.55));scene.add(player);let pos=new THREE.Vector3(),heading=0,speed=0;const keys={};
addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyR'){pos.set(0,0,0);heading=0;speed=0}});addEventListener('keyup',e=>keys[e.code]=false);
// Traffic
const traffic=[],colors=[0x1976ff,0xff3150,0xffbe32,0x30d48b,0xa66bff,0xeef3f6,0x232832];for(let i=0;i<30;i++){const h=rnd()<.5,l=rnd()<.5?-5:5,r=(Math.floor(rnd()*(CITY*2+1))-CITY)*BLOCK,c=makeSupercar(colors[Math.floor(rnd()*colors.length)]),d=rnd()<.5?-1:1;if(h)c.position.set(rnd()<.5?-780:780,0,r+l);else c.position.set(r+l,0,rnd()<.5?-780:780);scene.add(c);traffic.push({c,h,d,v:75+rnd()*115})}
function trafficUpdate(dt){for(const t of traffic){const axis=t.h?'x':'z';t.c.position[axis]+=t.d*t.v*dt;t.c.position.y=0;t.c.rotation.y=t.h?(t.d>0?Math.PI/2:-Math.PI/2):(t.d>0?0:Math.PI);if(t.c.position[axis]>880)t.c.position[axis]=-880;if(t.c.position[axis]<-880)t.c.position[axis]=880}}
function update(dt){const f=keys.KeyW||keys.ArrowUp,b=keys.KeyS||keys.ArrowDown,steer=(keys.KeyA||keys.ArrowLeft?-1:0)+(keys.KeyD||keys.ArrowRight?1:0);if(f)speed+=(keys.Space?520:310)*dt;if(keys.Space&&!f)speed+=260*dt;if(b)speed-=300*dt;speed*=Math.pow(.993,dt*60);speed=THREE.MathUtils.clamp(speed,-110,500);const mph=Math.abs(speed);heading-=steer*dt*(.85+Math.min(mph/100,3.8));const dist=speed*dt*.72;pos.x+=Math.sin(heading)*dist;pos.z+=Math.cos(heading)*dist;pos.x=THREE.MathUtils.clamp(pos.x,-880,880);pos.z=THREE.MathUtils.clamp(pos.z,-880,880);player.position.set(pos.x,0,pos.z);player.rotation.y=heading;for(const t of traffic)if(player.position.distanceTo(t.c.position)<7){speed*=.42;const push=new THREE.Vector3().subVectors(player.position,t.c.position).normalize();pos.addScaledVector(push,1.2)}}
function cameraUpdate(dt){const mph=Math.abs(speed),fov=70+Math.min(mph/10,34);camera.fov=THREE.MathUtils.lerp(camera.fov,fov,1-Math.pow(.001,dt));camera.updateProjectionMatrix();const dist=16+Math.min(mph*.055,18),height=6.8+Math.min(mph*.02,5);const target=new THREE.Vector3(-Math.sin(heading)*dist,height,-Math.cos(heading)*dist).add(player.position);camera.position.lerp(target,1-Math.pow(.0007,dt));camera.lookAt(pos.x+Math.sin(heading)*13,1.5,pos.z+Math.cos(heading)*13)}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.033);update(dt);trafficUpdate(dt);updateSignals(dt);cameraUpdate(dt);const v=Math.round(Math.abs(speed));mphEl.innerHTML=v+' <small>MPH</small>';bar.style.width=Math.min(v/500*100,100)+'%';trafficEl.textContent='TRAFFIC: '+traffic.length;statusEl.textContent=v>=350?'DRIVE CITY · HYPER SPEED':v>=200?'DRIVE CITY · SUPER SPEED':'DRIVE CITY · LIVE';renderer.render(scene,camera)}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});animate();
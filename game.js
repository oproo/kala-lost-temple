const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

const IDLE_FRAMES=[
  'assets/characters/kala/idle/KALA_idle_01.png',
  'assets/characters/kala/idle/KALA_idle_02.png',
  'assets/characters/kala/idle/KALA_idle_03.png',
  'assets/characters/kala/idle/KALA_idle_04.png',
  'assets/characters/kala/idle/KALA_idle_05.png'
];
const WALK_FRAMES=[
  'assets/characters/kala/walk/KALA_walk_01.png',
  'assets/characters/kala/walk/KALA_walk_02.png',
  'assets/characters/kala/walk/KALA_walk_03.png',
  'assets/characters/kala/walk/KALA_walk_04.png',
  'assets/characters/kala/walk/KALA_walk_05.png',
  'assets/characters/kala/walk/KALA_walk_06.png',
  'assets/characters/kala/walk/KALA_walk_07.png',
  'assets/characters/kala/walk/KALA_walk_08.png',
  'assets/characters/kala/walk/KALA_walk_09.png',
  'assets/characters/kala/walk/KALA_walk_10.png',
  'assets/characters/kala/walk/KALA_walk_11.png',
  'assets/characters/kala/walk/KALA_walk_12.png'
];

const player={x:160,y:0,speed:260,attack:0,dash:0,facing:'right'};
let assetsReady=false;
const keys={left:false,right:false};
let W=0,H=0,dpr=1,last=performance.now();
let animTime=0;

const idleImages=IDLE_FRAMES.map(src=>{const i=new Image();i.src=src;return i});
const walkImages=WALK_FRAMES.map(src=>{const i=new Image();i.src=src;return i});
[...idleImages,...walkImages].forEach(img=>img.addEventListener('load',()=>{assetsReady=true}));

function resize(){
  dpr=Math.min(window.devicePixelRatio||1,2);
  W=window.innerWidth; H=window.innerHeight;
  canvas.width=Math.floor(W*dpr); canvas.height=Math.floor(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  player.y=Math.max(140,H-120);
  player.x=Math.max(40,Math.min(W-40,player.x));
}
function setHeld(el,key){
  const on=e=>{e.preventDefault();keys[key]=true};
  const off=e=>{e.preventDefault();keys[key]=false};
  ['pointerdown','touchstart'].forEach(t=>el.addEventListener(t,on,{passive:false}));
  ['pointerup','pointercancel','pointerleave','touchend'].forEach(t=>el.addEventListener(t,off,{passive:false}));
}
setHeld(document.getElementById('leftBtn'),'left');
setHeld(document.getElementById('rightBtn'),'right');
document.getElementById('attackBtn').addEventListener('pointerdown',e=>{e.preventDefault();player.attack=.18});
document.getElementById('dashBtn').addEventListener('pointerdown',e=>{e.preventDefault();player.dash=.22});
document.getElementById('interactBtn').addEventListener('pointerdown',e=>{e.preventDefault();document.getElementById('message').textContent='Interact button works'});

window.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a'){keys.left=true;player.facing='left'}
  if(e.key==='ArrowRight'||e.key.toLowerCase()==='d'){keys.right=true;player.facing='right'}
  if(e.code==='Space')player.attack=.18;
  if(e.key==='Shift')player.dash=.22
});
window.addEventListener('keyup',e=>{
  if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')keys.left=false;
  if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')keys.right=false
});
window.addEventListener('resize',resize);

function update(dt){
  const dir=(keys.right?1:0)-(keys.left?1:0);
  const speed=player.dash>0?620:player.speed;
  player.x=Math.max(40,Math.min(W-40,player.x+dir*speed*dt));
  player.attack=Math.max(0,player.attack-dt);
  player.dash=Math.max(0,player.dash-dt);
  animTime+=dt;
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#07110b';
  ctx.fillRect(0,0,W,H);

  ctx.strokeStyle='rgba(255,255,255,.12)';
  ctx.beginPath();
  ctx.moveTo(0,player.y+32);
  ctx.lineTo(W,player.y+32);
  ctx.stroke();

  const moving=keys.left||keys.right;
  const frames=moving?walkImages:idleImages;
  const fps=moving?10:6;
  const frame=Math.floor(animTime*fps)%frames.length;
  const img=frames[frame];

  if(img.complete&&img.naturalWidth){
    const targetH=116;
    const ratio=img.naturalWidth/img.naturalHeight;
    const targetW=targetH*ratio;

    ctx.save();
    ctx.translate(player.x,player.y-targetH);

    if(player.facing==='left'){
      ctx.scale(-1,1);
    }

    ctx.drawImage(img,-targetW/2,0,targetW,targetH);
    ctx.restore();
  }else{
    // Keep KĀLA visibly on-screen while image assets finish loading.
    ctx.save();
    ctx.translate(player.x,player.y-64);
    if(player.facing==='right') ctx.scale(-1,1);
    ctx.fillStyle='#d8a33b';
    ctx.beginPath();
    ctx.arc(0,18,18,0,Math.PI*2);
    ctx.fill();
    ctx.fillRect(-14,38,28,28);
    ctx.restore();
  }

  if(player.attack>0){
    ctx.strokeStyle='#f4d27a';
    ctx.lineWidth=7;
    ctx.beginPath();
    ctx.arc(player.x+28,player.y,28,-.8,.8);
    ctx.stroke();
  }
}

function loop(now){const dt=Math.min((now-last)/1000,.033);last=now;update(dt);draw();requestAnimationFrame(loop)}
resize();requestAnimationFrame(loop);
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const player={x:160,y:0,speed:260,attack:0,dash:0};
const keys={left:false,right:false};
let W=0,H=0,dpr=1,last=performance.now();

function resize(){
  dpr=Math.min(window.devicePixelRatio||1,2);
  W=window.innerWidth; H=window.innerHeight;
  canvas.width=Math.floor(W*dpr); canvas.height=Math.floor(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  player.y=H-120;
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
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')keys.left=true;if(e.key==='ArrowRight'||e.key==='d')keys.right=true;if(e.code==='Space')player.attack=.18;if(e.key==='Shift')player.dash=.22});
window.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='a')keys.left=false;if(e.key==='ArrowRight'||e.key==='d')keys.right=false});
window.addEventListener('resize',resize);

function update(dt){
  const dir=(keys.right?1:0)-(keys.left?1:0);
  const speed=player.dash>0?620:player.speed;
  player.x=Math.max(40,Math.min(W-40,player.x+dir*speed*dt));
  player.attack=Math.max(0,player.attack-dt); player.dash=Math.max(0,player.dash-dt);
}
function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#07110b';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(0,player.y+32);ctx.lineTo(W,player.y+32);ctx.stroke();
  ctx.fillStyle='#d8a33b';ctx.beginPath();ctx.arc(player.x,player.y,22,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(player.x-7,player.y-5,3,0,Math.PI*2);ctx.arc(player.x+7,player.y-5,3,0,Math.PI*2);ctx.fill();
  if(player.attack>0){ctx.strokeStyle='#f4d27a';ctx.lineWidth=7;ctx.beginPath();ctx.arc(player.x+28,player.y,28,-.8,.8);ctx.stroke()}
  ctx.fillStyle='#fff';ctx.font='14px Arial';ctx.textAlign='center';ctx.fillText('KĀLA',player.x,player.y+42);
}
function loop(now){const dt=Math.min((now-last)/1000,.033);last=now;update(dt);draw();requestAnimationFrame(loop)}
resize();requestAnimationFrame(loop);
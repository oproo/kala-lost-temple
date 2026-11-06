(() => {
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const playNow = document.getElementById('playNow');
const hud = document.getElementById('hud');
const stats = document.getElementById('stats');
const objective = document.getElementById('objective');
const message = document.getElementById('message');

let W = 0, H = 0, DPR = 1, running = false, paused = false, last = 0, elapsed = 0;
let score = 0, relicCount = 0, shake = 0, won = false;
const keys = Object.create(null);

const player = {x:120,y:0,r:15,hp:100,maxHp:100,dx:1,dy:0,attack:0,inv:0,dash:0};
const relics = [
  {x:360,y:210,taken:false},
  {x:570,y:440,taken:false},
  {x:800,y:260,taken:false}
];
const enemies = [];

function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.floor(W*DPR);
  canvas.height = Math.floor(H*DPR);
  canvas.style.width = W+'px';
  canvas.style.height = H+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resize, {passive:true});
resize();

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function distance(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by);}
function spawnEnemy(x,y,type){
  enemies.push({
    x,y,type,
    r:type==='guardian'?25:13,
    hp:type==='guardian'?180:30,
    max:type==='guardian'?180:30,
    speed:type==='guardian'?42:55,
    cooldown:0
  });
}
function resetGame(){
  elapsed=0;score=0;relicCount=0;shake=0;won=false;paused=false;
  player.x=120;player.y=H/2;player.hp=100;player.dx=1;player.dy=0;player.attack=0;player.inv=0;player.dash=0;
  relics.forEach(r=>r.taken=false);
  enemies.length=0;
  spawnEnemy(390,230,'serpent');
  spawnEnemy(520,450,'serpent');
  spawnEnemy(650,250,'yaksha');
  spawnEnemy(760,460,'serpent');
  spawnEnemy(900,300,'yaksha');
  updateHUD();
}
function startGame(){
  resetGame();
  running=true;
  menu.style.display='none';
  hud.style.display='block';
  message.textContent='Find the 3 sacred relics';
  canvas.focus();
}
playNow.addEventListener('click', startGame);

window.addEventListener('keydown', e=>{
  const k=e.key.toLowerCase();
  keys[k]=true;
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
  if(k===' ') attack();
  if(k==='shift') dash();
  if(k==='e') interact();
  if(k==='escape' && running && !won && player.hp>0) paused=!paused;
  if(k==='r' && running && player.hp<=0) startGame();
});
window.addEventListener('keyup', e=>keys[e.key.toLowerCase()]=false);

document.querySelectorAll('[data-key]').forEach(btn=>{
  const key=btn.dataset.key;
  const down=e=>{e.preventDefault();keys[key]=true;};
  const up=e=>{e.preventDefault();keys[key]=false;};
  btn.addEventListener('pointerdown',down);
  btn.addEventListener('pointerup',up);
  btn.addEventListener('pointercancel',up);
  btn.addEventListener('pointerleave',up);
});
document.querySelector('[data-action="attack"]').addEventListener('pointerdown',e=>{e.preventDefault();attack();});
document.querySelector('[data-action="dash"]').addEventListener('pointerdown',e=>{e.preventDefault();dash();});
document.querySelector('[data-action="interact"]').addEventListener('pointerdown',e=>{e.preventDefault();interact();});

function attack(){
  if(!running||paused||won||player.hp<=0||player.attack>0)return;
  player.attack=.2;
  for(const e of enemies){
    if(e.hp<=0)continue;
    const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;
    if(d<64 && (dx*player.dx+dy*player.dy)/d>.1){
      e.hp-=40;score+=10;shake=3;
    }
  }
}
function dash(){
  if(!running||paused||won||player.hp<=0||player.dash>0)return;
  player.dash=.55;player.inv=.2;
  player.x=clamp(player.x+player.dx*95,25,W-25);
  player.y=clamp(player.y+player.dy*95,25,H-25);
}
function interact(){
  if(!running||paused||won||player.hp<=0)return;
  if(relicCount<3)return;
  const templeX=W-140, templeY=H/2;
  if(distance(player.x,player.y,templeX,templeY)<150){
    if(!enemies.some(e=>e.type==='guardian'&&e.hp>0)){
      spawnEnemy(templeX,templeY,'guardian');
      message.textContent='Defeat the Temple Guardian!';
    }
  }
}
function update(dt){
  if(!running||paused||won||player.hp<=0)return;
  elapsed+=dt;
  player.attack=Math.max(0,player.attack-dt);
  player.inv=Math.max(0,player.inv-dt);
  player.dash=Math.max(0,player.dash-dt);

  let mx=0,my=0;
  if(keys.w||keys.arrowup)my--;
  if(keys.s||keys.arrowdown)my++;
  if(keys.a||keys.arrowleft)mx--;
  if(keys.d||keys.arrowright)mx++;
  if(mx||my){
    const len=Math.hypot(mx,my);mx/=len;my/=len;
    player.x+=mx*180*dt;player.y+=my*180*dt;
    player.dx=mx;player.dy=my;
  }
  player.x=clamp(player.x,25,W-25);
  player.y=clamp(player.y,25,H-25);

  for(const r of relics){
    if(!r.taken && distance(player.x,player.y,r.x,r.y)<28){
      r.taken=true;relicCount++;score+=100;
    }
  }
  if(relicCount===3) objective.textContent='Go to the temple • Press E';

  for(const e of enemies){
    if(e.hp<=0)continue;
    e.cooldown=Math.max(0,e.cooldown-dt);
    const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;
    if(e.type!=='guardian'||relicCount>=3){
      if(d>42){e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt;}
      if(d<42&&e.cooldown<=0&&player.inv<=0){
        player.hp-=e.type==='guardian'?15:7;
        player.inv=.35;e.cooldown=.8;shake=6;
      }
    }
  }

  const guardian=enemies.find(e=>e.type==='guardian');
  if(guardian && guardian.hp<=0){
    score+=1000;won=true;
    message.textContent='VICTORY! The Lost Temple is yours.';
  }
  shake=Math.max(0,shake-dt*12);
  updateHUD();
}
function updateHUD(){
  stats.textContent=`Relics: ${relicCount}/3 · Score: ${score} · HP: ${Math.max(0,player.hp)}`;
  if(relicCount<3)objective.textContent='Find the 3 sacred relics';
}
function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#12351f';ctx.fillRect(0,0,W,H);

  for(let i=0;i<45;i++){
    const x=(i*97)%W,y=(i*137)%H;
    ctx.fillStyle=i%2?'#174526':'#1e4d2c';
    ctx.beginPath();ctx.arc(x,y,18+(i%4)*6,0,Math.PI*2);ctx.fill();
  }

  ctx.fillStyle='#624b2d';ctx.fillRect(150,H/2-32,Math.max(100,W-300),64);
  ctx.fillStyle='#7b512d';ctx.fillRect(55,H/2-95,190,190);

  const tx=W-220,ty=H/2-90;
  ctx.fillStyle='#9a8150';ctx.fillRect(tx,ty,160,180);
  ctx.fillStyle='#3a2d20';ctx.fillRect(tx+55,ty+70,50,110);
  ctx.fillStyle='#d9bc69';
  ctx.beginPath();ctx.moveTo(tx-10,ty+20);ctx.lineTo(tx+80,ty-38);ctx.lineTo(tx+170,ty+20);ctx.closePath();ctx.fill();
  ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText('LOST TEMPLE',tx+80,ty+165);

  for(const r of relics){
    if(r.taken)continue;
    ctx.save();ctx.translate(r.x,r.y);ctx.rotate(elapsed*2);
    ctx.fillStyle='#e7c55d';
    ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(9,0);ctx.lineTo(0,12);ctx.lineTo(-9,0);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  for(const e of enemies){
    if(e.hp<=0)continue;
    ctx.fillStyle=e.type==='guardian'?'#66775a':e.type==='yaksha'?'#9b4434':'#aaa94f';
    ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#21140e';
    ctx.beginPath();ctx.arc(e.x-5,e.y-3,2.5,0,Math.PI*2);ctx.arc(e.x+5,e.y-3,2.5,0,Math.PI*2);ctx.fill();
    const bw=e.r*2.3;
    ctx.fillStyle='#27140f';ctx.fillRect(e.x-bw/2,e.y-e.r-10,bw,4);
    ctx.fillStyle='#bb4d3f';ctx.fillRect(e.x-bw/2,e.y-e.r-10,bw*(e.hp/e.max),4);
  }

  ctx.save();
  if(player.inv>0)ctx.globalAlpha=.5;
  ctx.fillStyle='#c78d57';ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#29452f';ctx.fillRect(player.x-12,player.y+3,24,18);
  ctx.strokeStyle='#e2c478';ctx.lineWidth=5;
  ctx.beginPath();
  ctx.moveTo(player.x+player.dx*8,player.y+player.dy*8);
  ctx.lineTo(player.x+player.dx*38-player.dy*5,player.y+player.dy*38+player.dx*5);
  ctx.stroke();
  ctx.restore();

  if(player.hp<=0)overlay('YOU FELL','Press R to restart');
  else if(won)overlay('VICTORY','The Temple Guardian has fallen.');
  else if(paused)overlay('PAUSED','Press ESC to continue');
}
function overlay(title,sub){
  ctx.fillStyle='rgba(0,0,0,.68)';ctx.fillRect(0,0,W,H);
  ctx.textAlign='center';ctx.fillStyle='#e3bd61';ctx.font='bold 48px Georgia';ctx.fillText(title,W/2,H/2-20);
  ctx.fillStyle='#fff';ctx.font='15px Arial';ctx.fillText(sub,W/2,H/2+15);
}
function loop(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  update(dt);
  ctx.save();
  if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  draw();
  ctx.restore();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})();
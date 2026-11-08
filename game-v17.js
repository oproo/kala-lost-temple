const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

const IDLE_FRAMES=[
  'assets/characters/kala/idle/KALA_idle_01.png',
  'assets/characters/kala/idle/KALA_idle_02.png',
  'assets/characters/kala/idle/KALA_idle_03.png',
  'assets/characters/kala/idle/KALA_idle_04.png',
  'assets/characters/kala/idle/KALA_idle_05.png'
];
const ATTACK_FRAMES=[
  'assets/characters/kala/attack/KALA_attack_0.png',
  'assets/characters/kala/attack/KALA_attack_1.png',
  'assets/characters/kala/attack/KALA_attack_2.png',
  'assets/characters/kala/attack/KALA_attack_3.png',
  'assets/characters/kala/attack/KALA_attack_4.png',
  'assets/characters/kala/attack/KALA_attack_5.png',
  'assets/characters/kala/attack/KALA_attack_6.png',
  'assets/characters/kala/attack/KALA_attack_7.png',
  'assets/characters/kala/attack/KALA_attack_8.png',
  'assets/characters/kala/attack/KALA_attack_9.png'
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
const JUMP_FRAMES=[
  'assets/characters/kala/jump/KALA_jump_02.png',
  'assets/characters/kala/jump/KALA_jump_03.png',
  'assets/characters/kala/jump/KALA_jump_04.png',
  'assets/characters/kala/jump/KALA_jump_05.png',
  'assets/characters/kala/jump/KALA_jump_06.png',
  'assets/characters/kala/jump/KALA_jump_07.png',
  'assets/characters/kala/jump/KALA_jump_08.png',
  'assets/characters/kala/jump/KALA_jump_09.png',
  'assets/characters/kala/jump/KALA_jump_10.png'
];
const BOAR_FRAMES=[
  'assets/enemies/wild-boar/WILD_BOAR_ATTACK_01.png',
  'assets/enemies/wild-boar/WILD_BOAR_ATTACK_02.png',
  'assets/enemies/wild-boar/WILD_BOAR_ATTACK_03.png',
  'assets/enemies/wild-boar/WILD_BOAR_ATTACK_04.png',
  'assets/enemies/wild-boar/WILD_BOAR_ATTACK_05.png',
  'assets/enemies/wild-boar/WILD_BOAR_ATTACK_06.png',
  'assets/enemies/wild-boar/WILD_BOAR_ATTACK_07.png',
  'assets/enemies/wild-boar/WILD_BOAR_ATTACK_08.png',
  'assets/enemies/wild-boar/WILD_BOAR_ATTACK_09.png',
  'assets/enemies/wild-boar/WILD_BOAR_ATTACK_10.png'
];

const player={x:160,y:0,speed:260,attack:0,attackTime:0,dash:0,facing:'right',hp:3,hitCooldown:0,jumpY:0,vy:0,onGround:true,jumpPhase:'ground',jumpTimer:0,airTime:0};
const boars=Array.from({length:5},(_,i)=>({x:0,y:0,speed:105+i*8,animTime:0,attackCooldown:0,maxHp:3+i,hp:3+i,active:false,index:i}));
let currentBoar=0;
const relics=[{x:120,collected:false},{x:300,collected:false},{x:480,collected:false}];
let relicCount=0;
let giantBoar={active:false,x:0,y:0,hp:15,maxHp:15,animTime:0,attackCooldown:0};
let levelComplete=false;
const keys={left:false,right:false};
let W=0,H=0,dpr=1,last=performance.now(),animTime=0,gameStarted=false;

const idleImages=IDLE_FRAMES.map(src=>{const i=new Image();i.src=src;return i});
const walkImages=WALK_FRAMES.map(src=>{const i=new Image();i.src=src;return i});
const attackImages=ATTACK_FRAMES.map(src=>{const i=new Image();i.src=src;return i});
const jumpImages=JUMP_FRAMES.map(src=>{const i=new Image();i.src=src;return i});
const boarImages=BOAR_FRAMES.map(src=>{const i=new Image();i.src=src;return i});
const BLUE_RELIC_FRAMES=[
  'assets/relics/blue/blue_relic_spin_01.png',
  'assets/relics/blue/blue_relic_spin_02.png',
  'assets/relics/blue/blue_relic_spin_03.png',
  'assets/relics/blue/blue_relic_spin_04.png',
  'assets/relics/blue/blue_relic_spin_05.png'
];
const blueRelicImages=BLUE_RELIC_FRAMES.map(src=>{const i=new Image();i.src=src;return i});
[...idleImages,...walkImages,...attackImages,...jumpImages,...boarImages,...blueRelicImages].forEach(img=>img.addEventListener('load',()=>{}));

function resize(){
  dpr=Math.min(window.devicePixelRatio||1,2);
  W=window.innerWidth; H=window.innerHeight;
  canvas.width=Math.floor(W*dpr); canvas.height=Math.floor(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  player.y=Math.max(140,H-120)+50;
  player.x=Math.max(40,Math.min(W-40,player.x));
  relics[0].x=Math.max(120,W*.25);
  relics[1].x=Math.max(240,W*.5);
  relics[2].x=Math.max(360,W*.75);
  boars.forEach(b=>b.y=player.y);
  if(!boars[currentBoar].active && currentBoar<5) spawnNextBoar();

}

function spawnNextBoar(){
  if(currentBoar>=5)return;
  const b=boars[currentBoar];
  b.active=true;b.hp=b.maxHp;b.attackCooldown=0;b.animTime=0;
  b.y=player.y;
  b.x=Math.min(W-80,Math.max(player.x+280,W-120));
  if(b.x<player.x+180)b.x=W-80;
  document.getElementById('message').textContent='WILD BOAR '+(currentBoar+1)+' OF 5';
}
function allBoarsDefeated(){return currentBoar>=5;}
function canAwaken(){return allBoarsDefeated()&&relicCount===3&&!giantBoar.active&&!levelComplete;}

function setHeld(el,key){
  const on=e=>{
    e.preventDefault();
    keys[key]=true;
    if(key==='left') player.facing='left';
    if(key==='right') player.facing='right';
  };
  const off=e=>{e.preventDefault();keys[key]=false};
  ['pointerdown','touchstart'].forEach(t=>el.addEventListener(t,on,{passive:false}));
  ['pointerup','pointercancel','pointerleave','touchend'].forEach(t=>el.addEventListener(t,off,{passive:false}));
}
setHeld(document.getElementById('leftBtn'),'left');
setHeld(document.getElementById('rightBtn'),'right');

function jump(){
  if(player.onGround){
    player.jumpPhase='crouch';
    player.jumpTimer=0;
    player.vy=0;
    player.onGround=false;
  }
}

function triggerAttack(e){
  if(e)e.preventDefault();
  if(player.attack<=0){
    player.attack=.9;
    player.attackTime=0;
  }
}
document.getElementById('attackBtn').addEventListener('pointerdown',triggerAttack);
document.getElementById('jumpBtn').addEventListener('pointerdown',e=>{e.preventDefault();jump()});
document.getElementById('dashBtn').addEventListener('pointerdown',e=>{e.preventDefault();player.dash=.22});
function tryAwaken(){
  if(canAwaken()){
    giantBoar.active=true;
    giantBoar.x=Math.min(W-100,player.x+260);
    giantBoar.y=player.y;
    giantBoar.hp=giantBoar.maxHp;
    giantBoar.animTime=0;
    document.getElementById('message').textContent='THE GIANT BOAR AWAKENS!';
  }
}
document.getElementById('interactBtn').addEventListener('pointerdown',e=>{e.preventDefault();tryAwaken()});

window.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a'){keys.left=true;player.facing='left'}
  if(e.key==='ArrowRight'||e.key.toLowerCase()==='d'){keys.right=true;player.facing='right'}
  if((e.key==='ArrowUp'||e.key.toLowerCase()==='w')&&!e.repeat)jump();
  if(e.code==='Space'&&!e.repeat)triggerAttack(e);
  if(e.key==='Shift')player.dash=.22;
  if(e.key.toLowerCase()==='e')tryAwaken();
});
window.addEventListener('keyup',e=>{
  if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')keys.left=false;
  if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')keys.right=false;
});
window.addEventListener('resize',resize);

function hitBoar(){
  if(player.attack<=0)return;
  const attackFrame=Math.floor(player.attackTime*11);
  if(attackFrame<4||attackFrame>8)return;
  if(giantBoar.active){
    if(Math.abs(giantBoar.x-player.x)<115){
      giantBoar.hp=Math.max(0,giantBoar.hp-1);
      player.attack=-0.08;
      if(giantBoar.hp<=0){giantBoar.active=false;levelComplete=true;document.getElementById('message').textContent='GIANT BOAR DEFEATED • LEVEL COMPLETE!';}
    }
    return;
  }
  const b=boars[currentBoar];
  if(!b||!b.active||b.hp<=0)return;
  if(Math.abs(b.x-player.x)<95){
    b.hp=Math.max(0,b.hp-1);
    player.attack=-0.08;
    if(b.hp<=0){
      b.active=false;
      currentBoar++;
      if(currentBoar>=5){
        document.getElementById('message').textContent=relicCount===3?'PRESS E TO AWAKEN THE GIANT BOAR':'5 BOARS DEFEATED • FIND 3 RELICS';
      }else{
        document.getElementById('message').textContent='WILD BOAR DEFEATED';
        setTimeout(()=>spawnNextBoar(),700);
      }
    }
  }
}

function update(dt){
  const dir=(keys.right?1:0)-(keys.left?1:0);
  const speed=player.dash>0?620:player.speed;
  player.x=Math.max(40,Math.min(W-40,player.x+dir*speed*dt));

  if(player.jumpPhase==='crouch'){
    player.jumpTimer+=dt;
    if(player.jumpTimer>=0.11){
      player.jumpPhase='air';
      player.airTime=0;
      player.vy=-560;
    }
  }else if(!player.onGround){
    player.airTime+=dt;
    player.vy+=1450*dt;
    player.jumpY+=player.vy*dt;
    if(player.jumpY>=0){
      player.jumpY=0;player.vy=0;player.onGround=true;player.jumpPhase='land';player.jumpTimer=0;
    }
  }else if(player.jumpPhase==='land'){
    player.jumpTimer+=dt;
    if(player.jumpTimer>=0.10)player.jumpPhase='ground';
  }

  if(player.attack>0){
    player.attack=Math.max(0,player.attack-dt);
    player.attackTime+=dt;
  }
  player.dash=Math.max(0,player.dash-dt);
  player.hitCooldown=Math.max(0,player.hitCooldown-dt);
  animTime+=dt;

  if(!giantBoar.active){
    const b=boars[currentBoar];
    if(b&&b.active){
      b.y=player.y;
      const dx=player.x-b.x,distance=Math.abs(dx);
      if(distance>48)b.x+=Math.sign(dx)*b.speed*dt;
      else if(b.attackCooldown<=0&&player.hitCooldown<=0){
        player.hp=Math.max(0,player.hp-1);
        player.hitCooldown=.9;b.attackCooldown=1.1;
        player.x+=Math.sign(player.x-b.x)*28;
        document.getElementById('message').textContent=player.hp>0?'BOAR HIT KĀLA!':'KĀLA DEFEATED';
        if(player.hp<=0)setTimeout(()=>{player.hp=3;player.x=160;spawnNextBoar();document.getElementById('message').textContent='KĀLA • THE LOST TEMPLE'},900);
      }
      b.attackCooldown=Math.max(0,b.attackCooldown-dt);b.animTime+=dt;
    }
  }else{
    giantBoar.y=player.y;
    const dx=player.x-giantBoar.x,distance=Math.abs(dx);
    if(distance>70)giantBoar.x+=Math.sign(dx)*72*dt;
    else if(giantBoar.attackCooldown<=0&&player.hitCooldown<=0){
      player.hp=Math.max(0,player.hp-2);player.hitCooldown=1.0;giantBoar.attackCooldown=1.4;
      player.x+=Math.sign(player.x-giantBoar.x)*45;
      document.getElementById('message').textContent=player.hp>0?'GIANT BOAR HIT KĀLA!':'KĀLA DEFEATED';
      if(player.hp<=0)setTimeout(()=>{player.hp=3;player.x=160;giantBoar.active=false;document.getElementById('message').textContent='KĀLA • THE LOST TEMPLE'},900);
    }
    giantBoar.attackCooldown=Math.max(0,giantBoar.attackCooldown-dt);
    giantBoar.animTime+=dt;
  }
  relics.forEach(r=>{
    if(!r.collected&&Math.abs(player.x-r.x)<45){
      r.collected=true;relicCount++;
      document.getElementById('message').textContent=relicCount<3?'SACRED RELIC COLLECTED':'3 RELICS COLLECTED • PRESS E TO AWAKEN';
    }
  });

  hitBoar();
}

function drawHealth(){
  ctx.fillStyle='rgba(0,0,0,.65)';
  ctx.fillRect(140,16,230,30);
  ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';
  ctx.fillText('BOARS: '+Math.min(currentBoar,5)+'/5   RELICS: '+relicCount+'/3',150,36);
  ctx.font='bold 16px sans-serif';
  ctx.fillStyle='rgba(0,0,0,.55)';
  ctx.fillRect(16,16,112,30);
  ctx.fillStyle='#fff';
  ctx.fillText('KĀLA',24,37);
  for(let i=0;i<3;i++){
    ctx.fillStyle=i<player.hp?'#d64545':'rgba(255,255,255,.25)';
    ctx.fillRect(72+i*15,25,11,11);
  }
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#07110b';
  ctx.fillRect(0,0,W,H);

  relics.forEach(r=>{r.y=player.y;});

  ctx.strokeStyle='rgba(255,255,255,.12)';
  ctx.beginPath();
  ctx.moveTo(0,player.y+32);ctx.lineTo(W,player.y+32);ctx.stroke();

  let frames,fps,frame;
  if(player.jumpPhase!=='ground'){
    frames=jumpImages;
    if(player.jumpPhase==='crouch'){
      frame=0;
    }else if(player.jumpPhase==='air'){
      frame=Math.min(frames.length-1,Math.floor(player.airTime*12));
    }else{
      frame=frames.length-1;
    }
  }else if(player.attack>0){
    frames=attackImages;fps=11;
    frame=Math.min(frames.length-1,Math.floor(player.attackTime*fps));
  }else{
    const moving=keys.left||keys.right;
    frames=moving?walkImages:idleImages;
    fps=moving?10:6;
    frame=Math.floor(animTime*fps)%frames.length;
  }

  const img=frames[frame];
  if(img&&img.complete&&img.naturalWidth){
    const targetH=116,ratio=img.naturalWidth/img.naturalHeight,targetW=targetH*ratio;
    ctx.save();
    const visualJump=player.jumpPhase==='crouch' ? 0 : player.jumpY;
    const groundY=player.y+32+visualJump;
    ctx.translate(player.x,groundY-targetH);
    let sx=1,sy=1;
    if(player.jumpPhase==='crouch'){sx=1.06;sy=.88;ctx.translate(0,targetH*.12);}
    else if(player.jumpPhase==='air'){const t=Math.min(1,Math.abs(player.vy)/560);sx=1-.08*t;sy=1+.08*t;}
    else if(player.jumpPhase==='land'){sx=1.09;sy=.84;ctx.translate(0,targetH*.08);}
    ctx.scale(sx,sy);
    if(player.facing==='left')ctx.scale(-1,1);
    ctx.globalAlpha=player.hitCooldown>0?0.55:1;
    ctx.drawImage(img,-targetW/2,0,targetW,targetH);
    ctx.restore();
  }

  // Sacred relics: use the blue relic animation for all three collectibles.
  relics.forEach((r)=>{
    if(r.collected)return;
    const img=blueRelicImages[Math.floor(animTime*7)%blueRelicImages.length];
    if(img&&img.complete&&img.naturalWidth){
      const targetH=31,ratio=img.naturalWidth/img.naturalHeight,targetW=targetH*ratio;
      ctx.save();
      ctx.globalAlpha=.96;
      ctx.translate(r.x,r.y-31);
      ctx.shadowColor='rgba(40,140,255,.85)';
      ctx.shadowBlur=10;
      ctx.drawImage(img,-targetW/2,0,targetW,targetH);
      ctx.restore();
    }
  });

  const activeBoar=boars[currentBoar];
  if(activeBoar&&activeBoar.active&&!giantBoar.active){
    const b=boarImages[Math.floor(activeBoar.animTime*10)%boarImages.length];
    if(b&&b.complete&&b.naturalWidth){
      const targetH=96,ratio=b.naturalWidth/b.naturalHeight,targetW=targetH*ratio;
      ctx.save();
      const groundY=activeBoar.y+32;
      ctx.translate(activeBoar.x,groundY-targetH);
      if(activeBoar.x>player.x)ctx.scale(-1,1);
      ctx.drawImage(b,-targetW/2,0,targetW,targetH);
      ctx.restore();
      ctx.fillStyle='rgba(0,0,0,.7)';
      ctx.fillRect(activeBoar.x-42,activeBoar.y-108+32,84,8);
      ctx.fillStyle='#c93b3b';
      ctx.fillRect(activeBoar.x-42,activeBoar.y-108+32,84*(activeBoar.hp/activeBoar.maxHp),8);
      ctx.strokeStyle='#fff';
      ctx.strokeRect(activeBoar.x-42,activeBoar.y-108+32,84,8);
    }
  }

  drawHealth();
}

function loop(now){
  const dt=Math.min((now-last)/1000,.033);
  last=now;update(dt);draw();requestAnimationFrame(loop);
}
resize();
spawnNextBoar();
draw();

window.startKalaGame=()=>{
  if(gameStarted)return;
  gameStarted=true;
  last=performance.now();
  document.body.classList.add('game-started');
  requestAnimationFrame(loop);
};
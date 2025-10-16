let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let buffer = document.createElement("canvas");
let bCtx = buffer.getContext("2d");

class letter {
  constructor(character, x, y) {
    this.character = character;
    
    let [left, top, right, bottom, aveAlpha] = getExactRect(character);
    
    this.offsetX = left;
    this.offsetY = top;
    this.width = right - left;
    this.height = bottom - top;
    this.aveAlpha = aveAlpha;
    
    this.x = x + this.offsetX;
    this.y = y + this.offsetY;
    
    this.lastX = this.x;
    this.lastY = this.y;
    
    this.sx = 0;
    this.sy = 0;    
    
    this.startX = this.x;
    this.startY = this.y;
    
    this.mass = (this.width + this.height) / 2;
    
    this.freeze = true;
    this.inTransit = false;
    
    this.lastSub = 0;
  }
  
  update() {
    this.sy += 0.1;
    
    // centered
    let cx = this.x + this.width * 0.5; 
    let cy = this.y + this.height * 0.5;
    
    let waterHeight = waterLevel * canvas.height;
    
    let submerged = -(waterHeight - this.y - this.height) / this.height;
    submerged = Math.max(0, Math.min(submerged, 1));
    
    let speed = Math.hypot(this.sx, this.sy);      
    
    if((submerged - this.lastSub) * 4 > Math.random()){
      bubbles.push(
        new bubble(
          cx, 
          waterHeight, 
          this.sx + (Math.random() - 0.5) * 6, 
          this.sy + (Math.random() - 0.5) * 6
        )
      );
    }
    
    if(submerged != 1 && submerged != 0 && speed > 1){
      let force = Math.abs(submerged - this.lastSub) * speed;
      
      let lateral = this.sx + (Math.random() - 0.5) * force;
      let vertical = -speed / 2;
      
      splashes.push(
        new splash(
          cx, 
          waterHeight, 
          lateral, 
          vertical
        )
      );
    }
    
    this.lastSub = submerged;
    
    this.sy -= submerged * 0.2;
    
    let dx = cx - mouse.x;
    let dy = cy - mouse.y;
    let dist = Math.hypot(dx, dy);
    if(mouse.down && mouse.range >= dist){
      let force = (mouse.range - dist) / mouse.range * 20;
      
      this.sx += dx / dist * force;
      this.sy += dy / dist * force;
      
      this.freeze = false;
      this.inTransit = false;
    }
    
    this.sx *= 1 - 0.15 * submerged;
    this.sy *= 1 - 0.15 * submerged;
    
    if(this.freeze){
      this.sx = 0;
      this.sy = 0;
      this.x = this.startX;
      this.y = this.startY;      
    }
    if(this.inTransit){
      let dx = this.startX - this.x;
      let dy = this.startY - this.y;
      
      this.x += dx / 4;
      this.y += dy / 4;
      
      this.sx = 0;
      this.sy = 0;
      
      this.freeze = false;
      
      let distToTarget = Math.hypot(dx, dy);
      if(distToTarget < 1){
        this.x = this.startX;
        this.y = this.startY;
        this.freeze = true;
        this.inTransit = false;
      }
    }
    
    this.x += this.sx;
    if(this.x < 0){
      this.x = 0;
      this.sx = Math.abs(this.sx) * boundBounce;  
      this.sy *= boundFriction;
    }else if(this.x + this.width > canvas.width){
      this.x = canvas.width - this.width;
      this.sx = -Math.abs(this.sx) * boundBounce;  
      this.sy *= boundFriction;
    }
     
    this.y += this.sy;
    if(this.y < 0){
      this.y = 0;
      this.sx *= boundFriction;
      this.sy = Math.abs(this.sy) * boundBounce;  
    }else if(this.y + this.height > canvas.height){
      this.y = canvas.height - this.height;
      this.sx *= boundFriction;
      this.sy = -Math.abs(this.sy) * boundBounce;
    }
  }
  
  reset() {
    this.inTransit = true;
    this.freeze = false;
  }
  
  collide(other) {
    if(this.inTransit || other.inTransit) return;
    if(!rectCol(this.x, this.y, this.width, this.height, other.x, other.y, other.width, other.height))
      return;
        
    let diffX = Math.min(
      (this.x + this.width) - other.x,
      (other.x + other.width) - this.x   
    );
    let diffY = Math.min(
      (this.y + this.height) - other.y,
      (other.y + other.height) - this.y     
    );
    
    let dirX = Math.sign(this.x - other.x);
    let dirY = Math.sign(this.y - other.y);
    
    let a = other.mass / this.mass;
    let b = this.mass / other.mass;
    
    if(this.freeze && other.freeze){
      a = 1;
      b = 1;
    }else if(this.freeze){
      a = 0;
      b = 1;
    }else if(other.freeze){
      a = 1;
      b = 0;
    }
    
    if(diffX < diffY){ // horiz
      let displaced = diffX * dirX * 0.8;
      
      this.x += displaced * a;
      other.x -= displaced * b;   
      
      this.sx += displaced * 0.5 * a;
      other.sx -= displaced * 0.5 * b; 
      
      let avePerpenSpeed = (this.sy + other.sy) / 2;
      this.sy += (avePerpenSpeed - this.sy) / 10;
      other.sy += (avePerpenSpeed - other.sy) / 10;    
    }else{ // vert
      let displaced = diffY * dirY * 0.8;
      
      this.y += displaced * a;
      other.y -= displaced * b;   
      
      this.sy += displaced * 0.5 * a;
      other.sy -= displaced * 0.5 * b; 
      
      let avePerpenSpeed = (this.sx + other.sx) / 2;
      this.sx += (avePerpenSpeed - this.sx) / 10;
      other.sx += (avePerpenSpeed - other.sx) / 10;
    }
  }
  
  draw() {
    let dist = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    let size = (this.width + this.height) / 2
    if(dist > size){
      ctx.lineWidth = size;
      ctx.globalAlpha = this.aveAlpha / 255;
      
      let offX = this.width / 2;
      let offY = this.height / 2;
      
      ctx.beginPath();
      ctx.moveTo(this.lastX + offX, this.lastY + offY);
      ctx.lineTo(this.x + offX, this.y + offY);
      ctx.stroke();
      
      ctx.globalAlpha = 1;
    }else{
      ctx.fillText(this.character, this.x - this.offsetX, this.y + charH - this.offsetY);
    }
    
    this.lastX = this.x;
    this.lastY = this.y;
  }
}

class bubble {
  constructor(x, y, sx, sy) {
    this.x = x;
    this.y = y;
    this.sx = sx;
    this.sy = sy;
    
    this.radius = 1;
  }
  
  update() {
    this.sy -= 0.13;
    
    this.sx *= 0.9;
    this.sy *= 0.9;
    
    this.x += this.sx;
    this.y += this.sy;
    
    if(this.y + this.radius < waterLevel * canvas.height)
      return true;
      
    return false;
  }
  
  draw() {
    bCtx.beginPath();
    bCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    bCtx.fill();
  }
}

class splash {
  constructor(x, y, sx, sy) {
    this.x = x;
    this.y = y;
    this.sx = sx;
    this.sy = sy;
    
    this.radius = 1.5;
  }
  
  update() {
    this.sy += 0.1;
    
    this.x += this.sx;
    this.y += this.sy;
    
    if(this.y - this.radius > waterLevel * canvas.height)
      return true;
      
    return false;
  }
  
  draw() {
    bCtx.beginPath();
    bCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    bCtx.fill();
  }
}

let fontSize = 24;

let charW = 0;
let charH = 0;

let boundBounce = 0.5;
let boundFriction = 0.9;

let waterLevel = 1;

let mouse = {
  range: 80,
  x: 0, 
  y: 0,
  down: false,
  lastTouch: -1000,
};

let frame = 1;

let elements = [];
let bubbles = [];
let splashes = [];

function startingPhrase(text, yOffset) {
  let originX = canvas.width * 0.5 - (text.length * charW) * 0.5;
  let originY = canvas.height * 0.5 - charH * 0.5 + yOffset;
  
  for(let i = 0; i < text.length; i++){
    let character = text[i];
    if(character == " ") continue;
    
    elements.push(
      new letter(character, originX + i * charW, originY)
    );
  }
}

function reset() {
  for(let letter of elements) letter.reset();
}

setup();
function setup() {
  canvas.width = 600;
  canvas.height = 600;
  buffer.width = 600;
  buffer.height = 600;
  
  ctx.font = fontSize + "px 'Courier New'";
  
  let metrics = ctx.measureText("A");
  
  charW = metrics.width;
  charH = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
  
  //startingPhrase("Procrastination is a CRAZY drug.", 0);
  
  //startingPhrase("Kriztoffer.", 0);
  
  startingPhrase("Procrastination is a CRAZY drug.", -charH * 0.6);
  startingPhrase("Double tap to reset.", charH * 0.6);
    
  loop();
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if(frame % 200 == 0){
    let frozen = [];
    for(let letter of elements) if(letter.freeze) frozen.push(letter);
    
    if(frozen.length > 0){
      let randElem = frozen[Math.floor(frozen.length * Math.random())];
      randElem.freeze = false;
    }
  }
  
  let targetLevel = Math.min(frame / 50000 + 0.2, 1); 
  
  waterLevel = (1 - targetLevel) * 0.001 + waterLevel * 0.999;
  
  for(let p = 0; p < 2; p++)
  for(let i = 0; i < elements.length; i++)
    for(let j = i + 1; j < elements.length; j++)
      elements[i].collide(elements[j]);
      
  for(let elem of elements)
    elem.update();
    
  for(let elem of elements)
    elem.draw();
  
  drawWater();
  
  /*document.getElementById("debug").innerText = 
    "splashes: " + splashes.length +
    "\nbubbles: " + bubbles.length;*/
  
  frame++;
  window.requestAnimationFrame(loop);
}

function drawWater() {
  bCtx.clearRect(0, 0, canvas.width, canvas.height);
  bCtx.fillStyle = "#2babff";
  
  let waterHeight = Math.round(waterLevel * canvas.height);
  
  bCtx.fillRect(0, waterHeight, canvas.width, canvas.height);
  
  for(let i = 0; i < splashes.length; i++) 
    if(splashes[i].update()){
      splashes.splice(i, 1);
      i--;
    }
  
  for(let part of splashes) 
    part.draw(); 
  
  for(let i = 0; i < bubbles.length; i++) 
    if(bubbles[i].update()){
      bubbles.splice(i, 1);
      i--;
    }
    
  bCtx.globalCompositeOperation = "destination-out";
  for(let part of bubbles) 
    part.draw();
  bCtx.globalCompositeOperation = "source-over";
   
  ctx.globalAlpha = 0.3;
  ctx.drawImage(buffer, 0, 0);
  ctx.globalAlpha = 1;
}

function rectCol(ax, ay, aw, ah, bx, by, bw, bh, forWalls = false) {
  if(forWalls){ // a = bound : b = ent
    
    return ax > bx || ax + aw < bx + bw ||
           ay > by || ay + ah < by + bh;
    
  }
  
  // interchangeable a : b
  
  return (ax < bx + bw && ax + aw > bx) && 
         (ay < by + bh && ay + ah > by);
  
}

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  let [x, y] = getTouchPosition(e);
  
  mouse.x = x;
  mouse.y = y;
  mouse.down = true;
  
  let curTouch = performance.now();
  
  if(curTouch - mouse.lastTouch <= 200) reset();
  
  mouse.lastTouch = curTouch;
});
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  let [x, y] = getTouchPosition(e);
  
  mouse.x = x;
  mouse.y = y;
});
canvas.addEventListener("touchend", () => {
  mouse.down = false;
});



function getTouchPosition(e) {
  let touch = e.touches[0];
  
  let rect = canvas.getBoundingClientRect();
  
  let x = touch.pageX - rect.left;
  let y = touch.pageY - rect.top;
  
  x *= canvas.width / rect.width;
  y *= canvas.height / rect.height;
  
  return [x, y];
}

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let buffer = document.createElement("canvas");
let bCtx = buffer.getContext("2d");

class letter {
  constructor(character, x, y) {
    this.character = character;
    this.x = x;
    this.y = y;
    
    this.sx = 0;
    this.sy = 0;    
    
    this.startX = x;
    this.startY = y;
    
    this.freeze = true;
    
    this.lastSub = 0;
  }
  
  update() {
    this.sy += 0.1;
    
    // centered
    let cx = this.x + charW * 0.5; 
    let cy = this.y + charH * 0.5;
    
    let waterHeight = waterLevel * canvas.height;
    
    let submerged = (this.y + charH * 1.25 - waterHeight) / charH;
    submerged = Math.max(0, Math.min(submerged, 1));
    
    if((submerged - this.lastSub) * 2 > Math.random()){
      bubbles.push(
        new bubble(
          cx, 
          waterHeight, 
          this.sx + (Math.random() - 0.5) * 6, 
          this.sy + (Math.random() - 0.5) * 6
        )
      );
    }
    
    this.lastSub = submerged;
    
    this.sy -= submerged * 0.2;
    
    let dx = cx - mouse.x;
    let dy = cy - mouse.y;
    let dist = Math.hypot(dx, dy);
    if(mouse.down && mouse.range >= dist){
      let force = (mouse.range - dist) / mouse.range * 3;
      
      this.sx += dx / dist * force;
      this.sy += dy / dist * force;
      
      this.freeze = false;
    }
    
    this.sx *= 1 - 0.1 * submerged;
    this.sy *= 1 - 0.1 * submerged;
    
    if(this.freeze){
      this.sx = 0;
      this.sy = 0;
    }
    
    this.x += this.sx;
    if(this.x < 0){
      this.x = 0;
      this.sx = Math.abs(this.sx) * boundBounce;  
      this.sy *= boundFriction;
    }
    if(this.x + charW > canvas.width){
      this.x = canvas.width - charW;
      this.sx = -Math.abs(this.sx) * boundBounce;  
      this.sy *= boundFriction;
    }
     
    this.y += this.sy;
    if(this.y < 0){
      this.y = 0;
      this.sx *= boundFriction;
      this.sy = Math.abs(this.sy) * boundBounce;  
    }
    if(this.y + charH > canvas.height){
      this.y = canvas.height - charH;
      this.sx *= boundFriction;
      this.sy = -Math.abs(this.sy) * boundBounce;
    }
  }
  
  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.freeze = true;
  }
  
  collide(other) {
    if(!rectCol(this.x, this.y, charW, charH, other.x, other.y, charW, charH))
      return;
      
    this.freeze = false;
    other.freeze = false;
      
    let diffX = charW - Math.abs(this.x - other.x);
    let diffY = charH - Math.abs(this.y - other.y);
    let dirX = Math.sign(this.x - other.x);
    let dirY = Math.sign(this.y - other.y);
    
    if(diffX < diffY){ // horiz
      let displaced = diffX * dirX / 2;
      this.x += displaced;
      other.x -= displaced;   
      
      this.sx += displaced * 0.5;
      other.sx -= displaced * 0.5; 
    }else{ // vert
      let displaced = diffY * dirY / 2;
      this.y += displaced;
      other.y -= displaced;   
      
      this.sy += displaced * 0.5;
      other.sy -= displaced * 0.5; 
    }
  }
  
  draw() {
    ctx.fillText(this.character, this.x, this.y + charH);
  }
}

class bubble {
  constructor(x, y, sx, sy) {
    this.x = x;
    this.y = y;
    this.sx = sx;
    this.sy = sy;
    
    this.radius = 1.5;
  }
  
  update() {
    this.sy -= 0.1;
    
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

let fontSize = 24;

let charW = 0;
let charH = 0;

let boundBounce = 0.5;
let boundFriction = 0.9;

let waterLevel = 0.75;

let mouse = {
  range: 80,
  x: 0, 
  y: 0,
  down: false
};

let frame = 1;

let elements = [];
let bubbles = [];

function startingPhrase(text) {
  let originX = canvas.width * 0.5 - (text.length * charW) * 0.5;
  let originY = canvas.height * 0.5 - charH * 0.5;
  
  for(let i = 0; i < text.length; i++){
    let character = text[i];
    if(character == " ") continue;
    
    elements.push(
      new letter(character, originX + i * charW, originY)
    );
  }
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
  
  startingPhrase("Procrastination is a CRAZY drug.");
    
  loop();
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if(frame % 200 == 0){
    let randElem = elements[Math.floor(elements.length * Math.random())];
    randElem.freeze = false;
  }
  
  for(let i = 0; i < elements.length; i++)
    for(let j = i + 1; j < elements.length; j++)
      elements[i].collide(elements[j]);
      
  for(let elem of elements)
    elem.update();
    
  for(let elem of elements)
    elem.draw();
  
  drawWater();
  
  frame++;
  window.requestAnimationFrame(loop);
}

function drawWater() {
  bCtx.clearRect(0, 0, canvas.width, canvas.height);
  bCtx.fillStyle = "#2babff";
  bCtx.strokeStyle = "#aadfff";
  bCtx.lineWidth = 4;
  bCtx.globalAlpha = 0.3;
  
  let waterHeight = waterLevel * canvas.height;
  
  bCtx.fillRect(0, waterHeight, canvas.width, canvas.height);
  
  bCtx.beginPath();
  bCtx.moveTo(0, waterHeight);
  bCtx.lineTo(canvas.width, waterHeight);
  bCtx.stroke();
  
  for(let i = 0; i < bubbles.length; i++) 
    if(bubbles[i].update()){
      bubbles.splice(i, 1);
      i--;
    }
    
  bCtx.globalAlpha = 1;
  bCtx.globalCompositeOperation = "destination-out";
  for(let part of bubbles) 
    part.draw();
  
  bCtx.globalCompositeOperation = "source-over";
  ctx.drawImage(buffer, 0, 0);
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

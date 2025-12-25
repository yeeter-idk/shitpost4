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
    this.held = false;  
    
    this.startX = this.x;
    this.startY = this.y;
    
    this.mass = (this.width + this.height) / 2;
    
    this.freeze = true;
    this.inTransit = false;
    
    this.lastSub = 0;
  }
  
  update(subStep, stepAmount) {
    this.sy += gravity * subStep;
    
    // centered
    let cx = this.x + this.width * 0.5; 
    let cy = this.y + this.height * 0.5;
    
    let waterHeight = waterLevel * canvas.height;
    
    let submerged = -(waterHeight - this.y - this.height) / this.height;
    submerged = Math.max(0, Math.min(submerged, 1));
    
    let speed = Math.hypot(this.sx, this.sy);      
    
    if(Math.random() < subStep)
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
    
    if(Math.random() < subStep)
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
    
    this.sy -= submerged * (gravity * 2) * subStep;
    
    let dx = cx - mouse.x;
    let dy = cy - mouse.y;
    let dist = Math.hypot(dx, dy);
    if(mouse.down && mouse.range >= dist){
      //let force = (mouse.range - dist) / mouse.range * 20;
      let force = Math.pow(dist, 1.5) / mouse.range * -1;
      
      this.sx *= Math.pow(0.8, subStep);
      this.sy *= Math.pow(0.8, subStep);
      
      /*this.sx += dx / dist * force * subStep;
      this.sy += dy / dist * force * subStep;*/
      
      /*this.sx += mouse.dx / Math.max(0.001, mouse.deltaTime) * subStep;
      this.sy += mouse.dy / Math.max(0.001, mouse.deltaTime) * subStep;*/
      
      let holdStrength = 1//1 - Math.min(1, dist / mouse.range * 3);
      if(!this.held){
        this.held = true;
        /*this.x -= mouse.dx * subStep;
        this.y -= mouse.dy * subStep;*/
      }else{
        this.x += mouse.dx * subStep * holdStrength;
        this.y += mouse.dy * subStep * holdStrength;
      }
      
      this.freeze = false;
      this.inTransit = false;
    }else if(this.held && mouse.down){
      this.x += dx / dist * (mouse.range - dist);
      this.y += dy / dist * (mouse.range - dist);
      this.sx = 0;
      this.sy = 0;
      
      //this.sy += 1;
      //this.held = false;
    }else if(this.held && !mouse.down){
      this.sx += mouse.dx * deltaTime;
      this.sy += mouse.dy * deltaTime;
      this.held = false;
    }
    
    let waterResistance = Math.pow(1 - 0.15 * submerged, subStep);
    
    this.sx *= waterResistance;
    this.sy *= waterResistance;
    
    if(this.freeze){
      this.sx = 0;
      this.sy = 0;
      this.x = this.startX;
      this.y = this.startY;      
    }
    if(this.inTransit){
      let dx = this.startX - this.x;
      let dy = this.startY - this.y;
      
      this.x += dx / 4 * subStep;
      this.y += dy / 4 * subStep;
      
      this.sx = 0;
      this.sy = 0;
      
      this.freeze = false;
      
      let distToTarget = Math.hypot(dx, dy);
      if(distToTarget < 1){
        this.freeze = true;
        this.inTransit = false;
      }
    }
    
    this.x += this.sx * subStep;
    if(this.x < 0){
      this.x = 0;
      this.sx = Math.abs(this.sx) * boundBounce;  
      this.sy *= 1 - boundFriction;
    }else if(this.x + this.width > canvas.width){
      this.x = canvas.width - this.width;
      this.sx = -Math.abs(this.sx) * boundBounce;  
      this.sy *= 1 - boundFriction;
    }
     
    this.y += this.sy * subStep;
    if(this.y < 0){
      this.y = 0;
      this.sx *= 1 - boundFriction;
      this.sy = Math.abs(this.sy) * boundBounce;  
    }else if(this.y + this.height > canvas.height){
      this.y = canvas.height - this.height;
      this.sx *= 1 - boundFriction;
      this.sy = -Math.abs(this.sy) * boundBounce;
    }
  }
  
  reset() {
    this.inTransit = true;
    this.freeze = false;
  }
  
  collide(other, subStep) {
    if(this.inTransit || other.inTransit) return;
    if(!rectCol(this.x, this.y, this.width, this.height, other.x, other.y, other.width, other.height))
      return;
        
    let diffX = Math.min(this.x + this.width, other.x + other.width)
          - Math.max(this.x, other.x);
    let diffY = Math.min(this.y + this.height, other.y + other.height)
          - Math.max(this.y, other.y);
    
    let dirX = Math.sign(this.x - other.x);
    let dirY = Math.sign(this.y - other.y);
    
    let a = other.mass / this.mass;
    let b = this.mass / other.mass;
    
    if(this.freeze && other.freeze){
      a = 1;
      b = 1;
    }else if(this.freeze){
      a = 0;
      b = 2;
    }else if(other.freeze){
      a = 2;
      b = 0;
    }
    
    let perpenMult = letterFriction;
    
    if(diffX < diffY){ // horiz
      let displaced = diffX * dirX;
      
      this.x += displaced * a;
      other.x -= displaced * b;   
      
      let tMass = this.freeze ? -1 : this.mass;
      let oMass = other.freeze ? -1 : other.mass;      
      [this.sx, other.sx] = resolveCollision(this.sx, other.sx, tMass, oMass, letterBounce);
       
      let avePerpenSpeed = (this.sy + other.sy) / 2;
      this.sy += (avePerpenSpeed - this.sy) * perpenMult;
      other.sy += (avePerpenSpeed - other.sy) * perpenMult;    
    }else{ // vert
      let displaced = diffY * dirY;
      
      this.y += displaced * a;
      other.y -= displaced * b;   
      
      let tMass = this.freeze ? -1 : this.mass;
      let oMass = other.freeze ? -1 : other.mass;      
      [this.sy, other.sy] = resolveCollision(this.sy, other.sy, tMass, oMass, letterBounce);
      
      let avePerpenSpeed = (this.sx + other.sx) / 2;
      this.sx += (avePerpenSpeed - this.sx) * perpenMult;
      other.sx += (avePerpenSpeed - other.sx) * perpenMult;
    }
  }
  
  draw() {
    let dist = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    let size = (this.width + this.height) / 2
    if(dist > size){
      ctx.lineWidth = size;
      ctx.globalAlpha = (this.aveAlpha / 255) * (size / dist);
      
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
    
    /*if(Math.hypot(this.sx, this.sy) > stepManager.fastestSpeed - 1){
      ctx.fillStyle = "red";
      ctx.globalAlpha = 0.3;
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "black";      
    }*/
    
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
    this.time = 0;
  }
  
  update() {
    this.sy -= (gravity * 0.5) * deltaTime;
    this.time += deltaTime;
    
    let mult = Math.pow(0.9, deltaTime);
    this.sx *= mult;
    this.sy *= mult;
    
    this.x += this.sx * deltaTime;
    this.y += this.sy * deltaTime;
    
    if(this.y + this.radius < waterLevel * canvas.height || this.time > 600)
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
    this.time = 0;
  }
  
  update() {
    this.sy += gravity * deltaTime;
    this.time += deltaTime;
    
    this.x += this.sx * deltaTime;
    this.y += this.sy * deltaTime;
    
    if(this.y - this.radius > waterLevel * canvas.height || this.time > 600)
      return true;
      
    return false;
  }
  
  draw() {
    bCtx.beginPath();
    bCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    bCtx.fill();
  }
}

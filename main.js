let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let buffer = document.createElement("canvas");
let bCtx = buffer.getContext("2d");

let fontSize = 28//24;

let charW = 0;
let charH = 0;

let gravity = 0.3;
let boundBounce = 0.5;
let letterBounce = 0.5;
let boundFriction = 0.5;
let letterFriction = 0.5;

let waterLevel = 0;

let mouse = {
  range: 100,
  x: 0, 
  y: 0,
  dx: 0,
  dy: 0,
  lastX: 0,
  lastY: 0,
  down: false,
  lastTouches: [-1000],
  draw: function() {
    if(this.down){
      ctx.lineWidth = 1;
      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
};

let deltaTime = 0; // 1 = 1frame
let timeManager = {
  timeSpeed: 1,
  time: 0,
  st: 0,
  aveDT: 1,
  update: function() {
    let curTime = performance.now();
    
    deltaTime = (curTime - this.st) / 1000 * 60 * this.timeSpeed;
    this.aveDT = this.aveDT * 0.9 + deltaTime * 0.1;
    
    this.time += deltaTime;
    
    this.st = curTime;
  }
};

let debugEnabled = false;

let frame = 1;

let elements = [];
let bubbles = [];
let splashes = [];

let stepManager = {
  smallestSize: 100,
  fastestSpeed: 100,
  steps: 1,
  update: function() {
    this.smallestSize = 99999;
    for(let elem of elements){
      let size = (elem.width + elem.height) / 2;
      this.smallestSize = Math.min(size, this.smallestSize);
    }
 
    this.fastestSpeed = 0;
    for(let elem of elements){
      let speed = Math.hypot(elem.sx, elem.sy);
      this.fastestSpeed = Math.max(speed, this.fastestSpeed);
    } 
    
    this.steps = Math.ceil(this.fastestSpeed / this.smallestSize);
    //this.steps = Math.min(20, this.steps);
    this.steps = Math.max(20, this.steps);
  }
};

function startingPhrase(text, yOffset) {
  let originX = canvas.width * 0.5 - (text.length * charW) * 0.5;
  let originY = canvas.height * 0.5 - charH * 0.5 + yOffset;
  
  for(let i = 0; i < text.length; i++){
    let character = text[i];
    if(character.trim().length == 0) continue;
    
    elements.push(
      new letter(character, originX + i * charW, originY)
    );
  }
}

function startingParagraph(text) {
  let lines = text.split("\n");
  
  for(let i = 0; i < lines.length; i++){
    startingPhrase(lines[i], -lines.length * charH * 1 / 2 + charH * i);
  }
}

function getRandomMessage() {
  let messages = [
    "I hope the AI craze crashes\nharder than the great depression.",
    "Stream Inabakumori.",
    "It's Morbin time.",
    "Road work ahead?\nSure hope it does!",
    "Double tap to reset.",
    "The more you care, the more you get hurt.",
    "My head hurts.",
    "Hello everybody, my name is welcome.",
    "What's the deal with airline food?",
    "Sebastian Lague and Acerola are great.",
    "I love Javascript.",
    "Triple tap to enable debug.",
    "Watch Sleep Deprived\nand Chuckle Sandwich.",
    "Crazy? I was crazy once,\nthey locked me in a room, a rubber room,\na rubber room with rats,\nand rats make me crazy. Crazy?\nI was crazy once, they locked me in a\nroom, a rubber room, a rubber room with\nrats, and rats make me crazy.\nCrazy?",
    "It's bullshit all the way down.",
    "Got 47/50, it ain't perfect,\nbut it's honest work.",
    "Two Cadburys, and a Pepero.\nDo I have enough to\npay for your food too?"
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
  //return messages[13];
}

setup();
loop();

function setup() {
  /*canvas.width = 600;
  canvas.height = 600;
  buffer.width = 600;
  buffer.height = 600;*/
  
  canvas.width = window.innerWidth * 2;
  canvas.height = window.innerHeight * 2;
  buffer.width = canvas.width;
  buffer.height = canvas.height;
  
  elements = [];
  waterLevel = 0;
  
  setFont();
  
  let metrics = ctx.measureText("A");
  
  charW = metrics.width;
  charH = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
  
  //document.getElementById("timeSpeed").style.display = "none";
  
  let text = "Procrastination is a CRAZY drug.\n\n";
  
  text += getRandomMessage();
  
  startingParagraph(text);
}

async function loop() {
  window.requestAnimationFrame(await loop);
  timeManager.update();  
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if(frame % 200 == 0){
    let frozen = [];
    for(let letter of elements) if(letter.freeze) frozen.push(letter);
    
    if(frozen.length > 0){
      let randElem = frozen[Math.floor(frozen.length * Math.random())];
      randElem.freeze = false;
    }
  }
  
  let targetLevel = 1 - Math.min(timeManager.time / 50000 - 0.03, 1); 
 
  waterLevel = targetLevel;//(targetLevel - waterLevel) * timeManager.aveDT;
  
  stepManager.update();
  for(let u = 0; u < stepManager.steps; u++){
    let subStep = 1 / stepManager.steps// * deltaTime;
    
    for(let i = 0; i < elements.length; i++)
      for(let j = i + 1; j < elements.length; j++)
        elements[i].collide(elements[j], subStep);
      
    for(let elem of elements)
      elem.update(subStep, stepManager.steps);
      
    /*for(let elem of elements)
      elem.draw();*/
    
    //if(u % 2 == 0) await frameDelay();
    //for(let k = 0; k < 1; k++) await frameDelay();
  }
  
  for(let elem of elements)
    elem.draw();
    
  mouse.draw();
  
  drawWater();
  
  if(debugEnabled){
    //timeManager.timeSpeed = parseFloat(document.getElementById("timeSpeed").value);
  
    document.getElementById("debugContainer").style.display = "block";
    
    document.getElementById("debug").innerText = 
      "Letters: " + elements.length +
      "\nSplash Particles: " + splashes.length +
      "\nBubble Particles: " + bubbles.length +
      "\nLowest Size Letter: " + stepManager.smallestSize +
      "\nFastest Speed: " + stepManager.fastestSpeed +
      "\nSimulation Steps: " + stepManager.steps + 
      "\nTouch Times: " + mouse.lastTouches.join(", ") + 
      "\nTime Speed: " + timeManager.timeSpeed;
    ctx.fillText(Math.floor(60 / timeManager.aveDT), 0, canvas.height);
  }else{
    document.getElementById("debugContainer").style.display = "none";
  }
    
  frame++;
  
  mouse.dx = (mouse.x - mouse.lastX) / deltaTime;
  mouse.dy = (mouse.y - mouse.lastY) / deltaTime;
  
  mouse.lastX = mouse.x;
  mouse.lastY = mouse.y;
  //window.requestAnimationFrame(await loop);
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


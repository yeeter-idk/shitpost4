function resolveCollision(v1, v2, m1, m2, e = 1) {
  const immovable1 = m1 < 0;
  const immovable2 = m2 < 0;

  if (immovable1 && immovable2) return [v1, v2];
  if (immovable1) return [0, -v2 * e];
  if (immovable2) return [-v1 * e, 0];

  const newV1 = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
  const newV2 = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);

  return [newV1, newV2];
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
  //e.preventDefault();
  let [x, y] = getTouchPosition(e);
  
  mouse.lastTime = performance.now();
  mouse.x = x;
  mouse.y = y;
  mouse.dx = 0;
  mouse.dy = 0;
  mouse.lastX = x;
  mouse.lastY = y;
  mouse.down = true;
  
  let curTouch = performance.now();
  
  if(curTouch - mouse.lastTouches[0] <= 200) reset();
  
  if(curTouch - mouse.lastTouches[1] <= 400 && 
    mouse.lastTouches[1] - mouse.lastTouches[0] <= 400){ 
    debugEnabled = !debugEnabled;
    mouse.lastTouches = [];
  }
  
  mouse.lastTouches.unshift(curTouch);
  if(mouse.lastTouches.length > 2) mouse.lastTouches.pop();

});
canvas.addEventListener("touchmove", (e) => {
  //e.preventDefault();
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

function frameDelay() {
  return new Promise((resolve, reject) => {
    window.requestAnimationFrame(resolve);
  });
}

function reset() {
  for(let letter of elements) letter.reset();
}

function setFont(context = ctx) {
  context.font = fontSize + "px 'Courier New'";
  //context.font = fontSize + "px monospace";
  //context.font = fontSize + "px arial";
}


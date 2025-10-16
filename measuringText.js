function getExactRect(character) {
  let field = document.createElement("canvas");
  let fCtx = field.getContext("2d");
  
  field.width = charW * 3;
  field.height = charH * 3;
  
  fCtx.font = fontSize + "px 'Courier New'";
  fCtx.fillText(character, charW, charH * 2);
  
  let top = 99999;
  let bottom = 0;
  let left = 99999;
  let right = 0;
  let aveAlpha = 0;
  
  let data = fCtx.getImageData(0, 0, field.width, field.height).data;
  
  for(let x = 0; x < field.width; x++){
    for(let y = 0; y < field.height; y++){
      let alpha = getPixel(x, y);
      if(alpha > 1){
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
        aveAlpha += alpha;
      }
    }
  }
  
  let actionWidth = right - left + 1;
  let actionHeight = bottom - top + 1;
  
  return [
    left - charW, 
    top - charH, 
    right - charW + 1, 
    bottom - charH + 1,
    aveAlpha / (actionWidth * actionHeight)
  ];
  
  function getPixel(x, y) {
    return data[(x + y * field.width) * 4 + 3];
  }
}
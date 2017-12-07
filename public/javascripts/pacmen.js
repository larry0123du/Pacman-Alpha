var gs; // size of one grid
var rad; // radius of pacman
var border; // borders of the pacman world
var gameState;

var HOST = location.origin.replace(/^http/, 'ws');
var ws = new WebSocket(HOST);

ws.onopen = function(event) {
    var msg = {
        type: 'multi player',
        id: local_data
    };
    ws.send(JSON.stringify(msg));
    ws.onmessage = function(event) {
        gameState = event.data;
//       s = JSON.parse(event.data);
//       // preserve newlines, etc - use valid JSON
//         s = s.replace(/\\n/g, "\\n")
//                        .replace(/\\'/g, "\\'")
//                        .replace(/\\"/g, '\\"')
//                        .replace(/\\&/g, "\\&")
//                        .replace(/\\r/g, "\\r")
//                        .replace(/\\t/g, "\\t")
//                        .replace(/\\b/g, "\\b")
//                        .replace(/\\f/g, "\\f");
// // remove non-printable and other non-valid JSON chars
//         s = s.replace(/[\u0000-\u0019]+/g,"");
//         var gameState = JSON.parse(s);
      drawBoard(gameState);
    }
}
/*
 * Draw the board
 */
 window.onload=function() {
   canv=document.getElementById("gc");
   canv.width = window.innerWidth;
   canv.height = window.innerHeight;
   ctx=canv.getContext("2d");
   document.addEventListener("keydown",keyPush);
 }

function drawBoard(gameState) {
    gs = Math.min((canv.width/38), (canv.height/30));
    rad = 0.5*gs;
    // ctx.fillStyle="black";
    // ctx.fillRect(0,0,canv.width,canv.height);
    border = {
        left:(canv.width-34*gs)/2,
        right:(canv.width+34*gs)/2,
        top:(canv.height-21*gs)/2,
        bottom:(canv.height+21*gs)/2
    };
    pos = {
      x: 356,
      y: 207
    }
    drawPacman(pos);
    pos.x = 400;
    pos.y = 300;
    drawPacman(pos);

    console.log("border" + border)
    console.log("gameState " + gameState);
    ctx.strokeStyle="white";
    roundedRect(border.left - gs/2, border.top - gs/2, border.right - border.left + gs, border.bottom - border.top + gs, gs);
    roundedRect(border.left, border.top, border.right - border.left, border.bottom - border.top, gs);

    for(var i=0; i<gameState.length; ++i)
    {
        let pos = getAbsPos({x:Math.floor(i/33), y:i%33});
        // console.log(pos)
        if(gameState[i] == 'S'){
            drawSuperFoodDot(pos);
        }
        else if(gameState[i] =='P'){
            console.log("Relative pos: " + i/33 + " " + i % 33)
            console.log("pos: " + pos);
            drawPacman(pos);
        }
        else{
        }
    }

    // for (var i = 0; i < gameState.length; i++) {
    //   for (var j = 0; i < gameState[i].length; i++) {
    //       let pos = getAbsPos({x:i,y:j});
    //       console.log(pos)
    //       if (gameState[i][j] == 'S') {
    //         drawSuperFoodDot(pos);
    //       }
    //       else if (gameState[i][j] == 'P') {
    //         drawPacman(pos);
    //       }
    //       else {
    //         gameState[i][j] = 'N';
    //       }
    //   }
    // }
}

function getAbsPos(pos) {
    return {
        x: border.left + (pos.y + 1) * gs,
        y: border.top + (pos.x + 1) * gs
    };
}

function drawSuperFoodDot(pos) {
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.moveTo(pos.x, pos.y);
    ctx.arc(pos.x, pos.y, rad/2, 0, 2*Math.PI, false);

    ctx.closePath();
    ctx.fill();
}
function drawPacman(pos, mouthClose=false) {
    ctx.fillStyle="yellow";
    ctx.beginPath();
    var startingAngle;
    var endAngle;
    startingAngle = 0;
    endAngle = 2*Math.PI;
    ctx.moveTo(pos.x, pos.y);
    console.log("Pos in drawPacman: " + pos.x + " " + pos.y);
    ctx.arc(pos.x, pos.y, rad, startingAngle, endAngle, false);
    ctx.closePath();
    ctx.fill();
}

function roundedRect(x, y, width, height, radius) {
    ctx.strokeStyle="white";
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    ctx.lineTo(x + width - radius, y + height);
    ctx.arcTo(x + width, y + height, x + width, y + height-radius, radius);
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);

    ctx.closePath();
    ctx.stroke();
}

function keyPush(evt) {
  var msg = {
    type: 'move',
    id: local_data
  };
switch(evt.keyCode) {
  case 37:
        msg["action"] = "WEST"
    break;
  case 38:
        msg["action"] = "NORTH"
    break;
  case 39:
        msg["action"] = "EAST"
    break;
  case 40:
        msg["action"] = "SOUTH"
    break;
  }
}

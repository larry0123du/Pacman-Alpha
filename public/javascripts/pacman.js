const gs=20; // size of one grid
const rad = 0.5*gs;
var realWidth, realHeight;
var border;

var px, py; // Starting position of Pacman. Note that in this system, x is the col number and y is the row number
var mouthClose = false;

var walls;
var gridWidth, gridHeight;

var gameState;
var agents;
var pacmans, ghosts;
var endGame = false;
var intervalId = null;


var socket;

SCARED_TIMER = 60; // Set the scared time
// define directions
var dirs = {
    SOUTH: {x:1, y:0},
    NORTH: {x:-1, y:0},
    EAST: {x:0, y:1},
    WEST: {x:0, y:-1},
    NONE: {x:0, y:0}
};

window.onload=function() {
	canv=document.getElementById("gc");
	canv.width = window.innerWidth;
	canv.height = window.innerHeight;

	ctx=canv.getContext("2d");
    document.addEventListener("keydown",keyPush);
    init();
	intervalId = setInterval(game,600);

}

function copyPos(pos) {
    return {
        x:pos.x,
        y:pos.y
    };
}

class Character {
    constructor(id, color, pos, speed) {
        this.id = id;
        this.color = color;
        this.initPos = copyPos(pos);
        this.pos = pos;
        this.lastPos = null;
        this.initSpeed = speed;
        this.speed = speed;
        this.dir = dirs.NONE;
    }

    getPos() {return this.pos;}

    move() {
        this.lastPos = copyPos(this.pos);

        this.pos.x += this.speed * this.dir.x;
        this.pos.y += this.speed * this.dir.y;
        if (isOutOfBound(this.pos) || isWall(this.pos)) {
            if (this.speed == 1) {
                this.pos = copyPos(this.lastPos);
                this.dir = dirs.NONE;
                return;
            }
            else {
                this.halfSpeed();
                this.move();
            }
        }
    }

    doubleSpeed(){this.speed *= 2;}

    halfSpeed() {this.speed /= 2;}

    reset() {
        this.pos = copyPos(this.initPos);
        this.speed = this.initSpeed;
    }
}

class Ghost extends Character {
    constructor(id, color, pos, speed, frightened) {
        super(id, color, pos, speed);
        
        this.dir = dirs[Object.keys(dirs)[Math.floor(Math.random() * 4)]];
        this.frightened = frightened;
        this.timer = 0;
        this.initColor = color;
    }

    move() {
        this.dir = dirs[Object.keys(dirs)[Math.floor(Math.random() * 4)]];
        super.move();
    }

    reset() {
        super.reset();
        this.timer = 0;
        this.frightened = false;
        this.color = this.initColor;
    }

    scare() {
        this.frightened = true;
        this.timer = SCARED_TIMER;
        this.color = 'blue';
    }

    isScared() {
        return this.frightened;
    }

    decrementTimer() {
        this.timer--;
        if (this.timer == 0) {
            this.color = this.initColor;
            this.frightened = false;
        }
    }
}

class Pacman extends Character {
    constructor(id, pos, speed) {
        super(id, "yellow", pos, speed);
        this.lives = 1;
        this.score = 0;
    }

    move() {
        super.move();
        if (isFood(this.pos)) {
            this.score += 100;
            console.log(this.score);
        }
		if (isSuperFood(this.pos)) {
			this.score += 100;
			console.log(this.score);
			agents.forEach(agent => {
				if (agent instanceof Ghost) {
					agent.scare();
				}
			});
		}
    }

    decrementLives() {
        this.lives--;
    }

    alive() {
        return this.lives > 0;
    }

    reset() {
        this.dir = dirs.NONE;
        super.reset();
    }
}

function init() {
    socket = io.connect('http://localhost:3001');

    ctx.fillStyle="black";
    ctx.fillRect(0,0,canv.width,canv.height);
    realWidth = Math.floor(canv.width/gs) * gs;
    realHeight = Math.floor(canv.height/gs) * gs;
    border = {
        left:2.5*gs,
        right:realWidth - 2.5*gs,
        top:2.5*gs,
        bottom:realHeight - 2.5*gs
    };
    gridWidth = (border.right - border.left)/gs - 1;
    gridHeight = (border.bottom - border.top)/gs - 1;

    gameState = Array(gridHeight).fill().map(
        () => Array(gridWidth).fill('F'));
	gameState[Math.floor(gridHeight/2)][Math.floor(gridWidth/2)] = 'S';

    ctx.strokeStyle="white";
    // substantiate the walls
    walls = [
        // starts (1, 2)
        {
            x: 1,
            y: 0,
            width: 1,
            length: 5
        },
        {
            x: 10,
            y: 8,
            width: 1,
            length: 10
        }
    ];

    var p1 = new Pacman(1, {x:0, y:0}, 1);
    var g1 = new Ghost(1, "red", {x:3, y:4}, 1, false);
    agents = [p1, g1];
    pacmans = [p1];
    ghosts = [g1];
    
    roundedRect(border.left - gs/2, border.top - gs/2, border.right - border.left + gs, border.bottom - border.top + gs, gs);
    roundedRect(border.left, border.top, border.right - border.left, border.bottom - border.top, gs);
    
    drawAgents();
    drawWalls();
    drawFoods();
}

function drawFoods() {
    // starting from the top-left corner
    
    ctx.fillStyle = "white";
    // ctx.beginPath();
    
    for (var i = 0; i < gameState.length; i++) {
        for (var j = 0; j < gameState[i].length; j++) {
            if (gameState[i][j] === 'F') {
                let pos = getAbsPos({x:i,y:j});
                drawFoodDot(pos);
            }
			if (gameState[i][j] == 'S') {
				let pos = getAbsPos({x:i,y:j});
				drawSuperFoodDot(pos);
			}
        }
    }
}

function drawFoodDot(pos) {
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.moveTo(pos.x, pos.y);
    ctx.arc(pos.x, pos.y, rad/4, 0, 2*Math.PI, false);

    ctx.closePath();
    ctx.fill();
}
function drawSuperFoodDot(pos) {
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.moveTo(pos.x, pos.y);
    ctx.arc(pos.x, pos.y, rad/2, 0, 2*Math.PI, false);

    ctx.closePath();
    ctx.fill();
}

function drawWalls() {
    off_x = border.left;
    off_y = border.top;

    ctx.beginPath();
    ctx.fillStyle="black";
    ctx.strokeStyle="white";
    for (var i = 0; i < walls.length; i++) {
        let curr_x = off_x + (walls[i].x + 1) * gs;
        let curr_y = off_y + (walls[i].y + 1) * gs;

        ctx.moveTo(curr_x, curr_y);
        ctx.fillRect(curr_x - gs/2, curr_y - gs/2, walls[i].width*gs, walls[i].length*gs);
        roundedRect(curr_x - gs/3
        , curr_y - gs/3, 
        walls[i].width * gs - gs/3,
        walls[i].length * gs - gs/3,
        walls[i].width * gs/5);

        for (var k = 0; k < walls[i].length; k++) {
            for (var j = 0; j < walls[i].width; j++) {
                gameState[walls[i].y + k][walls[i].x + j] = 'W';
            }
        }
    }

    ctx.closePath();
}

function isWall(pos) {
    return gameState[pos.x][pos.y] === 'W';
}

function isFood(pos) {
    return gameState[pos.x][pos.y] === 'F';
}

function isSuperFood(pos) {
	return gameState[pos.x][pos.y] == 'S';
}

function isOutOfBound(pos) {
    return (pos.x < 0 || pos.x >= gridHeight || pos.y < 0 || pos.y >= gridWidth);
}

function getAbsPos(pos) {
    return {
        x: border.left + (pos.y + 1) * gs,
        y: border.top + (pos.x + 1) * gs
    };
}

function getGhostAtPos(pos) {
    agents.forEach(agent => {
        if (agent instanceof Ghost) {
            agentPos = agent.getPos();
            if (agentPos.x == pos.x && agentPos.y == pos.y) {
                return agent;
            }
        }
    });
    return null;
}

function print_pos(agent) {
    console.log(((agent instanceof Pacman)?"Pacman ":"Ghost ") + agent.id
     + ": x - " + agent.pos.x + " y - " + agent.pos.y);
}

function updateAgents() {
    agents.forEach(agent => {
        agent.move();
		if (agent instanceof Ghost && agent.isScared()) {
			agent.decrementTimer();
			console.log(agent.timer);
		}
    });
} 

function drawAgents() {
    pacmans.forEach(pacman => {
        drawPacman(pacman);
    });
    ghosts.forEach(ghost => {
        drawGhost(ghost);
    });
}

function drawPacman(pacman, mouthClose=false) {
    pos = pacman.getPos();
    // if ((ghost = getGhostAtPos(pos)) != null) {
    //     handle_collision(pacman, ghost);
    // }
    gameState[pos.x][pos.y] = 'P';
    ctx.fillStyle="yellow";
    ctx.beginPath();
    var startingAngle;
    var endAngle;
    startingAngle = 0;
    endAngle = 2*Math.PI;
    real_pos = getAbsPos(pos);
    ctx.moveTo(real_pos.x, real_pos.y);
    ctx.arc(real_pos.x, real_pos.y, rad, startingAngle, endAngle, false);
    ctx.closePath();
    ctx.fill();
}

function drawGhost(ghost) {
    pos = ghost.getPos();
    if (gameState[pos.x][pos.y] === 'F') {
        // Ghost does not eat the food
        gameState[pos.x][pos.y] = 'G';
    }
    
	else if (gameState[pos.x][pos.y] == 'S') {
		gameState[pso.x][pos.y] = 'X';
	}
    // else if (gameState[pos.x][pos.y] === 'P') {
    //     handle_collision(agents[0], ghost);
    // }
    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    abs_pos = getAbsPos(pos);
    curr_pos = {
        x: abs_pos.x - gs/2,
        y: abs_pos.y + gs/2
    };
    ctx.moveTo(curr_pos.x, curr_pos.y);
    curr_pos.y -= gs/2;
    ctx.lineTo(curr_pos.x, curr_pos.y);
    curr_pos.y -= gs/3
    ctx.bezierCurveTo(curr_pos.x, curr_pos.y, 
    curr_pos.x + gs/4, curr_pos.y - gs/6,
    curr_pos.x + gs/2, curr_pos.y - gs/6);
    curr_pos.x += gs/2;
    curr_pos.y -= gs/6;

    ctx.bezierCurveTo(curr_pos.x + gs/4, curr_pos.y, 
    curr_pos.x + gs/2, curr_pos.y + gs/6,
    curr_pos.x + gs/2, curr_pos.y + gs/2);
    curr_pos.x += gs/2;
    curr_pos.y += gs/2;
    ctx.lineTo(curr_pos.x, curr_pos.y + gs/2);
    curr_pos.y += gs/2;
    ctx.lineTo(curr_pos.x - gs, curr_pos.y);

    ctx.closePath();
    ctx.fill();
}

function undrawAgents() {
    ctx.fillStyle = "black";
    agents.forEach(agent => {
        rel_pos = agent.getPos();
        real_pos = getAbsPos(rel_pos);
        ctx.fillRect(real_pos.x - gs/2, real_pos.y - gs/2, gs, gs);

        if (agent instanceof Ghost) {
            if (gameState[rel_pos.x][rel_pos.y] === 'G') {
                gameState[rel_pos.x][rel_pos.y] = 'F';
                drawFoodDot(real_pos);
            }
            if (gameState[rel_pos.x][rel_pos.y] === 'X') {
                gameState[rel_pos.x][rel_pos.y] = 'S';
                drawSuperFoodDot(real_pos);
            }
        }
        else {
            gameState[rel_pos.x][rel_pos.y] = 'N';
        }
    });
}

function roundedRect(x, y, width, height, radius) {
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

function check_collision(pacman, ghost) {
    ppos = pacman.getPos();
    gpos = ghost.getPos();
    
    console.log("ppos: " + JSON.stringify(ppos));
    console.log('gpos: ' + JSON.stringify(gpos));

    if (Math.abs(ppos.x - gpos.x) < 1 && Math.abs(ppos.y - gpos.y) < 1) {
        return true;
    }
    plast = pacman.lastPos;
    glast = ghost.lastPos;

    console.log('plastPos: ' + JSON.stringify(plast));
    console.log('glastPos: ' + JSON.stringify(glast));

    if (ppos.x == plast.x && ppos.x == gpos.x && plast.x == glast.x) {
        // The pacman and the ghost were traveling on the same row
        if ((plast.y - glast.y) * (ppos.y - gpos.y) < 0) {
            // Their paths intersect
            console.log("collision along row");
            return true;
        }
    }
    else if (ppos.y == plast.y && ppos.y == gpos.y && plast.y == glast.y) {
        // traveling on the same column
        if ((plast.x - glast.x) * (ppos.x - gpos.x) < 0) {
            console.log("collision along column");
            return true;
        }
    }
    return false;
}

function handle_collision(pacman, ghost) {
    //check if ghost is frightened
    if (ghost.isScared()) {
        ghost.reset();
        pacman.score += 200;
    }
    else {	
    // Collision w/ Pacman
        pacman.decrementLives();
        if (!pacman.alive()) {
            // Game is over
            console.log("Game Over");
            var scores = {id:pacman.id, score:pacman.score};
            socket.emit('score', scores);

            clearInterval(intervalId);
            exit();
        }
        pacman.reset();
    }

    print_pos(pacman);
    print_pos(ghost);
}

function game() {
    undrawAgents();
    updateAgents();
    pacmans.forEach(pacman => {
        ghosts.forEach(ghost => {
            if (check_collision(pacman, ghost)) {
                handle_collision(pacman, ghost);
            }
        });
    });
    // // Collision w/ Pacman
    // agents[0].decrementLives();
    // if (!agents[0].alive()) {
    //     // Game is over
    //     console.log("Game Over");
    //     var scores = {id:agent[0].id, score:agent[0].score};
    //     socket.emit('scores', scores);
    // }
    // agents[0].reset();
    drawAgents();
}

function keyPush(evt) {
	switch(evt.keyCode) {
		case 37:
			agents[0].dir = dirs.WEST;
			break;
		case 38:
            agents[0].dir = dirs.NORTH;
			break;
		case 39:
            agents[0].dir = dirs.EAST;
			break;
		case 40:
            agents[0].dir = dirs.SOUTH;
			break;
	}
}
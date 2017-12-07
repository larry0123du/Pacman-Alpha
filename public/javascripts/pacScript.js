        var gs; // size of one grid
        var rad; // radius of pacman
        var realWidth, realHeight;
        var border; // borders of the pacman world

        var px, py; // Starting position of Pacman. Note that in this system, x is the col number and y is the row number
        var mouthClose = false; // mouth of the pacman

        var walls; // locations of the walls
        var gridWidth, gridHeight; // The width and the height of the pacman world

        var gameState; // matrix representation of the pacman world
        var agents; // a list of all the agents in the pacman world
        var pacmans, ghosts; // list of pacman agents and ghost agents
        var foodCounter = 0; //holds number of food left on the map
        var gameTerminate = false;
        var socket;
        var socket2;

        var HOST = location.origin.replace(/^http/, 'ws');
        var ws = new WebSocket(HOST);

        ws.onopen = function(event) {
            // var msg = {
            //     type: 'single player',
            //     id: local_data
            // };
            // console.log("ID:"+local_data);
            // console.log(JSON.stringify(msg));
            // ws.send(JSON.stringify(msg));
        }

        var intervalID;
        console.log("DATA:"+local_data);



        SCARED_TIMER = 30; // Set the scared time
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
            // keep running the game
            intervalID = setInterval(game,450);
		}

        function copyPos(pos) {
            return {
                x:pos.x,
                y:pos.y
            };
        }

        function isLegalMove(pos) {
            return (!isOutOfBound(pos) && !isWall(pos));
        }

        function findBestMove(pos, op_pos, isFrightened) {
            // find the best direction to move base on the score returned by minimax
            var maxScore = -1000000;
            var maxMove = null;
            for (i in dirs) {
                let direction = copyPos(dirs[i]);
                let newPos = {
                    x: pos.x + direction.x,
                    y: pos.y + direction.y
                };
                if (!isLegalMove(newPos)) continue;
                if (checkCollision(newPos, op_pos, pos, op_pos)) {return direction;}

                let newScore = minimax(newPos, op_pos, false, 4, isFrightened);

                // console.log("maxMove: " + JSON.stringify(maxMove) + " maxScore: " + maxScore);

                // console.log(JSON.stringify(newPos) + " " + newScore);
                if (maxMove == null) {
                    maxScore = newScore;
                    maxMove = copyPos(direction);
                }
                else {
                    if (maxScore < newScore) {
                        maxMove = copyPos(direction);
                        maxScore = newScore;
                    }
                }
            }
            // console.log(maxMove);
            return maxMove;
        }

        function minimax(pos, op_pos, isMax, depth, isFrightened) {
            if (depth == 0) {
                let alpha = isFrightened?-1:1;
                return alpha*evaluate(pos, op_pos);
            }
            if (isMax) {
                // Maxer's move
                // console.log("Ghost's turn at depth " + depth);
                var maxScore = -1000000;

                for (i in dirs) {
                    let direction = copyPos(dirs[i]);
                    let newPos = {
                        x: pos.x + direction.x,
                        y: pos.y + direction.y
                    };
                    // console.log("new ghost pos " + JSON.stringify(newPos));
                    if (!isLegalMove(newPos)) {
                        // console.log("illegal position for ghost");
                        continue;
                    }
                    if (checkCollision(newPos, op_pos, pos, op_pos)) {
                        if (isFrightened) {
                            continue;
                        }
                        else {
                            maxScore = 0;
                            break;
                        }
                    }
                    let newScore = minimax(newPos, op_pos, false, depth - 1, isFrightened);
                    if (maxScore < newScore) {
                        maxScore = newScore;
                    }
                }
                // console.log("ghost's max score: " + maxScore + " at depth " + depth);
                return maxScore;
            }
            else {
                // Minner's move
                // console.log("Pacman's turn at depth " + depth);
                var minScore = 1000000;
                var minMove = null;
                for (i in dirs) {
                    let direction = copyPos(dirs[i]);
                    let newOpPos = {
                        x: op_pos.x + direction.x,
                        y: op_pos.y + direction.y
                    };
                    if (!isLegalMove(newOpPos)) {
                        // console.log("illegal position for pacman");
                        continue;
                    }
                    if (checkCollision(pos, newOpPos, pos, op_pos)) {
                        if (isFrightened) {
                            minScore = 0;
                            break;
                        }
                        else {
                            continue;
                        }
                    }
                    let newScore = minimax(pos, newOpPos, true, depth - 1, isFrightened);
                    if (minMove == null) {
                        minScore = newScore;
                        minMove = copyPos(direction);
                    }
                    else {
                        if (minScore > newScore) {
                            minMove = copyPos(direction);
                            minScore = newScore;
                        }
                    }
                }
                // console.log("pacman's Move: " + JSON.stringify(minMove) + " with Score: " + minScore + " at depth " + depth);
                return minScore;
            }
        }

        function evaluate(pos, op_pos) {
            // return the negative value of manhattan distance
            return -1 * (Math.abs(pos.x - op_pos.x) + Math.abs(pos.y - op_pos.y));
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
                if (!isLegalMove(this.pos)) {
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
                this.random = true;
                this.dir = dirs.NONE;
                this.frightened = frightened;
                this.timer = 0;
                this.initColor = color;
            }

            move() {
                if (this.random) {
                    this.dir = dirs[Object.keys(dirs)[Math.floor(Math.random() * 4)]];
                }
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

        class BasicGhost extends Ghost {
            constructor(id, color, pos, speed, frightened) {
                super(id, color, pos, speed, frightened);
                this.random = false;
            }

            move() {
                if (Math.random() <= 0.2) {
                    this.dir = dirs[Object.keys(dirs)[Math.floor(Math.random() * 4)]];
                }
                else {
                    this.dir = findBestMove(this.pos, pacmans[0].lastPos, this.isScared());
                    if (this.dir == null) {
                        this.dir = dirs.NONE;
                    }
                }
                super.move();
            }
        }

        class Pacman extends Character {
            constructor(id, pos, speed) {
                super(id, "yellow", pos, speed);
                this.lives = 3;
                this.score = 0;
            }

            move() {
                super.move();
                if (isFood(this.pos)) {
                    foodCounter--;
                    this.score += 100;
                    //console.log(this.score);
                }
				if (isSuperFood(this.pos)) {
          foodCounter--;
					//this.score += 100;
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

        /*
         * Init function that initialize the basic configs of the pacman world
         */
        function init() {
            ws.onmessage = function(event) {
                console.log('Received: ', event.data);
            };
            // socket = io();
            // socket = io('https://pacrussh.herokuapp.com:3001');
            //socket.connect('http://localhost:3001');
			gs = Math.min((canv.width/38), (canv.height/30));
            rad = 0.5*gs;

            // draw the background canvas
			ctx.fillStyle="black";
            ctx.fillRect(0,0,canv.width,canv.height-50);

            realWidth = Math.floor(canv.width/gs) * gs;
            realHeight = Math.floor((canv.height-50)/gs) * gs;

            border = {
                left:(canv.width-34*gs)/2,
                right:(canv.width+34*gs)/2,
                top:(canv.height-21*gs)/2,
                bottom:(canv.height+21*gs)/2
            };
            gridWidth = 33;
            gridHeight = 20;

            gameState = Array(gridHeight).fill().map(
                () => Array(gridWidth).fill('F'));
			gameState[10][16] = 'N';
			gameState[11][15] = 'N';
			gameState[11][16] = 'N';
			gameState[11][17] = 'N';
			gameState[12][15] = 'N';
			gameState[12][16] = 'N';
			gameState[12][17] = 'N';
			gameState[8][0] = 'N';
			gameState[8][1] = 'N';
			gameState[9][0] = 'N';
			gameState[9][1] = 'N';
			gameState[10][0] = 'N';
			gameState[10][1] = 'N';
			gameState[8][31] = 'N';
			gameState[8][32] = 'N';
			gameState[9][31] = 'N';
			gameState[9][32] = 'N';
			gameState[10][31] = 'N';
			gameState[10][32] = 'N';
			gameState[4][3] = 'S';
			gameState[4][29] = 'S';
			gameState[18][6] = 'S';
			gameState[18][26] = 'S';
			gameState[6][16] = 'S';

            ctx.strokeStyle="white";
            // substantiate the walls
            walls = [
                // starts (1, 2)
                {x: 1, y: 1,width: 2,length: 3},
                {x: 4, y: 1,width: 3,length: 3},
                {x: 8, y: 1,width: 2,length: 3},
                {x: 11, y: 1,width: 4,length: 1},
                {x: 16, y: 0,width: 1,length: 4},
                {x: 18, y: 1,width: 4,length: 1},
                {x: 23, y: 1,width: 2,length: 3},
                {x: 26, y: 1,width: 3,length: 3},
                {x: 30, y: 1,width: 2,length: 3},
                {x: 11, y: 3,width: 1,length: 1},
                {x: 13, y: 3,width: 2,length: 1},
                {x: 18, y: 3,width: 2,length: 1},
                {x: 21, y: 3,width: 1,length: 1},
                {x: 1, y: 5,width: 2,length: 1},
                {x: 4, y: 5,width: 1,length: 4},
                {x: 6, y: 5,width: 5,length: 1},
                {x: 12, y: 5,width: 2,length: 1},
                {x: 15, y: 5,width: 3,length: 1},
                {x: 19, y: 5,width: 2,length: 1},
                {x: 22, y: 5,width: 5,length: 1},
                {x: 28, y: 5,width: 1,length: 4},
                {x: 30, y: 5,width: 2,length: 1},
                {x: 8, y: 6,width: 1,length: 2},
                {x: 13, y: 6,width: 1,length: 2},
                {x: 19, y: 6,width: 1,length: 2},
                {x: 24, y: 6,width: 1,length: 2},
                {x: 0, y: 7,width: 3,length: 1},
                {x: 5, y: 7,width: 2,length: 1},
                {x: 10, y: 7,width: 2,length: 1},
                {x: 15, y: 7,width: 1,length: 2},
                {x: 17, y: 7,width: 1,length: 2},
                {x: 21, y: 7,width: 2,length: 1},
                {x: 26, y: 7,width: 2,length: 1},
                {x: 30, y: 7,width: 3,length: 1},
                {x: 2, y: 8,width: 1,length: 3},
                {x: 30, y: 8,width: 1,length: 3},
                {x: 6, y: 9,width: 2,length: 2},
                {x: 9, y: 9,width: 4,length: 2},
                {x: 20, y: 9,width: 4,length: 2},
                {x: 25, y: 9,width: 2,length: 2},
                {x: 4, y: 10,width: 1,length: 1},
                {x: 14, y: 10,width: 2,length: 1},
                {x: 17, y: 10,width: 2,length: 1},
                {x: 28, y: 10,width: 1,length: 1},
                {x: 0, y: 11,width: 3,length: 1},
                {x: 14, y: 11,width: 1,length: 2},
                {x: 18, y: 11,width: 1,length: 2},
                {x: 30, y: 11,width: 3,length: 1},
                {x: 4, y: 12,width: 6,length: 2},
                {x: 11, y: 12,width: 2,length: 1},
                {x: 20, y: 12,width: 2,length: 1},
                {x: 23, y: 12,width: 6,length: 2},
                {x: 1, y: 13,width: 2,length: 1},
                {x: 14, y: 13,width: 5,length: 1},
                {x: 30, y: 13,width: 2,length: 1},
                {x: 1, y: 14,width: 1,length: 2},
                {x: 11, y: 14,width: 2,length: 1},
                {x: 20, y: 14,width: 2,length: 1},
                {x: 31, y: 14,width: 1,length: 2},
                {x: 3, y: 15,width: 4,length: 1},
                {x: 8, y: 15,width: 8,length: 1},
                {x: 17, y: 15,width: 8,length: 1},
                {x: 26, y: 15,width: 4,length: 1},
                {x: 1, y: 17,width: 5,length: 2},
                {x: 7, y: 17,width: 3,length: 2},
                {x: 11, y: 17,width: 2,length: 2},
                {x: 14, y: 17,width: 1,length: 2},
                {x: 16, y: 17,width: 1,length: 3},
                {x: 18, y: 17,width: 1,length: 2},
                {x: 20, y: 17,width: 2,length: 2},
                {x: 23, y: 17,width: 3,length: 2},
                {x: 27, y: 17,width: 5,length: 2}
            ];
            var p1 = new Pacman(1, {x:0, y:0}, 1);
            var g1 = new BasicGhost(2, "red", {x:11, y:15}, 1, false);
            var g2 = new Ghost(3, "pink", {x:12, y:15}, 1, false);
            var g3 = new BasicGhost(4, "cyan", {x:11, y:17}, 1, false);
            var g4 = new Ghost(4, "orange", {x:12, y:17}, 1, false);
            agents = [p1, g1, g2, g3, g4];
            pacmans = [p1];
            ghosts = [g1, g2, g3, g4];

            roundedRect(border.left - gs/2, border.top - gs/2, border.right - border.left + gs, border.bottom - border.top + gs, gs);
            roundedRect(border.left, border.top, border.right - border.left, border.bottom - border.top, gs);

            drawAgents();
            drawWalls();
            drawFoods();

            for (var i = 0; i < gameState.length; i++) {
            		for (var j = 0; j < gameState[i].length; j++) {
                    if (gameState[i][j] === 'F' || gameState[i][j] === 'S') {
                    		foodCounter++;
                    }
								}
						}
        }

        /*
         * update the user status that is displayed on the screen
         */
		function updateBoard() {
			ctx.fillStyle = "black";
			ctx.fillRect(0,canv.height-50, canv.width, 50);
			ctx.font = "15px Lucida Console";
			ctx.fillStyle = "white";
			ctx.fillText("Score: " + agents[0].score, canv.width/2, (canv.height-35));
			ctx.fillText("Lives: " + agents[0].lives, canv.width/2, (canv.height-20));
      if (foodCounter == 0) {
					console.log("GAME OVER");
					//console.log(foodCounter)
          gameTerminate = true;
          var scores = {userid: local_data, id:pacman.id, score:pacman.score};
        //   socket.emit('score', scores);
        ws.send(JSON.stringify(scores));

          drawScore();
          //window.location.href = '/profile';
			}
    }

        // draw foods, called in the init function
        function drawFoods() {
            ctx.fillStyle = "white";
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

        // draw a single food dot at position (pos)
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
				if ((walls[i].length == 1 || walls[i].length == 2)&& walls[i].width > 1) {
						roundedRect(curr_x - gs/3
						, curr_y - gs/3,
						walls[i].width * gs - gs/3,
						walls[i].length * gs - gs/3,
						walls[i].width * gs/20);
				} else {
						roundedRect(curr_x - gs/3
						, curr_y - gs/3,
						walls[i].width * gs - gs/3,
						walls[i].length * gs - gs/3,
						walls[i].width * gs/5);
				}
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

        function updateAgents() {
            agents.forEach(agent => {
                agent.move();
				if (agent instanceof Ghost && agent.isScared()) {
					agent.decrementTimer();
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
            // console.log(pos);
			if (gameState[pos.x][pos.y] === 'F') {
                // Ghost does not eat the food
                gameState[pos.x][pos.y] = 'G';
            }
			else if (gameState[pos.x][pos.y] == 'S') {
				gameState[pos.x][pos.y] = 'X';
			}
            else if (gameState[pos.x][pos.y] === 'G' || gameState[pos.x][pos.y] === 'X') {
                ghost.pos = copyPos(ghost.lastPos);
            }
            pos = ghost.getPos();

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
            agents.forEach(agent => {
                rel_pos = agent.getPos();
                real_pos = getAbsPos(rel_pos);

                ctx.fillStyle = "black";
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

        function drawScore() {
					clearInterval(intervalID);
					undrawAgents();
					ctx.fillStyle="black";
					ctx.fillRect(0,0,canv.width,canv.height);

					ctx.font = "75px Lucida Console";
					ctx.fillStyle = "white";
					ctx.fillText("Game Over", (canv.width/2)-200, (canv.height/2)-75);
          ctx.font = "70px Lucida Console";
					ctx.fillText("Score: " + agents[0].score, (canv.width/2)-200, (canv.height/2));
          //create button
					var button = document.getElementById("button");
					button.innerHTML = "Ok";
					//create event handler
					button.addEventListener ("click", function() {
					  window.location.href = '/profile';
					});
				}

        function check_collision(pacman, ghost) {
            let ppos = pacman.getPos();
            let gpos = ghost.getPos();
            let plast = pacman.lastPos;
            let glast = ghost.lastPos;
            return checkCollision(ppos, gpos, plast, glast);
        }

		function checkCollision(ppos, gpos, plast, glast) {
			if (Math.abs(ppos.x - gpos.x) < 1 && Math.abs(ppos.y - gpos.y) < 1) {
				return true;
			}
            if (ppos.x == plast.x && ppos.x == gpos.x && plast.x == glast.x) {
                // The pacman and the ghost were traveling on the same row
                if ((plast.y - glast.y) * (ppos.y - gpos.y) <= 0) {
                    // Their paths intersect
                    // console.log("collision along row");
                    return true;
                }
            }
            else if (ppos.y == plast.y && ppos.y == gpos.y && plast.y == glast.y) {
                // traveling on the same column
                if ((plast.x - glast.x) * (ppos.x - gpos.x) <= 0) {
                    // console.log("collision along column");
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
                    gameTerminate = true;
                        // var xhr = new XMLHttpRequest();
                        // xhr.open("POST", "/endGame", true);
                        // xhr.setRequestHeader('Content-Type', 'application/json');
                        // xhr.send(JSON.stringify({
                        //     score: pacman.score
                        // }));

                    var scores = {userid: local_data, id:pacman.id, score:pacman.score};
                    // socket.emit('score', scores);
                    ws.send(JSON.stringify(scores));




                    drawScore();
                    // window.location.href = '/profile';
                }
                pacman.reset();
            }

            print_pos(pacman);
            print_pos(ghost);
        }

        function print_pos(agent) {
            // console.log(((agent instanceof Pacman)?"Pacman ":"Ghost ") + agent.id
            //  + ": x - " + agent.pos.x + " y - " + agent.pos.y);
        }

        function printBoard() {
            gameState.forEach(row => {
                console.log(row.join());
            });
            console.log();
        }

		function game() {
            // printBoard();

            undrawAgents();
            updateAgents();
            updateBoard();
			pacmans.forEach(pacman => {
                ghosts.forEach(ghost => {
                    if (check_collision(pacman, ghost)) {
                        handle_collision(pacman, ghost);
                    }
                });
            });
            if (!gameTerminate) {
							   drawAgents();
						}
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

        // socket.on('ID', function(Id){
        //     console.log("ID:"+Id);
        // });

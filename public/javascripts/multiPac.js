// This script need to define the following functions:
/*
 * Definitions
 */

exports.dirs = {
    SOUTH: {x:1, y:0},
    NORTH: {x:-1, y:0},
    EAST: {x:0, y:1},
    WEST: {x:0, y:-1},
    NONE: {x:0, y:0}
};

exports.Pacman = class {
    constructor(id, color, pos) {
        this.id = id;
        this.color = color;
        this.pos = exports.copyPos(pos);

        this.lastPos = null;
        this.dir = exports.dirs.NONE;
        this.alive = true;
        
        this.isSuper = false;
        this.timer = 0;
    }

    getPos() {return this.pos;}

    move(pacmen, gameState) {
        this.lastPos = exports.copyPos(this.pos);

        this.pos.x += this.dir.x;
        this.pos.y += this.dir.y;
        if (!exports.isLegalMove(this.pos)) {
            this.pos = exports.copyPos(this.lastPos);
            this.dir = exports.dirs.NONE;
            return;
        }
        if (exports.isSuperFood(this.pos, gameState)) {
            // foodCounter--;
            this.isSuper = true;
            this.timer = -20;
            pacmen.forEach(pac => {
                if (!pac.isSuper && pac.timer == 0) {
                    pac.timer = 20;
                }
            });
        }
    }
}

exports.updatePacman = function updatePacman(p, a, pacmen, gameState) {
    if (!p.alive) {return;} // This should not happen, but just in case
    // console.log("GS:"+gameState);
    p.dir = a;
    p.move(pacmen, gameState);

    last = p.lastPos;
    pacmen.forEach(pac => {
        if (pac.id !== p.id && exports.check_collision(p, pac)) {
            exports.handle_collision(p,pac);
            return;
        }
        pacPos = pac.getPos();
        if (pacPos.x != last.x || pacPos.y != last.y) {
            gameState[last.x][last.y] = 'N';            
        }
    });
    // console.log(p.id);
    // console.log("updPac:"+JSON.stringify(p.pos));
    pos = p.getPos();
    console.log("position: " + pos.x + " " + pos.y);
    if (p.isSuper) {
        gameState[pos.x][pos.y] = 'Q';
    }
    else {
        gameState[pos.x][pos.y] = 'P';
    }
}

/*
 * Helper functions
 */

exports.isSuperFood = function isSuperFood(pos, gameState) {
    return gameState[pos.x][pos.y] == 'S';
}

exports.isOutOfBound = function isOutOfBound(pos) {
    return (pos.x < 0 || pos.x >= 20 || pos.y < 0 || pos.y >= 33);
}

exports.copyPos = function copyPos(pos) {
    return {
        x:pos.x,
        y:pos.y
    };
}

exports.isLegalMove = function isLegalMove(pos) {
    return !exports.isOutOfBound(pos);
}

exports.handle_collision = function handle_collision(p1, p2) {
    // If one pacman is super and the other isn't, the other one dies
    if (p1.isSuper && !p2.isSuper) {
        p2.alive = false;
    }
    else if (p2.isSuper && !p1.isSuper) {
        p1.alive = false;
    }
    else if (p2.isSuper && p1.isSuper) {
        p1.isSuper = false;
        p2.isSuper = false;
    }
}

exports.check_collision = function check_collision(p1, p2) {
    let p1_pos = p1.getPos();
    let p2_pos = p2.getPos();
    let p1_last = p1.lastPos;
    let p2_last = p2.lastPos;
    return exports.checkCollision(p1_pos, p2_pos, p1_last, p2_last);
}

exports.checkCollision = function checkCollision(ppos, gpos, plast, glast) {
    if (plast == null || glast == null) {
        if (Math.abs(ppos.x - gpos.x) < 1 && Math.abs(ppos.y - gpos.y) < 1) {
            return true;
        }
        return false;
    }
    if (Math.abs(ppos.x - gpos.x) < 1 && Math.abs(ppos.y - gpos.y) < 1) {
        return true;
    }
    if (ppos.x == plast.x && ppos.x == gpos.x && plast.x == glast.x) {
        // two agents were traveling on the same row
        if ((plast.y - glast.y) * (ppos.y - gpos.y) <= 0) {
            return true;
        }
    }
    else if (ppos.y == plast.y && ppos.y == gpos.y && plast.y == glast.y) {
        // traveling on the same column
        if ((plast.x - glast.x) * (ppos.x - gpos.x) <= 0) {
            return true;
        }
    }
    return false;
}


/*
 * Debugging functions
 */


exports.print_pos = function print_pos(agent) {
    // console.log(((agent instanceof Pacman)?"Pacman ":"Ghost ") + agent.id
    //  + ": x - " + agent.pos.x + " y - " + agent.pos.y);
}

exports.printBoard = function printBoard(gameState) {
    gameState.forEach(row => {
        console.log(row.join());
    });
    console.log();
}

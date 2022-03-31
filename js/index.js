var canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const sendGraph = () => {
    F = (x) => {
        return math.evaluate(document.querySelector("input").value, { x, "ln(x)": "log2(x)" });
    }

    update();
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
 function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

let viewportWidth = 60 * (1.5);
let viewportHeight = 60;

let playerCount = 8;
let currentTurn = 0;
const nextTurn = () => {
    //console.log("next turn")
    currentTurn++;
    currentTurn = currentTurn % soldiers.length;
    return currentTurn;
} 

// Returns the right boundary of the logical viewport:
function MaxX() {
    return viewportWidth / 2;
}

// Returns the left boundary of the logical viewport:
function MinX() {
    return -viewportWidth / 2;
}

// Returns the top boundary of the logical viewport:
function MaxY() {
    return viewportHeight / 2; //MaxX() * canvas.height / canvas.width;
}

// Returns the bottom boundary of the logical viewport:
function MinY() {
    return -viewportHeight / 2; //MinX() * canvas.height / canvas.width;
}

// Returns the physical x-coordinate of a logical x-coordinate:
function XC(x) {
    return (x - MinX()) / (MaxX() - MinX()) * canvas.width;
}

// Returns the physical y-coordinate of a logical y-coordinate:
function YC(y) {
    return canvas.height - (y - MinY()) / (MaxY() - MinY()) * canvas.height;
}

class Soldier {
    constructor(x = -10, y = 4, owner, ownerName = "BigBear") {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.ownerName = ownerName;
        this.loaded = false;

        this.imageSizeFactor = 0.4;
        this.logicalSize = 3;

        this.explosionFrames = [];
        this.explosionSizeFactor = 2;

        this.dead = false;
    }

    async loadImages() {
        return new Promise(resolve => {
            if (this.loaded) return resolve();

            const toLoad = 7;
            let loadedNum = 0;

            this.image = new Image();
            this.image.onload = () => {
                this.loaded = true;
                loadedNum++;
                if (loadedNum == toLoad)
                    resolve();
            }
    
            this.image.src = this.x >= 0 ? "images/soldierLeft.png" : "images/soldierRight.png";

            for (let i = 0; i <= 5; i++) {
                let img = new Image();

                img.onload = () => {
                    loadedNum++;
                    if (loadedNum == toLoad)
                        resolve();
                }
        
                img.src = "images/explosions/explosion" + i + ".png";

                this.explosionFrames.push(img);
            }
        })
    }

    draw() {
        if (!this.loaded || this.dead) return;

        const pos = {
            x: XC(this.x) - (this.image.width * this.imageSizeFactor) / 2,
            y: YC(this.y) - (this.image.height * this.imageSizeFactor) / 2
        }

        ctx.drawImage(this.image, pos.x, pos.y, this.image.width * this.imageSizeFactor, this.image.height * this.imageSizeFactor);

        ctx.save();

        ctx.font = '30px Arial';
        ctx.fillStyle = "#d1d1d1";
        
        var fontWidth = ctx.measureText(this.ownerName).width;
        var fontHeight = 30;

        var padding = 5;

        ctx.fillRect(XC(this.x) - padding - fontWidth / 2, YC(this.y) + fontHeight * 2 - padding, fontWidth + padding * 2, fontHeight + padding * 2);

        ctx.fillStyle = "#227d3c";
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        ctx.fillText(this.ownerName, XC(this.x), YC(this.y - this.logicalSize * 1.25))//this.y + (this.image.width * this.imageSizeFactor / 2)));
        ctx.fillStyle = "#000";

        ctx.restore();
    }

    async die() {
        this.dead = true;

        soldiers.splice(soldiers.indexOf(this), 1);//this.owner);

        for (let i = 0; i < this.explosionFrames.length; i++) {
            const pos = {
                x: XC(this.x) - (this.explosionFrames[i].width * this.explosionSizeFactor) / 2,
                y: YC(this.y) - (this.explosionFrames[i].height * this.explosionSizeFactor) / 2
            }

            ctx.drawImage(this.explosionFrames[i], pos.x, pos.y, this.explosionFrames[i].width * this.explosionSizeFactor, this.explosionFrames[i].height * this.explosionSizeFactor); 

            await sleep(100);
        }
    }

    isPointInside(x, y, size = this.logicalSize) {
        const left = this.x - (size / 2);
        const right = this.x + (size / 2);
        const top = this.y + (size / 2);
        const bottom = this.y - (size / 2);

        if (x > left && x < right) {
            if (y > bottom && y < top) {
                return true;
            }
        }

        return false;
    }
}


class Obstacle {
    constructor(x = 0, y = 0, radius = 5, start = 0, end = Math.PI * 2, ccw = false) {
        this.x = x;
        this.y = y;

        this.radius = radius; // physical: 40 => grid: 2.5
        this.startAngle = start;
        this.endAngle = end;
        this.ccw = ccw
    }

    draw() {
        ctx.beginPath();
        ctx.arc(XC(this.x), YC(this.y), this.radius * (40 / 2.5), this.startAngle, this.endAngle, false);
        ctx.fill();

       // ctx.drawImage(this.image, pos.x, pos.y, this.image.width * this.imageSizeFactor, this.image.height * this.imageSizeFactor);
    }

    isPointInside(x, y, radius = this.radius) {
        return (x - this.x)**2 + (y - this.y)**2 < radius**2;
    }
}

function F(x) {
    return Math.sin(x);
}

async function draw(drawFunction = true) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw:
    DrawGrid();
    DrawAxes();

    soldiers.forEach(soldier => {
        soldier.draw();
    });

    if (drawFunction) 
        await RenderFunction(F, true, soldiers[currentTurn].x, soldiers[currentTurn].y);

    nextTurn();

    //DrawAxes();

    
    // ctx.font = '12px serif';
    // ctx.fillStyle = "#000";
    // ctx.fillText(viewportHeight.toString(), 10, 20);
    // ctx.fillText(viewportWidth.toString(), 10, 40)
}

const choose = (arr) => arr[Math.random() * arr.length | 0]; 

// Returns the distance between ticks
let XTickDelta = 1;
let YTickDelta = 1;

let obstacles = [];

let obstacleSpacing = 25;
let obstacleRandomness = 20;
let obstaclePadding = 5;

for (let x = MinX() + obstaclePadding; x <= MaxX() - obstaclePadding; x += obstacleSpacing) {
    for (let y = MinY() + obstaclePadding; y <= MaxY() - obstaclePadding; y += obstacleSpacing) {
        let safeZone = 7;

        let pos = {
            x: x + Math.random() * obstacleRandomness | 0,
            y: y + Math.random() * obstacleRandomness | 0
        }
    
        let radius = getRandomInt(5, 8);
    
        if (Math.abs(pos.x) < safeZone && Math.abs(pos.y) < safeZone) {
            //obstacleSpacing -= 15;
            continue;
        }

        let rotation = getRandomArbitrary(0, Math.PI * 0.25);
    
        let start =  rotation;//getRandomArbitrary(0, Math.PI)
    
        let end = Math.PI * 2 + rotation;
        //  end = choose([Math.PI, Math.PI * 2.5]) + rotation;
    
        if (Math.random() > 0.75) {
            end = Math.PI + rotation;
        }

        obstacles.push(new Obstacle(pos.x, pos.y, radius, start, end, true))
    }
}

const soldiers = [];
const playerPadding = 5;
const placePlayers = () => {
    for (let i = 0; i < playerCount; i++) {
        let side = i % 2;
        let choosePos = true;
        while (choosePos) {

            if (side == 0) 
                var x = getRandomInt(MinX() + playerPadding, 0 - playerPadding); 
            else
                var x = getRandomInt(0 + playerPadding, MaxX() - playerPadding); 

            var y = getRandomInt(MinY() + playerPadding, MaxY() - playerPadding);

            //console.log("iteration", x, y)

            let collision = false;

            // Obstacles
            for (let i = 0; i < obstacles.length; i++) {
                if (obstacles[i].isPointInside(x, y, obstacles[i].radius + 2)) {
                    collision = true;
                    //console.log("collision", x, y)
                }
            }

            // Players
            for (let i = 0; i < soldiers.length; i++) {
                const soldier = soldiers[i];

                if (soldier.isPointInside(x, y, soldier.logicalSize + 10)) {
                    collision = true;
                    //console.log("collision player", x, y)
                }
            }

            if (!collision)
                choosePos = false;
        } 

        soldiers.push(new Soldier(x, y, i));
    }
}
placePlayers();

const gridSpacing = 5;

function DrawGrid() {
    const width = 1;

    if (Math.abs(viewportWidth) > 500 || Math.abs(viewportHeight) > 500)
        return;

    ctx.strokeStyle = "#999";

    ctx.lineWidth = width;

    for (let x = 0; x <= MaxX(); x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(XC(x), YC(MinY()));
        ctx.lineTo(XC(x), YC(MaxY()));
        ctx.stroke();
    }

    for (let x = 0; x >= MinX(); x -= gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(XC(x), YC(MinY()));
        ctx.lineTo(XC(x), YC(MaxY()));
        ctx.stroke();
    }

    for (let y = 0; y <= MaxY(); y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(XC(MinX()), YC(y));
        ctx.lineTo(XC(MaxX()), YC(y));
        ctx.stroke();
    }

    for (let y = 0; y >= MinY(); y -= gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(XC(MinX()), YC(y));
        ctx.lineTo(XC(MaxX()), YC(y));
        ctx.stroke();
    }
    
}

// DrawAxes draws the X ad Y axes, with tick marks.
function DrawAxes() {
    ctx.strokeStyle = "#000";
    const tickSpacing = gridSpacing;
    
    origin = { x: 0, y: 0};//{ x: soldiers.get(currentTurn).x, y: soldiers.get(currentTurn).y };

    ctx.save();
    ctx.lineWidth = 2;

    const lengthX = 500 / viewportWidth;
    const lengthY = 500 / viewportHeight;

    // Y axis
    ctx.beginPath();
    ctx.moveTo(XC(origin.x), YC(MinY()));
    ctx.lineTo(XC(origin.x), YC(MaxY()));
    ctx.stroke();

    // Y axis tick marks +
    var delta = YTickDelta;
    for (var i = 0; (i * delta) < MaxY(); i += tickSpacing) {
        ctx.beginPath();
        ctx.moveTo(XC(origin.x) - lengthY, YC(i * delta));
        ctx.lineTo(XC(origin.x) + lengthY, YC(i * delta));
        ctx.stroke();
    }
    // Y axis tick marks -
    var delta = YTickDelta;
    for (var i = 0; (i * delta) > MinY(); i -= tickSpacing) {
        ctx.beginPath();
        ctx.moveTo(XC(origin.x) - lengthY, YC(i * delta));
        ctx.lineTo(XC(origin.x) + lengthY, YC(i * delta));
        ctx.stroke();
    }

    // X axis
    ctx.beginPath();
    ctx.moveTo(XC(MinX()), YC(origin.y));
    ctx.lineTo(XC(MaxX()), YC(origin.y));
    ctx.stroke();

    // X tick marks +
    var delta = XTickDelta;
    for (let i = 0; (i * delta) < MaxX(); i += tickSpacing) {
        ctx.beginPath();
        ctx.moveTo(XC(i * delta), YC(origin.y) - lengthX);
        ctx.lineTo(XC(i * delta), YC(origin.y) + lengthX);
        ctx.stroke();
    }
    // X tick marks -
    var delta = XTickDelta;
    for (let i = 0; (i * delta) > MinX(); i -= tickSpacing) {
        ctx.beginPath();
        ctx.moveTo(XC(i * delta), YC(origin.y) - lengthX);
        ctx.lineTo(XC(i * delta), YC(origin.y) + lengthX);
        ctx.stroke();
    }

    const markingInterval = tickSpacing * 2;

    // Number markings
    ctx.textAlign = "center";
    ctx.font = '25px Arial';
    ctx.fillStyle = "#000";
    for (let x = MinX() - origin.x; x < MaxX() - origin.x + 1; x++){
        if (x % markingInterval == 0 && x != 0) {
            ctx.fillText(x.toString(), XC(x + origin.x), YC(origin.y + 0.5));
        }
    }
    for (let y = MinY() - origin.y; y < MaxY() - origin.y + 1; y++){
        if (y % markingInterval == 0 && y != 0) {
            ctx.fillText(y.toString(), XC(origin.x), YC(y + origin.y - 0.15));
        }
    }

    ctx.restore();
}


// When rendering, XSTEP determines the horizontal distance between points:
var XSTEP = (MaxX() - MinX()) / canvas.width / 100;

// RenderFunction(f) renders the input funtion f on the canvas.
async function RenderFunction(f, delay = true, startX, startY) {
    var first = true;

    let stepsSinceWait = 0;
    const numberInDrawBuffer = 100;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ff0000";

    let hasPlayerCollision = false, hasObstacleCollision = false;
    let canSleep = true;

    const drawFunction = async (x, constant, invert = false) => {
        if (Math.abs(x) > 5000) return;

        if (stepsSinceWait >= numberInDrawBuffer && delay) {
            if (canSleep) await sleep(0);
            
            stepsSinceWait = 0;

            ctx.stroke();
        }

        if (invert)
            var y = -f(x) + constant;
        else
            var y = f(x) + constant;

        if (typeof y != "number") return;

        if (isNaN(y)) return;

        if (y < MinY() || y > MaxY()) {
            delay = false;
        } else
        delay = true;

        if (first) {
            ctx.moveTo(XC(x), YC(y));
            first = false;
        } else {
            ctx.lineTo(XC(x), YC(y));
        }
        
        // Check for collisions
        for (let i = 0; i < soldiers.length; i++) {
            const soldier = soldiers[i];

            if (soldier.isPointInside(x, y) && soldier.owner != currentTurn && !soldier.dead) {
                hasPlayerCollision = true;

                soldier.die();
            }
        }

        // Check for obstacle collisions
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];

            if (obstacle.isPointInside(x, y)) {
                hasObstacleCollision = true;
            }
        }

        stepsSinceWait++;
    }

    ctx.beginPath();

    if (startX < 0) { 
        for (let x = startX/*MinX()*/; x <= MaxX(); x += XSTEP) {
            if (hasObstacleCollision) break;

            let constant = startY - f(startX);

            await drawFunction(x, constant);
        }
    } else if (startX > 0) { 
        for (let x = startX/*MinX()*/; x >= MinX(); x -= XSTEP) {
            if (hasObstacleCollision) break;

            let constant = startY - f(startX);

            await drawFunction(x, constant);
        }
    }

    
    ctx.stroke();
}

//viewportWidth = 10;

const drawBg = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    DrawGrid();
    DrawAxes();

    soldiers.forEach(soldier => {
        soldier.draw();
    });

    obstacles.forEach(obstacle => obstacle.draw())
}

const update = async () => {
    drawBg();
    await RenderFunction(F, true, soldiers[currentTurn].x, soldiers[currentTurn].y);

    nextTurn();

    await sleep(100);
    drawBg();
}

const start = async () => {
    for (let i = 0; i < soldiers.length; i++) {
        const soldier = soldiers[i];

        await soldier.loadImages();
    }

    drawBg();

    //requestAnimationFrame(update)
}

start();

//requestAnimationFrame(update);
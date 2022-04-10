const { createCanvas } = require('canvas');

const { XC, YC, MinY, MaxY, MinX, MaxX, ViewportWidth, ViewportHeight, CanvasWidth, CanvasHeight } = require("./Constants.js");

class Renderer {
    constructor(game = null) {
        this.canvas = createCanvas(CanvasWidth, CanvasHeight);
        this.ctx = this.canvas.getContext('2d');

        this.xstepDraw = (MaxX() - MinX()) / CanvasWidth / 10;
        this.xstepCompute = (MaxX() - MinX()) / CanvasWidth / 50;

        this.gridSpacing = 5;
        this.shouldDrawGrid = true;

        this.game = game;
        this.scale = 1;
    }

    async draw(currentSoldierId) {
        global.xScale = this.scale;

        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, CanvasWidth, CanvasHeight);

        this.game.obstacles.forEach(obstacle => obstacle.draw(this.ctx, 1));

        this.drawGrid();
        this.drawAxes();

        this.game.soldiers.forEach(soldier => soldier.draw(this.ctx, false, this.scale));

        // Draw the current soldier after so that it is above
        this.game.soldiers.find(soldier => soldier.internalId == currentSoldierId).draw(this.ctx, true, this.scale);
    }

    async RenderFunction(f, startX, startY, currentSoldierId, paint = true, carve = true) {
        const ctx = this.ctx;

        var first = true;

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ff0000";

        let collisionX;
        let hasPlayerCollision = false, hasObstacleCollision = false;

        const computeFunction = (x, y, xprev, yprev) => {
            // Check for collisions
            this.game.soldiers.forEach(soldier => {
                if (soldier.isPointInside(x, y, -0.1) && soldier.internalId != currentSoldierId && !soldier.dead) {
                    hasPlayerCollision = true;

                    soldier.die(ctx);

                    collisionX = x;

                    return true;
                }/* else {
                    if (x > soldier.x && xprev < soldier.x) {
                        if (y > soldier.y && yprev < soldier.y) {
                            hasPlayerCollision = true;

                            soldier.die(ctx);
        
                            collisionX = x;
        
                            return true;
                        }
                    }
                }*/
            });

            // Check for obstacle collisions
            this.game.obstacles.forEach(obstacle => {
                if (obstacle.isPointInside(x, y, -0.1)) {
                    hasObstacleCollision = true;
                    if (carve) obstacle.carve(x, y, 1);

                    collisionX = x;

                    return true;
                } /*else {
                    if (x > obstacle.x && xprev < obstacle.x) {
                        if (y > obstacle.y && yprev < obstacle.y) {
                            hasObstacleCollision = true;
                            if (carve) obstacle.carve(x, y, 1);
        
                            collisionX = x;
        
                            return true;
                        }
                    }
                }*/
            });

            return false;
        }

        const drawFunction = (x, constant, invert = false) => {
            if (invert)
                var y = -f(x) + constant;
            else
                var y = f(x) + constant;

            if (typeof y != "number") return;

            if (isNaN(y)) return;

            if (paint) {
                if (first) {
                    if (y < MaxY() && y > MinY()) {
                        ctx.moveTo(XC(x), YC(y));
                        first = false;
                    }
                } else {
                    if (y > MaxY() || y < MinY()) {
                        ctx.stroke();
                        first = true;
                    } else {
                        ctx.lineTo(XC(x), YC(y));
                    }
                }
            }
        }

        if (paint) ctx.beginPath();

        let constant = startY - f(startX);
        // Go to the right
        if (startX < 0) { 
            for (let x = startX; x <= MaxX(); x += this.xstepCompute) {
                if (hasObstacleCollision) break;

                let y = f(x) + constant;

                computeFunction(x, y);
            }
            for (let x = startX; x <= MaxX(); x += this.xstepDraw) {
                if (hasObstacleCollision && x >= collisionX) break;

                //let y = f(x) + constant;
                drawFunction(x, constant);
            }
        } 
        // Go to the left
        else if (startX > 0) { 
            for (let x = startX; x >= MinX(); x -= this.xstepCompute) {
                if (hasObstacleCollision) break;

                let y = f(x) + constant;

                computeFunction(x, y);
            }
            for (let x = startX; x >= MinX(); x -= this.xstepDraw) {
                if (hasObstacleCollision && x <= collisionX) break;

                drawFunction(x, constant);
            }
        }
        
        if (paint) ctx.stroke();
    }

    drawGrid() {
        if (!this.shouldDrawGrid) return;
        
        const ctx = this.ctx;

        ctx.strokeStyle = "#999";

        ctx.lineWidth = 1;

        for (let x = 0; x <= MaxX(); x += this.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(XC(x), YC(MinY()));
            ctx.lineTo(XC(x), YC(MaxY()));
            ctx.stroke();
        }

        for (let x = 0; x >= MinX(); x -= this.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(XC(x), YC(MinY()));
            ctx.lineTo(XC(x), YC(MaxY()));
            ctx.stroke();
        }

        for (let y = 0; y <= MaxY(); y += this.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(XC(MinX()), YC(y));
            ctx.lineTo(XC(MaxX()), YC(y));
            ctx.stroke();
        }

        for (let y = 0; y >= MinY(); y -= this.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(XC(MinX()), YC(y));
            ctx.lineTo(XC(MaxX()), YC(y));
            ctx.stroke();
        }

    }

    drawAxes() {
        const ctx = this.ctx;

        ctx.strokeStyle = "#000";
        const tickSpacing = this.gridSpacing;

        const origin = { x: 0, y: 0 };

        ctx.save();
        ctx.lineWidth = 2;

        const lengthX = 500 / ViewportWidth;
        const lengthY = 500 / ViewportHeight;

        // Y axis
        ctx.beginPath();
        ctx.moveTo(XC(origin.x), YC(MinY()));
        ctx.lineTo(XC(origin.x), YC(MaxY()));
        ctx.stroke();

        // Y axis tick marks +
        var delta = 1;
        for (var i = 0; (i * delta) < MaxY(); i += tickSpacing) {
            ctx.beginPath();
            ctx.moveTo(XC(origin.x) - lengthY, YC(i * delta));
            ctx.lineTo(XC(origin.x) + lengthY, YC(i * delta));
            ctx.stroke();
        }
        // Y axis tick marks -
        var delta = 1;
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
        var delta = 1;
        for (let i = 0; (i * delta) < MaxX(); i += tickSpacing) {
            ctx.beginPath();
            ctx.moveTo(XC(i * delta), YC(origin.y) - lengthX);
            ctx.lineTo(XC(i * delta), YC(origin.y) + lengthX);
            ctx.stroke();
        }
        // X tick marks -
        var delta = 1;
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
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "#000";
        
        for (let x = MinX() - origin.x; x < MaxX() - origin.x + 1; x++) {
            if (x % markingInterval == 0 && x != 0) {
                ctx.fillText((x * 1).toString(), XC(x + origin.x), YC(origin.y + 0.5));
            }
        }
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        for (let y = MinY() - origin.y; y < MaxY() - origin.y + 1; y++) {
            if (y % markingInterval == 0 && y != 0) {
                ctx.fillText(y.toString(), XC(origin.x + 0.75), YC(y + origin.y + 0.125));
            }
        }

        ctx.restore();
    }
}

module.exports = Renderer;
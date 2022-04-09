const { XC, YC, MinY, MaxY, MinX, MaxX, ViewportWidth, ViewportHeight, CanvasWidth, CanvasHeight } = require("./Constants.js");

class Obstacle {
    constructor(x = 0, y = 0, radius = 5, start = 0, end = Math.PI * 2, type = "circle") {
        this.x = x;
        this.y = y;

        this.radius = radius; // physical: 40 => grid: 2.5
        this.startAngle = start;
        this.endAngle = end;
        this.type = type;

        this.color = "#000";

        this.carvedCircles = [];
    }

    draw(ctx, flip = 1) {
        ctx.save();
        ctx.fillStyle = this.color;
        const x = this.x * flip;

        if (this.type == "circle") {
            ctx.beginPath();
            ctx.arc(XC(x), YC(this.y), this.radius * (40 / 2.5), this.startAngle, this.endAngle, false);
            ctx.fill();
        } else if (this.type == "rectangle") {
            ctx.fillRect(XC(x - this.radius), YC(this.y + this.radius), this.radius * (40 / 2.5) * 2, this.radius * (40 / 2.5) * 2);
        } 

        ctx.restore();

        this.carvedCircles.forEach(hole => hole.draw(ctx));
    }

    isPointInside(x, y, extra = 0) {
        var collision = false;
        if (this.type == "circle") {
            collision = (x - this.x)**2 + (y - this.y)**2 <= (this.radius + extra)**2;
        } else if (this.type == "rectangle") {
            if (x > this.x - (this.radius + extra) && x < this.x + (this.radius + extra)) {
                if (y > this.y - (this.radius + extra) && y < this.y + (this.radius + extra)) {
                    collision = true;
                }
            }
        }

        // Check carved circles too
        for (let i = 0; i < this.carvedCircles.length; i++) {
            if (this.carvedCircles[i].isPointInside(x, y)) {
                return false;
            }
        }

        return collision;
    }

    carve(x, y, radius) {
        var o = new Obstacle(x, y, radius);
        o.color = "#fff";
        this.carvedCircles.push(o);
    }
}

module.exports = Obstacle;
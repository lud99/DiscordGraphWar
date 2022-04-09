const { loadImage } = require("canvas");

const { sleep, createId } = require("./Utils.js");
const { XC, YC, MinY, MaxY, MinX, MaxX, ViewportWidth, ViewportHeight, CanvasWidth, CanvasHeight } = require("./Constants.js");

class Soldier {
    constructor(x = 0, y = 0, discordId, ownerName, side, imageSizeFactor = 0.35) {
        this.x = x;
        this.y = y;
        this.side = side;
        this.internalId = createId();
        this.discordId = discordId;
        this.ownerName = ownerName;
        this.loaded = false;

        this.leftImage = null;
        this.rightImage = null;

        this.imageSizeFactor = imageSizeFactor;
        this.logicalSize = 3;

        this.explosionFrames = [];
        this.explosionSizeFactor = 2;

        this.dead = false;
        this.deadThisRound = false;
        this.colors = ["", "Black", "Blue", "Brown", "Lime", "Purple"];
        this.color = this.colors[Math.random() * this.colors.length | 0];
    }

    async loadImages() {
        if (this.loaded) return;

        let promises = [ loadImage("images/soldiers/soldierLeft" + this.color + ".png"), loadImage("images/soldiers/soldierRight" + this.color + ".png") ];

        for (let i = 0; i <= 5; i++) {
            promises.push(loadImage("images/explosions/explosion" + i + ".png"));
        }

        const images = await Promise.all(promises);
        this.leftImage = images[0];
        this.rightImage = images[1];

        for (let i = 2; i < images.length; i++) {
            this.explosionFrames.push(images[i]);
        }

        this.loaded = true;
    }

    draw(ctx, isMyTurn, scale = 1) {
        if (this.dead && this.deadThisRound) {
            this.die(ctx);
            this.deadThisRound = false;
        }

        if (!this.loaded || this.dead) return;

        const image = (this.x * scale) > 0 ? this.leftImage : this.rightImage;

        const pos = {
            x: XC(this.x) - (image.width * this.imageSizeFactor) / 2,
            y: YC(this.y) - (image.height * this.imageSizeFactor) / 2
        }

        ctx.drawImage(image, pos.x, pos.y, image.width * this.imageSizeFactor, image.height * this.imageSizeFactor);

        ctx.save();

        const fontWidth = ctx.measureText(this.ownerName).width;
        const fontHeight = 30;
        const padding = 5;

        ctx.fillStyle = "#d1d1d1";
        ctx.fillRect(XC(this.x) + padding - fontWidth * 2, YC(this.y) + fontHeight * 2 - padding, fontWidth * 4 - padding * 2, fontHeight + padding * 2);

        ctx.font = '30px Arial';
        ctx.fillStyle = "#227d3c";
        if (isMyTurn)
            ctx.fillStyle = "#f55442";

        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        ctx.fillText(this.ownerName, XC(this.x), YC(this.y - this.logicalSize * 1.25))

        ctx.restore();
    }

    async die(ctx) {
        this.dead = true;
        this.deadThisRound = true;

        for (let i = this.explosionFrames.length - 1; i < this.explosionFrames.length; i++) {
            const pos = {
                x: XC(this.x) - (this.explosionFrames[i].width * this.explosionSizeFactor) / 2,
                y: YC(this.y) - (this.explosionFrames[i].height * this.explosionSizeFactor) / 2
            }

            ctx.drawImage(this.explosionFrames[i], pos.x, pos.y, this.explosionFrames[i].width * this.explosionSizeFactor, this.explosionFrames[i].height * this.explosionSizeFactor); 
        }
    }

    isPointInside(x, y, extra) {
        const size = this.logicalSize + extra;
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

module.exports = Soldier;
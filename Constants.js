const ViewportWidth = 60 * 1.5;
const ViewportHeight = 60;
const CanvasWidth = 1440;  
const CanvasHeight = 960;

module.exports.ViewportWidth = ViewportWidth;
module.exports.ViewportHeight = ViewportHeight;
module.exports.CanvasWidth = CanvasWidth;
module.exports.CanvasHeight = CanvasHeight;

// Returns the right boundary of the logical viewport:
function MaxX() {
    return ViewportWidth / 2;
}
module.exports.MaxX = MaxX;

// Returns the left boundary of the logical viewport:
function MinX() {
    return -ViewportWidth / 2;
}
module.exports.MinX = MinX;

// Returns the top boundary of the logical viewport:
function MaxY() {
    return ViewportHeight / 2;
}
module.exports.MaxY = MaxY;

// Returns the bottom boundary of the logical viewport:
function MinY() {
    return -ViewportHeight / 2;
}
module.exports.MinY = MinY;

// Returns the physical x-coordinate of a logical x-coordinate:
module.exports.XC = function XC(x) {
    const xScale = global.xScale ? global.xScale : 1;
    return (xScale*x - MinX()) / (MaxX() - MinX()) * CanvasWidth;
}

// Returns the physical y-coordinate of a logical y-coordinate:
module.exports.YC = function YC(y) {
    return CanvasHeight - (y - MinY()) / (MaxY() - MinY()) *CanvasHeight;
}
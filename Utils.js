
/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
module.exports.getRandomArbitrary = function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
module.exports.getRandomInt = function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

module.exports.createId = (length = 12, chars = "abcdefghijklmnopqrstuvwxyz1234567890") => {
    let result = "";

    for (let i = 0; i < length; i++)
        result += chars[(Math.random() * chars.length) | 0];

    return result;
}

// const viewportWidth = 60 * 1.5;
// const viewportHeight = 60;
// module.exports.viewportWidth = viewportWidth;
// module.exports.viewportHeight = viewportHeight;

// // Returns the right boundary of the logical viewport:
// function MaxX() {
//     return viewportWidth / 2;
// }
// module.exports.MaxX = MaxX;

// // Returns the left boundary of the logical viewport:
// function MinX() {
//     return -viewportWidth / 2;
// }
// module.exports.MinX = MinX;

// // Returns the top boundary of the logical viewport:
// function MaxY() {
//     return viewportHeight / 2;
// }
// module.exports.MaxY = MaxY;

// // Returns the bottom boundary of the logical viewport:
// function MinY() {
//     return -viewportHeight / 2;
// }
// module.exports.MinY = MinY;

// // Returns the physical x-coordinate of a logical x-coordinate:
// module.exports.XC = function XC(x) {
//     return (x - MinX()) / (MaxX() - MinX()) * canvas.width;
// }

// // Returns the physical y-coordinate of a logical y-coordinate:
// module.exports.YC = function YC(y) {
//     return canvas.height - (y - MinY()) / (MaxY() - MinY()) * canvas.height;
// }
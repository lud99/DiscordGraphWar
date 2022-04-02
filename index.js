const Game = require("./Game");

const game = new Game();
game.start();


app.listen(2022, () => console.log("Server running on 2022"));

app.get("/", (req, res) => {
    res.send(`<img src="${game.renderer.canvas.toDataURL()}" />`);
});
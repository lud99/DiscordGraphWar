const { getRandomArbitrary, getRandomInt, sleep } = require("./Utils.js");
const { XC, YC, MinY, MaxY, MinX, MaxX, ViewportWidth, ViewportHeight, CanvasWidth, CanvasHeight } = require("./Constants.js");

const Renderer = require("./Renderer.js");
const Soldier = require("./Soldier");
const Obstacle = require("./Obstacle");

class Game {
    constructor(playersInLobby = []) {
        this.soldiers = [];
        this.obstacles = [];
        this.renderer = new Renderer(this);

        this.playersInLobby = playersInLobby;

        this.currentSoldierId = -1;
        this.lobbyMessageId = -1;

        this.viewportWidth = 60 * 1.5;
        this.viewportHeight = 60;

        this.hasStarted = false;

        this.settings = {
            noObstacles: 0,
            obstacleSpacing: 22,
            obstacleRandomness: 20,
            obstaclePadding: 5,
            edgeObstacleSpacing: 17,
            edgeObstacleRandomness: 4,
            rectangleSpawnRate: 0.9,
            minRadius: 2,
            maxRadius: 4,
            gridSpacing: 5,
            shouldDrawGrid: 0,
            playerSize: 0.35
        };

        this.renderer.gridSpacing = this.settings.gridSpacing;
        this.renderer.shouldDrawGrid = this.settings.shouldDrawGrid;
    }

    async start() {
        this.hasStarted = true;
        this.lobbyMessageId = -1;

        var success = this.placeObstacles();
        success = this.placeSoldiers();
        if (!success) return "Error: Could not place players or obstacles, no free space left. Ended game and cleared settings";

        this.currentSoldierId = this.soldiers[0].internalId;

        for (let i = 0; i < this.soldiers.length; i++) {
            const soldier = this.soldiers[i];

            await soldier.loadImages();
        }

        this.renderer.draw(this.currentSoldierId);
    }

    async sendFunction(f) {
        const start = Date.now();

        const currentSoldier = this.getCurrentSoldier();

        // if (currentSoldier.side == 1)
        //     this.renderer.scale = -1;
        // else
        //     this.renderer.scale = 1;

        const carvedObstacles = this.obstacles;
        const uncarvedObstacles = this.obstacles.slice();

        this.renderer.RenderFunction(f, currentSoldier.x, currentSoldier.y, this.currentSoldierId, true, true);

        // Render everything again, but with obstacles that wont be affected if the line hits something again
        this.obstacles = uncarvedObstacles;
        this.renderer.draw(this.currentSoldierId);
        this.renderer.RenderFunction(f, currentSoldier.x, currentSoldier.y, this.currentSoldierId, true, false);
        this.obstacles = carvedObstacles;

        const currentTurnImage = this.renderer.canvas.toDataURL();

        // Render an updated version of the game
        this.nextTurn();
        
        // if (this.getCurrentSoldier().side == 1)
        //     this.renderer.scale = -1;
        // else
        //     this.renderer.scale = 1;

        this.renderer.draw(this.currentSoldierId);

        const nextTurnImage = this.renderer.canvas.toDataURL();

        console.log("Render took %s seconds", (Date.now() - start) / 1000);

        return { currentTurnImage, nextTurnImage };
    }

    drawBg() {
        // if (this.getCurrentSoldier().side == 1)
        //     this.renderer.scale = -1;
        // else
        //     this.renderer.scale = 1;
            
        this.renderer.draw(this.currentSoldierId);
    }

    getAlivePlayers() {
        return this.soldiers.filter(s => !s.dead);
    }
    getAlivePlayersLeft() {
        return this.soldiers.filter(s => !s.dead && s.side == 0);
    }
    getAlivePlayersRight() {
        return this.soldiers.filter(s => !s.dead && s.side == 1);
    }
    isGameOver() {
        return this.getAlivePlayersLeft().length == 0 || this.getAlivePlayersRight().length == 0;
    }

    nextTurn() {
        if (this.soldiers.length == 0)
            return console.log("Game finished");

        while (true) {
            const currentSoldier = this.getCurrentSoldier();
            let nextIndex = this.soldiers.indexOf(currentSoldier) + 1;
            nextIndex = nextIndex % this.soldiers.length;
            this.currentSoldierId = this.soldiers[nextIndex].internalId;

            if (!this.soldiers[nextIndex].dead)
                return this.currentSoldierId;
        }
    }

    getCurrentSoldier() {
        return this.soldiers.find(soldier => soldier.internalId == this.currentSoldierId);
    }

    placeSoldiers() {
        const startTime = Date.now();
        const playerPadding = 5;
        const safeZone = 20;

        for (let i = 0; i < this.playersInLobby.length; i++) {
            let side = this.playersInLobby[i].side;
            let choosePos = true;
            while (choosePos) {

                if (side == 0)
                    var x = getRandomInt(MinX() + playerPadding, 0 - playerPadding);
                else
                    var x = getRandomInt(0 + playerPadding, MaxX() - playerPadding);

                var y = getRandomInt(MinY() + playerPadding, MaxY() - playerPadding);

                if (x**2 + y**2 < safeZone**2) {
                    continue;
                }

                let collision = false;

                // Obstacles
                this.obstacles.forEach(obstacle => {
                    if (obstacle.isPointInside(x, y, obstacle.radius))
                        collision = true;
                });

                // Players
                this.soldiers.forEach(soldier => {
                    if (soldier.isPointInside(x, y, soldier.logicalSize + 5))
                        collision = true;
                });

                if (!collision)
                    choosePos = false;

                if (Date.now() - startTime > 1000)
                    return false;
            }

            this.soldiers.push(new Soldier(x, y, this.playersInLobby[i].id, this.playersInLobby[i].username, side, this.settings.playerSize));
        }

        return true;
    }

    placeObstacles() {
        const { obstacleSpacing, obstacleRandomness, obstaclePadding,
            rectangleSpawnRate,
            minRadius,
            maxRadius, edgeObstacleRandomness, edgeObstacleSpacing, noObstacles } = this.settings;

        if (noObstacles) return true;

        const startTime = Date.now();
        for (let x = MinX() + obstaclePadding; x <= MaxX() - obstaclePadding; x += obstacleSpacing) {
            for (let y = MinY() + obstaclePadding; y <= MaxY() - obstaclePadding; y += obstacleSpacing) {
                let obstacleType = "circle";

                let safeZone = 0;

                let pos = {
                    x: x + Math.random() * obstacleRandomness | 0,
                    y: y + Math.random() * obstacleRandomness | 0
                }

                let radius = getRandomInt(minRadius, maxRadius);

                if (Math.abs(pos.x) < safeZone && Math.abs(pos.y) < safeZone) {
                    //obstacleSpacing -= 15;
                    continue;
                }

                let rotation = 0;//getRandomArbitrary(0, Math.PI * 0.25);

                let start = rotation;//getRandomArbitrary(0, Math.PI)

                let end = Math.PI * 2 + rotation;
                //  end = choose([Math.PI, Math.PI * 2.5]) + rotation;

                if (Math.random() > rectangleSpawnRate) {
                    obstacleType = "rectangle";
                }

                if (Date.now() - startTime > 1000)
                    return false;

                this.obstacles.push(new Obstacle(pos.x, pos.y, radius, start, end, obstacleType))
            }
        }

        for (let x = MinX(); x <= MaxX(); x += edgeObstacleSpacing) {
            let obstacleType = "circle";

            let y = x % 2 == 0 ? MinY() : MaxY();

            let pos = {
                x: x + Math.random() * obstacleRandomness | 0,
                y: y + Math.random() * edgeObstacleRandomness * Math.sign(y) | 0
            }

            let radius = getRandomInt(minRadius, maxRadius);

            if (Math.random() > rectangleSpawnRate) {
                obstacleType = "rectangle";
            }

            if (Date.now() - startTime > 1000)
                return false;

            this.obstacles.push(new Obstacle(pos.x, pos.y, radius, 0, Math.PI * 2, obstacleType))
        }

        return true;
    }
}

module.exports = Game;
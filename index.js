const { MessageAttachment, Client, Intents } = require('discord.js');

const dotenv = require("dotenv");

const math = require("./math.js")

const Game = require("./Game");
const games = new Map();
const previousGames = new Map();
const channelOpts = new Map();

dotenv.config({ path: "./secrets.env" });

function sortByProperty(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers,
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

const startGame = async (message) => {
    if (!games.has(message.channelId))
        return message.channel.send("No active lobby in this channel");

    const game = games.get(message.channelId);

    // Add extra soldiers
    let newPlayersInLobby = game.playersInLobby.slice();

    game.playersInLobby.forEach(player => {
        const count = (player.count || 1) - 1;
        for (let i = 0; i < count; i++) {
            newPlayersInLobby.push(player)
        }
    });

    // flip
    // portals
    // - every other
    // - wall obstacles
    // black holes?
    // multiplier apllies to everyone

    game.playersInLobby = newPlayersInLobby;
    game.playersInLobby = game.playersInLobby.sort(sortByProperty("side"));

    // Sort by every other player
    var newPlayers = [];
    game.playersInLobby.forEach(player => {
        if (player.side == 0) {
            newPlayers.push(player);
            newPlayers.push(null);
        }
    });
    game.playersInLobby.forEach(player => {
        if (player.side == 1) {
            const i = newPlayers.findIndex(a => a == null);
            if (i == -1)
                newPlayers.push(player);
            else
                newPlayers[i] = player;
        }
    });

    game.playersInLobby = newPlayers.filter(player => player != null);

    const leftPlayers = game.playersInLobby.filter(s => s.side == 0);
    const rightPlayers = game.playersInLobby.filter(s => s.side == 1);

    if (leftPlayers.length == 0 || rightPlayers.length == 0)
        return message.channel.send("Not enough players. Atleast one person on each team is required")

    const leftIds = leftPlayers.map(author => `<@${author.id}>`).join(" ");
    const rightIds = rightPlayers.map(author => `<@${author.id}>`).join(" ");

    const error = await game.start();
    var sendMsgStr = `Starting game now with \nTeam 1: ${leftIds}\nTeam 2: ${rightIds}`;
    if (sendMsgStr.length > 1000) sendMsgStr = "Starting game now"
    
    await message.channel.send(sendMsgStr);
    if (error) {
        message.channel.send(error);
        games.delete(message.channelId);
        channelOpts.delete(message.channelId);

        return;
    }

    await sendGameImageFromCanvas(message, game);
    message.channel.send(`It is your turn <@${game.getCurrentSoldier().discordId}>`)
} 

client.on("messageCreate", async message => {
    if (message.author.bot) return;

    var args = /*message.content.slice(prefix.length)*/message.content.split(" ");

    var everythingAfterArgs = args.join(" ");

    const command = args.shift();

    args = args.join(" ");

    //if (!message.content.startsWith(prefix) && !message.content.startsWith("y")) return;

    if (command == "help") {
        var str = "```create (creates a lobby)```";
        str += "```start (starts the game)```";
        str += "```y = <function> (sends a function)```";
        str += "```end (deletes a lobby and game)```";
        str += "```restart (restarts the game and keep the lobby)```";
        str += "```soldiers <number> (sets the number of soldiers for yourself)```";
        str += "```obstacles <none, low, normal or high> (sets the amount of obstacles)```";
        str += "```skip (skips your turn)```";
        str += "```settings (shows the saved settings)```";
        str += "```settings <option=value,option2=value2...> (sets settings for the channel !!ON YOUR OWN RISK!!)```";

        message.channel.send(str);
    }
    else if (command == "create") {
        if (games.has(message.channelId) && games.get(message.channelId).hasStarted)
            return message.channel.send("A game is already in progress");

        const msg = await message.channel.send("Created a game in this channel. Click the emojis to join a team");

        const game = new Game();
        game.lobbyMessageId = msg.id;

        if (channelOpts.has(message.channelId))
            game.settings = channelOpts.get(message.channelId);

        games.set(message.channelId, game);

        //game.playersInLobby.push({ id: message.author.id, username: message.author.username, side: 0 });
        //game.playersInLobby.push({ id: message.author.id, username: message.author.username, side: 1 });

        //await startGame(message);

        await msg.react("1️⃣");
        await msg.react("2️⃣");
    } else if (command == "end") {
        if (!games.has(message.channelId))
            return message.channel.send("No game to end");

        games.delete(message.channelId);
        previousGames.delete(message.channelId);
        return message.channel.send("Ended game");
    } else if (command == "start") {
        await startGame(message);
    } else if (command == "skip") {
        if (!games.has(message.channelId))
            return message.channel.send("No active game in this channel");

        const game = games.get(message.channelId);

        if (game.getCurrentSoldier().discordId == message.author.id) {
            game.nextTurn();
            game.drawBg();

            await sendGameImageFromCanvas(message, game);
    
            message.channel.send(`It is your turn <@${game.getCurrentSoldier().discordId}>`)
        } else {
            message.channel.send("Not your turn right now bro");
        }
    } else if (command == "restart") {
        console.log(previousGames)
        if (!games.has(message.channelId) && !previousGames.has(message.channelId))
            return message.channel.send("No active game in this channel");

        const game = games.get(message.channelId) || previousGames.get(message.channelId);

        games.set(message.channelId, game);

        game.soldiers = [];
        game.obstacles = [];

        game.playersInLobby.forEach(p => p.count = 0);

        await startGame(message);
    } else if (command == "soldiers") {
        if (!games.has(message.channelId))
            return message.channel.send("No active game in this channel");

        const game = games.get(message.channelId);
        if (game.hasStarted)
            return message.channel.send("Cannot change soldier count when a game has started");

        const matchingPlayers = game.playersInLobby.filter(player => player.id == message.author.id);

        if (matchingPlayers.length == 0)
            return message.channel.send("You are not in the lobby bruv");

        var count = parseInt(args);

        if (isNaN(count) || count <= 0)
            return message.channel.send("Invalid soldier count specified, expected a number greater than 1");
        
        count = Math.abs(Math.round(count)) || 1;

        matchingPlayers.forEach(p => p.count = count);
        
        message.channel.send(`Changed so that <@${message.author.id}> has ${count} soldiers`);
    }
    else if (command == "obstacles") {
        if (!games.has(message.channelId))
            return message.channel.send("No active game in this channel");

        const game = games.get(message.channelId);
        if (game.hasStarted)
            return message.channel.send("Cannot change obstacles when a game has started");

        if (!game.playersInLobby.find(player => player.id == message.author.id))
            return message.channel.send("You are not in the lobby bruv");

        if (!["none", "low", "normal", "high"].includes(args)) {
            return message.channel.send("Invalid obstacle option");
        }

        if (args == "none") {
            game.settings.noObstacles = 1;
        } else if (args == "low") {
            game.settings.noObstacles = 0;
            game.settings.obstacleSpacing = 35;
            game.settings.maxRadius = 3;    
        } else if (args == "normal") { // default
            game.settings.noObstacles = 0;
            game.settings.obstacleSpacing = 22;
            game.settings.maxRadius = 4;
        } else if (args == "high") {
            game.settings.noObstacles = 0;
            game.settings.obstacleSpacing = 17;
            game.settings.maxRadius = 6;
        }
        
        message.channel.send("Changed obstacle settings to " + args);
    } else if (command == "settings") {
        const defaults = new Game().settings;

        const incomingOpts = {};
        args = args.split(" ").join("");

        if (args.length == 0) {
            if (channelOpts.has(message.channelId)) {
                var channelSettingsStr = Object.entries(channelOpts.get(message.channelId)).map(([key, value]) => key + " = " + value).join(", ");
                return message.channel.send("No settings specified. Here are the stored settings ```" + channelSettingsStr + "```")
            } else {
                var defaultSettingsStr = Object.entries(defaults).map(([key, value]) => key + " = " + value).join(", ");
                return message.channel.send("No settings specified. Here are the default settings ```" + defaultSettingsStr + "```")
            }
        }

        for (let i = 0; i < args.split(",").length; i++) {
            const s = args.split(",")[i];
            incomingOpts[s.split("=")[0]] = parseFloat(s.split("=")[1])
        }

        for (let i = 0; i < Object.keys(incomingOpts).length; i++) {
            if (!Object.keys(defaults).includes(Object.keys(incomingOpts)[i])) {
                return message.channel.send("Invalid setting '" + Object.keys(incomingOpts)[i] + "' specified");
            }
        }

        const settings = { ...defaults, ...incomingOpts }; 

        if (games.has(message.channelId)) {
            if (games.get(message.channelId).hasStarted) {
                message.channel.send("Cannot change settings while a game is played. The settings will apply to future games");
            } else {
                games.get(message.channelId).settings = settings;
            }
        }
            
        channelOpts.set(message.channelId, settings);

        const settingsStr = Object.entries(settings).map(([key, value]) => key + " = " + value).join(", ");

        message.channel.send(`Saved settings for all games in this channel\n\`\`\`${settingsStr}\`\`\``);
    } else if (message.content.startsWith("y")) {
        // todo: error checking
        const expr = message.content.split("=")[1];

        if (!games.has(message.channelId))
            return message.channel.send("No active game in this channel");

        const game = games.get(message.channelId);

        // Check permission
        if (game.getCurrentSoldier().discordId != message.author.id)
            return message.reply("Wait for your turn :rage: ")

        const { f, error } = parseMathFunction(expr);

        if (error) return message.channel.send(error.message || error);

        const { currentTurnImage, nextTurnImage } = await game.sendFunction(f);

        await sendGameImages(message, currentTurnImage, nextTurnImage);

        if (game.isGameOver()) {
            const winningTeam = game.getAlivePlayers()[0].side == 0 ? "Team 1" : "Team 2"; 
            message.channel.send("Game finished! " + winningTeam + " won!🥳🥳\nType 'restart' to play again with the same lobby");

            previousGames.set(message.channelId, game);
            
            // Delete the lobby
            games.delete(message.channelId)

            return;
        }

        message.channel.send(`It is your turn <@${game.getCurrentSoldier().discordId}>`)
    }
});

client.on("messageReactionAdd", (reaction, user) => {
    const emoji = reaction._emoji.name;
    const side = emoji == "1️⃣" ? 0 : 1;

    if (emoji != "1️⃣" && emoji != "2️⃣") 
        return;
    if (user.bot) return;
    
    if (!games.has(reaction.message.channelId))
        return message.channel.send("No active lobby in this channel");

    const game = games.get(reaction.message.channelId);

    if (reaction.message.id != game.lobbyMessageId)
        return;

    game.playersInLobby.push({ id: user.id, username: user.username, side });
});

client.on("messageReactionRemove", (reaction, user) => {
    const emoji = reaction._emoji.name;
    const side = emoji == "1️⃣" ? 0 : 1;

    if (emoji != "1️⃣" && emoji != "2️⃣") 
        return;
    if (user.bot) return;
    
    if (!games.has(reaction.message.channelId))
        return message.channel.send("No active lobby in this channel");

    const game = games.get(reaction.message.channelId);

    if (reaction.message.id != game.lobbyMessageId)
        return;

    // Remove the player
    const index = game.playersInLobby.findIndex(player => player.id == user.id && player.side == side);
    game.playersInLobby.splice(index, 1);
});

const sendGameImageFromCanvas = (message, game) => {
    const base64 = game.renderer.canvas.toDataURL();
    const file = new MessageAttachment(Buffer.from(base64.split(",")[1], "base64"), "game.png");

    return message.channel.send({ files: [file] });
}

const sendGameImages = (message, img1, img2) => {
    const file1 = new MessageAttachment(Buffer.from(img1.split(",")[1], "base64"), "game1.png");
    const file2 = new MessageAttachment(Buffer.from(img2.split(",")[1], "base64"), "game2.png");

    return message.channel.send({ files: [file1, file2] });
}

const parseMathFunction = (expr) => {
    if (expr.includes("="))
        return { error: "Can't have '=' in the expression" };

    const f = (x) => math.evaluate(expr, { x });

    try {
        f(0);
    } catch (error) {
        return { error };
    }

    return { f };
}

// Login to Discord with your client's token
client.login(process.env.GRAPHWAR_DISCORD_TOKEN);
//game.start();

# Discord Graphwar
This is a version of the classic game [Graphwar](https://github.com/catabriga/graphwar) that is playable on a Discord server.

The game plays like normal for the most part. Some things had to be cut from the original, notably the animations and alwats putting the current player at the left side of the plane. At this stage there are no AI players either.

The function parsing is done with Math.js, so everything that is supported there works here (for the most part)

If you are inviting this bot to your server, please make sure it only has permissions to act in the "game channel", or otherwise it will read and try to respond to normal messages

## Commands
```
create (creates a lobby)
start (starts the game)
y = <function> (sends a function)
end (deletes a lobby and game)
restart (restarts the game and keep the lobby)
soldiers <number> (sets the number of soldiers for yourself)
obstacles <none, low, normal or high> (sets the amount of obstacles)
skip (skips your turn)
settings (shows the saved settings)
settings <option=value,option2=value2...> (sets settings for the channel)
```

## Running
Apart from installing the dependencies, the ```GRAPHWAR_DISCORD_TOKEN``` has to be specified in the file ```secrets.env``` at the root of the project. 

## Special thanks to
* [Graphwar](https://github.com/catabriga/graphwar)  
* Kind playtesters
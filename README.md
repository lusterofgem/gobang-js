# gobang-js

A gobang game server.

![preview](https://github.com/lusterofgem/gobang-js/blob/main/assets/images/preview.png)

The client & serveer use ws to transfer message to communicate.

The message is a json (stringifed object), the structure is like this:

```
{
    "type": "chat",
    "content": "hello there"
}
```

## using port

 - express: 8080

 - ws: 8081

## status

chat-box: ready ✔️

checkerboard: ready ✔️

identify different players: nope ❌

hub: nope ❌

battle room: nope ❌

## client to server message
 
 - put-chess

```
{
    "type": "put-chess",
    "content": "0,0"
}
```

 - restart-game

```
{
    "type": "restart-game",
}
```

 - chat

```
{
    "type": "chat",
    "content": "hello there"
}
```

## server to client message

 - put-chess

```
{
    "type": "put-chess",
    "content": "0,0,black"
}
```

 - sync-checkerboard

 ```
 {
    "type": "sync-checkerboard",
    "content": [
        ["", "", "", ...],
        ["", "", "", ...],
        ["", "", "", ...],
        ...
    ]
 }
 ```

 - sync-winner
 
```
{
    "type": "sync-winner",
    "content": "black"
}
```

 - sync-turn

```
{
    "type": "sync-turn",
    "content": "black"
}
```

 - chat

```
{
    "type": "chat",
    "content": "hello there"
}
```

 - sync-player-slot

 ```
 {
     "type": "sync-player-slot",
     "content": [
        "player1Name": "",
        "player2Name": "",
        "clientIsPlayer1": false,
        "clientIsPlayer2": false,
        "player1Ready": false,
        "player2Ready": false
     ]
 }

 

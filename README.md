# gobang-js

A gobang game server.

![preview](https://github.com/lusterofgem/gobang-js/blob/main/assets/images/preview.png)

The client & server use stringify json to transfer message on the websocket.

e.g.

```
{
    "type": "chat",
    "content": "hello there"
}
```

## using port

 - http: 8080

 - websocket: 8081

## status

chat-box: ready ✔️

checkerboard: in-progress 🚧

identify different players: ready ✔️

hub: ready ✔️

battle room: ready ✔️

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

 

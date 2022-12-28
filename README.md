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

fixing ui: ready ✔️

login-page: ready ✔️

room-page: ready ✔️

checkerboard: ready ✔️

chat-box: ready ✔️

fixing bug: ready ✔️

## client to server message

- login
```
{
    "type": "login",
    "content": "Tom"
}
```

- create-room
```
{
    "type": "create-room",
}
```

- join-room
```
{
    "type": "join-room",
    "content": "0"
}
```

- quit-room
```
{
    "type": "quit-room"
}
```

- restart-game
```
{
    "type": "restart-game"
}
```

- put-chess
```
{
    "type": "put-chess",
    "content": "0,0"
}
```

- request-player-slot
```
{
    "type": "request-player-slot",
    "content": "player1"
}
```

- player-ready
```
{
    "type": "player-ready",
    "content": "player1"
}
```

- quit-player-slot
```
{
    "type": "quit-player-slot",
    "content": "player1"
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

- login-successful
```
{
    "type": "login-successful"
}
```

- login-failed
```
{
    "type": "login-failed",
    "content": "please input a valid name"
}
```

- sync-rooms
```
{
    "type": "sync-rooms",
    "content": [
        {},
        {},
        ...
    ]
}
```

- update-room-id
```
{
    "type": "update-room-id",
    "content": 0
}
```

- update-current-color
```
{
    "type": "update-current-color",
    "content": "black"
}
```

- update-restart-button-visibility
```
{
    "type": "update-restart-button-visibility",
    "content": true
}
```

- sync-checkerboard
```
{
    "type": "sync-checkerboard",
    "content": [
        ["", "", ...],
        ["", "", ...],
        ...
    ]
}
```

- put-chess
```
{
    "type": "put-chess",
    "content": "0,0,black"
}
```

- update-player-slot
```
{
    "type": "update-player-slot",
    "content": {
        "player1": "Tom",
        "player1ReadyButtonVisibility": true,
        "player1QuitButtonVisibility": true,
        "player1JoinButtonVisibility": false,
        "player2": "Jerry",
        "player1ReadyButtonVisibility": false,
        "player1QuitButtonVisibility": false,
        "player1JoinButtonVisibility": false
    }
}
```

- chat
```
{
    "type": "chat",
    "content": "Tom: hello there"
}
```

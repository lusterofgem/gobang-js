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

we are fixing bugs! 🚧

login-page: ready ✔️

room-page: ready ✔️

checkerboard: ready ✔️

chat-box: ready ✔️

## client to server message
- login
```
{
    "type": "login",
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
}
```

- quit-room
```
{
    "type": "quit-room",
}
```

- restart-game
```
{
    "type": "restart-game",
}
```

- put-chess
```
{
    "type": "put-chess",
}
```

- request-player-slot
```
{
    "type": "request-player-slot",
}
```

- player-ready
```
{
    "type": "player-ready",
}
```

- quit-player-slot
```
{
    "type": "quit-player-slot",
}
```

- chat
```
{
    "type": "chat",
}
```

## server to client message

- login-successful
```
{
    "type": "login-successful",
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
}
```

- update-room-id
```
{
    "type": "update-room-id",
}
```

- update-current-color
```
{
    "type": "update-current-color",
}
```

- update-restart-button-visibility
```
{
    "type": "update-restart-button-visibility",
}
```

- sync-checkerboard
```
{
    "type": "sync-checkerboard",
}
```

- put-chess
```
{
    "type": "put-chess",
}
```

- update-player-slot
```
{
    "type": "update-player-slot",
}
```

- chat
```
{
    "type": "chat",
}
```

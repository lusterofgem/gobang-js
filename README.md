# gobang-js

A gobang game server.

![preview](https://github.com/lusterofgem/gobang-js/blob/main/assets/images/preview)

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

 - chat

```
{
    "type": "chat",
    "content": "hello there"
}
```

 - restart-game

```
{
    "type": "restart-game",
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

 - chat

```
{
    "type": "chat",
    "content": "hello there"
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

 - change-turn

```
{
    "type": "change-turn",
    "content": "black"
}
```

 ---
 
**To add as a contributor, please edit the README file and just delete your name, then save your work**
 - 409856019 伍思彥
 - 408850302 彭湲涵
 - 408840220 洪嘉璟
 

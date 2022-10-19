# gobang-js

A gobang game server.

The client & serveer use ws to transfer message to communicate.

The message is a json (stringifed object), the structure is like this:

```
{
    "type": "chat",
    "content": "hello there"
}
```

# client to server message
 
 - put-chess

 - chat
 
 - restart-game

# server to client message

 - put-chess
 
 - chat
 
 - sync-checkerboard
 
 - sync-winner
 
 - change-turn

# using port

 - express: 8080

 - ws: 8081

# status

chat-box: ready ✔️

checkerboard: ready ✔️

hub: nope ❌

battle room: nope ❌


 ---
 
**To add as a contributor, please edit the README file and just delete your name, then save your work**
 - 409856019 伍思彥
 - 408850302 彭湲涵
 - 408840220 洪嘉璟
 

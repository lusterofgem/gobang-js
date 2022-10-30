const express = require("express");
const ws = require("ws");

const port = 8080;
const wsPort = 8081;

const app = express();

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/html/index.html");
});

app.use('/', express.static(__dirname + '/'));

app.listen(port);

// [output message]
// - login-successful
// - login-failed
//
// - sync-rooms
// - update-room-id
//
// - update-current-color
// - update-restart-button-visibility
// - sync-checkerboard
// - put-chess
// - update-player-slot
// - chat

// [input message]
// - login
//
// - create-room
// - join-room
//
// - quit-room
// - restart-game
// - put-chess
// - request-player-slot
// - player-ready
// - quit-player-slot
// - chat

const wss = new ws.WebSocketServer({port: wsPort});

const mapSize = 15;

// record client ip:port & name to key & value
let clientsName = {};

// record every rooms' information, e.g.
// [
//     {
//         "winner": ""                // "player1" or "player2"
//         "currentRound": "",         // "player1" or "player2"
//         "player1Color": "black",    // "black" or "white"
//         "player1Ready": false,       // true or false
//         "player2Ready": false,       // true or false
//         "player1": "",              // ipPort of player1
//         "player2": "",              // ipPort of player2
//         "players": [],              // an array of ipPort
//         "checkerboard": [           // checker board, an n*n array, value is "black" or "white"
//             ["", "", "", ...],
//             ["", "", "", ...],
//             ["", "", "", ...],
//             ...
//         ]
//      },
// ]
let rooms = [];

wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const clientPort = req.socket.remotePort;
    const clientIpPort = `${clientIp}:${clientPort}`;

    console.log(`${clientIpPort} connected!`);

    ws.on("message", (buffer) => {
        const messageRaw = buffer.toString();
        const message = JSON.parse(messageRaw);

        console.log(`recieved message: ${message["type"]}`); //debug!!

        switch(message["type"]) {
            case "login": {
                const requestedName = message["content"].trim();
                if(requestedName) { // valid name
                    if(Object.values(clientsName).includes(requestedName)) { // name already taken
                        let messageToClient = {};
                        messageToClient["type"] = "login-failed";
                        messageToClient["content"] = "name already taken";
                        const messageToClientRaw = JSON.stringify(messageToClient);
                        ws.send(messageToClientRaw);
                    } else { // successful login
                        clientsName[clientIpPort] = requestedName;
                        let messageToClient = {};
                        messageToClient["type"] = "login-successfully";
                        let messageToClientRaw = JSON.stringify(messageToClient);
                        ws.send(messageToClientRaw);

                        notifyClientSyncRooms(ws);
                    }
                } else { //empty name
                    let messageToClient = {};
                    messageToClient["type"] = "login-failed";
                    messageToClient["content"] = "please input a valid name";
                    const messageToClientRaw = JSON.stringify(messageToClient);
                    ws.send(messageToClientRaw);
                }
                break;
            }
            case "create-room": {
                // if the player is already in a room, ignore the message
                for(let roomId in rooms) {
                    if(rooms[roomId]["players"].includes(clientIpPort)) {
                        return;
                    }
                }

                // find the smallest available room id
                let roomId = rooms.length;
                for(let i = 0; i < rooms.length; ++i) {
                    if(rooms[i] == null) {
                        roomId = i;
                        break;
                    }
                }

                // create room
                rooms[roomId] = {};
                rooms[roomId]["currentRound"] = (Math.random() > 0.5) ? "player1" : "player2";
                rooms[roomId]["player1Color"] = rooms[roomId]["currentRound"] == "player1" ? "black" : "white";
                rooms[roomId]["checkerboard"] = [];
                for(let i = 0; i < mapSize; ++i) {
                    rooms[roomId]["checkerboard"][i] = [];
                    for(let j = 0; j < mapSize; ++j) {
                        rooms[roomId]["checkerboard"][i][j] = "";
                    }
                }
                rooms[roomId]["players"] = [clientIpPort];

                // notify client to update the joined room id
                let messageToClient = {};
                messageToClient["type"] = "update-room-id";
                messageToClient["content"] = roomId;
                let messageToClientRaw = JSON.stringify(messageToClient);
                ws.send(messageToClientRaw);

                // notify the client to sync checkerboard
                messageToClient = {};
                messageToClient["type"] = "sync-checkerboard"
                messageToClient["content"] = rooms[roomId]["checkerboard"];
                messageToClientRaw = JSON.stringify(messageToClient);
                ws.send(messageToClientRaw);

                // notify the client to update player slot
                notifyClientUpdatePlayerSlot(ws, roomId);

                // notify all clients in the room page to sync rooms
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    // if the client have not login, return
                    if(clientsName[ipPort] == null) {
                        return;
                    }
                    // if the client is in battle page, return
                    let roomId = null;
                    for(let i = 0; i < rooms.length; ++i) {
                        if(rooms[i] != null) {
                            if(rooms[i]["players"].includes(ipPort)) {
                                roomId = i;
                            }
                        }
                    }
                    if(roomId != null) {
                        return;
                    }

                    // send message
                    notifyClientSyncRooms(client);
                });

                // greeting to player in the same room
                messageToClient = {};
                messageToClient["type"] = "chat";
                messageToClient["content"] = `${clientsName[clientIpPort]} joined!`;
                messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[roomId]["players"].includes(ipPort)) {
                        client.send(messageToClientRaw);
                    }
                });

                break;
            }
            case "join-room": {
                let roomId = message["content"];
                // if the room is not available, return directly
                if(rooms[roomId] == null) {
                    return;
                }

                if(rooms[roomId]["players"] == null) {
                    rooms[roomId]["players"] = [];
                }
                rooms[roomId]["players"].push(clientIpPort);

                // notify client to update current color
                let player1Color = rooms[roomId]["player1Color"];
                let player2Color = player1Color === "black" ? "white" : "black";
                let messageToClient = {};
                messageToClient["type"] = "update-current-color";
                messageToClient["content"] = rooms[roomId]["currentRound"] === "player1" ? player1Color : player2Color;
                let messageToClientRaw = JSON.stringify(messageToClient);
                ws.send(messageToClientRaw);

                // notify client the joined room id
                messageToClient = {};
                messageToClient["type"] = "update-room-id";
                messageToClient["content"] = roomId;
                messageToClientRaw = JSON.stringify(messageToClient);
                ws.send(messageToClientRaw);

                // notify client to update restart button visibility
                notifyClientUpdateRestartButtonVisibility(ws, false);

                // notify the client to sync checkerboard
                messageToClient = {};
                messageToClient["type"] = "sync-checkerboard"
                messageToClient["content"] = rooms[roomId]["checkerboard"];
                messageToClientRaw = JSON.stringify(messageToClient);
                ws.send(messageToClientRaw);

                // notify the client to update player slot
                notifyClientUpdatePlayerSlot(ws, roomId);

                // greeting to player in the same room
                messageToClient = {};
                messageToClient["type"] = "chat";
                messageToClient["content"] = `${clientsName[clientIpPort]} joined!`;
                messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[roomId]["players"].includes(ipPort)) {
                        client.send(messageToClientRaw);
                    }
                });

                break;
            }
            case "quit-room": {
                let roomId = null;
                for(let i = 0; i < rooms.length; ++i) {
                    if(rooms[i] != null) {
                        if(rooms[i]["players"].includes(clientIpPort)) {
                            roomId = i;
                        }
                    }
                }

                // if the client is not in any room, return directly
                if(roomId == null) {
                    return;
                }

                // say goodbye to all client in the room
                let messageToClient = {};
                messageToClient["type"] = "chat";
                messageToClient["content"] = `${clientsName[clientIpPort]} leaved!`;
                let messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[roomId]["players"].includes(ipPort)) {
                        client.send(messageToClientRaw);
                    }
                });

                // if the player is player1 or player2 and the game has started
                if((clientIpPort == rooms[roomId]["player1"] || clientIpPort == rooms[roomId]["player2"]) && rooms[roomId]["winner"] === "") {
                    // if it is not game over yet, the opponent wins the game
                    let opponentIpPort = rooms[roomId]["player1"] == clientIpPort ? rooms[roomId]["player2"] : rooms[roomId]["player1"];
                    rooms[roomId]["winner"] = opponentIpPort == rooms[roomId]["player1"] ? "player1" : "player2";

                    // hint all players in the room who wins
                    let messageToClient = {};
                    messageToClient["type"] = "chat";
                    messageToClient["content"] = `[server] ${clientsName[opponentIpPort]} wins!`;
                    let messageToClientRaw = JSON.stringify(messageToClient);
                    wss.clients.forEach((client) => {
                        let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                        if(rooms[roomId]["players"].includes(ipPort)) {
                            client.send(messageToClientRaw);
                        }
                    });
                }

                // remove client from room
                if(rooms[roomId].black == clientIpPort) {
                    delete rooms[roomId].black;
                }
                if(rooms[roomId].player1 == clientIpPort) {
                    delete rooms[roomId].player1;
                }
                if(rooms[roomId].player2 == clientIpPort) {
                    delete rooms[roomId].player2;
                }
                rooms[roomId]["players"].splice(rooms[roomId]["players"].indexOf(clientIpPort), 1);
                if(rooms[roomId]["players"].length == 0) {
                    delete rooms[roomId];
                }

                // if the room not yet deleted, notify all clients in the same room to update player slot
                if(rooms[roomId] != null) {
                    // reset player1 and player2 ready state
                    delete rooms[roomId]["player1Ready"];
                    delete rooms[roomId]["player2Ready"];

                    // notify all clients in the room to update player slot
                    wss.clients.forEach((client) => {
                        let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                        if(rooms[roomId]["players"].includes(ipPort)) {
                            notifyClientUpdatePlayerSlot(client, roomId);
                        }
                    });
                } else {
                    // notify all clients in the room page to sync rooms
                    wss.clients.forEach((client) => {
                        let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                        // if the client have not login, return
                        if(clientsName[ipPort] == null) {
                            return;
                        }
                        // if the client is in battle page, return
                        let roomId = null;
                        for(let i = 0; i < rooms.length; ++i) {
                            if(rooms[i] != null) {
                                if(rooms[i]["players"].includes(ipPort)) {
                                    roomId = i;
                                }
                            }
                        }
                        if(roomId != null) {
                            return;
                        }

                        // send message
                        notifyClientSyncRooms(client);
                    });
                }

                // notify the quit client to sync rooms
                notifyClientSyncRooms(ws);

                break;
            }
            case "restart-game": {
                let roomId = null;
                for(let i = 0; i < rooms.length; ++i) {
                    if(rooms[i] != null) {
                        if(rooms[i]["players"].includes(clientIpPort)) {
                            roomId = i;
                        }
                    }
                }

                // if the game is not over, return
                if(rooms[roomId]["winner"] === "") {
                    return;
                }

                // if the requesting client is not player1 or player2, return
                if(clientIpPort !== rooms[roomId]["player1"] && clientIpPort !== rooms[roomId]["player2"]) {
                    return;
                }

                // if player1 or player2 is empty, return
                if(rooms[roomId]["player1"] == null && rooms[roomId]["player2"] == null) {
                    return;
                }

                // if one of the player is not ready, return
                if(!rooms[roomId]["player1Ready"] || !rooms[roomId]["player2Ready"]) {
                    return;
                }

                // reset the game
                rooms[roomId]["winner"] = "";
                rooms[roomId]["currentRound"] = (Math.random() > 0.5) ? "player1" : "player2";
                rooms[roomId]["player1Color"] = rooms[roomId]["currentRound"] == "player1" ? "black" : "white";

                // clear the checkerboard
                for(let i = 0; i < mapSize; ++i) {
                    for(let j = 0; j < mapSize; ++j) {
                        rooms[roomId]["checkerboard"][i][j] = "";
                    }
                }

                // notify all client to sync checkerboard
                let messageToClient = {};
                messageToClient["type"] = "sync-checkerboard";
                messageToClient["content"] = rooms[roomId]["checkerboard"];
                let messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[roomId]["players"].includes(ipPort)) {
                        client.send(messageToClientRaw);
                    }
                });

                // hint the game is restart
                messageToClient = {};
                messageToClient["type"] = "chat";
                messageToClient["content"] = "[server] game restart!";
                messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[roomId]["players"].includes(ipPort)) {
                        client.send(messageToClientRaw);
                    }
                });

                // notify player1 and player2 to change restart button visibility
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    // if the client is in this room and it is player1 or player2
                    if(rooms[roomId]["players"].includes(ipPort) & (ipPort === rooms[roomId]["player1"] || ipPort === rooms[roomId]["player2"])) {
                        notifyClientUpdateRestartButtonVisibility(client, false);
                    }
                });

                // notify client to sync current color
                messageToClient = {};
                messageToClient["type"] = "update-current-color";
                messageToClient["content"] = "black"
                messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    client.send(messageToClientRaw);
                });

                break;
            }
            case "put-chess": {
                let roomId = null;
                for(let i = 0; i < rooms.length; ++i) {
                    if(rooms[i] != null) {
                        if(rooms[i]["players"].includes(clientIpPort)) {
                            roomId = i;
                        }
                    }
                }

                // if player is not in a room, return
                if(roomId == null) {
                    return;
                }

                // game not started, return
                if(rooms[roomId]["winner"] == null) {
                    return;
                }

                // already game over, return
                if(rooms[roomId]["winner"] === "player1" || rooms[roomId]["winner"] === "player2" || rooms[roomId]["winner"] === "draw") {
                    return;
                }

                // if not both player are ready, return
                if(!rooms[roomId]["player1Ready"] || !rooms[roomId]["player2Ready"]) {
                    return;
                }

                // if the client is not the current round player, return
                if(rooms[roomId][rooms[roomId]["currentRound"]] !== clientIpPort) {
                    return;
                }

                const point = message["content"].split(",");
                const x = parseInt(point[0]);
                const y = parseInt(point[1]);

                // check if the point is valid
                if(!Number.isInteger(x) || !Number.isInteger(y) && x >= 0 && y >= 0 && x < mapSize && y < mapSize) {
                    return;
                }

                // if the point already have a chess, return
                if(rooms[roomId]["checkerboard"][x][y] !== "") {
                    return;
                }

                // get current color
                let currentColor;
                if(rooms[roomId]["currentRound"] == "player1") {
                    if(rooms[roomId]["player1Color"] == "black") {
                        currentColor = "black";
                    } else {
                        currentColor = "white";
                    }
                } else {
                    if(rooms[roomId]["player1Color"] == "black") {
                        currentColor = "white";
                    } else {
                        currentColor = "black";
                    }
                }

                // put chess to checkerboard
                rooms[roomId]["checkerboard"][x][y] = currentColor;

                // send put chess message to player in the same room
                let messageToClient = {};
                messageToClient["type"] = "put-chess";
                messageToClient["content"] = message["content"] + `,${currentColor}`;
                let messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[roomId]["players"].includes(ipPort)) {
                        rooms[roomId]["checkerboard"][x][y] = currentColor;
                        client.send(messageToClientRaw);
                    }
                });

                // change turn
                if(rooms[roomId]["currentRound"] == "player1") {
                    rooms[roomId]["currentRound"] = "player2";
                } else {
                    rooms[roomId]["currentRound"] = "player1";
                }
                currentColor = currentColor == "black" ? "white" : "black";

                // notify client to sync current color
                messageToClient = {};
                messageToClient["type"] = "update-current-color";
                messageToClient["content"] = currentColor;
                messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    client.send(messageToClientRaw);
                });


                // check winner
                // shape1
                // *
                //   *
                //     *
                //       *
                //         *
                for(let i = 0; i < mapSize - 4; ++i) {
                    for(let j = 0; j < mapSize - 4; ++j) {
                        for(let k = 1; k < 5; ++k) {
                            const firstColor = rooms[roomId]["checkerboard"][i][j];
                            if(firstColor === "") {
                                break;
                            }
                            if(firstColor !== rooms[roomId]["checkerboard"][i + k][j + k]) {
                                break;
                            }
                            if(k === 4) {
                                rooms[roomId]["winner"] = rooms[roomId]["firstColor"] == "player1Color" ? "player1" : "player2";
                            }
                        }
                    }
                }
                // shape2
                //         *
                //       *
                //     *
                //   *
                // *
                for(let i = 0; i < mapSize - 4; ++i) {
                    for(let j = 0; j < mapSize - 4; ++j) {
                        for(let k = 1; k < 5; ++k) {
                            const firstColor = rooms[roomId]["checkerboard"][i + 4][j];
                            if(firstColor === "") {
                                break;
                            }
                            if(firstColor !== rooms[roomId]["checkerboard"][i + (4 - k)][j + k]) {
                                break;
                            }
                            if(k === 4) {
                                rooms[roomId]["winner"] = rooms[roomId]["firstColor"] == "player1Color" ? "player1" : "player2";
                            }
                        }
                    }
                }
                // shape3
                // *
                // *
                // *
                // *
                // *
                for(let i = 0; i < mapSize; ++i) {
                    for(let j = 0; j < mapSize - 4; ++j) {
                        for(let k = 1; k < 5; ++k) {
                            const firstColor = rooms[roomId]["checkerboard"][i][j];
                            if(firstColor === "") {
                                break;
                            }
                            if(firstColor !== rooms[roomId]["checkerboard"][i][j + k]) {
                                break;
                            }
                            if(k === 4) {
                                rooms[roomId]["winner"] = rooms[roomId]["firstColor"] == "player1Color" ? "player1" : "player2";
                            }
                        }
                    }
                }
                // shape4
                // * * * * *
                for(let i = 0; i < mapSize - 4; ++i) {
                    for(let j = 0; j < mapSize; ++j) {
                        for(let k = 1; k < 5; ++k) {
                            const firstColor = rooms[roomId]["checkerboard"][i][j];
                            if(firstColor === "") {
                                break;
                            }
                            if(firstColor !== rooms[roomId]["checkerboard"][i + k][j]) {
                                break;
                            }
                            if(k === 4) {
                                rooms[roomId]["winner"] = rooms[roomId]["firstColor"] == "player1Color" ? "player1" : "player2";
                            }
                        }
                    }
                }

                // check if the checkerboard is full
                let checkerboardFull = true;
                for(let i = 0; i < mapSize; ++i) {
                    for(let j = 0; j < mapSize; ++j) {
                        if(rooms[roomId]["checkerboard"][i][j] === "") {
                            checkerboardFull = false;
                        }
                    }
                }
                if(checkerboardFull) {
                    rooms[roomId]["winner"] = "draw";
                }

                if(rooms[roomId]["winner"] !== "") {
                    // notify player1 and player2 to change restart button visibility
                    wss.clients.forEach((client) => {
                        let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                        // if the client is in this room and it is player1 or player2
                        if(rooms[roomId]["players"].includes(ipPort) && (ipPort === rooms[roomId]["player1"] || ipPort === rooms[roomId]["player2"])) {
                            notifyClientUpdateRestartButtonVisibility(client, true);
                        }
                    });

                    // send winning message to chat
                    messageToClient = {};
                    messageToClient["type"] = "chat";
                    if(rooms[roomId]["winner"] !== "draw") {
                        messageToClient["content"] = `[server] ${clientsName[rooms[roomId][rooms[roomId]["winner"]]]} wins!`;
                    } else {
                        messageToClient["content"] = `[server] It's a draw!`;
                    }
                    messageToClientRaw = JSON.stringify(messageToClient);
                    wss.clients.forEach((client) => {
                        let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                        if(rooms[roomId]["players"].includes(ipPort)) {
                            client.send(messageToClientRaw);
                        }
                    });
                }

                break;
            }
            case "request-player-slot": {
                let requestedPlayerSlot = message["content"];

                // if the requested player not "player1" or "player2", return
                if(requestedPlayerSlot !== "player1" && requestedPlayerSlot !== "player2") {
                    return;
                }

                // get the requesting client room id
                let roomId = null;
                for(let i = 0; i < rooms.length; ++i) {
                    if(rooms[i] != null) {
                        if(rooms[i]["players"].includes(clientIpPort)) {
                            roomId = i;
                        }
                    }
                }

                // if the client is not in any room, return
                if(roomId == null) {
                    return;
                }

                // if the requesting client is not in the room or the requesting player slot is not empty, return
                if(!rooms[roomId]["players"].includes(clientIpPort) || rooms[roomId][requestedPlayerSlot] != null) {
                    return;
                }

                // if the player is already in the another slot, remove from another slot
                if(requestedPlayerSlot === "player1") {
                    if(rooms[roomId]["player2"] == clientIpPort) {
                        delete rooms[roomId]["player2"];
                        delete rooms[roomId]["player2Ready"];
                    }

                } else {
                    // if the player is already in the player1 slot, remove from player1 slot
                    if(rooms[roomId]["player1"] == clientIpPort) {
                        delete rooms[roomId]["player1"];
                        delete rooms[roomId]["player1Ready"];
                    }
                }

                // join player1 slot
                rooms[roomId][requestedPlayerSlot] = clientIpPort;

                // notify all clients in the same room to update player slot
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[roomId]["players"].includes(ipPort)) {
                        notifyClientUpdatePlayerSlot(client, roomId);
                    }
                });

                break;
            }
            case "player-ready": {
                let requestedPlayerSlot = message["content"];

                // if the requested player not "player1" or "player2", return
                if(requestedPlayerSlot !== "player1" && requestedPlayerSlot !== "player2") {
                    return;
                }

                let roomId = null;
                for(let i = 0; i < rooms.length; ++i) {
                    if(rooms[i] != null) {
                        if(rooms[i]["players"].includes(clientIpPort)) {
                            roomId = i;
                        }
                    }
                }

                // if the client is not in any room, return directly
                if(roomId == null) {
                    return;
                }

                // if client is not in the slot, return
                if(rooms[roomId][requestedPlayerSlot] !== clientIpPort) {
                    return;
                }

                // set the state to ready on the specified player slot
                if(requestedPlayerSlot === "player1") {
                    rooms[roomId]["player1Ready"] = true;
                } else {
                    rooms[roomId]["player2Ready"] = true;
                }

                // start the game if two players are ready
                if(rooms[roomId]["player1Ready"] && rooms[roomId]["player2Ready"]) {
                    rooms[roomId]["winner"] = "";

                    rooms[roomId]["currentRound"] = (Math.random() > 0.5) ? "player1" : "player2";
                    rooms[roomId]["player1Color"] = rooms[roomId]["currentRound"] == "player1" ? "black" : "white";

                    // clear the checkerboard
                    for(let i = 0; i < mapSize; ++i) {
                        for(let j = 0; j < mapSize; ++j) {
                            rooms[roomId]["checkerboard"][i][j] = "";
                        }
                    }

                    // notify all clients in the room to sync checkerboard
                    let messageToClient = {};
                    messageToClient["type"] = "sync-checkerboard";
                    messageToClient["content"] = rooms[roomId]["checkerboard"];
                    let messageToClientRaw = JSON.stringify(messageToClient);
                    wss.clients.forEach((client) => {
                        let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                        if(rooms[roomId]["players"].includes(ipPort)) {
                            client.send(messageToClientRaw);
                        }
                    });

                    // hint the player in this room, the game is started
                    messageToClient = {};
                    messageToClient["type"] = "chat";
                    messageToClient["content"] = `[server] game started!`;
                    messageToClientRaw = JSON.stringify(messageToClient);
                    wss.clients.forEach((client) => {
                        let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                        if(rooms[roomId]["players"].includes(ipPort)) {
                            client.send(messageToClientRaw);
                        }
                    });
                }

                // notify all clients in the same room to update player slot
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[roomId]["players"].includes(ipPort)) {
                        notifyClientUpdatePlayerSlot(client, roomId);
                    }
                });

                break;
            }
            case "quit-player-slot": {
                let requestedPlayerSlot = message["content"];

                // if the requested player not "player1" or "player2", return
                if(requestedPlayerSlot !== "player1" && requestedPlayerSlot !== "player2") {
                    return;
                }

                let roomId = null;
                for(let i = 0; i < rooms.length; ++i) {
                    if(rooms[i] != null) {
                        if(rooms[i]["players"].includes(clientIpPort)) {
                            roomId = i;
                        }
                    }
                }

                // if the client is not in any room, return directly
                if(roomId == null) {
                    return;
                }

                // if client is not in requested player slot, return
                if(rooms[roomId][requestedPlayerSlot] !== clientIpPort) {
                    return;
                }

                // if it is not game over yet, the opponent wins the game
                if(rooms[roomId]["winner"] === "") {
                    let opponentIpPort = requestedPlayerSlot == "player1" ? rooms[roomId]["player2"] : rooms[roomId]["player1"];
                    rooms[roomId]["winner"] = requestedPlayerSlot == "player1" ? "player2" : "player1";

                    // say the winner to all players in the room
                    let messageToClient = {};
                    messageToClient["type"] = "chat";
                    messageToClient["content"] = `[server] ${clientsName[opponentIpPort]} wins!`;
                    let messageToClientRaw = JSON.stringify(messageToClient);
                    wss.clients.forEach((client) => {
                        let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                        if(rooms[roomId]["players"].includes(ipPort)) {
                            client.send(messageToClientRaw);
                        }
                    });
                }

                // notify player1 and player2 to update the restart button
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(ipPort === rooms[roomId]["player1"] || ipPort === rooms[roomId]["player2"]) {
                        notifyClientUpdateRestartButtonVisibility(client, false);
                    }
                });

                // remove the specified player information from the room
                delete rooms[roomId][requestedPlayerSlot];

                // unready the two players
                delete rooms[roomId]["player1Ready"];
                delete rooms[roomId]["player2Ready"];

                // notify all clients in the same room to update player slot
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[roomId]["players"].includes(ipPort)) {
                        notifyClientUpdatePlayerSlot(client, roomId);
                    }
                });

                break;
            }
            case "chat": {
                // send chat to player in the same room
                let messageToClient = {};
                messageToClient["type"] = "chat";
                messageToClient["content"] = `${clientsName[clientIpPort]}: ${message["content"]}`;
                const messageToClientRaw = JSON.stringify(messageToClient);
                let roomId = null;
                for(let i = 0; i < rooms.length; ++i) {
                    if(rooms[i] != null) {
                        if(rooms[i]["players"].includes(clientIpPort)) {
                            roomId = i;
                        }
                    }
                }
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[roomId]["players"].includes(ipPort)) {
                        client.send(messageToClientRaw);
                    }
                });
                break;
            }
        }
    });

    ws.on("close", () => {
        console.log(`${clientIpPort} disconnected!`);

        let roomId = null;
        for(let i = 0; i < rooms.length; ++i) {
            if(rooms[i] != null) {
                if(rooms[i]["players"].includes(clientIpPort)) {
                    roomId = i;
                }
            }
        }

        // delete name record and return, if the client is not in a room
        if(roomId == null) {
            delete clientsName[clientIpPort];
            return;
        }

        // say goodbye to all players in the same room
        let messageToClient = {};
        messageToClient["type"] = "chat";
        messageToClient["content"] = `${clientsName[clientIpPort]} leaved!`;
        let messageToClientRaw = JSON.stringify(messageToClient);
        wss.clients.forEach((client) => {
            let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
            if(rooms[roomId]["players"].includes(ipPort)) {
                client.send(messageToClientRaw);
            }
        });

        // if it is not game over yet, the opponent wins the game
        if(rooms[roomId]["winner"] === "") {
            let opponentIpPort = rooms[roomId]["player1"] == clientIpPort ? rooms[roomId]["player2"] : rooms[roomId]["player1"];
            rooms[roomId]["winner"] = opponentIpPort == rooms[roomId]["player1"] ? "player1" : "player2";

            // hint all players in the room
            let messageToClient = {};
            messageToClient["type"] = "chat";
            messageToClient["content"] = `[server] ${clientsName[opponentIpPort]} wins!`;
            let messageToClientRaw = JSON.stringify(messageToClient);
            wss.clients.forEach((client) => {
                let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                if(rooms[roomId]["players"].includes(ipPort)) {
                    client.send(messageToClientRaw);
                }
            });
        }

        // remove client from room
        if(roomId != null) {
            delete rooms[roomId]["player1Color"];
            if(rooms[roomId]["player1"] == clientIpPort) {
                delete rooms[roomId]["player1"];
                delete rooms[roomId]["player1Ready"];
            }
            if(rooms[roomId]["player2"] == clientIpPort) {
                delete rooms[roomId]["player2"];
                delete rooms[roomId]["player2Ready"];
            }
            rooms[roomId]["players"].splice(rooms[roomId]["players"].indexOf(clientIpPort), 1);
            if(rooms[roomId]["players"].length == 0) {
                delete rooms[roomId];
            }
        }

        // if the room not yet deleted, notify all clients in the same room to update player slot
        if(rooms[roomId] != null) {
            wss.clients.forEach((client) => {
                let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                if(rooms[roomId]["players"].includes(ipPort)) {
                    notifyClientUpdatePlayerSlot(client, roomId);
                }
            });
        } else {
            // notify all clients in the room page to sync rooms
            wss.clients.forEach((client) => {
                let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                // if the client have not login, return
                if(clientsName[ipPort] == null) {
                    return;
                }
                // if the client is in battle page, return
                let roomId = null;
                for(let i = 0; i < rooms.length; ++i) {
                    if(rooms[i] != null) {
                        if(rooms[i]["players"].includes(ipPort)) {
                            roomId = i;
                        }
                    }
                }
                if(roomId != null) {
                    return;
                }

                // send message
                notifyClientSyncRooms(client);
            });
        }

        // remove client ip:port and name record from object
        delete clientsName[clientIpPort];
    });

    // notify client to update restart button visibility
    function notifyClientUpdateRestartButtonVisibility(wsClient, visible) {
        messageToClient = {};
        messageToClient["type"] = "update-restart-button-visibility";
        messageToClient["content"] = visible ?? false;
        messageToClientRaw = JSON.stringify(messageToClient);
        wsClient.send(messageToClientRaw);
    }

    // notify client to update player slot
    function notifyClientUpdatePlayerSlot(wsClient, roomId) {
        let ipPort = `${wsClient["_socket"]["_peername"]["address"]}:${wsClient["_socket"]["_peername"]["port"]}`;

        let messageToClient = {};
        messageToClient["type"] = "update-player-slot";
        messageToClient["content"] = {};

        messageToClient["content"]["player1"] = clientsName[rooms[roomId]["player1"]] ?? "";
        messageToClient["content"]["player1ReadyButtonVisibility"] = ((rooms[roomId]["player1"] == ipPort) && (!rooms[roomId]["player1Ready"])) ? true : false;
        messageToClient["content"]["player1QuitButtonVisibility"] = rooms[roomId]["player1"] == ipPort ? true : false;
        messageToClient["content"]["player1JoinButtonVisibility"] = rooms[roomId]["player1"] == null ? true : false;

        messageToClient["content"]["player2"] = clientsName[rooms[roomId]["player2"]] ?? "";
        messageToClient["content"]["player2ReadyButtonVisibility"] = ((rooms[roomId]["player2"] == ipPort) && (!rooms[roomId]["player2Ready"])) ? true : false;
        messageToClient["content"]["player2QuitButtonVisibility"] = rooms[roomId]["player2"] == ipPort ? true : false;
        messageToClient["content"]["player2JoinButtonVisibility"] = rooms[roomId]["player2"] == null ? true : false;

        let messageToClientRaw = JSON.stringify(messageToClient);
        wsClient.send(messageToClientRaw);
    }

    // notify client to sync rooms
    function notifyClientSyncRooms(wsClient) {
        let roomsInfo = [];
        for(let i = 0; i < rooms.length; ++i) {
            if(rooms[i] == null) {
                roomsInfo = null;
                continue;
            }
            roomsInfo[i] = {};
        }
        messageToClient = {};
        messageToClient["type"] = "sync-rooms";
        messageToClient["content"] = roomsInfo;
        messageToClientRaw = JSON.stringify(messageToClient);
        wsClient.send(messageToClientRaw);
    }
});

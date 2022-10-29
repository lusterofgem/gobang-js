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
// - join-room
//
// - put-chess
// - sync-checkerboard
// - sync-winner
// - sync-turn
// - chat

// [input message]
// - login
//
// - create-room
// - join-room
// - quit-room
//
// - put-chess
// - restart-game
// - chat

const wss = new ws.WebSocketServer({port: wsPort});

const mapSize = 15;

// possible: "", "black", "white"
let winner = "";

// record client ip:port & name to key & value
let clientsName = {};

let currentColor = "black";
let checkerboard = [];
for(let i = 0; i < mapSize; ++i) {
    checkerboard[i] = [];
    for(let j = 0; j < mapSize; ++j) {
        checkerboard[i][j] = "";
    }
}
// record every rooms' information, e.g.
// [
//     {
//         "currentRound": "player1",
//         "black": "player1",
//         "player1": "",
//         "player2": "",
//         "players": [],
//         "checkerboard": [
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

    // notify client to sync checkerboard
    // message = {};
    // message["type"] = "sync-checkerboard";
    // message["content"] = checkerboard;
    // messageRaw = JSON.stringify(message);
    // wss.clients.forEach((client) => {
    //     client.send(messageRaw);
    // });

    // notify client to sync turn
    // messageToClient = {};
    // messageToClient["type"] = "sync-turn";
    // messageToClient["content"] = currentColor
    // messageToClientRaw = JSON.stringify(messageToClient);
    // wss.clients.forEach((client) => {
    //     client.send(messageToClientRaw);
    // });

    // notify client to sync winner
    // message = {};
    // message["type"] = "sync-winner";
    // message["content"] = winner;
    // messageRaw = JSON.stringify(message);
    // wss.clients.forEach((client) => {
    //     client.send(messageRaw);
    // });

    ws.on("message", (buffer) => {
        const messageRaw = buffer.toString();
        // console.log(messageRaw);
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

                        // notify client to sync rooms
                        messageToClient = {};
                        messageToClient["type"] = "sync-rooms";
                        messageToClient["content"] = rooms;
                        messageToClientRaw = JSON.stringify(messageToClient);
                        ws.send(messageToClientRaw);
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
                let choosedRoomId = rooms.length;
                for(let i = 0; i < rooms.length; ++i) {
                    if(rooms[i] == null) {
                        choosedRoomId = i;
                        break;
                    }
                }

                rooms[choosedRoomId] = {};
                rooms[choosedRoomId]["players"] = [clientIpPort];

                let messageToClient = {};
                messageToClient["type"] = "join-room";
                messageToClient["content"] = choosedRoomId;
                let messageToClientRaw = JSON.stringify(messageToClient);
                ws.send(messageToClientRaw);

                // greeting to player in the same room
                messageToClient = {};
                messageToClient["type"] = "chat";
                messageToClient["content"] = `${clientsName[clientIpPort]} joined!`;
                messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    let ipPort = `${client["_socket"]["_peername"]["address"]}:${client["_socket"]["_peername"]["port"]}`;
                    if(rooms[choosedRoomId]["players"].includes(ipPort)) {
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

                let messageToClient = {};
                messageToClient["type"] = "join-room";
                messageToClient["content"] = roomId;
                let messageToClientRaw = JSON.stringify(messageToClient);
                ws.send(messageToClientRaw);

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

                // notify quit client to sync rooms
                messageToClient = {};
                messageToClient["type"] = "sync-rooms";
                messageToClient["content"] = rooms;
                messageToClientRaw = JSON.stringify(messageToClient);
                ws.send(messageToClientRaw);

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
            case "put-chess": {
                // game over, return directly
                if(winner === "black" || winner === "white") {
                    return;
                }

                const point = message["content"].split(",");
                const x = parseInt(point[0]);
                const y = parseInt(point[1]);

                if(!Number.isInteger(x) || !Number.isInteger(y)) {
                    return;
                }

                if(checkerboard[x][y] !== "") {
                    return;
                }

                // send put chess message to client
                console.log(`${clientIpPort}: [${message["type"]}]${message["content"]}`);
                let messageToClient = message;
                messageToClient["content"] = message["content"] + `,${currentColor}`;
                let messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    checkerboard[x][y] = currentColor;
                    client.send(messageToClientRaw);
                });

                // change turn
                if(currentColor == "black") {
                    currentColor = "white";
                } else {
                    currentColor = "black";
                }
                // notify client to sync turn
                messageToClient = {};
                messageToClient["type"] = "sync-turn";
                messageToClient["content"] = currentColor
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
                            const firstColor = checkerboard[i][j];
                            if(firstColor === "") {
                                break;
                            }
                            if(firstColor !== checkerboard[i + k][j + k]) {
                                break;
                            }
                            if(k === 4) {
                                winner = firstColor;
                                console.log(`winner is ${winner}, shape1`); //debug!!
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
                            const firstColor = checkerboard[i + 4][j];
                            if(firstColor === "") {
                                break;
                            }
                            if(firstColor !== checkerboard[i + (4 - k)][j + k]) {
                                break;
                            }
                            if(k === 4) {
                                winner = firstColor;
                                console.log(`winner is ${winner}, shape2`); //debug!!
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
                            const firstColor = checkerboard[i][j];
                            if(firstColor === "") {
                                break;
                            }
                            if(firstColor !== checkerboard[i][j + k]) {
                                break;
                            }
                            if(k === 4) {
                                winner = firstColor;
                                console.log(`winner is ${winner}, shape3`); //debug!!
                            }
                        }
                    }
                }
                // shape4
                // * * * * *
                for(let i = 0; i < mapSize - 4; ++i) {
                    for(let j = 0; j < mapSize; ++j) {
                        for(let k = 1; k < 5; ++k) {
                            const firstColor = checkerboard[i][j];
                            if(firstColor === "") {
                                break;
                            }
                            if(firstColor !== checkerboard[i + k][j]) {
                                break;
                            }
                            if(k === 4) {
                                winner = firstColor;
                                console.log(`winner is ${winner}, shape4`); //debug!!
                            }
                        }
                    }
                }

                // check if the checkerboard is full
                let checkerboardFull = true;
                for(let i = 0; i < mapSize; ++i) {
                    for(let j = 0; j < mapSize; ++j) {
                        if(checkerboard[i][j] === "") {
                            checkerboardFull = false;
                        }
                    }
                }
                if(checkerboardFull) {
                    winner = "draw";
                }

                if(winner !== "") {
                    // notify client to sync winner
                    let messageToClient = {};
                    messageToClient["type"] = "sync-winner";
                    messageToClient["content"] = winner;
                    let messageToClientRaw = JSON.stringify(messageToClient);
                    wss.clients.forEach((client) => {
                        client.send(messageToClientRaw);
                    });

                    // send winning message to chat
                    messageToClient = {};
                    messageToClient["type"] = "chat";
                    if(winner !== "draw") {
                        messageToClient["content"] = `[server] ${winner} wins!`;
                    } else {
                        messageToClient["content"] = `[server] It's a draw!`;
                    }
                    messageToClientRaw = JSON.stringify(messageToClient);
                    wss.clients.forEach((client) => {
                        client.send(messageToClientRaw);
                    });
                }

                break;
            }
            case "restart-game": {
                if(winner === "") {
                    return;
                }

                winner = "";

                currentColor = "black";

                // clear checkerboard
                for(let i = 0; i < mapSize; ++i) {
                    for(let j = 0; j < mapSize; ++j) {
                        checkerboard[i][j] = ""
                    }
                }

                // notify client to sync checkerboard
                let message = {};
                message["type"] = "sync-checkerboard";
                message["content"] = checkerboard;
                let messageRaw = JSON.stringify(message);
                wss.clients.forEach((client) => {
                    client.send(messageRaw);
                });

                // notify client to sync winner
                message = {};
                message["type"] = "sync-winner";
                message["content"] = winner;
                messageRaw = JSON.stringify(message);
                wss.clients.forEach((client) => {
                    client.send(messageRaw);
                });

                // notify client to sync turn
                messageToClient = {};
                messageToClient["type"] = "sync-turn";
                messageToClient["content"] = currentColor
                messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    client.send(messageToClientRaw);
                });

                break;
            }
        }
    });

    ws.on("close", () => {
        console.log(`${clientIpPort} disconnected!`);

        // say goodbye to all players in the same room
        let roomId = null;
        for(let i = 0; i < rooms.length; ++i) {
            if(rooms[i] != null) {
                if(rooms[i]["players"].includes(clientIpPort)) {
                    roomId = i;
                }
            }
        }
        if(roomId != null) {
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
        }

        // remove client from room
        if(roomId != null) {
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
        }
        // remove client ip:port and name record from object
        delete clientsName[clientIpPort];
    });
});

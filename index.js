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

// output message
// - put-chess
// - sync-checkerboard
// - sync-winner
// - sync-turn
// - chat

// input messae
// - put-chess
// - restart-game
// - chat

const wss = new ws.WebSocketServer({port: wsPort});

const mapSize = 15;

let currentColor = "black";
let checkerboard = [];
for(let i = 0; i < mapSize; ++i) {
    checkerboard[i] = [];
    for(let j = 0; j < mapSize; ++j) {
        checkerboard[i][j] = "";
    }
}
// possible: "", "black", "white"
let winner = "";


wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const clientPort = req.socket.remotePort;
    const clientName = `${clientIp}:${clientPort}`;

    // greeting
    console.log(`${clientName} joined!`);
    let message = {};
    message["type"] = "chat";
    message["content"] = `${clientName} joined!`;
    let messageRaw = JSON.stringify(message);
    wss.clients.forEach((client) => {
        client.send(messageRaw);
    });

    // notify client to sync checkerboard
    message = {};
    message["type"] = "sync-checkerboard";
    message["content"] = checkerboard;
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

    // notify client to sync winner
    message = {};
    message["type"] = "sync-winner";
    message["content"] = winner;
    messageRaw = JSON.stringify(message);
    wss.clients.forEach((client) => {
        client.send(messageRaw);
    });


    ws.on("message", (buffer) => {
        const messageRaw = buffer.toString();
        // console.log(messageRaw);
        const message = JSON.parse(messageRaw);

        switch(message["type"]) {
            case "chat": {
                console.log(`${clientName}: [${message["type"]}]${message["content"]}`);
                let messageToClient = message;
                messageToClient["content"] = `${clientName}: ${message["content"]}`;
                const messageToClientRaw = JSON.stringify(messageToClient);
                wss.clients.forEach((client) => {
                    client.send(messageToClientRaw);
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
                console.log(`${clientName}: [${message["type"]}]${message["content"]}`);
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
        console.log(`${clientName} leaved!`);
        let message = {};
        message["type"] = "chat";
        message["content"] = `${clientName} leaved!`;
        let messageRaw = JSON.stringify(message);
        wss.clients.forEach((client) => {
            client.send(messageRaw)
        });
    });
});

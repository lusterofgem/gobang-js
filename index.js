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

wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const clientPort = req.socket.remotePort;
    const clientName = `${clientIp}:${clientPort}`;

    // greetings
    console.log(`${clientName} joined!`);
    let message = {};
    message["type"] = "chat";
    message["content"] = `${clientName} joined!`;
    let messageRaw = JSON.stringify(message);
    wss.clients.forEach((client) => {
        client.send(messageRaw);
    });

    // sync checkerboard
    message = {};
    message["type"] = "sync-checkerboard";
    message["content"] = checkerboard;
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
                const point = message["content"].split(",");
                const x = parseInt(point[0]);
                const y = parseInt(point[1]);

                if(!Number.isInteger(x) || !Number.isInteger(y)) {
                    return;
                }

                if(checkerboard[x][y] !== "") {
                    return;
                }

                console.log(`${clientName}: [${message["type"]}]${message["content"]}`);
                let messageToClient = message;
                messageToClient["content"] = message["content"] + `,${currentColor}`;
                const messageToClientRaw = JSON.stringify(messageToClient);
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

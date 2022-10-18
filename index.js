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

    console.log(`${clientName} joined!`);
    wss.clients.forEach((client) => {
        client.send(`[chat]${clientName} joined!`);
    });

    ws.on("message", (buffer) => {
        const message = buffer.toString();

        // only handle message in specific pattern, e.g. "[text]hello, world"
        if(message.search(/\[.*\].*/) !== 0) {
            console.log(`${clientName} send message with invalid format!`);
            return;
        }

        const closeSquareBracketIndex = message.indexOf("]");
        const messageType = message.slice(1, closeSquareBracketIndex);
        const messageContent = message.slice(closeSquareBracketIndex + 1, message.length);
        switch(messageType) {
            case "chat": {
                const chat = messageContent;
                console.log(`${clientName}: ${message}`);
                wss.clients.forEach((client) => {
                    client.send(`[chat]${clientName}: ${chat}`);
                });
                break;
            }
            case "chess": {
                const point = messageContent.split(",");
                const x = parseInt(point[0]);
                const y = parseInt(point[1]);

                if(!Number.isInteger(x) || !Number.isInteger(y)) {
                    return;
                }

                if(checkerboard[x][y] !== "") {
                    return;
                }

                console.log(`${clientName}: ${message}`);
                wss.clients.forEach((client) => {
                    checkerboard[x][y] = currentColor;
                    client.send(`[chess]${x},${y},${currentColor}`);
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
        wss.clients.forEach((client) => {
            client.send(`[chat]${clientName} leaved!`);
        });
    });
});

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

wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    const clientPort = req.socket.remotePort;
    const clientName = `${clientIp}:${clientPort}`;

    console.log(`${clientName} joined!`);
    wss.clients.forEach((client) => {
        client.send(`${clientName} joined!`);
    });

    ws.on("message", (buffer) => {
        const message = buffer.toString();
        console.log(`${clientName}: ${message}`);
        wss.clients.forEach((client) => {
            client.send(`${clientName}: ${message}`);
        });
    });

    ws.on("close", () => {
        console.log(`${clientName} leaved!`);
        wss.clients.forEach((client) => {
            client.send(`${clientName} leaved!`);
        });
    });
});

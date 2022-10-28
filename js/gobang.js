// [output message]
// - login
//
// - create-room
// - join-room
// - quit-room
//
// - put-chess
// - restart-game
// - chat

// [input message]
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

document.addEventListener("DOMContentLoaded", () => {
    let ws = new WebSocket(`ws://${location.hostname}:8081`);

    let loginPage = document.getElementById("login-page");
    let loginInput = document.getElementById("login-input");
    let loginButton = document.getElementById("login-button");
    let loginHintLabel = document.getElementById("login-hint-label")

    let roomPage = document.getElementById("room-page");
    let roomList = document.getElementById("room-list");
    let createRoomButton = document.getElementById("create-room-button");

    let battlePage = document.getElementById("battle-page");
    let roomIdJoinInput = document.getElementById("room-id-join-input");
    let roomIdJoinButton = document.getElementById("room-id-join-button");
    let roomIdLabel = document.getElementById("room-id-label");
    let quitRoomButton = document.getElementById("quit-room-button");
    let checkerboard = document.getElementById("checkerboard");
    let context = checkerboard.getContext("2d");
    let chessColorImage = document.getElementById("chess-color-image");
    let restartButton = document.getElementById("restart-button");
    let textArea = document.getElementById("text-area");
    let textInput = document.getElementById("text-input");
    let textButton = document.getElementById("text-button");

    const mapSize = 15;
    const canvasSize = checkerboard.width;
    const unitSize = canvasSize / mapSize;
    const chessSize = unitSize * 0.8;
    const marginSize = unitSize / 2;

    drawCheckerboard();

    loginInput?.addEventListener("keyup", (event) => {
        if(event.key == "Enter") {
            let message = {};
            message["type"] = "login";
            message["content"] = loginInput.value;
            let messageRaw = JSON.stringify(message);
            loginInput.value = "";
            ws.send(messageRaw);
        }
    });

    loginButton?.addEventListener("click", () => {
        let message = {};
        message["type"] = "login";
        message["content"] = loginInput.value;
        let messageRaw = JSON.stringify(message);
        loginInput.value = "";
        ws.send(messageRaw);
    });

    roomIdJoinInput?.addEventListener("keyup", (event) => {
        if(event.key == "Enter") {
            let message = {};
            message["type"] = "join-room";
            message["content"] = roomIdJoinInput.value;
            let messageRaw = JSON.stringify(message);
            roomIdJoinInput.value = "";
            ws.send(messageRaw);
        }
    });

    roomIdJoinButton?.addEventListener("click", () => {
        let message = {};
        message["type"] = "join-room";
        message["content"] = roomIdJoinInput.value;
        let messageRaw = JSON.stringify(message);
        roomIdJoinInput.value = "";
        ws.send(messageRaw);
    });

    createRoomButton?.addEventListener("click", () => {
        let message = {};
        message["type"] = "create-room";
        let messageRaw = JSON.stringify(message);
        ws.send(messageRaw);
    });

    quitRoomButton?.addEventListener("click", () => {
        let message = {};
        message["type"] = "quit-room";
        let messageRaw = JSON.stringify(message);
        ws.send(messageRaw);

        battlePage.style.display = "none";
        roomPage.style.display = "block";
    });

    checkerboard?.addEventListener("click", (event) => {
        const clickX = event.offsetX;
        const clickY = event.offsetY;

        let mapX = parseInt(clickX / unitSize);
        let mapY = parseInt(clickY / unitSize);

        if(mapX === mapSize) {
            mapX = mapX - 1;
        }
        if(mapY === mapSize) {
            mapY = mapY - 1;
        }

        let message = {};
        message["type"] = "put-chess";
        message["content"] = `${mapX},${mapY}`;
        let messageRaw = JSON.stringify(message);
        ws.send(messageRaw);
    });

    restartButton?.addEventListener("click", () => {
        let message = {};
        message["type"] = "restart-game";
        let messageRaw = JSON.stringify(message);
        ws.send(messageRaw);
    });

    textInput?.addEventListener("keyup", (event) => {
        if(event.key == "Enter") {
            if(textInput.value !== "") {
                let message = {};
                message["type"] = "chat";
                message["content"] = textInput.value;
                let messageRaw = JSON.stringify(message);
                textInput.value = "";
                ws.send(messageRaw);
            }
        }
    })

    textButton?.addEventListener("click", () => {
        if(textInput.value !== "") {
            let message = {};
            message["type"] = "chat";
            message["content"] = textInput.value;
            let messageRaw = JSON.stringify(message);
            textInput.value = "";
            ws.send(messageRaw);
        }
    });

    ws.onmessage = async (event) => {
        const messageRaw = await event.data;
        const message = JSON.parse(messageRaw);

        console.log(`recieved message: ${message["type"]}`) //debug!!

        switch(message["type"]) {
            case "login-successfully": {
                loginPage.style.display = "none";
                roomPage.style.display = "block";
                loginHintLabel.textContent = "";
                break;
            }
            case "login-failed": {
                let failedMessage = message["content"];
                loginHintLabel.textContent = failedMessage;
                break;
            }
            case "sync-rooms": {
                // clear all rooms
                let roomBoxes = roomList.children;
                for(let i = roomBoxes.length - 1; i >= 0 ; --i) {
                    if(roomBoxes[i].id != "create-room-box") {
                        roomBoxes[i].remove();
                    }
                }

                // <div class="room">
                //     <label class="room-label">0</label>
                //     <button class="room-button">join</button>
                // </div>
                let rooms = message["content"];
                for(let roomId in rooms) {
                    if(rooms[roomId] != null) {
                        console.log(rooms[roomId]);
                        let roomBox = document.createElement("div");
                        let roomLabel = document.createElement("label");
                        let roomButton = document.createElement("button");

                        roomBox.classList.add("room-box");
                        roomLabel.classList.add("room-label");
                        roomLabel.innerText = roomId;
                        roomButton.innerText = "join";
                        roomButton.classList.add("room-button");
                        // roomButton.id = `room-button-${roomId}`;
                        roomButton.addEventListener("click", () => {
                            let message = {};
                            message["type"] = "join-room";
                            message["content"] = roomId;
                            let messageRaw = JSON.stringify(message);
                            ws.send(messageRaw);
                        });

                        roomList.append(roomBox);
                        roomBox.append(roomLabel);
                        roomBox.append(roomButton);
                    }
                }
                break;
            }
            case "join-room": {
                let roomId = message["content"];
                roomPage.style.display = "none";
                battlePage.style.display = "block";
                roomIdLabel.innerText = `room id: ${roomId}`;
                textArea.value = "";

                break;
            }
            case "put-chess": {
                const point = message["content"].split(",");
                const x = parseInt(point[0]);
                const y = parseInt(point[1]);
                const color = point[2];
                if(!Number.isInteger(x) || !Number.isInteger(y)) {
                    return;
                }
                putChess(x, y, color);

                break;
            }
            case "sync-turn": {
                const color = message["content"];
                chessColorImage.src = `/assets/images/${color}.png`;
                break;
            }
            case "sync-checkerboard": {
                context.clearRect(0, 0, canvasSize, canvasSize);
                drawCheckerboard();
                const checkerboard = message["content"];
                for(let i in checkerboard) {
                    for(let j in checkerboard[i]) {
                        if(checkerboard[i][j] !== "") {
                            const color = checkerboard[i][j];
                            putChess(i, j, color);
                        }
                    }
                }
                break;
            }
            case "sync-winner": {
                const winner = message["content"];
                if(winner === "") {
                    restartButton.style.visibility = "hidden";
                } else {
                    restartButton.style.visibility = "visible";
                }
                break;
            }
            case "chat": {
                const chat = message["content"];
                textArea.value += message["content"] + "\n";
            }
        }
    }

    function drawCheckerboard() {
        context.beginPath();
        context.closePath();
        context.strokeStyle="black";
        for(let i = 0; i < mapSize; ++i) {
            context.moveTo(marginSize, marginSize + unitSize * i);
            context.lineTo(canvasSize - marginSize, marginSize + unitSize * i);
            context.stroke();

            context.moveTo(marginSize + unitSize * i, marginSize);
            context.lineTo(marginSize + unitSize * i, canvasSize - marginSize);
            context.stroke();
        }
    }

    function putChess(mapX, mapY, color) {
        context.beginPath();
        const canvasX = marginSize + mapX * unitSize;
        const canvasY = marginSize + mapY * unitSize;
        const radius = chessSize / 2;
        const startAngle = 0;
        const endAngle = 2 * Math.PI;
        context.arc(canvasX, canvasY, radius, startAngle, endAngle);
        context.closePath();

        let radialGradient = context.createRadialGradient(canvasX, canvasY, chessSize / 2, canvasX, canvasY, 0);
        if(color === "black") {
            radialGradient.addColorStop(0, "black");
            radialGradient.addColorStop(1, "gray");
        } else if(color === "white") {
            radialGradient.addColorStop(0, "#DCDCDC");
            radialGradient.addColorStop(1, "white");
        }

        context.fillStyle = radialGradient;
        context.fill();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    let ws = new WebSocket(`ws://${location.hostname}:8081`);

    let checkerboard = document.getElementById("checkerboard");
    let context = checkerboard.getContext("2d");
    context.strokeStyle="black";

    const mapSize = 15;
    const canvasSize = 600;
    const unitSize = canvasSize / mapSize;
    const chessSize = unitSize * 0.8;

    const marginSize = unitSize / 2;
    for(let i = 0; i < mapSize; ++i) {
        context.moveTo(marginSize, marginSize + unitSize * i);
        context.lineTo(canvasSize - marginSize, marginSize + unitSize * i);
        context.stroke();

        context.moveTo(marginSize + unitSize * i, marginSize);
        context.lineTo(marginSize + unitSize * i, canvasSize - marginSize);
        context.stroke();
    }

    checkerboard.addEventListener("click", (event) => {
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

        ws.send(`[chess]${mapX},${mapY}`)
        // putChess(mapX, mapY, "black");
    });

    ws.onmessage = async (event) => {
        const message = await event.data;
        // only handle message in specific pattern, e.g. "[text]hello, world"
        if(message.search(/\[.*\].*/) !== 0) {
            console.log(`server send message with invalid format!\n${message}`);
            return;
        }
        const closeSquareBracketIndex = message.indexOf("]");
        const messageType = message.slice(1, closeSquareBracketIndex);
        const messageContent = message.slice(closeSquareBracketIndex + 1, message.length);
        if(messageType != "chess") {
            return;
        }
        const point = messageContent.split(",");
        const x = parseInt(point[0]);
        const y = parseInt(point[1]);
        const color = point[2];
        if(!Number.isInteger(x) || !Number.isInteger(y)) {
            return;
        }
        putChess(x, y, color);
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

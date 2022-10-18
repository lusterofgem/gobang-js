document.addEventListener("DOMContentLoaded", () => {
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

        putChess(mapX, mapY, "black");
    });

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

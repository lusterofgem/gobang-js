document.addEventListener("DOMContentLoaded", () => {
    //畫布畫筆
    let checkerboard = document.getElementById("checkerboard");
    let context = checkerboard.getContext("2d"); //context可以看作畫筆
    context.strokeStyle="#bfbfbf";              //畫筆的顏色

    // //載入棋盤
    // for(var i=0;i<15;i++) {
    //     context.moveTo(15,15+30*i);          //橫線（x，y）起始點
    //     context.lineTo(435,15+30*i);           //橫線（x，y）終止點
    //     context.stroke();                              //畫一條線
    //
    //     context.moveTo(15+30*i,15);           //豎線
    //     context.lineTo(15+30*i,435);
    //     context.stroke();
    // }

    //載入棋盤
    for(var i=0;i<15;i++) {
        context.moveTo(0,30*i);          //橫線（x，y）起始點
        context.lineTo(420,30*i);           //橫線（x，y）終止點
        context.stroke();                              //畫一條線

        context.moveTo(30*i,0);           //豎線
        context.lineTo(30*i,420);
        context.stroke();
    }
});

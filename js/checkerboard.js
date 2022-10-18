//畫布畫筆
var chess = document.getElementById("chess");
var context = chess.getContext("2d"); //context可以看作畫筆
context.strokeStyle="#bfbfbf";              //畫筆的顏色

//載入棋盤
window.onload = function(){               //頁面載入完成事件
    for(var i=0;i<15;i++){
    
    context.moveTo(15,15+30*i);          //橫線（x，y）起始點
    context.lineTo(435,15+30*i);           //橫線（x，y）終止點
    context.stroke();                              //畫一條線
    
    context.moveTo(15+30*i,15);           //豎線
    context.lineTo(15+30*i,435);
    context.stroke();
    }
    
}
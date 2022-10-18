document.addEventListener("DOMContentLoaded", () => {
    //畫布畫筆
    let checkerboard = document.getElementById("checkerboard");
    let context = checkerboard.getContext("2d"); //context可以看作畫筆
    context.strokeStyle="#bfbfbf";              //畫筆的顏色

    // //載入棋盤
    for(var i=0;i<15;i++) {
        context.moveTo(15,15+30*i);          //橫線（x，y）起始點
        context.lineTo(435,15+30*i);           //橫線（x，y）終止點
        context.stroke();                              //畫一條線
    
        context.moveTo(15+30*i,15);           //豎線
        context.lineTo(15+30*i,435);
        context.stroke();
    }

    //載入棋盤
    // for(var i=0;i<15;i++) {
    //     context.moveTo(0,30*i);          //橫線（x，y）起始點
    //     context.lineTo(420,30*i);           //橫線（x，y）終止點
    //     context.stroke();                              //畫一條線

    //     context.moveTo(30*i,0);           //豎線
    //     context.lineTo(30*i,420);
    //     context.stroke();
    // }
    checkerboard.onclick=function(e){
			
        var i =(e.offsetX/30)|0;   //得到點選的x座標
        var j = (e.offsetY/30)|0;  //得到點選的y座標
        
        var x=i;
        var y=j;

        oneStep(x,y,true); 
    }
      //這裡player true為玩家   false為電腦（下面會寫）
    function oneStep(x,y,player){
        var color;
        context.beginPath();                              //開始畫圓
        context.arc(15+30*x,15+30*y,13,0,2*Math.PI)       //（x,y,半徑，起始點，終止點2*PI即360度）
        context.closePath();                              //結束畫圓
        
        if(player){
            color="black";                                //玩家是黑色
        }else{
            color="red";                                  //電腦是紅色
        }
        
        context.fillStyle=color;                         //設定填充色
        context.fill();                                  //填充顏色
    }
});

document.addEventListener("DOMContentLoaded", () => {
    let ws = new WebSocket(`ws://${location.hostname}:8081`);

    let textArea = document.getElementById("text-area");
    let textInput = document.getElementById("text-input");
    let textButton = document.getElementById("text-button");

    textInput?.addEventListener("keyup", () => {
        if(event.key == "Enter") {
            if(textInput.value !== "") {
                const message = textInput.value;
                textInput.value = "";
                ws.send(message);
            }
        }

    })

    textButton?.addEventListener("click", ()=> {
        if(textInput.value !== "") {
            const message = textInput.value;
            textInput.value = "";
            ws.send(message);
        }
    });

    ws.onmessage = async (event) => {
        const message = await event.data;
        textArea.value += message + "\n";
    }

    ws.onopen = () => {
        console.log("ws.onopen");
    }

    ws.onclose = () => {
        console.warn("ws.onclose");
    }
})

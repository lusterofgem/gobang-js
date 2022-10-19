// output message:
// - chat

// input message:
// - chat

document.addEventListener("DOMContentLoaded", () => {
    let ws = new WebSocket(`ws://${location.hostname}:8081`);

    let textArea = document.getElementById("text-area");
    let textInput = document.getElementById("text-input");
    let textButton = document.getElementById("text-button");

    textInput?.addEventListener("keyup", () => {
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
        if(message["type"] != "chat") {
            return;
        }

        textArea.value += message["content"] + "\n";
    }

    ws.onopen = () => {
        console.log("ws.onopen");
    }

    ws.onclose = () => {
        console.warn("ws.onclose");
    }
})

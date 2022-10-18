// add "[chat]" prefix before the send out message

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
                ws.send("[chat]" + message);
            }
        }
    })

    textButton?.addEventListener("click", ()=> {
        if(textInput.value !== "") {
            const message = textInput.value;
            textInput.value = "";
            ws.send("[chat]" + message);
        }
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
        if(messageType != "chat") {
            return;
        }
        textArea.value += messageContent + "\n";
    }

    ws.onopen = () => {
        console.log("ws.onopen");
    }

    ws.onclose = () => {
        console.warn("ws.onclose");
    }
})

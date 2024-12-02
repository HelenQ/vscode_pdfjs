const vscode = acquireVsCodeApi();

window.addEventListener("message", async (e) => {
    console.log("window.message", e)
    const { type, body, requestId } = e.data;
    switch (type) {
        case 'init': {
            console.log("init " + body.uri)
            load(body.uri)
        }

    }
})
vscode.postMessage({ type: "ready" })

function load(url) {
    document.getElementById("fileInput").setAttribute("value", URL.createObjectURL(new FileReader.readAsDataUrl(new File(url))))
}
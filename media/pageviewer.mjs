const vscode = acquireVsCodeApi();

if (!pdfjsLib.getDocument || !pdfjsViewer.PDFPageView) {
    alert("Please build the pdfjs-dist library");
}

const CMAP_URL = pdfjsLib.GlobalWorkerOptions.workerSrc + "../cmaps/";
const CMAP_PACKED = true;

const PAGE_TO_VIEW = 1;
const SCALE = 1.0;

const ENABLE_XFA = true;

const container = document.getElementById("pageContainer");
const eventBus = new pdfjsViewer.EventBus();

window.addEventListener("message", async (e) => {
    console.log("window.message", e)
    const { type, body, requestId } = e.data;
    switch (type) {
        case 'init':  {
            console.log("init "+ body.uri)
            load(body.content)
        }
        
    }
})
vscode.postMessage({type:"ready"})


function load(content) {
    const loadingTask = pdfjsLib.getDocument({
        data: atob(content),
        cMapUrl: CMAP_URL,
        cMapPacked: CMAP_PACKED,
        enableXfa: ENABLE_XFA,
    });
    
    loadingTask.promise.then(
        pdfDocument => {
            console.log('PDF loaded');
            const pdfPage = pdfDocument.getPage(PAGE_TO_VIEW);
            const pdfPageView = new pdfjsViewer.PDFPageView({
                container,
                id: PAGE_TO_VIEW,
                scale: SCALE,
                defaultViewport: pdfPage.getViewport({ scale: SCALE }),
                eventBus,
              });
            pdfPageView.setPdfPage(pdfPage);
            pdfPageView.draw();
        }
    )
}



import * as vscode from 'vscode';
import { Disposable, disposeAll } from "./dispose";


class PdfDocument extends Disposable implements vscode.CustomDocument {
    private readonly _uri: vscode.Uri;
    public constructor(
        uri: vscode.Uri
    ) {
        super();
        this._uri = uri;
    }
    public get uri() {
        return this._uri;
    }
}

class WebviewCollection {
    private readonly _webviews = new Set<{
        readonly resource: string;
        readonly webviewPanel: vscode.WebviewPanel;
    }>();
    public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
        const key = uri.toString();
        for (const entry of this._webviews) {
            if (entry.resource === key) {
                yield entry.webviewPanel;
            }
        }
    }
    public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
        const entry = { resource: uri.toString(), webviewPanel };
        this._webviews.add(entry);

        webviewPanel.onDidDispose(() => {
            this._webviews.delete(entry);
        });
    }
}

export class PdfProvider implements vscode.CustomEditorProvider<PdfDocument> {
    public static readonly viewType = "com.helen.qin.pdfjs";
    private readonly webviews = new WebviewCollection();
    constructor(private readonly _context: vscode.ExtensionContext) { }

    public static register(content: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            PdfProvider.viewType,
            new PdfProvider(content),
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
                supportsMultipleEditorsPerDocument: false,
            });
    }

    private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
        vscode.CustomDocumentEditEvent<PdfDocument>
    >();
    public readonly onDidChangeCustomDocument =
        this._onDidChangeCustomDocument.event;


    private postMessage(
        panel: vscode.WebviewPanel,
        type: string,
        body: any
    ): void {
        panel.webview.postMessage({ type, body });
    }
    private onMessage(document: PdfDocument, message: any) {
        switch (message.type) {
            case "openPdfError":
                vscode.window.showErrorMessage("打开PDF文件错误：" + message.error);
                return;
        }
    }

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: vscode.CustomDocumentOpenContext,
        token: vscode.CancellationToken
    ): Promise<PdfDocument> {
        return new PdfDocument(uri);
    }
    async resolveCustomEditor(
        document: PdfDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this.webviews.add(document.uri, webviewPanel);
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        webviewPanel.webview.onDidReceiveMessage((e) =>
            this.onMessage(document, e)
        );
        webviewPanel.webview.onDidReceiveMessage((e) => {
            if (e.type === "ready") {
                vscode.workspace.fs.readFile(document.uri).then(
                    data => {
                        this.postMessage(webviewPanel, "init", {
                            uri: document.uri.path,
                            content: Buffer.from(data).toString('base64')
                        });
                    })

            }
        });
    }
    private getHtmlForWebview(webview: vscode.Webview): string {
        // Local path to script and css for the webview
        const pdfjsWorkDir = webview.asWebviewUri(
            vscode.Uri.joinPath(this._context.extensionUri, "pdfjs-dist")
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._context.extensionUri, "pageviewer.mjs")
        );
        return `
<!DOCTYPE html>
<html dir="ltr" mozdisallowselectionprint>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <meta name="google" content="notranslate">
  <title>PDF.js page viewer using built components</title>

  <style>
    body {
      background-color: #808080;
      margin: 0;
      padding: 0;
    }
  </style>

  <link rel="stylesheet" href="${pdfjsWorkDir}/web/pdf_viewer.css">
  <script src="${pdfjsWorkDir}/build/pdf.mjs" type="module"></script>
  <script src="${pdfjsWorkDir}/build/pdf.worker.mjs" type="module"></script>
  <script src="${pdfjsWorkDir}/web/pdf_viewer.mjs" type="module"></script>
</head>

<body tabindex="1">
  <div id="pageContainer" class="pdfViewer singlePageView"></div>
  <script src="${scriptUri}" type="module"></script>
</body>
</html>
        `;
    }

    saveCustomDocument(document: PdfDocument, cancellation: vscode.CancellationToken): Thenable<void> {
        throw new Error('Method not implemented.');
    }
    saveCustomDocumentAs(document: PdfDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
        throw new Error('Method not implemented.');
    }
    revertCustomDocument(document: PdfDocument, cancellation: vscode.CancellationToken): Thenable<void> {
        throw new Error('Method not implemented.');
    }
    backupCustomDocument(document: PdfDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
        throw new Error('Method not implemented.');
    }
}
import * as vscode from 'vscode';
import { PdfProvider } from './pdfjs';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(PdfProvider.register(context));
}
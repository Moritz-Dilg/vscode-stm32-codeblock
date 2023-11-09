// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ViewProvider from "./view";
import { decorationTypeBackgroundCode, decorationTypeBottomComment, decorationTypeLeftBar, decorationTypeNameHighlight, decorationTypeTopComment } from "./decorationTypes";

export interface CodeBlock {
	name: string;
	startLine: number;
	startChar: number;
	endLine: number;
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Register the tree view
	const viewProvider = new ViewProvider(context);
	vscode.window.registerTreeDataProvider('codeBlocks', viewProvider);

	// Update codeBlock when editor changes
	const changeEditorDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (!editor) return;

		const document = editor.document;
		update(document, editor, viewProvider);
	});

	// Update codeBlock when text changes
	const changeTextDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const document = event.document;
		update(document, editor, viewProvider);
	});

	const jumpToDisposable = vscode.commands.registerCommand('stm32-codeblock.jumpTo', (codeBlock: CodeBlock) => {
		const range = new vscode.Range(codeBlock.startLine, 0, codeBlock.endLine, 0);
		vscode.window.activeTextEditor?.revealRange(range, vscode.TextEditorRevealType.InCenter);
	});

	context.subscriptions.push(jumpToDisposable);
	context.subscriptions.push(changeEditorDisposable);
	context.subscriptions.push(changeTextDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

/**
 * Update the code blocks in the tree view and the decorations in the editor
 * @param document The current working document
 * @param editor The current working editor
 * @param viewProvider An {@link ViewProvider} instance to display the code blocks in the tree view
 */
function update(document: vscode.TextDocument, editor: vscode.TextEditor, viewProvider: ViewProvider) {
	if (document.languageId !== 'c' && document.languageId !== 'cpp') return;

	const documentContent = document.getText();
	const codeBlocks = getCodeBlocks(documentContent);
	viewProvider.updateCodeBlocks(codeBlocks);


	editor.setDecorations(decorationTypeTopComment, codeBlocks.map(({ startLine: start }) => {
		return new vscode.Range(start - 1, 0, start, 0);
	}));

	editor.setDecorations(decorationTypeBottomComment, codeBlocks.map(({ endLine: end }) => {
		return new vscode.Range(end - 1, 0, end - 1, 1);
	}));

	editor.setDecorations(decorationTypeLeftBar, codeBlocks.map(({ startLine: start, endLine: end }) => {
		return new vscode.Range(start, 0, end - 2, 0);
	}));

	let range: vscode.Range[] = [];
	for (let i = 0; i < codeBlocks.length; i++) {
		if (i == 0) range.push(new vscode.Range(0, 0, codeBlocks[i].startLine - 1, 0));
		else range.push(new vscode.Range(codeBlocks[i - 1].endLine - 1, 0, codeBlocks[i].startLine - 1, 0));
	}
	editor.setDecorations(decorationTypeBackgroundCode, range);

	editor.setDecorations(decorationTypeNameHighlight, codeBlocks.map((codeBlock) => {
		return new vscode.Range(codeBlock.startLine - 1, codeBlock.startChar - 1, codeBlock.startLine - 1, codeBlock.startChar + codeBlock.name.length + 1);
	}));
}

/**
 * Get the code blocks in the document
 * @param documentContent Document content
 * @returns The code blocks in the document
 */
function getCodeBlocks(documentContent: string): CodeBlock[] {
	interface CodeBlocks {
		[name: string]: {
			startLine: number;
			startChar: number;
			endLine: number;
		};
	}
	const codeBlocks: CodeBlocks = {};
	const regexBegin = /\/\*\s*USER CODE BEGIN (\w+)\s*\*\//g;
	const regexEnd = /\/\*\s*USER CODE END (\w+)\s*\*\//g;

	let match;
	let lineNumber = 1;

	const lines = documentContent.split('\n');

	for (const line of lines) {
		while ((match = regexBegin.exec(line)) !== null) {
			codeBlocks[match[1]] = {
				startLine: lineNumber,
				startChar: match.index + 19,	// Add 19 to account for the length of "/* USER CODE BEGIN "
				endLine: -1,
			};
		}

		while ((match = regexEnd.exec(line)) !== null) {
			if (codeBlocks[match[1]]) codeBlocks[match[1]].endLine = lineNumber;
			else throw new Error(`Code block '${match[1]}' has no start tag!`);
		}

		lineNumber++;
	}

	return Object.entries(codeBlocks).map(([name, { startLine, startChar, endLine }]) => ({ name, startLine, startChar, endLine })).sort((a, b) => a.startLine - b.startLine);;
}


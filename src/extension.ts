// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ViewProvider from "./view";

export interface CodeBlock {
	name: string;
	start: number;
	end: number;
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Register the tree view
	const viewProvider = new ViewProvider(context);
	vscode.window.registerTreeDataProvider('codeBlocks', viewProvider);

	const defaultBorderDecorationOptoins = {
		borderStyle: 'solid',
		overviewRulerColor: '#0000',
		light: {
			borderColor: '#23272e'
		},
		dark: {
			borderColor: '#abb2bf'
		}
	};

	const decorationTypeLeftBar = vscode.window.createTextEditorDecorationType({
		borderWidth: '0px 0px 0px 1px', ...defaultBorderDecorationOptoins
	});

	const decorationTypeTopComment = vscode.window.createTextEditorDecorationType({
		borderWidth: '0px 0px 1px 0px', ...defaultBorderDecorationOptoins
	});

	const decorationTypeBottomComment = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px 0px 0px 0px', ...defaultBorderDecorationOptoins
	});

	const decorationTypeBackgroundCode = vscode.window.createTextEditorDecorationType({
		opacity: '.7'
	});

	// Update codeBlock when text changes
	const changeTextDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const document = event.document;
		if (document.languageId !== 'c' && document.languageId !== 'cpp') return;

		const documentContent = document.getText();
		const codeBlocks = getCodeBlocks(documentContent);
		viewProvider.updateCodeBlocks(codeBlocks);


		editor.setDecorations(decorationTypeTopComment, codeBlocks.map(({ start }) => {
			return new vscode.Range(start - 1, 0, start, 0);
		}));

		editor.setDecorations(decorationTypeBottomComment, codeBlocks.map(({ end }) => {
			return new vscode.Range(end - 1, 0, end - 1, 1);
		}));

		editor.setDecorations(decorationTypeLeftBar, codeBlocks.map(({ start, end }) => {
			return new vscode.Range(start, 0, end - 2, 0);
		}));

		let range: vscode.Range[] = [];
		for (let i = 0; i < codeBlocks.length; i++) {
			if (i == 0) range.push(new vscode.Range(0, 0, codeBlocks[i].start - 1, 0));
			else range.push(new vscode.Range(codeBlocks[i - 1].end - 1, 0, codeBlocks[i].start - 1, 0));
		}

		editor.setDecorations(decorationTypeBackgroundCode, range);
	});

	const jumpToDisposable = vscode.commands.registerCommand('stm32-codeblock.jumpTo', (codeBlock: CodeBlock) => {
		const range = new vscode.Range(codeBlock.start, 0, codeBlock.end, 0);
		vscode.window.activeTextEditor?.revealRange(range, vscode.TextEditorRevealType.InCenter);
	});

	context.subscriptions.push(jumpToDisposable);
	context.subscriptions.push(changeTextDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

/**
 * Get the code blocks in the document
 * @param documentContent Document content
 * @returns The code blocks in the document
 */
function getCodeBlocks(documentContent: string): CodeBlock[] {
	interface CodeBlocks {
		[name: string]: {
			start: number;
			end: number;
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
				start: lineNumber,
				end: -1,
			};
		}

		while ((match = regexEnd.exec(line)) !== null) {
			if (codeBlocks[match[1]]) codeBlocks[match[1]].end = lineNumber;
			else throw new Error(`Code block '${match[1]}' has no start tag!`);
		}

		lineNumber++;
	}

	return Object.entries(codeBlocks).map(([name, { start, end }]) => ({ name, start, end })).sort((a, b) => a.start - b.start);;
}


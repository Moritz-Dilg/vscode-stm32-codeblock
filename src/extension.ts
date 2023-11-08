// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ViewProvider from "./view";

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

	const decorationTypeNameHighlight = vscode.window.createTextEditorDecorationType({
		fontWeight: 'bold',
		borderRadius: '5px 5px 0px 0px',
		light: {
			backgroundColor: '#23272e',
			color: '#ccd1db',
		},
		dark: {
			backgroundColor: '#abb2bf',
			color: '#23272e',
		}
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
	});

	const jumpToDisposable = vscode.commands.registerCommand('stm32-codeblock.jumpTo', (codeBlock: CodeBlock) => {
		const range = new vscode.Range(codeBlock.startLine, 0, codeBlock.endLine, 0);
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


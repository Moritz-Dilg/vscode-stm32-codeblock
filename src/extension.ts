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

	// Update codeBlock when text changes
	const changeTextDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const document = event.document;
		if (document.languageId !== 'c' && document.languageId !== 'cpp') return;

		const documentContent = document.getText();
		const codeBlocks = getCodeBlocks(documentContent);
		viewProvider.updateCodeBlocks(codeBlocks);
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


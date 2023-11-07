// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface CodeBlock {
	[key: string]: {
		start: number;
		end: number;
	};
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Update codeBlock when text changes
	const changeTextDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const document = event.document;
		if (document.languageId !== 'c' && document.languageId !== 'cpp') return;

		const documentContent = document.getText();
		const codeBlocks = getCodeBlocks(documentContent);
		console.log(codeBlocks);
	});

	context.subscriptions.push(changeTextDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

/**
 * Get the code blocks in the document
 * @param documentContent Document content
 * @returns The code blocks in the document
 */
function getCodeBlocks(documentContent: string): CodeBlock {
	const codeBlocks: CodeBlock = {};
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

	return codeBlocks;
}


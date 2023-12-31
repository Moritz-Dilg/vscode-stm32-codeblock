import * as vscode from 'vscode';
import { CodeBlock } from "./extension";
import { dictionary } from "./dictionary";

export default class ViewProvider implements vscode.TreeDataProvider<CodeBlock> {
	private codeBlocks: CodeBlock[] = [];
	private onDidChangeTreeDataEmitter: vscode.EventEmitter<CodeBlock | undefined> = new vscode.EventEmitter<CodeBlock | undefined>();

	constructor(private context: vscode.ExtensionContext) { }

	updateCodeBlocks(codeBlocks: CodeBlock[]) {
		this.codeBlocks = codeBlocks;
		this.onDidChangeTreeDataEmitter.fire(undefined);
	}

	onDidChangeTreeData?: vscode.Event<CodeBlock | void | CodeBlock[] | null | undefined> | undefined = this.onDidChangeTreeDataEmitter.event;

	getTreeItem(element: CodeBlock): vscode.TreeItem | Thenable<vscode.TreeItem> {
		let label = element.name;
		if (dictionary[element.name]) {
			label += ` - ${dictionary[element.name]}`;
		}
		const treeItem = new vscode.TreeItem(label);
		treeItem.description = `(${element.startLine}, ${element.endLine})`;
		treeItem.command = {
			command: 'stm32-codeblock.jumpTo',
			title: 'Jump to code block',
			arguments: [element],
		};
		treeItem.tooltip = `Jump to ${element.name} code block`;
		return treeItem;
	}

	getChildren(element?: CodeBlock | undefined): vscode.ProviderResult<CodeBlock[]> {
		return this.codeBlocks;
	}
	getParent?(element: CodeBlock): vscode.ProviderResult<CodeBlock> {
		throw new Error("Method not implemented.");
	}
	resolveTreeItem?(item: vscode.TreeItem, element: CodeBlock, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
		throw new Error("Method not implemented.");
	}

}
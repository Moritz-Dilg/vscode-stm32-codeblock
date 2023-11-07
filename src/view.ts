import * as vscode from 'vscode';
import { CodeBlock } from "./extension";

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
		const treeItem = new vscode.TreeItem(element.name);
		treeItem.description = `(${element.start}, ${element.end})`;
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
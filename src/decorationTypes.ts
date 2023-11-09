import * as vscode from 'vscode';

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

export const decorationTypeLeftBar = vscode.window.createTextEditorDecorationType({
	borderWidth: '0px 0px 0px 1px', ...defaultBorderDecorationOptoins
});

export const decorationTypeTopComment = vscode.window.createTextEditorDecorationType({
	borderWidth: '0px 0px 1px 0px', ...defaultBorderDecorationOptoins
});

export const decorationTypeBottomComment = vscode.window.createTextEditorDecorationType({
	borderWidth: '1px 0px 0px 0px', ...defaultBorderDecorationOptoins
});

export const decorationTypeBackgroundCode = vscode.window.createTextEditorDecorationType({
	opacity: '.7'
});

export const decorationTypeNameHighlight = vscode.window.createTextEditorDecorationType({
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
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {

	const projectFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;

	const file1 = path.join(projectFolder, 'file1.txt');
	const file2 = path.join(projectFolder, 'file2.txt');
	const nestedFile1 = path.join(projectFolder, 'nested/file1.txt');
	const nestedFile2 = path.join(projectFolder, 'nested/file2.txt');
	const refs = path.join(projectFolder, 'nested/refs.txt');

	if (fs.existsSync(nestedFile1))
		fs.unlinkSync(nestedFile1);
	if (fs.existsSync(nestedFile2))
		fs.unlinkSync(nestedFile2);
	if (!fs.existsSync(file1))
		fs.writeFileSync(file1, '');
	if (!fs.existsSync(file2))
		fs.writeFileSync(file2, '');
	if (!fs.existsSync(refs))
		fs.writeFileSync(refs, "import 'file1.txt';\nimport 'file2.txt';\n");

	vscode.workspace.onWillRenameFiles((e) => e.waitUntil(generateChanges(e)));
	vscode.window.showInformationMessage('Please drag file1 + file2 into the nested folder');

	await vscode.workspace.openTextDocument(path.join(projectFolder, 'file1.txt')).then((e) => vscode.window.showTextDocument(e, { viewColumn: vscode.ViewColumn.One, preview: false }));
	await vscode.workspace.openTextDocument(path.join(projectFolder, 'nested/refs.txt')).then((e) => vscode.window.showTextDocument(e, { viewColumn: vscode.ViewColumn.Two, preview: false }));
	await vscode.workspace.openTextDocument(path.join(projectFolder, 'file2.txt')).then((e) => vscode.window.showTextDocument(e, { viewColumn: vscode.ViewColumn.One, preview: false }));


}

async function generateChanges(e: vscode.FileWillRenameEvent): Promise<vscode.WorkspaceEdit> {
	const projectFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
	const changes = new vscode.WorkspaceEdit();
	const refsDoc = await vscode.workspace.openTextDocument(path.join(projectFolder, 'nested/refs.txt'));

	for (const file of e.files) {
		const oldPath = file.oldUri.fsPath.substring(projectFolder.length + 1);
		const newPath = file.newUri.fsPath.substring(projectFolder.length + 1);

		const fileRefPos = refsDoc.getText().indexOf(oldPath);

		if (fileRefPos !== -1) {
			const range = new vscode.Range(
				refsDoc.positionAt(fileRefPos),
				refsDoc.positionAt(fileRefPos + oldPath.length),
			);
			changes.replace(refsDoc.uri, range, newPath);
		}
	}

	return changes;
}

export function deactivate() { }

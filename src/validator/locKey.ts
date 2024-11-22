import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

export async function validateDocument(
  document: vscode.TextDocument,
  diagnosticsCollection: vscode.DiagnosticCollection
) {
  const diagnostics: vscode.Diagnostic[] = [];

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceFolder) {
    return;
  }

  const config = vscode.workspace.getConfiguration(
    "timberborn-modding-ext.translator"
  );
  const fileNameSuffix = config.get<string>("fileNameSuffix");
  const fileType = config.get<string>("fileType");
  const srcLangCode = config.get<string>("srcLangCode");
  const localizationsDirectory = config.get<string>("localizationsDirectory");

  if (!fileNameSuffix || !fileType || !srcLangCode || !localizationsDirectory) {
    return;
  }

  const srcLangFilePath = path.join(
    workspaceFolder,
    localizationsDirectory,
    `${srcLangCode}_${fileNameSuffix}.${fileType}`
  );

  let localizationRows: Array<{ ID: string; Text: string; Comment: string }> =
    [];
  if (fs.existsSync(srcLangFilePath)) {
    try {
      const fileContent = fs.readFileSync(srcLangFilePath, "utf-8");
      localizationRows = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });
    } catch (error) {
      console.error(
        `Error parsing localization file: ${(error as Error).message}`
      );
    }
  }

  const text = document.getText();
  const regex = /"([^"]+LocKey)"\s*:\s*"([^"]+)"/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const key = match[1];
    const value = match[2];
    const start = document.positionAt(match.index);
    const end = document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(start, end);

    const row = localizationRows.find((row) => row.ID === value);

    if (!row || !row.Text) {
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          `Missing or invalid key in localization file: "${value}"`,
          vscode.DiagnosticSeverity.Warning
        )
      );
    }
  }

  diagnosticsCollection.set(document.uri, diagnostics);
}

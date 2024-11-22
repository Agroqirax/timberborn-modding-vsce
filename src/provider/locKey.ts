import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

export class LocKeyHoverProvider implements vscode.HoverProvider {
  private diagnosticsCollection: vscode.DiagnosticCollection;
  private localizationRows: Array<{
    ID: string;
    Text: string;
    Comment: string;
  }> = [];

  constructor(diagnosticsCollection: vscode.DiagnosticCollection) {
    this.diagnosticsCollection = diagnosticsCollection;
    this.loadLocalizationFile();
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    const range = document.getWordRangeAtPosition(position, /"([^"]+)"/);
    if (!range) {
      return null;
    }

    const hoveredValue = document.getText(range).replace(/"/g, "");
    const diagnostics = this.diagnosticsCollection.get(document.uri) || [];
    const diagnostic = diagnostics.find((diag) => diag.range.contains(range));

    if (diagnostic) {
      // Skip hover if a diagnostic exists for this range
      return null;
    }

    const row = this.localizationRows.find((row) => row.ID === hoveredValue);
    if (!row) {
      return null;
    }

    // Prepare hover content with Text and Comment
    const comment = row.Comment || "No comment available.";
    const hoverContent = new vscode.MarkdownString(
      `**Text:** ${row.Text}\n**Comment:** ${comment}`
    );
    hoverContent.isTrusted = true;

    return new vscode.Hover(hoverContent, range);
  }

  private loadLocalizationFile() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
      console.warn("No workspace folder found. Cannot load localization file.");
      return;
    }

    const config = vscode.workspace.getConfiguration(
      "timberborn-modding-ext.translator"
    );
    const fileNameSuffix = config.get<string>("fileNameSuffix");
    const fileType = config.get<string>("fileType");
    const srcLangCode = config.get<string>("srcLangCode");
    const localizationsDirectory = config.get<string>("localizationsDirectory");

    if (
      !fileNameSuffix ||
      !fileType ||
      !srcLangCode ||
      !localizationsDirectory
    ) {
      console.warn("Translator settings are missing or incomplete.");
      return;
    }

    const srcLangFilePath = path.join(
      workspaceFolder,
      localizationsDirectory,
      `${srcLangCode}_${fileNameSuffix}.${fileType}`
    );

    if (!fs.existsSync(srcLangFilePath)) {
      console.warn(`Localization file not found: ${srcLangFilePath}`);
      return;
    }

    try {
      const fileContent = fs.readFileSync(srcLangFilePath, "utf-8");
      this.localizationRows = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });
    } catch (error) {
      console.error(
        `Error reading or parsing localization file: ${
          (error as Error).message
        }`
      );
    }
  }
}

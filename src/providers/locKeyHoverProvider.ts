import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import csvParser from "csv-parser";

interface LocFile {
  language: string;
  path: string;
}

interface LocEntry {
  ID: string;
  Text: string;
  Comment: string;
}

export class LocKeyHoverProvider implements vscode.HoverProvider {
  private locData: Record<string, Record<string, LocEntry>> = {};
  private folder: vscode.WorkspaceFolder;

  constructor(folder: vscode.WorkspaceFolder) {
    this.folder = folder;
  }

  private async loadLocalizationData(): Promise<void> {
    const config = vscode.workspace.getConfiguration(
      "timberborn-modding-ext",
      this.folder
    );
    const locFiles: LocFile[] | undefined = config.get("locFiles");

    if (!locFiles || locFiles.length === 0) {
      return;
    }

    this.locData = {}; // Reset locData to ensure updates are reflected

    for (const locFile of locFiles) {
      const locPath = path.resolve(this.folder.uri.fsPath, locFile.path);
      if (!fs.existsSync(locPath)) {
        vscode.window.showWarningMessage(`Unable to find file: ${locPath}`);
        continue;
      }

      this.locData[locFile.language] = await this.parseCsv(locPath);
    }
  }

  private async parseCsv(filePath: string): Promise<Record<string, LocEntry>> {
    const result: Record<string, LocEntry> = {};

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser({ headers: ["ID", "Text", "Comment"] }))
        .on("data", (row: LocEntry) => {
          result[row.ID] = row;
        })
        .on("end", () => resolve(result))
        .on("error", reject);
    });
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | undefined> {
    await this.loadLocalizationData(); // Reload localization data on every hover

    const wordRange = document.getWordRangeAtPosition(position, /"[^"]+"/);
    if (!wordRange) return;

    const locKey = document.getText(wordRange).replace(/"/g, "");

    for (const [language, entries] of Object.entries(this.locData)) {
      const entry = entries[locKey];
      if (entry && entry.Text.trim()) {
        const hoverText = new vscode.MarkdownString();
        hoverText.appendMarkdown(`**${entry.Text}**\n\n`);
        hoverText.appendMarkdown(`\`${language}\``);
        if (entry.Comment) hoverText.appendMarkdown(`, ${entry.Comment}\n`);

        return new vscode.Hover(hoverText, wordRange);
      }
    }

    return; // No valid entry found
  }
}

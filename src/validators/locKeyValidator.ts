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

export async function validateLocKeys(
  document: vscode.TextDocument,
  diagnostics: vscode.DiagnosticCollection
) {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!folder) return;

  const config = vscode.workspace.getConfiguration(
    "timberborn-modding-ext",
    folder
  );
  const locFiles: LocFile[] | undefined = config.get("locFiles");

  if (!locFiles || locFiles.length === 0) {
    return;
  }

  const locData: Record<string, Record<string, string>> = {}; // { language: { ID: Text } }

  for (const locFile of locFiles) {
    const locPath = path.resolve(folder.uri.fsPath, locFile.path);
    if (!fs.existsSync(locPath)) {
      vscode.window.showWarningMessage(`Unable to find file: ${locPath}`);
      continue;
    }

    locData[locFile.language] = await parseCsv(locPath);
  }

  const json = parseJson(document.getText());
  if (!json) return;

  const diagnosticsArray: vscode.Diagnostic[] = [];

  Object.entries(json).forEach(([key, value]) => {
    if (!key.endsWith("LocKey") || typeof value !== "string") return;

    const locKey = value;
    const missingLanguages: string[] = [];
    let foundInAny = false;

    for (const [language, entries] of Object.entries(locData)) {
      const text = entries[locKey];
      if (!text) {
        missingLanguages.push(language);
      } else {
        foundInAny = true;
      }
    }

    if (missingLanguages.length > 0) {
      const diagnostic = createDiagnostic(
        document,
        locKey,
        missingLanguages,
        foundInAny
      );
      diagnosticsArray.push(diagnostic);
    }
  });

  diagnostics.set(document.uri, diagnosticsArray);
}

async function parseCsv(filePath: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser({ headers: ["ID", "Text", "Comment"] }))
      .on("data", (row: LocEntry) => {
        result[row.ID] = row.Text;
      })
      .on("end", () => resolve(result))
      .on("error", reject);
  });
}

function parseJson(text: string): Record<string, any> | null {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function createDiagnostic(
  document: vscode.TextDocument,
  locKey: string,
  missingLanguages: string[],
  foundInAny: boolean
): vscode.Diagnostic {
  const text = document.getText();
  const startIndex = text.indexOf(`"${locKey}"`);
  const range = new vscode.Range(
    document.positionAt(startIndex),
    document.positionAt(startIndex + locKey.length + 2) // Include quotes
  );

  const message = foundInAny
    ? `Missing or empty localization key "${locKey}" in languages: ${missingLanguages.join(
        ", "
      )}`
    : `Missing or empty localization key "${locKey}" in all languages`;

  const severity = foundInAny
    ? vscode.DiagnosticSeverity.Warning
    : vscode.DiagnosticSeverity.Error;

  return new vscode.Diagnostic(range, message, severity);
}

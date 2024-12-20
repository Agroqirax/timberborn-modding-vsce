import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import csvParser from "csv-parser";
import * as csvWriter from "csv-writer";

interface LocalizationFile {
  language: string;
  path: string;
}

export async function translateLocalizations() {
  // region get folders
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage(
      "No workspace folders open, open a workspace to proceed"
    );
    return;
  }

  let selectedFolder = workspaceFolders[0];

  // region select folder
  if (workspaceFolders.length > 1) {
    const folderNames = workspaceFolders.map((folder) => folder.name);
    const selectedFolderName = await vscode.window.showQuickPick(folderNames, {
      placeHolder: "Select a folder to translate localizations",
    });

    if (!selectedFolderName) {
      vscode.window.showErrorMessage(
        "No folder selected, translation cancelled"
      );
      return;
    }

    selectedFolder =
      workspaceFolders.find((folder) => folder.name === selectedFolderName) ??
      selectedFolder;
  }

  try {
    // region get config
    const config = vscode.workspace.getConfiguration(
      "timberborn-modding-ext",
      selectedFolder.uri
    );
    const locFiles: LocalizationFile[] | undefined = config.get("locFiles");

    // region validate conf
    if (
      !Array.isArray(locFiles) ||
      locFiles.length < 2 ||
      !locFiles.every(
        (file) =>
          typeof file.language === "string" &&
          file.language.length > 0 &&
          typeof file.path === "string" &&
          file.path.length > 0
      )
    ) {
      vscode.window.showErrorMessage(
        `Invalid configuration in folder: ${selectedFolder.name}, must contain at least two items with a path and language`
      );
      return;
    }

    const sourceFile = locFiles[0];
    const destFiles = locFiles.slice(1);

    // region validate files
    const sourceFilePath = path.join(
      selectedFolder.uri.fsPath,
      sourceFile.path
    );
    if (!fs.existsSync(sourceFilePath)) {
      vscode.window.showErrorMessage(
        `Source file not found: ${sourceFilePath}`
      );
      return;
    }
    const sourceData = await loadCSVFile(sourceFilePath);
    if (!validateCSVData(sourceData)) {
      vscode.window.showErrorMessage(
        `Invalid source file format: ${sourceFilePath}, it must contain "ID", "Text", and "Comment" columns`
      );
      return;
    }

    const totalRows = sourceData.length * destFiles.length;
    let translatedCount = 0;

    const isCancelled = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Translating localization files",
        cancellable: true,
      },
      async (progress, cancellationToken) => {
        for (const destFile of destFiles) {
          if (cancellationToken.isCancellationRequested) {
            return true;
          }

          const destFilePath = path.join(
            selectedFolder.uri.fsPath,
            destFile.path
          );

          // Check if the destination file exists, if not, create it
          let destData: Record<string, string>[] = [];
          if (fs.existsSync(destFilePath)) {
            destData = await loadCSVFile(destFilePath);
            if (!validateCSVData(destData) && destData.length > 0) {
              vscode.window.showErrorMessage(
                `Invalid destination file format: ${destFilePath}, skipping translation`
              );
              continue;
            }
          } else {
            fs.mkdirSync(path.dirname(destFilePath), { recursive: true });
          }

          // region translate
          const updatedData = await translateFile(
            sourceData,
            destData,
            sourceFile.language,
            destFile.language,
            cancellationToken,
            (completed) => {
              translatedCount += completed;
              const percentage = Math.round(
                (translatedCount / totalRows) * 100
              );
              progress.report({
                message: `${translatedCount}/${totalRows} rows(${percentage}%)`,
                increment: (completed / totalRows) * 100,
              });
            }
          );

          if (cancellationToken.isCancellationRequested) {
            return true;
          }

          // region save changes
          const writer = csvWriter.createObjectCsvWriter({
            path: destFilePath,
            header: [
              { id: "ID", title: "ID" },
              { id: "Text", title: "Text" },
              { id: "Comment", title: "Comment" },
            ],
          });

          await writer.writeRecords(updatedData);
        }
        return false;
      }
    );

    if (isCancelled) {
      vscode.window.showWarningMessage(
        "Translation process was cancelled by the user"
      );
    } else {
      vscode.window.showInformationMessage(
        "Finished translating, always check automatic translations!"
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error processing translations in folder ${selectedFolder.name}: ${error}`
    );
  }
}

// region locfile loader
async function loadCSVFile(
  filePath: string
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const data: Record<string, string>[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", (err) => reject(err));
  });
}

// loc data validator
function validateCSVData(data: Record<string, string>[]): boolean {
  return data.every((row) => "ID" in row && "Text" in row && "Comment" in row);
}

// region translator
async function translateFile(
  sourceData: Record<string, string>[],
  destData: Record<string, string>[],
  sourceLang: string,
  destLang: string,
  cancellationToken: vscode.CancellationToken,
  reportProgress: (completed: number) => void
): Promise<Record<string, string>[]> {
  const destMap = new Map(destData.map((row) => [row.ID, row.Text]));
  const translatedData: Record<string, string>[] = [];
  let completedRows = 0;

  for (const row of sourceData) {
    if (cancellationToken.isCancellationRequested) {
      break;
    }

    const { ID, Text, Comment } = row;
    const existingTranslation = destMap.get(ID);

    if (existingTranslation) {
      translatedData.push({ ID, Text: existingTranslation, Comment });
    } else {
      const translatedText = await fetchTranslation(sourceLang, destLang, Text);
      translatedData.push({ ID, Text: translatedText, Comment });
    }
    completedRows++;
    reportProgress(1);
  }

  const extraRows = destData.filter(
    (row) => !sourceData.some((srcRow) => srcRow.ID === row.ID)
  );
  return [...translatedData, ...extraRows];
}

// region translation fetcher
async function fetchTranslation(
  sourceLang: string,
  destLang: string,
  text: string
): Promise<string> {
  try {
    const response = await axios.get(
      "https://ftapi.pythonanywhere.com/translate",
      {
        params: { sl: sourceLang, dl: destLang, text },
      }
    );

    return response.data["destination-text"] || text;
  } catch (error) {
    console.error(`Translation error for text "${text}": ${error}`);
    vscode.window.showErrorMessage(
      `Error translating text: "${text}", using original text`
    );
    return text;
  }
}

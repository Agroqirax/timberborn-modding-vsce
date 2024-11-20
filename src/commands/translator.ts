import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as csvParser from "csv-parse/sync";
import * as csvStringify from "csv-stringify/sync";
import axios from "axios";

/**
 * Command to translate localization files based on user settings.
 */
export async function translateCommand() {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("No workspace is open.");
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  // Retrieve settings from configuration
  const config = vscode.workspace.getConfiguration(
    "timberborn-modding-ext.translator"
  );
  const destLangCodes = config.get<string[]>("destLangCodes", []);
  const fileNameSuffix = config.get<string>("fileNameSuffix", "");
  const fileType = config.get<string>("fileType", "csv");
  const srcLangCode = config.get<string>("srcLangCode", "");
  const localizationsDirectory = config.get<string>(
    "localizationsDirectory",
    ""
  );

  // Construct the source file path
  const srcFilePath = path.join(
    workspaceRoot,
    localizationsDirectory,
    `${srcLangCode}_${fileNameSuffix}.${fileType}`
  );

  if (!fs.existsSync(srcFilePath)) {
    vscode.window.showWarningMessage(`Source file not found: ${srcFilePath}`);
    return;
  }

  try {
    // Read the source file's content
    const srcFileContent = fs.readFileSync(srcFilePath, "utf-8");

    // Parse the CSV content
    const srcRecords = csvParser.parse(srcFileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    let cancelled;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Translating localization files",
        cancellable: true,
      },
      async (progress, token) => {
        let totalTranslations = srcRecords.length * destLangCodes.length;
        let completedTranslations = 0;

        // Process for each destination language code
        for (const destLangCode of destLangCodes) {
          const destFilePath = path.join(
            workspaceRoot,
            localizationsDirectory,
            `${destLangCode}_${fileNameSuffix}.${fileType}`
          );

          let destRecords: Record<string, string>[] = [];
          if (fs.existsSync(destFilePath)) {
            // Read and parse the destination file if it exists
            const destFileContent = fs.readFileSync(destFilePath, "utf-8");
            destRecords = csvParser.parse(destFileContent, {
              columns: true,
              skip_empty_lines: true,
            });
          }

          const destMap = new Map<string, Record<string, string>>();
          destRecords.forEach((record) => {
            destMap.set(record.ID, record);
          });

          const updatedRecords = [];
          for (const row of srcRecords) {
            if (token.isCancellationRequested) {
              vscode.window.showWarningMessage(
                "Translation process cancelled."
              );
              cancelled = true;
              return; // Exit early if cancelled
            }

            if (destMap.has(row.ID)) {
              // Use existing text from destination file
              updatedRecords.push(destMap.get(row.ID)!);
            } else {
              // Translate and add new row
              const translatedText = await translate(
                row.Text,
                srcLangCode.slice(0, 2),
                destLangCode.slice(0, 2)
              );

              updatedRecords.push({
                ID: row.ID,
                Text: translatedText,
                Comment: row.Comment,
              });
            }

            // Update progress
            completedTranslations++;
            progress.report({
              increment: (1 / totalTranslations) * 100,
              message: `${completedTranslations}/${totalTranslations} (${Math.round(
                (completedTranslations / totalTranslations) * 100
              )}%)`,
            });
          }

          // Convert the updated records back to CSV
          const outputCsv = csvStringify.stringify(updatedRecords, {
            header: true,
            columns: ["ID", "Text", "Comment"],
          });

          // Save the updated content to the destination file
          fs.writeFileSync(destFilePath, outputCsv, "utf-8");
        }
      }
    );

    // Notify user about translation quality
    if (!cancelled) {
      vscode.window.showInformationMessage(
        "Done translating. Always check translation accuracy!"
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(`An error occurred: ${error}`);
  }
}

/**
 * Translates text from one language to another using an API.
 * @param text The text to translate.
 * @param srcLangCode The source language code (2-character).
 * @param destLangCode The destination language code (2-character).
 * @returns The translated text.
 */
async function translate(
  text: string,
  srcLangCode: string,
  destLangCode: string
): Promise<string> {
  try {
    const response = await axios.get(
      "https://ftapi.pythonanywhere.com/translate",
      {
        params: {
          sl: srcLangCode,
          dl: destLangCode,
          text,
        },
      }
    );

    if (response.data && response.data["destination-text"]) {
      return response.data["destination-text"];
    } else {
      throw new Error("Invalid response from translation API");
    }
  } catch (error) {
    console.error(
      `Translation failed for "${text}" (${srcLangCode} -> ${destLangCode}):`,
      error
    );
    return text; // Return the original text in case of an error
  }
}

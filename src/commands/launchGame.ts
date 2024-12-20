import * as vscode from "vscode";
import { exec } from "child_process";

/**
 * Command to launch the game
 */
export async function launchGame() {
  // Retrieve settings
  const config = vscode.workspace.getConfiguration("timberborn-modding-ext");
  const execPath: string = config.get(
    "execPath",
    "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Timberborn\\Timberborn.exe"
  );
  const launchArgs: {
    settlementName?: string;
    saveName?: string;
    safe?: boolean;
  } = config.get("launchArgs", {});

  // Validate execPath
  if (!execPath || typeof execPath !== "string") {
    vscode.window.showErrorMessage("Invalid executable path");
    return;
  }

  // Build arguments
  const args: string[] = [];
  if (typeof launchArgs !== "object" || launchArgs === null) {
    vscode.window.showWarningMessage("Invalid launch arguments");
    return;
  }

  if (
    launchArgs.settlementName &&
    launchArgs.saveName &&
    typeof launchArgs.settlementName === "string" &&
    typeof launchArgs.saveName === "string"
  ) {
    args.push(
      `-settlementName "${launchArgs.settlementName}"`,
      `-saveName "${launchArgs.saveName}"`
    );
  }
  if (launchArgs.safe && typeof launchArgs.safe === "boolean") {
    args.push("-safe");
  }

  // Construct the command to execute
  const command = `"${execPath}" ${args.join(" ")}`.trim();

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      vscode.window.showErrorMessage(
        `Failed to launch timberborn: ${error.message}`
      );
      return;
    }

    if (stderr) {
      vscode.window.showWarningMessage(
        `Timberborn launched with warnings: ${stderr}`
      );
    }

    vscode.window.showInformationMessage("Timberborn launched successfully");
  });
}

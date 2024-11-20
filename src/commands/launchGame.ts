import * as vscode from "vscode";
import * as child_process from "child_process";

export async function launchGameCommand() {
  const config = vscode.workspace.getConfiguration(
    "timberborn-modding-ext.launchConfig"
  );
  const gameLaunchMethod = config.get<string>("launcher", "Steam");
  const execPath = config.get<string>(
    "ExecPath",
    "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Timberborn\\Timberborn.exe"
  );
  const args = config.get<{ [key: string]: any }>("args", {});

  // Construct the argument string based on settings
  const argList: string[] = [];

  // Check for settlementName and saveName, include both or none
  if (args.settlementName && args.saveName) {
    argList.push(`-settlementName "${args.settlementName}"`);
    argList.push(`-saveName "${args.saveName}"`);
  }

  // Check for safe mode
  if (args.safe) {
    argList.push("-safe");
  }

  // Join arguments into a single string
  const formattedArgs = argList.join(" ");

  // Use execPath for both Steam and Executable methods
  if (gameLaunchMethod === "Steam" || gameLaunchMethod === "Executable") {
    const command = `"${execPath}" ${formattedArgs}`;
    child_process.exec(command, (error) => {
      if (error) {
        vscode.window.showErrorMessage("Failed to launch game executable.");
      } else {
        vscode.window.showInformationMessage(
          "Game launched with configured arguments."
        );
      }
    });
  } else {
    vscode.window.showErrorMessage("Invalid launcher configuration.");
  }
}

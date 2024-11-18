// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as child_process from "child_process";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // Register the launch game command
  const launchGameCommand = vscode.commands.registerCommand(
    "timberborn-modding-ext.launchGame",
    () => {
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
  );
  context.subscriptions.push(launchGameCommand);

  const viewDocsCommand = vscode.commands.registerCommand(
    "timberborn-modding-ext.viewDocs",
    async () => {
      const predefinedDocs = [
        {
          label: "YouTube Tutorials",
          url: "https://www.youtube.com/playlist?list=PLCSAr-ZkwfVQZlUN_m3gCRqljfAKUCPpo",
        },
        {
          label: "Github timberborn-modding",
          url: "https://github.com/mechanistry/timberborn-modding",
        },
        {
          label: "Github modding central",
          url: "https://github.com/Timberborn-Modding-Central",
        },
        {
          label: "Unity documentation",
          url: "https://docs.unity3d.com/ScriptReference/index.html",
        },
        {
          label: "Official Wiki",
          url: "https://timberborn.wiki.gg/wiki/Timberborn_Wiki",
        },
        {
          label: "Reddit",
          url: "https://reddit.com/r/timberborn",
        },
        {
          label: "Discord server",
          url: "https://discord.gg/timberborn",
        },
        {
          label: "Mod.io",
          url: "https://mod.io/g/timberborn",
        },
      ];

      // Get user-defined docs from configuration
      const userDocs: { Url: string; Label: string }[] =
        vscode.workspace
          .getConfiguration("timberborn-modding-ext")
          .get("docsLinks") || [];

      // Map user-defined docs to the same structure
      const userDocsMapped = userDocs.map((doc) => ({
        label: doc.Label,
        url: doc.Url,
      }));

      // Combine predefined and user-defined links
      const docsOptions = [...predefinedDocs, ...userDocsMapped];

      const selected = await vscode.window.showQuickPick(
        docsOptions.map((doc) => doc.label),
        {
          placeHolder: "Select documentation source to view",
        }
      );

      if (selected) {
        const doc = docsOptions.find((doc) => doc.label === selected);
        if (doc) {
          vscode.env.openExternal(vscode.Uri.parse(doc.url));
        }
      }
    }
  );
  context.subscriptions.push(viewDocsCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}

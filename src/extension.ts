// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { launchGameCommand } from "./commands/launchGame";
import { hideMetaCommand } from "./commands/hideMeta";
import { viewDocsCommand } from "./commands/viewDocs";
import { translateCommand } from "./commands/translator";
import { projectSetupCommand } from "./commands/projectSetup";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // Register the launch game command
  const launchGame = vscode.commands.registerCommand(
    "timberborn-modding-ext.launchGame",
    launchGameCommand
  );
  context.subscriptions.push(launchGame);

  const viewDocs = vscode.commands.registerCommand(
    "timberborn-modding-ext.viewDocs",
    viewDocsCommand
  );
  context.subscriptions.push(viewDocs);

  const hideMeta = vscode.commands.registerCommand(
    "timberborn-modding-ext.hide-meta",
    hideMetaCommand
  );
  context.subscriptions.push(hideMeta);

  const translateLocalizations = vscode.commands.registerCommand(
    "timberborn-modding-ext.translateLocalizations",
    translateCommand
  );
  context.subscriptions.push(translateLocalizations);

  const projectSetup = vscode.commands.registerCommand(
    "timberborn-modding-ext.projectSetup",
    projectSetupCommand
  );
  context.subscriptions.push(translateLocalizations);
}

// This method is called when your extension is deactivated
export function deactivate() {}

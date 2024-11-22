// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { launchGameCommand } from "./commands/launchGame";
import { hideMetaCommand } from "./commands/hideMeta";
import { viewDocsCommand } from "./commands/viewDocs";
import { translateCommand } from "./commands/translator";
import { projectSetupCommand } from "./commands/projectSetup";

import { LocKeyHoverProvider } from "./provider/locKey";
import { validateDocument } from "./validator/locKey";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  // Launch game command
  const launchGame = vscode.commands.registerCommand(
    "timberborn-modding-ext.launchGame",
    launchGameCommand
  );
  context.subscriptions.push(launchGame);

  // View documentation command
  const viewDocs = vscode.commands.registerCommand(
    "timberborn-modding-ext.viewDocs",
    viewDocsCommand
  );
  context.subscriptions.push(viewDocs);

  // Hide meta command
  const hideMeta = vscode.commands.registerCommand(
    "timberborn-modding-ext.hideMeta",
    hideMetaCommand
  );
  context.subscriptions.push(hideMeta);

  // Translate command
  const translateLocalizations = vscode.commands.registerCommand(
    "timberborn-modding-ext.translateLocalizations",
    translateCommand
  );
  context.subscriptions.push(translateLocalizations);

  // Project setup command
  const projectSetup = vscode.commands.registerCommand(
    "timberborn-modding-ext.projectSetup",
    projectSetupCommand
  );
  context.subscriptions.push(translateLocalizations);

  // Register the hover provider for JSON files
  const diagnosticsCollection =
    vscode.languages.createDiagnosticCollection("timberbornLocKeys");
  context.subscriptions.push(diagnosticsCollection);

  const validateAndUpdate = (document: vscode.TextDocument) => {
    if (document.languageId === "json") {
      validateDocument(document, diagnosticsCollection);
    }
  };
  vscode.workspace.textDocuments.forEach(validateAndUpdate);
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) =>
      validateAndUpdate(e.document)
    )
  );
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) =>
      validateAndUpdate(document)
    )
  );
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor?.document.languageId === "json") {
        validateAndUpdate(editor.document);
      }
    })
  );
  const hoverProvider = new LocKeyHoverProvider(diagnosticsCollection);
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: "file", language: "json" },
      hoverProvider
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

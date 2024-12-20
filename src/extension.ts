// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { launchGame } from "./commands/launchGame";
import { openDocumentationLinks } from "./commands/openDocumentationLinks";
import { translateLocalizations } from "./commands/localizationsTranslator";
import { projectSetup } from "./commands/projectSetup";

import { validateLocKeys } from "./validators/locKeyValidator";
import { LocKeyHoverProvider } from "./providers/locKeyHoverProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  // Launch game command
  const launchGameCommand = vscode.commands.registerCommand(
    "timberborn-modding-ext.launchGame",
    launchGame
  );
  context.subscriptions.push(launchGameCommand);

  // View documentation command
  const viewDocsCommand = vscode.commands.registerCommand(
    "timberborn-modding-ext.openDocsLinks",
    openDocumentationLinks
  );
  context.subscriptions.push(viewDocsCommand);

  // Translate command
  const translateLocalizationsCommand = vscode.commands.registerCommand(
    "timberborn-modding-ext.translateLocalizations",
    async () => {
      await translateLocalizations();
    }
  );
  context.subscriptions.push(translateLocalizationsCommand);

  // Project setup command
  const projectSetupCommand = vscode.commands.registerCommand(
    "timberborn-modding-ext.projectSetup",
    projectSetup
  );
  context.subscriptions.push(projectSetupCommand);

  // Loc key validator
  const diagnostics = vscode.languages.createDiagnosticCollection("locKeys");
  context.subscriptions.push(diagnostics);

  vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.languageId === "json") {
      validateLocKeys(document, diagnostics);
    }
  });
  vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === "json") {
      validateLocKeys(document, diagnostics);
    }
  });
  vscode.workspace.onDidChangeTextDocument((event) => {
    const document = event.document;
    if (document.languageId === "json") {
      validateLocKeys(document, diagnostics);
    }
  });

  // Loc key hover provider
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) return;

  const hoverProvider = new LocKeyHoverProvider(folder);

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: "json", scheme: "file" },
      hoverProvider
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

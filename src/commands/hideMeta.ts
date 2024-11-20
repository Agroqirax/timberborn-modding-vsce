import * as vscode from "vscode";

export async function hideMetaCommand() {
  // Ask the user for their preference
  const targetOption = await vscode.window.showQuickPick(
    ["Global", "Workspace"],
    { placeHolder: "Where do you want to hide .meta files?" }
  );

  if (!targetOption) {
    vscode.window.showInformationMessage("Operation canceled.");
    return;
  }

  const target =
    targetOption === "Global"
      ? vscode.ConfigurationTarget.Global
      : vscode.ConfigurationTarget.Workspace;

  const config = vscode.workspace.getConfiguration("files");
  const currentExcludes = config.inspect<Record<string, boolean>>("exclude");

  // Determine the appropriate configuration to modify
  let excludesToUpdate: Record<string, boolean> = {};
  if (
    target === vscode.ConfigurationTarget.Global &&
    currentExcludes?.globalValue
  ) {
    excludesToUpdate = { ...currentExcludes.globalValue };
  } else if (
    target === vscode.ConfigurationTarget.Workspace &&
    currentExcludes?.workspaceValue
  ) {
    excludesToUpdate = { ...currentExcludes.workspaceValue };
  }

  // Append the .meta exclusion only if it's not already there
  if (excludesToUpdate["**/*.meta"]) {
    vscode.window.showInformationMessage(
      `.meta files are already hidden in ${targetOption} settings.`
    );
    return;
  }

  excludesToUpdate["**/*.meta"] = true;

  // Update the setting
  await config.update("exclude", excludesToUpdate, target).then(
    () =>
      vscode.window.showInformationMessage(
        `.meta files are now hidden in ${targetOption} settings.`
      ),
    (err) => vscode.window.showErrorMessage(`Failed to update settings: ${err}`)
  );
}

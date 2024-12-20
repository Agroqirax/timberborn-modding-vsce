import * as vscode from "vscode";

/**
 * Command to open documentation links
 */
export async function openDocumentationLinks() {
  // Retrieve documentation links from workspace and global settings
  const workspaceLinks =
    vscode.workspace
      .getConfiguration("timberborn-modding-ext")
      .get<{ label: string; description: string; url: string }[]>(
        "docsLinks"
      ) || [];

  const globalLinks =
    vscode.workspace
      .getConfiguration("timberborn-modding-ext", null)
      .inspect<{ label: string; description: string; url: string }[]>(
        "docsLinks"
      )?.globalValue || [];

  // Merge the two arrays, removing duplicates (by URL)
  const mergedLinks = [...workspaceLinks, ...globalLinks].reduce(
    (unique, item) => {
      if (!unique.some((link) => link.url === item.url)) {
        unique.push(item);
      }
      return unique;
    },
    [] as { label: string; description: string; url: string }[]
  );

  if (mergedLinks.length === 0) {
    vscode.window.showErrorMessage("No links configured");
    return;
  }

  if (
    !mergedLinks.every(
      (link) =>
        typeof link.label === "string" &&
        typeof link.description === "string" &&
        typeof link.url === "string"
    )
  ) {
    vscode.window.showErrorMessage("Invalid types");
    return;
  }

  // Map links to QuickPick items
  const quickPickItems = mergedLinks.map((doc) => ({
    label: doc.label,
    description: doc.description,
    url: doc.url,
  }));

  // Show QuickPick to the user
  const selected = await vscode.window.showQuickPick(quickPickItems, {
    placeHolder: "Select a documentation link to open",
    canPickMany: false,
  });

  if (selected) {
    vscode.env.openExternal(vscode.Uri.parse(selected.url));
  }
}

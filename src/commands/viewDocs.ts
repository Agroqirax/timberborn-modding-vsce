import * as vscode from "vscode";

export async function viewDocsCommand() {
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

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export async function projectSetupCommand() {
  // Get the workspace folder
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage(
      "No workspace folder is open. Please open a folder to set up the project."
    );
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;

  // Define project structures
  const projectStructures = {
    Basic: {
      ".vscode": {
        "extensions.json": `{
  "recommendations": ["agroqirax.timberborn-modding-ext"]
}
`,
        "settings.json": `{
  "files.exclude": {
    "**/*.meta": true
  },
  "timberborn-modding-ext.translator": {
    "srcLangCode": "enUS",
    "destLangCodes": ["deDE", "frFR", "zhCN", "plPL"],
    "fileNameSuffix": "MyMod",
    "fileType": "csv",
    "localizationsDirectory": "/Localizations"
  }
}
`,
      },
      Localizations: {
        "enUS_MyMod.csv": `ID,Text,Comment
,,`,
      },
      Materials: {
        Beavers: {
          Folktails: {},
        },
      },
      Specifications: {
        Factions: {},
        GoodGroups: {},
        Goods: {},
        KeyBindingGroups: {},
        KeyBindings: {},
        MaterialGroups: {},
        NeedGroups: {},
        Needs: {},
        PrefabGroups: {},
        Recipes: {},
        TailDecals: {},
        ToolGroups: {},
        WellbeingTiers: {},
      },
      "LICENSE.md": `MIT License

Copyright (c) 2024 [full name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
      "manifest.json": `{
  "Name": "Mod name",
  "Version": "0.2.2",
  "Id": "User.Mod",
  "MinimumGameVersion": "0.0.0.0",
  "Description": "Mod description",
  "RequiredMods": [
    {
      "Id": "Another.Mod"
    }
  ],
  "OptionalMods": []
}
`,
      "README.md": `# Project title
`,
    },
    Unity: {
      ".github": {
        ISSUE_TEMPLATE: {},
      },
      ".vscode": {
        "extensions.json": `{
  "recommendations": ["agroqirax.timberborn-modding-ext"]
}
`,
        "settings.json": `{
  "files.exclude": {
    "**/*.meta": true
  },
  "timberborn-modding-ext.translator": {
    "srcLangCode": "enUS",
    "destLangCodes": ["deDE", "frFR", "zhCN", "plPL"],
    "fileNameSuffix": "MyMod",
    "fileType": "csv",
    "localizationsDirectory": "/Data/Localizations"
  }
}
`,
      },
      AssetBundles: {
        Resources: {
          Buildings: {},
        },
      },
      Data: {
        Localizations: {
          "enUS_MyMod.csv": `ID,Text,Comment
,,`,
        },
        Materials: {
          Beavers: {
            Folktails: {},
          },
        },
        Specifications: {
          Factions: {},
          GoodGroups: {},
          Goods: {},
          KeyBindingGroups: {},
          KeyBindings: {},
          MaterialGroups: {},
          NeedGroups: {},
          Needs: {},
          PrefabGroups: {},
          Recipes: {},
          TailDecals: {},
          ToolGroups: {},
          WellbeingTiers: {},
        },
        "LICENSE.md": `MIT License

Copyright (c) 2024 [full name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
        Sprites: {
          Good: {},
        },
      },
      Scripts: {
        "HelloWorldConfigurator.cs": `using Bindito.Core;

namespace Mods.HelloWorld.Scripts {
  [Context("Game")]
  public class HelloWorldConfigurator : IConfigurator {

    public void Configure(IContainerDefinition containerDefinition) {
      containerDefinition.Bind<HelloWorldInitializer>().AsSingleton();
    }

  }
}
`,
        "HelloWorldInitializer.cs": `using Timberborn.CoreUI;
using Timberborn.SingletonSystem;
using Timberborn.UILayoutSystem;

namespace Mods.HelloWorld.Scripts {
  public class HelloWorldInitializer : ILoadableSingleton {

    private readonly UILayout _uiLayout;
    private readonly VisualElementLoader _visualElementLoader;

    public HelloWorldInitializer(UILayout uiLayout, 
                                 VisualElementLoader visualElementLoader) {
      _uiLayout = uiLayout;
      _visualElementLoader = visualElementLoader;
    }

    public void Load() {
      var visualElement = _visualElementLoader.LoadVisualElement("HelloWorld");
      _uiLayout.AddBottomRight(visualElement, 0);
    }

  }
}
`,
        "HelloWorldLogger.cs": `using Timberborn.ModManagerScene;
using UnityEngine;

namespace Mods.HelloWorld.Scripts {
  internal class HelloWorldLogger : IModStarter {

    public void StartMod(IModEnvironment modEnvironment) {
      var playerLogPath = Application.persistentDataPath + "/Player.log";
      Debug.Log("Hello World, but in the Player.log file at: " + playerLogPath);
    }

  }
}
`,
        "Timberborn.ModExamples.HelloWorld.asmdef": `{
  "name": "Timberborn.ModExamples.HelloWorld",
  "autoReferenced": false
}
`,
      },
      ".gitignore": `.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
!.vscode/*.code-snippets

# Local History for Visual Studio Code
.history/

# Built Visual Studio Code Extensions
*.vsix

**/*.meta
`,
      "CHANGELOG.md": `# Changelog

## [v0.0.1] - yyyy-mm-dd

### Added

- Initial release
`,
      "LICENSE.md": `MIT License

Copyright (c) 2024 [full name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
      "manifest.json": `{
  "Name": "Mod name",
  "Version": "0.2.2",
  "Id": "User.Mod",
  "MinimumGameVersion": "0.0.0.0",
  "Description": "Mod description",
  "RequiredMods": [
    {
      "Id": "Another.Mod"
    }
  ],
  "OptionalMods": []
}
`,
      "README.md": `# Project title
`,
    },
  };

  // Ask the user for the project type
  const projectType = await vscode.window.showQuickPick(["Basic", "Unity"], {
    placeHolder: "Select the type of project to set up",
  });

  // Ensure projectType is of the correct type
  if (!projectType || !(projectType in projectStructures)) {
    vscode.window.showWarningMessage(
      "Project setup was cancelled or an invalid choice was made."
    );
    return;
  }

  const structure =
    projectStructures[projectType as keyof typeof projectStructures];

  async function createStructure(
    basePath: string,
    structure: any,
    options: { overwriteAll: boolean; skipAll: boolean } = {
      overwriteAll: false,
      skipAll: false,
    }
  ) {
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = path.join(basePath, name);

      if (typeof content === "string") {
        // Check if the file exists
        if (fs.existsSync(fullPath)) {
          if (options.skipAll) {
            continue; // Skip all files globally
          }

          if (!options.overwriteAll) {
            // Show notification with options
            const userChoice = await vscode.window.showInformationMessage(
              `File '${name}' already exists. What would you like to do?`,
              { modal: true },
              "Overwrite",
              "Skip",
              "Overwrite All",
              "Skip All"
            );

            if (userChoice === "Skip") {
              continue; // Skip this file
            } else if (userChoice === "Overwrite All") {
              options.overwriteAll = true; // Set global overwrite flag
            } else if (userChoice === "Skip All") {
              options.skipAll = true; // Set global skip flag
              continue;
            }
          }
        }

        // Write the file
        fs.writeFileSync(fullPath, content);
      } else if (typeof content === "object") {
        // Create the folder
        fs.mkdirSync(fullPath, { recursive: true });
        // Recurse into the folder with the same options
        await createStructure(fullPath, content, options);
      }
    }
  }

  try {
    await createStructure(rootPath, structure);
    vscode.window.showInformationMessage(
      `${projectType} project setup completed!`
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to set up the ${projectType} project: ${error}`
    );
  }
}

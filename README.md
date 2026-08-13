# SPM Theme Manifest IntelliSense

This extension provides JSON schema validation and auto-completion for `manifest.json` theme files used by the Site Package Manager.

## Local Installation

1. Open the workspace in VS Code.
2. Open the command palette and run `Developer: Open Extensions Folder`.
3. Open `vscode-theme-manifest-intellisense` as a new window or use `Run Extension` in a debug configuration if you have the VS Code Extension Development Host set up.

## File Support

Applies to:

* `**/websites/*/*/manifest.json`

## Schema

The schema validates fields such as `theme`, `components`, `reconstructs`, `propsMap`, `children`, and `preserve`.

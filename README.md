# spm-vscode

The official VS Code developer tools extension for the Site Package Manager (SPM) layout development ecosystem.

---

## What is spm-vscode?
`spm-vscode` is an editor extension designed to streamline the developer experience when creating layout and theme configurations for the Site Package Manager (SPM). It provides syntax highlighting, auto-completion, and real-time compile linter diagnostics for the Veneer Spec (`.vnr`) domain-specific language.

---

## Key Features

1.  **Veneer Syntax Highlighting**: Real-time syntax coloring for keywords (`theme`, `reconstruct`, `child`, `bind`, etc.), CSS variables, comments, and C++ style raw string blocks `R"delim(...)delim"`.
2.  **Contextual Autocomplete**:
    *   Reconstruct arrow autocomplete (`->`) suggestions for registered React components.
    *   Typing properties in reconstruct containers recommends available properties matching the React component's TypeScript props contract.
    *   Child properties recommendation (e.g. inside `child items` block, it suggests item attributes like `imageUrl` and `linkUrl`).
3.  **Real-Time Compile Diagnostics (Linter)**:
    Saves document modifications in a background cache and executes `spm compile` silently. Compilation errors or Resolver failures are mapped back and highlighted as red squiggly error underlines on the exact line of the file.

---

## Workspace Integration

To update the JSON schema registry representing React components props:
```bash
# Analyze TS interfaces and rebuild manifest schema
npm run build-registry
```
The schema is exported to `schemas/theme-manifest-schema.json` and automatically consumed by VS Code for validation.

---

## Local Installation

To load and test the extension locally:

1.  Clone this repository to your system:
    ```bash
    git clone https://github.com/watashi-00/spm-vscode.git
    ```
2.  Create a link to the extensions folder of your editor (e.g. VS Code or Code - OSS):
    ```bash
    ln -s /path/to/vscode-theme-manifest-intellisense ~/.vscode-oss/extensions/vscode-theme-manifest-intellisense
    ```
3.  Restart your editor or reload the window to activate.

---

## License

This project is licensed under the MIT License - see the [LICENSE](file:///home/watashi/Projects/vscode-theme-manifest-intellisense/LICENSE) file for details.

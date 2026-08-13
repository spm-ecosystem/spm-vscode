import vscode from 'vscode';
import cp from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let schemaData = null;
const schemaPath = path.join(__dirname, '../schemas/theme-manifest-schema.json');

function loadSchema() {
    try {
        if (fs.existsSync(schemaPath)) {
            const raw = fs.readFileSync(schemaPath, 'utf8');
            schemaData = JSON.parse(raw);
        }
    } catch (err) {
        console.error('[SPM Extension] Error loading schema:', err);
    }
}

// Diagnostics provider running spm compile in background
const diagnosticCollection = vscode.languages.createDiagnosticCollection('veneer');

function updateDiagnostics(document) {
    if (document.languageId !== 'veneer') return;

    // Command path to spm
    const spmPath = '/home/watashi/Projects/spm-cli/spm';
    if (!fs.existsSync(spmPath)) {
        return;
    }

    // Run compile against a temporary file to avoid altering manifest
    const tempFile = path.join(path.dirname(document.uri.fsPath), '.vnr_diagnostics_temp.vnr');
    const tempOut = path.join(path.dirname(document.uri.fsPath), '.vnr_diagnostics_temp.json');
    
    try {
        fs.writeFileSync(tempFile, document.getText(), 'utf8');
    } catch (err) {
        return;
    }

    cp.exec(`"${spmPath}" compile "${tempFile}" -o "${tempOut}"`, (err, stdout, stderr) => {
        // Clean up temp files
        try {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
        } catch (e) {}

        const diagnostics = [];
        const lines = (stdout + '\n' + stderr).split('\n');

        for (const line of lines) {
            if (line.includes('[Parser Error]')) {
                const match = line.match(/Line (\d+): (.+)$/);
                if (match) {
                    const lineNum = parseInt(match[1], 10) - 1;
                    const message = match[2];
                    const range = new vscode.Range(
                        lineNum, 0,
                        lineNum, document.lineAt(lineNum).text.length
                    );
                    diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error));
                }
            } else if (line.includes('[Resolver Error]')) {
                const message = line.replace(/.*\[Resolver Error\]\s*/, '');
                // Highlight first line since resolver errors are semantic
                const range = new vscode.Range(0, 0, 0, document.lineAt(0).text.length);
                diagnostics.push(new vscode.Diagnostic(range, `[Resolver Error] ${message}`, vscode.DiagnosticSeverity.Error));
            }
        }

        diagnosticCollection.set(document.uri, diagnostics);
    });
}

export function activate(context) {
    loadSchema();

    // Watch schema updates
    if (fs.existsSync(schemaPath)) {
        fs.watchFile(schemaPath, () => {
            loadSchema();
        });
    }

    // Diagnostics listeners
    context.subscriptions.push(diagnosticCollection);
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((doc) => updateDiagnostics(doc))
    );
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((doc) => updateDiagnostics(doc))
    );
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            // Debounce diagnostics to avoid spamming compiler
            if (context.diagTimeout) clearTimeout(context.diagTimeout);
            context.diagTimeout = setTimeout(() => {
                updateDiagnostics(event.document);
            }, 800);
        })
    );

    // Run diagnostics for active editor immediately on load
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document);
    }

    // Autocomplete Provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'veneer',
        {
            provideCompletionItems(document, position) {
                if (!schemaData || !schemaData.definitions) return [];

                const textBefore = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
                const lineText = document.lineAt(position.line).text;
                const wordRange = document.getWordRangeAtPosition(position);
                const word = wordRange ? document.getText(wordRange) : '';

                // 1. Suggest layout components after arrow `->`
                const arrowMatch = lineText.substring(0, position.character).match(/->\s*[a-zA-Z0-9_]*$/);
                if (arrowMatch) {
                    return Object.keys(schemaData.definitions)
                        .filter(defName => defName.endsWith('Props'))
                        .map(defName => {
                            const compName = defName.replace('Props', '');
                            const item = new vscode.CompletionItem(compName, vscode.CompletionItemKind.Class);
                            item.documentation = new vscode.MarkdownString(`SPM modernizer layout component: **${compName}**`);
                            return item;
                        });
                }

                // 2. Trace nesting level and current context
                const lines = textBefore.split('\n');
                let braceLevel = 0;
                let activeComponent = null;
                let activeChild = null;

                for (const line of lines) {
                    const openBraces = (line.match(/\{/g) || []).length;
                    const closeBraces = (line.match(/\}/g) || []).length;
                    
                    const reconMatch = line.match(/(?:reconstruct|selector)\s+"[^"]+"\s*->\s*([a-zA-Z0-9_]+)/);
                    if (reconMatch) {
                        activeComponent = reconMatch[1];
                        activeChild = null;
                    }

                    const childMatch = line.match(/child\s+([a-zA-Z0-9_]+)/);
                    if (childMatch) {
                        activeChild = childMatch[1];
                    }

                    braceLevel += openBraces - closeBraces;
                    if (braceLevel === 0) {
                        activeComponent = null;
                        activeChild = null;
                    } else if (braceLevel === 1) {
                        activeChild = null;
                    }
                }

                // Suggestions helper
                const makePropSuggestions = (properties) => {
                    const suggestions = [];
                    const isBinding = lineText.trim().startsWith('bind');

                    for (const [propName, propDetails] of Object.entries(properties)) {
                        let desc = propDetails.description || '';
                        if (propDetails.type) {
                            desc = `Type: \`${propDetails.type}\`\n\n` + desc;
                        }

                        if (isBinding) {
                            // Only suggest property names since "bind" is already typed
                            const bindItem = new vscode.CompletionItem(propName, vscode.CompletionItemKind.Variable);
                            bindItem.insertText = `${propName}: `;
                            bindItem.documentation = new vscode.MarkdownString(`Dynamic binding for ${propName}:\n\n${desc}`);
                            bindItem.detail = `Dynamic Binding: ${propName}`;
                            suggestions.push(bindItem);
                        } else {
                            // Suggest both options
                            const staticItem = new vscode.CompletionItem(propName, vscode.CompletionItemKind.Property);
                            staticItem.insertText = `${propName}: `;
                            staticItem.documentation = new vscode.MarkdownString(desc);
                            staticItem.detail = `Static Prop: ${propName}`;
                            suggestions.push(staticItem);

                            const bindItem = new vscode.CompletionItem(`bind ${propName}`, vscode.CompletionItemKind.Variable);
                            bindItem.insertText = `bind ${propName}: `;
                            bindItem.documentation = new vscode.MarkdownString(`Dynamic CSS / Selector Binding:\n\n${desc}`);
                            bindItem.detail = `Dynamic Binding: ${propName}`;
                            suggestions.push(bindItem);
                        }
                    }
                    return suggestions;
                };

                // 3. inside reconstruct top level
                if (braceLevel === 1 && activeComponent) {
                    const propsTypeName = `${activeComponent}Props`;
                    const propDefinition = schemaData.definitions[propsTypeName];
                    if (propDefinition && propDefinition.properties) {
                        return makePropSuggestions(propDefinition.properties);
                    }
                }

                // 4. inside child block
                if (braceLevel === 2 && activeComponent && activeChild) {
                    const propsTypeName = `${activeComponent}Props`;
                    const propDefinition = schemaData.definitions[propsTypeName];
                    if (propDefinition && propDefinition.properties) {
                        const childField = propDefinition.properties[activeChild];
                        if (childField) {
                            let refType = '';
                            if (childField.$ref) {
                                refType = childField.$ref;
                            } else if (childField.type === 'array' && childField.items && childField.items.$ref) {
                                refType = childField.items.$ref;
                            }

                            if (refType) {
                                const typeName = refType.split('/').pop();
                                const childDefinition = schemaData.definitions[typeName];
                                if (childDefinition && childDefinition.properties) {
                                    return makePropSuggestions(childDefinition.properties);
                                }
                            }
                        }
                    }
                }

                // 5. Keyword completion
                const keywords = [
                    'theme', 'variables', 'customStyles',
                    'class', 'extends', 'selector', 'action',
                    'reconstruct', 'preserve', 'child', 'bind', 'scope'
                ];
                if (lineText.trim() === word) {
                    return keywords.map(kw => new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword));
                }

                return [];
            }
        },
        '-', '>', ' ', '\t' // trigger characters
    );

    context.subscriptions.push(completionProvider);
}

export function deactivate() {}

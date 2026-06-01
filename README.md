# brood-vscode

A VS Code extension for editing [Brood](https://github.com/broodlang) — a small,
dynamically-typed Lisp implemented in Rust. Brood source files use the `.blsp`
extension.

The extension is a thin client: it contributes the `.blsp` language and a
TextMate grammar for baseline syntax highlighting, then launches the **`brood-lsp`
language server** (the `crates/lsp` binary in the brood repo) over stdio. All the
language intelligence comes from the server — the same one the Emacs package
(`brood-mode`) drives through Eglot:

- diagnostics (syntax, plus the advisory type/arity/unbound-symbol checker)
- completion (locals, special forms, globals) with resolve
- hover docs and signature help
- go-to-definition, find-references, document/workspace symbols
- rename, document highlight
- **semantic tokens** (namespace-aware colouring on top of the TextMate grammar)
- formatting (delegated to Brood's `std/format.blsp` — byte-identical to `nest format`)
- code actions (did-you-mean, remove-unused-`require`), folding ranges, inlay hints

## Requirements

The `brood-lsp` binary. From the [brood](https://github.com/broodlang) repo:

```sh
make install                 # installs brood / nest / brood-lsp into ~/.local/bin
# …or build it and point the setting at it:
cargo build --release        # produces target/release/brood-lsp
```

Make sure `brood-lsp` is on your `PATH`, or set **`brood.lsp.path`** (below) to the
binary. Without the server you still get syntax highlighting from the bundled
grammar.

## Install (development)

```sh
cd ~/src/broodlang/brood-vscode
npm install
npm run compile
```

Then either press **F5** in VS Code (Extension Development Host) with this folder
open, or package + install it:

```sh
npx @vscode/vsce package        # produces brood-0.1.0.vsix
code --install-extension brood-0.1.0.vsix
```

## Settings

| Setting | Default | Meaning |
|---------|---------|---------|
| `brood.lsp.enable` | `true` | Run the `brood-lsp` server. Set `false` for highlighting only. |
| `brood.lsp.path` | `"brood-lsp"` | Path to the binary (e.g. `~/src/broodlang/brood/target/release/brood-lsp`). |
| `brood.lsp.args` | `[]` | Extra arguments passed to the server. |

Command **Brood: Restart Language Server** (`brood.restartServer`) restarts the
server after a rebuild.

## Layout

- `package.json` — the extension manifest (language + grammar + settings contributions).
- `src/extension.ts` — the LSP client that launches `brood-lsp`.
- `language-configuration.json` — comments (`;`), bracket pairs, auto-close.
- `syntaxes/brood.tmLanguage.json` — the TextMate grammar (baseline highlighting;
  the server's semantic tokens refine it).

The grammar is intentionally small — keywords, `def…` heads, special forms,
`:keywords`, constants, numbers, strings, comments — because the server provides
the precise, namespace-aware colouring. (This is *not* a tree-sitter grammar:
VS Code highlights with TextMate grammars. A separate `tree-sitter-brood` would
serve Neovim/Helix/Zed/Emacs and GitHub.)

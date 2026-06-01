// Brood VS Code extension — a thin client around the `brood-lsp` language server
// (crates/lsp in the brood repo). The extension itself does no language analysis:
// it contributes the `.blsp` language + a TextMate grammar for baseline syntax
// highlighting, and launches `brood-lsp` over stdio, which supplies completion,
// hover, diagnostics, go-to-definition, find-references, rename, signature help,
// semantic tokens, formatting, code actions, folding, and inlay hints. (The Emacs
// counterpart, brood-mode, wires the same server through Eglot.)

import { workspace, ExtensionContext, window, commands } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export async function activate(context: ExtensionContext): Promise<void> {
  await startServer();
  context.subscriptions.push(
    commands.registerCommand("brood.restartServer", async () => {
      await stopServer();
      await startServer();
    }),
  );
}

async function startServer(): Promise<void> {
  const config = workspace.getConfiguration("brood");
  if (!config.get<boolean>("lsp.enable", true)) {
    return;
  }

  // The binary + args are user-configurable: `brood-lsp` on PATH by default, or a
  // path to a local build during development (`brood.lsp.path`).
  const command = config.get<string>("lsp.path", "brood-lsp");
  const args = config.get<string[]>("lsp.args", []);

  const serverOptions: ServerOptions = {
    run: { command, args, transport: TransportKind.stdio },
    debug: { command, args, transport: TransportKind.stdio },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "brood" }],
    synchronize: {
      // The server resolves cross-file definitions from the running image; tell it
      // when any .blsp changes so a rename/move stays in sync.
      fileEvents: workspace.createFileSystemWatcher("**/*.blsp"),
    },
  };

  client = new LanguageClient(
    "brood",
    "Brood Language Server",
    serverOptions,
    clientOptions,
  );

  try {
    await client.start();
  } catch (err) {
    // No server is a soft failure — syntax highlighting (the TextMate grammar)
    // still works without it. Warn once with how to fix it.
    window.showWarningMessage(
      `Brood: could not start the language server ('${command}'). ` +
        `Build it (in the brood repo: \`make install\`, or \`cargo build --release\` and ` +
        `point "brood.lsp.path" at target/release/brood-lsp) and ensure it is on PATH. ` +
        `Syntax highlighting still works without it. (${err})`,
    );
    client = undefined;
  }
}

async function stopServer(): Promise<void> {
  if (client) {
    await client.stop();
    client = undefined;
  }
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}

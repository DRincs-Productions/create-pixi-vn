import { cpSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import installPlugins from "../dist/steps/installPlugins.mjs";

const template = process.argv[2];
if (!/^(visual-novel|interactive-fiction)(-ink)?(-tauri)?$/.test(template ?? "")) {
    throw new Error("Pass a visual-novel or interactive-fiction template name.");
}
const rootFolder = mkdtempSync(path.join(os.tmpdir(), "quest-template-types-"));
try {
    cpSync(fileURLToPath(new URL(`../templates/react/${template}/`, import.meta.url)), rootFolder, {
        recursive: true,
        filter: (source) => ![".git", "node_modules", "dist"].includes(path.basename(source)),
    });
    installPlugins({ rootFolder, plugins: [2] });
    await execa("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], {
        cwd: rootFolder,
        stdio: "inherit",
    });
    await execa("npm", ["exec", "--", "tsc", "-b"], {
        cwd: rootFolder,
        stdio: "inherit",
    });
} finally {
    rmSync(rootFolder, { recursive: true, force: true });
}

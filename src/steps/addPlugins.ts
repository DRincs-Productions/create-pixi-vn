import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import PluginEnum from "../enum/PluginEnum";
import installPlugins, { PLUGINS } from "./installPlugins";

/** Ids accepted by `create-pixi-vn add <plugin>`. Every new plugin needs one. */
export const PLUGIN_IDS: Record<string, PluginEnum> = {
    "quest-system": PluginEnum.QuestSystem,
    spine2d: PluginEnum.Spine2D,
    live2d: PluginEnum.Live2D,
};

const IGNORED = new Set(["node_modules", ".git", "dist", "target", ".back"]);

function listFiles(root: string): string[] {
    if (!fs.existsSync(root)) return [];
    return (fs.readdirSync(root, { recursive: true }) as string[])
        .map(String)
        .filter((f) => !f.split(path.sep).some((p) => IGNORED.has(p) || p.endsWith(".back")))
        .filter((f) => fs.statSync(path.join(root, f)).isFile());
}

/** Checks that every requested plugin was applied to the project. */
function verify(rootFolder: string, plugins: PluginEnum[]) {
    const pkgPath = path.join(rootFolder, "package.json");
    if (!fs.existsSync(pkgPath)) throw new Error("package.json not found");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const main = ["src/main.tsx", "src/main.ts"]
        .map((f) => path.join(rootFolder, f))
        .find((f) => fs.existsSync(f));
    if (!main) throw new Error("src/main.ts(x) not found");
    const mainContent = fs.readFileSync(main, "utf-8");
    const vitePath = path.join(rootFolder, "vite.config.ts");
    const vite = fs.existsSync(vitePath) ? fs.readFileSync(vitePath, "utf-8") : undefined;
    for (const plugin of plugins) {
        const cfg = PLUGINS[plugin];
        const hasDep = pkg.dependencies?.[cfg.dependency] || pkg.devDependencies?.[cfg.dependency];
        if (!hasDep) throw new Error(`could not add ${cfg.dependency} to package.json`);
        for (const line of cfg.mainImports) {
            if (!mainContent.includes(line)) throw new Error(`could not update ${path.basename(main)}`);
        }
        if (vite !== undefined && !vite.includes(cfg.manualChunk)) {
            throw new Error("could not update vite.config.ts (pixi.js chunk rule not found)");
        }
    }
}

/**
 * Adds plugins to an existing project.
 * 1. Dry run on a temporary copy: if it fails, the project is not touched.
 * 2. Real run: touched files are saved as `.back`, removed at the end (restored on failure).
 */
export function addPlugins({ rootFolder, plugins }: { rootFolder: string; plugins: PluginEnum[] }) {
    if (!fs.existsSync(path.join(rootFolder, "package.json"))) {
        throw new Error(`${rootFolder} is not a Pixi’VN project (package.json not found)`);
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "create-pixi-vn-dry-"));
    try {
        fs.cpSync(rootFolder, tmp, {
            recursive: true,
            filter: (src) => !IGNORED.has(path.basename(src)),
        });
        installPlugins({ rootFolder: tmp, plugins });
        verify(tmp, plugins);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }

    const before = listFiles(rootFolder);
    const backups: string[] = [];
    for (const file of before) {
        const from = path.join(rootFolder, file);
        fs.copyFileSync(from, `${from}.back`);
        backups.push(file);
    }
    try {
        installPlugins({ rootFolder, plugins });
        verify(rootFolder, plugins);
    } catch (error) {
        for (const file of listFiles(rootFolder)) {
            if (!before.includes(file)) fs.rmSync(path.join(rootFolder, file), { force: true });
        }
        for (const file of backups) {
            fs.copyFileSync(path.join(rootFolder, `${file}.back`), path.join(rootFolder, file));
        }
        throw error;
    } finally {
        for (const file of backups) fs.rmSync(path.join(rootFolder, `${file}.back`), { force: true });
    }
}

export default addPlugins;

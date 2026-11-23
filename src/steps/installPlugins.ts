import fs from "node:fs";
import path from "node:path";
import PluginEnum from "../enum/PluginEnum";
import installQuestSystem from "./installQuestSystem";

type PluginConfig = {
    dependency: string;
    mainImports: string[];
    hashtagImport: string;
    hashtagCall: string;
    /** Vite `manualChunks` rule, inserted before the `pixi.js` chunk rule. */
    manualChunk: string;
};

export const PLUGINS: Record<PluginEnum, PluginConfig> = {
    [PluginEnum.QuestSystem]: {
        dependency: "@drincs/nqtr",
        mainImports: [],
        hashtagImport: "",
        hashtagCall: "",
        manualChunk: `if (id.includes("@drincs/nqtr")) return "nqtr";`,
    },
    [PluginEnum.Spine2D]: {
        dependency: "@drincs/pixi-vn-spine",
        mainImports: [`import "@drincs/pixi-vn-spine";`],
        hashtagImport: `import { createSpineHandler } from "@drincs/pixi-vn-spine/ink";`,
        hashtagCall: "createSpineHandler();",
        manualChunk: `if (id.includes("@drincs/pixi-vn-spine")) return "spine";`,
    },
    [PluginEnum.Live2D]: {
        dependency: "@drincs/pixi-vn-live2d",
        mainImports: [
            `import { extensions } from "pixi.js";`,
            `import { Live2DPlugin } from "@drincs/pixi-vn-live2d/core";`,
            "extensions.add(Live2DPlugin);",
        ],
        hashtagImport: `import { createLive2DHandler } from "@drincs/pixi-vn-live2d/ink";`,
        hashtagCall: "createLive2DHandler();",
        manualChunk: `if (id.includes("@drincs/pixi-vn-live2d")) return "live2d";`,
    },
};

const IMPORT_END = /^(import\s.*["'][^"']+["'];?|\}\s*from\s+["'][^"']+["'];?)\s*$/;

/** Inserts `lines` after the last import statement (or at the top if none). */
function insertAfterImports(content: string, imports: string[], statements: string[] = []) {
    const lines = content.split("\n");
    let last = -1;
    lines.forEach((line, i) => {
        if (IMPORT_END.test(line)) last = i;
    });
    const newImports = imports.filter((l) => !content.includes(l));
    const newStatements = statements.filter((l) => !content.includes(l));
    const toInsert = [...newImports, ...(newStatements.length ? ["", ...newStatements] : [])];
    if (toInsert.length === 0) return content;
    lines.splice(last + 1, 0, ...toInsert);
    return lines.join("\n");
}

export function installPlugins({
    rootFolder,
    plugins,
}: {
    rootFolder: string;
    plugins: PluginEnum[];
}) {
    if (plugins.length === 0) return;

    // package.json: add dependencies (no install)
    const pkgPath = path.join(rootFolder, "package.json");
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const deps: Record<string, string> = pkg.dependencies ?? {};
        for (const plugin of plugins) {
            const dependency = PLUGINS[plugin].dependency;
            if (!pkg.devDependencies?.[dependency]) deps[dependency] ??= "latest";
        }
        pkg.dependencies = Object.fromEntries(
            Object.entries(deps).sort(([a], [b]) => a.localeCompare(b)),
        );
        fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    }

    if (plugins.includes(PluginEnum.QuestSystem)) installQuestSystem(rootFolder);

    // main file: imports (plus plugin setup statements) after the other imports
    const mainPath = ["src/main.tsx", "src/main.ts"]
        .map((f) => path.join(rootFolder, f))
        .find((f) => fs.existsSync(f));
    if (mainPath) {
        let content = fs.readFileSync(mainPath, "utf-8");
        for (const plugin of plugins) {
            const lines = PLUGINS[plugin].mainImports;
            content = insertAfterImports(
                content,
                lines.filter((l) => l.startsWith("import")),
                lines.filter((l) => !l.startsWith("import")),
            );
        }
        fs.writeFileSync(mainPath, content);
    }

    // vite.config.ts: plugin chunks before the pixi.js chunk
    const vitePath = path.join(rootFolder, "vite.config.ts");
    if (fs.existsSync(vitePath)) {
        let content = fs.readFileSync(vitePath, "utf-8");
        const eol = content.includes("\r\n") ? "\r\n" : "\n";
        for (const plugin of plugins) {
            const { manualChunk } = PLUGINS[plugin];
            if (content.includes(manualChunk)) continue;
            content = content.replace(
                /^([ \t]*)(if \(id\.includes\("pixi\.js"\)\))/m,
                (_, indent: string, rule: string) =>
                    `${indent}${manualChunk}${eol}${indent}${rule}`,
            );
        }
        fs.writeFileSync(vitePath, content);
    }

    // hashtag-commands.ts (ink templates only)
    const hashtagPath = path.join(rootFolder, "src/content/ink/hashtag-commands.ts");
    if (fs.existsSync(hashtagPath)) {
        let content = fs.readFileSync(hashtagPath, "utf-8");
        for (const plugin of plugins) {
            if (plugin === PluginEnum.QuestSystem) continue;
            const { hashtagImport, hashtagCall } = PLUGINS[plugin];
            content = insertAfterImports(content, [hashtagImport]);
            if (!content.includes(hashtagCall)) {
                content = `${content.replace(/\s*$/, "")}\n\n${hashtagCall}\n`;
            }
        }
        fs.writeFileSync(hashtagPath, content);
    }
}

export default installPlugins;

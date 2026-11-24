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

const ASEPRITE_DEPENDENCY = "@drincs/assetpack-plugin-aseprite";
const ASEPRITE_IMPORT = `import { aseprite } from "${ASEPRITE_DEPENDENCY}";`;

/**
 * Optional AssetPack plugin converting `.aseprite`, `.ase` and `.pxo` files into
 * AnimatedSprite-ready assets. Applied only when `@assetpack/core` is already installed.
 */
export function installAseprite(rootFolder: string) {
    const pkgPath = path.join(rootFolder, "package.json");
    const configPath = path.join(rootFolder, ".assetpack.ts");
    if (!fs.existsSync(pkgPath) || !fs.existsSync(configPath)) return;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (!pkg.dependencies?.["@assetpack/core"] && !pkg.devDependencies?.["@assetpack/core"]) return;

    const original = fs.readFileSync(configPath, "utf-8");
    if (!/pipes:\s*\[/.test(original)) return;
    let content = original;
    if (!content.includes("aseprite(")) {
        // multiline `pipes: [` → own line with the same indent as the next item; inline → prefix
        content = content.replace(/^([ \t]*)pipes:\s*\[[ \t]*(\r?\n)([ \t]*)/m, (_, indent, eol, inner) => `${indent}pipes: [${eol}${inner}aseprite(),${eol}${inner}`);
        if (!content.includes("aseprite(")) content = content.replace(/pipes:\s*\[/, "pipes: [aseprite(), ");
    }
    content = insertAfterImports(content, [ASEPRITE_IMPORT]);
    if (content !== original) fs.writeFileSync(configPath, content);

    // Build tool: goes next to @assetpack/core
    const target = pkg.devDependencies?.["@assetpack/core"] ? "devDependencies" : "dependencies";
    if (!pkg.dependencies?.[ASEPRITE_DEPENDENCY] && !pkg.devDependencies?.[ASEPRITE_DEPENDENCY]) {
        pkg[target] = Object.fromEntries(
            Object.entries({ ...pkg[target], [ASEPRITE_DEPENDENCY]: "latest" }).sort(([a], [b]) =>
                a.localeCompare(b),
            ),
        );
        fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    }
}

export function installPlugins({
    rootFolder,
    plugins,
}: {
    rootFolder: string;
    plugins: PluginEnum[];
}) {
    installAseprite(rootFolder);
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

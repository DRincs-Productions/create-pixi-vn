import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import installPlugins from "../dist/steps/installPlugins.mjs";

const tempDirs = [];

function createProject(files) {
    const rootFolder = mkdtempSync(path.join(os.tmpdir(), "create-pixi-vn-plugin-test-"));
    tempDirs.push(rootFolder);
    for (const [relativePath, content] of Object.entries(files)) {
        const filePath = path.join(rootFolder, relativePath);
        mkdirSync(path.dirname(filePath), { recursive: true });
        writeFileSync(filePath, content);
    }
    return rootFolder;
}

function readProjectFile(rootFolder, relativePath) {
    return readFileSync(path.join(rootFolder, relativePath), "utf8");
}

afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("installPlugins", () => {
    it("adds Spine dependencies and setup to a React Ink project", () => {
        const root = createProject({
            "package.json": JSON.stringify({ dependencies: { zod: "^4.0.0" } }),
            "src/main.tsx": 'import "./style.css";\nimport { Game } from "@drincs/pixi-vn";\n',
            "vite.config.ts": 'manualChunks(id) {\n            if (id.includes("pixi.js")) return "pixi";\n        }',
            "src/content/ink/hashtag-commands.ts": 'import { HashtagCommands } from "@drincs/pixi-vn-ink";\n',
        });

        installPlugins({ rootFolder: root, plugins: [1] });

        const pkg = JSON.parse(readProjectFile(root, "package.json"));
        assert.equal(pkg.dependencies["@drincs/pixi-vn-spine"], "latest");
        assert.equal(pkg.dependencies.zod, "^4.0.0");
        assert.match(readProjectFile(root, "src/main.tsx"), /import "@drincs\/pixi-vn-spine";/);
        assert.match(readProjectFile(root, "vite.config.ts"), /if \(id\.includes\("@drincs\/pixi-vn-spine"\)\) return "spine";/);
        const ink = readProjectFile(root, "src/content/ink/hashtag-commands.ts");
        assert.match(ink, /createSpineHandler/);
        assert.match(ink, /createSpineHandler\(\);/);
    });

    it("adds Live2D setup and supports non-Ink TypeScript templates", () => {
        const root = createProject({
            "package.json": "{}",
            "src/main.ts": 'import { Game } from "@drincs/pixi-vn";\n',
            "vite.config.ts": 'manualChunks(id) {\n            if (id.includes("pixi.js")) return "pixi";\n        }',
        });

        installPlugins({ rootFolder: root, plugins: [0] });

        const pkg = JSON.parse(readProjectFile(root, "package.json"));
        assert.equal(pkg.dependencies["@drincs/pixi-vn-live2d"], "latest");
        const main = readProjectFile(root, "src/main.ts");
        assert.match(main, /import \{ extensions \} from "pixi.js";/);
        assert.match(main, /import \{ Live2DPlugin \} from "@drincs\/pixi-vn-live2d\/core";/);
        assert.match(main, /extensions\.add\(Live2DPlugin\);/);
        assert.match(readProjectFile(root, "vite.config.ts"), /return "live2d";/);
    });

    it("installs both plugins and is safe to run again", () => {
        const root = createProject({
            "package.json": "{}",
            "src/main.tsx": 'import { Game } from "@drincs/pixi-vn";\n',
            "vite.config.ts": 'manualChunks(id) {\n            if (id.includes("pixi.js")) return "pixi";\n        }',
            "src/content/ink/hashtag-commands.ts": 'import { HashtagCommands } from "@drincs/pixi-vn-ink";\n',
        });

        installPlugins({ rootFolder: root, plugins: [0, 1] });
        const files = ["package.json", "src/main.tsx", "vite.config.ts", "src/content/ink/hashtag-commands.ts"];
        const firstRun = files.map((file) => readProjectFile(root, file));
        installPlugins({ rootFolder: root, plugins: [0, 1] });

        assert.deepEqual(files.map((file) => readProjectFile(root, file)), firstRun);
        const pkg = JSON.parse(readProjectFile(root, "package.json"));
        assert.equal(pkg.dependencies["@drincs/pixi-vn-live2d"], "latest");
        assert.equal(pkg.dependencies["@drincs/pixi-vn-spine"], "latest");
    });

    it("leaves the project untouched when no plugin is selected", () => {
        const root = createProject({ "package.json": '{"dependencies":{"zod":"^4.0.0"}}' });
        const before = readProjectFile(root, "package.json");

        installPlugins({ rootFolder: root, plugins: [] });

        assert.equal(readProjectFile(root, "package.json"), before);
    });
});

import addPlugins, { PLUGIN_IDS } from "../dist/steps/addPlugins.mjs";
import { existsSync } from "node:fs";

describe("addPlugins (create-pixi-vn add)", () => {
    const files = () => ({
        "package.json": "{}",
        "src/main.ts": 'import { Game } from "@drincs/pixi-vn";\n',
        "vite.config.ts": 'manualChunks(id) {\n            if (id.includes("pixi.js")) return "pixi";\n        }',
    });

    it("exposes a command id for every plugin", () => {
        assert.deepEqual(Object.keys(PLUGIN_IDS).sort(), ["live2d", "quest-system", "spine2d"]);
    });

    it("applies plugins and removes .back files", () => {
        const root = createProject(files());
        addPlugins({ rootFolder: root, plugins: [PLUGIN_IDS.spine2d, PLUGIN_IDS.live2d] });
        const pkg = JSON.parse(readProjectFile(root, "package.json"));
        assert.equal(pkg.dependencies["@drincs/pixi-vn-spine"], "latest");
        assert.equal(pkg.dependencies["@drincs/pixi-vn-live2d"], "latest");
        assert.ok(!existsSync(path.join(root, "package.json.back")));
        assert.ok(!existsSync(path.join(root, "src/main.ts.back")));
    });

    it("leaves the project untouched when the dry run fails", () => {
        const f = files();
        f["vite.config.ts"] = "export default {};";
        const root = createProject(f);
        assert.throws(() => addPlugins({ rootFolder: root, plugins: [PLUGIN_IDS.spine2d] }));
        assert.equal(readProjectFile(root, "package.json"), "{}");
        assert.ok(!existsSync(path.join(root, "package.json.back")));
    });

    it("fails on a folder that is not a project", () => {
        const root = createProject({ "a.txt": "x" });
        assert.throws(() => addPlugins({ rootFolder: root, plugins: [PLUGIN_IDS.spine2d] }));
    });
});

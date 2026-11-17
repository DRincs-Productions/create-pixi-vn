import assert from "node:assert/strict";
import {
    cpSync,
    existsSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import installPlugins from "../dist/steps/installPlugins.mjs";

const templates = fileURLToPath(new URL("../templates/react/", import.meta.url));
const read = (root, file) => readFileSync(path.join(root, file), "utf8");
for (const name of readdirSync(templates).filter((name) =>
    /^(visual-novel|interactive-fiction)/.test(name),
)) {
    for (const plugins of [[2], [2, 0, 1]]) {
        test(`${name}: Quest System ${plugins.length === 1 ? "alone" : "with rendering plugins"}`, () => {
            const root = mkdtempSync(path.join(os.tmpdir(), "quest-system-"));
            try {
                cpSync(path.join(templates, name), root, {
                    recursive: true,
                    filter: (source) =>
                        !["node_modules", ".git", "dist"].includes(path.basename(source)),
                });
                installPlugins({ rootFolder: root, plugins });
                const pkg = JSON.parse(read(root, "package.json"));
                assert.equal(pkg.dependencies["@drincs/nqtr"], "latest");
                assert.match(read(root, "src/routes/__root.tsx"), /<MemoMenu/);
                assert.match(read(root, "src/models/Quest.ts"), /extends QuestStoredClass/);
                const declarations = read(root, "src/nqtr.d.ts");
                assert.match(declarations, /interface QuestInterface/);
                assert.doesNotMatch(declarations, /interface (Activity|Stage|Room|OnRunProps)/);
                assert.ok(
                    read(root, "src/content/quests/test.quest.ts")
                        .split("\n")
                        .every((line) => !line.trim() || line.startsWith("//")),
                );
                const vite = read(root, "vite.config.ts");
                assert.match(vite, /vitePluginNqtr\(/);
                assert.ok(vite.indexOf("vitePluginNqtr(") > vite.indexOf("vitePluginPixivn("));
                const menu = name.startsWith("visual-novel")
                    ? "src/components/quick-tools.tsx"
                    : "src/components/screens/narration/narration-menubar.tsx";
                assert.match(read(root, menu), /t\("quests"\)/);
                if (name.includes("-ink"))
                    assert.match(
                        read(root, "src/content/ink/hashtag-commands.ts"),
                        /sections: \{ quest: true \}/,
                    );
                const files = [
                    "package.json",
                    "AGENTS.md",
                    "vite.config.ts",
                    menu,
                    "src/routes/__root.tsx",
                ];
                const before = files.map((file) => read(root, file));
                installPlugins({ rootFolder: root, plugins });
                assert.deepEqual(
                    files.map((file) => read(root, file)),
                    before,
                );
            } finally {
                rmSync(root, { recursive: true, force: true });
            }
        });
    }
}
test("existing nqtr devDependency is preserved", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "quest-existing-"));
    try {
        cpSync(path.join(templates, "visual-novel"), root, {
            recursive: true,
            filter: (source) => !["node_modules", ".git", "dist"].includes(path.basename(source)),
        });
        const pkg = JSON.parse(read(root, "package.json"));
        pkg.devDependencies["@drincs/nqtr"] = "^1.1.2";
        writeFileSync(path.join(root, "package.json"), JSON.stringify(pkg));
        installPlugins({ rootFolder: root, plugins: [2] });
        const result = JSON.parse(read(root, "package.json"));
        assert.equal(result.devDependencies["@drincs/nqtr"], "^1.1.2");
        assert.equal(result.dependencies["@drincs/nqtr"], undefined);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

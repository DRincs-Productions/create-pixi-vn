import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { isRovesProject, readProjectDependencies } from "../dist/utils/roves.mjs";

const templates = path.resolve("templates/react");

describe("isRovesProject", () => {
    it("detects Roves only in the non-Tauri React templates", () => {
        for (const name of fs.readdirSync(templates)) {
            const dependencies = readProjectDependencies(path.join(templates, name));
            if (!dependencies) continue;
            assert.equal(isRovesProject(dependencies), !name.endsWith("-tauri"), name);
        }
    });
});

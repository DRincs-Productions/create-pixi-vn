import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getMatchingSkills } from "../dist/steps/installAgentSkills.mjs";

const GENERAL = ["emil-kowalski", "impeccable", "find-skills", "grill-me"];
const GAMEDEV = ["gamedev-disciplines", "gamedev-genres", "gamedev-workflows"];

describe("getMatchingSkills", () => {
    it("returns nothing for a project without Pixi'VN packages", () => {
        assert.deepEqual(getMatchingSkills({ react: "latest" }), []);
    });

    it("adds the general skills to a React Pixi'VN project, without Vercel React best practices", () => {
        const names = getMatchingSkills({ "@drincs/pixi-vn": "latest", react: "latest" }).map((s) => s.name);
        assert.deepEqual(names, ["pixi-vn", ...GENERAL, ...GAMEDEV]);
    });

    it("adds the Roves skills to a Roves project", () => {
        const skills = getMatchingSkills({
            "@drincs/pixi-vn": "latest",
            "@drincs/roves-api": "latest",
            react: "latest",
        });
        assert.deepEqual(
            skills.map((s) => s.name),
            ["pixi-vn", "roves", ...GENERAL, ...GAMEDEV],
        );
        const roves = skills.find((s) => s.name === "roves");
        assert.equal(roves.repository, "DRincs-Productions/roves@latest");
        assert.equal(roves.skills, undefined);
    });

    it("skips the Roves skills in a Tauri project", () => {
        const names = getMatchingSkills({
            "@drincs/pixi-vn": "latest",
            "@drincs/roves-api": "latest",
            "@tauri-apps/api": "latest",
        }).map((s) => s.name);
        assert.ok(!names.includes("roves"));
    });

    it("keeps plugin skills before the general ones", () => {
        const names = getMatchingSkills({
            "@drincs/pixi-vn": "latest",
            "@drincs/pixi-vn-ink": "latest",
            "@drincs/pixi-vn-spine": "latest",
        }).map((s) => s.name);
        assert.deepEqual(names, ["pixi-vn", "pixi-vn-ink", "pixi-vn-spine", "pixi-vn-spine-ink", ...GENERAL, ...GAMEDEV]);
    });

    it("installs only the selected skill from multi-skill repositories", () => {
        const skills = Object.fromEntries(
            getMatchingSkills({ "@drincs/pixi-vn": "latest", react: "latest" }).map((s) => [s.name, s]),
        );
        assert.deepEqual(skills["impeccable"].skills, ["impeccable"]);
        assert.equal(skills["find-skills"].repository, "vercel-labs/skills");
        assert.equal(skills["grill-me"].repository, "mattpocock/skills");
        assert.equal(skills["emil-kowalski"].skills, undefined);
    });

    it("installs the gamedev disciplines, genres and workflows", () => {
        const skills = Object.fromEntries(getMatchingSkills({ "@drincs/pixi-vn": "latest" }).map((s) => [s.name, s]));
        for (const name of GAMEDEV) {
            assert.equal(skills[name].repository, "gamedev-skills/awesome-gamedev-agent-skills");
        }
        assert.equal(skills["gamedev-disciplines"].skills.length, 15);
        assert.equal(skills["gamedev-genres"].skills.length, 9);
        assert.equal(skills["gamedev-workflows"].skills.length, 5);
        assert.ok(skills["gamedev-genres"].skills.includes("visual-novel"));
    });
});

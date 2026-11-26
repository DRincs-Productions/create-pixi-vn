import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getMatchingSkills } from "../dist/steps/installAgentSkills.mjs";

const GENERAL = ["emil-kowalski", "impeccable", "find-skills", "grill-me"];
const GAMEDEV = ["gamedev-disciplines", "gamedev-genres", "gamedev-workflows"];

describe("getMatchingSkills", () => {
    it("returns nothing for a project without Pixi'VN packages", () => {
        assert.deepEqual(getMatchingSkills({ react: "latest" }), []);
    });

    it("adds general skills and React best practices to a React Pixi'VN project", () => {
        const names = getMatchingSkills({ "@drincs/pixi-vn": "latest", react: "latest" }).map((s) => s.name);
        assert.deepEqual(names, ["pixi-vn", ...GENERAL, "vercel-react-best-practices", ...GAMEDEV]);
    });

    it("skips React best practices when React is not a dependency", () => {
        const names = getMatchingSkills({ "@drincs/pixi-vn": "latest" }).map((s) => s.name);
        assert.deepEqual(names, ["pixi-vn", ...GENERAL, ...GAMEDEV]);
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
        assert.equal(skills["vercel-react-best-practices"].repository, "vercel-labs/agent-skills");
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

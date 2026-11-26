import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getMatchingSkills } from "../dist/steps/installAgentSkills.mjs";

const GENERAL = ["emil-kowalski", "impeccable", "find-skills", "grill-me"];

describe("getMatchingSkills", () => {
    it("returns nothing for a project without Pixi'VN packages", () => {
        assert.deepEqual(getMatchingSkills({ react: "latest" }), []);
    });

    it("adds general skills and React best practices to a React Pixi'VN project", () => {
        const names = getMatchingSkills({ "@drincs/pixi-vn": "latest", react: "latest" }).map((s) => s.name);
        assert.deepEqual(names, ["pixi-vn", ...GENERAL, "vercel-react-best-practices"]);
    });

    it("skips React best practices when React is not a dependency", () => {
        const names = getMatchingSkills({ "@drincs/pixi-vn": "latest" }).map((s) => s.name);
        assert.deepEqual(names, ["pixi-vn", ...GENERAL]);
    });

    it("keeps plugin skills before the general ones", () => {
        const names = getMatchingSkills({
            "@drincs/pixi-vn": "latest",
            "@drincs/pixi-vn-ink": "latest",
            "@drincs/pixi-vn-spine": "latest",
        }).map((s) => s.name);
        assert.deepEqual(names, ["pixi-vn", "pixi-vn-ink", "pixi-vn-spine", "pixi-vn-spine-ink", ...GENERAL]);
    });

    it("installs only the selected skill from multi-skill repositories", () => {
        const skills = Object.fromEntries(
            getMatchingSkills({ "@drincs/pixi-vn": "latest", react: "latest" }).map((s) => [s.name, s]),
        );
        assert.equal(skills["impeccable"].skill, "impeccable");
        assert.equal(skills["find-skills"].repository, "vercel-labs/skills");
        assert.equal(skills["grill-me"].repository, "mattpocock/skills");
        assert.equal(skills["vercel-react-best-practices"].repository, "vercel-labs/agent-skills");
        assert.equal(skills["emil-kowalski"].skill, undefined);
    });
});

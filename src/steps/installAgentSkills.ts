import { confirm, isCancel, log, multiselect } from "@clack/prompts";
import { execa } from "execa";
import fs from "node:fs";
import path from "node:path";
import t from "../i18n";
import { ROVES_DEPENDENCIES, TAURI_DEPENDENCIES } from "../utils/roves";

type AgentTarget =
    | "codex"
    | "claude-code"
    | "cursor"
    | "github-copilot"
    | "gemini-cli"
    | "opencode"
    | "universal";

type ProjectPackage = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
};

type SkillPackage = {
    /** All of these dependencies must be installed in the project. */
    dependencies: string[];
    /** None of these dependencies may be installed in the project. */
    excludedDependencies?: string[];
    repository: string;
    label: string;
    name: string;
    /** Skills to install from the repository. Defaults to all skills ("*"). */
    skills?: string[];
};

const skillPackages: SkillPackage[] = [
    {
        dependencies: ["@drincs/pixi-vn"],
        repository: "DRincs-Productions/pixi-vn@latest",
        label: "Pixi’VN",
        name: "pixi-vn",
    },
    {
        dependencies: ["@drincs/pixi-vn-ink"],
        repository: "DRincs-Productions/pixi-vn-ink@latest",
        label: "Pixi’VN Ink",
        name: "pixi-vn-ink",
    },
    {
        dependencies: ["@drincs/nqtr"],
        repository: "DRincs-Productions/nqtr@latest",
        label: "NQTR",
        name: "nqtr",
    },
    {
        dependencies: ["@drincs/pixi-vn-spine"],
        repository: "DRincs-Productions/pixi-vn-spine@latest",
        label: "Pixi’VN Spine",
        name: "pixi-vn-spine",
        skills: ["pixi-vn-spine"],
    },
    {
        dependencies: ["@drincs/pixi-vn-spine", "@drincs/pixi-vn-ink"],
        repository: "DRincs-Productions/pixi-vn-spine@latest",
        label: "Pixi’VN Spine Ink",
        name: "pixi-vn-spine-ink",
        skills: ["pixi-vn-spine-ink"],
    },
    {
        dependencies: ["@drincs/pixi-vn-live2d"],
        repository: "DRincs-Productions/pixi-vn-live2d@latest",
        label: "Pixi’VN Live2D",
        name: "pixi-vn-live2d",
        skills: ["pixi-vn-live2d"],
    },
    {
        dependencies: ["@drincs/pixi-vn-live2d", "@drincs/pixi-vn-ink"],
        repository: "DRincs-Productions/pixi-vn-live2d@latest",
        label: "Pixi’VN Live2D Ink",
        name: "pixi-vn-live2d-ink",
        skills: ["pixi-vn-live2d-ink"],
    },
    {
        // Roves projects: the Tauri templates also ship @drincs/roves-api, so exclude them.
        dependencies: ROVES_DEPENDENCIES,
        excludedDependencies: TAURI_DEPENDENCIES,
        repository: "DRincs-Productions/roves@latest",
        label: "Roves",
        name: "roves",
    },
];

/**
 * General-purpose skills installed together with the project skills
 * whenever the user selects at least one AI agent.
 */
const generalSkillPackages: SkillPackage[] = [
    {
        dependencies: [],
        repository: "emilkowalski/skills",
        label: "Emil Kowalski Skills",
        name: "emil-kowalski",
    },
    {
        dependencies: [],
        repository: "pbakaus/impeccable",
        label: "Impeccable",
        name: "impeccable",
        skills: ["impeccable"],
    },
    {
        dependencies: [],
        repository: "vercel-labs/skills",
        label: "find-skills",
        name: "find-skills",
        skills: ["find-skills"],
    },
    {
        dependencies: [],
        repository: "mattpocock/skills",
        label: "grill-me",
        name: "grill-me",
        skills: ["grill-me"],
    },
    {
        dependencies: [],
        repository: "gamedev-skills/awesome-gamedev-agent-skills",
        label: "Gamedev Disciplines",
        name: "gamedev-disciplines",
        skills: [
            "ai-behavior-trees-utility-ai",
            "audio-design",
            "camera-systems",
            "create-game-assets",
            "dialogue-systems",
            "game-ai",
            "game-feel",
            "game-ui-ux",
            "input-systems",
            "level-design",
            "performance-optimization",
            "physics-tuning",
            "procedural-gen",
            "save-systems",
            "shader-programming",
        ],
    },
    {
        dependencies: [],
        repository: "gamedev-skills/awesome-gamedev-agent-skills",
        label: "Gamedev Genres",
        name: "gamedev-genres",
        skills: [
            "card-game",
            "fps-shooter",
            "platformer",
            "puzzle",
            "roguelike",
            "rpg",
            "survival-crafting",
            "tower-defense",
            "visual-novel",
        ],
    },
    {
        dependencies: [],
        repository: "gamedev-skills/awesome-gamedev-agent-skills",
        label: "Gamedev Workflows",
        name: "gamedev-workflows",
        skills: ["game-docs", "game-jam", "itch-publish", "prototype-fast", "steam-publish"],
    },
];

export function getMatchingSkills(dependencies: Record<string, string>): SkillPackage[] {
    const matches = (skillPackage: SkillPackage) =>
        skillPackage.dependencies.every((dependency) => dependency in dependencies) &&
        !skillPackage.excludedDependencies?.some((dependency) => dependency in dependencies);
    const projectSkills = skillPackages.filter(matches);
    if (projectSkills.length === 0) return [];
    return [...projectSkills, ...generalSkillPackages.filter(matches)];
}

export default async function installAgentSkills({ rootFolder }: { rootFolder: string }) {
    const packageJsonPath = path.join(rootFolder, "package.json");
    if (!fs.existsSync(packageJsonPath)) return;

    const projectPackage = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as ProjectPackage;
    const dependencies = {
        ...projectPackage.dependencies,
        ...projectPackage.devDependencies,
        ...projectPackage.optionalDependencies,
    };
    const matchingSkills = getMatchingSkills(dependencies);

    if (matchingSkills.length === 0) return;

    const shouldInstall = await confirm({
        message: t("aiInstallPrompt"),
        initialValue: true,
    });
    if (isCancel(shouldInstall)) {
        log.info(t("aiSkip"));
        return;
    }
    if (!shouldInstall) return;

    const agentTargets = await multiselect<AgentTarget>({
        message: t("aiAgentPrompt"),
        options: [
            {
                value: "codex",
                label: "Codex",
                hint: t("pathHint", { path: "~/.agents/skills" }),
            },
            {
                value: "claude-code",
                label: "Claude Code",
                hint: t("pathHint", { path: "~/.claude/skills" }),
            },
            {
                value: "cursor",
                label: "Cursor",
                hint: t("pathHint", { path: "~/.cursor/skills" }),
            },
            {
                value: "github-copilot",
                label: "GitHub Copilot",
                hint: t("pathHint", { path: "~/.copilot/skills" }),
            },
            {
                value: "gemini-cli",
                label: "Gemini CLI",
                hint: t("pathHint", { path: "~/.gemini/skills" }),
            },
            {
                value: "opencode",
                label: "OpenCode",
                hint: t("pathHint", { path: "~/.config/opencode/skills" }),
            },
            {
                value: "universal",
                label: "Other (Universal)",
                hint: t("universalHint"),
            },
        ],
        initialValues: ["universal"],
        required: true,
    });
    if (isCancel(agentTargets)) {
        log.info(t("aiSkip"));
        return;
    }

    for (const skill of matchingSkills) {
        try {
            const subprocess = execa(
                "npx",
                [
                    "--yes",
                    "skills@latest",
                    "add",
                    skill.repository,
                    "--skill",
                    ...(skill.skills ?? ["*"]),
                    "--agent",
                    ...agentTargets,
                    "-g",
                    "-y",
                ],
                { cwd: rootFolder, stdio: "pipe" },
            );
            let pendingOutput = "";
            let hasShownProgress = false;
            if (skill.skills && skill.skills.length > 1) {
                log.step(t("installingSkillsFor", { count: String(skill.skills.length), name: skill.name }));
                hasShownProgress = true;
            }
            const captureProgress = (chunk: Buffer | string) => {
                if (hasShownProgress) return;
                pendingOutput += String(chunk).replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
                const allSkillsMatch = pendingOutput.match(/Installing all\s+(\d+)\s+skills?/i);
                const singleSkillMatch = pendingOutput.match(/Skill:\s*([^\r\n]+)/i);
                if (allSkillsMatch) {
                    log.step(
                        t("installingSkillsFor", {
                            count: allSkillsMatch[1],
                            name: skill.name,
                        }),
                    );
                    hasShownProgress = true;
                } else if (singleSkillMatch) {
                    log.step(t("installingSkillsFor", { count: "1", name: skill.name }));
                    hasShownProgress = true;
                } else {
                    pendingOutput = pendingOutput.slice(-200);
                }
            };
            subprocess.stdout.on("data", captureProgress);
            subprocess.stderr.on("data", captureProgress);
            await subprocess;
        } catch (error) {
            log.error(t("skillInstallError", { name: skill.label, error: String(error) }));
        }
    }
}

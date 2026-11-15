import { confirm, isCancel, log, multiselect } from "@clack/prompts";
import { execa } from "execa";
import fs from "node:fs";
import path from "node:path";
import t from "../i18n";

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
    repository: string;
    label: string;
    name: string;
    /** Skill to install from the repository. Defaults to all skills ("*"). */
    skill?: string;
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
        skill: "pixi-vn-spine",
    },
    {
        dependencies: ["@drincs/pixi-vn-spine", "@drincs/pixi-vn-ink"],
        repository: "DRincs-Productions/pixi-vn-spine@latest",
        label: "Pixi’VN Spine Ink",
        name: "pixi-vn-spine-ink",
        skill: "pixi-vn-spine-ink",
    },
];

export default async function installAgentSkills({ rootFolder }: { rootFolder: string }) {
    const packageJsonPath = path.join(rootFolder, "package.json");
    if (!fs.existsSync(packageJsonPath)) return;

    const projectPackage = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as ProjectPackage;
    const dependencies = {
        ...projectPackage.dependencies,
        ...projectPackage.devDependencies,
        ...projectPackage.optionalDependencies,
    };
    const matchingSkills = skillPackages.filter((skillPackage) =>
        skillPackage.dependencies.every((dependency) => dependency in dependencies),
    );

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
                    skill.skill ?? "*",
                    "--agent",
                    ...agentTargets,
                    "-g",
                    "-y",
                ],
                { cwd: rootFolder, stdio: "pipe" },
            );
            let pendingOutput = "";
            let hasShownProgress = false;
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

import { confirm, isCancel, log, multiselect } from "@clack/prompts";
import { execa } from "execa";
import fs from "node:fs";
import path from "node:path";

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

const skillPackages = [
    {
        dependency: "@drincs/pixi-vn",
        repository: "DRincs-Productions/pixi-vn@latest",
        label: "Pixi’VN",
    },
    {
        dependency: "@drincs/pixi-vn-ink",
        repository: "DRincs-Productions/pixi-vn-ink@latest",
        label: "Pixi’VN Ink",
    },
    {
        dependency: "@drincs/nqtr",
        repository: "DRincs-Productions/nqtr@latest",
        label: "NQTR",
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
    const matchingSkills = skillPackages.filter(({ dependency }) => dependency in dependencies);

    if (matchingSkills.length === 0) return;

    const shouldInstall = await confirm({
        message: "Install matching AI skills globally for this project?",
        initialValue: false,
    });
    if (isCancel(shouldInstall)) {
        log.info("Skipping AI skill installation.");
        return;
    }
    if (!shouldInstall) return;

    const agentTargets = await multiselect<AgentTarget>({
        message: "Select every AI agent where you want to install the skills:",
        options: [
            {
                value: "codex",
                label: "Codex",
                hint: "Installs to ~/.agents/skills",
            },
            {
                value: "claude-code",
                label: "Claude Code",
                hint: "Installs to ~/.claude/skills",
            },
            {
                value: "cursor",
                label: "Cursor",
                hint: "Installs to ~/.cursor/skills",
            },
            {
                value: "github-copilot",
                label: "GitHub Copilot",
                hint: "Installs to ~/.copilot/skills",
            },
            {
                value: "gemini-cli",
                label: "Gemini CLI",
                hint: "Installs to ~/.gemini/skills",
            },
            {
                value: "opencode",
                label: "OpenCode",
                hint: "Installs to ~/.config/opencode/skills",
            },
            {
                value: "universal",
                label: "Other (Universal)",
                hint: "Shared skills directory: ~/.config/agents/skills",
            },
        ],
        initialValues: ["codex"],
        required: true,
    });
    if (isCancel(agentTargets)) {
        log.info("Skipping AI skill installation.");
        return;
    }

    for (const skill of matchingSkills) {
        log.step(`Installing ${skill.label} skill...`);
        try {
            await execa(
                "npx",
                [
                    "--yes",
                    "skills@latest",
                    "add",
                    skill.repository,
                    "--skill",
                    "*",
                    "--agent",
                    ...agentTargets,
                    "-g",
                    "-y",
                ],
                { cwd: rootFolder, stdio: "inherit" },
            );
        } catch (error) {
            log.error(`Could not install ${skill.label} skills: ${error}`);
        }
    }
}

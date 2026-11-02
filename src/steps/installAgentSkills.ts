import { confirm, isCancel, log, select } from "@clack/prompts";
import { execa } from "execa";
import fs from "node:fs";
import path from "node:path";

type AgentTarget = "codex" | "claude-code" | "other";

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
        message: "Would you like to install AI skills for this project globally?",
        initialValue: false,
    });
    if (isCancel(shouldInstall)) {
        log.info("Skipping AI skill installation.");
        return;
    }
    if (!shouldInstall) return;

    const agentTarget = await select<AgentTarget>({
        message: "Which AI agent should receive the skills?",
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
                value: "other",
                label: "Other (shared agent skills)",
                hint: "Uses the shared ~/.agents/skills directory",
            },
        ],
        initialValue: "codex",
    });
    if (isCancel(agentTarget)) {
        log.info("Skipping AI skill installation.");
        return;
    }

    const agent = agentTarget === "claude-code" ? "claude-code" : "codex";
    if (agentTarget === "other") {
        log.info("Using the Codex install target so compatible agents can read ~/.agents/skills.");
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
                    agent,
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

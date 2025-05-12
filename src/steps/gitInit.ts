import { cancel, isCancel, log, select, tasks } from "@clack/prompts";
import spawn from "cross-spawn";
import fs from "node:fs";
import path from "node:path";

export default async function gitInit({ rootFolder }: { rootFolder: string }) {
    // Check if exist in rootFolder a .git folder
    const gitFolder = path.join(rootFolder, ".git`");
    try {
        if (fs.existsSync(gitFolder)) {
            log.warn(`git folder already exists.`);
            return;
        }
    } catch (error) {}

    const initGit = await select({
        message: "Do you want to initialize a git repository? (recommended)",
        options: [
            { value: true, label: "Yes", hint: "You can use GitHub to track changes and collaborate with others." },
            { value: false, label: "No", hint: "It is not recommended to skip this step." },
        ],
        initialValue: true,
    });
    if (isCancel(initGit)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }
    if (initGit) {
        const task = await tasks([
            {
                title: `Initializing git repository...`,
                task: async (message) => {
                    spawn.sync("git", ["init", "-b", "main"], { cwd: rootFolder, stdio: "inherit" });
                    spawn.sync("git", ["add", "."], { cwd: rootFolder, stdio: "inherit" });

                    return "Git repository initialized.";
                },
            },
        ]);
        if (isCancel(task)) {
            cancel("Operation cancelled.");
            process.exit(0);
        }
        log.message(
            `Now, you can use GitHub Desktop upload your project to GitHub.\nGitHub Desktop: https://github.com/apps/desktop`
        );
    }
}

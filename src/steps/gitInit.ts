import { cancel, isCancel, log, select, tasks } from "@clack/prompts";
import { execa } from "execa";
import fs from "node:fs";
import path from "node:path";

export default async function gitInit({ rootFolder }: { rootFolder: string }) {
    // Check if exist in rootFolder a .git folder
    const gitFolder = path.join(rootFolder, ".git");
    try {
        if (fs.existsSync(gitFolder)) {
            log.warn(`Git repository already exists.`);
            return;
        }
    } catch (error) {
        log.error(`Error checking git folder: ${error}`);
        return;
    }

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
                    const initResult = await execa("git", ["init", "-b", "main"], { cwd: rootFolder });
                    message(initResult.stdout);

                    const addResult = await execa("git", ["add", "."], { cwd: rootFolder });
                    message(addResult.stdout);

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

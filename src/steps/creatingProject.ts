import { cancel, confirm, isCancel, tasks } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OverwriteEnum from "../enum/OverwriteEnum";
import { copy, handleConflict } from "../utils/dir-utility";

const renameFiles: Record<string, string | undefined> = {
    _gitignore: ".gitignore",
};

function applyReplacements(content: string, packageName: string, description: string, projectName: string, identifier?: string): string {
    content = content.replace(/my-app-package-name/g, packageName);
    content = content.replace(/my-app-description/g, description);
    content = content.replace(/my-app-project-name/g, projectName);
    if (identifier) {
        content = content.replace(/com\.my-app-project-name\.app/g, identifier);
    }
    return content;
}

function replacePlaceholders(filePath: string, packageName: string, description: string, projectName: string, identifier?: string) {
    if (!fs.existsSync(filePath)) return;
    fs.writeFileSync(filePath, applyReplacements(fs.readFileSync(filePath, "utf-8"), packageName, description, projectName, identifier));
}

export default async function creatingProject({
    rootFolder,
    overwrite,
    template,
    packageName,
    description,
    projectName,
    identifier,
}: {
    rootFolder: string;
    overwrite: OverwriteEnum | undefined;
    template: string;
    packageName: string;
    description: string;
    projectName: string;
    identifier: string;
}) {
    const task = await tasks([
        {
            title: `Creating project in ${rootFolder}...`,
            task: async () => {
                // If the folder does not exist, create it
                if (!fs.existsSync(rootFolder)) {
                    fs.mkdirSync(rootFolder, { recursive: true });
                }

                const templateDir = path.resolve(fileURLToPath(import.meta.url), "../..", `${template}`);

                const write = (file: string, content?: string) => {
                    const targetPath = path.join(rootFolder, renameFiles[file] ?? file);
                    if (content) {
                        fs.writeFileSync(targetPath, content);
                    } else {
                        copy(path.join(templateDir, file), targetPath, overwrite);
                    }
                };

                const filesNames = fs.readdirSync(templateDir);
                const promises = filesNames.map(async (fileName) => {
                    const srcFile = path.join(templateDir, fileName);
                    const destFile = path.join(rootFolder, renameFiles[fileName] ?? fileName);

                    if (fs.existsSync(destFile)) {
                        switch (overwrite) {
                            case OverwriteEnum.Ask:
                                if (fs.statSync(destFile).isFile()) {
                                    const answer = await confirm({
                                        message: `File ${destFile} already exists. Do you want to overwrite it?`,
                                        initialValue: false,
                                    });
                                    if (isCancel(answer)) {
                                        cancel("Operation cancelled.");
                                        process.exit(0);
                                    }
                                    if (!answer) return;
                                    fs.rmSync(destFile, { force: true });
                                } else {
                                    // If it’s a directory, ask file by file
                                    const entries = fs.readdirSync(srcFile);
                                    for (const entry of entries) {
                                        const childSrc = path.join(srcFile, entry);
                                        const childDest = path.join(destFile, entry);
                                        if (fs.existsSync(childDest)) {
                                            const answer = await confirm({
                                                message: `File ${childDest} already exists. Do you want to overwrite it?`,
                                                initialValue: false,
                                            });
                                            if (isCancel(answer)) {
                                                cancel("Operation cancelled.");
                                                process.exit(0);
                                            }
                                            if (!answer) continue;
                                            fs.rmSync(childDest, { force: true });
                                        }
                                        copy(childSrc, childDest, overwrite);
                                    }
                                    return;
                                }
                                break;

                            case OverwriteEnum.Skip:
                                return;

                            case OverwriteEnum.Overwrite:
                            case OverwriteEnum.Delete:
                                handleConflict(srcFile, destFile, overwrite);
                                break;
                        }
                    }

                    switch (fileName) {
                        case "package.json":
                        case "vite.config.ts":
                        case "index.html":
                        case "README.md": {
                            write(fileName, applyReplacements(fs.readFileSync(srcFile, "utf-8"), packageName, description, projectName));
                            break;
                        }
                        case ".git":
                        case "package-lock.json":
                            break;
                        default:
                            write(fileName);
                    }
                });
                await Promise.all(promises);

                // If .vscode exists → replace placeholders in launch.json
                replacePlaceholders(path.join(rootFolder, ".vscode", "launch.json"), packageName, description, projectName);

                // If src-tauri exists → replace placeholders in Cargo.toml and tauri.conf.json
                const srcTauriDir = path.join(rootFolder, "src-tauri");
                if (fs.existsSync(srcTauriDir)) {
                    for (const fileName of ["Cargo.toml", "tauri.conf.json"]) {
                        replacePlaceholders(path.join(srcTauriDir, fileName), packageName, description, projectName, identifier);
                    }
                }

                // If _github exists → rename it to .github
                const srcGitHubDir = path.join(rootFolder, "_github");
                if (fs.existsSync(srcGitHubDir)) {
                    fs.renameSync(srcGitHubDir, path.join(rootFolder, ".github"));
                }

                return "Project created";
            },
        },
    ]);

    if (isCancel(task)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }
}

import { cancel, confirm, isCancel, tasks } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OverwriteEnum from "../enum/OverwriteEnum";
import { copy, handleConflict } from "../utils/dir-utility";

const renameFiles: Record<string, string | undefined> = {
    _gitignore: ".gitignore",
};

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
                            let file = fs.readFileSync(srcFile, "utf-8");
                            file = file.replace(/my-app-package-name/g, packageName);
                            file = file.replace(/my-app-description/g, description);
                            file = file.replace(/my-app-project-name/g, projectName);
                            write(fileName, file);
                            break;
                        case ".git":
                        case "package-lock.json":
                            break;
                        default:
                            write(fileName);
                    }
                });
                await Promise.all(promises);

                // If src-tauri exists → copy customized files
                const srcTauriDir = path.join(rootFolder, "src-tauri");
                if (fs.existsSync(srcTauriDir)) {
                    const filesNames = fs.readdirSync(srcTauriDir);
                    const promises = filesNames.map(async (fileName) => {
                        switch (fileName) {
                            case "Cargo.lock":
                            case "Cargo.toml":
                            case "tauri.conf.json":
                                let file = fs.readFileSync(path.join(srcTauriDir, fileName), "utf-8");
                                file = file.replace(/my-app-package-name/g, packageName);
                                file = file.replace(/my-app-description/g, description);
                                file = file.replace(/my-app-project-name/g, projectName);
                                file = file.replace(/com.my-app-project-name.app/g, identifier);
                                write(path.join("src-tauri", fileName), file);
                        }
                    });
                    await Promise.all(promises);
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

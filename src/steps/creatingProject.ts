import { cancel, confirm, isCancel, tasks } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OverwriteEnum from "../enum/OverwriteEnum";
import { emptyDir } from "../utils/dir-utility";

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
            task: async (message) => {
                switch (overwrite) {
                    case OverwriteEnum.Delete:
                        emptyDir(rootFolder);
                        break;
                    case OverwriteEnum.Overwrite:
                    case OverwriteEnum.Skip:
                    case OverwriteEnum.Ask:
                        break;
                    default:
                        fs.mkdirSync(rootFolder, { recursive: true });
                        break;
                }

                const templateDir = path.resolve(fileURLToPath(import.meta.url), "../..", `${template}`);

                const write = (file: string, content?: string) => {
                    const targetPath = path.join(rootFolder, renameFiles[file] ?? file);
                    if (content) {
                        fs.writeFileSync(targetPath, content);
                    } else {
                        copy(path.join(templateDir, file), targetPath);
                    }
                };

                const filesNames = fs.readdirSync(templateDir);
                const promises = filesNames.map(async (fileName) => {
                    const filePath = path.join(rootFolder, renameFiles[fileName] ?? fileName);
                    if (fs.existsSync(filePath)) {
                        switch (overwrite) {
                            case OverwriteEnum.Ask:
                                const overwrite = await confirm({
                                    message: `File ${filePath} already exists. Do you want to overwrite it?`,
                                    initialValue: false,
                                });
                                if (isCancel(overwrite)) {
                                    cancel("Operation cancelled.");
                                    process.exit(0);
                                }
                                if (!overwrite) {
                                    return;
                                }
                                fs.rmSync(filePath, { recursive: true, force: true });
                                break;
                            case OverwriteEnum.Skip:
                                return;
                            case OverwriteEnum.Delete:
                            case OverwriteEnum.Overwrite:
                                fs.rmSync(filePath, { recursive: true, force: true });
                                break;
                        }
                    }
                    switch (fileName) {
                        case "package.json":
                        case "vite.config.ts":
                        case "index.html":
                            let file = fs.readFileSync(path.join(templateDir, fileName), "utf-8");
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

                // if exist root/src-tauri folder, copy it to root folder
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

                // if exist root/_github folder, rename it to .github
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

function copyDir(srcDir: string, destDir: string) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file);
        const destFile = path.resolve(destDir, file);
        copy(srcFile, destFile);
    }
}

function copy(src: string, dest: string) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        copyDir(src, dest);
    } else {
        fs.copyFileSync(src, dest);
    }
}

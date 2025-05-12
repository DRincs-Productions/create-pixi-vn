import { cancel, confirm, isCancel } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_PACKAGE_NAME } from "../constats";
import GameTypesEnum from "../enum/GameTypesEnum";
import NarrativeLanguagesEnum from "../enum/NarrativeLanguagesEnum";
import OverwriteEnum from "../enum/OverwriteEnum";
import UIFrameworkEnum from "../enum/UIFrameworkEnum";
import gameTypeQuestions from "../questions/gameTypeQuestions";
import projectInfoQuestions from "../questions/projectInfoQuestions";
import { emptyDir } from "../utils/dir-utility";

const cwd = process.cwd();
const renameFiles: Record<string, string | undefined> = {
    _gitignore: ".gitignore",
};

export default async function selectTemplate(argTargetDir: string | undefined): Promise<{
    rootFolder: string;
    fileToOpen?: string;
}> {
    let targetDir = argTargetDir || DEFAULT_PACKAGE_NAME;
    let fileToOpen: string | undefined = undefined;

    let { description, overwrite, packageName, projectName } = await projectInfoQuestions({ argTargetDir, targetDir });
    let { UIFramework, gameType, narrativeLanguage, multidevice, identifier } = await gameTypeQuestions({
        packageName,
    });
    let template: string;
    switch (gameType) {
        case GameTypesEnum.VisualNovel:
            switch (UIFramework) {
                case UIFrameworkEnum.React:
                    switch (narrativeLanguage) {
                        case NarrativeLanguagesEnum.Typescript:
                            if (multidevice) {
                                template = "template-react-vite-muijoy-tauri";
                            } else {
                                template = "template-react-vite-muijoy";
                            }
                            fileToOpen = "src/labels/startLabel.ts";
                            break;
                        case NarrativeLanguagesEnum.Ink:
                            if (multidevice) {
                                template = "template-react-vite-muijoy-ink-tauri";
                            } else {
                                template = "template-react-vite-muijoy-ink";
                            }
                            fileToOpen = "src/ink/start.ink";
                            break;
                        case NarrativeLanguagesEnum.Renpy:
                            cancel("Error: There are no templates for this narrative language");
                            process.exit(0);
                        default:
                            cancel("Error: Unknown narrative language");
                            process.exit(0);
                    }
                    break;
                case UIFrameworkEnum.Vue:
                case UIFrameworkEnum.Angular:
                    cancel("Error: There are no templates for this game type and UI framework");
                    process.exit(0);
                default:
                    cancel("Error: Unknown UI framework");
                    process.exit(0);
            }
            break;
        case GameTypesEnum.GameEngine:
            template = "template-game-engine";
            fileToOpen = "src/index.ts";
            break;
        default:
            cancel("Error: Unknown game type");
            process.exit(0);
    }

    const rootFolder = path.join(cwd, targetDir);

    switch (overwrite) {
        case OverwriteEnum.Delete:
            emptyDir(rootFolder);
            break;
        case OverwriteEnum.Overwrite:
        case OverwriteEnum.Skip:
        case OverwriteEnum.Ask:
            break;
        default:
            cancel("Error: Unknown overwrite option");
            process.exit(0);
    }

    console.log(`\nScaffolding project in ${rootFolder}...`);

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
    for (const fileName of filesNames) {
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
                        continue;
                    }
                case OverwriteEnum.Skip:
                    continue;
                case OverwriteEnum.Delete:
                case OverwriteEnum.Overwrite:
                    fs.rmSync(filePath, { recursive: true, force: true });
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
    }

    // if exist root/src-tauri folder, copy it to root folder
    const srcTauriDir = path.join(rootFolder, "src-tauri");
    if (fs.existsSync(srcTauriDir)) {
        const filesNames = fs.readdirSync(srcTauriDir);
        for (const fileName of filesNames) {
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
        }
    }

    // if exist root/_github folder, rename it to .github
    const srcGitHubDir = path.join(rootFolder, "_github");
    if (fs.existsSync(srcGitHubDir)) {
        fs.renameSync(srcGitHubDir, path.join(rootFolder, ".github"));
    }

    console.log(`Done.`);

    return {
        rootFolder,
        fileToOpen,
    };
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

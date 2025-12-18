import { cancel } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import GameTypesEnum from "../enum/GameTypesEnum";
import NarrativeLanguagesEnum from "../enum/NarrativeLanguagesEnum";
import UIFrameworkEnum from "../enum/UIFrameworkEnum";
import gameTypeQuestions from "../questions/gameTypeQuestions";
import projectInfoQuestions from "../questions/projectInfoQuestions";
import creatingProject from "./creatingProject";

const cwd = process.cwd();

export default async function selectTemplate(): Promise<{
    rootFolder: string;
    fileToOpen?: string;
}> {
    let fileToOpen: string | undefined = undefined;

    let { description, overwrite, packageName, projectName, foltderName } = await projectInfoQuestions();
    let { UIFramework, gameType, narrativeLanguage, multidevice, identifier } = await gameTypeQuestions({
        packageName,
    });

    const rootFolder = path.join(cwd, foltderName);

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
        case GameTypesEnum.TextStory:
            switch (UIFramework) {
                case UIFrameworkEnum.React:
                    switch (narrativeLanguage) {
                        case NarrativeLanguagesEnum.Typescript:
                            if (multidevice) {
                                template = "template-story-react-vite-muijoy-tauri";
                            } else {
                                template = "template-story-react-vite-muijoy";
                            }
                            fileToOpen = "src/labels/startLabel.ts";
                            break;
                        case NarrativeLanguagesEnum.Ink:
                            if (multidevice) {
                                template = "template-story-react-vite-muijoy-ink-tauri";
                            } else {
                                template = "template-story-react-vite-muijoy-ink";
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
        case GameTypesEnum.PointAndClick:
            switch (UIFramework) {
                case UIFrameworkEnum.React:
                    switch (narrativeLanguage) {
                        case NarrativeLanguagesEnum.Typescript:
                            if (multidevice) {
                                template = "template-nqtr-react-vite-muijoy-tauri";
                            } else {
                                template = "template-nqtr-react-vite-muijoy";
                            }
                            fileToOpen = "src/labels/startLabel.ts";
                            break;
                        case NarrativeLanguagesEnum.Ink:
                            if (multidevice) {
                                template = "template-nqtr-react-vite-muijoy-ink-tauri";
                            } else {
                                template = "template-nqtr-react-vite-muijoy-ink";
                            }
                            fileToOpen = "src/ink/variousActionsLabels.ink";
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
        case GameTypesEnum.Library:
            template = "template-lib";
            fileToOpen = "src/index.ts";
            break;
        default:
            cancel("Error: Unknown game type");
            process.exit(0);
    }

    await creatingProject({
        rootFolder,
        template,
        packageName,
        description,
        projectName,
        overwrite,
        identifier,
    });

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

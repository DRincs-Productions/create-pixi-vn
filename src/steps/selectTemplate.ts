import { cancel } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { GAME_TYPES } from "../constats";
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
    canReplaceUI: boolean;
}> {
    let fileToOpen: string | undefined = undefined;

    let { description, overwrite, packageName, projectName, foltderName } =
        await projectInfoQuestions();
    let { UIFramework, gameType, narrativeLanguage, multidevice, identifier } =
        await gameTypeQuestions({
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
                                template = "templates/react/visual-novel-tauri";
                            } else {
                                template = "templates/react/visual-novel";
                            }
                            fileToOpen = "src/content/labels/start.label.ts";
                            break;
                        case NarrativeLanguagesEnum.Ink:
                            if (multidevice) {
                                template = "templates/react/visual-novel-ink-tauri";
                            } else {
                                template = "templates/react/visual-novel-ink";
                            }
                            fileToOpen = "ink/start.ink";
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
                                template = "templates/react/point-and-click-tauri";
                            } else {
                                template = "templates/react/point-and-click";
                            }
                            fileToOpen = "src/content/labels/start.label.ts";
                            break;
                        case NarrativeLanguagesEnum.Ink:
                            if (multidevice) {
                                template = "templates/react/point-and-click-ink-tauri";
                            } else {
                                template = "templates/react/point-and-click-ink";
                            }
                            fileToOpen = "ink/start.ink";
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
        case GameTypesEnum.InteractiveFiction:
            switch (UIFramework) {
                case UIFrameworkEnum.React:
                    switch (narrativeLanguage) {
                        case NarrativeLanguagesEnum.Typescript:
                            if (multidevice) {
                                template = "templates/react/interactive-fiction-tauri";
                            } else {
                                template = "templates/react/interactive-fiction";
                            }
                            fileToOpen = "src/content/labels/start.label.ts";
                            break;
                        case NarrativeLanguagesEnum.Ink:
                            if (multidevice) {
                                template = "templates/react/interactive-fiction-ink-tauri";
                            } else {
                                template = "templates/react/interactive-fiction-ink";
                            }
                            fileToOpen = "ink/start.ink";
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
            template = "templates/game-engine";
            fileToOpen = "src/index.ts";
            break;
        case GameTypesEnum.Library:
            template = "templates/lib";
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

    const canReplaceUI = GAME_TYPES.find((f) => f.type === gameType)?.canReplaceUI ?? false;

    return {
        rootFolder,
        fileToOpen,
        canReplaceUI,
    };
}

import { cancel, isCancel, select, text } from "@clack/prompts";
import { cyan, gray, lightRed, red } from "kolorist";
import { GAME_TYPES } from "../constats";
import NarrativeLanguagesEnum from "../enum/NarrativeLanguagesEnum";
import UIFrameworkEnum from "../enum/UIFrameworkEnum";

export default async function gameTypeQuestions({ packageName }: { packageName: string }) {
    const gameType = await select({
        message: "Select the type of game you want to create:",
        options: GAME_TYPES.map((gameType) => ({
            label: gameType.name,
            value: gameType.type,
        })),
        initialValue: GAME_TYPES[0].type,
    });
    if (isCancel(gameType)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }
    const availableUI =
        GAME_TYPES.find((f) => f.type === gameType)?.availableUI.map((ui) => {
            let name = "";
            switch (ui) {
                case UIFrameworkEnum.React:
                    name = cyan("React");
                    break;
                case UIFrameworkEnum.Vue:
                    name = gray("Vue");
                    break;
                case UIFrameworkEnum.Angular:
                    name = red("Angular");
                    break;
            }
            return {
                label: name,
                value: ui,
            };
        }) || [];
    let UIFramework;
    if (availableUI.length === 0) {
        UIFramework = await select({
            message: "Select the UI framework you want to use:",
            options: availableUI,
            initialValue: GAME_TYPES.find((f) => f.type === gameType)?.availableUI[0],
        });
        if (isCancel(UIFramework)) {
            cancel("Operation cancelled.");
            process.exit(0);
        }
    } else {
        UIFramework = undefined;
    }
    const availableNarrativeLanguages =
        GAME_TYPES.find((f) => f.type === gameType)?.availableNarrativeLanguages.map((lang) => {
            let name = "";
            switch (lang) {
                case NarrativeLanguagesEnum.Ink:
                    name = "Ink + Typescript";
                    break;
                case NarrativeLanguagesEnum.Renpy:
                    name = lightRed("Renpy");
                    break;
                case NarrativeLanguagesEnum.Typescript:
                    name = cyan("Typescript");
                    break;
            }
            return {
                label: name,
                value: lang,
            };
        }) || [];
    let narrativeLanguage;
    if (availableNarrativeLanguages.length === 0) {
        narrativeLanguage = await select({
            message: "Select the narrative language you want to use:",
            options: availableNarrativeLanguages,
            initialValue: GAME_TYPES.find((f) => f.type === gameType)?.availableNarrativeLanguages[0],
        });
        if (isCancel(narrativeLanguage)) {
            cancel("Operation cancelled.");
            process.exit(0);
        }
    } else {
        narrativeLanguage = undefined;
    }
    const multidevice = await select({
        message: "Which devices is the project intended for?",
        options: [
            {
                label: "Web page",
                value: false,
            },
            {
                label: "Web page + Desktop + Mobile (Tauri)",
                value: true,
            },
        ],
        initialValue: false,
    });
    if (isCancel(multidevice)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }
    let identifier;
    if (multidevice) {
        identifier = await text({
            message: "Project identifier:",
            initialValue: `com.${packageName}.app`,
            validate: (value) => {
                if (!value) {
                    return "Identifier is required.";
                }
                if (/^[a-zA-Z0-9_.-]+$/.test(value)) {
                    return "Identifier can only contain letters, numbers, underscores, dots and dashes.";
                }
            },
        });
        if (isCancel(identifier)) {
            cancel("Operation cancelled.");
            process.exit(0);
        }
    } else {
        identifier = "";
    }
    return {
        gameType,
        UIFramework,
        narrativeLanguage,
        multidevice,
        identifier,
    };
}

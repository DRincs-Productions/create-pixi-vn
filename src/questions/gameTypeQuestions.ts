import inquirer from "inquirer";
import { cyan, gray, lightRed, red } from "kolorist";
import { GAME_TYPES } from "../constats";
import GameTypesEnum from "../enum/GameTypesEnum";
import NarrativeLanguagesEnum from "../enum/NarrativeLanguagesEnum";
import UIFrameworkEnum from "../enum/UIFrameworkEnum";

export default function gameTypeQuestions({ packageName }: { packageName: string }) {
    return inquirer.prompt<{
        gameType: GameTypesEnum;
        UIFramework: UIFrameworkEnum;
        narrativeLanguage: NarrativeLanguagesEnum;
        multidevice: boolean;
        identifier: string;
    }>([
        {
            type: "list",
            name: "gameType",
            message: "Select the type of game you want to create:",
            choices: GAME_TYPES.map((gameType) => ({
                name: gameType.name,
                value: gameType.type,
            })),
        },
        {
            type: "list",
            name: "UIFramework",
            message: "Select the UI framework you want to use:",
            choices: ({ gameType }) => {
                const selectedGameType = GAME_TYPES.find((f) => f.type === gameType);
                return selectedGameType?.availableUI.map((ui) => {
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
                        name,
                        value: ui,
                    };
                });
            },
        },
        {
            type: "list",
            name: "narrativeLanguage",
            message: "Select the narrative language you want to use:",
            choices: ({ gameType }) => {
                const selectedGameType = GAME_TYPES.find((f) => f.type === gameType);
                return selectedGameType?.availableNarrativeLanguages.map((lang) => {
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
                        name,
                        value: lang,
                    };
                });
            },
        },
        {
            type: "list",
            name: "multidevice",
            message: "Which devices is the project intended for?",
            choices: [
                {
                    name: "Web page",
                    value: false,
                },
                {
                    name: "Web page + Desktop + Mobile (Tauri)",
                    value: true,
                },
            ],
        },
        {
            type: "input",
            name: "identifier",
            message: "Project identifier:",
            default: `com.${packageName}.app`,
            required: true,
            when: ({ multidevice }) => multidevice,
        },
    ]);
}

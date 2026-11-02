import { cancel, isCancel, log, note, select, text } from "@clack/prompts";
import { cyan, gray, lightRed, red } from "kolorist";
import { GAME_TYPES } from "../constats";
import NarrativeLanguagesEnum from "../enum/NarrativeLanguagesEnum";
import UIFrameworkEnum from "../enum/UIFrameworkEnum";
import EngineEnum from "../enum/EngineEnum";

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
    if (availableUI.length === 1) {
        log.warning(
            `Only one UI framework available: ${availableUI[0].label}. Using it by default.`,
        );
        UIFramework = availableUI[0].value;
    } else if (availableUI.length > 0) {
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
    if (availableNarrativeLanguages.length === 1) {
        log.warning(
            `Only one narrative language available: ${availableNarrativeLanguages[0].label}. Using it by default.`,
        );
        narrativeLanguage = availableNarrativeLanguages[0].value;
    } else if (availableNarrativeLanguages.length > 0) {
        narrativeLanguage = await select({
            message: "Select the narrative language you want to use:",
            options: availableNarrativeLanguages,
            initialValue: GAME_TYPES.find((f) => f.type === gameType)
                ?.availableNarrativeLanguages[0],
        });
        if (isCancel(narrativeLanguage)) {
            cancel("Operation cancelled.");
            process.exit(0);
        }
    } else {
        narrativeLanguage = undefined;
    }
    const availableEngines = GAME_TYPES.find((f) => f.type === gameType)?.availableEngines ?? [];
    let engine: EngineEnum | undefined;
    let identifier: string | symbol = "";
    if (availableEngines.length > 0) {
        note(
            [
                "Roves (recommended) is an embedded Rust engine, but you do not need to install Rust or another framework to package desktop games. Use Packmaster, a portable packaging app, or automate packaging with GitHub Actions. Android and iOS packaging is also available; mobile support is newer and needs platform tooling.",
                "Docs: https://roves.pixi-vn.com/",
                "",
                "Tauri: creates a Rust subproject that you can customize. It requires Rust and native build tools: Microsoft C++ Build Tools and WebView2 on Windows, system packages such as WebKitGTK on Linux, and Xcode tools on macOS. Android and iOS need their platform SDKs; iOS development requires macOS and Xcode.",
                "Docs: https://v2.tauri.app/start/prerequisites/",
            ].join("\n"),
            "Choose your app engine",
        );
        const selectedEngine = await select({
            message: "Which app engine do you want to use?",
            options: [
                {
                    label: "Roves (recommended)",
                    value: EngineEnum.Roves,
                    hint: "Easy packaging with Packmaster or GitHub Actions",
                },
                {
                    label: "Tauri",
                    value: EngineEnum.Tauri,
                    hint: "Custom Rust backend; requires native build tools",
                },
            ],
            initialValue: EngineEnum.Roves,
        });
        if (isCancel(selectedEngine)) {
            cancel("Operation cancelled.");
            process.exit(0);
        }
        engine = selectedEngine;
        if (engine === EngineEnum.Tauri) {
            const selectedIdentifier = await text({
                message: "Project identifier:",
                initialValue: `com.${packageName}.app`,
                validate: (value) => {
                    if (!value) {
                        return "Identifier is required.";
                    }
                    if (!/^[a-zA-Z0-9_.\-]+$/.test(value)) {
                        return "Identifier can only contain letters, numbers, underscores, dots and dashes.";
                    }
                },
            });
            if (isCancel(selectedIdentifier)) {
                cancel("Operation cancelled.");
                process.exit(0);
            }
            identifier = selectedIdentifier;
        } else {
            identifier = "";
        }
    }
    return {
        gameType,
        UIFramework,
        narrativeLanguage,
        engine,
        identifier,
    };
}

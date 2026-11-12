import { cancel, isCancel, log, multiselect, note, select, text } from "@clack/prompts";
import { cyan, gray, lightRed, red } from "kolorist";
import { GAME_TYPES } from "../constats";
import NarrativeLanguagesEnum from "../enum/NarrativeLanguagesEnum";
import UIFrameworkEnum from "../enum/UIFrameworkEnum";
import EngineEnum from "../enum/EngineEnum";
import GameTypesEnum from "../enum/GameTypesEnum";
import PluginEnum from "../enum/PluginEnum";
import t from "../i18n";

export default async function gameTypeQuestions({ packageName }: { packageName: string }) {
    const gameType = await select({
        message: t("gameTypePrompt"),
        options: GAME_TYPES.map((gameType) => ({
            label: gameType.name,
            value: gameType.type,
            hint: gameType.hint,
        })),
        initialValue: GAME_TYPES[0].type,
    });
    if (isCancel(gameType)) {
        cancel(t("operationCancelled"));
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
        log.warning(t("onlyUI", { name: availableUI[0].label }));
        UIFramework = availableUI[0].value;
    } else if (availableUI.length > 0) {
        UIFramework = await select({
            message: t("uiPrompt"),
            options: availableUI,
            initialValue: GAME_TYPES.find((f) => f.type === gameType)?.availableUI[0],
        });
        if (isCancel(UIFramework)) {
            cancel(t("operationCancelled"));
            process.exit(0);
        }
    } else {
        UIFramework = undefined;
    }
    const availableNarrativeLanguages =
        GAME_TYPES.find((f) => f.type === gameType)?.availableNarrativeLanguages.map((lang) => {
            let name = "";
            let hint: string | undefined;
            switch (lang) {
                case NarrativeLanguagesEnum.Ink:
                    name = t("inkLanguage");
                    hint = t("inkHint");
                    break;
                case NarrativeLanguagesEnum.Renpy:
                    name = lightRed("Renpy");
                    break;
                case NarrativeLanguagesEnum.Typescript:
                    name = cyan(t("typescriptLanguage"));
                    hint = t("typescriptHint");
                    break;
            }
            return {
                label: name,
                value: lang,
                hint,
            };
        }) || [];
    let narrativeLanguage;
    if (availableNarrativeLanguages.length === 1) {
        log.warning(t("onlyNarrative", { name: availableNarrativeLanguages[0].label }));
        narrativeLanguage = availableNarrativeLanguages[0].value;
    } else if (availableNarrativeLanguages.length > 0) {
        narrativeLanguage = await select({
            message: t("narrativePrompt"),
            options: availableNarrativeLanguages,
            initialValue: GAME_TYPES.find((f) => f.type === gameType)
                ?.availableNarrativeLanguages[0],
        });
        if (isCancel(narrativeLanguage)) {
            cancel(t("operationCancelled"));
            process.exit(0);
        }
    } else {
        narrativeLanguage = undefined;
    }
    const availableEngines = GAME_TYPES.find((f) => f.type === gameType)?.availableEngines ?? [];
    let engine: EngineEnum | undefined;
    let identifier: string | symbol = "";
    if (availableEngines.length > 0) {
        note(t("engineOverview"), t("engineNoteTitle"));
        const selectedEngine = await select({
            message: t("enginePrompt"),
            options: [
                {
                    label: t("roves"),
                    value: EngineEnum.Roves,
                    hint: t("rovesHint"),
                },
                {
                    label: t("tauri"),
                    value: EngineEnum.Tauri,
                    hint: t("tauriHint"),
                },
            ],
            initialValue: EngineEnum.Roves,
        });
        if (isCancel(selectedEngine)) {
            cancel(t("operationCancelled"));
            process.exit(0);
        }
        engine = selectedEngine;
        if (engine === EngineEnum.Tauri) {
            const selectedIdentifier = await text({
                message: t("projectIdentifier"),
                initialValue: `com.${packageName}.app`,
                validate: (value) => {
                    if (!value) {
                        return t("identifierRequired");
                    }
                    if (!/^[a-zA-Z0-9_.\-]+$/.test(value)) {
                        return t("identifierInvalid");
                    }
                },
            });
            if (isCancel(selectedIdentifier)) {
                cancel(t("operationCancelled"));
                process.exit(0);
            }
            identifier = selectedIdentifier;
        } else {
            identifier = "";
        }
    }
    let plugins: PluginEnum[] = [];
    if (gameType === GameTypesEnum.VisualNovel || gameType === GameTypesEnum.PointAndClick) {
        const selectedPlugins = await multiselect({
            message: t("pluginsPrompt"),
            options: [
                {
                    label: t("pluginLive2D"),
                    value: PluginEnum.Live2D,
                    hint: t("pluginLive2DHint"),
                },
                {
                    label: t("pluginSpine2D"),
                    value: PluginEnum.Spine2D,
                    hint: t("pluginSpine2DHint"),
                },
            ],
            required: false,
        });
        if (isCancel(selectedPlugins)) {
            cancel(t("operationCancelled"));
            process.exit(0);
        }
        plugins = selectedPlugins;
    }
    return {
        plugins,
        gameType,
        UIFramework,
        narrativeLanguage,
        engine,
        identifier,
    };
}

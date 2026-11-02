import GameTypesEnum from "./enum/GameTypesEnum";
import NarrativeLanguagesEnum from "./enum/NarrativeLanguagesEnum";
import UIFrameworkEnum from "./enum/UIFrameworkEnum";
import EngineEnum from "./enum/EngineEnum";
import GameTypes from "./types/GameTypes";
import t from "./i18n";

export const DEFAULT_PROJECT_NAME = "My Game";
export const DEFAULT_PACKAGE_NAME = "my-game";
export const GAME_TYPES: GameTypes[] = [
    {
        type: GameTypesEnum.VisualNovel,
        name: t("gameVisualNovel"),
        hint: t("visualNovelHint"),
        availableUI: [UIFrameworkEnum.React],
        availableNarrativeLanguages: [
            NarrativeLanguagesEnum.Ink,
            NarrativeLanguagesEnum.Typescript,
        ],
        availableEngines: [EngineEnum.Roves, EngineEnum.Tauri],
        canReplaceUI: true,
    },
    {
        type: GameTypesEnum.PointAndClick,
        name: t("gamePointAndClick"),
        hint: t("pointAndClickHint"),
        availableUI: [UIFrameworkEnum.React],
        availableNarrativeLanguages: [
            NarrativeLanguagesEnum.Ink,
            NarrativeLanguagesEnum.Typescript,
        ],
        availableEngines: [EngineEnum.Roves, EngineEnum.Tauri],
        canReplaceUI: true,
    },
    {
        type: GameTypesEnum.InteractiveFiction,
        name: t("gameInteractiveFiction"),
        hint: t("interactiveFictionHint"),
        availableUI: [UIFrameworkEnum.React],
        availableNarrativeLanguages: [
            NarrativeLanguagesEnum.Ink,
            NarrativeLanguagesEnum.Typescript,
        ],
        availableEngines: [EngineEnum.Roves, EngineEnum.Tauri],
        canReplaceUI: true,
    },
    {
        type: GameTypesEnum.GameEngine,
        name: t("gameEngine"),
        hint: t("gameEngineHint"),
        availableUI: [],
        availableNarrativeLanguages: [],
        availableEngines: [],
        canReplaceUI: false,
    },
    {
        type: GameTypesEnum.Library,
        name: t("gameLibrary"),
        hint: t("libraryHint"),
        availableUI: [],
        availableNarrativeLanguages: [],
        availableEngines: [],
        canReplaceUI: false,
    },
];

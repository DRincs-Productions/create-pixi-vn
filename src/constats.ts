import GameTypesEnum from "./enum/GameTypesEnum";
import NarrativeLanguagesEnum from "./enum/NarrativeLanguagesEnum";
import UIFrameworkEnum from "./enum/UIFrameworkEnum";
import EngineEnum from "./enum/EngineEnum";
import GameTypes from "./types/GameTypes";

export const DEFAULT_PROJECT_NAME = "My Game";
export const DEFAULT_PACKAGE_NAME = "my-game";
export const GAME_TYPES: GameTypes[] = [
    {
        type: GameTypesEnum.VisualNovel,
        name: "Visual Novel",
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
        name: "Point & Click Adventure",
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
        name: "Interactive Fiction",
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
        name: "Game Engine",
        availableUI: [],
        availableNarrativeLanguages: [],
        availableEngines: [],
        canReplaceUI: false,
    },
    {
        type: GameTypesEnum.Library,
        name: "Library",
        availableUI: [],
        availableNarrativeLanguages: [],
        availableEngines: [],
        canReplaceUI: false,
    },
];

import GameTypesEnum from "./enum/GameTypesEnum";
import NarrativeLanguagesEnum from "./enum/NarrativeLanguagesEnum";
import UIFrameworkEnum from "./enum/UIFrameworkEnum";
import GameTypes from "./types/GameTypes";

export const DEFAULT_PROJECT_NAME = "My Game";
export const DEFAULT_PACKAGE_NAME = "my-game";
export const GAME_TYPES: GameTypes[] = [
    {
        type: GameTypesEnum.VisualNovel,
        name: "Visual Novel",
        availableUI: [UIFrameworkEnum.React],
        availableNarrativeLanguages: [NarrativeLanguagesEnum.Ink, NarrativeLanguagesEnum.Typescript],
    },
    {
        type: GameTypesEnum.TextStory,
        name: "Text-based Story",
        availableUI: [UIFrameworkEnum.React],
        availableNarrativeLanguages: [NarrativeLanguagesEnum.Ink, NarrativeLanguagesEnum.Typescript],
    },
    {
        type: GameTypesEnum.GameEngine,
        name: "Game Engine",
        availableUI: [],
        availableNarrativeLanguages: [],
    },
];

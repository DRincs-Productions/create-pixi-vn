import GameTypesEnum from "./enum/GameTypesEnum"
import NarrativeLanguagesEnum from "./enum/NarrativeLanguagesEnum"
import UIFrameworkEnum from "./enum/UIFrameworkEnum"
import GameTypes from "./types/GameTypes"

export const DEFAULT_TARGET_DIR = "my-game"
export const GAME_TYPES: GameTypes[] = [
    {
        type: GameTypesEnum.VisualNovel,
        name: "Visual Novel",
        availableUI: [UIFrameworkEnum.React],
        availableNarrativeLanguages: [NarrativeLanguagesEnum.Typescript]
    }
]

import GameTypesEnum from "../enum/GameTypesEnum";
import NarrativeLanguagesEnum from "../enum/NarrativeLanguagesEnum";
import UIFrameworkEnum from "../enum/UIFrameworkEnum";
import EngineEnum from "../enum/EngineEnum";

type GameTypes = {
    type: GameTypesEnum;
    name: string;
    hint: string;
    availableUI: UIFrameworkEnum[];
    availableNarrativeLanguages: NarrativeLanguagesEnum[];
    availableEngines: EngineEnum[];
    canReplaceUI: boolean;
};
export default GameTypes;

import GameTypesEnum from "../enum/GameTypesEnum";
import NarrativeLanguagesEnum from "../enum/NarrativeLanguagesEnum";
import UIFrameworkEnum from "../enum/UIFrameworkEnum";

type GameTypes = {
    type: GameTypesEnum;
    name: string;
    availableUI: UIFrameworkEnum[];
    availableNarrativeLanguages: NarrativeLanguagesEnum[];
    isMultidevice: boolean;
};
export default GameTypes;

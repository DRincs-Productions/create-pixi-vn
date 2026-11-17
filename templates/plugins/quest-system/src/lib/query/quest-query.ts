import { INTERFACE_DATA_USE_QUERY_KEY } from "@/constants";
import { Memo } from "@/lib/stores/memo-store";
import { getPixiJSAsset } from "@/lib/utils/assets-utility";
import { type QuestInterface, questsNotebook } from "@drincs/nqtr";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";

function getQuestInfo(quest: QuestInterface) {
    const stage = quest.currentStage as typeof quest.currentStage & {
        description?: string;
        requestDescriptionToStart?: string;
    };
    let currentStageDescription = "";
    if (quest.currentStage) {
        if (quest.completed) {
            if (quest.inDevelopment) {
                currentStageDescription = "quest_is_in_development";
            } else {
                currentStageDescription = "completed";
            }
        } else if (!quest.currentStage.started && stage?.requestDescriptionToStart) {
            currentStageDescription = stage?.requestDescriptionToStart;
        } else if (stage?.description) {
            currentStageDescription = stage?.description;
        }
    }

    return {
        id: quest.id,
        name: quest.name,
        description: quest.description,
        currentStage: {
            description: currentStageDescription,
        },
        questImage: quest.image,
        completed: quest.completed,
        isInDevelopment: quest.inDevelopment,
    };
}

const QUESTS_USE_QUERY_KEY = "quests_use_query_key";
export function useQueryQuests() {
    return useQuery({
        queryKey: [INTERFACE_DATA_USE_QUERY_KEY, QUESTS_USE_QUERY_KEY],
        queryFn: async () => {
            const inProgressQuests = questsNotebook.inProgressQuests.map(getQuestInfo);
            const completedQuests = questsNotebook.completedQuests.map(getQuestInfo);
            const failedQuests = questsNotebook.failedQuests.map(getQuestInfo);
            return {
                inProgressQuests,
                completedQuests,
                failedQuests,
            };
        },
        placeholderData: keepPreviousData,
    });
}

export const SELECTED_QUEST_USE_QUERY_KEY = "selected_quest_use_query_key";
export function useQuerySelectedQuest() {
    const selectedQuestId = useSelector(Memo.store, (state) => state.selectedQuestId);
    return useQuery({
        queryKey: [INTERFACE_DATA_USE_QUERY_KEY, SELECTED_QUEST_USE_QUERY_KEY, selectedQuestId],
        queryFn: async () => {
            const selectedQuest = selectedQuestId
                ? questsNotebook.find(selectedQuestId)
                : undefined;
            if (!selectedQuest) return null;
            const info = getQuestInfo(selectedQuest);
            return {
                ...info,
                questImageUrl: info.questImage ? getPixiJSAsset(info.questImage) : undefined,
            };
        },
        placeholderData: keepPreviousData,
    });
}

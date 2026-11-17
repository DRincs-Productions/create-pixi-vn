import { storage } from "@drincs/pixi-vn";
import { Store } from "@tanstack/store";

const SELECTED_QUEST_KEY = "selectedQuestId";

export namespace Memo {
    export const store = new Store<{ open: boolean; selectedQuestId: string | undefined }>({
        open: false,
        selectedQuestId: storage.get<string>(SELECTED_QUEST_KEY),
    });

    export function toggleOpen() {
        store.setState((state) => ({ ...state, open: !state.open }));
    }

    export function setOpen(value: boolean) {
        store.setState((state) => ({ ...state, open: value }));
    }

    export function setSelectedQuestId(id: string | undefined) {
        storage.set(SELECTED_QUEST_KEY, id);
        store.setState((state) => ({ ...state, selectedQuestId: id }));
    }
}

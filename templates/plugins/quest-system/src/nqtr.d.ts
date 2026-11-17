import "@drincs/nqtr";

declare module "@drincs/nqtr" {
    interface QuestInterface {
        /**
         * The name of the quest.
         */
        readonly name: string;
        /**
         * The description of the quest.
         */
        readonly description: string;
        /**
         * The image of the quest.
         */
        readonly image?: string;
        /**
         * If the quest is in development.
         */
        readonly inDevelopment: boolean;
    }
}

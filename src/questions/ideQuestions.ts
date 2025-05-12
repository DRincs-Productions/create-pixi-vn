import { cancel, isCancel, select } from "@clack/prompts";
import IDEEnum from "../enum/IDEEnum";

export default async function ideQuestions() {
    const ide = await select({
        message: "Which IDE do you want to use?",
        options: [
            { value: IDEEnum.VisualStudioCode, label: "Visual Studio Code" },
            { value: IDEEnum.Cursor, label: "Cursor" },
            { value: IDEEnum.VSCodium, label: "VSCodium" },
            { value: IDEEnum.Other, label: "Other" },
        ],
        initialValue: IDEEnum.VisualStudioCode,
    });
    if (isCancel(ide)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }
    return {
        ide,
    };
}

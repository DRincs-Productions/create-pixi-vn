import { cancel, isCancel, select, tasks } from "@clack/prompts";
import { execa } from "execa";
import which from "which";
import IDEEnum from "../enum/IDEEnum";
import t from "../i18n";

export default async function selectIDE({
    rootFolder,
    fileToOpen,
}: {
    rootFolder: string;
    fileToOpen?: string;
}) {
    const ide = await select({
        message: t("idePrompt"),
        options: [
            { value: IDEEnum.VisualStudioCode, label: t("vsCode") },
            { value: IDEEnum.Cursor, label: t("cursor") },
            { value: IDEEnum.VSCodium, label: t("vscodium") },
            { value: IDEEnum.Other, label: t("other") },
        ],
        initialValue: IDEEnum.VisualStudioCode,
    });
    if (isCancel(ide)) {
        cancel(t("operationCancelled"));
        process.exit(0);
    }

    if (ide === undefined) {
        return;
    }
    let command;
    let message;
    switch (ide) {
        case "vscode":
            message = `Opening in ${t("vsCode")}...`;
            command = "code";
            break;
        case "cursor":
            message = `Opening in ${t("cursor")}...`;
            command = "cursor";
            break;
        case "codium":
            message = `Opening in ${t("vscodium")}...`;
            command = "codium";
            break;
        default:
            return;
    }
    await tasks([
        {
            title: message,
            task: async (message) => {
                try {
                    await which(command);
                    const openProject = await execa(command, [rootFolder]);
                    message(openProject.stdout); // Log the output of opening the project
                    if (fileToOpen) {
                        const openFile = await execa(command, [`${rootFolder}/${fileToOpen}`]);
                        message(openFile.stdout); // Log the output of opening the specific file
                    }
                    return t("openedIDE", { name: String(ide) });
                } catch (error) {
                    return t("openIDEError", { name: String(ide) });
                }
            },
        },
    ]);
}

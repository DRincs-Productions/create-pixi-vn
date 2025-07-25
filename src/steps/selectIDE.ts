import { cancel, isCancel, select, tasks } from "@clack/prompts";
import { execa } from "execa";
import which from "which";
import IDEEnum from "../enum/IDEEnum";

export default async function selectIDE({ rootFolder, fileToOpen }: { rootFolder: string; fileToOpen?: string }) {
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

    if (ide === undefined) {
        return;
    }
    let command;
    let message;
    switch (ide) {
        case "vscode":
            message = "Opening in Visual Studio Code...";
            command = "code";
            break;
        case "cursor":
            message = "Opening in Cursor...";
            command = "cursor";
            break;
        case "codium":
            message = "Opening in VSCodium...";
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
                    const openReadme = await execa(command, [`${rootFolder}/README.md`]);
                    message(openReadme.stdout); // Log the output of opening README.md
                    if (fileToOpen) {
                        const openFile = await execa(command, [`${rootFolder}/${fileToOpen}`]);
                        message(openFile.stdout); // Log the output of opening the specific file
                    }
                    return `Opened project using ${ide}`;
                } catch (error) {
                    return `Could not open project using ${ide}, since ${ide} was not in your PATH`;
                }
            },
        },
    ]);
}

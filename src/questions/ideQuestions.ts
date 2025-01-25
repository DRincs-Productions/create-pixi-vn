import inquirer from "inquirer";
import IDEEnum from "../enum/IDEEnum";

export default function ideQuestions() {
    return inquirer.prompt<{
        ide: IDEEnum;
    }>([
        {
            type: "list",
            name: "ide",
            message: "Which IDE do you want to use?",
            choices: [
                { name: "Visual Studio Code", value: IDEEnum.VisualStudioCode },
                { name: "Cursor", value: IDEEnum.Cursor },
                { name: "VSCodium", value: IDEEnum.VSCodium },
                { name: "Other", value: IDEEnum.Other },
            ],
            default: IDEEnum.VisualStudioCode,
        },
    ]);
}

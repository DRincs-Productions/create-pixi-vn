import inquirer from 'inquirer'

export default function gitQuestions() {
    return inquirer.prompt<{
        initGit: boolean
    }>(
        [
            {
                type: "list",
                name: "initGit",
                message: "Do you want to initialize a git repository? (recommended)",
                default: true,
                choices: [
                    {
                        name: "Yes",
                        value: true,
                        description: "You can use GitHub to track changes and collaborate with others.",
                    },
                    {
                        name: "No",
                        value: false,
                        description: "It is not recommended to skip this step.",
                    },
                ],
            }
        ]
    )
}

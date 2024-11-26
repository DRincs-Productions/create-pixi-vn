import inquirer from 'inquirer'
import { red } from 'kolorist'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_PACKAGE_NAME, DEFAULT_PROJECT_NAME } from '../constats'
import YesNoCancelEnum from '../enum/YesNoCancelEnum'
import { formatTargetDir, isEmptyDir } from '../utilities/dir-utility'
import { isValidPackageName, toValidPackageName } from '../utilities/package-utility'

export default async function projectInfoQuestions({ argTargetDir, targetDir }: {
    argTargetDir: string | undefined,
    targetDir: string
}) {
    const getProjectName = () =>
        targetDir === '.' ? path.basename(path.resolve()) : targetDir

    let res = await inquirer.prompt<{
        projectName: string
        description: string
        overwrite: YesNoCancelEnum
        packageName: string
    }>(
        [
            {
                type: "input",
                name: "projectName",
                message: "Project name:",
                default: DEFAULT_PROJECT_NAME,
                required: true,
                transformer: (value) => formatTargetDir(value) || DEFAULT_PROJECT_NAME,
                when: () => !argTargetDir,
                validate: (dir) => {
                    if (!dir) {
                        return "Project name cannot be empty"
                    }
                    return true
                }
            },
            {
                type: "input",
                name: "description",
                message: "Project description:",
                default: "A new game project",
            },
            {
                type: "input",
                name: "packageName",
                message: "Package name:",
                default: () => toValidPackageName(getProjectName()),
                validate: (dir) => isValidPackageName(dir) || "Invalid package name. The name can only include URL-friendly characters.",
            },
            {
                type: "list",
                name: "overwrite",
                message: "Overwrite existing files?",
                default: "yes",
                choices: [
                    {
                        description: "Remove existing files and continue",
                        name: "Yes",
                        value: YesNoCancelEnum.Yes,
                    },
                    {
                        description: "Ignore files and continue",
                        name: "Ignore",
                        value: YesNoCancelEnum.No,
                    },
                    {
                        description: "Cancel operation",
                        name: "Cancel",
                        value: YesNoCancelEnum.Cancel,
                    },
                ],
                when: ({ packageName = DEFAULT_PACKAGE_NAME }) => fs.existsSync(packageName) && !isEmptyDir(packageName),
            },
        ]
    )

    if (res.overwrite === YesNoCancelEnum.Cancel) {
        throw new Error(red("✖") + " Operation cancelled")
    }

    return res
}

import inquirer from 'inquirer'
import { red } from 'kolorist'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_TARGET_DIR } from '../constats'
import YesNoCancelEnum from '../enum/YesNoCancelEnum'
import { formatTargetDir, isEmptyDir } from '../utilities/dir-utility'
import { isValidPackageName, toValidPackageName } from '../utilities/package-utility'

export default function projectInfoQuestions({ argTargetDir, targetDir }: {
    argTargetDir: string | undefined,
    targetDir: string
}) {
    const getProjectName = () =>
        targetDir === '.' ? path.basename(path.resolve()) : targetDir

    return inquirer.prompt<{
        projectName: string
        description: string
        overwrite: YesNoCancelEnum
        overwriteChecker: string
        packageName: string
    }>(
        [
            {
                type: "input",
                name: "projectName",
                message: "Project name:",
                default: DEFAULT_TARGET_DIR,
                required: true,
                transformer: (value) => formatTargetDir(value) || DEFAULT_TARGET_DIR,
                when: () => !argTargetDir,
                validate: (dir) => {
                    if (!dir) {
                        return "Project name cannot be empty"
                    }
                    return true
                }
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
                        description: "Cancel operation",
                        name: "No",
                        value: YesNoCancelEnum.No,
                    },
                    {
                        description: "Ignore files and continue",
                        name: "Ignore",
                        value: YesNoCancelEnum.Cancel,
                    },
                ],
                when: ({ projectName = DEFAULT_TARGET_DIR }) => fs.existsSync(projectName) && !isEmptyDir(projectName),
            },
            {
                type: "input",
                name: "overwriteChecker",
                message: "Type \"yes\" to continue:",
                when: ({ overwrite }) => {
                    if (overwrite === YesNoCancelEnum.Cancel) {
                        throw new Error(red("✖") + " Operation cancelled")
                    }
                    return false
                }
            },
            {
                type: "input",
                name: "packageName",
                message: "Package name:",
                default: () => toValidPackageName(getProjectName()),
                validate: (dir) => isValidPackageName(dir) || "Invalid package name. The name can only include URL-friendly characters.",
            },
            {
                type: "input",
                name: "description",
                message: "Project description:",
                default: "A new game project",
            },
        ]
    )
}

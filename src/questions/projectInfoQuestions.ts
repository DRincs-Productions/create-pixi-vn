import { cancel, isCancel, select, text } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PROJECT_NAME } from "../constats";
import YesNoCancelEnum from "../enum/YesNoCancelEnum";
import { isEmptyDir } from "../utils/dir-utility";
import { isValidPackageName, toValidPackageName } from "../utils/package-utility";

export default async function projectInfoQuestions({
    argTargetDir,
    targetDir,
}: {
    argTargetDir: string | undefined;
    targetDir: string;
}) {
    const getProjectName = () => (targetDir === "." ? path.basename(path.resolve()) : targetDir);
    let projectName;
    if (!argTargetDir) {
        projectName = await text({
            message: "Project name:",
            defaultValue: DEFAULT_PROJECT_NAME,
            placeholder: DEFAULT_PROJECT_NAME,
            validate: (dir) => {
                if (!dir) {
                    return "Project name cannot be empty";
                }
            },
        });
        if (isCancel(projectName)) {
            cancel("Operation cancelled.");
            process.exit(0);
        }
    } else {
        projectName = DEFAULT_PROJECT_NAME;
    }
    const description = await text({
        message: "Project description:",
        defaultValue: "A new game project",
        placeholder: "A new game project",
        validate: (dir) => {
            if (!dir) {
                return "Project description cannot be empty";
            }
        },
    });
    if (isCancel(description)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }
    const packageName = await text({
        message: "Package name:",
        defaultValue: toValidPackageName(getProjectName()),
        placeholder: toValidPackageName(getProjectName()),
        validate: (dir) => {
            if (!dir) {
                return "Package name cannot be empty";
            }
            if (!isValidPackageName(dir)) {
                return "Invalid package name. The name can only include URL-friendly characters.";
            }
        },
    });
    if (isCancel(packageName)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }
    let overwrite;
    if (fs.existsSync(packageName) && !isEmptyDir(packageName)) {
        overwrite = await select({
            message: "Overwrite existing files?",
            options: [
                {
                    hint: "Remove existing files and continue",
                    label: "Yes",
                    value: YesNoCancelEnum.Yes,
                },
                {
                    hint: "Keep existing files and continue",
                    label: "Ignore",
                    value: YesNoCancelEnum.No,
                },
                {
                    hint: "Cancel operation",
                    label: "Cancel",
                    value: YesNoCancelEnum.Cancel,
                },
            ],
            initialValue: YesNoCancelEnum.No,
        });
        if (isCancel(overwrite) || overwrite === YesNoCancelEnum.Cancel) {
            cancel("Operation cancelled.");
            process.exit(0);
        }
    } else {
        overwrite = undefined;
    }
    return {
        projectName,
        description,
        packageName,
        overwrite,
    };
}

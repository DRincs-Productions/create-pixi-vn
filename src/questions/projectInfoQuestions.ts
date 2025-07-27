import { cancel, isCancel, select, text } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PACKAGE_NAME, DEFAULT_PROJECT_NAME } from "../constats";
import OverwriteEnum from "../enum/OverwriteEnum";
import { isEmptyDir } from "../utils/dir-utility";
import { isValidPackageName, toValidPackageName } from "../utils/package-utility";

export default async function projectInfoQuestions() {
    const projectName = await text({
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
        defaultValue: toValidPackageName(DEFAULT_PACKAGE_NAME),
        placeholder: toValidPackageName(DEFAULT_PACKAGE_NAME),
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
    const currentDirectory = path.basename(path.resolve());
    const foltderName = await text({
        message: "Target directory:",
        defaultValue: packageName,
        placeholder: `${packageName} (If is equal to ".", the current directory (${currentDirectory}) will be used)`,
    });
    if (isCancel(foltderName)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }
    let overwrite;
    if (fs.existsSync(foltderName) && !isEmptyDir(foltderName)) {
        overwrite = await select({
            message: "Overwrite existing files?",
            options: [
                {
                    hint: "Delete all existing files and create a new project",
                    label: "Delete all",
                    value: OverwriteEnum.Delete,
                },
                {
                    hint: "Overwrite existing conflicting files",
                    label: "Overwrite",
                    value: OverwriteEnum.Overwrite,
                },
                {
                    hint: "Skip existing conflicting files",
                    label: "Skip",
                    value: OverwriteEnum.Skip,
                },
                {
                    hint: "Ask for each file",
                    label: "Ask",
                    value: OverwriteEnum.Ask,
                },
                {
                    hint: "Cancel operation",
                    label: "Cancel",
                    value: OverwriteEnum.Cancel,
                },
            ],
            initialValue: OverwriteEnum.Overwrite,
        });
        if (isCancel(overwrite) || overwrite === OverwriteEnum.Cancel) {
            cancel("Operation cancelled.");
            process.exit(0);
        }
    } else {
        overwrite = undefined;
    }
    return {
        projectName,
        foltderName,
        description,
        packageName,
        overwrite,
    };
}

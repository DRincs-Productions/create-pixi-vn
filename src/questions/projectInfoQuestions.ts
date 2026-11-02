import { cancel, isCancel, select, text } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PACKAGE_NAME, DEFAULT_PROJECT_NAME } from "../constats";
import OverwriteEnum from "../enum/OverwriteEnum";
import { isEmptyDir } from "../utils/dir-utility";
import { isValidPackageName, toValidPackageName } from "../utils/package-utility";
import t from "../i18n";

export default async function projectInfoQuestions() {
    const projectName = await text({
        message: t("projectName"),
        defaultValue: DEFAULT_PROJECT_NAME,
        placeholder: DEFAULT_PROJECT_NAME,
        validate: (dir) => {
            if (!dir) {
                return t("projectNameRequired");
            }
        },
    });
    if (isCancel(projectName)) {
        cancel(t("operationCancelled"));
        process.exit(0);
    }
    const description = await text({
        message: t("projectDescription"),
        defaultValue: "A new game project",
        placeholder: "A new game project",
    });
    if (isCancel(description)) {
        cancel(t("operationCancelled"));
        process.exit(0);
    }
    const packageName = await text({
        message: t("packageName"),
        defaultValue: toValidPackageName(projectName),
        placeholder: toValidPackageName(projectName),
        validate: (dir) => {
            if (dir && !isValidPackageName(dir)) {
                return t("packageNameInvalid");
            }
        },
    });
    if (isCancel(packageName)) {
        cancel(t("operationCancelled"));
        process.exit(0);
    }
    const currentDirectory = path.basename(path.resolve());
    const foltderName = await text({
        message: t("targetDirectory"),
        defaultValue: packageName,
        placeholder: `${packageName} (${t("targetDirectoryHint", { name: currentDirectory })})`,
    });
    if (isCancel(foltderName)) {
        cancel(t("operationCancelled"));
        process.exit(0);
    }
    let overwrite;
    if (fs.existsSync(foltderName) && !isEmptyDir(foltderName)) {
        overwrite = await select({
            message: t("overwritePrompt"),
            options: [
                {
                    hint: t("deleteAllHint"),
                    label: t("deleteAll"),
                    value: OverwriteEnum.Delete,
                },
                {
                    hint: t("overwriteHint"),
                    label: t("overwrite"),
                    value: OverwriteEnum.Overwrite,
                },
                {
                    hint: t("skipHint"),
                    label: t("skip"),
                    value: OverwriteEnum.Skip,
                },
                {
                    hint: t("askHint"),
                    label: t("ask"),
                    value: OverwriteEnum.Ask,
                },
                {
                    hint: t("cancelHint"),
                    label: t("cancel"),
                    value: OverwriteEnum.Cancel,
                },
            ],
            initialValue: OverwriteEnum.Overwrite,
        });
        if (isCancel(overwrite) || overwrite === OverwriteEnum.Cancel) {
            cancel(t("operationCancelled"));
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

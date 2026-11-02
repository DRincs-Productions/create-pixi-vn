import { cancel, isCancel, log, select } from "@clack/prompts";
import { execa } from "execa";
import fs from "node:fs";
import path from "node:path";
import t from "../i18n";

function getErrorReason(error: unknown): string {
    if (typeof error === "object" && error !== null && "stderr" in error) {
        const stderr = error.stderr;
        if (typeof stderr === "string" && stderr.trim()) {
            return (
                stderr
                    .split(/\r?\n/)
                    .find((line) => line.trim())
                    ?.trim() ?? stderr.trim()
            );
        }
    }
    return error instanceof Error ? error.message : String(error);
}

export default async function gitInit({ rootFolder }: { rootFolder: string }) {
    // Check if exist in rootFolder a .git folder
    const gitFolder = path.join(rootFolder, ".git");
    try {
        if (fs.existsSync(gitFolder)) {
            log.warn(t("gitAlreadyExists"));
            return;
        }
    } catch (error) {
        log.error(t("gitCheckError", { error: String(error) }));
        return;
    }

    const initGit = await select({
        message: t("gitPrompt"),
        options: [
            {
                value: true,
                label: t("yes"),
                hint: t("gitYesHint"),
            },
            { value: false, label: t("no"), hint: t("gitNoHint") },
        ],
        initialValue: true,
    });
    if (isCancel(initGit)) {
        cancel(t("operationCancelled"));
        process.exit(0);
    }
    if (initGit) {
        log.step(t("gitInitializing"));
        try {
            await execa("git", ["init", "-b", "main"], { cwd: rootFolder });
            await execa("git", ["add", "."], { cwd: rootFolder });
        } catch (error) {
            log.warn(t("gitInitFailed", { reason: getErrorReason(error) }));
            return;
        }

        log.success(t("gitInitialized"));
        try {
            await execa("git", ["commit", "-m", "Initial commit"], { cwd: rootFolder });
        } catch (error) {
            log.warn(t("gitCommitFailed", { reason: getErrorReason(error) }));
        }

        log.message(t("gitUpload"));
    }
}

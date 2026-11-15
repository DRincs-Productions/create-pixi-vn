import { cancel, isCancel, log, select, tasks } from "@clack/prompts";
import { execa } from "execa";
import which from "which";
import IDEEnum from "../enum/IDEEnum";
import t from "../i18n";

type EditorTarget = { kind: "editor"; label: string; command: string };
/** Desktop app opened through its URL scheme with the project folder. */
type DeepLinkTarget = { kind: "deep-link"; label: string; url: (folder: string) => string };
/** Terminal app started in the current terminal once the setup is done. */
type TerminalTarget = { kind: "terminal"; label: string; command: string };
type OpenTarget = EditorTarget | DeepLinkTarget | TerminalTarget;

/** Built on demand so labels use the language chosen at runtime. */
const getTargets = (): Partial<Record<IDEEnum, OpenTarget>> => ({
    [IDEEnum.VisualStudioCode]: { kind: "editor", label: t("vsCode"), command: "code" },
    [IDEEnum.Cursor]: { kind: "editor", label: t("cursor"), command: "cursor" },
    [IDEEnum.VSCodium]: { kind: "editor", label: t("vscodium"), command: "codium" },
    // ChatGPT desktop app (Codex): same link used by `codex app <path>`.
    [IDEEnum.ChatGPT]: {
        kind: "deep-link",
        label: t("chatgpt"),
        url: (folder) => `codex://threads/new?path=${encodeURIComponent(folder)}`,
    },
    // Claude desktop app: opens a new Claude Code session in the folder.
    [IDEEnum.Claude]: {
        kind: "deep-link",
        label: t("claude"),
        url: (folder) => `claude://code/new?folder=${encodeURIComponent(folder)}`,
    },
    // OpenCode: its desktop app cannot open a folder from outside yet, so start the CLI.
    [IDEEnum.OpenCode]: { kind: "terminal", label: t("opencode"), command: "opencode" },
});

/** Environment for child apps: Electron apps quit at once if they inherit ELECTRON_RUN_AS_NODE. */
function appEnv() {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    return env;
}

/** Opens a URL with the app registered for its scheme. Fails when no app handles it. */
async function openUrl(url: string) {
    const env = appEnv();
    switch (process.platform) {
        case "win32":
            env.PIXIVN_OPEN_URL = url;
            await execa(
                "powershell.exe",
                ["-NoProfile", "-NonInteractive", "-Command", "Start-Process -FilePath $env:PIXIVN_OPEN_URL"],
                { env, extendEnv: false },
            );
            return;
        case "darwin":
            await execa("open", [url], { env, extendEnv: false });
            return;
        default:
            await execa("xdg-open", [url], { env, extendEnv: false });
    }
}

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
            { value: IDEEnum.ChatGPT, label: t("chatgpt") },
            { value: IDEEnum.Claude, label: t("claude") },
            { value: IDEEnum.OpenCode, label: t("opencode"), hint: t("opencodeHint") },
            { value: IDEEnum.Other, label: t("other") },
        ],
        initialValue: IDEEnum.VisualStudioCode,
    });
    if (isCancel(ide)) {
        cancel(t("operationCancelled"));
        process.exit(0);
    }
    if (ide === undefined) return;

    await openProjectWith(ide, { rootFolder, fileToOpen });
}

/** Opens the project with the chosen editor or app. */
export async function openProjectWith(
    ide: IDEEnum,
    { rootFolder, fileToOpen }: { rootFolder: string; fileToOpen?: string },
) {
    const target = getTargets()[ide];
    if (!target) return;

    if (target.kind === "terminal") {
        try {
            await which(target.command);
        } catch {
            log.error(t("openIDEError", { name: target.label }));
            return;
        }
        log.step(t("openingIn", { name: target.label }));
        try {
            await execa(target.command, [rootFolder], {
                cwd: rootFolder,
                stdio: "inherit",
                env: appEnv(),
                extendEnv: false,
            });
        } catch {
            // Closing the terminal app is not an error for the setup.
        }
        return;
    }

    await tasks([
        {
            title: t("openingIn", { name: target.label }),
            task: async (message) => {
                if (target.kind === "deep-link") {
                    try {
                        await openUrl(target.url(rootFolder));
                        return t("openedIDE", { name: target.label });
                    } catch {
                        return t("openAppError", { name: target.label });
                    }
                }
                try {
                    await which(target.command);
                    const env = appEnv();
                    const openProject = await execa(target.command, [rootFolder], { env, extendEnv: false });
                    message(openProject.stdout); // Log the output of opening the project
                    if (fileToOpen) {
                        const openFile = await execa(target.command, [`${rootFolder}/${fileToOpen}`], {
                            env,
                            extendEnv: false,
                        });
                        message(openFile.stdout); // Log the output of opening the specific file
                    }
                    return t("openedIDE", { name: target.label });
                } catch {
                    return t("openIDEError", { name: target.label });
                }
            },
        },
    ]);
}

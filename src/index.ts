import { intro, log, outro, tasks } from "@clack/prompts";
import { execa } from "execa";
import { cyan } from "kolorist";
import minimist from "minimist";
import fs from "node:fs";
import path from "node:path";
import open from "open";
import which from "which";
import addPlugins, { PLUGIN_IDS } from "./steps/addPlugins";
import gitInit from "./steps/gitInit";
import selectIDE from "./steps/selectIDE";
import selectTemplate from "./steps/selectTemplate";
import selectUIStyle from "./steps/selectUIStyle";
import installAgentSkills from "./steps/installAgentSkills";
import { asciiArtLog } from "./utils/easter-egg";
import { pkgFromUserAgent } from "./utils/pkg-utility";
import t from "./i18n";

// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
const argv = minimist<{
    template?: string;
    help?: boolean;
    dir?: string;
}>(process.argv.slice(2), {
    default: { help: false },
    alias: { h: "help", t: "template" },
    string: ["_", "dir"],
});
const cwd = process.cwd();

// prettier-ignore
async function init() {
    try {
        asciiArtLog();
        intro(cyan(t("welcome")));

        const help = argv.help;
        if (help) {
            console.log(t("help"));
            return;
        }

        if (argv._[0] === "add") {
            const ids = argv._.slice(1);
            const dirIndex = ids.findIndex((i) => !(i in PLUGIN_IDS));
            const dir = argv.dir ?? (dirIndex >= 0 ? ids.splice(dirIndex, 1)[0] : ".");
            const unknown = ids.filter((i) => !(i in PLUGIN_IDS));
            if (ids.length === 0 || unknown.length) {
                console.error(`Usage: create-pixi-vn add <${Object.keys(PLUGIN_IDS).join("|")}>... [--dir <project>]`);
                process.exitCode = 1;
                return;
            }
            try {
                addPlugins({ rootFolder: path.resolve(cwd, dir), plugins: ids.map((i) => PLUGIN_IDS[i]) });
            } catch (error) {
                log.error(`Cannot add plugins, project left unchanged: ${(error as Error).message}`);
                process.exitCode = 1;
                return;
            }
            outro(`Added: ${ids.join(", ")}. Run your package manager install.`);
            return;
        }

        const { rootFolder, fileToOpen, canReplaceUI } = await selectTemplate();

        const lockFile = path.join(rootFolder, "package-lock.json");
        if (fs.existsSync(lockFile)) {
            fs.rmSync(lockFile);
        }

        const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
        const pkgManager = pkgInfo ? pkgInfo.name : "npm";

        const cdProjectName = path.relative(cwd, rootFolder);

        await installAgentSkills({ rootFolder });

        if (canReplaceUI) {
            log.info(t("uiTheme"));
            const uiPreset = await selectUIStyle();
            await tasks([
                {
                    title: t("installingShadcn"),
                    task: async () => {
                        try {
                            await which(pkgManager);
                            if (pkgManager === "yarn") {
                                await execa("yarn", ["global", "add", "shadcn@latest"]);
                            } else {
                                await execa(pkgManager, ["install", "-g", "shadcn@latest"]);
                            }
                        } catch (error) {
                            return t("shadcnInstallError");
                        }
                        return t("shadcnInstalled");
                    },
                },
            ]);
            log.step(t("applyingUIStyle"));
            // Same as the template's `ui:reinit` script, plus the preset chosen above.
            const shadcnArgs = ["shadcn@latest", "init", "-f", "-b", "base", "--reinstall", "--preset", uiPreset];
            const runShadcn = (env?: Record<string, string>) =>
                execa("npx", shadcnArgs, { cwd: rootFolder, stdio: "inherit", env });
            try {
                try {
                    await runShadcn();
                } catch {
                    // Peer dependency conflicts (ERESOLVE) in the freshly resolved "latest" packages:
                    // shadcn runs `npm install` internally, so the env var reaches it.
                    log.warn(t("uiStyleRetry"));
                    await runShadcn({ npm_config_legacy_peer_deps: "true" });
                }
                if (pkgManager === "yarn") {
                    await execa("yarn", ["format"], { cwd: rootFolder, stdio: "inherit" });
                } else {
                    await execa(pkgManager, ["run", "format"], { cwd: rootFolder, stdio: "inherit" });
                }
            } catch {
                log.warn(t("uiStyleFailed", { command: `npx ${shadcnArgs.join(" ")}` }));
            }
        }

        await gitInit({ rootFolder });

        let endLog = t("runGame");
        if (rootFolder !== cwd) {
            endLog += `\n  cd ${cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName}`;
        }
        switch (pkgManager) {
            case "yarn":
                endLog += `\n  yarn`;
                endLog += `\n  yarn dev`;
                break;
            default:
                endLog += `\n  ${pkgManager} install`;
                endLog += `\n  ${pkgManager} run start`;
                break;
        }
        log.message(endLog);
        outro(t("finish"));

        await selectIDE({
            rootFolder,
            fileToOpen,
            onSelected: () => open("https://pixi-vn.com/start/templates"),
        });

        console.log();
    } catch (error) {
        console.error(error);
    }
}

init().catch((e) => {
    console.error(e);
});

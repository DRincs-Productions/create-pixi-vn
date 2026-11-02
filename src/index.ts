import { intro, log, outro, tasks } from "@clack/prompts";
import { execa } from "execa";
import { cyan } from "kolorist";
import minimist from "minimist";
import fs from "node:fs";
import path from "node:path";
import open from "open";
import which from "which";
import gitInit from "./steps/gitInit";
import selectIDE from "./steps/selectIDE";
import selectTemplate from "./steps/selectTemplate";
import installAgentSkills from "./steps/installAgentSkills";
import { asciiArtLog } from "./utils/easter-egg";
import { pkgFromUserAgent } from "./utils/pkg-utility";
import t from "./i18n";

// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
const argv = minimist<{
    template?: string;
    help?: boolean;
}>(process.argv.slice(2), {
    default: { help: false },
    alias: { h: "help", t: "template" },
    string: ["_"],
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
            log.step(t("runningUIReinit"));
            if (pkgManager === "yarn") {
                await execa("yarn", ["ui:reinit"], { cwd: rootFolder, stdio: "inherit" });
            } else {
                await execa(pkgManager, ["run", "ui:reinit"], {
                    cwd: rootFolder,
                    stdio: "inherit",
                });
            }
        }

        await gitInit({ rootFolder });

        await selectIDE({ rootFolder, fileToOpen });

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

        await open("https://pixi-vn.com/start/templates");

        console.log();
    } catch (error) {
        console.error(error);
    }
}

init().catch((e) => {
    console.error(e);
});

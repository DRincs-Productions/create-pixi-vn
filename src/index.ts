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
import { asciiArtLog } from "./utils/easter-egg";
import { pkgFromUserAgent } from "./utils/pkg-utility";

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
const helpMessage = `\
Usage: create-pixi-vn [OPTION]... [DIRECTORY]

Create a new Pixi’VN project.
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME        use a specific template

Available templates:
${cyan('basic-visual-novel       react')}`

async function init() {
    try {
        asciiArtLog();
        intro(`Welcome to ${cyan("Pixi’VN")}! 🎨✨`);

        const help = argv.help;
        if (help) {
            console.log(helpMessage);
            return;
        }

        const { rootFolder, fileToOpen, canReplaceUI } = await selectTemplate();

        const lockFile = path.join(rootFolder, "package-lock.json");
        if (fs.existsSync(lockFile)) {
            fs.rmSync(lockFile);
        }

        await gitInit({ rootFolder });

        const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
        const pkgManager = pkgInfo ? pkgInfo.name : "npm";

        const cdProjectName = path.relative(cwd, rootFolder);

        if (canReplaceUI) {
            log.info("You will need to select a UI theme for your project.");
            await tasks([
                {
                    title: "Installing shadcn globally...",
                    task: async () => {
                        try {
                            await which(pkgManager);
                            if (pkgManager === "yarn") {
                                await execa("yarn", ["global", "add", "shadcn@latest"]);
                            } else {
                                await execa(pkgManager, ["install", "-g", "shadcn@latest"]);
                            }
                        } catch (error) {
                            return `Could not install shadcn globally`;
                        }
                        return "shadcn installed globally.";
                    },
                },
            ]);
            log.step("Running ui:reinit...");
            if (pkgManager === "yarn") {
                await execa("yarn", ["ui:reinit"], { cwd: rootFolder, stdio: "inherit" });
            } else {
                await execa(pkgManager, ["run", "ui:reinit"], { cwd: rootFolder, stdio: "inherit" });
            }
        }

        await selectIDE({ rootFolder, fileToOpen });

        let endLog = `To run the game:`;
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
        outro(`You're all set! 🎉 Now go build your game! 🚀`);

        await open("https://pixi-vn.com/start/templates");

        console.log();
    } catch (error) {
        console.error(error);
    }
}

init().catch((e) => {
    console.error(e);
});

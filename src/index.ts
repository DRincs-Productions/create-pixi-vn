import { intro, log, outro, tasks } from "@clack/prompts";
import { execa } from "execa";
import { cyan } from "kolorist";
import minimist from "minimist";
import path from "node:path";
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

        const { rootFolder, fileToOpen } = await selectTemplate();

        await gitInit({ rootFolder });

        const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
        const pkgManager = pkgInfo ? pkgInfo.name : "npm";

        const cdProjectName = path.relative(cwd, rootFolder);

        await selectIDE({ rootFolder, fileToOpen });

        // run install
        await tasks([
            {
                title: `Installing dependencies...`,
                task: async (message) => {
                    try {
                        await which(pkgManager);
                        if (pkgManager === "yarn") {
                            await execa("yarn", [], { cwd: rootFolder });
                        } else {
                            await execa(pkgManager, ["install"], { cwd: rootFolder });
                        }
                    } catch (error) {
                        return `Could not use ${pkgManager} to install dependencies`;
                    }
                    return `Dependencies installed.`;
                },
            },
        ]);

        log.message(`Refer to the README.md file for detailed information about the project.`);
        let endLog = `To run the game:`;
        if (rootFolder !== cwd) {
            endLog += `\n  cd ${cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName}`;
        }
        switch (pkgManager) {
            case "yarn":
                endLog += `\n  yarn dev`;
                break;
            default:
                endLog += `\n  ${pkgManager} run start`;
                break;
        }
        log.message(endLog);
        outro(`You're all set! 🎉 Now go build your game! 🚀`);

        console.log();
    } catch (error) {
        console.error(error);
    }
}

init().catch((e) => {
    console.error(e);
});

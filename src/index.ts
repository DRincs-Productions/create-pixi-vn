import spawn from 'cross-spawn'
import inquirer from 'inquirer'
import {
    cyan
} from 'kolorist'
import minimist from 'minimist'
import path from 'node:path'
import which from 'which'
import selectTemplate from './steps/selectTemplate'
import { formatTargetDir } from './utilities/dir-utility'
import { pkgFromUserAgent } from './utilities/pkg-utility'

// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
const argv = minimist<{
    template?: string
    help?: boolean
}>(process.argv.slice(2), {
    default: { help: false },
    alias: { h: 'help', t: 'template' },
    string: ['_'],
})
const cwd = process.cwd()

// prettier-ignore
const helpMessage = `\
Usage: create-pixi-vn [OPTION]... [DIRECTORY]

Create a new Pixi’VN project.
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME        use a specific template

Available templates:
${cyan('basic-visual-novel       react')}`



const renameFiles: Record<string, string | undefined> = {
    _gitignore: '.gitignore',
}

async function init() {
    try {
        const argTargetDir = formatTargetDir(argv._[0])

        const help = argv.help
        if (help) {
            console.log(helpMessage)
            return
        }

        const { rootFolder } = await selectTemplate(argTargetDir)

        let { ide } = await inquirer.prompt(
            [
                {
                    type: "list",
                    name: "ide",
                    message: "Which IDE do you want to use?",
                    choices: [
                        { name: "Visual Studio Code", value: "vscode" },
                        { name: "Cursor", value: "cursor" },
                        { name: "Other", value: "other" },
                    ],
                    default: "vscode",
                },
            ]
        )


        const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
        const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

        const cdProjectName = path.relative(cwd, rootFolder)
        console.log(`\nDone.\n`)
        console.log(`\nNow README.md for more information about the project.`)
        console.log(`\nTo run the game:\n`)
        if (rootFolder !== cwd) {
            console.log(
                `  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
                }`,
            )
        }
        switch (pkgManager) {
            case 'yarn':
                console.log('  yarn')
                console.log('  yarn dev')
                break
            default:
                console.log(`  ${pkgManager} install`)
                console.log(`  ${pkgManager} run start`)
                break
        }

        if (ide === undefined) {
            return
        }
        try {
            // const resolved = await which(ide)
            // spawn(resolved, [root], { detached: true })
            await which(ide)
            console.log(`\nOpening in ${ide}...`)
            spawn.sync(ide, [rootFolder], { stdio: 'inherit' })
        } catch (error) {
            console.error(
                `Could not open project using ${ide}, since ${ide} was not in your PATH`,
            )
        }
        console.log()
    } catch (error) {
        console.error(error)
    }
}

init().catch((e) => {
    console.error(e)
})

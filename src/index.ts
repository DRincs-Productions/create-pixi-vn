import spawn from 'cross-spawn'
import {
    cyan
} from 'kolorist'
import minimist from 'minimist'
import path from 'node:path'
import which from 'which'
import gitInit from './steps/gitInit'
import selectIDE from './steps/selectIDE'
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

async function init() {
    try {
        const argTargetDir = formatTargetDir(argv._[0])

        const help = argv.help
        if (help) {
            console.log(helpMessage)
            return
        }

        const { rootFolder, fileToOpen } = await selectTemplate(argTargetDir)

        await gitInit({ rootFolder })

        const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
        const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

        const cdProjectName = path.relative(cwd, rootFolder)

        await selectIDE({ rootFolder, fileToOpen })

        // run install
        console.log(`\nInstalling dependencies...`)
        try {
            await which(pkgManager)
            if (pkgManager === 'yarn') {
                spawn.sync('yarn', [], { cwd: rootFolder, stdio: 'inherit' })
            }
            else {
                spawn.sync(pkgManager, ['install'], { cwd: rootFolder, stdio: 'inherit' })
            }
        } catch (error) {
            console.error(`Could not use ${pkgManager} to install dependencies`)
        }

        console.log(`\nNow README.md for more information about the project.`)
        console.log(`\nTo run the game:`)
        if (rootFolder !== cwd) {
            console.log(
                `  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
                }`,
            )
        }
        switch (pkgManager) {
            case 'yarn':
                console.log('  yarn dev\n')
                break
            default:
                console.log(`  ${pkgManager} run start\n`)
                break
        }

        console.log()
    } catch (error) {
        console.error(error)
    }
}

init().catch((e) => {
    console.error(e)
})

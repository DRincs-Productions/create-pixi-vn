import spawn from 'cross-spawn'
import inquirer from 'inquirer'
import {
    cyan
} from 'kolorist'
import minimist from 'minimist'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import which from 'which'
import { DEFAULT_PACKAGE_NAME } from './constats'
import GameTypesEnum from './enum/GameTypesEnum'
import NarrativeLanguagesEnum from './enum/NarrativeLanguagesEnum'
import UIFrameworkEnum from './enum/UIFrameworkEnum'
import YesNoCancelEnum from './enum/YesNoCancelEnum'
import gameTypeQuestions from './questions/gameTypeQuestions'
import projectInfoQuestions from './questions/projectInfoQuestions'
import { formatTargetDir } from './utilities/dir-utility'

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

        let targetDir = argTargetDir || DEFAULT_PACKAGE_NAME

        let { description, overwrite, packageName, projectName } = await projectInfoQuestions({ argTargetDir, targetDir })
        let { UIFramework, gameType, narrativeLanguage, multidevice, identifier } = await gameTypeQuestions({ packageName })
        let template: string
        switch (gameType) {
            case GameTypesEnum.VisualNovel:
                switch (UIFramework) {
                    case UIFrameworkEnum.React:
                        switch (narrativeLanguage) {
                            case NarrativeLanguagesEnum.Typescript:
                                if (multidevice) {
                                    template = 'template-react-vite-muijoy-tauri'
                                }
                                else {
                                    template = 'template-react-vite-muijoy'
                                }
                                break
                            case NarrativeLanguagesEnum.Ink:
                            case NarrativeLanguagesEnum.Renpy:
                                throw new Error('There are no templates for this narrative language')
                            default:
                                throw new Error('Unknown narrative language')
                        }
                        break
                    case UIFrameworkEnum.Vue:
                    case UIFrameworkEnum.Angular:
                        throw new Error('There are no templates for this game type and UI framework')
                    default:
                        throw new Error('Unknown UI framework')
                }
                break
            default:
                throw new Error('Unknown game type')
        }

        let result = await inquirer.prompt(
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

        // user choice associated with prompts
        const { ide } = result

        const root = path.join(cwd, targetDir)

        if (overwrite === YesNoCancelEnum.Yes) {
            emptyDir(root)
        } else if (!fs.existsSync(root)) {
            fs.mkdirSync(root, { recursive: true })
        }

        const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
        const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

        console.log(`\nScaffolding project in ${root}...`)

        const templateDir = path.resolve(
            fileURLToPath(import.meta.url),
            '../..',
            `${template}`,
        )

        const write = (file: string, content?: string) => {
            const targetPath = path.join(root, renameFiles[file] ?? file)
            if (content) {
                fs.writeFileSync(targetPath, content)
            } else {
                copy(path.join(templateDir, file), targetPath)
            }
        }

        const filesNames = fs.readdirSync(templateDir)
        for (const fileName of filesNames) {
            switch (fileName) {
                case 'package.json':
                case 'vite.config.ts':
                case 'index.html':
                    let file = fs.readFileSync(path.join(templateDir, fileName), 'utf-8')
                    file = file.replace(/\|package-name\|/g, packageName)
                    file = file.replace(/\|description\|/g, description)
                    file = file.replace(/\|project-name\|/g, projectName)
                    write(fileName, file)
                    break
                default:
                    write(fileName)
            }
        }

        const cdProjectName = path.relative(cwd, root)
        console.log(`\nDone.\n`)
        console.log(`\nNow README.md for more information about the project.`)
        console.log(`\nTo run the game:\n`)
        if (root !== cwd) {
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
            spawn.sync(ide, [root], { stdio: 'inherit' })
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

function copy(src: string, dest: string) {
    const stat = fs.statSync(src)
    if (stat.isDirectory()) {
        copyDir(src, dest)
    } else {
        fs.copyFileSync(src, dest)
    }
}

function copyDir(srcDir: string, destDir: string) {
    fs.mkdirSync(destDir, { recursive: true })
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file)
        const destFile = path.resolve(destDir, file)
        copy(srcFile, destFile)
    }
}


function emptyDir(dir: string) {
    if (!fs.existsSync(dir)) {
        return
    }
    for (const file of fs.readdirSync(dir)) {
        if (file === '.git') {
            continue
        }
        fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
    }
}

function pkgFromUserAgent(userAgent: string | undefined) {
    if (!userAgent) return undefined
    const pkgSpec = userAgent.split(' ')[0]
    const pkgSpecArr = pkgSpec.split('/')
    return {
        name: pkgSpecArr[0],
        version: pkgSpecArr[1],
    }
}

init().catch((e) => {
    console.error(e)
})

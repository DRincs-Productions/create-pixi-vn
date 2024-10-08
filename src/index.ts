import spawn from 'cross-spawn'
import {
    cyan,
    magenta,
    red,
    reset
} from 'kolorist'
import minimist from 'minimist'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prompts from 'prompts'

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

type ColorFunc = (str: string | number) => string
type GameTypes = {
    name: string
    display: string
    color: ColorFunc
    variants: FrameworkVariant[]
}
type FrameworkVariant = {
    name: string
    display: string
    color: ColorFunc
    customCommand?: string
}

const GAME_TYPES: GameTypes[] = [
    {
        name: 'visual-novel',
        display: 'Basic Visual Novel',
        color: magenta,
        variants: [
            {
                name: 'react-vite-muijoy',
                display: 'Web page (Vite + React + MUI joy)',
                color: cyan,
            },
            {
                name: 'react-vite-muijoy-multidevice',
                display: 'Multi Device (Vite + React + MUI joy + Electron Forge)',
                color: cyan,
            },
        ],
    }
]

const TEMPLATES = GAME_TYPES.map(
    (f) => (f.variants && f.variants.map((v) => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), [])

const renameFiles: Record<string, string | undefined> = {
    _gitignore: '.gitignore',
}

const defaultTargetDir = 'pixi-vn-project'

async function init() {
    const argTargetDir = formatTargetDir(argv._[0])
    const argTemplate = argv.template || argv.t

    const help = argv.help
    if (help) {
        console.log(helpMessage)
        return
    }

    let targetDir = argTargetDir || defaultTargetDir
    const getProjectName = () =>
        targetDir === '.' ? path.basename(path.resolve()) : targetDir

    let result: prompts.Answers<
        'projectName' | 'overwrite' | 'packageName' | 'framework' | 'variant'
    >

    prompts.override({
        overwrite: argv.overwrite,
    })

    try {
        result = await prompts(
            [
                {
                    type: argTargetDir ? null : 'text',
                    name: 'projectName',
                    message: reset('Project name:'),
                    initial: defaultTargetDir,
                    onState: (state) => {
                        targetDir = formatTargetDir(state.value) || defaultTargetDir
                    },
                },
                {
                    type: () =>
                        !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'select',
                    name: 'overwrite',
                    message: () =>
                        (targetDir === '.'
                            ? 'Current directory'
                            : `Target directory "${targetDir}"`) +
                        ` is not empty. Please choose how to proceed:`,
                    initial: 0,
                    choices: [
                        {
                            title: 'Remove existing files and continue',
                            value: 'yes',
                        },
                        {
                            title: 'Cancel operation',
                            value: 'no',
                        },
                        {
                            title: 'Ignore files and continue',
                            value: 'ignore',
                        },
                    ],
                },
                {
                    type: (_, { overwrite }: { overwrite?: string }) => {
                        if (overwrite === 'no') {
                            throw new Error(red('✖') + ' Operation cancelled')
                        }
                        return null
                    },
                    name: 'overwriteChecker',
                },
                {
                    type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
                    name: 'packageName',
                    message: reset('Package name:'),
                    initial: () => toValidPackageName(getProjectName()),
                    validate: (dir) =>
                        isValidPackageName(dir) || 'Invalid package.json name',
                },
                {
                    type:
                        argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
                    name: 'framework',
                    message:
                        typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
                            ? reset(
                                `"${argTemplate}" isn't a valid template. Please choose from below: `,
                            )
                            : reset('Select the type of game you want to create'),
                    initial: 0,
                    choices: GAME_TYPES.map((gameTypes) => {
                        const frameworkColor = gameTypes.color
                        return {
                            title: frameworkColor(gameTypes.display || gameTypes.name),
                            value: gameTypes,
                        }
                    }),
                },
                {
                    type: (gameType: GameTypes) =>
                        gameType && gameType.variants ? 'select' : null,
                    name: 'variant',
                    message: reset('Select the frameworks to use:'),
                    choices: (gameType: GameTypes) =>
                        gameType.variants.map((variant) => {
                            const variantColor = variant.color
                            return {
                                title: variantColor(variant.display || variant.name),
                                value: variant.name,
                            }
                        }),
                },
            ],
            {
                onCancel: () => {
                    throw new Error(red('✖') + ' Operation cancelled')
                },
            },
        )
    } catch (cancelled: any) {
        console.log(cancelled.message)
        return
    }

    // user choice associated with prompts
    const { framework, overwrite, packageName, variant } = result

    const root = path.join(cwd, targetDir)

    if (overwrite === 'yes') {
        emptyDir(root)
    } else if (!fs.existsSync(root)) {
        fs.mkdirSync(root, { recursive: true })
    }

    // determine template
    let template: string = variant || framework?.name || argTemplate

    const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
    const pkgManager = pkgInfo ? pkgInfo.name : 'npm'
    const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith('1.')

    const { customCommand } =
        GAME_TYPES.flatMap((f) => f.variants).find((v) => v.name === template) ?? {}

    if (customCommand) {
        const fullCustomCommand = customCommand
            .replace(/^npm create /, () => {
                // `bun create` uses it's own set of templates,
                // the closest alternative is using `bun x` directly on the package
                if (pkgManager === 'bun') {
                    return 'bun x create-'
                }
                return `${pkgManager} create `
            })
            // Only Yarn 1.x doesn't support `@version` in the `create` command
            .replace('@latest', () => (isYarn1 ? '' : '@latest'))
            .replace(/^npm exec/, () => {
                // Prefer `pnpm dlx`, `yarn dlx`, or `bun x`
                if (pkgManager === 'pnpm') {
                    return 'pnpm dlx'
                }
                if (pkgManager === 'yarn' && !isYarn1) {
                    return 'yarn dlx'
                }
                if (pkgManager === 'bun') {
                    return 'bun x'
                }
                // Use `npm exec` in all other cases,
                // including Yarn 1.x and other custom npm clients.
                return 'npm exec'
            })

        const [command, ...args] = fullCustomCommand.split(' ')
        // we replace TARGET_DIR here because targetDir may include a space
        const replacedArgs = args.map((arg) =>
            arg.replace('TARGET_DIR', () => targetDir),
        )
        const { status } = spawn.sync(command, replacedArgs, {
            stdio: 'inherit',
        })
        process.exit(status ?? 0)
    }

    console.log(`\nScaffolding project in ${root}...`)

    const templateDir = path.resolve(
        fileURLToPath(import.meta.url),
        '../..',
        `template-${template}`,
    )

    const write = (file: string, content?: string) => {
        const targetPath = path.join(root, renameFiles[file] ?? file)
        if (content) {
            fs.writeFileSync(targetPath, content)
        } else {
            copy(path.join(templateDir, file), targetPath)
        }
    }

    const files = fs.readdirSync(templateDir)
    for (const file of files.filter((f) => f !== 'package.json')) {
        write(file)
    }

    const pkg = JSON.parse(
        fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'),
    )

    pkg.name = packageName || getProjectName()

    write('package.json', JSON.stringify(pkg, null, 2) + '\n')

    const cdProjectName = path.relative(cwd, root)
    console.log(`\nDone. Now run:\n`)
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
    console.log()
}

function formatTargetDir(targetDir: string | undefined) {
    return targetDir?.trim().replace(/\/+$/g, '')
}

function copy(src: string, dest: string) {
    const stat = fs.statSync(src)
    if (stat.isDirectory()) {
        copyDir(src, dest)
    } else {
        fs.copyFileSync(src, dest)
    }
}

function isValidPackageName(projectName: string) {
    return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
        projectName,
    )
}

function toValidPackageName(projectName: string) {
    return projectName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/^[._]/, '')
        .replace(/[^a-z\d\-~]+/g, '-')
}

function copyDir(srcDir: string, destDir: string) {
    fs.mkdirSync(destDir, { recursive: true })
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file)
        const destFile = path.resolve(destDir, file)
        copy(srcFile, destFile)
    }
}

function isEmpty(path: string) {
    const files = fs.readdirSync(path)
    return files.length === 0 || (files.length === 1 && files[0] === '.git')
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

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_PACKAGE_NAME } from '../constats'
import GameTypesEnum from '../enum/GameTypesEnum'
import NarrativeLanguagesEnum from '../enum/NarrativeLanguagesEnum'
import UIFrameworkEnum from '../enum/UIFrameworkEnum'
import YesNoCancelEnum from '../enum/YesNoCancelEnum'
import gameTypeQuestions from '../questions/gameTypeQuestions'
import projectInfoQuestions from '../questions/projectInfoQuestions'
import { emptyDir } from '../utilities/dir-utility'

const cwd = process.cwd()
const renameFiles: Record<string, string | undefined> = {
    _gitignore: '.gitignore',
}

export default async function selectTemplate(argTargetDir: string | undefined): Promise<{
    rootFolder: string
}> {
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
                            if (multidevice) {
                                template = 'template-react-ink-vite-muijoy-tauri'
                            }
                            else {
                                template = 'template-react-ink-vite-muijoy'
                            }
                            break
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

    const root = path.join(cwd, targetDir)

    if (overwrite === YesNoCancelEnum.Yes) {
        emptyDir(root)
    } else if (!fs.existsSync(root)) {
        fs.mkdirSync(root, { recursive: true })
    }

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
                file = file.replace(/my-app-package-name/g, packageName)
                file = file.replace(/my-app-description/g, description)
                file = file.replace(/my-app-project-name/g, projectName)
                write(fileName, file)
                break
            case '.git':
            case 'package-lock.json':
                break
            default:
                write(fileName)
        }
    }

    // if exist root/src-tauri folder, copy it to root folder
    const srcTauriDir = path.join(root, 'src-tauri')
    if (fs.existsSync(srcTauriDir)) {
        const filesNames = fs.readdirSync(srcTauriDir)
        for (const fileName of filesNames) {
            switch (fileName) {
                case 'Cargo.lock':
                case 'Cargo.toml':
                case 'tauri.conf.json':
                    console.log(path.join(srcTauriDir, fileName))
                    let file = fs.readFileSync(path.join(srcTauriDir, fileName), 'utf-8')
                    file = file.replace(/my-app-package-name/g, packageName)
                    file = file.replace(/my-app-description/g, description)
                    file = file.replace(/my-app-project-name/g, projectName)
                    file = file.replace(/com.my-app-project-name.app/g, identifier)
                    write(path.join('src-tauri', fileName), file)
            }
        }
    }
    console.log(`Done.`)

    return { rootFolder: root }
}

function copyDir(srcDir: string, destDir: string) {
    fs.mkdirSync(destDir, { recursive: true })
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file)
        const destFile = path.resolve(destDir, file)
        copy(srcFile, destFile)
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

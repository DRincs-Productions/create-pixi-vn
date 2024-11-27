import spawn from 'cross-spawn'
import fs from 'node:fs'
import path from 'node:path'
import gitQuestions from '../questions/gitQuestions'

export default async function gitInit({ rootFolder }: {
    rootFolder: string
}) {
    // Check if exist in rootFolder a .git folder
    const gitFolder = path.join(rootFolder, '.git`')
    try {
        if (fs.existsSync(gitFolder)) {
            console.log(`\n.git folder already exists.`)
            return
        }
    } catch (error) {
    }

    let { initGit } = await gitQuestions()
    try {
        if (initGit) {
            console.log(`\nInitializing git repository...`)
            spawn.sync('git', ['init', '-b', 'main'], { cwd: rootFolder, stdio: 'inherit' })
            spawn.sync('git', ['add', '.'], { cwd: rootFolder, stdio: 'inherit' })

            console.log(`Done.`)
            console.log(`\nNow, you can use GitHub Desktop upload your project to GitHub.`)
            console.log(`GitHub Desktop: https://github.com/apps/desktop`)
        }
    } catch (error) {
    }
}

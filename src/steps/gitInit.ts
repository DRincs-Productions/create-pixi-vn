import spawn from 'cross-spawn'
import gitQuestions from '../questions/gitQuestions'

export default async function gitInit({ rootFolder }: {
    rootFolder: string
}) {
    let { initGit } = await gitQuestions()
    try {
        if (initGit) {
            console.log(`\nInitializing git repository...`)
            spawn.sync('git', ['init'], { cwd: rootFolder, stdio: 'inherit' })

            console.log(`Done.`)
            console.log(`\nNow, you can use GitHub Desktop upload your project to GitHub.`)
            console.log(`GitHub Desktop: https://github.com/apps/desktop`)
        }
    } catch (error) {
    }
}

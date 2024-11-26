import spawn from 'cross-spawn'
import which from 'which'
import ideQuestions from '../questions/ideQuestions'

export default async function selectIDE({ rootFolder }: {
    rootFolder: string
}) {
    let { ide } = await ideQuestions()

    if (ide === undefined) {
        return
    }
    try {
        console.log(`\nOpening in ${ide}...`)
        let command = ""
        switch (ide) {
            case "vscode":
                command = 'code'
                break
            case "cursor":
                command = 'cursor'
                break
        }
        if (command) {
            await which(command)
            spawn.sync(command, [rootFolder], { stdio: 'inherit' })
            spawn.sync(command, [`${rootFolder}/README.md`], { stdio: 'inherit' })
        }
    } catch (error) {
        console.error(error)
        console.error(
            `Could not open project using ${ide}, since ${ide} was not in your PATH`,
        )
    }
}

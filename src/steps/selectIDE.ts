import spawn from 'cross-spawn'
import which from 'which'
import ideQuestions from '../questions/ideQuestions'

export default async function selectIDE({ rootFolder, fileToOpen }: {
    rootFolder: string,
    fileToOpen?: string
}) {
    let { ide } = await ideQuestions()

    if (ide === undefined) {
        return
    }
    try {
        let command = ""
        switch (ide) {
            case "vscode":
                console.log(`\nOpening in Visual Studio Code...`)
                command = 'code'
                break
            case "cursor":
                console.log(`\nOpening in Cursor...`)
                command = 'cursor'
                break
        }
        if (command) {
            await which(command)
            spawn.sync(command, [rootFolder], { stdio: 'inherit' })
            spawn.sync(command, [`${rootFolder}/README.md`], { stdio: 'inherit' })
            if (fileToOpen) {
                spawn.sync(command, [`${rootFolder}/${fileToOpen}`], { stdio: 'inherit' })
            }
        }
    } catch (error) {
        console.error(
            `Could not open project using ${ide}, since ${ide} was not in your PATH`,
        )
    }
}

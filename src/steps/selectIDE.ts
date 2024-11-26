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
        await which(ide)
        console.log(`\nOpening in ${ide}...`)
        spawn.sync(ide, [rootFolder], { stdio: 'inherit' })
    } catch (error) {
        console.error(
            `Could not open project using ${ide}, since ${ide} was not in your PATH`,
        )
    }
}

import fs from "node:fs";
import path from "node:path";
import OverwriteEnum from "../enum/OverwriteEnum";

export function formatTargetDir(targetDir: string | undefined) {
    return targetDir?.trim().replace(/\/+$/g, "");
}

export function isEmptyDir(path: string) {
    const files = fs.readdirSync(path);
    return files.length === 0 || (files.length === 1 && files[0] === ".git");
}

export function emptyDir(dir: string) {
    if (!fs.existsSync(dir)) {
        return;
    }
    for (const file of fs.readdirSync(dir)) {
        if (file === ".git") {
            continue;
        }
        fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
    }
}

export function handleConflict(filePath: string, overwrite: OverwriteEnum) {
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
        // 🔹 Se è un file, rimuovi solo il file
        fs.rmSync(filePath, { force: true });
    } else if (stat.isDirectory()) {
        // 🔹 Se è una directory, NON rimuoverla tutta
        const entries = fs.readdirSync(filePath);
        for (const entry of entries) {
            const entryPath = path.join(filePath, entry);
            if (overwrite === OverwriteEnum.Overwrite || overwrite === OverwriteEnum.Delete) {
                handleConflict(entryPath, overwrite);
            }
            // Se Skip → non fare nulla
            // Se Ask → chiedi per ogni file
        }
    }
}

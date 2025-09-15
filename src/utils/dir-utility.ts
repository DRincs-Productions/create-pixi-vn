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

/**
 * Handles conflicts without ever deleting entire directories
 */
export function handleConflict(src: string, dest: string, overwrite: OverwriteEnum): void {
    if (!fs.existsSync(dest)) return;

    const statDest = fs.statSync(dest);

    if (statDest.isFile()) {
        if (overwrite === OverwriteEnum.Overwrite || overwrite === OverwriteEnum.Delete) {
            fs.rmSync(dest, { force: true });
        }
    } else if (statDest.isDirectory()) {
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
            const srcEntry = path.join(src, entry);
            const destEntry = path.join(dest, entry);
            handleConflict(srcEntry, destEntry, overwrite);
        }
    }
}

/**
 * Copies files and directories recursively while respecting overwrite rules
 */
export function copy(src: string, dest: string, overwrite?: OverwriteEnum) {
    const stat = fs.statSync(src);

    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const file of fs.readdirSync(src)) {
            const srcFile = path.join(src, file);
            const destFile = path.join(dest, file);
            copy(srcFile, destFile, overwrite);
        }
    } else {
        if (overwrite !== undefined) {
            if (fs.existsSync(dest)) {
                if (overwrite === OverwriteEnum.Skip) return;
                if (overwrite === OverwriteEnum.Overwrite || overwrite === OverwriteEnum.Delete) {
                    fs.rmSync(dest, { force: true });
                }
            }
        }
        fs.copyFileSync(src, dest);
    }
}

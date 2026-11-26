import fs from "node:fs";
import path from "node:path";

/** Dependencies that identify a project packaged with Roves. */
export const ROVES_DEPENDENCIES = ["@drincs/roves-api"];
/** Dependencies that identify a Tauri project (which also ships `@drincs/roves-api`). */
export const TAURI_DEPENDENCIES = ["@tauri-apps/api"];

export function isRovesProject(dependencies: Record<string, string>): boolean {
    return (
        ROVES_DEPENDENCIES.every((dependency) => dependency in dependencies) &&
        !TAURI_DEPENDENCIES.some((dependency) => dependency in dependencies)
    );
}

export function readProjectDependencies(rootFolder: string): Record<string, string> | undefined {
    const packageJsonPath = path.join(rootFolder, "package.json");
    if (!fs.existsSync(packageJsonPath)) return undefined;
    const projectPackage = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return {
        ...projectPackage.dependencies,
        ...projectPackage.devDependencies,
        ...projectPackage.optionalDependencies,
    };
}

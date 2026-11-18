// Run before `npm publish`: npm strips `.gitignore` (and `.git*` is unreliable) from tarballs,
// so rename them to `_gitignore` / `_github`. create-pixi-vn renames them back when scaffolding.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "templates");

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.name === ".git") {
            fs.rmSync(full, { recursive: true, force: true });
        } else if (entry.name === "node_modules") {
        } else if (entry.name === ".gitignore") {
            fs.renameSync(full, path.join(dir, "_gitignore"));
            console.log(`renamed ${full}`);
        } else if (entry.name === ".github") {
            fs.renameSync(full, path.join(dir, "_github"));
            console.log(`renamed ${full}`);
        } else if (entry.isDirectory()) {
            walk(full);
        }
    }
}

walk(root);

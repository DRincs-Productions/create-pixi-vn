import { cancel, isCancel, select } from "@clack/prompts";

export default function gitQuestions() {
    const initGit = select({
        message: "Do you want to initialize a git repository? (recommended)",
        options: [
            { value: true, label: "Yes", hint: "You can use GitHub to track changes and collaborate with others." },
            { value: false, label: "No", hint: "It is not recommended to skip this step." },
        ],
        initialValue: true,
    });
    if (isCancel(initGit)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }
    return {
        initGit,
    };
}

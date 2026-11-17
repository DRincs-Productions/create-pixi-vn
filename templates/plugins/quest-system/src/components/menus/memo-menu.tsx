import { Button } from "@/components/ui/button";
import { Dialog, FullscreenDialogContent } from "@/components/ui/fullscreen-dialog";
import { Image } from "@/components/ui/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSearchParamState, useSetSearchParamState } from "@/lib/hooks/navigation-hooks";
import { useQueryQuests, useQuerySelectedQuest } from "@/lib/query/quest-query";
import { Memo } from "@/lib/stores/memo-store";
import { cn } from "@/lib/utils";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

function QuestButton({
    id,
    name,
    selected,
}: {
    id: string;
    name: string | undefined;
    selected: boolean;
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={selected}
            onClick={() => Memo.setSelectedQuestId(id)}
            className={cn(
                "w-full justify-start",
                selected && "bg-accent text-accent-foreground font-medium",
            )}
        >
            {name}
        </Button>
    );
}

export function MemoMenu() {
    const { t } = useTranslation(["ui"]);
    const open = useSearchParamState<boolean>("memo");
    const setOpen = useSetSearchParamState<boolean>("memo");
    const {
        data: { inProgressQuests, completedQuests, failedQuests } = {
            inProgressQuests: [],
            completedQuests: [],
            failedQuests: [],
        },
    } = useQueryQuests();
    const { data: selectedQuest } = useQuerySelectedQuest();

    useEffect(() => {
        if (!open) return;
        const currentId = Memo.store.state.selectedQuestId;
        const isVisible =
            inProgressQuests.some((q) => q.id === currentId) ||
            completedQuests.some((q) => q.id === currentId) ||
            failedQuests.some((q) => q.id === currentId);
        if (!isVisible) {
            Memo.setSelectedQuestId(inProgressQuests[0]?.id);
        }
    }, [open, inProgressQuests, completedQuests, failedQuests]);

    useHotkeys([
        {
            hotkey: "Alt+J",
            callback: () => setOpen((prev) => !prev || undefined),
            options: {
                meta: {
                    name: t("quests"),
                    description: t("quests_toggle_hotkey_description"),
                },
            },
        },
    ]);

    return (
        <Dialog open={open ?? false} onOpenChange={(isOpen) => setOpen(isOpen || undefined)}>
            <FullscreenDialogContent title={t("quests")}>
                <div className="flex flex-1 min-h-0">
                    {/* Sidebar */}
                    <aside className="w-48 shrink-0 border-r">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col gap-1 p-3">
                                {inProgressQuests.map((quest) => (
                                    <QuestButton
                                        key={quest.id}
                                        id={quest.id}
                                        name={quest.name}
                                        selected={selectedQuest?.id === quest.id}
                                    />
                                ))}
                                {completedQuests.length > 0 && (
                                    <>
                                        <Separator className="my-1" />
                                        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {t("completed")}
                                        </p>
                                        {completedQuests.map((quest) => (
                                            <QuestButton
                                                key={quest.id}
                                                id={quest.id}
                                                name={quest.name}
                                                selected={selectedQuest?.id === quest.id}
                                            />
                                        ))}
                                    </>
                                )}
                                {failedQuests.length > 0 && (
                                    <>
                                        <Separator className="my-1" />
                                        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {t("failed")}
                                        </p>
                                        {failedQuests.map((quest) => (
                                            <QuestButton
                                                key={quest.id}
                                                id={quest.id}
                                                name={quest.name}
                                                selected={selectedQuest?.id === quest.id}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </aside>

                    {/* Main content */}
                    {!selectedQuest ? (
                        <div className="flex flex-1 items-center justify-center">
                            <p className="text-muted-foreground">{t("no_active_quests")}</p>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1">
                            <div className="flex flex-col gap-3 p-8">
                                {selectedQuest?.questImageUrl && (
                                    <div className="max-h-[10dvh] overflow-hidden rounded">
                                        <Image
                                            src={selectedQuest.questImageUrl}
                                            alt={selectedQuest.name ?? ""}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                                <h2 className="text-center text-2xl font-bold">
                                    {selectedQuest?.name}
                                </h2>
                                <p className="max-h-[20dvh] overflow-y-auto text-primary">
                                    {selectedQuest?.description}
                                </p>
                                <Separator />
                                <p className="max-h-[20dvh] overflow-y-auto">
                                    {selectedQuest?.currentStage?.description}
                                </p>
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </FullscreenDialogContent>
        </Dialog>
    );
}

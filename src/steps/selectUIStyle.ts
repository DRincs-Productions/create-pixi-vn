import { cancel, isCancel, note, select, text } from "@clack/prompts";
import open from "open";
import { DEFAULT_PRESET_CONFIG, decodePreset, encodePreset, isPresetCode, type PresetConfig } from "shadcn/preset";
import t, { type TranslationKey } from "../i18n";

const CREATE_URL = "https://ui.shadcn.com/create";
const CUSTOM = "custom";

type StylePreset = {
    label: string;
    hint: TranslationKey;
    config: Partial<PresetConfig>;
};

/**
 * shadcn's named presets (`shadcn init --preset <name>`), copied from shadcn 4.23.
 * Icons are left out: the templates always use Lucide.
 */
const STYLES: Record<string, StylePreset> = {
    nova: { label: "Nova", hint: "uiStyleNovaHint", config: { style: "nova", font: "geist" } },
    vega: { label: "Vega", hint: "uiStyleVegaHint", config: { style: "vega", font: "inter" } },
    maia: { label: "Maia", hint: "uiStyleMaiaHint", config: { style: "maia", font: "figtree" } },
    lyra: { label: "Lyra", hint: "uiStyleLyraHint", config: { style: "lyra", font: "jetbrains-mono" } },
    mira: { label: "Mira", hint: "uiStyleMiraHint", config: { style: "mira", font: "inter" } },
    luma: { label: "Luma", hint: "uiStyleLumaHint", config: { style: "luma", font: "inter" } },
    sera: {
        label: "Sera",
        hint: "uiStyleSeraHint",
        config: {
            style: "sera",
            font: "noto-sans",
            fontHeading: "playfair-display",
            baseColor: "taupe",
            theme: "taupe",
            chartColor: "taupe",
        },
    },
    rhea: { label: "Rhea", hint: "uiStyleRheaHint", config: { style: "rhea", font: "inter" } },
};

/** Encodes a shadcn preset code, always with Lucide icons. */
function toLucidePreset(config: Partial<PresetConfig>) {
    return encodePreset({ ...DEFAULT_PRESET_CONFIG, ...config, iconLibrary: "lucide" });
}

function exitIfCancelled<T>(value: T): Exclude<T, symbol> {
    if (isCancel(value)) {
        cancel(t("operationCancelled"));
        process.exit(0);
    }
    return value as Exclude<T, symbol>;
}

/** Asks for the shadcn style (or a custom preset code) and returns the preset code to pass to `shadcn init`. */
export default async function selectUIStyle(): Promise<string> {
    const style = exitIfCancelled(
        await select({
            message: t("uiStylePrompt"),
            options: [
                ...Object.entries(STYLES).map(([value, { label, hint }]) => ({ value, label, hint: t(hint) })),
                { value: CUSTOM, label: t("uiStyleCustom"), hint: t("uiStyleCustomHint") },
            ],
            initialValue: "nova",
        }),
    );

    const preset = STYLES[style];
    if (preset) return toLucidePreset(preset.config);

    note(t("uiCustomNote", { url: CREATE_URL }), t("uiStyleCustom"));
    await open(CREATE_URL).catch(() => undefined);

    const code = exitIfCancelled(
        await text({
            message: t("uiCustomCodePrompt"),
            placeholder: "b0",
            validate: (value) => {
                const trimmed = value?.trim() ?? "";
                return isPresetCode(trimmed) && decodePreset(trimmed) ? undefined : t("uiCustomCodeInvalid");
            },
        }),
    );
    const config = decodePreset(code.trim()) ?? {};
    return toLucidePreset(config);
}

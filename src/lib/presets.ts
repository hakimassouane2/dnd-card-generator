import { parseCards, type Card } from "@/lib/card"
import type { Language } from "@/lib/i18n"

/* ---------------------------------------------------------------------------
   Bibliotheque de decks
   ---------------------------------------------------------------------------
   Les fichiers de json/ sont livres avec l'appli. L'ancienne version obligeait
   pourtant a passer par un selecteur de fichiers du systeme pour charger des
   donnees qui se trouvaient deja dans le depot, a cote de l'index.html.

   `import.meta.glob` les recense a la compilation et les charge a la demande :
   le deck de 76 sorts n'entre dans le bundle que si on l'ouvre.

   Ajouter un deck = deposer un .json dans json/<langue>/<categorie>/. Il
   apparait dans la bibliotheque sans autre modification.
--------------------------------------------------------------------------- */

const modules = import.meta.glob<{ default: unknown }>("/json/**/*.json")

export type PresetCategory = "spells" | "conditions" | "features" | "other"

export interface Preset {
  path: string
  /** Nom affiche, derive du nom de fichier. */
  label: string
  language: Language | null
  category: PresetCategory
  load: () => Promise<Card[]>
}

const CATEGORY_LABELS: Record<PresetCategory, string> = {
  spells: "Sorts",
  conditions: "Conditions",
  features: "Aptitudes",
  other: "Divers",
}

export function categoryLabel(category: PresetCategory): string {
  return CATEGORY_LABELS[category]
}

/**
 * Les noms de fichiers sont sans accent ; la bibliotheque, elle, s'affiche en
 * francais. Cette table restitue l'orthographe pour les cas connus, le reste
 * etant simplement mis en forme.
 */
const LABEL_OVERRIDES: Record<string, string> = {
  necrotique: "Nécrotique",
  "lightning wind": "Lightning & Wind",
}

/** "nimble-necrotique-fr.json" -> "Nécrotique" */
function deriveLabel(fileName: string): string {
  const base = fileName
    .replace(/\.json$/i, "")
    .replace(/^nimble[-_]/i, "")
    .replace(/[-_](fr|en)$/i, "")
    .replace(/[-_]/g, " ")
    .trim()
  if (!base) return fileName
  const override = LABEL_OVERRIDES[base.toLowerCase()]
  if (override) return override
  return base.charAt(0).toUpperCase() + base.slice(1)
}

function parsePath(path: string): Omit<Preset, "load"> {
  // "/json/fr/spells/nimble-feu-fr.json"
  const parts = path.split("/").filter(Boolean)
  const [, lang, category, ...rest] = parts
  const fileName = rest[rest.length - 1] ?? parts[parts.length - 1]

  const language: Language | null =
    lang === "fr" ? "french" : lang === "en" ? "english" : null

  const known: readonly string[] = ["spells", "conditions", "features"]
  const cat: PresetCategory = known.includes(category)
    ? (category as PresetCategory)
    : "other"

  return { path, label: deriveLabel(fileName), language, category: cat }
}

export const presets: Preset[] = Object.entries(modules)
  .map(([path, loader]) => ({
    ...parsePath(path),
    load: async () => parseCards((await loader()).default),
  }))
  .sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.label.localeCompare(b.label),
  )

/** Decks groupes par categorie, pour l'affichage de la bibliotheque. */
export function presetsByCategory(
  language?: Language,
): Array<{ category: PresetCategory; items: Preset[] }> {
  const filtered = language
    ? presets.filter((p) => p.language === null || p.language === language)
    : presets

  const groups = new Map<PresetCategory, Preset[]>()
  for (const preset of filtered) {
    const list = groups.get(preset.category) ?? []
    list.push(preset)
    groups.set(preset.category, list)
  }

  const order: PresetCategory[] = ["spells", "conditions", "features", "other"]
  return order
    .filter((c) => groups.has(c))
    .map((category) => ({ category, items: groups.get(category)! }))
}

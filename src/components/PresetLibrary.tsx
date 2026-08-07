import { useEffect, useMemo, useState } from "react"
import { Check, Library, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toCardData, type Card } from "@/lib/card"
import { makeT, type Language, type TranslationKey } from "@/lib/i18n"
import {
  categoryLabel,
  presetsByCategory,
  type Preset,
} from "@/lib/presets"
import { cn } from "@/lib/utils"
import { useCards } from "@/store/useCards"

/* ---------------------------------------------------------------------------
   Bibliotheque
   ---------------------------------------------------------------------------
   Les decks livres avec l'appli, importables en un clic. L'ancienne version
   imposait de retrouver ces memes fichiers a la main dans un selecteur du
   systeme, alors qu'ils sont distribues avec elle.

   L'import est additif et la selection se fait carte par carte : reprendre
   trois sorts de feu dans un deck existant ne doit pas obliger a tout charger
   puis a supprimer le reste.
--------------------------------------------------------------------------- */

interface PresetLibraryProps {
  language: Language
}

export function PresetLibrary({ language }: PresetLibraryProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Preset | null>(null)
  const [cards, setCards] = useState<Card[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState("")

  const appendCards = useCards((s) => s.appendCards)
  const t = makeT(language)
  const groups = useMemo(() => presetsByCategory(), [])

  useEffect(() => {
    if (!active) {
      setCards(null)
      setPicked(new Set())
      return
    }
    let cancelled = false
    setLoading(true)
    active
      .load()
      .then((loaded) => {
        if (cancelled) return
        setCards(loaded)
        // Tout coche par defaut : importer un deck entier est le cas courant.
        setPicked(new Set(loaded.map((c) => c.id)))
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [active])

  const filtered = useMemo(() => {
    if (!cards) return []
    const q = query.trim().toLowerCase()
    if (!q) return cards
    return cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.details.toLowerCase().includes(q),
    )
  }, [cards, query])

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function importPicked() {
    if (!cards) return
    const selected = cards.filter((c) => picked.has(c.id)).map(toCardData)
    if (selected.length === 0) return
    appendCards(selected)
    setOpen(false)
    setActive(null)
    setQuery("")
  }

  function subtitle(card: Card): string {
    if (card.cardType === "spell") {
      const level =
        card.spellLevel === "cantrip"
          ? t("level_cantrip")
          : `${t("tier_label")} ${card.spellLevel.slice(1)}`
      return card.spellElement !== "aucun"
        ? `${level} · ${t(`element_${card.spellElement}` as TranslationKey)}`
        : level
    }
    if (card.cardType === "feature") return t("feature_card")
    return card.typeValue || t(card.rarity as TranslationKey)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setActive(null)
          setQuery("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Library className="size-4" />
          Bibliothèque
        </Button>
      </DialogTrigger>

      <DialogContent className="flex h-[80vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle>Bibliothèque</DialogTitle>
          <DialogDescription>
            Decks livrés avec l'application. Les cartes importées s'ajoutent à
            la suite des vôtres.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          {/* Colonne des decks */}
          <nav className="w-56 shrink-0 overflow-y-auto border-r p-2">
            {groups.map(({ category, items }) => (
              <div key={category} className="mb-3">
                <h4 className="px-2 py-1.5 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
                  {categoryLabel(category)}
                </h4>
                <ul className="flex flex-col gap-0.5">
                  {items.map((preset) => (
                    <li key={preset.path}>
                      <button
                        type="button"
                        onClick={() => setActive(preset)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                          "hover:bg-muted",
                          active?.path === preset.path &&
                            "bg-accent text-accent-foreground hover:bg-accent",
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {preset.label}
                        </span>
                        {preset.language && (
                          <span className="shrink-0 text-[0.625rem] tracking-wide text-muted-foreground uppercase">
                            {preset.language === "french" ? "fr" : "en"}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Contenu du deck */}
          <div className="flex min-w-0 flex-1 flex-col">
            {!active && (
              <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
                Choisissez un deck à gauche.
              </p>
            )}

            {active && loading && (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {active && !loading && cards && (
              <>
                <div className="flex items-center gap-2 border-b p-3">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filtrer dans ce deck…"
                    className="h-9"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() =>
                      setPicked(
                        picked.size === cards.length
                          ? new Set()
                          : new Set(cards.map((c) => c.id)),
                      )
                    }
                  >
                    {picked.size === cards.length ? "Tout décocher" : "Tout cocher"}
                  </Button>
                </div>

                <ul className="min-h-0 flex-1 overflow-y-auto p-2">
                  {filtered.map((card) => (
                    <li key={card.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5",
                          "hover:bg-muted",
                        )}
                      >
                        <Checkbox
                          checked={picked.has(card.id)}
                          onCheckedChange={() => toggle(card.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {card.name || "Sans nom"}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {subtitle(card)}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                  {filtered.length === 0 && (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      Aucun résultat.
                    </p>
                  )}
                </ul>

                <div className="flex items-center justify-between gap-4 border-t p-4">
                  <span className="text-sm text-muted-foreground">
                    {picked.size} carte{picked.size > 1 ? "s" : ""} sélectionnée
                    {picked.size > 1 ? "s" : ""} sur {cards.length}
                  </span>
                  <Button onClick={importPicked} disabled={picked.size === 0}>
                    <Check className="size-4" />
                    Ajouter au deck
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useMemo, useState } from "react"
import { Copy, GripVertical, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CARDS_PER_PAGE, type Card, type CardType } from "@/lib/card"
import { makeT, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useCards } from "@/store/useCards"

/* ---------------------------------------------------------------------------
   Liste des cartes
   ---------------------------------------------------------------------------
   Remplace le mur de neuf formulaires deplies en permanence. Une carte se
   selectionne, se duplique, se supprime et se deplace individuellement, ce qui
   etait impossible avec des emplacements fixes.

   Un separateur marque le debut de chaque planche : c'est ce qui sera imprime
   ensemble, donc l'information a sa place ici.
--------------------------------------------------------------------------- */

const TYPE_DOT: Record<CardType, string> = {
  item: "bg-type-item",
  spell: "bg-type-spell",
  feature: "bg-type-feature",
}

interface CardListProps {
  language: Language
}

export function CardList({ language }: CardListProps) {
  const cards = useCards((s) => s.cards)
  const selectedId = useCards((s) => s.selectedId)
  const select = useCards((s) => s.select)
  const addCard = useCards((s) => s.addCard)
  const duplicate = useCards((s) => s.duplicate)
  const removeCard = useCards((s) => s.removeCard)
  const move = useCards((s) => s.move)

  const [query, setQuery] = useState("")
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const t = makeT(language)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards
      .map((card, index) => ({ card, index }))
      .filter(
        ({ card }) =>
          !q ||
          card.name.toLowerCase().includes(q) ||
          card.details.toLowerCase().includes(q),
      )
  }, [cards, query])

  // Le glisser-deposer n'a pas de sens sur une liste filtree : les positions
  // affichees ne correspondent plus aux positions reelles.
  const reorderable = query.trim() === ""

  function subtitle(card: Card): string {
    if (card.cardType === "spell") {
      const level =
        card.spellLevel === "cantrip"
          ? t("level_cantrip")
          : `${t("tier_label")} ${card.spellLevel.slice(1)}`
      const element =
        card.spellElement !== "aucun"
          ? ` · ${t(`element_${card.spellElement}` as never)}`
          : ""
      return `${level}${element}`
    }
    if (card.cardType === "feature") {
      return [card.featureClass, card.featureSubclass]
        .filter(Boolean)
        .join(" · ") || t("feature_card")
    }
    return card.typeValue || t(card.rarity as never)
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex !== null && dragIndex !== targetIndex) {
      move(dragIndex, targetIndex)
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="h-9 pl-8"
          />
        </div>
        <Button
          size="sm"
          className="h-9 shrink-0"
          onClick={() => addCard()}
          title="Ajouter une carte"
        >
          <Plus className="size-4" />
          Carte
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {cards.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            Aucune carte.
            <br />
            Ajoutez-en une ou ouvrez la bibliothèque.
          </p>
        )}

        {visible.length === 0 && cards.length > 0 && (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            Aucun résultat pour « {query} ».
          </p>
        )}

        <ul className="flex flex-col gap-0.5">
          {visible.map(({ card, index }) => (
            <li key={card.id}>
              {reorderable && index % CARDS_PER_PAGE === 0 && (
                <div className="flex items-center gap-2 px-2 pt-3 pb-1.5 first:pt-1">
                  <span className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
                    Planche {Math.floor(index / CARDS_PER_PAGE) + 1}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}

              <div
                draggable={reorderable}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  if (!reorderable) return
                  e.preventDefault()
                  setOverIndex(index)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDrop(index)
                }}
                onClick={() => select(card.id)}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left",
                  "hover:bg-muted",
                  selectedId === card.id &&
                    "bg-accent text-accent-foreground hover:bg-accent",
                  overIndex === index &&
                    dragIndex !== null &&
                    dragIndex !== index &&
                    "ring-2 ring-[var(--accent-solid)]",
                  dragIndex === index && "opacity-40",
                )}
              >
                {reorderable && (
                  <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100" />
                )}
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    TYPE_DOT[card.cardType],
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    {card.name || (
                      <span className="text-muted-foreground italic">
                        Sans nom
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {subtitle(card)}
                  </span>
                </span>

                <span className="flex shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    title="Dupliquer"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicate(card.id)
                    }}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 hover:text-destructive"
                    title="Supprimer"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCard(card.id)
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
        {cards.length} carte{cards.length > 1 ? "s" : ""}
        {cards.length > 0 && (
          <>
            {" · "}
            {Math.ceil(cards.length / CARDS_PER_PAGE)} planche
            {Math.ceil(cards.length / CARDS_PER_PAGE) > 1 ? "s" : ""}
          </>
        )}
      </div>
    </div>
  )
}

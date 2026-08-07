import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  type Card,
  type CardData,
  duplicateCard,
  emptyCard,
  newId,
  parseCards,
  reviveCards,
} from "@/lib/card"
import type { Language } from "@/lib/i18n"

/* ---------------------------------------------------------------------------
   Etat de l'application
   ---------------------------------------------------------------------------
   Source de verite unique. L'ancienne appli lisait et ecrivait directement le
   DOM (`getElementById` par champ et par carte), ce qui rendait toute
   modification de l'interface risquee : chaque champ existait en trois
   exemplaires (gabarit HTML, ecouteur, serialisation).

   Ici les cartes sont une liste ordonnee ; le nombre de planches A4 en decoule
   au lieu d'etre regle a la main.
--------------------------------------------------------------------------- */

export type ViewMode = "edit" | "sheets"

interface CardsState {
  cards: Card[]
  selectedId: string | null
  language: Language
  view: ViewMode
  theme: "light" | "dark"

  select: (id: string | null) => void
  setLanguage: (language: Language) => void
  setView: (view: ViewMode) => void
  toggleTheme: () => void

  addCard: (partial?: Partial<CardData>) => string
  updateCard: (id: string, patch: Partial<CardData>) => void
  removeCard: (id: string) => void
  duplicate: (id: string) => string | null
  move: (fromIndex: number, toIndex: number) => void
  clearAll: () => void

  /** Remplace tout le deck (ouverture de fichier). */
  replaceAll: (raw: unknown) => number
  /** Ajoute a la suite du deck courant (import depuis la bibliotheque). */
  appendCards: (cards: CardData[]) => number
}

function pickNeighbour(cards: Card[], removedIndex: number): string | null {
  if (cards.length === 0) return null
  return cards[Math.min(removedIndex, cards.length - 1)].id
}

export const useCards = create<CardsState>()(
  persist(
    (set, get) => ({
      cards: [],
      selectedId: null,
      language: "french",
      view: "edit",
      theme: "light",

      select: (id) => set({ selectedId: id }),
      setLanguage: (language) => set({ language }),
      setView: (view) => set({ view }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

      addCard: (partial) => {
        const card: Card = { ...emptyCard(), ...partial, id: newId() }
        set((s) => ({ cards: [...s.cards, card], selectedId: card.id }))
        return card.id
      },

      updateCard: (id, patch) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeCard: (id) =>
        set((s) => {
          const index = s.cards.findIndex((c) => c.id === id)
          if (index === -1) return s
          const cards = s.cards.filter((c) => c.id !== id)
          return {
            cards,
            selectedId:
              s.selectedId === id ? pickNeighbour(cards, index) : s.selectedId,
          }
        }),

      duplicate: (id) => {
        const source = get().cards.find((c) => c.id === id)
        if (!source) return null
        const copy = duplicateCard(source)
        set((s) => {
          const index = s.cards.findIndex((c) => c.id === id)
          const cards = [...s.cards]
          cards.splice(index + 1, 0, copy)
          return { cards, selectedId: copy.id }
        })
        return copy.id
      },

      move: (fromIndex, toIndex) =>
        set((s) => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= s.cards.length ||
            toIndex >= s.cards.length
          ) {
            return s
          }
          const cards = [...s.cards]
          const [moved] = cards.splice(fromIndex, 1)
          cards.splice(toIndex, 0, moved)
          return { cards }
        }),

      clearAll: () => set({ cards: [], selectedId: null }),

      replaceAll: (raw) => {
        const cards = parseCards(raw)
        set({ cards, selectedId: cards[0]?.id ?? null })
        return cards.length
      },

      appendCards: (incoming) => {
        const cards = incoming.map((data) => ({ ...data, id: newId() }))
        set((s) => ({
          cards: [...s.cards, ...cards],
          selectedId: cards[0]?.id ?? s.selectedId,
        }))
        return cards.length
      },
    }),
    {
      name: "nimble-cards",
      version: 1,
      // `view` est deliberement exclu : rouvrir l'appli en mode planche sans
      // avoir choisi ce mode est desorientant.
      partialize: (s) => ({
        cards: s.cards,
        selectedId: s.selectedId,
        language: s.language,
        theme: s.theme,
      }),

      // L'etat restaure n'est pas digne de confiance : il peut venir d'une
      // version anterieure du schema, ou avoir ete edite a la main. On le fait
      // repasser par le meme analyseur tolerant que les fichiers importes,
      // faute de quoi un champ absent devient `undefined` et fait echouer le
      // rendu au premier `.trim()`.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<CardsState>
        const cards = reviveCards(saved.cards)
        const selectedId =
          saved.selectedId && cards.some((c) => c.id === saved.selectedId)
            ? saved.selectedId
            : (cards[0]?.id ?? null)

        return {
          ...current,
          ...saved,
          cards,
          selectedId,
        }
      },
    },
  ),
)

/** Carte actuellement selectionnee, ou null. */
export function useSelectedCard(): Card | null {
  return useCards((s) => s.cards.find((c) => c.id === s.selectedId) ?? null)
}

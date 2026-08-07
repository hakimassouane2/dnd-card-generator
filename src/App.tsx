import { useEffect, useState } from "react"
import { Library, Minus, Plus } from "lucide-react"
import { CardForm } from "@/components/CardForm"
import { CardList } from "@/components/CardList"
import { CardPreview } from "@/components/CardPreview"
import { PrintSheets } from "@/components/PrintSheets"
import { Toolbar } from "@/components/Toolbar"
import { Button } from "@/components/ui/button"
import { CARDS_PER_PAGE, pageCountFor } from "@/lib/card"
import { useCards, useSelectedCard } from "@/store/useCards"

/* ---------------------------------------------------------------------------
   Assemblage
   ---------------------------------------------------------------------------
   Deux modes exclusifs plutot qu'un partage d'ecran permanent :

   - Edition  : liste a gauche, formulaire au centre, apercu a taille reelle a
                droite. L'apercu ne montre qu'une carte, en 63,5 x 88,9 mm.
   - Planches : les planches A4 completes, en plein ecran, pour verifier avant
                d'imprimer.

   Meme materiau que l'ancienne version, mais on ne demande plus a la meme
   surface de servir deux usages incompatibles : l'apercu y etait trop petit
   pour etre lu et l'editeur trop etroit pour etre confortable.
--------------------------------------------------------------------------- */

export default function App() {
  const cards = useCards((s) => s.cards)
  const language = useCards((s) => s.language)
  const view = useCards((s) => s.view)
  const theme = useCards((s) => s.theme)
  const selectedId = useCards((s) => s.selectedId)
  const select = useCards((s) => s.select)
  const selected = useSelectedCard()

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  // Un deck non vide sans selection (chargement de fichier, suppression)
  // laisserait la colonne centrale vide sans raison.
  useEffect(() => {
    if (!selectedId && cards.length > 0) select(cards[0].id)
  }, [selectedId, cards, select])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Toolbar />

      {view === "edit" ? <EditView /> : <SheetsView />}

      {/* Ctrl+P doit fonctionner depuis le mode edition aussi : les planches
          restent montees hors ecran, et redeviennent le seul contenu visible
          a l'impression (voir .sheets-offscreen dans card.css). */}
      {view === "edit" && (
        <div className="sheets-offscreen" aria-hidden>
          <PrintSheets cards={cards} language={language} />
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {selected ? `Carte sélectionnée : ${selected.name || "sans nom"}` : ""}
      </span>
    </div>
  )
}

function EditView() {
  const language = useCards((s) => s.language)
  const cards = useCards((s) => s.cards)
  const addCard = useCards((s) => s.addCard)
  const selected = useSelectedCard()

  return (
    <main className="not-printable flex min-h-0 flex-1">
      <aside className="w-72 shrink-0 border-r bg-sidebar">
        <CardList language={language} />
      </aside>

      <section className="min-w-0 flex-1 overflow-y-auto">
        {selected ? (
          <CardForm card={selected} language={language} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-12 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              {cards.length === 0
                ? "Votre deck est vide. Créez une carte, ou piochez dans la bibliothèque livrée avec l'application."
                : "Sélectionnez une carte dans la liste pour l'éditer."}
            </p>
            {cards.length === 0 && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => addCard()}>
                  <Plus className="size-4" />
                  Créer une carte
                </Button>
                <span className="text-xs text-muted-foreground">
                  ou <Library className="inline size-3.5 align-text-bottom" />{" "}
                  Bibliothèque
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Apercu a taille reelle : c'est la taille a laquelle la carte sera lue
          a table, donc la seule qui renseigne vraiment sur sa lisibilite. */}
      <aside className="hidden w-[19rem] shrink-0 flex-col items-center gap-3 overflow-y-auto border-l bg-sidebar p-6 xl:flex">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Aperçu · taille réelle
        </span>
        {selected ? (
          <div className="single-card-preview">
            <CardPreview card={selected} language={language} />
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Aucune carte sélectionnée.
          </p>
        )}
      </aside>
    </main>
  )
}

function SheetsView() {
  const cards = useCards((s) => s.cards)
  const language = useCards((s) => s.language)
  const selectedId = useCards((s) => s.selectedId)
  const select = useCards((s) => s.select)
  const setView = useCards((s) => s.setView)
  const [zoom, setZoom] = useState(0.75)

  const pages = pageCountFor(cards.length)

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="not-printable flex shrink-0 items-center gap-2 border-b bg-background px-4 py-2">
        <span className="text-sm text-muted-foreground">
          {cards.length} carte{cards.length > 1 ? "s" : ""} · {pages} planche
          {pages > 1 ? "s" : ""} de {CARDS_PER_PAGE}
        </span>
        <div className="flex-1" />
        <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">
          Cliquez une carte pour l'éditer
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}
          title="Réduire"
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-12 text-center text-sm tabular-nums">
          {Math.round(zoom * 100)} %
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}
          title="Agrandir"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-8">
        {cards.length === 0 ? (
          <p className="pt-16 text-center text-sm text-muted-foreground">
            Aucune carte à imprimer.
          </p>
        ) : (
          <PrintSheets
            cards={cards}
            language={language}
            zoom={zoom}
            selectedId={selectedId}
            onSelect={(id) => {
              select(id)
              setView("edit")
            }}
          />
        )}
      </div>
    </main>
  )
}

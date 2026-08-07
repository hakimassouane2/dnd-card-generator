import { useLayoutEffect } from "react"
import { CardPreview } from "@/components/CardPreview"
import { paginate, type Card } from "@/lib/card"
import { fitAllText, PRINT_SHRINK_FACTOR } from "@/lib/fit-text"
import type { Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
   Planches A4
   ---------------------------------------------------------------------------
   Le nombre de planches est calcule a partir du nombre de cartes, alors que
   l'ancienne appli demandait de le regler a la main avec des boutons +/- et
   creait 9 formulaires vides par planche.

   Les emplacements non utilises de la derniere planche restent presents dans la
   grille (pour que les cartes gardent leur position) mais sont masques a
   l'impression via `card-empty`.
--------------------------------------------------------------------------- */

interface PrintSheetsProps {
  cards: Card[]
  language: Language
  /** Facteur d'echelle a l'ecran. L'impression ignore la transformation. */
  zoom?: number
  selectedId?: string | null
  onSelect?: (id: string) => void
  className?: string
}

export function PrintSheets({
  cards,
  language,
  zoom = 1,
  selectedId,
  onSelect,
  className,
}: PrintSheetsProps) {
  const pages = paginate(cards)

  // Avant impression, la mise en page se resserre legerement : on refait passer
  // l'ajustement de police avec le facteur de reduction, puis on le retablit.
  useLayoutEffect(() => {
    const before = () => fitAllText(document, PRINT_SHRINK_FACTOR)
    const after = () => fitAllText(document, 1)
    window.addEventListener("beforeprint", before)
    window.addEventListener("afterprint", after)
    return () => {
      window.removeEventListener("beforeprint", before)
      window.removeEventListener("afterprint", after)
    }
  }, [])

  return (
    <div className={cn("print-sheets flex flex-col items-center gap-8", className)}>
      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          className="print-page"
          style={{
            transform: zoom === 1 ? undefined : `scale(${zoom})`,
            transformOrigin: "top center",
            // Sans compensation, l'element garde sa hauteur d'origine et laisse
            // un grand vide sous une planche reduite.
            marginBottom: zoom === 1 ? undefined : `${(zoom - 1) * 297}mm`,
          }}
        >
          {page.map((card, slotIndex) =>
            card ? (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelect?.(card.id)}
                // `contents` : le bouton ne doit pas s'interposer entre la
                // grille et la carte, sous peine de casser le gabarit en mm.
                className="contents cursor-pointer"
                aria-label={card.name || "Carte sans nom"}
              >
                <CardPreview
                  card={card}
                  language={language}
                  className={cn(
                    selectedId === card.id && "is-selected",
                  )}
                />
              </button>
            ) : (
              // Emplacement libre : un conteneur nu suffit, il ne doit rien
              // rendre ni consommer de cycle d'ajustement de police.
              <div
                key={`empty-${pageIndex}-${slotIndex}`}
                className="card-container card-empty"
                aria-hidden="true"
              />
            ),
          )}
        </div>
      ))}
    </div>
  )
}

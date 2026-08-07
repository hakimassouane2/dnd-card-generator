import { useLayoutEffect, useMemo, useRef } from "react"
import type { Card } from "@/lib/card"
import { normalizeHex, overrideBackground } from "@/lib/colors"
import { fitText } from "@/lib/fit-text"
import { makeT, type Language, type TranslationKey } from "@/lib/i18n"
import { renderMarkdown } from "@/lib/markdown"
import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
   Rendu d'une carte
   ---------------------------------------------------------------------------
   Reproduit a l'identique la sortie de l'ancienne appli : memes classes, memes
   conditions d'affichage, memes libelles. La difference est que tout decoule
   ici de l'objet `card` au lieu d'une trentaine de manipulations de classes
   dispersees dans des gestionnaires d'evenements.

   Les espaces sans chasse (​) devant les valeurs sont conserves : ils
   empechent le navigateur de rogner les lignes et faussent moins la mesure de
   textFit. Les retirer change la mise en page imprimee.
--------------------------------------------------------------------------- */

const ZWSP = "​"

/** Extrait le mot-cle de portee pour eviter "Portée: Allonge 12". */
const RANGE_PREFIX = /^(Portée|Allonge|Ligne|Range|Reach|Line)\b\s*:?\s*/i

interface CardPreviewProps {
  card: Card
  language: Language
  /** Marque une case vide de la derniere planche : masquee a l'impression. */
  empty?: boolean
  className?: string
}

export function CardPreview({
  card,
  language,
  empty = false,
  className,
}: CardPreviewProps) {
  const t = makeT(language)
  const detailsRef = useRef<HTMLDivElement>(null)

  const namePlaceholder =
    card.cardType === "spell"
      ? t("spell_name")
      : card.cardType === "feature"
        ? t("feature_name")
        : t("item_name")

  const detailsHtml = useMemo(
    () => renderMarkdown(card.details),
    [card.details],
  )
  const upcastHtml = useMemo(
    () => renderMarkdown(card.spellUpcast),
    [card.spellUpcast],
  )

  // Rejoue l'ajustement de police apres chaque rendu : la taille depend du
  // contenu et de la boite, qu'on ne connait qu'une fois la mise en page faite.
  useLayoutEffect(() => {
    if (detailsRef.current) fitText(detailsRef.current)
  })

  const overrideHex = normalizeHex(card.colorOverride)
  const style = overrideHex
    ? ({ "--card-bg": overrideBackground(overrideHex) } as React.CSSProperties)
    : undefined

  const charges = parseInt(card.charges, 10) || 0
  const isItem = card.cardType === "item"
  const isSpell = card.cardType === "spell"
  const isFeature = card.cardType === "feature"

  const featureBadges = [
    { key: "class", value: card.featureClass.trim(), cls: "feature-class-badge" },
    {
      key: "subclass",
      value: card.featureSubclass.trim(),
      cls: "feature-subclass-badge",
    },
    {
      key: "level",
      value: card.featureLevel.trim()
        ? `${t("feature_level")} ${card.featureLevel.trim()}`
        : "",
      cls: "feature-level-badge",
    },
  ].filter((b) => b.value)

  return (
    <div
      className={cn(
        "card-container",
        isItem && card.rarity !== "common" && `rarity-${card.rarity}`,
        isSpell && `element-${card.spellElement}`,
        empty && "card-empty",
        className,
      )}
      data-card-type={card.cardType}
      style={style}
    >
      <div className="card-outline">
        <div className="card-name">
          {card.name ? ZWSP + card.name : namePlaceholder}
        </div>

        {isFeature && featureBadges.length > 0 && (
          <div className="feature-badges">
            {featureBadges.map((b) => (
              <span key={b.key} className={b.cls}>
                {b.value}
              </span>
            ))}
          </div>
        )}

        {isSpell && (
          <div className="spell-badges">
            <span className="spell-level-badge">
              {card.spellLevel === "cantrip"
                ? t("level_cantrip")
                : `${t("tier_label")} ${card.spellLevel.slice(1)}`}
            </span>
            <span className={`spell-element-badge element-${card.spellElement}`}>
              {t(`element_${card.spellElement}` as TranslationKey)}
            </span>
            {card.spellUtility && (
              <span className="spell-utility-badge">{t("utility")}</span>
            )}
            {card.spellAoe && <span className="spell-aoe-badge">{t("aoe")}</span>}
          </div>
        )}

        {card.shortDescription && (
          <div
            className={cn(
              "card-short-description",
              !card.imageRequired && "no-image",
              !card.typeRequired && "no-type",
            )}
          >
            {card.imageRequired && (
              <div
                className="image"
                style={
                  card.imageDataUrl
                    ? {
                        backgroundImage: `url(${card.imageDataUrl})`,
                        backgroundColor: "white",
                      }
                    : undefined
                }
              />
            )}
            <div className="characteristics">
              {isItem && card.typeRequired && (
                <div className="card-type">
                  <div className="item-type-header">{t("type")}</div>
                  <div className="item-type">
                    {card.typeValue ? ZWSP + card.typeValue : t("item_type")}
                  </div>
                </div>
              )}
              {isSpell && <SpellStats card={card} language={language} />}
            </div>
          </div>
        )}

        <hr />

        <div className="card-details" ref={detailsRef}>
          <span
            className="textFitted"
            style={{ display: "inline-block" }}
            dangerouslySetInnerHTML={{ __html: detailsHtml }}
          />
        </div>

        {isSpell && card.spellUpcast.trim() && (
          <div className="card-upcast">
            <strong className="card-upcast-label">
              {(card.spellLevel === "cantrip"
                ? t("upcast_cantrip")
                : t("upcast")) + ":"}
            </strong>
            <span
              className="card-upcast-value"
              dangerouslySetInnerHTML={{ __html: ZWSP + upcastHtml }}
            />
          </div>
        )}
      </div>

      {isItem && charges > 0 && (
        <div className="charges-container">
          <div className="charges-circles">
            {Array.from({ length: charges }, (_, i) => (
              <div key={i} className="charge-circle" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SpellStats({ card, language }: { card: Card; language: Language }) {
  const t = makeT(language)

  const castingTime = card.spellCastingTime.trim()
  const duration = card.spellDuration.trim()

  // La portee porte souvent son propre mot-cle ("Allonge 1", "Ligne 8") : on le
  // promeut en libelle de ligne plutot que d'ecrire "Portée: Allonge 1".
  const rawRange = card.spellRange.trim()
  const rangeMatch = rawRange.match(RANGE_PREFIX)
  const rangeLabel = rangeMatch ? rangeMatch[1] : t("range")
  const rangeValue = rangeMatch
    ? rawRange.slice(rangeMatch[0].length).trim()
    : rawRange

  // Degats et type de degats forment une seule ligne : "Dégâts: 2d6 feu".
  // Sans type explicite, l'element sert de repli.
  const damage = card.spellDamage.trim()
  const explicitType = card.spellDamageType.trim()
  const elementName =
    card.spellElement !== "aucun"
      ? t(`element_${card.spellElement}` as TranslationKey).toLowerCase()
      : ""
  const damageType = explicitType || elementName
  const damageText = damage
    ? damageType
      ? `${damage} ${damageType}`
      : damage
    : ""

  const lines = [
    { key: "castingtime", label: t("casting_time_short"), value: castingTime },
    { key: "range", label: rangeLabel, value: rangeValue },
    { key: "damage", label: t("damage"), value: damageText },
    { key: "duration", label: t("duration"), value: duration },
  ].filter((l) => l.value)

  if (lines.length === 0 && !card.spellConcentration) return null

  return (
    <div className="spell-stats">
      {lines.map((l) => (
        <div key={l.key} className="spell-stat-line" data-stat={l.key}>
          <strong className="spell-stat-label">{l.label}:</strong>
          <span className="spell-stat-value">{ZWSP + l.value}</span>
        </div>
      ))}
      {card.spellConcentration && (
        <div className="spell-conc">★ {t("concentration")}</div>
      )}
    </div>
  )
}

import { useRef } from "react"
import { ImageOff, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  CARD_TYPES,
  ELEMENTS,
  RARITIES,
  SPELL_LEVELS,
  type Card,
  type CardData,
  type CardType,
} from "@/lib/card"
import { normalizeHex } from "@/lib/colors"
import { makeT, type Language, type TranslationKey } from "@/lib/i18n"
import { handleMarkdownKeyDown } from "@/lib/markdown-shortcuts"
import { cn } from "@/lib/utils"
import { useCards } from "@/store/useCards"

/* ---------------------------------------------------------------------------
   Formulaire d'edition
   ---------------------------------------------------------------------------
   Un seul formulaire, celui de la carte selectionnee. L'ancienne appli en
   affichait neuf simultanement, tous les champs des trois types compris,
   masques en CSS.

   Les champs sont ici montes selon le type : un formulaire de sort ne contient
   pas de champ de rarete, et le lecteur ne se demande pas si un champ vide est
   pertinent ou juste inapplicable.
--------------------------------------------------------------------------- */

interface CardFormProps {
  card: Card
  language: Language
}

export function CardForm({ card, language }: CardFormProps) {
  const updateCard = useCards((s) => s.updateCard)
  const t = makeT(language)

  const set = <K extends keyof CardData>(key: K, value: CardData[K]) =>
    updateCard(card.id, { [key]: value } as Partial<CardData>)

  const namePlaceholder =
    card.cardType === "spell"
      ? t("spell_name")
      : card.cardType === "feature"
        ? t("feature_name")
        : t("item_name")

  const detailsPlaceholder =
    card.cardType === "spell"
      ? t("spell_details")
      : card.cardType === "feature"
        ? t("feature_details")
        : t("item_details")

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <TypeSwitch
        value={card.cardType}
        onChange={(cardType) => set("cardType", cardType)}
        language={language}
      />

      <Field label="Nom">
        <Input
          value={card.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder={namePlaceholder}
          className="text-base"
        />
      </Field>

      {card.cardType === "item" && <ItemFields card={card} set={set} t={t} />}
      {card.cardType === "spell" && <SpellFields card={card} set={set} t={t} />}
      {card.cardType === "feature" && (
        <FeatureFields card={card} set={set} t={t} />
      )}

      <Field
        label="Texte de la carte"
        hint="Markdown accepté · Ctrl+B gras · Ctrl+I italique"
      >
        <Textarea
          value={card.details}
          onChange={(e) => set("details", e.target.value)}
          onKeyDown={(e) => handleMarkdownKeyDown(e, (v) => set("details", v))}
          placeholder={detailsPlaceholder}
          className="min-h-40 resize-y font-mono text-sm leading-relaxed"
        />
      </Field>

      {card.cardType === "spell" && (
        <Field label={t("upcast")}>
          <Textarea
            value={card.spellUpcast}
            onChange={(e) => set("spellUpcast", e.target.value)}
            onKeyDown={(e) =>
              handleMarkdownKeyDown(e, (v) => set("spellUpcast", v))
            }
            placeholder={t("upcast_placeholder")}
            className="min-h-20 resize-y font-mono text-sm"
          />
        </Field>
      )}

      <HeaderBlockSection card={card} set={set} t={t} />
      <AppearanceSection card={card} set={set} t={t} />
    </div>
  )
}

/* --- Sous-sections ------------------------------------------------------- */

type Setter = <K extends keyof CardData>(key: K, value: CardData[K]) => void
type Translate = ReturnType<typeof makeT>

function ItemFields({
  card,
  set,
  t,
}: {
  card: Card
  set: Setter
  t: Translate
}) {
  const charges = parseInt(card.charges, 10) || 0
  return (
    <>
      <Field label={t("rarity")}>
        <Select
          value={card.rarity}
          onValueChange={(v) => set("rarity", v as Card["rarity"])}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RARITIES.map((r) => (
              <SelectItem key={r} value={r}>
                {t(r as TranslationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label={t("item_charges")}
        hint={charges === 0 ? t("none") : `${charges}`}
      >
        <Slider
          value={[charges]}
          min={0}
          max={12}
          step={1}
          onValueChange={([v]) => set("charges", String(v))}
        />
      </Field>
    </>
  )
}

function SpellFields({
  card,
  set,
  t,
}: {
  card: Card
  set: Setter
  t: Translate
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label={t("level")}>
          <Select
            value={card.spellLevel}
            onValueChange={(v) => set("spellLevel", v as Card["spellLevel"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPELL_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l === "cantrip"
                    ? t("level_cantrip")
                    : `${t("tier_label")} ${l.slice(1)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t("element")}>
          <Select
            value={card.spellElement}
            onValueChange={(v) => set("spellElement", v as Card["spellElement"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ELEMENTS.map((el) => (
                <SelectItem key={el} value={el}>
                  {t(`element_${el}` as TranslationKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Toggle
          checked={card.spellUtility}
          onChange={(v) => set("spellUtility", v)}
          label={t("utility")}
        />
        <Toggle
          checked={card.spellAoe}
          onChange={(v) => set("spellAoe", v)}
          label={t("aoe")}
        />
        <Toggle
          checked={card.spellConcentration}
          onChange={(v) => set("spellConcentration", v)}
          label={t("concentration")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t("casting_time")}>
          <Input
            value={card.spellCastingTime}
            onChange={(e) => set("spellCastingTime", e.target.value)}
            placeholder={t("casting_time_placeholder")}
          />
        </Field>
        <Field label={t("range")}>
          <Input
            value={card.spellRange}
            onChange={(e) => set("spellRange", e.target.value)}
            placeholder={t("range_placeholder")}
          />
        </Field>
        <Field label={t("damage")}>
          <Input
            value={card.spellDamage}
            onChange={(e) => set("spellDamage", e.target.value)}
            placeholder={t("damage_placeholder")}
          />
        </Field>
        <Field
          label={t("damage_type")}
          hint={
            card.spellElement !== "aucun" && !card.spellDamageType
              ? `Par défaut : ${t(
                  `element_${card.spellElement}` as TranslationKey,
                ).toLowerCase()}`
              : undefined
          }
        >
          <Input
            value={card.spellDamageType}
            onChange={(e) => set("spellDamageType", e.target.value)}
            placeholder={t("damage_type_placeholder")}
          />
        </Field>
        <Field label={t("duration")}>
          <Input
            value={card.spellDuration}
            onChange={(e) => set("spellDuration", e.target.value)}
            placeholder={t("duration_placeholder")}
          />
        </Field>
      </div>
    </>
  )
}

function FeatureFields({
  card,
  set,
  t,
}: {
  card: Card
  set: Setter
  t: Translate
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Field label={t("feature_class")}>
        <Input
          value={card.featureClass}
          onChange={(e) => set("featureClass", e.target.value)}
          placeholder={t("feature_class_placeholder")}
        />
      </Field>
      <Field label={t("feature_subclass")}>
        <Input
          value={card.featureSubclass}
          onChange={(e) => set("featureSubclass", e.target.value)}
          placeholder={t("feature_subclass_placeholder")}
        />
      </Field>
      <Field label={t("feature_level")}>
        <Input
          value={card.featureLevel}
          onChange={(e) => set("featureLevel", e.target.value)}
          placeholder={t("feature_level_placeholder")}
        />
      </Field>
    </div>
  )
}

/**
 * L'ancienne case s'appelait "Description courte" alors qu'elle pilotait en
 * realite l'affichage du bandeau superieur (illustration et caracteristiques).
 * Le libelle decrit maintenant ce que la case fait vraiment, et depend du type.
 */
function HeaderBlockSection({
  card,
  set,
  t,
}: {
  card: Card
  set: Setter
  t: Translate
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const description =
    card.cardType === "spell"
      ? "Portée, incantation, dégâts et durée en haut de la carte."
      : card.cardType === "item"
        ? "Illustration et type en haut de la carte."
        : "Illustration en haut de la carte."

  function onPickFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => set("imageDataUrl", String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <Section title="Bandeau supérieur">
      <Toggle
        checked={card.shortDescription}
        onChange={(v) => set("shortDescription", v)}
        label="Afficher le bandeau"
        hint={description}
      />

      {card.shortDescription && (
        <div className="mt-4 flex flex-col gap-4 border-l-2 pl-4">
          <Toggle
            checked={card.imageRequired}
            onChange={(v) => set("imageRequired", v)}
            label="Illustration"
          />

          {card.imageRequired && (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-16 shrink-0 rounded-md border bg-muted bg-contain bg-center bg-no-repeat",
                  !card.imageDataUrl &&
                    "flex items-center justify-center text-muted-foreground",
                )}
                style={
                  card.imageDataUrl
                    ? { backgroundImage: `url(${card.imageDataUrl})` }
                    : undefined
                }
              >
                {!card.imageDataUrl && <ImageOff className="size-5" />}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" />
                Choisir une image
              </Button>
              {card.imageDataUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => set("imageDataUrl", "")}
                >
                  <X className="size-4" />
                  Retirer
                </Button>
              )}
            </div>
          )}

          {card.cardType === "item" && (
            <>
              <Toggle
                checked={card.typeRequired}
                onChange={(v) => set("typeRequired", v)}
                label={t("type")}
              />
              {card.typeRequired && (
                <Input
                  value={card.typeValue}
                  onChange={(e) => set("typeValue", e.target.value)}
                  placeholder={t("item_type")}
                />
              )}
            </>
          )}
        </div>
      )}
    </Section>
  )
}

function AppearanceSection({
  card,
  set,
  t,
}: {
  card: Card
  set: Setter
  t: Translate
}) {
  const normalized = normalizeHex(card.colorOverride)
  const invalid = card.colorOverride.trim() !== "" && !normalized

  return (
    <Section title="Apparence">
      <Field
        label={t("color_override")}
        hint="Vide : la couleur découle de la rareté, de l'élément ou du type."
      >
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={normalized ?? "#808080"}
            onChange={(e) => set("colorOverride", e.target.value)}
            className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
            aria-label={t("color_override")}
          />
          <Input
            value={card.colorOverride}
            onChange={(e) => set("colorOverride", e.target.value)}
            placeholder={t("color_override_placeholder")}
            maxLength={7}
            spellCheck={false}
            className={cn("font-mono", invalid && "border-destructive")}
          />
          {card.colorOverride && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => set("colorOverride", "")}
              title={t("color_override_reset")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </Field>
    </Section>
  )
}

/* --- Primitives ---------------------------------------------------------- */

function TypeSwitch({
  value,
  onChange,
  language,
}: {
  value: CardType
  onChange: (type: CardType) => void
  language: Language
}) {
  const t = makeT(language)
  const labels: Record<CardType, string> = {
    item: t("item_card"),
    spell: t("spell_card"),
    feature: t("feature_card"),
  }
  const dots: Record<CardType, string> = {
    item: "bg-type-item",
    spell: "bg-type-spell",
    feature: "bg-type-feature",
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("card_type")}
      className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
    >
      {CARD_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          role="radio"
          aria-checked={value === type}
          onClick={() => onChange(type)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === type
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className={cn("size-2 rounded-full", dots[type])} aria-hidden />
          {labels[type]}
        </button>
      ))}
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <Label className="text-sm font-medium">{label}</Label>
        {hint && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border p-4">
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm leading-none font-medium">{label}</span>
        {hint && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </span>
    </label>
  )
}

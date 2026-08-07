/* ---------------------------------------------------------------------------
   Modele de donnees
   ---------------------------------------------------------------------------
   Le schema serialise est volontairement identique a celui de l'ancienne appli
   (objet plat, memes noms de cles) : les fichiers de json/ et tous les exports
   deja produits doivent se recharger sans conversion.

   La seule difference interne est `id`, ajoute au chargement et retire a
   l'export, pour que React puisse suivre les cartes a travers les
   reordonnancements sans se fier a leur position.
--------------------------------------------------------------------------- */

export const CARD_TYPES = ["item", "spell", "feature"] as const
export type CardType = (typeof CARD_TYPES)[number]

export const RARITIES = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "artifact",
] as const
export type Rarity = (typeof RARITIES)[number]

export const SPELL_LEVELS = [
  "cantrip",
  "t1",
  "t2",
  "t3",
  "t4",
  "t5",
  "t6",
  "t7",
  "t8",
  "t9",
] as const
export type SpellLevel = (typeof SPELL_LEVELS)[number]

export const ELEMENTS = [
  "aucun",
  "feu",
  "glace",
  "foudre",
  "vent",
  "radiant",
  "necrotique",
] as const
export type Element = (typeof ELEMENTS)[number]

/** Forme serialisee : exactement l'ancien schema, sans `id`. */
export interface CardData {
  cardType: CardType
  name: string
  rarity: Rarity
  /** Affiche le bloc superieur (illustration + caracteristiques) de la carte. */
  shortDescription: boolean
  imageRequired: boolean
  /** Data URL nue. Les anciens fichiers stockaient `url("...")` : normalise a la lecture. */
  imageDataUrl: string
  typeRequired: boolean
  typeValue: string
  details: string
  /** Conserve en chaine : c'est ce que produisait l'ancien <input type="range">. */
  charges: string
  spellLevel: SpellLevel
  spellElement: Element
  spellUtility: boolean
  spellAoe: boolean
  spellCastingTime: string
  spellRange: string
  spellDamage: string
  spellDamageType: string
  spellDuration: string
  spellConcentration: boolean
  spellUpcast: string
  featureClass: string
  featureSubclass: string
  featureLevel: string
  /** Hex #RRGGBB. Vide = couleur derivee de la rarete ou de l'element. */
  colorOverride: string
}

/** Forme en memoire. */
export interface Card extends CardData {
  id: string
}

export const CARDS_PER_PAGE = 9

let idCounter = 0
export function newId(): string {
  idCounter += 1
  return `card-${Date.now().toString(36)}-${idCounter.toString(36)}`
}

export function emptyCardData(): CardData {
  return {
    cardType: "item",
    name: "",
    rarity: "common",
    shortDescription: true,
    imageRequired: true,
    imageDataUrl: "",
    typeRequired: true,
    typeValue: "",
    details: "",
    charges: "0",
    spellLevel: "cantrip",
    spellElement: "aucun",
    spellUtility: false,
    spellAoe: false,
    spellCastingTime: "",
    spellRange: "",
    spellDamage: "",
    spellDamageType: "",
    spellDuration: "",
    spellConcentration: false,
    spellUpcast: "",
    featureClass: "",
    featureSubclass: "",
    featureLevel: "",
    colorOverride: "",
  }
}

export function emptyCard(): Card {
  return { id: newId(), ...emptyCardData() }
}

function oneOf<T extends readonly string[]>(
  allowed: T,
  value: unknown,
  fallback: T[number],
): T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

/**
 * L'ancienne appli lisait l'image via `element.style.backgroundImage`, donc les
 * fichiers deja exportes contiennent `url("data:image/png;base64,...")` plutot
 * que la data URL nue. On accepte les deux.
 */
function normalizeImage(value: unknown): string {
  const raw = str(value).trim()
  if (!raw || raw === "none") return ""
  const wrapped = raw.match(/^url\((['"]?)(.*)\1\)$/s)
  return wrapped ? wrapped[2] : raw
}

/**
 * Tolerant par construction : un fichier partiel, un export d'une version
 * anterieure ou un etat restaure depuis localStorage doivent tous charger.
 * Tout champ absent retombe sur sa valeur par defaut plutot que de rester
 * `undefined`, sinon le rendu casse sur le premier `.trim()`.
 *
 * @param keepId Conserve un identifiant existant (restauration d'etat) au lieu
 *               d'en generer un neuf (import de fichier).
 */
export function parseCard(raw: unknown, keepId?: string): Card {
  const base = emptyCardData()
  if (typeof raw !== "object" || raw === null) {
    return { id: keepId ?? newId(), ...base }
  }
  const o = raw as Record<string, unknown>

  return {
    // Un identifiant present dans le fichier est ignore : deux cartes copiees
    // d'un meme deck partageraient la meme cle React.
    id: keepId ?? newId(),
    cardType: oneOf(CARD_TYPES, o.cardType, base.cardType),
    name: str(o.name),
    rarity: oneOf(RARITIES, o.rarity, base.rarity),
    shortDescription: bool(o.shortDescription, base.shortDescription),
    imageRequired: bool(o.imageRequired, base.imageRequired),
    imageDataUrl: normalizeImage(o.imageDataUrl),
    typeRequired: bool(o.typeRequired, base.typeRequired),
    typeValue: str(o.typeValue),
    details: str(o.details),
    charges: str(o.charges, base.charges),
    spellLevel: oneOf(SPELL_LEVELS, o.spellLevel, base.spellLevel),
    spellElement: oneOf(ELEMENTS, o.spellElement, base.spellElement),
    spellUtility: bool(o.spellUtility, base.spellUtility),
    spellAoe: bool(o.spellAoe, base.spellAoe),
    spellCastingTime: str(o.spellCastingTime),
    spellRange: str(o.spellRange),
    spellDamage: str(o.spellDamage),
    spellDamageType: str(o.spellDamageType),
    spellDuration: str(o.spellDuration),
    spellConcentration: bool(o.spellConcentration, base.spellConcentration),
    spellUpcast: str(o.spellUpcast),
    featureClass: str(o.featureClass),
    featureSubclass: str(o.featureSubclass),
    featureLevel: str(o.featureLevel),
    colorOverride: str(o.colorOverride),
  }
}

export function parseCards(raw: unknown): Card[] {
  return Array.isArray(raw) ? raw.map((c) => parseCard(c)) : []
}

/**
 * Normalise un etat restaure depuis localStorage en conservant les
 * identifiants, pour que la selection courante reste valide.
 */
export function reviveCards(raw: unknown): Card[] {
  if (!Array.isArray(raw)) return []
  return raw.map((c) => {
    const id =
      c && typeof c === "object" && typeof (c as { id?: unknown }).id === "string"
        ? (c as { id: string }).id
        : undefined
    return parseCard(c, id)
  })
}

/** Retire `id` pour rester interoperable avec les fichiers de l'ancienne appli. */
export function toCardData(card: Card): CardData {
  const { id: _id, ...data } = card
  return data
}

export function serializeCards(cards: Card[]): string {
  return JSON.stringify(cards.map(toCardData), null, 2)
}

export function duplicateCard(card: Card): Card {
  return { ...card, id: newId() }
}

/** Nombre de planches A4 necessaires : c'est une consequence, plus un reglage. */
export function pageCountFor(cardCount: number): number {
  return Math.max(1, Math.ceil(cardCount / CARDS_PER_PAGE))
}

/** Decoupe la liste en planches completees par des emplacements vides. */
export function paginate(cards: Card[]): (Card | null)[][] {
  const pages: (Card | null)[][] = []
  for (let p = 0; p < pageCountFor(cards.length); p++) {
    const slice = cards.slice(p * CARDS_PER_PAGE, (p + 1) * CARDS_PER_PAGE)
    const page: (Card | null)[] = [...slice]
    while (page.length < CARDS_PER_PAGE) page.push(null)
    pages.push(page)
  }
  return pages
}

/** Une carte est "vide" si rien de visible n'y a ete saisi. */
export function cardIsEmpty(card: Card): boolean {
  return !(
    card.name ||
    card.details ||
    card.typeValue ||
    card.imageDataUrl ||
    card.spellCastingTime ||
    card.spellRange ||
    card.spellDamage ||
    card.spellDamageType ||
    card.spellDuration ||
    card.spellUpcast ||
    card.spellConcentration ||
    card.spellUtility ||
    card.spellAoe ||
    card.featureClass ||
    card.featureSubclass ||
    card.featureLevel ||
    (card.charges && card.charges !== "0")
  )
}

const HEX = /^#[0-9a-fA-F]{6}$/
export function isValidHex(value: string): boolean {
  return HEX.test(value.trim())
}

/* ---------------------------------------------------------------------------
   Ajustement automatique de la taille du texte des cartes
   ---------------------------------------------------------------------------
   Reimplementation de la seule branche de textFit que l'ancienne appli
   utilisait (`precise: true, multiLine: true, applyToSelf: true, unit: 'mm'`) :
   une recherche dichotomique en 8 passes sur la taille de police, jusqu'a ce
   que le contenu tienne dans la boite sans deborder.

   La version d'origine injectait elle-meme un `<span class="textFitted">` via
   innerHTML, ce qui entrerait en conflit avec React. Ici c'est CardDetails qui
   rend ce span ; la fonction se contente de le mesurer. Meme resultat, sans
   qu'un script exterieur ecrive dans le DOM gere par React.
--------------------------------------------------------------------------- */

export const MIN_FONT_MM = 1
export const MAX_FONT_MM = 3

/** Reduction appliquee a l'impression : la mise en page print est legerement
 *  plus serree que celle de l'ecran, sans quoi la derniere ligne peut sauter. */
export const PRINT_SHRINK_FACTOR = 0.97

/**
 * `scrollWidth` et `scrollHeight` sont arrondis a l'entier superieur par le
 * navigateur, alors que la largeur utile d'une carte tombe sur une valeur
 * fractionnaire (186,39 px pour 63,5 mm moins les marges). Un texte qui remplit
 * exactement la ligne mesure donc 187 pour 186,39 disponibles, et la comparaison
 * echoue quelle que soit la taille de police.
 *
 * C'est le defaut de l'implementation d'origine : des que le texte passait a la
 * ligne, la recherche dichotomique retombait sur la taille minimale, d'ou des
 * cartes au texte minuscule avec les trois quarts de leur surface vides. Une
 * tolerance d'un pixel absorbe cet arrondi.
 */
const ROUNDING_TOLERANCE_PX = 1

function innerSize(el: HTMLElement): { width: number; height: number } {
  const style = window.getComputedStyle(el)
  const px = (v: string) => parseFloat(v) || 0
  return {
    width:
      el.clientWidth -
      px(style.paddingLeft) -
      px(style.paddingRight),
    height:
      el.clientHeight -
      px(style.paddingTop) -
      px(style.paddingBottom),
  }
}

/**
 * Ajuste la police de `container` pour que `.textFitted` le remplisse au mieux.
 * @param scale Facteur applique au resultat (1 a l'ecran, 0.97 a l'impression).
 */
export function fitText(container: HTMLElement, scale = 1): void {
  const span = container.querySelector<HTMLElement>(":scope > .textFitted")
  if (!span) return

  const { width, height } = innerSize(container)
  // Element non encore mis en page (onglet masque, planche repliee) : mesurer
  // maintenant donnerait 0 et ecraserait une taille correcte par le minimum.
  if (width <= 0 || height <= 0) return

  let low = MIN_FONT_MM
  let high = MAX_FONT_MM

  const maxWidth = width + ROUNDING_TOLERANCE_PX
  const maxHeight = height + ROUNDING_TOLERANCE_PX

  for (let i = 0; i < 8; i++) {
    const mid = (low + high) / 2
    container.style.fontSize = `${mid}mm`
    if (span.scrollWidth <= maxWidth && span.scrollHeight <= maxHeight) {
      low = mid
    } else {
      high = mid
    }
  }

  container.style.fontSize = `${low * scale}mm`
}

/** Ajuste toutes les cartes actuellement dans le document. */
export function fitAllText(root: ParentNode = document, scale = 1): void {
  root
    .querySelectorAll<HTMLElement>(".card-details")
    .forEach((el) => fitText(el, scale))
}

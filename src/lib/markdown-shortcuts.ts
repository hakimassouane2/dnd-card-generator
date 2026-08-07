/* ---------------------------------------------------------------------------
   Raccourcis Ctrl/Cmd + B et I dans les zones de texte
   ---------------------------------------------------------------------------
   Porte depuis l'ancienne appli, ou c'etait l'une des rares commodites reelles
   de l'editeur. Le comportement est conserve : si la selection est deja
   entouree du marqueur, le raccourci le retire au lieu de l'empiler.
--------------------------------------------------------------------------- */

export const MARKDOWN_SHORTCUTS: Record<string, string> = {
  b: "**",
  i: "*",
}

/**
 * Vrai si le texte qui entoure immediatement la selection est exactement
 * `marker`. Pour l'italique on compte la suite d'asterisques, sinon "**gras**"
 * serait pris pour un enrobage italique et Ctrl+I donnerait "*gras*".
 */
function selectionIsWrapped(
  before: string,
  after: string,
  marker: string,
): boolean {
  if (!before.endsWith(marker) || !after.startsWith(marker)) return false
  if (marker === "*") {
    const beforeRun = (before.match(/\*+$/) || [""])[0].length
    const afterRun = (after.match(/^\*+/) || [""])[0].length
    return beforeRun % 2 === 1 && afterRun % 2 === 1
  }
  return true
}

/** Meme idee, quand les marqueurs font partie de la selection elle-meme. */
function selectionContainsMarkers(selected: string, marker: string): boolean {
  const len = marker.length
  if (selected.length < 2 * len) return false
  if (!selected.startsWith(marker) || !selected.endsWith(marker)) return false
  if (marker === "*") {
    const leadRun = (selected.match(/^\*+/) || [""])[0].length
    const tailRun = (selected.match(/\*+$/) || [""])[0].length
    return leadRun % 2 === 1 && tailRun % 2 === 1
  }
  return true
}

/**
 * Insere via execCommand quand c'est possible pour que la pile d'annulation
 * native (Ctrl+Z) continue de fonctionner ; sinon, reecriture directe.
 */
function insertAtSelection(textarea: HTMLTextAreaElement, text: string): void {
  textarea.focus()
  let inserted = false
  try {
    inserted = document.execCommand("insertText", false, text)
  } catch {
    inserted = false
  }
  if (!inserted) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    textarea.value =
      textarea.value.slice(0, start) + text + textarea.value.slice(end)
    textarea.selectionStart = textarea.selectionEnd = start + text.length
  }
}

/**
 * Ajoute ou retire `marker` autour de la selection.
 * @returns la nouvelle valeur du champ, a repercuter dans le store.
 */
export function toggleMarkdownMarker(
  textarea: HTMLTextAreaElement,
  marker: string,
): string {
  const value = textarea.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = value.slice(start, end)
  const before = value.slice(0, start)
  const after = value.slice(end)
  const len = marker.length

  let replaceStart = start
  let replaceEnd = end
  let replacement: string
  let innerOffset: number

  if (selectionContainsMarkers(selected, marker)) {
    // Les marqueurs sont dans la selection ("**gras**" selectionne) : on les ote.
    replacement = selected.slice(len, selected.length - len)
    innerOffset = 0
  } else if (selectionIsWrapped(before, after, marker)) {
    // Les marqueurs sont juste a l'exterieur de la selection : on les ote aussi.
    replaceStart = start - len
    replaceEnd = end + len
    replacement = selected
    innerOffset = 0
  } else {
    replacement = marker + selected + marker
    innerOffset = len
  }

  const payloadLength = replacement.length - 2 * innerOffset
  textarea.setSelectionRange(replaceStart, replaceEnd)
  insertAtSelection(textarea, replacement)

  const innerStart = replaceStart + innerOffset
  textarea.setSelectionRange(innerStart, innerStart + payloadLength)

  return textarea.value
}

/** Gestionnaire de touche pret a brancher sur un <textarea>. */
export function handleMarkdownKeyDown(
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  onChange: (value: string) => void,
): void {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return
  const marker = MARKDOWN_SHORTCUTS[event.key.toLowerCase()]
  if (!marker) return
  event.preventDefault()
  onChange(toggleMarkdownMarker(event.currentTarget, marker))
}

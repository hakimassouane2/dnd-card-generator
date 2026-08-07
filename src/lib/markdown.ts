import DOMPurify from "dompurify"
import { marked } from "marked"

/* ---------------------------------------------------------------------------
   Rendu markdown des textes de carte
   ---------------------------------------------------------------------------
   Remplace showdown, qui etait charge depuis un CDN (rawgit, hors service
   depuis des annees : l'ancienne appli dependait d'une URL morte).

   Le HTML produit est assaini : les fichiers de cartes s'echangent entre MJ,
   et rien ne garantit qu'un JSON recu ne contienne pas de balises actives.
--------------------------------------------------------------------------- */

marked.setOptions({
  // Un retour a la ligne dans un champ de carte doit se voir sur la carte.
  breaks: true,
  gfm: true,
})

export function renderMarkdown(source: string): string {
  if (!source) return ""
  const html = marked.parse(source, { async: false })
  return DOMPurify.sanitize(html)
}

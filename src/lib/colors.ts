/* ---------------------------------------------------------------------------
   Couleur personnalisee de bordure
   ---------------------------------------------------------------------------
   Porte depuis l'ancienne appli. Les fonds de rarete et d'element sont des
   degrades radiaux clairs au centre et plus sombres au bord ; on reconstruit la
   meme forme autour de la couleur choisie, en gardant la teinte exacte sur le
   bord exterieur, pour que la bordure imprimee soit vraiment le hex demande.
--------------------------------------------------------------------------- */

/** Accepte "#abc", "abc", "#AABBCC" -> "#aabbcc". Renvoie null si invalide. */
export function normalizeHex(value: string): string | null {
  if (!value) return null
  let hex = value.trim().replace(/^#/, "")
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return "#" + hex.toLowerCase()
}

interface Hsl {
  h: number
  s: number
  l: number
}

export function hexToHsl(hex: string): Hsl {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/** Degrade radial construit autour du hex choisi, qui reste exact sur le bord. */
export function overrideBackground(hex: string): string {
  const { h, s, l } = hexToHsl(hex)
  const light = Math.min(96, l + 18)
  return `radial-gradient(circle, hsl(${h}, ${s}%, ${light}%), ${hex})`
}

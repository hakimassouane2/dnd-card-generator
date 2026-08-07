import { useRef } from "react"
import {
  Download,
  FolderOpen,
  LayoutGrid,
  Moon,
  Pencil,
  Printer,
  Sun,
  Trash2,
} from "lucide-react"
import { PresetLibrary } from "@/components/PresetLibrary"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { serializeCards } from "@/lib/card"
import { LANGUAGE_LABELS, LANGUAGES, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useCards, type ViewMode } from "@/store/useCards"

/* ---------------------------------------------------------------------------
   Barre d'outils
   ---------------------------------------------------------------------------
   L'ancienne barre alignait sept boutons en icone seule, sans libelle ni
   regroupement, avec l'effacement general colle a la sauvegarde.

   Les commandes sont ici groupees par nature (fichier / vue / sortie), les
   actions principales portent un libelle, et l'effacement est ecarte a droite,
   discret, avec confirmation.
--------------------------------------------------------------------------- */

export function Toolbar() {
  const cards = useCards((s) => s.cards)
  const language = useCards((s) => s.language)
  const setLanguage = useCards((s) => s.setLanguage)
  const view = useCards((s) => s.view)
  const setView = useCards((s) => s.setView)
  const theme = useCards((s) => s.theme)
  const toggleTheme = useCards((s) => s.toggleTheme)
  const replaceAll = useCards((s) => s.replaceAll)
  const clearAll = useCards((s) => s.clearAll)

  const fileRef = useRef<HTMLInputElement>(null)

  function openFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const count = replaceAll(JSON.parse(String(reader.result)))
        if (count === 0) {
          window.alert("Ce fichier ne contient aucune carte exploitable.")
        }
      } catch {
        window.alert("Fichier illisible : le JSON n'a pas pu être analysé.")
      }
    }
    reader.readAsText(file)
  }

  function saveFile() {
    const blob = new Blob([serializeCards(cards)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cartes-nimble.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  function confirmClear() {
    if (cards.length === 0) return
    if (
      window.confirm(
        `Supprimer les ${cards.length} cartes du deck ? Cette action est irréversible.`,
      )
    ) {
      clearAll()
    }
  }

  return (
    <header className="not-printable flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3">
      <span className="mr-1 hidden text-sm font-semibold sm:inline">
        Nimble Cards
      </span>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Fichier */}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          openFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <FolderOpen className="size-4" />
        Ouvrir
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={saveFile}
        disabled={cards.length === 0}
      >
        <Download className="size-4" />
        Exporter
      </Button>
      <PresetLibrary language={language} />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ViewSwitch value={view} onChange={setView} />

      <div className="flex-1" />

      <Select
        value={language}
        onValueChange={(v) => setLanguage(v as Language)}
      >
        <SelectTrigger
          size="sm"
          className="w-[8.5rem]"
          title="Langue du texte imprimé sur les cartes"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={theme === "dark" ? "Thème clair" : "Thème sombre"}
      >
        {theme === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={confirmClear}
        disabled={cards.length === 0}
        title="Vider le deck"
        className="hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        size="sm"
        onClick={() => window.print()}
        disabled={cards.length === 0}
      >
        <Printer className="size-4" />
        Imprimer
      </Button>
    </header>
  )
}

/**
 * Editer ou verifier, pas les deux a la fois : c'est ce choix qui remplace
 * l'ancien partage permanent de l'ecran, ou l'apercu etait trop petit pour
 * etre lu et l'editeur trop etroit pour etre confortable.
 */
function ViewSwitch({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (view: ViewMode) => void
}) {
  const options: Array<{ id: ViewMode; label: string; Icon: typeof Pencil }> = [
    { id: "edit", label: "Édition", Icon: Pencil },
    { id: "sheets", label: "Planches", Icon: LayoutGrid },
  ]

  return (
    <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
            value === id
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

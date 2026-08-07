import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// GitHub Pages sert le site depuis /<nom-du-depot>/ et non depuis la racine du
// domaine : sans `base`, les URL des assets pointeraient vers /assets/... et le
// site s'afficherait blanc. En dev on garde "/", sinon le serveur local
// repondrait lui aussi sur un sous-chemin.
const REPO = "dnd-card-generator"

export default defineConfig(({ command }) => ({
  base: command === "build" ? `/${REPO}/` : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
}))

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "@/App"
import "@/index.css"
// Importe apres index.css : les regles de carte doivent pouvoir surcharger le
// preflight de Tailwind, pas l'inverse.
import "@/styles/card.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

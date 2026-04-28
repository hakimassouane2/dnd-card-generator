import type { Spell } from "../types";

export const utilitySpells: Spell[] = [
  // ─── Fire Utility ───────────────────────────────────────────────────────────
  {
    id: "firebrand",
    name: { en: "Firebrand", fr: "Porte-flamme" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Touch", fr: "Contact" },
    range: { en: "Touch", fr: "Contact" },
    effects: {
      en: "Touch surface. Mark with symbol/message revealed by command word.",
      fr: "Touchez une surface. Marquez-la d'un symbole/message révélé par un mot de commande.",
    },
  },
  {
    id: "fire-step",
    name: { en: "Fire Step", fr: "Pas enflammé" },
    school: "utility",
    tier: 0,
    castingTime: 0,
    targetType: { en: "Self", fr: "Soi-même" },
    range: { en: "Self", fr: "Soi-même" },
    effects: {
      en: "1 minute casting time. Teleport to a fire source you can see.",
      fr: "1 minute de temps d'incantation. Téléportation vers une source de feu visible.",
    },
  },
  {
    id: "kindle",
    name: { en: "Kindle", fr: "Attiser" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Single Target", fr: "Cible unique" },
    range: { en: "Range 6", fr: "Portée 6" },
    effects: {
      en: "Conjure minor visual illusion OR ignite small unheld item.",
      fr: "Invoque une illusion visuelle mineure OU enflamme un petit objet non tenu.",
    },
  },

  // ─── Ice Utility ────────────────────────────────────────────────────────────
  {
    id: "ice-disk",
    name: { en: "Ice Disk", fr: "Disque de glace" },
    school: "utility",
    tier: 0,
    castingTime: 0,
    targetType: { en: "Self", fr: "Soi-même" },
    range: { en: "Self", fr: "Soi-même" },
    effects: {
      en: "1 minute casting time. Floating disk carries up to 250 lbs for 1 hour.",
      fr: "1 minute de temps d'incantation. Disque flottant transportant jusqu'à 115 kg pendant 1 heure.",
    },
  },
  {
    id: "chillcraft",
    name: { en: "Chillcraft", fr: "Artisanat glacial" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Self/Area", fr: "Soi-même/Zone" },
    range: { en: "Self", fr: "Soi-même" },
    effects: {
      en: "Freeze/thaw/move water OR conjure sheet of ice.",
      fr: "Geler/dégeler/déplacer de l'eau OU invoquer une plaque de glace.",
    },
  },
  {
    id: "wintry-scrying",
    name: { en: "Wintry Scrying", fr: "Vision hivernale" },
    school: "utility",
    tier: 0,
    castingTime: 0,
    targetType: { en: "Self", fr: "Soi-même" },
    range: { en: "Self", fr: "Soi-même" },
    effects: {
      en: "10 minutes casting time. Icy mirror shows desired location near same body of water.",
      fr: "10 minutes de temps d'incantation. Un miroir de glace montre l'endroit désiré près du même plan d'eau.",
    },
  },

  // ─── Lightning Utility ──────────────────────────────────────────────────────
  {
    id: "spark-buddy",
    name: { en: "Spark Buddy", fr: "Zapagnon" },
    school: "utility",
    tier: 0,
    castingTime: 0,
    targetType: { en: "Summon", fr: "Invocation" },
    range: { en: "Self", fr: "Soi-même" },
    effects: {
      en: "1 minute casting time. Tiny electrical helper for 1 hour, fetches objects/opens doors/illuminates.",
      fr: "1 minute de temps d'incantation. Petit assistant électrique pendant 1 heure, récupère des objets/ouvre des portes/éclaire.",
    },
  },
  {
    id: "spark-step",
    name: { en: "Spark Step", fr: "Foulétincelle" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Self", fr: "Soi-même" },
    range: { en: "Range 4", fr: "Portée 4" },
    effects: {
      en: "Teleport to a metal object within Range.",
      fr: "Téléportation vers un objet métallique dans la Portée.",
    },
  },
  {
    id: "tempests-command",
    name: { en: "Tempest's Command", fr: "Ordre de la tempête" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "N/A", fr: "N/A" },
    range: { en: "N/A", fr: "N/A" },
    effects: {
      en: "Dispel minor magical effect OR Voice of Thunder (amplified voice 1 min).",
      fr: "Dissipe un effet magique mineur OU Voix du tonnerre (voix amplifiée 1 min).",
    },
  },

  // ─── Wind Utility ───────────────────────────────────────────────────────────
  {
    id: "wind-whisper",
    name: { en: "Wind Whisper", fr: "Murmures dans le vent" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Single Target", fr: "Cible unique" },
    range: { en: "Range 100 miles", fr: "Portée 100 miles" },
    effects: {
      en: "Whisper message carried to specified target.",
      fr: "Un message murmuré est porté à la cible désignée.",
    },
  },
  {
    id: "helpful-gust",
    name: { en: "Helpful Gust", fr: "Rafale bienveillante" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Single Target", fr: "Cible unique" },
    range: { en: "Reach 6", fr: "Allonge 6" },
    effects: {
      en: "Move Tiny unheld item OR generate illusory scent.",
      fr: "Déplace un très petit objet non tenu OU génère une odeur illusoire.",
    },
  },
  {
    id: "feather-fall",
    name: { en: "Feather Fall", fr: "Feuille morte" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Single Target", fr: "Cible unique" },
    range: { en: "Reach 6", fr: "Allonge 6" },
    effects: {
      en: "Reaction: creature floats gently to ground.",
      fr: "Réaction : la créature flotte doucement jusqu'au sol.",
    },
  },

  // ─── Radiant Utility ────────────────────────────────────────────────────────
  {
    id: "light",
    name: { en: "Light", fr: "Lumière" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Touch", fr: "Contact" },
    range: { en: "Touch", fr: "Contact" },
    effects: {
      en: "Item glows as torch while held.",
      fr: "L'objet brille comme une torche tant qu'il est tenu.",
    },
  },
  {
    id: "beautify",
    name: { en: "Beautify", fr: "Embellissement" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Touch", fr: "Contact" },
    range: { en: "Touch", fr: "Contact" },
    effects: {
      en: "Clean stains/repair item OR conjure flowers/butterflies.",
      fr: "Nettoie les taches/répare un objet OU invoque des fleurs/papillons.",
    },
  },
  {
    id: "bond-of-peace",
    name: { en: "Bond of Peace", fr: "Lien de Paix" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Single Target", fr: "Cible unique" },
    range: { en: "Line of sight", fr: "Ligne de vue" },
    effects: {
      en: "Telepathic communication OR calming magic (advantage on soothing).",
      fr: "Communication télépathique OU magie apaisante (Avantage pour calmer).",
    },
  },

  // ─── Necrotic Utility ───────────────────────────────────────────────────────
  {
    id: "gravecraft",
    name: { en: "Gravecraft", fr: "Art funéraire" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Touch", fr: "Contact" },
    range: { en: "Touch", fr: "Contact" },
    effects: {
      en: "Gravemark (1 Action): mark soil surface. Gravework (1 min): shape earth.",
      fr: "Marque funéraire (1 Action) : marque la surface du sol. Façonnage (1 min) : modèle la terre.",
    },
  },
  {
    id: "false-face",
    name: { en: "False Face", fr: "Faux visage" },
    school: "utility",
    tier: 0,
    castingTime: 0,
    targetType: { en: "Self", fr: "Soi-même" },
    range: { en: "Self", fr: "Soi-même" },
    effects: {
      en: "1 minute casting time. Change appearance for 10 min (requires piece of target).",
      fr: "1 minute de temps d'incantation. Change d'apparence pendant 10 min (nécessite un morceau de la cible).",
    },
  },
  {
    id: "thought-leech",
    name: { en: "Thought Leech", fr: "Siphon de pensées" },
    school: "utility",
    tier: 0,
    castingTime: 1,
    targetType: { en: "Single Target", fr: "Cible unique" },
    range: { en: "Reach 6", fr: "Allonge 6" },
    effects: {
      en: "Read surface thoughts (creatures can sense it).",
      fr: "Lit les pensées de surface (les créatures peuvent le percevoir).",
    },
  },
];

/* ---------------------------------------------------------------------------
   Traductions
   ---------------------------------------------------------------------------
   Portees telles quelles depuis l'ancienne appli, avec les cles d'interface
   ajoutees ensuite.

   A noter : la langue ne pilote pas seulement l'interface, elle pilote aussi le
   texte imprime sur les cartes (badges de rang, libelles des statistiques). Le
   selecteur est donc etiquete "Langue des cartes", ce qui n'etait pas explicite
   auparavant et pretait a confusion.
--------------------------------------------------------------------------- */

export const LANGUAGES = ["french", "english"] as const
export type Language = (typeof LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<Language, string> = {
  french: "Français",
  english: "English",
}

const english = {
  // --- Contenu imprime sur les cartes ---
  item: "Item",
  item_name: "Name of the item",
  type: "Type",
  item_type: "Type of the item",
  item_details: "Details of the item",
  spell: "Spell",
  spell_name: "Name of the spell",
  spell_details: "Details of the spell",
  feature: "Feature",
  feature_name: "Name of the feature",
  feature_details: "Details of the feature",
  rarity: "Rarity",
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  artifact: "Artifact",
  element: "Element",
  element_aucun: "None",
  element_feu: "Fire",
  element_glace: "Ice",
  element_foudre: "Lightning",
  element_vent: "Wind",
  element_radiant: "Radiant",
  element_necrotique: "Necrotic",
  utility: "Utility",
  aoe: "AoE",
  level: "Tier",
  level_cantrip: "Cantrip",
  tier_label: "Tier",
  casting_time: "Cast time",
  casting_time_short: "Cast",
  casting_time_placeholder: "e.g. 1 action",
  range: "Range",
  range_placeholder: "e.g. Range 12 / Reach 1",
  damage: "Damage",
  damage_placeholder: "e.g. 2d6",
  damage_type: "Damage type",
  damage_type_placeholder: "e.g. fire",
  concentration: "Concentration",
  duration: "Duration",
  duration_placeholder: "e.g. 10 min",
  upcast: "At higher tiers",
  // Les tours de magie montent en puissance "aux niveaux superieurs", les sorts
  // a rang "aux rangs superieurs" : le libelle du bloc s'adapte au niveau.
  upcast_cantrip: "At higher levels",
  upcast_placeholder: "Effect at higher tiers (markdown)",
  feature_class: "Class",
  feature_class_placeholder: "e.g. Berserker",
  feature_subclass: "Subclass",
  feature_subclass_placeholder: "e.g. Path of Fury",
  feature_level: "Level",
  feature_level_placeholder: "e.g. 3",
  item_charges: "Charges",
  none: "None",
  card_type: "Card type",
  item_card: "Item",
  spell_card: "Spell",
  feature_card: "Class feature",
  color_override: "Border colour",
  color_override_placeholder: "#RRGGBB",
  color_override_reset: "Reset to default colour",
}

type Dict = typeof english

const french: Dict = {
  item: "Objet",
  item_name: "Nom de l'objet",
  type: "Type",
  item_type: "Type de l'objet",
  item_details: "Détails de l'objet",
  spell: "Sort",
  spell_name: "Nom du sort",
  spell_details: "Détails du sort",
  feature: "Aptitude",
  feature_name: "Nom de l'aptitude",
  feature_details: "Détails de l'aptitude",
  rarity: "Rareté",
  common: "Commun",
  uncommon: "Peu commun",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
  artifact: "Artéfact",
  element: "Élément",
  element_aucun: "Aucun",
  element_feu: "Feu",
  element_glace: "Glace",
  element_foudre: "Foudre",
  element_vent: "Vent",
  element_radiant: "Radiant",
  element_necrotique: "Nécrotique",
  utility: "Utilitaire",
  aoe: "Zone",
  level: "Niveau",
  level_cantrip: "Tour de magie",
  tier_label: "Rang",
  casting_time: "Temps d'incantation",
  casting_time_short: "Incantation",
  casting_time_placeholder: "ex. 1 action",
  range: "Portée",
  range_placeholder: "ex. Portée 12 / Allonge 1",
  damage: "Dégâts",
  damage_placeholder: "ex. 2d6",
  damage_type: "Type de dégâts",
  damage_type_placeholder: "ex. feu",
  concentration: "Concentration",
  duration: "Durée",
  duration_placeholder: "ex. 10 min",
  upcast: "Aux rangs supérieurs",
  upcast_cantrip: "Aux niveaux supérieurs",
  upcast_placeholder: "Effet aux rangs supérieurs (markdown)",
  feature_class: "Classe",
  feature_class_placeholder: "ex. Berserker",
  feature_subclass: "Sous-classe",
  feature_subclass_placeholder: "ex. Voie de la Fureur",
  feature_level: "Niveau",
  feature_level_placeholder: "ex. 3",
  item_charges: "Charges",
  none: "Aucune",
  card_type: "Type de carte",
  item_card: "Objet",
  spell_card: "Sort",
  feature_card: "Aptitude de classe",
  color_override: "Couleur de bordure",
  color_override_placeholder: "#RRGGBB",
  color_override_reset: "Revenir à la couleur par défaut",
}

export const translations: Record<Language, Dict> = { english, french }

export type TranslationKey = keyof Dict

export function makeT(language: Language) {
  const dict = translations[language]
  return (key: TranslationKey): string => dict[key]
}

export type T = ReturnType<typeof makeT>

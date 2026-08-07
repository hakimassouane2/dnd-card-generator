# Nimble Card Generator

Générateur de cartes de JdR imprimables sur A4 : objets, sorts et aptitudes de
classe, à raison de 9 cartes de 63,5 × 88,9 mm par planche.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # génère dist/, déployable en statique
```

## Organisation

```
src/
  lib/card.ts        Modèle de données et schéma sérialisé
  lib/fit-text.ts    Ajustement automatique de la taille du texte
  lib/presets.ts     Recensement des decks de json/
  store/useCards.ts  État de l'application (source de vérité unique)
  components/        Interface
  styles/card.css    Rendu de carte et impression — en millimètres
json/                Decks livrés avec l'application
legacy/              Version précédente, conservée pour référence
```

## Deux règles à connaître avant de modifier

**`src/styles/card.css` est en millimètres, et doit le rester.** C'est ce qui
garantit que la sortie imprimée correspond à des cartes de 63,5 × 88,9 mm quels
que soient le zoom et le DPI. Ne remplacez pas ces règles par des utilitaires
Tailwind : Tailwind travaille en rem/px et suit la taille de police du
navigateur, ce qui changerait les dimensions imprimées. Tailwind ne sert qu'à
l'interface autour de la carte.

**Le schéma JSON est figé.** `CardData` dans `src/lib/card.ts` reprend
exactement les noms de clés de la version précédente, pour que les fichiers de
`json/` et tous les exports déjà produits se rechargent sans conversion.
L'analyse est volontairement tolérante : un champ absent retombe sur sa valeur
par défaut plutôt que de rester `undefined`.

## Ajouter un deck à la bibliothèque

Déposez un `.json` dans `json/<langue>/<catégorie>/`, par exemple
`json/fr/spells/mon-deck-fr.json`. Il apparaît dans la bibliothèque sans autre
modification : `import.meta.glob` les recense à la compilation et les charge à
la demande.

Catégories reconnues : `spells`, `conditions`, `features`.

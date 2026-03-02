# Nova Productivité

Application web **ultra productive** en français, autonome (HTML/CSS/JS), pensée pour piloter la journée dans une seule interface.

## Fonctionnalités

- Focus du jour avec édition rapide.
- Gestion de tâches avec priorité, échéance, statut et suppression.
- Notes rapides horodatées.
- Timer Pomodoro (travail/pause) configurable.
- Gestion d’habitudes quotidiennes avec calcul de streak.
- Dashboard avec statistiques globales.
- Graphique hebdomadaire des sessions Pomodoro (canvas).
- Export/import JSON de toutes les données.
- Thème sombre/clair persistant.
- Raccourcis clavier (Alt+T, Alt+N, Alt+F, Alt+P).
- Persistance locale via `localStorage`.

## Lancer localement

```bash
python3 -m http.server 4173
```

Puis ouvrir `http://localhost:4173`.

## Structure

- `index.html` — interface principale.
- `styles.css` — design système + thèmes.
- `app.js` — logique applicative complète et persistance.


# Ops Hub Québec — Transbec DAI

Application HTML/CSS/JS multi-pages orientée opérations entrepôt (offline-first), avec navigation complète et logique liée entre modules:

- Dashboard unifié des sites.
- Inventaire palettes (ID `BE0000001`, scan, fermeture, historique, registre).
- Consolidation IA (imports manuels `SKU;BIN;QTY`, catégorisation rapports, section À valider).
- Remise en stock Laval mobile-first (ID `LAVREM0001`, scan par pièce, archivage).
- Paramètres (users locaux, KB IA locale, export annexes JSON).
- Preset profil Alexandre (chargement en 1 clic des préférences opérationnelles Québec).

## Lancer

```bash
python3 -m http.server 4173
```

Puis ouvrir `http://localhost:4173/index.html`.

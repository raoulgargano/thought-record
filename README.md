# Thought Record

Thought Record is an open-source, local-first Progressive Web App (PWA) for keeping a
personal thought diary based on the classic cognitive-behavioral thought record. Log a
situation, the thought it triggered, how much you believed it, how it made you feel and
how you reacted — then generate a clean, shareable weekly PDF summary.

No account. No server. No tracking. Everything you write stays on your device.

## Screenshots

> _Screenshots coming soon — add PNGs to `docs/screenshots/` and reference them here._

| Home | New record | History | Reports |
| ---- | ---------- | ------- | ------- |
| _tbd_ | _tbd_ | _tbd_ | _tbd_ |

## Features

- **Daily thought records** — situation, thought, belief level (0-10), one or more
  emotions with intensity (0-10), and behavior/reaction.
- **Home dashboard** — today's date, a quick "Nuevo registro" call to action, and a
  summary of this week's entries.
- **History** — records grouped by week (Monday–Sunday), week navigation, and a simple
  search across situation, thought and emotions.
- **Weekly PDF reports** — a clean A4 PDF with every field, generated entirely in the
  browser with [pdf-lib](https://github.com/Hopding/pdf-lib), correctly paginated and
  with wrapped text for long entries.
- **Share or download** — PDFs (and backups) use the Web Share API when available
  (including iOS Safari/PWA) and fall back to a direct download otherwise.
- **Local backup** — export all your records to a single JSON file and re-import it
  later (e.g. after clearing browser data or moving to a new device).
- **Installable PWA** — works offline after the first load, installable to your home
  screen/desktop, and respects your OS's light/dark theme.
- **Spanish UI** — the interface is in Spanish; source code and comments are in English
  to keep the codebase approachable for contributors.

## Privacy & local-first design

Thought Record is intentionally simple in its architecture:

- **No backend.** There is no server component at all.
- **No database service.** All data lives in your browser's IndexedDB, via
  [Dexie.js](https://dexie.org/).
- **No login, no accounts.** Nothing to sign up for, nothing to lose access to.
- **No analytics, no tracking, no third-party requests.** The app never calls any
  external API, and GitHub Pages only serves static files — it never sees your data.
- **GitHub only hosts the application.** This repository and its GitHub Pages
  deployment contain the compiled app (HTML/CSS/JS/icons) — never your thought
  records. Your entries never leave your device unless you explicitly export a backup
  or share/download a PDF yourself.
- Because IndexedDB can be cleared by the browser or the user, use **Ajustes →
  Exportar copia de seguridad** periodically to keep an external copy of your data.

## Technology stack

- [Angular 21](https://angular.dev/) (standalone components, TypeScript strict mode)
- [Ionic Angular](https://ionicframework.com/docs/angular/overview) for the mobile-first
  UI and navigation
- [Dexie.js](https://dexie.org/) over IndexedDB for local persistence
- [pdf-lib](https://github.com/Hopding/pdf-lib) for client-side PDF generation
- [date-fns](https://date-fns.org/) for date/week calculations
- Angular Service Worker (`@angular/pwa`) for offline support and installability
- [Vitest](https://vitest.dev/) for unit tests, [ESLint](https://eslint.org/) +
  [angular-eslint](https://github.com/angular-eslint/angular-eslint) for linting, and
  [Prettier](https://prettier.io/) for formatting

All dependencies are open source.

## Requirements

- Node.js `^20.19.0 || ^22.12.0 || >=24.0.0`
- npm 10+

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

This runs `ng serve` and serves the app at `http://localhost:4200/` with hot reload.

## Building

```bash
# Development build
npm run build

# Production build, pre-configured with the GitHub Pages base href
npm run build:prod
```

The production build is written to `dist/thought-record/browser`.

## Testing

```bash
npm test
```

Runs the Vitest-based unit test suite (via `ng test`). Tests cover week
(Monday–Sunday) calculations, thought record creation/update/deletion through the
IndexedDB repository (using `fake-indexeddb` in tests), PDF report data preparation
and PDF generation, backup export/import (including validation), and belief-level /
emotion-intensity validation.

## Linting & formatting

```bash
npm run lint          # ESLint (TypeScript + Angular templates)
npm run format        # Prettier — writes changes
npm run format:check  # Prettier — check only, no writes
```

## GitHub Pages deployment

Pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which installs
dependencies, lints, tests, builds the app for production with the correct base href
(`/thought-record/`), and deploys the result to GitHub Pages using the official
`actions/upload-pages-artifact` and `actions/deploy-pages` actions.

The production app is served at:

```
https://raoulgargano.github.io/thought-record/
```

To enable this for the first time, set the repository's **Settings → Pages → Source**
to **GitHub Actions**.

## Installing the PWA

- **Android / desktop Chrome/Edge:** open the site, then use the browser's "Install
  app" prompt or menu option.
- **iOS Safari:** open the site, tap the Share icon, then **Add to Home Screen**.

Once installed (or even just visited once), the app is fully usable offline — the
service worker caches the app shell, and all your data lives in IndexedDB on your
device.

## Backup, export and import

Your data is only ever stored in your browser. To avoid losing it if the browser data
is cleared:

1. Go to **Ajustes → Exportar copia de seguridad** to download a
   `thought-record-backup-YYYY-MM-DD.json` file with every record.
2. Go to **Ajustes → Importar copia de seguridad** to restore from a previously
   exported file. Records are merged by id: existing records with a matching id are
   updated, new ones are added — nothing is silently overwritten, and you'll always see
   a confirmation with the number of records found before importing.

## Project structure

```
src/app/
  core/
    database/     Dexie (IndexedDB) database definition
    models/       ThoughtRecord / EmotionEntry types and constants
    services/     Repository, PDF report, backup, file export, draft-persistence services
    utils/        Week/date helpers, validation helpers, id generation
  features/
    tabs/          Bottom tab navigation shell
    home/          Dashboard (today, quick add, this week's entries)
    record-form/   New/edit thought record form
    history/       Records grouped and browsable by week
    reports/       Weekly report list + PDF generation
    settings/      Backup export/import and privacy information
  shared/
    components/    Reusable presentational components (record card, empty state)

public/
  icons/           App icons — all PNG sizes are rendered from icons/icon.svg
  manifest.webmanifest
```

## App icon

`public/icons/icon.svg` is the source of truth for the app icon (a lotus on a
calm blue-to-teal gradient). The PNG sizes referenced by the web manifest, the
iOS `apple-touch-icon` and `favicon.ico` are all rendered from it, so editing
that one SVG and re-exporting the sizes is enough to rebrand the app.

## Contributing

Issues and pull requests are welcome. Please keep changes local-first and
dependency-light: no backend services, no analytics, no new required accounts. Before
opening a PR, please run:

```bash
npm run lint
npm test
npm run build:prod
```

## License

Thought Record is licensed under the [MIT License](./LICENSE).

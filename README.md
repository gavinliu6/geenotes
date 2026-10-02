# Geenotes

A simple, Markdown-first note-taking web app.

## Apps

- `apps/web` — the notes app
- `apps/www` — the public website (not started yet)

## Development

```bash
pnpm install
pnpm dev
```

Linting and formatting run from the repo root with `pnpm lint`, `pnpm format` and `pnpm check`. Everything else (build, deploy, database migrations) is a script in the app's own `package.json`.

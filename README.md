# BOM Comparison

Open-source browser app for comparing two Excel BOMs.

## Privacy Model

Your BOM files stay in your browser. This app does not upload BOM files to an application server, does not process BOMs server-side, and does not store comparison history in a database.

The active comparison exists only in browser memory. Refreshing or closing the tab clears uploaded workbook data, parsed BOM rows, comparison results, and generated report data.

The app may store non-BOM convenience preferences in browser local storage:

- recent column mapping preferences
- preferred report filters
- preferred match key

It does not store uploaded workbook bytes, parsed BOM rows, comparison results, or report bytes in local storage.

## Supported Files

Version 1 supports `.xlsx` files only. CSV, PDF, and `.xls` are not supported.

## User Flow

1. Upload the original BOM.
2. Select worksheet and header row.
3. Map columns and choose a match key.
4. Preview and confirm the original BOM.
5. Upload the new BOM.
6. Select worksheet and header row.
7. Map columns using the same match key selected for the original BOM.
8. Preview and confirm the new BOM.
9. View the report, adjust filters, and download an `.xlsx` report.

## Development

```bash
npm install
npm run dev
```

Run tests:

```bash
npm test
```

Run type-check lint:

```bash
npm run lint
```

Build static output:

```bash
npm run build
```

Preview the static build:

```bash
npm run preview
```

## GitHub Pages

The app builds to static files in `dist/` and is suitable for GitHub Pages.

The included workflow deploys on pushes to `main` or `master`. In GitHub, set Pages to use GitHub Actions as the source.

## License

MIT

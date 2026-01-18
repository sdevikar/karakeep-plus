
# Defragmenter Connectors — Quick Setup

## OneNote (Microsoft Graph)
- Use **delegated OAuth** (app-only auth is not supported for OneNote after Mar 31, 2025).
- Scopes: `Notes.Read`.
- Store tokens per user (encrypted-at-rest).
- Endpoints:
  - List notebooks: `/me/onenote/notebooks`
  - List sections: `/me/onenote/notebooks/{id}/sections`
  - List pages: `/me/onenote/sections/{section-id}/pages`
  - Get page content: `/me/onenote/pages/{page-id}/content`

## Google Keep
- **Workspace**: use official Keep API via `googleapis`.
- **Personal accounts**: use a small Python service wrapping `gkeepapi` (see `keep_personal_connector.py`).
- Labels -> categories; notes -> text + deep link.

## Google Sheets
- Use `googleapis` Sheets v4.
- Let users pick spreadsheets and sheet names; ingest A1 ranges (e.g. `Sheet1!A1:Z1000`).
- Deep link format:
  - `https://docs.google.com/spreadsheets/d/<spreadsheetId>/edit#gid=<gid>&range=<A1>`

## Indexing
- Normalize items into a common schema (`IndexedItem`).
- Index to **Meilisearch** for keyword + facets.
- Generate embeddings and store in **PGVector** for semantic RAG.

## Security
- Store OAuth tokens encrypted.
- Rate-limit connector calls; use exponential backoff on 429/5xx.
- Read-only by design: no write-back to sources.

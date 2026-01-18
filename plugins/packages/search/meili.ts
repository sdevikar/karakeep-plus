
import MeiliSearch from 'meilisearch';
import { IndexedItem } from '../connectors/types';

const client = new MeiliSearch({ host: process.env.MEILI_ADDR || 'http://localhost:7700' });
const index = client.index('defragment-items');

export async function indexToMeili(item: IndexedItem) {
  await index.addDocuments([item]);
}

export async function searchMeili(q: string, filters: any) {
  const resp = await index.search(q, {
    filter: buildFilterQuery(filters),
    limit: 50,
  });
  return resp.hits;
}

function buildFilterQuery(filters: any): string | undefined {
  const clauses: string[] = [];
  if (filters?.source) clauses.push(`source = ${filters.source}`);
  if (filters?.labels) clauses.push(`labels = ${JSON.stringify(filters.labels)}`);
  return clauses.length ? clauses.join(' AND ') : undefined;
}

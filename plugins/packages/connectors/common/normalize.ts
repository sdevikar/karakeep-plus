
import { IndexedItem } from '../types';

export function normalizeItem(raw: any, source: IndexedItem['source']): IndexedItem {
  if (source === 'onenote') {
    const title = raw.title || 'Untitled';
    const snippet = extractSnippetFromHtml(raw.html);
    return {
      id: raw.id,
      source,
      title,
      snippet,
      tags: [],
      labels: [raw.sectionName],
      link: raw.link,
      updated_at: raw.updated_at,
      metadata: {
        notebookId: raw.notebookId,
        sectionId: raw.sectionId,
      },
    };
  }
  if (source === 'keep') {
    return {
      id: raw.id,
      source,
      title: raw.title,
      snippet: raw.text.substring(0, 500),
      tags: [],
      labels: raw.labels,
      link: raw.link,
      updated_at: raw.updated_at,
    };
  }
  if (source === 'sheets') {
    return {
      id: raw.id,
      source,
      title: raw.title,
      snippet: raw.text.substring(0, 500),
      tags: [],
      labels: [raw.sheet],
      link: raw.link,
      updated_at: raw.updated_at,
      metadata: { range: raw.range },
    };
  }
  throw new Error(`Unknown source ${source}`);
}

function extractSnippetFromHtml(html: any): string {
  const text = typeof html === 'string' ? html : JSON.stringify(html);
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500);
}

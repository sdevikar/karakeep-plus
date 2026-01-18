
export type Scope =
  | { type: 'onenote-section'; notebookId: string; sectionId: string; name: string }
  | { type: 'keep-label'; labelId: string; name: string }
  | { type: 'sheet-range'; spreadsheetId: string; sheetName: string; rangeA1: string };

export interface IndexedItem {
  id: string;                // uuid-or-source-id
  source: 'onenote' | 'keep' | 'sheets';
  title: string;
  snippet: string;
  tags: string[];
  labels?: string[];
  link: string;              // deep link to original
  updated_at: string;        // ISO datetime
  embeddings_id?: string;
  metadata?: Record<string, any>;
}

export interface SourceConnector {
  listScopes(userId: string): Promise<Scope[]>;
  fetchDelta(since: Date | null, selectedScopes: Scope[]): AsyncIterable<any>; // raw items
}

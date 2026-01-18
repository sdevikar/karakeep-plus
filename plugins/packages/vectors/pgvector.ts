
import { Pool } from 'pg';
import { IndexedItem } from '../connectors/types';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'defrag',
  password: process.env.PGPASSWORD || 'defragpw',
  database: process.env.PGDATABASE || 'defragdb',
  port: Number(process.env.PGPORT || 5432),
});

// Ensure table exists (id TEXT PRIMARY KEY, embedding VECTOR(1536))
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_vectors (
      id TEXT PRIMARY KEY,
      source TEXT,
      embedding VECTOR(1536)
    );
  `);
}
ensureTable().catch(console.error);

export async function embedAndStore(item: IndexedItem) {
  const textForEmbedding = `${item.title}\n${item.snippet}`;
  const vec = await embedText(textForEmbedding); // Float32Array length 1536
  await pool.query(
    `INSERT INTO item_vectors (id, source, embedding)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET embedding = EXCLUDED.embedding`,
    [item.id, item.source, toPgVector(vec)]
  );
}

async function embedText(text: string): Promise<Float32Array> {
  // TODO: call Ollama or cloud LLM to get embedding; return Float32Array(1536)
  // Placeholder: random vector (DO NOT USE IN PROD)
  const arr = new Float32Array(1536);
  for (let i = 0; i < arr.length; i++) arr[i] = Math.random();
  return arr;
}

function toPgVector(vec: Float32Array): string {
  return `[${Array.from(vec).join(',')}]`;
}

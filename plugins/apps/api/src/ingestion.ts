
import { getNextJob } from './queue';
import { OneNoteConnector } from '../../packages/connectors/onenote/connector';
import { KeepConnector } from '../../packages/connectors/keep/connector';
import { SheetsConnector } from '../../packages/connectors/sheets/connector';
import { indexToMeili } from '../../packages/search/meili';
import { embedAndStore } from '../../packages/vectors/pgvector';
import { normalizeItem } from '../../packages/connectors/common/normalize';

async function runIngestionLoop() {
  console.log('[workers] Ingestion loop started');
  while (true) {
    const job = await getNextJob();
    if (!job) {
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }

    const { source, selectedScopes, userId } = job.payload;

    let connector;
    if (source === 'onenote') connector = new OneNoteConnector(userId);
    else if (source === 'keep') connector = new KeepConnector(userId);
    else if (source === 'sheets') connector = new SheetsConnector(userId);
    else throw new Error(`Unknown source: ${source}`);

    console.log(`[workers] Starting ingestion for ${source} user=${userId}`);

    for await (const rawItem of connector.fetchDelta(/*since*/ null, selectedScopes)) {
      const item = normalizeItem(rawItem, source);
      await indexToMeili(item);
      await embedAndStore(item);
    }

    console.log(`[workers] Completed ingestion for ${source} user=${userId}`);
  }
}

runIngestionLoop().catch(err => {
  console.error('[workers] Fatal error', err);
  process.exit(1);
});

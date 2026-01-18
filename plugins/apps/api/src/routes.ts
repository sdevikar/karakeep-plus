
import express from 'express';
import bodyParser from 'body-parser';
import { listScopesOneNote, listScopesKeep, listScopesSheets } from '../../packages/connectors/common/scopes';
import { enqueueIngestJob } from '../services/jobs';
import { searchMeili } from '../services/search';
import { askRAG } from '../services/qa';

const router = express.Router();
router.use(bodyParser.json());

// --- OAuth init/callbacks (stubbed) ---
router.get('/auth/google/oauth/init', (_req, res) => {
  // Redirect to Google OAuth screen for Sheets/Keep scopes
  res.json({ ok: true, hint: 'Redirect user to Google OAuth URL here.' });
});

router.get('/auth/google/oauth/callback', (_req, res) => {
  // Persist tokens; associate with user
  res.json({ ok: true });
});

router.get('/auth/microsoft/oauth/init', (_req, res) => {
  // Redirect to Microsoft OAuth (Graph)
  res.json({ ok: true, hint: 'Redirect user to Microsoft OAuth URL here.' });
});

router.get('/auth/microsoft/oauth/callback', (_req, res) => {
  // Persist tokens; associate with user
  res.json({ ok: true });
});

// --- List connected sources (stub) ---
router.get('/sources', (_req, res) => {
  res.json({ sources: ['onenote', 'keep', 'sheets'] });
});

// --- List selectable scopes per source ---
router.get('/sources/onenote/scopes', async (req, res) => {
  const userId = req.query.userId as string;
  const scopes = await listScopesOneNote(userId);
  res.json(scopes);
});

router.get('/sources/keep/scopes', async (req, res) => {
  const userId = req.query.userId as string;
  const scopes = await listScopesKeep(userId);
  res.json(scopes);
});

router.get('/sources/sheets/scopes', async (req, res) => {
  const userId = req.query.userId as string;
  const scopes = await listScopesSheets(userId);
  res.json(scopes);
});

// --- Enqueue ingestion ---
router.post('/ingest/jobs', async (req, res) => {
  const { source, selectedScopes, userId } = req.body;
  const jobId = await enqueueIngestJob({ source, selectedScopes, userId });
  res.json({ ok: true, jobId });
});

// --- Search & QA ---
router.get('/search', async (req, res) => {
  const q = (req.query.q as string) || '';
  const filters = req.query.filters || {};
  const hits = await searchMeili(q, filters);
  res.json({ hits });
});

router.post('/qa', async (req, res) => {
  const { question, userId } = req.body;
  const answer = await askRAG({ question, userId });
  res.json(answer);
});

export default router;
``

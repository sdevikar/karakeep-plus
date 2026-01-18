
import { google } from 'googleapis';
import { SourceConnector, Scope } from '../types';

function getOAuthClientForUser(userId: string) {
  // Retrieve OAuth tokens (Google) for this user; set credentials on OAuth2 client
  const oAuth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  // TODO: load tokens from secure storage
  // oAuth2.setCredentials({ access_token, refresh_token, expiry_date });
  return oAuth2;
}

export class KeepConnector implements SourceConnector {
  constructor(private userId: string) {}

  async listScopes(userId: string): Promise<Scope[]> {
    const auth = getOAuthClientForUser(userId);
    const keep = google.keep({ version: 'v1', auth });
    // List labels
    const resp = await keep.labels.list({ parent: 'users/me' } as any);
    const scopes: Scope[] = [];
    for (const label of resp.data.labels || []) {
      scopes.push({
        type: 'keep-label',
        labelId: label.name!, // typically "labels/123..."
        name: label.displayName || label.name!,
      });
    }
    return scopes;
  }

  async *fetchDelta(_since: Date | null, selectedScopes: Scope[]): AsyncIterable<any> {
    const auth = getOAuthClientForUser(this.userId);
    const keep = google.keep({ version: 'v1', auth });

    // Fetch ALL notes, filter by selected labels locally (Google Keep API offers limited filtering)
    const resp = await keep.notes.list({ parent: 'users/me' } as any);
    const selectedLabelIds = selectedScopes
      .filter(s => s.type === 'keep-label')
      .map(s => s.labelId);

    for (const note of resp.data.notes || []) {
      const labels = (note.labels || []).map(l => l.name);
      const hasSelected = labels.some(id => selectedLabelIds.includes(id!));
      if (!hasSelected) continue;

      yield {
        id: note.name, // "notes/abc123"
        title: note.title || 'Untitled',
        text: note.textContent?.text || '',
        labels,
        link: `https://keep.google.com/#note/${note.uid || ''}`, // may vary
        updated_at: note.updateTime,
      };
    }
  }
}

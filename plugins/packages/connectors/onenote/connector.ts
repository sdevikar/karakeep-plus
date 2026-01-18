
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { SourceConnector, Scope } from '../types';

async function getUserToken(userId: string): Promise<string> {
  // TODO: retrieve user's delegated access token from secure storage
  return process.env.MS_GRAPH_TEST_TOKEN || '';
}

function graphClient(accessToken: string) {
  return Client.init({
    authProvider: done => done(null, accessToken),
  });
}

export class OneNoteConnector implements SourceConnector {
  constructor(private userId: string) {}

  async listScopes(userId: string): Promise<Scope[]> {
    const token = await getUserToken(userId);
    const client = graphClient(token);
    // List notebooks + sections
    const notebooks = await client.api('/me/onenote/notebooks').get();
    const scopes: Scope[] = [];

    for (const nb of notebooks.value || []) {
      const sections = await client.api(`/me/onenote/notebooks/${nb.id}/sections`).get();
      for (const sec of sections.value || []) {
        scopes.push({
          type: 'onenote-section',
          notebookId: nb.id,
          sectionId: sec.id,
          name: `${nb.displayName} / ${sec.displayName}`,
        });
      }
    }
    return scopes;
  }

  async *fetchDelta(_since: Date | null, selectedScopes: Scope[]): AsyncIterable<any> {
    const token = await getUserToken(this.userId);
    const client = graphClient(token);

    for (const scope of selectedScopes) {
      if (scope.type !== 'onenote-section') continue;

      // Fetch pages with metadata; sort by lastModifiedTime
      const pages = await client.api(`/me/onenote/sections/${scope.sectionId}/pages`)
        .select('id,title,createdDateTime,lastModifiedDateTime,links')
        .orderby('lastModifiedDateTime desc')
        .top(100)
        .get();

      for (const page of pages.value || []) {
        // Fetch HTML content
        const html = await client.api(`/me/onenote/pages/${page.id}/content`).get();
        yield {
          id: page.id,
          title: page.title,
          html,
          link: page.links?.oneNoteClientUrl?.href || page.links?.oneNoteWebUrl?.href,
          updated_at: page.lastModifiedDateTime,
          notebookId: scope.notebookId,
          sectionId: scope.sectionId,
          sectionName: scope.name,
        };
      }
    }
  }
}

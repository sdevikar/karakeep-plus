
import { google } from 'googleapis';
import { SourceConnector, Scope } from '../types';

function getOAuthClientForUser(userId: string) {
  const oAuth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  // TODO: load tokens from secure storage
  return oAuth2;
}

export class SheetsConnector implements SourceConnector {
  constructor(private userId: string) {}

  async listScopes(userId: string): Promise<Scope[]> {
    const auth = getOAuthClientForUser(userId);
    const drive = google.drive({ version: 'v3', auth });
    const sheetsApi = google.sheets({ version: 'v4', auth });

    // List files of type spreadsheet
    const files = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name)',
      pageSize: 50,
    });

    const scopes: Scope[] = [];
    for (const file of files.data.files || []) {
      // For each spreadsheet, list sheet names
      const sheetMeta = await sheetsApi.spreadsheets.get({
        spreadsheetId: file.id!,
        includeGridData: false,
      });
      const sheetTitles =
        sheetMeta.data.sheets?.map(s => s.properties?.title).filter(Boolean) || [];

      // Create simple default ranges (entire sheet)
      for (const title of sheetTitles) {
        scopes.push({
          type: 'sheet-range',
          spreadsheetId: file.id!,
          sheetName: title!,
          rangeA1: `${title}!A1:Z1000`,
        });
      }
    }
    return scopes;
  }

  async *fetchDelta(_since: Date | null, selectedScopes: Scope[]): AsyncIterable<any> {
    const auth = getOAuthClientForUser(this.userId);
    const sheetsApi = google.sheets({ version: 'v4', auth });

    for (const scope of selectedScopes) {
      if (scope.type !== 'sheet-range') continue;

      const resp = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: scope.spreadsheetId,
        range: scope.rangeA1,
      });

      const values = resp.data.values || [];
      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        const rowText = row.join(' | ');
        yield {
          id: `${scope.spreadsheetId}:${scope.sheetName}:${i + 1}`,
          title: `${scope.sheetName} Row ${i + 1}`,
          text: rowText,
          link: `https://docs.google.com/spreadsheets/d/${scope.spreadsheetId}/edit#gid=0&range=${scope.rangeA1}`,
          updated_at: new Date().toISOString(), // Sheets API does not expose per-row modified time
          sheet: scope.sheetName,
          range: scope.rangeA1,
        };
      }
    }
  }
}

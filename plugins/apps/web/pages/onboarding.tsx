
import React, { useEffect, useState } from 'react';

type Scope = {
  type: string;
  name: string;
  [key: string]: any;
};

export default function Onboarding() {
  const [sources] = useState(['onenote', 'keep', 'sheets']);
  const [scopes, setScopes] = useState<Record<string, Scope[]>>({});
  const [selected, setSelected] = useState<Record<string, Scope[]>>({});

  async function loadScopes(source: string) {
    const resp = await fetch(`/api/sources/${source}/scopes`);
    const data = await resp.json();
    setScopes(s => ({ ...s, [source]: data }));
  }

  async function enqueue(source: string) {
    const resp = await fetch('/api/ingest/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        selectedScopes: selected[source] || [],
        userId: 'demo-user',
      }),
    });
    const data = await resp.json();
    alert(`Job enqueued: ${data.jobId}`);
  }

  const toggleScope = (source: string, scope: Scope) => {
    const current = selected[source] || [];
    const exists = current.find(s => JSON.stringify(s) === JSON.stringify(scope));
    const updated = exists ? current.filter(s => JSON.stringify(s) !== JSON.stringify(scope))
                           : [...current, scope];
    setSelected(s => ({ ...s, [source]: updated }));
  };

  useEffect(() => {
    sources.forEach(loadScopes);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Defragmenter Onboarding</h1>
      <p>Connect sources and select scopes to ingest.</p>

      {sources.map(source => (
        <div key={source} style={{ marginBottom: 24 }}>
          <h2>{source.toUpperCase()}</h2>
          <button onClick={() => loadScopes(source)}>Refresh scopes</button>
          <ul>
            {(scopes[source] || []).map(scope => (
              <li key={JSON.stringify(scope)}>
                <label>
                  <input
                    type="checkbox"
                    checked={(selected[source] || []).some(s => JSON.stringify(s) === JSON.stringify(scope))}
                    onChange={() => toggleScope(source, scope)}
                  />
                  {' '}{scope.name}
                </label>
              </li>
            ))}
          </ul>
          <button onClick={() => enqueue(source)}>Enqueue ingestion</button>
        </div>
      ))}
    </div>
  );
}

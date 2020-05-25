import { Client } from 'undici';

const algolia = new Client('https://latency-dsn.algolia.net');

export const search = (query: string, page = 0): Promise<Record<string, any>> =>
  new Promise((resolve, reject) =>
    algolia.request(
      {
        path:
          '/1/indexes/*/queries?x-algolia-api-key=6be0576ff61c053d5f9a3225e2a90f76&x-algolia-application-id=latency',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ indexName: 'ikea', params: `query=${query}&hitsPerPage=150&page=${page}` }],
        }),
      },
      (error: Error | undefined, { statusCode, body }: any) => {
        if (error || statusCode >= 400) {
          return reject(error);
        }
        body.setEncoding('utf8');
        let response = '';

        body.on('data', (chunk: string) => (response += chunk));
        body.on('end', () => resolve(response ? JSON.parse(response) : {}));
      },
    ),
  );

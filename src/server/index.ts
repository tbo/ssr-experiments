import fastify from 'fastify';
import pointOfView from 'point-of-view';
import handlebars from 'handlebars';
import fastifyStatic from 'fastify-static';
import path from 'path';
import { Client } from 'undici';

const algolia = new Client('https://latency-dsn.algolia.net');

const search = (query: string): Promise<string | undefined> =>
  new Promise((resolve, reject) =>
    algolia.request(
      {
        path:
          '/1/indexes/*/queries?x-algolia-api-key=6be0576ff61c053d5f9a3225e2a90f76&x-algolia-application-id=latency',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ indexName: 'ikea', params: `query=${query}&hitsPerPage=50` }] }),
      },
      (error: Error | undefined, { statusCode, body }: any) => {
        if (error || statusCode >= 400) {
          return reject(error);
        }
        body.setEncoding('utf8');
        let response = '';

        body.on('data', (chunk: string) => (response += chunk));
        body.on('end', () => resolve(response));
      },
    ),
  );

const app = fastify({ logger: false });

app
  .register(pointOfView, {
    engine: {
      handlebars,
    },
    options: {
      partials: {
        header: '/src/templates/header.hbs',
        footer: '/src/templates/footer.hbs',
      },
    },
  })
  .get('/', async (request, reply) => {
    let searchResult = undefined;
    if (request.query.query) {
      const response = await search(request.query.query);
      if (response) {
        searchResult = JSON.parse(response).results[0];
      }
    }
    reply.view('/src/templates/search.hbs', { query: request.query.query, searchResult });
  })
  .get('/examples', (_request, reply) => {
    setTimeout(() => reply.view('/src/templates/examples.hbs'), 500);
  })
  .register(fastifyStatic, { root: path.join(__dirname, '../assets') })
  .addHook('onSend', async (_request, reply, payload) => {
    if (reply.getHeader('Content-type')?.startsWith('text/html') && typeof payload === 'string') {
      return payload.replace('</body>', '<script src="/hybrid.js"></script></body>');
    }
    return payload;
  })
  .listen(3000)
  .catch(error => {
    app.log.error(error);
    process.exit(1);
  });

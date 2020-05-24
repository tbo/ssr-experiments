import fastify from 'fastify';
import pointOfView from 'point-of-view';
import handlebars from 'handlebars';
import fastifyStatic from 'fastify-static';
import path from 'path';
import { Client } from 'undici';
import { Stream } from 'stream';
import replaceStream from 'replacestream';
import compress from 'fastify-compress';
import multipart from 'fastify-multipart';
import StreamSSE from 'ssestream2';
import { readFileSync } from 'fs';
import Example from './components/example';
import { render } from './jsx';
import Category from './pages/category';

const timeTemplate = handlebars.compile(readFileSync('./src/templates/time.hbs', 'utf-8'));
const algolia = new Client('https://latency-dsn.algolia.net');

const getRange = (to: number) => [...Array(to).keys()];

const search = (query: string, page = 0): Promise<string | undefined> =>
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
        body.on('end', () => resolve(response));
      },
    ),
  );

const app = fastify({ logger: false });

app
  .addHook('preHandler', function (request, reply, next) {
    if (request.headers.accept?.startsWith('text/event-stream') && request.raw.url !== '/time') {
      reply.header('content-type', 'text/event-stream').code(204).send('');
      return;
    }
    next();
  })
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
  .register(compress)
  .register(multipart, { addToBody: true })
  .register(fastifyStatic, { root: path.join(__dirname, '../assets'), prefix: '/assets' })
  .get('/', async (request, reply) => {
    const { query } = request.query;
    const params: Record<string, any> = { query };
    if (query) {
      const activePage = Number(request.query.page) || 0;
      const response = await search(request.query.query, activePage);
      if (response) {
        params.searchResult = JSON.parse(response).results[0];
        const pages = params.searchResult.nbPages;
        if (pages > 0) {
          params.pages = getRange(pages).map((page) => ({
            active: activePage === page,
            label: page + 1,
            url: `/?query=${query}&page=${page}`,
          }));
        }
      }
    }
    reply.view('/src/templates/search.hbs', params);
  })
  .get('/test', async (request, reply) => {
    return render(Example(), { request, reply });
  })
  .get('/products/:category', async (request, reply) => {
    return render(Category(), { request, reply });
  })
  .get('/post-search', (_request, reply) => {
    reply.view('/src/templates/post-search.hbs');
  })
  .post('/post-search', async (request, reply) => {
    const { query } = request.body;
    const params: Record<string, any> = { query };
    if (query) {
      const response = await search(query);
      if (response) {
        params.searchResult = JSON.parse(response).results[0];
      }
    }
    reply.view('/src/templates/post-search.hbs', params);
  })
  .get('/time', (request, reply) => {
    const getParams = () => ({ time: new Date() });
    if (request.headers.accept.startsWith('text/event-stream')) {
      reply.header('content-type', 'text/event-stream');
      const sse = new StreamSSE(request.raw, {
        'Access-Control-Allow-Origin': '*',
      });
      setInterval(
        () =>
          sse.write({
            data: timeTemplate(getParams()),
          }),
        1000,
      );
      sse.pipe(reply.res);
    } else {
      reply.view('/src/templates/time.hbs', getParams());
    }
  })
  .addHook('onSend', async (_request, reply, payload) => {
    if (reply.getHeader('Content-type')?.startsWith('text/html')) {
      const inject = '<script src="/assets/hybrid.js"></script>';
      reply.removeHeader('content-length');
      if (typeof payload === 'string') {
        return payload.replace('</body>', inject + '</body>');
      } else if (payload instanceof Stream) {
        return payload.pipe(replaceStream('</body>', inject + '</body>'));
      }
    }
    return payload;
  })
  .listen(3000)
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });

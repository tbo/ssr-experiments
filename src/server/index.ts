import fastify from 'fastify';
import pointOfView from 'point-of-view';
import handlebars from 'handlebars';
import fastifyStatic from 'fastify-static';
import path from 'path';
import { Stream } from 'stream';
import replaceStream from 'replacestream';
import compress from 'fastify-compress';
import multipart from 'fastify-multipart';
import StreamSSE from 'ssestream2';
import { readFileSync } from 'fs';
import Example from './components/example';
import { render } from './jsx';
import Category from './pages/category';
import { search } from './utilities/algolia';
import fastifyErrorPage from 'fastify-error-page';

const timeTemplate = handlebars.compile(readFileSync('./src/templates/time.hbs', 'utf-8'));

const getRange = (to: number) => [...Array(to).keys()];

const app = fastify({ logger: true });

app
  .addHook('preHandler', function (request, reply, next) {
    if (request.headers.accept?.startsWith('text/event-stream') && request.raw.url !== '/time') {
      reply.header('content-type', 'text/event-stream').code(204).send('');
      return;
    }
    next();
  })
  .register(fastifyErrorPage)
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
        params.searchResult = response.results[0];
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
    return render(Example, { request, reply });
  })
  .get('/products/:category', async (request, reply) => {
    return render(Category, { request, reply });
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
      (sse as any).pipe(reply.res);
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

import fastify from 'fastify';
import pointOfView from 'point-of-view';
import handlebars from 'handlebars';
import fastifyStatic from 'fastify-static';
import path from 'path';

const app = fastify({ logger: true });

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
  .get('/', (request, reply) => {
    reply.view('/src/templates/search.hbs', { query: request.query.query });
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

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
  .get('/', async (_request, reply) => reply.view('/src/templates/search.hbs'))
  .get('/examples', async (_request, reply) => reply.view('/src/templates/examples.hbs'))
  .register(fastifyStatic, { root: path.join(__dirname, '../assets') })
  .listen(3000)
  .catch(error => {
    app.log.error(error);
    process.exit(1);
  });

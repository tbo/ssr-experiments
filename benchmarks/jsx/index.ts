import fastify from 'fastify';
import { render } from '../../src/server/jsx';
import Page from './page';

fastify()
  .get('/', async (request, reply) => {
    reply.header('content-type', 'text/html');
    return render(Page, { request, reply });
  })
  .listen(3001);

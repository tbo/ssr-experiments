import fastify from "fastify";
const app = fastify({ logger: true });

app
  .get("/", async (request, reply) => ({ hello: "world" }))
  .listen(3000)
  .catch(error => {
    app.log.error(error);
    process.exit(1);
  });

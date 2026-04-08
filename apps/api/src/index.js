const { createApp } = require("./app");

const port = process.env.API_PORT ? Number(process.env.API_PORT) : 8787;

createApp()
  .then((app) => {
    app.listen(port, () => {
      console.log(`[api] listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("[api] failed to start:", err);
    process.exit(1);
  });


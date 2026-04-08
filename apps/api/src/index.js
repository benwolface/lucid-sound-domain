const { createApp } = require("./app");

const port = process.env.API_PORT ? Number(process.env.API_PORT) : 8787;

try {
  const app = createApp();
  // Bind explicitly to localhost; some sandboxes disallow binding on 0.0.0.0.
  app.listen(port, "127.0.0.1", () => {
    console.log(`[api] listening on http://localhost:${port}`);
  });
} catch (err) {
  console.error("[api] failed to start:", err);
  process.exit(1);
}


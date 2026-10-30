import { app } from "./app.js";
import { env } from "./config/env.js";

const host = "127.0.0.1";

const server = app.listen(env.PORT, host, () => {
  console.log(`API disponible sur http://${host}:${env.PORT}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Le port ${env.PORT} est déjà utilisé.`);
  } else {
    console.error("Impossible de démarrer le serveur.");
  }

  process.exit(1);
});
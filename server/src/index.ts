import express from "express";

const app = express();

const host = "127.0.0.1";
const port = 3001;

app.disable("x-powered-by");

app.get("/", (_request, response) => {
  response.json({
    message: "Personal Financial API is running."
  });
});

const server = app.listen(port, host, () => {
  console.log(`API disponible sur http://${host}:${port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Le port ${port} est déjà utilisé.`);
  } else {
    console.error("Impossible de démarrer le serveur.");
  }

  process.exit(1);
});
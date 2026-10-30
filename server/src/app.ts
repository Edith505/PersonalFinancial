import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { healthRouter } from "./routes/health.routes.js";
import { AppError } from "./utils/AppError.js";

export const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    strictTransportSecurity: false,
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests: null,
      },
    },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (origin === undefined || origin === env.FRONTEND_ORIGIN) {
        callback(null, true);
        return;
      }

      callback(
        new AppError(
          403,
          "ORIGIN_NOT_ALLOWED",
          "Cette origine n’est pas autorisée.",
        ),
      );
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  }),
);

app.use(express.json({ limit: "32kb" }));

app.use("/api", (_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/", (_request, response) => {
  response.json({
    message: "Personal Financial API is running.",
  });
});

app.use("/api/health", healthRouter);

app.use((_request, _response, next) => {
  next(
    new AppError(
      404,
      "ROUTE_NOT_FOUND",
      "La route demandée n’existe pas.",
    ),
  );
});

app.use(errorHandler);
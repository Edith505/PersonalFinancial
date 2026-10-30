import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  const parserErrorType =
    typeof error === "object" && error !== null && "type" in error
      ? error.type
      : undefined;

  if (parserErrorType === "entity.parse.failed") {
    response.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Le corps JSON de la requête est invalide.",
      },
    });
    return;
  }

  if (parserErrorType === "entity.too.large") {
    response.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "La requête dépasse la taille autorisée.",
      },
    });
    return;
  }

  console.error("[API] Erreur interne non traitée.");

  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Une erreur interne est survenue.",
    },
  });
};
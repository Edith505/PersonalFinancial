import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

const demoUserId = `c${String(1).padStart(24, "0")}`;

export async function getCurrentUserId(): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: demoUserId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(
      503,
      "DEMO_USER_NOT_READY",
      "L’utilisateur de démonstration n’est pas initialisé.",
    );
  }

  return user.id;
}
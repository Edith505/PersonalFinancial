import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { CreateProfileInput, ListProfilesQuery } from "../validators/profile.validator.js";

const profileSelect = {
  id: true, name: true, description: true, isActive: true,
} satisfies Prisma.FinancialProfileSelect;

export async function listProfiles(userId: string, query: ListProfilesQuery) {
  const where: Prisma.FinancialProfileWhereInput = {
    userId,
    ...(query.status ? { isActive: query.status === "ACTIVE" } : {}),
  };
  return prisma.$transaction(async (tx) => {
    const total = await tx.financialProfile.count({ where });
    const items = await tx.financialProfile.findMany({
      where,
      select: profileSelect,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return {
      items,
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  });
}

export async function createProfile(userId: string, input: CreateProfileInput) {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.financialProfile.create({
      data: { userId, name: input.name, description: input.description ?? null, isActive: true },
      select: profileSelect,
    });
    await tx.auditLog.create({
      data: { userId, action: "CREATE", entityType: "FINANCIAL_PROFILE", entityId: profile.id },
    });
    return profile;
  });
}

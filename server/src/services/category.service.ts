import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
} from "../validators/category.validator.js";

const categorySelect = {
  id: true,
  name: true,
  type: true,
  isActive: true,
} satisfies Prisma.CategorySelect;

export async function listCategories(
  userId: string,
  query: ListCategoriesQuery,
) {
  const where: Prisma.CategoryWhereInput = {
    userId,
    ...(query.type ? { type: query.type } : {}),
  };

  return prisma.$transaction(async (tx) => {
    const total = await tx.category.count({ where });

    const items = await tx.category.findMany({
      where,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: categorySelect,
    });

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  });
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          userId,
          name: input.name,
          type: input.type,
          isActive: true,
        },
        select: categorySelect,
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "CREATE",
          entityType: "CATEGORY",
          entityId: category.id,
        },
      });

      return category;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "CATEGORY_ALREADY_EXISTS",
        "Une catégorie de ce type porte déjà ce nom.",
      );
    }

    throw error;
  }
}
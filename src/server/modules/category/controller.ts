import { prisma } from "../../prisma/db";
import type { TCategory } from "../../types/common.type";
import { AppError, BadRequestError } from "../../utils/error";
import { renderHtmlPart } from "../../utils/renderPage";

class Categories {
  async getAllCategories(userId: string, type?: TCategory["type"]) {
    try {
      const categories = await prisma.category.findMany({
        where: { user_id: userId, ...(type ? { type } : {}) },
        orderBy: [
          { sort: { sort: "asc", nulls: "last" } },
          { name: "asc" },
          { id: "asc" },
        ],
      });
      return categories;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch categories");
    }
  }

  async renderOptions(userId: string, type: TCategory["type"]) {
    const data = await this.getAllCategories(userId, type);
    return await renderHtmlPart(
      { clientPath: "views/partials/common/", name: "optionsList" },
      { data },
    );
  }

  async createCategory(data: Omit<TCategory, "id">, userId: string) {
    try {
      const category = await prisma.category.create({
        data: {
          name: data.name,
          type: data.type,
          user_id: userId,
        },
      });
      return category;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to create category");
    }
  }

  async deleteCategory(categoryId: string, userId: string) {
    try {
      await prisma.category.delete({
        where: { id: categoryId, user_id: userId },
      });
      return { message: "Category deleted successfully" };
    } catch (error: any) {
      throw new AppError(error.message || "Failed to delete category");
    }
  }

  async updateNameCategory(
    categoryId: string,
    userId: string,
    newName: string,
  ) {
    try {
      const result = await prisma.category.update({
        where: { id: categoryId, user_id: userId },
        data: { name: newName },
      });
      return result;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to update category");
    }
  }

  async changeSort(
    categoryIds: string[],
    type: TCategory["type"],
    userId: string,
  ) {
    if (!Array.isArray(categoryIds)) {
      throw new BadRequestError("categoryIds must be an array");
    }
    if (type !== "income" && type !== "expense") {
      throw new BadRequestError("Invalid category type");
    }
    if (categoryIds.some((id) => typeof id !== "string" || !id)) {
      throw new BadRequestError("Every category id must be a non-empty string");
    }
    if (new Set(categoryIds).size !== categoryIds.length) {
      throw new BadRequestError("categoryIds must not contain duplicates");
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const categories = await tx.category.findMany({
          where: { user_id: userId, type },
          select: { id: true },
        });
        const existingIds = new Set(categories.map((category) => category.id));

        if (
          categories.length !== categoryIds.length ||
          categoryIds.some((id) => !existingIds.has(id))
        ) {
          throw new BadRequestError(
            "categoryIds must contain all categories of the selected type",
          );
        }

        await Promise.all(
          categoryIds.map((id, sort) =>
            tx.category.update({
              where: { id, user_id: userId, type },
              data: { sort },
            }),
          ),
        );

        return tx.category.findMany({
          where: { user_id: userId, type },
          orderBy: [{ sort: "asc" }, { name: "asc" }, { id: "asc" }],
        });
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || "Failed to change category sort");
    }
  }
}

export const categoryController = new Categories();

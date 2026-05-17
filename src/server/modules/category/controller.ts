import { prisma } from "../../prisma/db";
import type { TCategory } from "../../types/common.type";
import { AppError } from "../../utils/error";
import { renderHtmlPart } from "../../utils/renderPage";

class Categories {
  async getAllCategories(userId: string, type?: TCategory["type"]) {
    try {
      const categories = await prisma.category.findMany({
        where: { user_id: userId, ...(type ? { type } : {}) },
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
}

export const categoryController = new Categories();

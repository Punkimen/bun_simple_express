import { prisma } from "../../db/db";
import type { TCategory } from "../../types/common.type";
import { AppError } from "../../utils/error";
import { renderHtmlPart } from "../../utils/renderPage";

class Categories {
  async getAllCategories(type?: TCategory["type"]) {
    try {
      const categories = await prisma.category.findMany({
        where: type ? { type } : undefined,
      });
      return categories;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch categories");
    }
  }

  async renderOptions(type: TCategory["type"]) {
    const data = await this.getAllCategories(type);
    return await renderHtmlPart(
      { clientPath: "views/partials/common/", name: "optionsList" },
      { data },
    );
  }

  async createCategory(data: Omit<TCategory, "id">) {
    try {
      const category = await prisma.category.create({
        data: {
          name: data.name,
          type: data.type,
        },
      });
      return category;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to create category");
    }
  }

  async deleteCategory(categoryId?: string) {
    if (!categoryId) {
      throw new AppError("Category ID is required");
    }
    try {
      await prisma.category.delete({ where: { id: categoryId } });
      return { message: "Category deleted successfully" };
    } catch (error: any) {
      throw new AppError(error.message || "Failed to delete category");
    }
  }

  async updateNameCategory(categoryId?: string, newName?: string) {
    if (!categoryId || !newName) {
      throw new AppError("Category ID and new name are required");
    }
    try {
      const result = await prisma.category.update({
        where: { id: categoryId },
        data: { name: newName },
      });
      return result;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to update category");
    }
  }
}

export const categoryController = new Categories();

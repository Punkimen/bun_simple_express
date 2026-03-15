import db from "../../db/db";
import type { TCategory } from "../../types/common.type";
import { AppError } from "../../utils/error";
import { v4 as uuidv4 } from "uuid";

class Categories {
  async getAllCategories() {
    try {
      const categories = await db`SELECT * FROM categories`;

      return categories;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch categories");
    }
  }

  async createCategory(data: Omit<TCategory, "id">) {
    const newCategory = {
      id: uuidv4(),
      ...data,
    };

    try {
      const category =
        await db`INSERT INTO categories (id, name, type) VALUES (${newCategory.id}, ${newCategory.name}, ${newCategory.type})  RETURNING *`;

      if (!category[0]) {
        throw new AppError("Failed to create category");
      }

      return category[0];
    } catch (error: any) {
      throw new AppError(error.message || "Failed to create category");
    }
  }

  async deleteCategory(categoryId?: string) {
    if (!categoryId) {
      throw new AppError("Category ID is required");
    }

    try {
      const result =
        await db`DELETE FROM categories WHERE id = ${categoryId} RETURNING *`;

      if (!result[0]) {
        throw new AppError("Category not found");
      }

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
      const result =
        await db`UPDATE categories SET name = ${newName} WHERE id = ${categoryId} RETURNING *`;

      if (!result[0]) {
        throw new AppError("Category not found");
      }

      return result[0];
    } catch (error: any) {
      throw new AppError(error.message || "Failed to update category");
    }
  }
}

export const categoryController = new Categories();

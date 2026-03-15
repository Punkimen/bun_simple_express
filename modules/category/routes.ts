import type { AppMethods } from "../../app";
import type { TCategory } from "../../types/common.type";
import { categoryController } from "./contoller";

export const initCategoryRoutes = (app: AppMethods) => {
  app.methodGet("/api/category", async (req) => {
    return categoryController.getAllCategories();
  });

  app.methodPost<Omit<TCategory, "id">>("/api/category", async (req) => {
    const newCategory = await req.json();
    console.log({ newCategory });
    return categoryController.createCategory(newCategory);
  });

  app.methodDelete<{ id: TCategory["id"] }>("/api/category/:id", async (req) => {
    const { id } = req.params;
    return categoryController.deleteCategory(id);
  });

  app.methodPut<{ name: string }>("/api/category/:id", async (req) => {
    const { id } = req.params;
    const { name } = await req.json();
    return categoryController.updateNameCategory(id, name);
  });
};

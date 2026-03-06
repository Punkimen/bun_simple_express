import type { AppMethods } from "../../app";
import type { TCategory } from "../../types/common.type";
import { categoryController } from "./contoller";

export const initCategoryRoutes = (app: AppMethods) => {
  app.methodGet("/categories/:userId", async (req) => {
    const { userId } = req.params;
    return categoryController.getAllUsersCategories(Number(userId));
  });

  app.methodPost<Omit<TCategory, "id">>("/category", async (req) => {
    const newCategory = await req.json();
    console.log({ newCategory });
    return categoryController.createCategory(newCategory);
  });

  app.methodDelete<{ id: TCategory["id"] }>("/category/:id", async (req) => {
    const { id } = req.params;
    return categoryController.deleteCategory(id);
  });

  app.methodPut<{ name: string }>("/category/:id", async (req) => {
    const { id } = req.params;
    const { name } = await req.json();
    return categoryController.updateNameCategory(id, name);
  });
};

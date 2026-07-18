import type { AppMethods } from "../../app";
import type { TCategory } from "../../types/common.type";
import { categoryController } from "./controller";
import { renderHtmlPart } from "../../utils/renderPage";
import { getUserId } from "../../utils/getUserId.ts";
import { NotFoundError } from "../../utils/error.ts";

export const initCategoryRoutes = (app: AppMethods) => {
  app.methodGet("/api/category", async (req) => {
    const userId = getUserId(req);
    return categoryController.getAllCategories(userId);
  });

  app.methodHtml("/api/renderOptions", (req) => {
    const userId = getUserId(req);
    const url = new URL(req.url);
    const type = url.searchParams.get("type") as TCategory["type"];
    return categoryController.renderOptions(userId, type);
  });

  app.methodHtml("/api/renderCategoryList", async (req) => {
    const userId = getUserId(req);
    const url = new URL(req.url);
    const type = url.searchParams.get("type") as TCategory["type"];
    const data = await categoryController.getAllCategories(userId, type);
    return renderHtmlPart(
      { clientPath: "views/partials/category/", name: "categoryList" },
      { data },
    );
  });

  app.methodPost<Omit<TCategory, "id">>("/api/category", async (req) => {
    const userId = getUserId(req);
    const result = await req.json();
    const category = await categoryController.createCategory(result, userId);
    return new Response(JSON.stringify(category), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "categoryChanged",
      },
    });
  });

  app.methodDelete<{ id: TCategory["id"] }>(
    "/api/category/:id",
    async (req) => {
      const userId = getUserId(req);
      const { id } = req.params;
      if (!id) throw new NotFoundError("id is not found");
      const result = await categoryController.deleteCategory(id, userId);
      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "HX-Trigger": "categoryChanged",
        },
      });
    },
  );

  app.methodPut<{ name: string }>("/api/category/:id", async (req) => {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!id) throw new NotFoundError("id is not found");
    const { name } = await req.json();
    const result = await categoryController.updateNameCategory(id, userId, name);
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "categoryChanged",
      },
    });
  });
};

import type { AppMethods } from "../../app";
import type { TCategory } from "../../types/common.type";
import { categoryController } from "./contoller";
import { renderHtmlPart } from "../../utils/renderPage";

export const initCategoryRoutes = (app: AppMethods) => {
  app.methodGet("/api/category", async () => {
    return categoryController.getAllCategories();
  });

  app.methodHtml("/api/renderOptions", (req) => {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") as TCategory["type"];
    return categoryController.renderOptions(type);
  });

  app.methodHtml("/api/renderCategoryList", async (req) => {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") as TCategory["type"];
    const data = await categoryController.getAllCategories(type);
    return renderHtmlPart(
      { clientPath: "views/partials/category/", name: "categoryList" },
      { data },
    );
  });

  app.methodPost<Omit<TCategory, "id">>("/api/category", async (req) => {
    const result = await req.json();
    const category = await categoryController.createCategory(result);
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
      const { id } = req.params;
      const result = await categoryController.deleteCategory(id);
      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "HX-Trigger": "categoryChanged",
        },
      });
    },
  );

  app.methodPut<{ name: string }>("/api/category/:id", async (req) => {
    const { id } = req.params;
    const { name } = await req.json();
    return categoryController.updateNameCategory(id, name);
  });
};

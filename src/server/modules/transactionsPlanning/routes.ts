import type { AppMethods } from "../../app";
import type { TTransactionPlanning } from "../../types/common.type";
import { NotFoundError } from "../../utils/error.ts";
import { renderHtmlPart } from "../../utils/renderPage";
import { getUserId } from "../../utils/getUserId.ts";
import { categoryController } from "../category/controller.ts";
import { transactionController } from "../transactions/controller.ts";
import { transactionPlanningController } from "./controller.ts";

export const initTransactionPlanningRoutes = (app: AppMethods) => {
  app.methodHtml("/api/renderStatistics", async (req) => {
    const userId = getUserId(req);
    const url = new URL(req.url);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");
    const selectedCategories = url.searchParams.getAll("categories");

    const year = yearParam ? Number(yearParam) : currentYear;
    const month = monthParam ? Number(monthParam) : currentMonth;

    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const allCategories = await categoryController.getAllCategories(userId);
    const filteredCategories =
      selectedCategories.length > 0
        ? allCategories.filter((c) => selectedCategories.includes(c.id))
        : allCategories;

    const [actualTransactions, planningRecords] = await Promise.all([
      transactionController.getTransaction(userId, {
        year: String(year),
        month: String(month),
      }),
      transactionPlanningController.getPlanning(userId, { year, month }),
    ]);

    const actualByCategory: Record<string, number> = {};
    for (const t of actualTransactions) {
      if (t.category_id) {
        actualByCategory[t.category_id] =
          (actualByCategory[t.category_id] || 0) + t.amount;
      }
    }

    const planningByCategory: Record<
      string,
      { id: string; amount: number; note?: string }
    > = {};
    for (const p of planningRecords) {
      if (p.category_id) {
        planningByCategory[p.category_id] = {
          id: p.id,
          amount: p.amount,
          note: p.note,
        };
      }
    }

    const rows = filteredCategories.map((cat) => ({
      category_id: cat.id,
      category_name: cat.name,
      type: cat.type,
      actual: actualByCategory[cat.id] || 0,
      planned: planningByCategory[cat.id]?.amount || 0,
      planning_id: planningByCategory[cat.id]?.id || null,
      planning_note: planningByCategory[cat.id]?.note || "",
    }));

    return renderHtmlPart(
      { clientPath: "views/partials/statistics/", name: "statisticsContent" },
      {
        rows,
        year,
        month,
        years,
        allCategories,
        selectedCategories,
        currentYear,
        currentMonth,
      },
    );
  });

  app.methodGet("/api/transaction-planning", async (req) => {
    const userId = getUserId(req);
    const url = new URL(req.url);
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");
    return transactionPlanningController.getPlanning(userId, {
      year: yearParam ? Number(yearParam) : null,
      month: monthParam ? Number(monthParam) : null,
    });
  });

  app.methodPost<Omit<TTransactionPlanning, "id">>(
    "/api/transaction-planning",
    async (req) => {
      const userId = getUserId(req);
      const data = await req.json();
      const result = await transactionPlanningController.createPlanning(
        data,
        userId,
      );
      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "HX-Trigger": "planningCreated",
        },
      });
    },
  );

  app.methodPut<Partial<Omit<TTransactionPlanning, "id">>>(
    "/api/transaction-planning/:id",
    async (req) => {
      const userId = getUserId(req);
      const { id } = req.params;
      if (!id) throw new NotFoundError("ID is not found");
      const data = await req.json();
      const result = await transactionPlanningController.updatePlanning(
        data,
        userId,
        id,
      );
      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "HX-Trigger": "planningCreated",
        },
      });
    },
  );

  app.methodDelete("/api/transaction-planning/:id", async (req) => {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!id) throw new NotFoundError("ID is not found");
    const result = await transactionPlanningController.deletePlanning(
      id,
      userId,
    );
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "planningCreated",
      },
    });
  });
};

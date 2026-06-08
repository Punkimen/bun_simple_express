import type { AppMethods } from "../../app";
import type { TTransaction } from "../../types/common.type";
import { NotFoundError } from "../../utils/error.ts";
import { renderHtmlPart } from "../../utils/renderPage";
import { categoryController } from "../category/controller.ts";
import { transactionController } from "./controller.ts";
import { getUserId } from "../../utils/getUserId.ts";

export const initTransactionsRoutes = (app: AppMethods) => {
  app.methodHtml("/api/renderTransactions", async (req) => {
    const userId = getUserId(req);
    const url = new URL(req.url);
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = String(now.getMonth() + 1);

    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");
    const categories = url.searchParams.getAll("categories");

    const year = yearParam === null ? currentYear : yearParam || null;
    const month = monthParam === null ? currentMonth : monthParam || null;

    const filters = { year, month, categories };

    const [data, years, allCategories] = await Promise.all([
      transactionController.getTransaction(userId, filters),
      transactionController.getTransactionYears(userId),
      categoryController.getAllCategories(userId),
    ]);

    return renderHtmlPart(
      { clientPath: "views/partials/transaction/", name: "transactionsList" },
      { data, filters, years, allCategories, currentYear, currentMonth },
    );
  });

  app.methodGet("/transaction", (req) =>
    transactionController.getTransaction(getUserId(req)),
  );

  app.methodPost<Omit<TTransaction, "id">>("/api/transaction", async (req) => {
    const userId = getUserId(req);
    const newTransaction = await req.json();
    const result = await transactionController.createTransaction(
      newTransaction,
      userId,
    );

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "transactionCreated",
      },
    });
  });

  app.methodDelete("/api/transaction/:id", async (req) => {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!id) {
      throw new NotFoundError("id is no found");
    }
    const result = await transactionController.deleteTransaction(id, userId);
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "transactionCreated",
      },
    });
  });

  app.methodPut<
    { id: TTransaction["id"] } & Partial<Omit<TTransaction, "id" | "userId">>
  >("/api/transaction/:id", async (req) => {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!id) throw new NotFoundError("id is not found");
    const updateData = await req.json();
    const result = await transactionController.updateTransaction(
      updateData,
      userId,
      id,
    );
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "transactionCreated",
      },
    });
  });
};

import type { AppMethods } from "../../app";
import type { TTransaction } from "../../types/common.type";
import { NotFoundError } from "../../utils/error.ts";
import { renderHtmlPart } from "../../utils/renderPage";
import { categoryController } from "../category/controller.ts";
import { transactionController } from "./controller.ts";

export const initTransactionsRoutes = (app: AppMethods) => {
  app.methodHtml("/api/renderTransactions", async (req) => {
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    const categories = url.searchParams.getAll("categories");

    const filters = { year, month, categories };

    const [data, years, allCategories] = await Promise.all([
      transactionController.getTransaction(filters),
      transactionController.getTransactionYears(),
      categoryController.getAllCategories(),
    ]);

    return renderHtmlPart(
      { clientPath: "views/partials/transaction/", name: "transactionsList" },
      { data, filters, years, allCategories },
    );
  });

  app.methodGet("/transaction", () => transactionController.getTransaction());

  app.methodPost<Omit<TTransaction, "id">>("/api/transaction", async (req) => {
    const newTransaction = await req.json();
    const result =
      await transactionController.createTransaction(newTransaction);

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "transactionCreated",
      },
    });
  });

  app.methodDelete("/api/transaction/:id", async (req) => {
    const { id } = req.params;
    if (!id) {
      throw new NotFoundError("id is no found");
    }
    const result = await transactionController.deleteTransaction(id);
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
    const { id } = req.params;
    const updateData = await req.json();
    const result = await transactionController.updateTransaction(
      updateData,
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

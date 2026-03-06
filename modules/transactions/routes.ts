import type { AppMethods } from "../../app";
import type { TTransaction } from "../../types/common.type";
import { transactionController } from "./contoller";

export const initTransactionsRoutes = (app: AppMethods) => {
  app.methodGet("/transaction", transactionController.getTransaction);

  app.methodPost<Omit<TTransaction, "id">>("/transaction", async (req) => {
    const newTransaction = await req.json();
    console.log({ newTransaction });
    return transactionController.createTransaction(newTransaction);
  });

  app.methodPut<
    { id: TTransaction["id"] } & Partial<Omit<TTransaction, "id" | "userId">>
  >("/transaction/:id", async (req) => {
    const { id } = req.params;
    const updateData = await req.json();
    return transactionController.updateTransaction(updateData, id);
  });
};

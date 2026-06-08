import type { AppMethods } from "../../app";
import type { TTransactionPlanning } from "../../types/common.type";
import { NotFoundError } from "../../utils/error.ts";
import { getUserId } from "../../utils/getUserId.ts";
import { transactionPlanningController } from "./controller.ts";

export const initTransactionPlanningRoutes = (app: AppMethods) => {
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

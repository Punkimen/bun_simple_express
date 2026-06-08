import { prisma } from "../../prisma/db";
import type { TTransactionPlanning } from "../../types/common.type";
import { AppError, BadRequestError } from "../../utils/error";

type PlanningFilters = {
  year?: number | null;
  month?: number | null;
};

class TransactionPlanningController {
  async getPlanning(userId: string, filters?: PlanningFilters) {
    try {
      const dateFilter: { gte?: Date; lte?: Date } = {};

      if (filters?.year) {
        const { year, month } = filters;
        if (month) {
          dateFilter.gte = new Date(year, month - 1, 1);
          dateFilter.lte = new Date(year, month - 1, 1);
        } else {
          dateFilter.gte = new Date(year, 0, 1);
          dateFilter.lte = new Date(year, 11, 1);
        }
      }

      const rows = await prisma.transactionPlanning.findMany({
        where: {
          user_id: userId,
          ...(dateFilter.gte && { date: dateFilter }),
        },
        include: { category: true },
        orderBy: [{ date: "desc" }, { created_at: "desc" }],
      });

      return rows.map((p) => ({
        id: p.id,
        category_id: p.category_id,
        amount: Number(p.amount),
        date: p.date.toISOString().slice(0, 10),
        month: p.date.getMonth() + 1,
        year: p.date.getFullYear(),
        note: p.note ?? undefined,
        category_name: p.category?.name ?? null,
        type: p.category?.type ?? null,
      }));
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch planning");
    }
  }

  async createPlanning(data: Omit<TTransactionPlanning, "id">, userId: string) {
    if (!data) throw new BadRequestError("Planning data is required");
    if (!data.month || data.month < 1 || data.month > 12)
      throw new BadRequestError("Invalid month");
    if (!data.year || data.year < 2000 || data.year > 2100)
      throw new BadRequestError("Invalid year");
    if (data.amount > 999999999.99)
      throw new BadRequestError("Amount is too big");

    try {
      const date = new Date(data.year, data.month - 1, 1);
      const row = await prisma.transactionPlanning.create({
        data: {
          category_id: data.categoryId,
          amount: data.amount,
          date,
          note: data.note,
          user_id: userId,
        },
      });
      return {
        ...row,
        amount: Number(row.amount),
        date: row.date.toISOString().slice(0, 10),
        month: row.date.getMonth() + 1,
        year: row.date.getFullYear(),
      };
    } catch (error: any) {
      throw new AppError(error.message || "Failed to create planning");
    }
  }

  async updatePlanning(
    data: Partial<Omit<TTransactionPlanning, "id">>,
    userId: string,
    id: string,
  ) {
    if (!id) throw new BadRequestError("Planning ID is required");
    if (data.amount !== undefined && data.amount < 0)
      throw new BadRequestError("Amount can't be negative");

    try {
      const existing = await prisma.transactionPlanning.findUnique({
        where: { id, user_id: userId },
      });
      if (!existing) throw new AppError("Planning not found");

      const month = data.month ?? existing.date.getMonth() + 1;
      const year = data.year ?? existing.date.getFullYear();
      const date = new Date(year, month - 1, 1);

      const row = await prisma.transactionPlanning.update({
        where: { id },
        data: {
          category_id: data.categoryId ?? existing.category_id,
          amount: data.amount ?? Number(existing.amount),
          date,
          note: data.note ?? existing.note,
        },
      });
      return {
        ...row,
        amount: Number(row.amount),
        date: row.date.toISOString().slice(0, 10),
        month: row.date.getMonth() + 1,
        year: row.date.getFullYear(),
      };
    } catch (error: any) {
      throw new AppError(error.message || "Failed to update planning");
    }
  }

  async deletePlanning(id: string, userId: string) {
    if (!id) throw new BadRequestError("ID is required");
    try {
      const row = await prisma.transactionPlanning.delete({
        where: { id, user_id: userId },
      });
      return {
        ...row,
        amount: Number(row.amount),
        date: row.date.toISOString().slice(0, 10),
      };
    } catch (error: any) {
      throw new AppError(error.message || "Failed to delete planning");
    }
  }
}

export const transactionPlanningController =
  new TransactionPlanningController();

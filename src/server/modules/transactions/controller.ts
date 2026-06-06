import { prisma } from "../../prisma/db";
import type { TTransaction } from "../../types/common.type";
import { AppError, BadRequestError } from "../../utils/error";

type TransactionFilters = {
  year?: string | null;
  month?: string | null;
  categories?: string[];
};

type TTransactionChanged = Omit<TTransaction, "categoryId"> & {
  category_id: string | null;
  category_name: string | null;
};

class Transaction {
  async getTransaction(userId: string, filters?: TransactionFilters) {
    try {
      const dateFilter: { gte?: Date; lte?: Date } = {};

      if (filters?.year) {
        const year = Number(filters.year);
        const month = filters.month ? Number(filters.month) : null;
        if (month) {
          dateFilter.gte = new Date(year, month - 1, 1);
          dateFilter.lte = new Date(year, month, 0, 23, 59, 59, 999);
        } else {
          dateFilter.gte = new Date(year, 0, 1);
          dateFilter.lte = new Date(year, 11, 31, 23, 59, 59, 999);
        }
      }

      const rows = await prisma.transaction.findMany({
        where: {
          user_id: userId,
          ...(dateFilter.gte && { date: dateFilter }),
          ...(filters?.categories?.length && {
            category_id: { in: filters.categories },
          }),
        },
        include: { category: true },
        orderBy: [{ date: "desc" }, { created_at: "desc" }],
      });

      return rows.map((t) => ({
        id: t.id,
        category_id: t.category_id,
        amount: Number(t.amount),
        date: t.date.toISOString().slice(0, 10),
        note: t.note ?? undefined,
        category_name: t.category?.name ?? null,
        type: (t.category?.type as TTransaction["type"]) ?? null,
      }));
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch transactions");
    }
  }

  async getTransactionYears(userId: string): Promise<number[]> {
    try {
      const rows = await prisma.transaction.findMany({
        where: { user_id: userId },
        select: { date: true },
        orderBy: { date: "desc" },
      });
      const years = [...new Set(rows.map((r) => r.date.getFullYear()))].sort(
        (a, b) => b - a,
      );
      return years;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch years");
    }
  }

  async createTransaction(data: Omit<TTransaction, "id">, userId: string) {
    if (!data) {
      throw new BadRequestError("Transaction data is required");
    }
    try {
      if (data.amount > 99999999.99) {
        throw new BadRequestError("Amount is to big");
      }
      const transaction = await prisma.transaction.create({
        data: {
          category_id: data.categoryId,
          amount: data.amount,
          date: new Date(data.date),
          note: data.note,
          user_id: userId,
        },
      });
      return {
        ...transaction,
        amount: Number(transaction.amount),
        date: transaction.date.toISOString().slice(0, 10),
      };
    } catch (error: any) {
      throw new AppError(error.message || "Failed to create transaction");
    }
  }

  async updateTransaction(
    data: Partial<Omit<TTransaction, "id" | "userId">>,
    userId: string,
    id?: TTransaction["id"],
  ) {
    if (!id) {
      throw new BadRequestError("Transaction ID is required for update");
    }
    if (data.amount !== undefined && data.amount < 0) {
      throw new BadRequestError("Amount can`t be is negative");
    }
    try {
      const existing = await prisma.transaction.findUnique({
        where: { id, user_id: userId },
      });
      if (!existing) {
        throw new AppError("Transaction not found");
      }
      const result = await prisma.transaction.update({
        where: { id },
        data: {
          category_id: data.categoryId ?? existing.category_id,
          amount: data.amount ?? Number(existing.amount),
          note: data.note ?? existing.note,
          date: data.date ? new Date(data.date) : existing.date,
        },
      });
      return {
        ...result,
        amount: Number(result.amount),
        date: result.date.toISOString().slice(0, 10),
      };
    } catch (error: any) {
      throw new AppError(error.message || "Failed to update transaction");
    }
  }

  async deleteTransaction(id: TTransaction["id"], userId: string) {
    if (!id) {
      throw new BadRequestError("Id is not found");
    }
    try {
      const result = await prisma.transaction.delete({
        where: { id, user_id: userId },
      });
      return {
        ...result,
        amount: Number(result.amount),
        date: result.date.toISOString().slice(0, 10),
      };
    } catch (error: any) {
      throw new AppError(error.message || "Failed to delete transaction");
    }
  }
}

export const transactionController = new Transaction();

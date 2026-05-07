import { prisma } from "../../db/db";
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
  async getTransaction(filters?: TransactionFilters) {
    try {
      const rows = await prisma.transaction.findMany({
        include: { category: true },
        orderBy: { date: "desc" },
      });

      let result: TTransactionChanged[] = rows.map((t) => ({
        id: t.id,
        category_id: t.category_id,
        amount: Number(t.amount),
        date: t.date.toISOString().slice(0, 10),
        note: t.note ?? undefined,
        category_name: t.category?.name ?? null,
        type: (t.category?.type as TTransaction["type"]) ?? null,
      }));

      if (filters?.year) {
        const y = Number(filters.year);
        result = result.filter((t) => new Date(t.date).getFullYear() === y);
      }
      if (filters?.month) {
        const m = Number(filters.month);
        result = result.filter((t) => new Date(t.date).getMonth() + 1 === m);
      }
      if (filters?.categories?.length) {
        result = result.filter((t) =>
          filters.categories!.includes(t.category_id ?? ""),
        );
      }

      return result.sort((a, b) => (a.date > b.date ? 1 : 0));
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch transactions");
    }
  }

  async getTransactionYears(): Promise<number[]> {
    try {
      const rows = await prisma.transaction.findMany({
        select: { date: true },
        orderBy: { date: "desc" },
      });
      const years = [
        ...new Set(rows.map((r) => r.date.getFullYear())),
      ].sort((a, b) => b - a);
      return years;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch years");
    }
  }

  async createTransaction(data: Omit<TTransaction, "id">) {
    if (!data) {
      throw new BadRequestError("Transaction data is required");
    }
    try {
      const transaction = await prisma.transaction.create({
        data: {
          category_id: data.categoryId,
          amount: data.amount,
          date: new Date(data.date),
          note: data.note,
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
    id?: TTransaction["id"],
  ) {
    if (!id) {
      throw new BadRequestError("Transaction ID is required for update");
    }
    if (data.amount !== undefined && data.amount < 0) {
      throw new BadRequestError("Amount can`t be is negative");
    }
    try {
      const existing = await prisma.transaction.findUnique({ where: { id } });
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

  async deleteTransaction(id: TTransaction["id"]) {
    if (!id) {
      throw new BadRequestError("Id is not found");
    }
    try {
      const result = await prisma.transaction.delete({ where: { id } });
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

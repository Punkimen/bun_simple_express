import db from "../../db/db";
import type { TCategory, TTransaction } from "../../types/common.type";
import { AppError, BadRequestError } from "../../utils/error";
import { v4 as uuidv4 } from "uuid";

type TransactionFilters = {
  year?: string | null;
  month?: string | null;
  categories?: string[];
};

type TTransactionChanged = Omit<TTransaction, "categoryId"> & {
  category_id: string;
};

class Transaction {
  async getTransaction(filters?: TransactionFilters) {
    try {
      const rows = await db`
        SELECT t.*, c.name AS category_name, c.type AS type
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        ORDER BY t.date DESC
      `;

      let result: TTransactionChanged[] = [...rows];

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
          filters.categories!.includes(t.category_id),
        );
      }
      return result.sort((a, b) => {
        return a.date > b.date ? 1 : 0;
      });
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch transactions");
    }
  }

  async getTransactionYears(): Promise<number[]> {
    try {
      const rows = await db`
        SELECT DISTINCT EXTRACT(YEAR FROM date)::int AS year
        FROM transactions
        ORDER BY year DESC
      `;
      return rows.map((r: any) => r.year);
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch years");
    }
  }

  async createTransaction(data: Omit<TTransaction, "id">) {
    if (!data) {
      throw new BadRequestError("Transaction data is required");
    }

    const newTransaction = {
      id: uuidv4(),
      ...data,
    };
    try {
      const transaction =
        await db`INSERT INTO transactions (id, category_id, amount, date, note) VALUES (${newTransaction.id}, ${newTransaction.categoryId}, ${newTransaction.amount}, ${newTransaction.date}, ${newTransaction.note})  RETURNING *`;

      if (!transaction[0]) {
        throw new AppError("Failed to create transaction");
      }

      return transaction[0];
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

    const { amount } = data;

    if (amount && amount < 0) {
      throw new BadRequestError("Amount can`t be is negative");
    }

    try {
      const existingTransaction =
        await db`SELECT * FROM transactions WHERE id = ${id}`;
      if (!existingTransaction[0]) {
        throw new AppError("Transaction not found");
      }

      const updatedTransaction = {
        ...existingTransaction[0],
        ...data,
      };

      const result =
        await db`UPDATE transactions SET category_id = ${updatedTransaction.categoryId}, amount = ${updatedTransaction.amount}, note = ${updatedTransaction.note}, date = ${updatedTransaction.date} WHERE id = ${id} RETURNING *`;

      if (!result[0]) {
        throw new AppError("Failed to update transaction");
      }

      return result[0];
    } catch (error: any) {
      throw new AppError(error.message || "Failed to update transaction");
    }
  }

  async deleteTransaction(id: TTransaction["id"]) {
    if (!id) {
      throw new BadRequestError("Id is not found");
    }

    const result =
      await db`DELETE FROM transactions WHERE id = ${id} RETURNING *`;

    if (!result[0]) {
      throw new AppError("Failed to delete transaction");
    }

    return result[0];
  }
}

export const transactionController = new Transaction();

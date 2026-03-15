import db from "../../db/db";
import type { TCategory, TTransaction } from "../../types/common.type";
import { AppError, BadRequestError } from "../../utils/error";
import { v4 as uuidv4 } from "uuid";

class Transaction {
  async getTransaction() {
    try {
      const transactions = await db`SELECT * FROM transactions`;

      return transactions;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to fetch transactions");
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
        await db`UPDATE transactions SET category_id = ${updatedTransaction.categoryId}, amount = ${updatedTransaction.amount}, note = ${updatedTransaction.note} WHERE id = ${id} RETURNING *`;

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

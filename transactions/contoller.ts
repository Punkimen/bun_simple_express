import db from '../db/db';
import type { TCategory, TTransaction } from '../types/common.type';
import { AppError, BadRequestError } from '../utils/error';
import { v4 as uuidv4 } from 'uuid';

class Transaction {
  async createCategory(data: Omit<TCategory, 'id'>) {
    const newCategory = {
      id: uuidv4(),
      ...data,
    };

    console.log('Creating category:', newCategory);

    try {
      const category =
        await db`INSERT INTO categories (id, name, type) VALUES (${newCategory.id}, ${newCategory.name}, ${newCategory.type})  RETURNING *`;

      if (!category[0]) {
        throw new AppError('Failed to create category');
      }

      return category[0];
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create category');
    }
  }
  async createTransaction(data: Omit<TTransaction, 'id'>) {
    if (!data) {
      throw new BadRequestError('Transaction data is required');
    }

    const newTransaction = {
      id: uuidv4(),
      ...data,
    };

    try {
      const transaction =
        await db`INSERT INTO transactions (id, user_id, category_id, amount, date, note) VALUES (${newTransaction.id}, ${newTransaction.userId}, ${newTransaction.categoryId}, ${newTransaction.amount}, ${newTransaction.date}, ${newTransaction.note})  RETURNING *`;

      if (!transaction[0]) {
        throw new AppError('Failed to create transaction');
      }

      return transaction[0];
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to create transaction');
    }
  }
  async updateTransaction(
    data: Omit<Partial<Transaction>, 'id'> & { id: string },
  ) {}
  async deleteTransaction(id: string) {}
}

export const transactionController = new Transaction();

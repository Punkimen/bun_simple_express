import type { AppMethods } from '../app';
import type { TTransaction } from '../types/common.type';
import { transactionController } from './contoller';

export const initTransactionsRoutes = (app: AppMethods) => {
  app.methodGet('/categories', () => {
    return transactionController.createCategory({
      name: 'Food',
      type: 'expense',
    });
  });
  app.methodPost<Omit<TTransaction, 'id'>>('/transaction', (req) => {
    const newTransaction = req.body;
    return transactionController.createTransaction(newTransaction);
  });
};

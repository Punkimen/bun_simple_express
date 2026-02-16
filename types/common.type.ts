type TUser = {
  id: number;
  name: string;
};
// удобная манипуляция транзакциями
export type TTransaction = {
  id: number;
  userId: number;
  date: string; // ISO
  categoryId: string;
  amount: number; // integer
  type: 'income' | 'expense';
  note?: string;
};
// сортировка по категориям
export type TCategory = {
  id: string;
  name: string;
  type: 'income' | 'expense';
};

type Month = {
  id: string; // YYYY-MM
  userId: number;
};

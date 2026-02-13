type TUser = {
  id: number;
  name: string;
};
// удобная манипуляция транзакциями
type Transaction = {
  id: string;
  userId: number;
  date: string; // ISO
  categoryId: string;
  amount: number; // integer
  type: 'income' | 'expense';
  note?: string;
};
// сортировка по категориям
type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense';
};

type Month = {
  id: string; // YYYY-MM
  userId: number;
};

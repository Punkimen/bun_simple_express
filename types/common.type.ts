export type AdminLogin = {
  login: string;
  password: string;
};

type TUser = {
  id: number;
  name: string;
};
// удобная манипуляция транзакциями
export type TTransaction = {
  id: string;
  userId: number;
  date: string; // ISO
  categoryId: string;
  amount: number; // integer
  type: "income" | "expense";
  note?: string;
};
// сортировка по категориям
export type TCategory = {
  id: string;
  userId: number;
  name: string;
  type: "income" | "expense";
};

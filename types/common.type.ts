export type AdminLogin = {
  login: string;
  password: string;
};

export type TTransaction = {
  id: string;
  date: string; // ISO
  categoryId: string;
  amount: number; // integer
  type: "income" | "expense";
  note?: string;
};

export type TCategory = {
  id: string;
  name: string;
  type: "income" | "expense";
};

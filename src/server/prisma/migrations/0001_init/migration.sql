CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense'))
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NULL REFERENCES categories(id),
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  note TEXT
);

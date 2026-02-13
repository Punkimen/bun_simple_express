CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense'))
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  category_id UUID REFERENCES categories(id),
  amount INTEGER NOT NULL,
  date DATE NOT NULL,
  note TEXT
);

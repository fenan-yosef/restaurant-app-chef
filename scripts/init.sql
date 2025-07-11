-- users
CREATE TABLE IF NOT EXISTS users (
  id             BIGINT PRIMARY KEY,
  first_name     TEXT NOT NULL,
  last_name      TEXT,
  username       TEXT,
  language_code  TEXT,
  is_premium     BOOLEAN DEFAULT FALSE,
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- products
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL,
  category      TEXT,
  photos        TEXT[] DEFAULT '{}',
  videos        TEXT[] DEFAULT '{}',
  is_available  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id          SERIAL PRIMARY KEY,
  user_id     BIGINT    NOT NULL REFERENCES users(id),
  product_id  INTEGER   NOT NULL REFERENCES products(id),
  quantity    INTEGER   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id),
  total_amount      NUMERIC(10,2) NOT NULL,
  status            TEXT DEFAULT 'pending',
  delivery_address  TEXT,
  phone_number      TEXT,
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL,
  price      NUMERIC(10,2) NOT NULL
);
-- Storefront orders, line items, and outbound shipment emails
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer';

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ship_name TEXT NOT NULL,
  ship_addr TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  tracking TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  dispatched_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_cents INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'demo',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_emails_order ON order_emails(order_id);

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

const query = (sql, params) => pool.query(sql, params)

async function initSchema() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      "storeName" TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      password TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'gratuit',
      paid BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT FALSE,
      pending BOOLEAN NOT NULL DEFAULT FALSE,
      role TEXT NOT NULL DEFAULT 'store',
      "startDate" TEXT,
      "endDate" TEXT,
      "registeredAt" TEXT,
      "pendingPlan" TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "colorIndex" INTEGER NOT NULL DEFAULT 0,
      "storeId" TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      "costPrice" REAL NOT NULL DEFAULT 0,
      "categoryId" TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      "storeId" TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      barcode TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS cities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "storeId" TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "cityId" TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
      "storeId" TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "schoolId" TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      "storeId" TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS list_items (
      id TEXT PRIMARY KEY,
      "listId" TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      "productId" TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      "storeId" TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      "clientName" TEXT,
      date TEXT,
      time TEXT,
      total REAL NOT NULL DEFAULT 0,
      paid BOOLEAN NOT NULL DEFAULT FALSE,
      "rawDate" TEXT,
      "loyaltyCardId" TEXT,
      "pointsEarned" INTEGER NOT NULL DEFAULT 0,
      "pointsRedeemed" INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      "saleId" TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      "productId" TEXT,
      "productName" TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      price REAL NOT NULL DEFAULT 0,
      "costPrice" REAL NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS loyalty_settings (
      id TEXT PRIMARY KEY,
      "storeId" TEXT NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
      "pointsPerDh" REAL NOT NULL DEFAULT 1,
      "pointsForDh" REAL NOT NULL DEFAULT 25
    )`,
    `CREATE TABLE IF NOT EXISTS loyalty_cards (
      id TEXT PRIMARY KEY,
      "storeId" TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT,
      points INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS admin_cities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS admin_schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "cityId" TEXT NOT NULL REFERENCES admin_cities(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS admin_lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "schoolId" TEXT NOT NULL REFERENCES admin_schools(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS admin_list_items (
      id TEXT PRIMARY KEY,
      "listId" TEXT NOT NULL REFERENCES admin_lists(id) ON DELETE CASCADE,
      "productName" TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      "unitPrice" REAL NOT NULL DEFAULT 0
    )`,
  ]
  for (const sql of tables) {
    await query(sql)
  }
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT`)
}

module.exports = { query, initSchema }

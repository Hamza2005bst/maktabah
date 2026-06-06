const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, 'maktabah.db')
const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    storeName TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    password TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'gratuit',
    paid INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 0,
    pending INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'store',
    startDate TEXT,
    endDate TEXT,
    registeredAt TEXT,
    pendingPlan TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    colorIndex INTEGER NOT NULL DEFAULT 0,
    storeId TEXT NOT NULL,
    FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    costPrice REAL NOT NULL DEFAULT 0,
    categoryId TEXT NOT NULL,
    storeId TEXT NOT NULL,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    storeId TEXT NOT NULL,
    FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cityId TEXT NOT NULL,
    storeId TEXT NOT NULL,
    FOREIGN KEY (cityId) REFERENCES cities(id) ON DELETE CASCADE,
    FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    schoolId TEXT NOT NULL,
    storeId TEXT NOT NULL,
    FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS list_items (
    id TEXT PRIMARY KEY,
    listId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (listId) REFERENCES lists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    storeId TEXT NOT NULL,
    clientName TEXT,
    date TEXT,
    time TEXT,
    total REAL NOT NULL DEFAULT 0,
    paid INTEGER NOT NULL DEFAULT 0,
    rawDate TEXT,
    loyaltyCardId TEXT,
    pointsEarned INTEGER NOT NULL DEFAULT 0,
    pointsRedeemed INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    saleId TEXT NOT NULL,
    productId TEXT,
    productName TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL DEFAULT 0,
    costPrice REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS loyalty_settings (
    id TEXT PRIMARY KEY,
    storeId TEXT NOT NULL UNIQUE,
    pointsPerDh REAL NOT NULL DEFAULT 1,
    pointsForDh REAL NOT NULL DEFAULT 25,
    FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS loyalty_cards (
    id TEXT PRIMARY KEY,
    storeId TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (storeId) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cityId TEXT NOT NULL,
    FOREIGN KEY (cityId) REFERENCES admin_cities(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    schoolId TEXT NOT NULL,
    FOREIGN KEY (schoolId) REFERENCES admin_schools(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_list_items (
    id TEXT PRIMARY KEY,
    listId TEXT NOT NULL,
    productName TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unitPrice REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (listId) REFERENCES admin_lists(id) ON DELETE CASCADE
  );
`)

module.exports = db

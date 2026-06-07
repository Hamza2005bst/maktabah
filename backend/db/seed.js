require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { query, initSchema } = require('./database')
const bcrypt = require('bcryptjs')

const uid = () => Math.random().toString(36).slice(2, 10)

async function seed() {
  await initSchema()

  const existing = await query('SELECT id FROM stores WHERE id = $1', ['admin'])
  if (existing.rows[0]) { console.log('Database already seeded.'); process.exit(0) }

  const hash = (p) => bcrypt.hashSync(p, 10)
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
  const fmtD = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const fmtT = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  await query(
    `INSERT INTO stores (id, "storeName", phone, email, password, plan, paid, active, pending, role, "startDate", "endDate", "registeredAt", "pendingPlan") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    ['admin', 'Maktaba Admin', '', 'admin@maktaba.ma', hash('admin123'), 'admin', true, true, false, 'admin', '', '', null, null]
  )
  await query(
    `INSERT INTO stores (id, "storeName", phone, email, password, plan, paid, active, pending, role, "startDate", "endDate", "registeredAt", "pendingPlan") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    ['demo', 'Librairie Al Amal', '0612345678', '', hash('demo123'), 'premium', true, true, false, 'store', '2025-09-01', '2026-09-01', null, null]
  )

  const cats = [['c1','Cahiers & Classeurs',0],['c2','Stylos & Crayons',1],['c3','Livres scolaires',2],['c4','Géométrie & Outils',4],['c5','Divers',6]]
  for (const [id, name, ci] of cats) {
    await query('INSERT INTO categories (id, name, "colorIndex", "storeId") VALUES ($1,$2,$3,$4)', [id, name, ci, 'demo'])
  }

  const prods = [
    ['p1','Cahier 96 pages',5,2.5,'c1'],['p2','Cahier 192 pages',9,4.5,'c1'],['p3','Classeur A4',18,9,'c1'],['p4','Pochettes plastiques',6,2.5,'c1'],
    ['p5','Stylo bille bleu',2,0.8,'c2'],['p6','Stylo bille rouge',2,0.8,'c2'],['p7','Crayon HB',1.5,0.5,'c2'],['p8','Stylo effaçable',5,2,'c2'],['p9','Surligneur jaune',4,1.5,'c2'],
    ['p10','Lecture CE1',45,30,'c3'],['p11','Maths CM2',50,33,'c3'],['p12','Français 6ème',55,36,'c3'],
    ['p13','Règle 30cm',5,2,'c4'],['p14','Équerre',7,3,'c4'],['p15','Compas métal',15,7,'c4'],['p16','Rapporteur',5,2,'c4'],
    ['p17','Colle en bâton',6,2.5,'c5'],['p18','Ciseaux scolaires',12,5,'c5'],['p19','Taille-crayon',3,1,'c5'],['p20','Gomme blanche',2,0.7,'c5'],
  ]
  for (const [id, name, price, cost, catId] of prods) {
    await query('INSERT INTO products (id, name, price, "costPrice", "categoryId", "storeId") VALUES ($1,$2,$3,$4,$5,$6)', [id, name, price, cost, catId, 'demo'])
  }

  await query('INSERT INTO cities (id, name, "storeId") VALUES ($1,$2,$3)', ['v1','Casablanca','demo'])
  await query('INSERT INTO cities (id, name, "storeId") VALUES ($1,$2,$3)', ['v2','Rabat','demo'])
  await query('INSERT INTO schools (id, name, "cityId", "storeId") VALUES ($1,$2,$3,$4)', ['s1','École Ibn Khaldoun','v1','demo'])
  await query('INSERT INTO schools (id, name, "cityId", "storeId") VALUES ($1,$2,$3,$4)', ['s2','École Al Farabi','v1','demo'])
  await query('INSERT INTO schools (id, name, "cityId", "storeId") VALUES ($1,$2,$3,$4)', ['s3','École Hassan II','v2','demo'])

  await query('INSERT INTO lists (id, name, "schoolId", "storeId") VALUES ($1,$2,$3,$4)', ['l1','Liste CE1 — A','s1','demo'])
  await query('INSERT INTO lists (id, name, "schoolId", "storeId") VALUES ($1,$2,$3,$4)', ['l2','Liste CM2 — B','s2','demo'])
  await query('INSERT INTO lists (id, name, "schoolId", "storeId") VALUES ($1,$2,$3,$4)', ['l3','Liste 6ème','s3','demo'])

  for (const [lId, pId, qty] of [
    ['l1','p1',5],['l1','p5',3],['l1','p7',2],['l1','p20',1],['l1','p19',1],['l1','p10',1],
    ['l2','p2',4],['l2','p3',1],['l2','p5',2],['l2','p6',1],['l2','p13',1],['l2','p15',1],['l2','p11',1],
    ['l3','p2',6],['l3','p3',2],['l3','p8',3],['l3','p14',1],['l3','p15',1],['l3','p16',1],['l3','p12',1],['l3','p17',1],
  ]) {
    await query('INSERT INTO list_items (id, "listId", "productId", quantity) VALUES ($1,$2,$3,$4)', [uid(), lId, pId, qty])
  }

  for (const [id, client, date, time, total, paid, raw, cardId, pts, red] of [
    ['sa1','Fatima Zahra',fmtD(daysAgo(0)),'09:15',74,false,daysAgo(0).toISOString(),null,74,0],
    ['sa2','Youssef El Amrani',fmtD(daysAgo(0)),'11:30',118,false,daysAgo(0).toISOString(),null,118,0],
    ['sa3','',fmtD(daysAgo(1)),'14:00',36,true,daysAgo(1).toISOString(),null,36,0],
    ['sa4','Khadija Benali',fmtD(daysAgo(2)),'10:45',145,true,daysAgo(2).toISOString(),null,145,0],
    ['sa5','Omar Tazi',fmtD(daysAgo(3)),'16:20',57,false,daysAgo(3).toISOString(),null,57,0],
    ['sa6','',fmtD(daysAgo(5)),'09:50',22,true,daysAgo(5).toISOString(),null,22,0],
    ['sa7','Aicha Idrissi',fmtD(daysAgo(6)),'13:10',200,true,daysAgo(6).toISOString(),null,200,0],
    ['sa8','Hassan Berrada',fmtD(daysAgo(8)),'11:00',89,true,daysAgo(8).toISOString(),null,89,0],
  ]) {
    await query(
      `INSERT INTO sales (id, "storeId", "clientName", date, time, total, paid, "rawDate", "loyaltyCardId", "pointsEarned", "pointsRedeemed") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, 'demo', client, date, time, total, paid, raw, cardId, pts, red]
    )
  }

  for (const [sId, pId, pName, qty, price, cost] of [
    ['sa1','p1','Cahier 96 pages',5,5,2.5],['sa1','p5','Stylo bille bleu',3,2,0.8],['sa1','p20','Gomme blanche',4,2,0.7],['sa1','p19','Taille-crayon',2,3,1],
    ['sa2','p3','Classeur A4',2,18,9],['sa2','p11','Maths CM2',1,50,33],['sa2','p15','Compas métal',2,15,7],
    ['sa3','p5','Stylo bille bleu',6,2,0.8],['sa3','p7','Crayon HB',4,1.5,0.5],['sa3','p20','Gomme blanche',3,2,0.7],
    ['sa4','p12','Français 6ème',1,55,36],['sa4','p2','Cahier 192 pages',5,9,4.5],['sa4','p13','Règle 30cm',1,5,2],['sa4','p17','Colle en bâton',3,6,2.5],
    ['sa5','p1','Cahier 96 pages',3,5,2.5],['sa5','p9','Surligneur jaune',4,4,1.5],['sa5','p18','Ciseaux scolaires',2,12,5],
    ['sa6','p7','Crayon HB',6,1.5,0.5],['sa6','p20','Gomme blanche',4,2,0.7],
    ['sa7','p10','Lecture CE1',2,45,30],['sa7','p11','Maths CM2',1,50,33],['sa7','p4','Pochettes plastiques',1,6,2.5],['sa7','p14','Équerre',2,7,3],
    ['sa8','p2','Cahier 192 pages',3,9,4.5],['sa8','p15','Compas métal',2,15,7],['sa8','p5','Stylo bille bleu',5,2,0.8],['sa8','p6','Stylo bille rouge',4,2,0.8],
  ]) {
    await query(
      'INSERT INTO sale_items (id, "saleId", "productId", "productName", quantity, price, "costPrice") VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [uid(), sId, pId, pName, qty, price, cost]
    )
  }

  await query('INSERT INTO loyalty_settings (id, "storeId", "pointsPerDh", "pointsForDh") VALUES ($1,$2,$3,$4)', [uid(), 'demo', 1, 25])
  for (const [id, name, phone, points] of [
    ['lc1','Fatima Zahra','0661234567',320],
    ['lc2','Youssef El Amrani','0672345678',180],
    ['lc3','Khadija Benali','0653456789',450],
    ['lc4','Omar Tazi','0645678901',95],
  ]) {
    await query('INSERT INTO loyalty_cards (id, "storeId", name, phone, points) VALUES ($1,$2,$3,$4,$5)', [id, 'demo', name, phone, points])
  }

  await query('INSERT INTO admin_cities (id, name) VALUES ($1,$2)', ['ac1','Casablanca'])
  await query('INSERT INTO admin_cities (id, name) VALUES ($1,$2)', ['ac2','Rabat'])
  await query('INSERT INTO admin_cities (id, name) VALUES ($1,$2)', ['ac3','Marrakech'])
  await query('INSERT INTO admin_schools (id, name, "cityId") VALUES ($1,$2,$3)', ['as1','École Ibn Khaldoun','ac1'])
  await query('INSERT INTO admin_schools (id, name, "cityId") VALUES ($1,$2,$3)', ['as2','École Al Farabi','ac1'])
  await query('INSERT INTO admin_schools (id, name, "cityId") VALUES ($1,$2,$3)', ['as3','École Hassan II','ac2'])
  await query('INSERT INTO admin_lists (id, name, "schoolId") VALUES ($1,$2,$3)', ['al1','CE1','as1'])
  await query('INSERT INTO admin_lists (id, name, "schoolId") VALUES ($1,$2,$3)', ['al2','CM2','as2'])
  await query('INSERT INTO admin_lists (id, name, "schoolId") VALUES ($1,$2,$3)', ['al3','6ème primaire','as3'])

  for (const [lId, pName, qty, up] of [
    ['al1','Cahier 96 pages',5,5],['al1','Stylo bille bleu',3,2],['al1','Crayon HB',2,1.5],['al1','Gomme blanche',1,2],
    ['al2','Cahier 192 pages',4,9],['al2','Classeur A4',1,18],['al2','Compas métal',1,15],
    ['al3','Cahier 192 pages',6,9],['al3','Classeur A4',2,18],['al3','Stylo effaçable',3,5],['al3','Règle 30cm',1,5],
  ]) {
    await query(
      'INSERT INTO admin_list_items (id, "listId", "productName", quantity, "unitPrice") VALUES ($1,$2,$3,$4,$5)',
      [uid(), lId, pName, qty, up]
    )
  }

  console.log('Database seeded successfully.')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })

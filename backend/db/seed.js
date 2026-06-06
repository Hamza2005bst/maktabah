const db = require('./database')
const bcrypt = require('bcryptjs')

const uid = () => Math.random().toString(36).slice(2, 10)

function seed() {
  const existing = db.prepare('SELECT id FROM stores WHERE id = ?').get('admin')
  if (existing) { console.log('Database already seeded.'); return }

  const hash = (p) => bcrypt.hashSync(p, 10)
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
  const fmtD = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const fmtT = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  db.prepare(`INSERT INTO stores VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    'admin','Maktaba Admin','','admin@maktaba.ma',hash('admin123'),'admin',1,1,0,'admin','','',null,null)
  db.prepare(`INSERT INTO stores VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    'demo','Librairie Al Amal','0612345678','',hash('demo123'),'premium',1,1,0,'store','2025-09-01','2026-09-01',null,null)

  const cats = [['c1','Cahiers & Classeurs',0],['c2','Stylos & Crayons',1],['c3','Livres scolaires',2],['c4','Géométrie & Outils',4],['c5','Divers',6]]
  const insC = db.prepare('INSERT INTO categories VALUES (?,?,?,?)')
  cats.forEach(([id,name,ci]) => insC.run(id,name,ci,'demo'))

  const prods = [
    ['p1','Cahier 96 pages',5,2.5,'c1'],['p2','Cahier 192 pages',9,4.5,'c1'],['p3','Classeur A4',18,9,'c1'],['p4','Pochettes plastiques',6,2.5,'c1'],
    ['p5','Stylo bille bleu',2,0.8,'c2'],['p6','Stylo bille rouge',2,0.8,'c2'],['p7','Crayon HB',1.5,0.5,'c2'],['p8','Stylo effaçable',5,2,'c2'],['p9','Surligneur jaune',4,1.5,'c2'],
    ['p10','Lecture CE1',45,30,'c3'],['p11','Maths CM2',50,33,'c3'],['p12','Français 6ème',55,36,'c3'],
    ['p13','Règle 30cm',5,2,'c4'],['p14','Équerre',7,3,'c4'],['p15','Compas métal',15,7,'c4'],['p16','Rapporteur',5,2,'c4'],
    ['p17','Colle en bâton',6,2.5,'c5'],['p18','Ciseaux scolaires',12,5,'c5'],['p19','Taille-crayon',3,1,'c5'],['p20','Gomme blanche',2,0.7,'c5'],
  ]
  const insP = db.prepare('INSERT INTO products VALUES (?,?,?,?,?,?)')
  prods.forEach(([id,name,price,cost,catId]) => insP.run(id,name,price,cost,catId,'demo'))

  db.prepare('INSERT INTO cities VALUES (?,?,?)').run('v1','Casablanca','demo')
  db.prepare('INSERT INTO cities VALUES (?,?,?)').run('v2','Rabat','demo')
  db.prepare('INSERT INTO schools VALUES (?,?,?,?)').run('s1','École Ibn Khaldoun','v1','demo')
  db.prepare('INSERT INTO schools VALUES (?,?,?,?)').run('s2','École Al Farabi','v1','demo')
  db.prepare('INSERT INTO schools VALUES (?,?,?,?)').run('s3','École Hassan II','v2','demo')

  db.prepare('INSERT INTO lists VALUES (?,?,?,?)').run('l1','Liste CE1 — A','s1','demo')
  db.prepare('INSERT INTO lists VALUES (?,?,?,?)').run('l2','Liste CM2 — B','s2','demo')
  db.prepare('INSERT INTO lists VALUES (?,?,?,?)').run('l3','Liste 6ème','s3','demo')

  const insLI = db.prepare('INSERT INTO list_items VALUES (?,?,?,?)')
  ;[['l1','p1',5],['l1','p5',3],['l1','p7',2],['l1','p20',1],['l1','p19',1],['l1','p10',1],
    ['l2','p2',4],['l2','p3',1],['l2','p5',2],['l2','p6',1],['l2','p13',1],['l2','p15',1],['l2','p11',1],
    ['l3','p2',6],['l3','p3',2],['l3','p8',3],['l3','p14',1],['l3','p15',1],['l3','p16',1],['l3','p12',1],['l3','p17',1],
  ].forEach(([lId,pId,qty]) => insLI.run(uid(),lId,pId,qty))

  const insSale = db.prepare('INSERT INTO sales VALUES (?,?,?,?,?,?,?,?,?,?,?)')
  ;[
    ['sa1','Fatima Zahra',fmtD(daysAgo(0)),'09:15',74,0,daysAgo(0).toISOString(),null,74,0],
    ['sa2','Youssef El Amrani',fmtD(daysAgo(0)),'11:30',118,0,daysAgo(0).toISOString(),null,118,0],
    ['sa3','',fmtD(daysAgo(1)),'14:00',36,1,daysAgo(1).toISOString(),null,36,0],
    ['sa4','Khadija Benali',fmtD(daysAgo(2)),'10:45',145,1,daysAgo(2).toISOString(),null,145,0],
    ['sa5','Omar Tazi',fmtD(daysAgo(3)),'16:20',57,0,daysAgo(3).toISOString(),null,57,0],
    ['sa6','',fmtD(daysAgo(5)),'09:50',22,1,daysAgo(5).toISOString(),null,22,0],
    ['sa7','Aicha Idrissi',fmtD(daysAgo(6)),'13:10',200,1,daysAgo(6).toISOString(),null,200,0],
    ['sa8','Hassan Berrada',fmtD(daysAgo(8)),'11:00',89,1,daysAgo(8).toISOString(),null,89,0],
  ].forEach(([id,client,date,time,total,paid,raw,cardId,pts,red]) =>
    insSale.run(id,'demo',client,date,time,total,paid,raw,cardId,pts,red))

  const insSI = db.prepare('INSERT INTO sale_items VALUES (?,?,?,?,?,?,?)')
  ;[
    ['sa1','p1','Cahier 96 pages',5,5,2.5],['sa1','p5','Stylo bille bleu',3,2,0.8],['sa1','p20','Gomme blanche',4,2,0.7],['sa1','p19','Taille-crayon',2,3,1],
    ['sa2','p3','Classeur A4',2,18,9],['sa2','p11','Maths CM2',1,50,33],['sa2','p15','Compas métal',2,15,7],
    ['sa3','p5','Stylo bille bleu',6,2,0.8],['sa3','p7','Crayon HB',4,1.5,0.5],['sa3','p20','Gomme blanche',3,2,0.7],
    ['sa4','p12','Français 6ème',1,55,36],['sa4','p2','Cahier 192 pages',5,9,4.5],['sa4','p13','Règle 30cm',1,5,2],['sa4','p17','Colle en bâton',3,6,2.5],
    ['sa5','p1','Cahier 96 pages',3,5,2.5],['sa5','p9','Surligneur jaune',4,4,1.5],['sa5','p18','Ciseaux scolaires',2,12,5],
    ['sa6','p7','Crayon HB',6,1.5,0.5],['sa6','p20','Gomme blanche',4,2,0.7],
    ['sa7','p10','Lecture CE1',2,45,30],['sa7','p11','Maths CM2',1,50,33],['sa7','p4','Pochettes plastiques',1,6,2.5],['sa7','p14','Équerre',2,7,3],
    ['sa8','p2','Cahier 192 pages',3,9,4.5],['sa8','p15','Compas métal',2,15,7],['sa8','p5','Stylo bille bleu',5,2,0.8],['sa8','p6','Stylo bille rouge',4,2,0.8],
  ].forEach(([sId,pId,pName,qty,price,cost]) => insSI.run(uid(),sId,pId,pName,qty,price,cost))

  db.prepare('INSERT INTO loyalty_settings VALUES (?,?,?,?)').run(uid(),'demo',1,25)
  const insLC = db.prepare('INSERT INTO loyalty_cards VALUES (?,?,?,?,?)')
  insLC.run('lc1','demo','Fatima Zahra','0661234567',320)
  insLC.run('lc2','demo','Youssef El Amrani','0672345678',180)
  insLC.run('lc3','demo','Khadija Benali','0653456789',450)
  insLC.run('lc4','demo','Omar Tazi','0645678901',95)

  db.prepare('INSERT INTO admin_cities VALUES (?,?)').run('ac1','Casablanca')
  db.prepare('INSERT INTO admin_cities VALUES (?,?)').run('ac2','Rabat')
  db.prepare('INSERT INTO admin_cities VALUES (?,?)').run('ac3','Marrakech')
  db.prepare('INSERT INTO admin_schools VALUES (?,?,?)').run('as1','École Ibn Khaldoun','ac1')
  db.prepare('INSERT INTO admin_schools VALUES (?,?,?)').run('as2','École Al Farabi','ac1')
  db.prepare('INSERT INTO admin_schools VALUES (?,?,?)').run('as3','École Hassan II','ac2')
  db.prepare('INSERT INTO admin_lists VALUES (?,?,?)').run('al1','CE1','as1')
  db.prepare('INSERT INTO admin_lists VALUES (?,?,?)').run('al2','CM2','as2')
  db.prepare('INSERT INTO admin_lists VALUES (?,?,?)').run('al3','6ème primaire','as3')
  const insALI = db.prepare('INSERT INTO admin_list_items VALUES (?,?,?,?,?)')
  ;[['al1','Cahier 96 pages',5,5],['al1','Stylo bille bleu',3,2],['al1','Crayon HB',2,1.5],['al1','Gomme blanche',1,2],
    ['al2','Cahier 192 pages',4,9],['al2','Classeur A4',1,18],['al2','Compas métal',1,15],
    ['al3','Cahier 192 pages',6,9],['al3','Classeur A4',2,18],['al3','Stylo effaçable',3,5],['al3','Règle 30cm',1,5],
  ].forEach(([lId,pName,qty,up]) => insALI.run(uid(),lId,pName,qty,up))

  console.log('Database seeded successfully.')
}

seed()

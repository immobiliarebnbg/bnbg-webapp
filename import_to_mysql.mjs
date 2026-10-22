import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const backupDir = path.join(process.cwd(), 'backup_data');

const config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  multipleStatements: true,
  charset: 'utf8mb4',
};

if (!config.user || !config.database) {
  console.log(`
❌ Missing MySQL connection details!

Please add these to your .env file:
MYSQL_HOST=localhost (or your Hostinger IP)
MYSQL_PORT=3306
MYSQL_USER=your_hostinger_db_user
MYSQL_PASSWORD=your_hostinger_db_password
MYSQL_DATABASE=your_hostinger_db_name
`);
  process.exit(1);
}

async function runImport() {
  console.log(`Connecting to MySQL at ${config.host}:${config.port} / db: ${config.database}...`);
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✓ Successfully connected to MySQL!');

    // 1. Run schema
    console.log('Applying database schema...');
    const schemaSql = fs.readFileSync(path.join(backupDir, 'schema.sql'), 'utf8');
    await connection.query(schemaSql);
    console.log('✓ Database tables created/verified!');

    // 2. Import users
    const users = JSON.parse(fs.readFileSync(path.join(backupDir, 'users.json'), 'utf8'));
    for (const u of users) {
      await connection.execute(
        `INSERT INTO users (id, email, username, role, password, avatar, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE username=VALUES(username), role=VALUES(role), password=VALUES(password), avatar=VALUES(avatar)`,
        [u.id, u.email, u.username, u.role, u.password || '', u.avatar || null, u.createdAt]
      );
    }
    console.log(`✓ Imported ${users.length} users`);

    // 3. Import metadata
    const metadata = JSON.parse(fs.readFileSync(path.join(backupDir, 'metadata.json'), 'utf8'));
    for (const m of metadata) {
      await connection.execute(
        `INSERT INTO metadata (\`key\`, \`value\`) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE \`value\`=VALUES(\`value\`)`,
        [m.key, typeof m.value === 'string' ? m.value : JSON.stringify(m.value)]
      );
    }
    console.log(`✓ Imported metadata records`);

    // 4. Import favorites
    const favorites = JSON.parse(fs.readFileSync(path.join(backupDir, 'favorites.json'), 'utf8'));
    for (const f of favorites) {
      await connection.execute(
        `INSERT INTO favorites (id, userEmail, propertyId) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE propertyId=VALUES(propertyId)`,
        [f.id, f.userEmail, f.propertyId]
      );
    }
    console.log(`✓ Imported ${favorites.length} favorites`);

    // 5. Import inquiries
    const inquiries = JSON.parse(fs.readFileSync(path.join(backupDir, 'inquiries.json'), 'utf8'));
    for (const i of inquiries) {
      await connection.execute(
        `INSERT INTO inquiries (id, propertyId, propertyTitle, name, email, phone, message, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status)`,
        [i.id, i.propertyId, i.propertyTitle, i.name, i.email, i.phone || '', i.message, i.status || 'new', i.createdAt]
      );
    }
    console.log(`✓ Imported ${inquiries.length} inquiries`);

    // 6. Import properties
    const properties = JSON.parse(fs.readFileSync(path.join(backupDir, 'properties.json'), 'utf8'));
    for (const p of properties) {
      const amenitiesStr = JSON.stringify(p.amenities || []);
      const imagesStr = JSON.stringify(p.images || []);
      await connection.execute(
        `INSERT INTO properties (
          id, title, description, status, price, address, city, neighborhood,
          latitude, longitude, bedrooms, bathrooms, area, propertyType,
          amenities, images, featured, available, googleMapsUrl, blueprintUrl, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title=VALUES(title), description=VALUES(description), price=VALUES(price),
          images=VALUES(images), updatedAt=VALUES(updatedAt)`,
        [
          p.id, p.title, p.description || '', p.status, p.price || 0, p.address || '',
          p.city || '', p.neighborhood || '', p.latitude || 0, p.longitude || 0,
          p.bedrooms || 0, p.bathrooms || 0, p.area || 0, p.propertyType || 'apartment',
          amenitiesStr, imagesStr, p.featured ? 1 : 0, p.available ? 1 : 0,
          p.googleMapsUrl || '', p.blueprintUrl || '', p.createdAt, p.updatedAt
        ]
      );
    }
    console.log(`✓ Imported ${properties.length} properties!`);

    console.log('\n🎉 ALL DATA HAS BEEN FULLY MIGRATED TO HOSTINGER MYSQL!\n');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

runImport();

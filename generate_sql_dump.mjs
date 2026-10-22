import fs from 'fs';
import path from 'path';

const backupDir = path.join(process.cwd(), 'backup_data');

const schemaSql = `-- Hostinger MySQL Database Schema for BNBG Real Estate Platform
-- Character set: utf8mb4 (supports emoji, accents, special symbols)

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL,
  \`username\` VARCHAR(100) NOT NULL,
  \`role\` VARCHAR(20) NOT NULL DEFAULT 'user',
  \`password\` VARCHAR(255) NOT NULL DEFAULT '',
  \`avatar\` LONGTEXT,
  \`createdAt\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`properties\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` LONGTEXT,
  \`status\` VARCHAR(20) NOT NULL,
  \`price\` BIGINT NOT NULL DEFAULT 0,
  \`address\` VARCHAR(255) DEFAULT '',
  \`city\` VARCHAR(100) NOT NULL,
  \`neighborhood\` VARCHAR(100) DEFAULT '',
  \`latitude\` DOUBLE DEFAULT 0,
  \`longitude\` DOUBLE DEFAULT 0,
  \`bedrooms\` INT DEFAULT 0,
  \`bathrooms\` INT DEFAULT 0,
  \`area\` INT DEFAULT 0,
  \`propertyType\` VARCHAR(50) NOT NULL,
  \`amenities\` LONGTEXT,
  \`images\` LONGTEXT,
  \`featured\` TINYINT(1) DEFAULT 0,
  \`available\` TINYINT(1) DEFAULT 1,
  \`googleMapsUrl\` VARCHAR(500) DEFAULT '',
  \`blueprintUrl\` VARCHAR(500) DEFAULT '',
  \`createdAt\` VARCHAR(64) NOT NULL,
  \`updatedAt\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_city\` (\`city\`),
  KEY \`idx_status\` (\`status\`),
  KEY \`idx_property_type\` (\`propertyType\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`inquiries\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`propertyId\` VARCHAR(64) NOT NULL,
  \`propertyTitle\` VARCHAR(255) NOT NULL,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL,
  \`phone\` VARCHAR(50) DEFAULT '',
  \`message\` TEXT,
  \`status\` VARCHAR(20) DEFAULT 'new',
  \`createdAt\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_inq_property\` (\`propertyId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`favorites\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`userEmail\` VARCHAR(191) NOT NULL,
  \`propertyId\` VARCHAR(64) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_fav_user\` (\`userEmail\`),
  UNIQUE KEY \`uniq_fav\` (\`userEmail\`, \`propertyId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`metadata\` (
  \`key\` VARCHAR(100) NOT NULL,
  \`value\` LONGTEXT,
  PRIMARY KEY (\`key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
`;

fs.writeFileSync(path.join(backupDir, 'schema.sql'), schemaSql.trim() + '\n');
console.log('✓ Created backup_data/schema.sql');

function escapeSqlString(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return isNaN(val) ? '0' : String(val);
  if (typeof val === 'object') val = JSON.stringify(val);
  
  const str = String(val)
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case '\0': return '\\0';
        case '\x08': return '\\b';
        case '\x09': return '\\t';
        case '\x1a': return '\\z';
        case '\n': return '\\n';
        case '\r': return '\\r';
        case '"':
        case "'":
        case '\\':
        case '%':
          return '\\' + char;
        default:
          return char;
      }
    });
  return `'${str}'`;
}

function generateFullSql() {
  let fullSql = schemaSql + '\n\n-- Data Dump\n';

  // 1. Users
  const users = JSON.parse(fs.readFileSync(path.join(backupDir, 'users.json'), 'utf8'));
  if (users.length > 0) {
    fullSql += `\n-- Table: users\n`;
    for (const u of users) {
      fullSql += `INSERT INTO \`users\` (\`id\`, \`email\`, \`username\`, \`role\`, \`password\`, \`avatar\`, \`createdAt\`) VALUES (${escapeSqlString(u.id)}, ${escapeSqlString(u.email)}, ${escapeSqlString(u.username)}, ${escapeSqlString(u.role)}, ${escapeSqlString(u.password)}, ${escapeSqlString(u.avatar)}, ${escapeSqlString(u.createdAt)}) ON DUPLICATE KEY UPDATE \`username\`=VALUES(\`username\`);\n`;
    }
  }

  // 2. Metadata
  const metadata = JSON.parse(fs.readFileSync(path.join(backupDir, 'metadata.json'), 'utf8'));
  if (metadata.length > 0) {
    fullSql += `\n-- Table: metadata\n`;
    for (const m of metadata) {
      fullSql += `INSERT INTO \`metadata\` (\`key\`, \`value\`) VALUES (${escapeSqlString(m.key)}, ${escapeSqlString(m.value)}) ON DUPLICATE KEY UPDATE \`value\`=VALUES(\`value\`);\n`;
    }
  }

  // 3. Favorites
  const favorites = JSON.parse(fs.readFileSync(path.join(backupDir, 'favorites.json'), 'utf8'));
  if (favorites.length > 0) {
    fullSql += `\n-- Table: favorites\n`;
    for (const f of favorites) {
      fullSql += `INSERT INTO \`favorites\` (\`id\`, \`userEmail\`, \`propertyId\`) VALUES (${escapeSqlString(f.id)}, ${escapeSqlString(f.userEmail)}, ${escapeSqlString(f.propertyId)}) ON DUPLICATE KEY UPDATE \`propertyId\`=VALUES(\`propertyId\`);\n`;
    }
  }

  // 4. Inquiries
  const inquiries = JSON.parse(fs.readFileSync(path.join(backupDir, 'inquiries.json'), 'utf8'));
  if (inquiries.length > 0) {
    fullSql += `\n-- Table: inquiries\n`;
    for (const i of inquiries) {
      fullSql += `INSERT INTO \`inquiries\` (\`id\`, \`propertyId\`, \`propertyTitle\`, \`name\`, \`email\`, \`phone\`, \`message\`, \`status\`, \`createdAt\`) VALUES (${escapeSqlString(i.id)}, ${escapeSqlString(i.propertyId)}, ${escapeSqlString(i.propertyTitle)}, ${escapeSqlString(i.name)}, ${escapeSqlString(i.email)}, ${escapeSqlString(i.phone)}, ${escapeSqlString(i.message)}, ${escapeSqlString(i.status)}, ${escapeSqlString(i.createdAt)}) ON DUPLICATE KEY UPDATE \`status\`=VALUES(\`status\`);\n`;
    }
  }

  // 5. Properties
  const properties = JSON.parse(fs.readFileSync(path.join(backupDir, 'properties.json'), 'utf8'));
  if (properties.length > 0) {
    fullSql += `\n-- Table: properties (${properties.length} records)\n`;
    for (const p of properties) {
      const amenitiesStr = JSON.stringify(p.amenities || []);
      const imagesStr = JSON.stringify(p.images || []);
      fullSql += `INSERT INTO \`properties\` (\`id\`, \`title\`, \`description\`, \`status\`, \`price\`, \`address\`, \`city\`, \`neighborhood\`, \`latitude\`, \`longitude\`, \`bedrooms\`, \`bathrooms\`, \`area\`, \`propertyType\`, \`amenities\`, \`images\`, \`featured\`, \`available\`, \`googleMapsUrl\`, \`blueprintUrl\`, \`createdAt\`, \`updatedAt\`) VALUES (${escapeSqlString(p.id)}, ${escapeSqlString(p.title)}, ${escapeSqlString(p.description)}, ${escapeSqlString(p.status)}, ${escapeSqlString(p.price)}, ${escapeSqlString(p.address)}, ${escapeSqlString(p.city)}, ${escapeSqlString(p.neighborhood)}, ${escapeSqlString(p.latitude)}, ${escapeSqlString(p.longitude)}, ${escapeSqlString(p.bedrooms)}, ${escapeSqlString(p.bathrooms)}, ${escapeSqlString(p.area)}, ${escapeSqlString(p.propertyType)}, ${escapeSqlString(amenitiesStr)}, ${escapeSqlString(imagesStr)}, ${escapeSqlString(p.featured)}, ${escapeSqlString(p.available)}, ${escapeSqlString(p.googleMapsUrl)}, ${escapeSqlString(p.blueprintUrl)}, ${escapeSqlString(p.createdAt)}, ${escapeSqlString(p.updatedAt)}) ON DUPLICATE KEY UPDATE \`title\`=VALUES(\`title\`);\n`;
    }
  }

  fs.writeFileSync(path.join(backupDir, 'hostinger_database.sql'), fullSql);
  console.log(`✓ Created backup_data/hostinger_database.sql (${(fullSql.length / (1024 * 1024)).toFixed(2)} MB)`);
}

generateFullSql();

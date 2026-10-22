import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const backupDir = path.join(process.cwd(), 'backup_data');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function exportAll() {
  const tables = ['properties', 'users', 'inquiries', 'favorites', 'metadata'];
  const fullBackup = {};

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Error exporting ${table}:`, error.message);
    } else {
      fullBackup[table] = data;
      fs.writeFileSync(
        path.join(backupDir, `${table}.json`),
        JSON.stringify(data, null, 2)
      );
      console.log(`✓ Exported ${table}: ${data.length} records -> backup_data/${table}.json`);
    }
  }

  fs.writeFileSync(
    path.join(backupDir, 'full_backup.json'),
    JSON.stringify(fullBackup, null, 2)
  );
  console.log(`\n🎉 Full backup saved to backup_data/full_backup.json`);
}

exportAll();

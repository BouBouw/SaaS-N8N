import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrations = [
  {
    name: 'add_instance_id_to_api_keys',
    sql: `
      -- Check if column exists before adding
      SET @column_exists = (
        SELECT COUNT(*) 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'api_keys' 
        AND COLUMN_NAME = 'instance_id'
      );
      
      SET @sql = IF(@column_exists = 0, 
        'ALTER TABLE api_keys ADD COLUMN instance_id CHAR(36)',
        'SELECT "instance_id column already exists" AS message'
      );
      
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
      
      -- Add foreign key if not exists
      SET @fk_exists = (
        SELECT COUNT(*) 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_NAME = 'api_keys_instance_fk' 
        AND TABLE_NAME = 'api_keys' 
        AND TABLE_SCHEMA = DATABASE()
      );
      
      SET @sql2 = IF(@fk_exists = 0, 
        'ALTER TABLE api_keys ADD CONSTRAINT api_keys_instance_fk FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE',
        'SELECT "FK already exists" AS message'
      );
      
      PREPARE stmt2 FROM @sql2;
      EXECUTE stmt2;
      DEALLOCATE PREPARE stmt2;
    `
  },
  {
    name: 'add_downloads_to_public_workflows',
    sql: `
      SET @column_exists = (
        SELECT COUNT(*) 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'public_workflows' 
        AND COLUMN_NAME = 'downloads'
      );
      
      SET @sql = IF(@column_exists = 0, 
        'ALTER TABLE public_workflows ADD COLUMN downloads INT DEFAULT 0',
        'SELECT "downloads column already exists" AS message'
      );
      
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    `
  },
  {
    name: 'add_n8n_credentials_to_instances',
    sql: `
      SET @username_exists = (
        SELECT COUNT(*) 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'instances' 
        AND COLUMN_NAME = 'n8n_username'
      );
      
      SET @sql = IF(@username_exists = 0, 
        'ALTER TABLE instances ADD COLUMN n8n_username VARCHAR(255) DEFAULT "admin"',
        'SELECT "n8n_username already exists" AS message'
      );
      
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
      
      SET @password_exists = (
        SELECT COUNT(*) 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'instances' 
        AND COLUMN_NAME = 'n8n_password'
      );
      
      SET @sql2 = IF(@password_exists = 0, 
        'ALTER TABLE instances ADD COLUMN n8n_password VARCHAR(255)',
        'SELECT "n8n_password already exists" AS message'
      );
      
      PREPARE stmt2 FROM @sql2;
      EXECUTE stmt2;
      DEALLOCATE PREPARE stmt2;
    `
  }
];

export const runAutoMigrations = async () => {
  console.log('🔄 Running auto-migrations...');
  
  try {
    for (const migration of migrations) {
      try {
        console.log(`  ⏳ Applying: ${migration.name}`);
        
        // Execute the migration SQL
        await query(migration.sql);
        
        console.log(`  ✅ Applied: ${migration.name}`);
      } catch (error) {
        // Skip if already applied or other non-critical errors
        if (error.code === 'ER_DUP_FIELDNAME' || 
            error.code === 'ER_DUP_KEYNAME' ||
            error.sqlMessage?.includes('Duplicate column name') ||
            error.sqlMessage?.includes('already exists')) {
          console.log(`  ⏭️  Skipped: ${migration.name} (already applied)`);
        } else {
          console.error(`  ❌ Error in ${migration.name}:`, error.message);
        }
      }
    }
    
    console.log('✅ Auto-migrations completed\n');
  } catch (error) {
    console.error('❌ Auto-migrations failed:', error.message);
    // Don't throw - allow server to start even if migrations fail
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutoMigrations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

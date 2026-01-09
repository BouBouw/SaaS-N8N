import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrations = [
  {
    name: 'add_instance_id_to_api_keys',
    sql: `
      ALTER TABLE api_keys 
      ADD COLUMN IF NOT EXISTS instance_id CHAR(36);
      
      -- Add foreign key if not exists
      SET @constraint_exists = (
        SELECT COUNT(*) 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_NAME = 'api_keys_instance_fk' 
        AND TABLE_NAME = 'api_keys' 
        AND TABLE_SCHEMA = DATABASE()
      );
      
      SET @sql = IF(@constraint_exists = 0, 
        'ALTER TABLE api_keys ADD CONSTRAINT api_keys_instance_fk FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE',
        'SELECT "FK already exists" AS message'
      );
      
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    `
  },
  {
    name: 'add_downloads_to_public_workflows',
    sql: `
      ALTER TABLE public_workflows 
      ADD COLUMN IF NOT EXISTS downloads INT DEFAULT 0;
    `
  },
  {
    name: 'add_n8n_credentials_to_instances',
    sql: `
      ALTER TABLE instances 
      ADD COLUMN IF NOT EXISTS n8n_username VARCHAR(255) DEFAULT 'admin',
      ADD COLUMN IF NOT EXISTS n8n_password VARCHAR(255);
    `
  },
  {
    name: 'ensure_public_workflows_id_is_uuid',
    sql: `
      -- Check if id column is INT and convert to CHAR(36) if needed
      SET @column_type = (
        SELECT DATA_TYPE 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'public_workflows' 
        AND COLUMN_NAME = 'id'
      );
      
      -- Only convert if it's INT
      SET @sql = IF(@column_type = 'int', 
        'ALTER TABLE public_workflows MODIFY COLUMN id CHAR(36) NOT NULL',
        'SELECT "ID is already UUID" AS message'
      );
      
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    `
  },
  {
    name: 'ensure_favorites_id_is_uuid',
    sql: `
      -- Check if id column is INT and convert to CHAR(36) if needed
      SET @column_type = (
        SELECT DATA_TYPE 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'favorites' 
        AND COLUMN_NAME = 'id'
      );
      
      -- Only convert if it's INT
      SET @sql = IF(@column_type = 'int', 
        'ALTER TABLE favorites MODIFY COLUMN id CHAR(36) NOT NULL',
        'SELECT "ID is already UUID" AS message'
      );
      
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
      
      -- Also convert workflow_id to CHAR(36)
      SET @workflow_column_type = (
        SELECT DATA_TYPE 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'favorites' 
        AND COLUMN_NAME = 'workflow_id'
      );
      
      SET @sql2 = IF(@workflow_column_type = 'int', 
        'ALTER TABLE favorites MODIFY COLUMN workflow_id CHAR(36) NOT NULL',
        'SELECT "workflow_id is already UUID" AS message'
      );
      
      PREPARE stmt2 FROM @sql2;
      EXECUTE stmt2;
      DEALLOCATE PREPARE stmt2;
    `
  }
];

export const runAutoMigrations = async () => {
  console.log('🔄 Running auto-migrations...');
  
  const connection = await pool.getConnection();
  
  try {
    for (const migration of migrations) {
      try {
        console.log(`  ⏳ Applying: ${migration.name}`);
        
        // Split by semicolons and execute each statement
        const statements = migration.sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          await connection.query(statement);
        }
        
        console.log(`  ✅ Applied: ${migration.name}`);
      } catch (error) {
        // Skip if column already exists or other non-critical errors
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
  } finally {
    connection.release();
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

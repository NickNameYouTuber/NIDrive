"""
Migration script to update the database schema:
1. Add UUID fields to users and files tables
2. Add file privacy fields (is_public, public_url) to files table
3. Migrate data from integer IDs to UUIDs
"""
import os
import sys
import uuid
import sqlite3
from pathlib import Path

# Get the database path from environment or use default
DATABASE_PATH = os.environ.get("DATABASE_PATH", "./NIDriveBot.db")

def create_backup(db_path):
    """Create a backup of the database before migration"""
    backup_path = f"{db_path}.bak"
    print(f"Creating backup at {backup_path}")
    
    with open(db_path, 'rb') as src, open(backup_path, 'wb') as dst:
        dst.write(src.read())
    
    return backup_path

def run_migration():
    """Run the migration to update the schema and convert IDs to UUIDs"""
    db_path = Path(DATABASE_PATH)
    
    if not db_path.exists():
        print(f"Database file not found at {db_path}")
        return False
    
    # Create backup
    backup_path = create_backup(db_path)
    print(f"Backup created at {backup_path}")
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Start transaction
        conn.execute("BEGIN TRANSACTION")
        
        # 1. Add UUID fields to users table
        print("Adding UUID column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN uuid_id TEXT")
        
        # 2. Generate UUIDs for existing users
        print("Generating UUIDs for existing users...")
        cursor.execute("SELECT id FROM users")
        user_ids = cursor.fetchall()
        
        for user_id in user_ids:
            new_uuid = str(uuid.uuid4())
            cursor.execute("UPDATE users SET uuid_id = ? WHERE id = ?", (new_uuid, user_id[0]))
        
        # 3. Add UUID fields to files table
        print("Adding UUID column to files table...")
        cursor.execute("ALTER TABLE files ADD COLUMN uuid_id TEXT")
        
        # 4. Generate UUIDs for existing files
        print("Generating UUIDs for existing files...")
        cursor.execute("SELECT id FROM files")
        file_ids = cursor.fetchall()
        
        for file_id in file_ids:
            new_uuid = str(uuid.uuid4())
            cursor.execute("UPDATE files SET uuid_id = ? WHERE id = ?", (new_uuid, file_id[0]))
        
        # 5. Add is_public and public_url fields to files table
        print("Adding privacy fields to files table...")
        cursor.execute("ALTER TABLE files ADD COLUMN is_public BOOLEAN DEFAULT 0")
        cursor.execute("ALTER TABLE files ADD COLUMN public_url TEXT")
        
        # 6. Create new users table with UUID as primary key
        print("Creating new users table with UUID as primary key...")
        cursor.execute("""
        CREATE TABLE users_new (
            id TEXT PRIMARY KEY,
            telegram_id BIGINT UNIQUE,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            created_at TIMESTAMP
        )
        """)
        
        # 7. Migrate user data to the new table
        print("Migrating user data to new table...")
        cursor.execute("""
        INSERT INTO users_new (id, telegram_id, username, first_name, last_name, created_at)
        SELECT uuid_id, telegram_id, username, first_name, last_name, created_at FROM users
        """)
        
        # 8. Create new files table with UUID as primary key and foreign key
        print("Creating new files table with UUID as primary key...")
        cursor.execute("""
        CREATE TABLE files_new (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            filename TEXT,
            file_path TEXT,
            file_url TEXT,
            public_url TEXT,
            file_size BIGINT,
            folder TEXT,
            is_public BOOLEAN,
            created_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users_new (id) ON DELETE CASCADE
        )
        """)
        
        # 9. Migrate file data to the new table
        print("Migrating file data to new table...")
        cursor.execute("""
        INSERT INTO files_new (id, user_id, filename, file_path, file_url, file_size, folder, is_public, created_at)
        SELECT f.uuid_id, u.uuid_id, f.filename, f.file_path, f.file_url, f.file_size, f.folder, f.is_public, f.created_at
        FROM files f
        JOIN users u ON f.user_id = u.id
        """)
        
        # 10. Drop old tables
        print("Dropping old tables...")
        cursor.execute("DROP TABLE files")
        cursor.execute("DROP TABLE users")
        
        # 11. Rename new tables
        print("Renaming new tables...")
        cursor.execute("ALTER TABLE users_new RENAME TO users")
        cursor.execute("ALTER TABLE files_new RENAME TO files")
        
        # 12. Create indexes
        print("Creating indexes...")
        cursor.execute("CREATE INDEX idx_users_telegram_id ON users (telegram_id)")
        cursor.execute("CREATE INDEX idx_files_user_id ON files (user_id)")
        cursor.execute("CREATE INDEX idx_files_public_url ON files (public_url) WHERE public_url IS NOT NULL")
        
        # Commit transaction
        conn.commit()
        print("Migration completed successfully!")
        return True
        
    except Exception as e:
        # Rollback on error
        conn.rollback()
        print(f"Error during migration: {e}")
        print(f"Rolling back changes. Please restore from backup at {backup_path}")
        return False
        
    finally:
        # Close connection
        conn.close()

if __name__ == "__main__":
    print("Starting database migration to UUID schema...")
    success = run_migration()
    if success:
        print("Migration completed successfully.")
    else:
        print("Migration failed. Please check the error messages and restore from backup if needed.")
        sys.exit(1)

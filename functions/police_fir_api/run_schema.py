import sqlite3
import re
import os

def run_schema():
    db_file = 'police_fir.db'
    
    # Remove existing database file if it exists to start clean
    if os.path.exists(db_file):
        os.remove(db_file)
        
    print(f"Creating local SQLite database '{db_file}'...")
    
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # Enable Foreign Key support in SQLite
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Read the schema file
    with open('schema.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
        
    # Clean SQL Server specific commands/formatting
    # Remove single-line comments
    sql_clean = re.sub(r'--.*', '', sql_content)
    
    # Translate SQL Server specific NVARCHAR(MAX) to standard TEXT for SQLite compatibility
    sql_clean = re.sub(r'NVARCHAR\s*\(max\)', 'TEXT', sql_clean, flags=re.IGNORECASE)
    
    # Split statements by semicolon
    statements = sql_clean.split(';')
    
    success_count = 0
    fail_count = 0
    
    for statement in statements:
        stmt = statement.strip()
        if not stmt:
            continue
            
        try:
            cursor.execute(stmt)
            # If the statement is a CREATE TABLE, extract name for logging
            match = re.match(r'CREATE\s+TABLE\s+(\w+)', stmt, re.IGNORECASE)
            if match:
                print(f"Created table: {match.group(1)}")
                success_count += 1
        except sqlite3.Error as e:
            print(f"Failed to execute statement:\n{stmt}\nError: {e}\n")
            fail_count += 1
            
    conn.commit()
    conn.close()
    
    print("\n--- Execution Summary ---")
    print(f"Successfully executed: {success_count} table creations")
    print(f"Failed statements: {fail_count}")
    if fail_count == 0:
        print(f"[SUCCESS] Database '{db_file}' created successfully and ready for use!")
    else:
        print("[WARNING] Database creation finished with errors.")

if __name__ == '__main__':
    run_schema()

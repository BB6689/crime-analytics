import re

def validate_schema():
    with open('schema.sql', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all CREATE TABLE statements and extract table name and contents
    # Simple regex for CREATE TABLE [name] ( ... )
    table_matches = re.findall(r'CREATE\s+TABLE\s+(\w+)\s*\((.*?)\);', content, re.DOTALL | re.IGNORECASE)
    
    created_tables = set()
    errors = []

    print(f"Found {len(table_matches)} table definitions in schema.sql.\n")

    for table_name, body in table_matches:
        # Check for duplicate table declarations
        if table_name.lower() in created_tables:
            errors.append(f"Duplicate table declaration: '{table_name}'")
        
        # Check foreign key references in the table body
        # Matches: FOREIGN KEY (col) REFERENCES ReferencedTable(ref_col)
        # Matches: CONSTRAINT constraint_name FOREIGN KEY (col) REFERENCES ReferencedTable(ref_col)
        fk_matches = re.findall(r'FOREIGN\s+KEY\s*\(.*?\)\s*REFERENCES\s+(\w+)\s*\(.*?\)', body, re.IGNORECASE)
        for ref_table in fk_matches:
            if ref_table.lower() != table_name.lower() and ref_table.lower() not in created_tables:
                errors.append(f"Table '{table_name}' references table '{ref_table}', but '{ref_table}' has not been defined yet in the DDL sequence.")

        created_tables.add(table_name.lower())
        print(f"Parsed table: '{table_name}'")

    print("\n--- Validation Results ---")
    if errors:
        print("[FAIL] Validation Failed with the following errors:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("[SUCCESS] Validation Succeeded! All tables are created in the correct dependency order.")
        return True

if __name__ == '__main__':
    validate_schema()

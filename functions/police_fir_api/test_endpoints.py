import urllib.request
import json

def test_app():
    print("Testing Police FIR API endpoints...")
    
    # 1. Test GET /api/cases
    try:
        with urllib.request.urlopen("http://localhost:3000/api/cases") as response:
            data = json.loads(response.read().decode())
            print(f"[SUCCESS] GET /api/cases returned {len(data)} cases.")
            if len(data) > 0:
                print(f"  First case CrimeNo: {data[0]['CrimeNo']}")
    except Exception as e:
        print(f"[FAIL] GET /api/cases failed: {e}")
        
    # 2. Test GET /api/tables
    try:
        with urllib.request.urlopen("http://localhost:3000/api/tables") as response:
            data = json.loads(response.read().decode())
            print(f"[SUCCESS] GET /api/tables returned {len(data)} tables.")
            print(f"  First table name: {data[0]['tableName']} (rows: {data[0]['rowCount']})")
    except Exception as e:
        print(f"[FAIL] GET /api/tables failed: {e}")
        
    # 3. Test GET /api/lookups
    try:
        with urllib.request.urlopen("http://localhost:3000/api/lookups") as response:
            data = json.loads(response.read().decode())
            print(f"[SUCCESS] GET /api/lookups returned list of lookups.")
            print(f"  Available police units: {len(data.get('units', []))}")
            print(f"  Available officers: {len(data.get('employees', []))}")
            print(f"  Available Acts: {len(data.get('acts', []))}")
    except Exception as e:
        print(f"[FAIL] GET /api/lookups failed: {e}")

if __name__ == '__main__':
    test_app()

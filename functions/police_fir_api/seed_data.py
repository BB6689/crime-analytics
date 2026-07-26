import sqlite3
import os
import subprocess

def seed_database():
    db_file = 'police_fir.db'
    
    # If the database doesn't exist, create it by running run_schema.py
    if not os.path.exists(db_file):
        print("Database file not found. Running run_schema.py first...")
        subprocess.run(['python', 'run_schema.py'], check=True)
        
    print(f"Connecting to '{db_file}' to seed lookup tables...")
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    try:
        # 1. Seed State
        cursor.executemany("INSERT OR IGNORE INTO State (StateID, StateName, NationalityID, Active) VALUES (?, ?, ?, ?)", [
            (1, 'Karnataka', 91, 1),
            (2, 'Maharashtra', 91, 1),
            (3, 'Tamil Nadu', 91, 1)
        ])
        
        # 2. Seed District
        cursor.executemany("INSERT OR IGNORE INTO District (DistrictID, DistrictName, StateID, Active) VALUES (?, ?, ?, ?)", [
            (10, 'Bengaluru City', 1, 1),
            (20, 'Mysuru', 1, 1),
            (30, 'Mangaluru', 1, 1)
        ])
        
        # 3. Seed UnitType
        cursor.executemany("INSERT OR IGNORE INTO UnitType (UnitTypeID, UnitTypeName, CityDistState, Hierarchy, Active) VALUES (?, ?, ?, ?, ?)", [
            (100, 'Police Station', 'District', 5, 1),
            (200, 'Circle Office', 'District', 4, 1),
            (300, 'SP Office', 'District', 2, 1)
        ])
        
        # 4. Seed Unit
        cursor.executemany("INSERT OR IGNORE INTO Unit (UnitID, UnitName, TypeID, ParentUnit, NationalityID, StateID, DistrictID, Active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
            (4300, 'Town Hall Police Station', 100, None, 91, 1, 10, 1),
            (4400, 'Mysuru Palace Police Station', 100, None, 91, 1, 20, 1),
            (4500, 'SP Office Mysuru', 200, None, 91, 1, 20, 1)
        ])
        
        # 5. Seed Rank
        cursor.executemany("INSERT OR IGNORE INTO Rank (RankID, RankName, Hierarchy, Active) VALUES (?, ?, ?, ?)", [
            (1, 'Constable', 10, 1),
            (2, 'Sub-Inspector', 5, 1),
            (3, 'Inspector', 3, 1),
            (4, 'DSP', 1, 1)
        ])
        
        # 6. Seed Designation
        cursor.executemany("INSERT OR IGNORE INTO Designation (DesignationID, DesignationName, Active, SortOrder) VALUES (?, ?, ?, ?)", [
            (10, 'Investigating Officer', 1, 1),
            (20, 'Station House Officer (SHO)', 1, 2),
            (30, 'Circle Inspector', 1, 3)
        ])
        
        # 7. Seed Employee
        cursor.executemany("INSERT OR IGNORE INTO Employee (EmployeeID, DistrictID, UnitID, RankID, DesignationID, KGID, FirstName, EmployeeDOB, GenderID, BloodGroupID, PhysicallyChallenged, AppointmentDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            (1, 10, 4300, 2, 10, 'KG10001', 'Rajesh Kumar', '1985-05-15', 1, 3, 0, '2010-06-01'),
            (2, 20, 4400, 3, 20, 'KG10002', 'Anil Dev', '1980-08-20', 1, 1, 0, '2005-02-15'),
            (3, 10, 4300, 1, 10, 'KG10003', 'Suresh Gowda', '1992-12-10', 1, 2, 0, '2015-09-01')
        ])
        
        # 8. Seed Court
        cursor.executemany("INSERT OR IGNORE INTO Court (CourtID, CourtName, DistrictID, StateID, Active) VALUES (?, ?, ?, ?, ?)", [
            (1, 'Bengaluru Metropolitan Magistrate Court', 10, 1, 1),
            (2, 'Mysuru District Sessions Court', 20, 1, 1)
        ])
        
        # 9. Seed CaseCategory
        cursor.executemany("INSERT OR IGNORE INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (?, ?)", [
            (1, 'FIR'),
            (2, 'UDR'),
            (3, 'Zero FIR'),
            (4, 'PAR')
        ])
        
        # 10. Seed GravityOffence
        cursor.executemany("INSERT OR IGNORE INTO GravityOffence (GravityOffenceID, LookupValue) VALUES (?, ?)", [
            (10, 'Heinous'),
            (20, 'Non-Heinous')
        ])
        
        # 11. Seed CrimeHead
        cursor.executemany("INSERT OR IGNORE INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (?, ?, ?)", [
            (1, 'Crimes Against Body', 1),
            (2, 'Crimes Against Property', 1),
            (3, 'White Collar Crimes', 1)
        ])
        
        # 12. Seed CrimeSubHead
        cursor.executemany("INSERT OR IGNORE INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (?, ?, ?, ?)", [
            (10, 1, 'Murder', 1),
            (20, 2, 'Robbery', 2),
            (30, 2, 'House Breaking', 3),
            (40, 3, 'Cheating / Fraud', 4)
        ])
        
        # 13. Seed CaseStatusMaster
        cursor.executemany("INSERT OR IGNORE INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (?, ?)", [
            (1, 'Under Investigation'),
            (2, 'Charge Sheeted'),
            (3, 'Closed (Conviction)'),
            (4, 'Closed (Acquittal)')
        ])
        
        # 14. Seed CasteMaster
        cursor.executemany("INSERT OR IGNORE INTO CasteMaster (caste_master_id, caste_master_name) VALUES (?, ?)", [
            (1, 'General'),
            (2, 'SC'),
            (3, 'ST'),
            (4, 'OBC')
        ])
        
        # 15. Seed ReligionMaster
        cursor.executemany("INSERT OR IGNORE INTO ReligionMaster (ReligionID, ReligionName) VALUES (?, ?)", [
            (1, 'Hindu'),
            (2, 'Muslim'),
            (3, 'Christian'),
            (4, 'Sikh')
        ])
        
        # 16. Seed OccupationMaster
        cursor.executemany("INSERT OR IGNORE INTO OccupationMaster (OccupationID, OccupationName) VALUES (?, ?)", [
            (1, 'Farmer'),
            (2, 'Businessperson'),
            (3, 'Software Engineer'),
            (4, 'Government Employee'),
            (5, 'Unemployed')
        ])
        
        # 17. Seed Act
        cursor.executemany("INSERT OR IGNORE INTO Act (ActCode, ActDescription, ShortName, Active) VALUES (?, ?, ?, ?)", [
            ('IPC', 'Indian Penal Code', 'IPC', 1),
            ('NDPS', 'Narcotic Drugs and Psychotropic Substances Act', 'NDPS', 1),
            ('KPS', 'Karnataka Police Act', 'KPS', 1)
        ])
        
        # 18. Seed Section
        cursor.executemany("INSERT OR IGNORE INTO Section (ActCode, SectionCode, SectionDescription, Active) VALUES (?, ?, ?, ?)", [
            ('IPC', '302', 'Punishment for Murder', 1),
            ('IPC', '379', 'Punishment for Theft', 1),
            ('IPC', '420', 'Cheating and dishonestly inducing delivery of property', 1),
            ('NDPS', '20', 'Punishment for contravention in relation to cannabis', 1)
        ])
        
        # 19. Seed CrimeHeadActSection
        cursor.executemany("INSERT OR IGNORE INTO CrimeHeadActSection (CrimeHeadID, ActCode, SectionCode) VALUES (?, ?, ?)", [
            (1, 'IPC', '302'),
            (2, 'IPC', '379'),
            (3, 'IPC', '420')
        ])
        
        # Seed a dummy initial case to demonstrate data in UI
        # CaseMasterID = 1001
        cursor.executemany("INSERT OR IGNORE INTO CaseMaster (CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID, CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID, IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            (1001, '1043004300202600001', '202600001', '2026-07-15', 1, 4300, 1, 10, 1, 10, 1, 1, '2026-07-14 22:30:00', '2026-07-14 23:30:00', '2026-07-15 01:15:00', 12.9716, 77.5946, 'A verbal altercation broke out near Town Hall, which escalated into physical assault. The victim suffered injuries.')
        ])
        
        # Seed Complainant for this case
        cursor.executemany("INSERT OR IGNORE INTO ComplainantDetails (ComplainantID, CaseMasterID, ComplainantName, AgeYear, OccupationID, ReligionID, CasteID, GenderID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
            (501, 1001, 'Karthik Gowda', 34, 3, 1, 1, 1)
        ])
        
        # Seed Victim for this case
        cursor.executemany("INSERT OR IGNORE INTO Victim (VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID, VictimPolice) VALUES (?, ?, ?, ?, ?, ?)", [
            (601, 1001, 'Karthik Gowda', 34, 1, '0')
        ])
        
        # Seed Accused for this case
        cursor.executemany("INSERT OR IGNORE INTO Accused (AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID, PersonID) VALUES (?, ?, ?, ?, ?, ?)", [
            (701, 1001, 'Ramesh Hegde', 28, 1, 'A1')
        ])
        
        # Seed ActSectionAssociation for this case
        cursor.executemany("INSERT OR IGNORE INTO ActSectionAssociation (CaseMasterID, ActID, SectionID, ActOrderID, SectionOrderID) VALUES (?, ?, ?, ?, ?)", [
            (1001, 'IPC', '302', 1, 1)
        ])
        
        # Seed Inv_OccuranceTime for this case
        cursor.executemany("INSERT OR IGNORE INTO Inv_OccuranceTime (CaseMasterID, IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)", [
            (1001, '2026-07-14 22:30:00', '2026-07-14 23:30:00', '2026-07-15 01:15:00', 12.9716, 77.5946)
        ])
        
        conn.commit()
        print("[SUCCESS] Database successfully seeded with lookup values and sample FIR!")
    except sqlite3.Error as e:
        conn.rollback()
        print(f"[ERROR] Error seeding database: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    seed_database()

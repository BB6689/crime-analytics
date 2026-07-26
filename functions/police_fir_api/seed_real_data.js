const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function runSeeder() {
  console.log("Starting real database seeding from frontend definitions...");

  const dbPath = path.join(__dirname, 'police_fir.db');
  
  // Re-create the database to ensure a clean state
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log("Removed old police_fir.db");
  }

  // 1. Initialize schema
  const db = new DatabaseSync(dbPath);
  db.prepare('PRAGMA foreign_keys = ON;').run();

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  // Clean comments and translate NVARCHAR(MAX)
  let cleanSql = schemaSql
    .replace(/--.*/g, '')
    .replace(/NVARCHAR\s*\(max\)/gi, 'TEXT');

  const statements = cleanSql.split(';');
  for (let stmt of statements) {
    const s = stmt.trim();
    if (s) {
      try {
        db.prepare(s).run();
      } catch (err) {
        console.error(`Failed to execute statement: ${s.substring(0, 50)}...\nError: ${err.message}`);
      }
    }
  }
  console.log("Database schema initialized.");

  // 2. Load frontend data from files
  const incidentDataContent = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'mockData', 'incidentData.js'), 'utf8');
  const realStationsContent = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'mockData', 'realPoliceStations.js'), 'utf8');

  // Extract DISTRICT_IDS
  const districtIdsMatch = incidentDataContent.match(/export const DISTRICT_IDS = {([\s\S]*?)};/);
  if (!districtIdsMatch) throw new Error("Could not find DISTRICT_IDS in incidentData.js");
  const districtIds = {};
  districtIdsMatch[1].split(',').forEach(line => {
    const parts = line.split(':');
    if (parts.length === 2) {
      const key = parts[0].trim().replace(/['"]/g, '');
      const val = parts[1].trim().replace(/['"]/g, '');
      if (key && val) districtIds[key] = val;
    }
  });

  // Extract KSP_DIVISIONS names
  const divisionsMatch = incidentDataContent.match(/export const KSP_DIVISIONS = {([\s\S]*?)};/);
  if (!divisionsMatch) throw new Error("Could not find KSP_DIVISIONS in incidentData.js");
  const divisions = {};
  
  // Custom simple parser for division names
  const divisionRegex = /(\w+):\s*{[^}]*?name:\s*"([^"]+)"/g;
  let divMatch;
  while ((divMatch = divisionRegex.exec(divisionsMatch[1])) !== null) {
    divisions[divMatch[1]] = divMatch[2];
  }

  // Parse realPoliceStations.js — find the first '[' and parse the JSON array from there
  const firstBracket = realStationsContent.indexOf('[');
  if (firstBracket === -1) throw new Error("Could not find JSON array in realPoliceStations.js");
  const lastBracket = realStationsContent.lastIndexOf('];');
  const jsonText = realStationsContent.slice(firstBracket, lastBracket > firstBracket ? lastBracket + 1 : realStationsContent.length);
  
  const realStationsList = JSON.parse(jsonText);
  console.log(`Parsed ${realStationsList.length} real stations from realPoliceStations.js`);

  // 3. Seed lookup tables
  console.log("Seeding states and lookup values...");
  db.prepare("INSERT INTO State (StateID, StateName, NationalityID, Active) VALUES (1, 'Karnataka', 91, 1)").run();

  db.prepare("INSERT INTO UnitType (UnitTypeID, UnitTypeName, CityDistState, Hierarchy, Active) VALUES (100, 'Police Station', 'District', 5, 1)").run();
  db.prepare("INSERT INTO UnitType (UnitTypeID, UnitTypeName, CityDistState, Hierarchy, Active) VALUES (200, 'Circle Office', 'District', 4, 1)").run();
  
  db.prepare("INSERT INTO Rank (RankID, RankName, Hierarchy, Active) VALUES (1, 'Constable', 10, 1)").run();
  db.prepare("INSERT INTO Rank (RankID, RankName, Hierarchy, Active) VALUES (2, 'Sub-Inspector', 5, 1)").run();
  db.prepare("INSERT INTO Rank (RankID, RankName, Hierarchy, Active) VALUES (3, 'Inspector', 3, 1)").run();
  db.prepare("INSERT INTO Rank (RankID, RankName, Hierarchy, Active) VALUES (4, 'DSP', 1, 1)").run();

  db.prepare("INSERT INTO Designation (DesignationID, DesignationName, Active, SortOrder) VALUES (10, 'Investigating Officer', 1, 1)").run();
  db.prepare("INSERT INTO Designation (DesignationID, DesignationName, Active, SortOrder) VALUES (20, 'Station House Officer (SHO)', 1, 2)").run();

  db.prepare("INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (1, 'FIR')").run();
  db.prepare("INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (3, 'UDR')").run();
  db.prepare("INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (4, 'PAR')").run();
  db.prepare("INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (8, 'Zero FIR')").run();

  db.prepare("INSERT INTO GravityOffence (GravityOffenceID, LookupValue) VALUES (1, 'Heinous')").run();
  db.prepare("INSERT INTO GravityOffence (GravityOffenceID, LookupValue) VALUES (2, 'Non-Heinous')").run();

  db.prepare("INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (1, 'Crimes Against Body', 1)").run();
  db.prepare("INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (2, 'Crimes Against Property', 1)").run();
  db.prepare("INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (3, 'White Collar Crimes', 1)").run();

  const subHeads = [
    [10, 1, 'Murder', 1],
    [20, 2, 'Robbery', 2],
    [30, 2, 'House Breaking', 3],
    [40, 3, 'Cheating / Fraud', 4],
    [50, 1, 'Assault', 5],
    [60, 2, 'Theft', 6],
    [70, 2, 'Vandalism', 7],
    [80, 3, 'Narcotics (NDPS)', 8]
  ];
  const insertSubHead = db.prepare("INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (?, ?, ?, ?)");
  subHeads.forEach(sh => insertSubHead.run(...sh));

  db.prepare("INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (1, 'Under Investigation')").run();
  db.prepare("INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (2, 'Charge Sheeted')").run();
  db.prepare("INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (3, 'Closed')").run();

  const castes = [[1, 'General'], [2, 'SC'], [3, 'ST'], [4, 'OBC']];
  const insertCaste = db.prepare("INSERT INTO CasteMaster (caste_master_id, caste_master_name) VALUES (?, ?)");
  castes.forEach(c => insertCaste.run(...c));

  const religions = [[1, 'Hindu'], [2, 'Muslim'], [3, 'Christian'], [4, 'Sikh']];
  const insertRel = db.prepare("INSERT INTO ReligionMaster (ReligionID, ReligionName) VALUES (?, ?)");
  religions.forEach(r => insertRel.run(...r));

  const occupations = [
    [1, 'Farmer'], [2, 'Businessperson'], [3, 'Software Engineer'],
    [4, 'Government Employee'], [5, 'Unemployed']
  ];
  const insertOcc = db.prepare("INSERT INTO OccupationMaster (OccupationID, OccupationName) VALUES (?, ?)");
  occupations.forEach(o => insertOcc.run(...o));

  db.prepare("INSERT INTO Act (ActCode, ActDescription, ShortName, Active) VALUES ('IPC', 'Indian Penal Code', 'IPC', 1)").run();
  db.prepare("INSERT INTO Act (ActCode, ActDescription, ShortName, Active) VALUES ('NDPS', 'Narcotic Drugs and Psychotropic Substances Act', 'NDPS', 1)").run();

  const sections = [
    ['IPC', '302', 'Punishment for Murder', 1],
    ['IPC', '307', 'Attempt to Murder', 1],
    ['IPC', '379', 'Punishment for Theft', 1],
    ['IPC', '397', 'Robbery or Dacoity', 1],
    ['IPC', '454', 'House-breaking', 1],
    ['IPC', '457', 'House-breaking by Night', 1],
    ['IPC', '354', 'Assault on Woman', 1],
    ['NDPS', '20', 'Cannabis Offences', 1]
  ];
  const insertSec = db.prepare("INSERT INTO Section (ActCode, SectionCode, SectionDescription, Active) VALUES (?, ?, ?, ?)");
  sections.forEach(s => insertSec.run(...s));

  // 4. Seed Districts (from KSP_DIVISIONS)
  console.log("Seeding districts...");
  const insertDist = db.prepare("INSERT OR IGNORE INTO District (DistrictID, DistrictName, StateID, Active) VALUES (?, ?, ?, ?)");
  Object.keys(districtIds).forEach(key => {
    const distId = parseInt(districtIds[key]);
    const distName = divisions[key] || key.replace('_', ' ');
    insertDist.run(distId, distName, 1, 1);
  });

  // 5. Seed Police Stations (from realPoliceStations)
  console.log("Seeding police station units...");
  const insertUnit = db.prepare(`
    INSERT OR IGNORE INTO Unit (UnitID, UnitName, TypeID, ParentUnit, NationalityID, StateID, DistrictID, Active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Helper function to assign district based on coordinates (re-implemented from frontend logic)
  // Maps coordinates to a division
  function assignDivision(lat, lon) {
    // Basic bounding boxes or distance matching to find the division
    // To keep it simple, we search KSP_DIVISIONS and match closest by Euclidean distance
    let closestDiv = null;
    let minDist = Infinity;

    const divisionsList = [
      { key: "BAGALKOT", coords: [16.1813, 75.6958] },
      { key: "BALLARI", coords: [15.1394, 76.9214] },
      { key: "BELAGAVI_CITY", coords: [15.8497, 74.4977] },
      { key: "BELAGAVI_DIST", coords: [15.8797, 74.5277] },
      { key: "BENGALURU_CITY", coords: [12.9716, 77.5946] },
      { key: "BENGALURU_DIST", coords: [13.2000, 77.7000] },
      { key: "BIDAR", coords: [17.9104, 77.5199] },
      { key: "CHAMARAJANAGAR", coords: [11.9261, 76.9402] },
      { key: "CHICKBALLAPURA", coords: [13.4328, 77.7275] },
      { key: "CHIKKAMAGALURU", coords: [13.3161, 75.7720] },
      { key: "CHITRADURGA", coords: [14.2251, 76.3980] },
      { key: "DAKSHINA_KANNADA", coords: [12.8711, 75.2443] },
      { key: "DAVANAGERE", coords: [14.4644, 75.9218] },
      { key: "DHARWAD", coords: [15.4589, 75.0078] },
      { key: "GADAG", coords: [15.4168, 75.6264] },
      { key: "HASSAN", coords: [13.0068, 76.1026] },
      { key: "HAVERI", coords: [14.7959, 75.4029] },
      { key: "HUBBALLI_DHARWAD_CITY", coords: [15.4244, 75.0500] },
      { key: "KGF", coords: [12.9582, 78.2710] },
      { key: "KALABURAGI", coords: [17.3297, 76.8343] },
      { key: "KALABURAGI_CITY", coords: [17.3400, 76.8400] },
      { key: "KODAGU", coords: [12.4244, 75.7382] },
      { key: "KOLAR", coords: [13.1362, 78.1298] },
      { key: "KOPPAL", coords: [15.3467, 76.1553] },
      { key: "MANDYA", coords: [12.5218, 76.8951] },
      { key: "MANGALURU_CITY", coords: [12.9141, 74.8560] },
      { key: "MYSURU_CITY", coords: [12.2958, 76.6394] },
      { key: "MYSURU_DIST", coords: [12.3100, 76.6000] },
      { key: "RAICHUR", coords: [16.2076, 77.3556] },
      { key: "SHIVAMOGGA", coords: [13.9299, 75.5681] },
      { key: "TUMAKURU", coords: [13.3379, 77.1173] },
      { key: "UDUPI", coords: [13.3409, 74.7421] },
      { key: "UTTARA_KANNADA", coords: [14.8082, 74.1301] },
      { key: "VIJAYAPUR", coords: [16.8302, 75.7100] },
      { key: "YADGIR", coords: [16.7600, 77.1377] },
      { key: "VIJAYANAGARA", coords: [15.2689, 76.3909] }
    ];

    divisionsList.forEach(div => {
      const dx = lat - div.coords[0];
      const dy = lon - div.coords[1];
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closestDiv = div.key;
      }
    });

    return closestDiv;
  }

  let stationIdx = 0;
  realStationsList.forEach((osmSt) => {
    const divKey = assignDivision(osmSt.lat, osmSt.lon);
    if (!divKey) return;

    const distId = parseInt(districtIds[divKey]);
    if (isNaN(distId)) return;

    const unitId = stationIdx + 1; // Matches stationIdx + 1 integer UnitID
    insertUnit.run(unitId, osmSt.name, 100, null, 91, 1, distId, 1);
    stationIdx++;
  });
  console.log(`Successfully seeded ${stationIdx} police units into the database.`);

  // 6. Seed Employees
  console.log("Seeding police employees...");
  const insertEmp = db.prepare(`
    INSERT INTO Employee (EmployeeID, DistrictID, UnitID, RankID, DesignationID, KGID, FirstName, EmployeeDOB, GenderID, BloodGroupID, PhysicallyChallenged, AppointmentDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Seed 1 employee per district for simplicity
  let empIdx = 1;
  Object.keys(districtIds).forEach(key => {
    const distId = parseInt(districtIds[key]);
    
    // Find first unit in this district
    const unitRow = db.prepare("SELECT UnitID FROM Unit WHERE DistrictID = ? LIMIT 1").get(distId);
    if (unitRow) {
      const name = `PSI ${key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}`;
      insertEmp.run(empIdx, distId, unitRow.UnitID, 2, 10, `KG${10000 + empIdx}`, name, '1985-06-15', 1, 3, 0, '2012-05-01');
      empIdx++;
    }
  });

  // 7. Seed Courts
  console.log("Seeding jurisdictional courts...");
  const insertCourt = db.prepare("INSERT INTO Court (CourtID, CourtName, DistrictID, StateID, Active) VALUES (?, ?, ?, ?, ?)");
  let courtIdx = 1;
  Object.keys(districtIds).forEach(key => {
    const distId = parseInt(districtIds[key]);
    const name = `Judicial Magistrate Court, ${key.replace('_', ' ')}`;
    insertCourt.run(courtIdx, name, distId, 1, 1);
    courtIdx++;
  });

  // NOTE: No sample/fake cases are seeded. The database starts empty.
  // Real cases will be added through the FIR Registration interface in the app.
  console.log("[SUCCESS] Seeding complete! Reference tables and police stations populated. No sample cases seeded — database starts clean.");
}

runSeeder();

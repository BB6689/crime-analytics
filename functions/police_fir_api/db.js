let DatabaseSync;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  // node:sqlite module is not present in Node < 22.5.0 runtimes (e.g. Catalyst Node 18/20)
}
const path = require('path');
const catalyst = require('zcatalyst-sdk-node');

// Helper to determine if we are running in Catalyst cloud environment
function isCatalystEnv() {
  return !!(process.env.CATALYST_ENV || process.env.IS_CATALYST || process.env.CATALYST_APP_ID || process.env.CATALYST_PROJECT_ID || !DatabaseSync);
}

// Get the active database connection (SQLite or Catalyst SDK)
function getDb(req) {
  if (req && (isCatalystEnv() || req.headers)) {
    try {
      const app = catalyst.initialize(req);
      if (app && typeof app.zcql === 'function') {
        return {
          type: 'catalyst',
          app,
          datastore: app.datastore(),
          zcql: app.zcql()
        };
      }
    } catch (e) {
      console.warn("Catalyst initialize error:", e.message);
    }
  }

  if (!DatabaseSync) {
    console.warn("node:sqlite is not available in this Node runtime environment.");
    return { type: 'none' };
  }
  const dbPath = path.join(__dirname, 'police_fir.db');
  const sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.prepare('PRAGMA foreign_keys = ON;').run();
  return {
    type: 'sqlite',
    db: sqliteDb
  };
}

// Helper to extract rows from ZCQL query responses
function getZcqlRows(res, tableName) {
  if (!res || !Array.isArray(res)) return [];
  return res.map(row => row[tableName]);
}

// Helper to execute ZCQL query and extract rows
async function queryZcql(zcql, queryStr, tableName) {
  if (!zcql || typeof zcql.executeZCQLQuery !== 'function') {
    console.warn(`ZCQL client uninitialized for query: ${queryStr}`);
    return [];
  }
  try {
    const res = await zcql.executeZCQLQuery(queryStr);
    return getZcqlRows(res, tableName);
  } catch (error) {
    console.error(`ZCQL Error executing: ${queryStr}`, error.message);
    return [];
  }
}

// Helper to find MAX(id) + 1 in SQLite or Catalyst
async function getNextId(dbConn, tableName, pkName) {
  if (dbConn.type === 'sqlite') {
    try {
      const row = dbConn.db.prepare(`SELECT MAX(${pkName}) as maxId FROM [${tableName}]`).get();
      return (row && row.maxId ? row.maxId : 0) + 1;
    } catch (e) {
      return Math.floor(Math.random() * 1000000) + 1000;
    }
  } else {
    try {
      const res = await dbConn.zcql.executeZCQLQuery(`SELECT ${pkName} FROM ${tableName} ORDER BY ${pkName} DESC LIMIT 1`);
      if (res && res.length > 0) {
        return (res[0][tableName][pkName] || 0) + 1;
      }
      return 1;
    } catch (e) {
      console.warn(`Could not fetch MAX(${pkName}) for table ${tableName}. Using random ID.`, e);
      return Math.floor(Math.random() * 1000000) + 1000;
    }
  }
}

// ----------------------------------------------------------------------------
// DB INTERFACE METHODS
// ----------------------------------------------------------------------------

/**
 * Fetch all cases, joining status, station, officer, and demographics in memory or via SQL join.
 */
async function getCases(req) {
  const dbConn = getDb(req);

  if (dbConn.type === 'sqlite') {
    const query = `
      SELECT 
          c.CaseMasterID,
          c.CrimeNo,
          c.CaseNo,
          c.CrimeRegisteredDate,
          u.UnitName as PoliceStation,
          c.PoliceStationID,
          cc.LookupValue as Category,
          c.CaseCategoryID,
          go.LookupValue as Gravity,
          c.GravityOffenceID,
          ch.CrimeGroupName as MajorHead,
          c.CrimeMajorHeadID,
          csh.CrimeHeadName as MinorHead,
          c.CrimeMinorHeadID,
          cs.CaseStatusName as Status,
          c.CaseStatusID,
          crt.CourtName as Court,
          c.CourtID,
          e.FirstName as OfficerName,
          c.PolicePersonID,
          c.BriefFacts,
          c.IncidentFromDate,
          c.IncidentToDate,
          c.InfoReceivedPSDate,
          c.latitude,
          c.longitude
      FROM CaseMaster c
      LEFT JOIN Unit u ON c.PoliceStationID = u.UnitID
      LEFT JOIN CaseCategory cc ON c.CaseCategoryID = cc.CaseCategoryID
      LEFT JOIN GravityOffence go ON c.GravityOffenceID = go.GravityOffenceID
      LEFT JOIN CrimeHead ch ON c.CrimeMajorHeadID = ch.CrimeHeadID
      LEFT JOIN CrimeSubHead csh ON c.CrimeMinorHeadID = csh.CrimeSubHeadID
      LEFT JOIN CaseStatusMaster cs ON c.CaseStatusID = cs.CaseStatusID
      LEFT JOIN Court crt ON c.CourtID = crt.CourtID
      LEFT JOIN Employee e ON c.PolicePersonID = e.EmployeeID
      ORDER BY c.CrimeRegisteredDate DESC, c.CaseMasterID DESC;
    `;
    const cases = dbConn.db.prepare(query).all();

    // Fetch related complainant, victim, accused, and actsSections for each case
    for (let c of cases) {
      c.complainant = dbConn.db.prepare(`
        SELECT cd.ComplainantName as name, cd.AgeYear as age, cd.GenderID as gender,
               om.OccupationName as occupation, rm.ReligionName as religion, cm.caste_master_name as caste
        FROM ComplainantDetails cd
        LEFT JOIN OccupationMaster om ON cd.OccupationID = om.OccupationID
        LEFT JOIN ReligionMaster rm ON cd.ReligionID = rm.ReligionID
        LEFT JOIN CasteMaster cm ON cd.CasteID = cm.caste_master_id
        WHERE cd.CaseMasterID = ?
      `).get(c.CaseMasterID) || null;

      c.victim = dbConn.db.prepare(`
        SELECT v.VictimName as name, v.AgeYear as age, v.GenderID as gender, v.VictimPolice as isPolice
        FROM Victim v WHERE v.CaseMasterID = ?
      `).get(c.CaseMasterID) || null;
      if (c.victim) {
        c.victim.isPolice = c.victim.isPolice === '1' ? 'Yes' : 'No';
      }

      c.accused = dbConn.db.prepare(`
        SELECT a.AccusedName as name, a.AgeYear as age, a.GenderID as gender, a.PersonID as personId
        FROM Accused a WHERE a.CaseMasterID = ?
      `).all(c.CaseMasterID);

      c.actsSections = dbConn.db.prepare(`
        SELECT asa.ActID as actCode, asa.SectionID as sectionCode
        FROM ActSectionAssociation asa WHERE asa.CaseMasterID = ?
      `).all(c.CaseMasterID);

      // Count arrests for network risk scoring
      const arRes = dbConn.db.prepare(`SELECT COUNT(*) as count FROM ArrestSurrender WHERE CaseMasterID = ?`).get(c.CaseMasterID);
      c.arrestCount = arRes ? arRes.count : 0;
    }

    return cases;
  } else {
    // Zoho Catalyst Mode - bypasses 4-join limit by loading lookup tables and joining in-memory
    const casesRows = await queryZcql(dbConn.zcql, "SELECT * FROM CaseMaster", "CaseMaster");

    // Fetch all lookup tables needed for details mapping
    const units = await queryZcql(dbConn.zcql, "SELECT UnitID, UnitName FROM Unit", "Unit");
    const categories = await queryZcql(dbConn.zcql, "SELECT CaseCategoryID, LookupValue FROM CaseCategory", "CaseCategory");
    const gravities = await queryZcql(dbConn.zcql, "SELECT GravityOffenceID, LookupValue FROM GravityOffence", "GravityOffence");
    const crimeHeads = await queryZcql(dbConn.zcql, "SELECT CrimeHeadID, CrimeGroupName FROM CrimeHead", "CrimeHead");
    const crimeSubHeads = await queryZcql(dbConn.zcql, "SELECT CrimeSubHeadID, CrimeHeadName FROM CrimeSubHead", "CrimeSubHead");
    const statuses = await queryZcql(dbConn.zcql, "SELECT CaseStatusID, CaseStatusName FROM CaseStatusMaster", "CaseStatusMaster");
    const courts = await queryZcql(dbConn.zcql, "SELECT CourtID, CourtName FROM Court", "Court");
    const employees = await queryZcql(dbConn.zcql, "SELECT EmployeeID, FirstName FROM Employee", "Employee");

    const complainants = await queryZcql(dbConn.zcql, "SELECT * FROM ComplainantDetails", "ComplainantDetails");
    const victims = await queryZcql(dbConn.zcql, "SELECT * FROM Victim", "Victim");
    const accusedList = await queryZcql(dbConn.zcql, "SELECT * FROM Accused", "Accused");
    const actsSectionsList = await queryZcql(dbConn.zcql, "SELECT * FROM ActSectionAssociation", "ActSectionAssociation");

    const occupations = await queryZcql(dbConn.zcql, "SELECT OccupationID, OccupationName FROM OccupationMaster", "OccupationMaster");
    const religions = await queryZcql(dbConn.zcql, "SELECT ReligionID, ReligionName FROM ReligionMaster", "ReligionMaster");
    const castes = await queryZcql(dbConn.zcql, "SELECT caste_master_id, caste_master_name FROM CasteMaster", "CasteMaster");

    // Build Maps for O(1) matching
    const unitMap = new Map(units.map(u => [u.UnitID, u.UnitName]));
    const catMap = new Map(categories.map(c => [c.CaseCategoryID, c.LookupValue]));
    const gravityMap = new Map(gravities.map(g => [g.GravityOffenceID, g.LookupValue]));
    const headMap = new Map(crimeHeads.map(h => [h.CrimeHeadID, h.CrimeGroupName]));
    const subHeadMap = new Map(crimeSubHeads.map(s => [s.CrimeSubHeadID, s.CrimeHeadName]));
    const statusMap = new Map(statuses.map(s => [s.CaseStatusID, s.CaseStatusName]));
    const courtMap = new Map(courts.map(c => [c.CourtID, c.CourtName]));
    const empMap = new Map(employees.map(e => [e.EmployeeID, e.FirstName]));
    const occMap = new Map(occupations.map(o => [o.OccupationID, o.OccupationName]));
    const relMap = new Map(religions.map(r => [r.ReligionID, r.ReligionName]));
    const casteMap = new Map(castes.map(c => [c.caste_master_id, c.caste_master_name]));

    // Map cases
    const joined = casesRows.map(c => {
      const caseId = c.CaseMasterID;

      // Complainant mapping
      const comp = complainants.find(co => co.CaseMasterID === caseId);
      const complainant = comp ? {
        name: comp.ComplainantName,
        age: comp.AgeYear,
        gender: comp.GenderID === 2 ? 'Female' : comp.GenderID === 3 ? 'Transgender' : 'Male',
        occupation: occMap.get(comp.OccupationID) || 'Other',
        religion: relMap.get(comp.ReligionID) || 'Other',
        caste: casteMap.get(comp.CasteID) || 'General'
      } : null;

      // Victim mapping
      const vic = victims.find(v => v.CaseMasterID === caseId);
      const victim = vic ? {
        name: vic.VictimName,
        age: vic.AgeYear,
        gender: vic.GenderID === 2 ? 'Female' : vic.GenderID === 3 ? 'Transgender' : 'Male',
        isPolice: vic.VictimPolice === '1' ? 'Yes' : 'No'
      } : null;

      // Accused mapping — return as array to support multi-accused
      const accRows = accusedList.filter(a => a.CaseMasterID === caseId);
      const accused = accRows.map(acc => ({
        name: acc.AccusedName,
        age: acc.AgeYear,
        gender: acc.GenderID === 2 ? 'Female' : acc.GenderID === 3 ? 'Transgender' : 'Male',
        personId: acc.PersonID || 'A1'
      }));

      // Arrest count for risk scoring
      const arrestCount = actsSectionsList.filter ? undefined : undefined; // separate fetch below

      // Acts & Sections mapping
      const actsSections = actsSectionsList
        .filter(as => as.CaseMasterID === caseId)
        .map(as => ({
          actCode: as.ActID,
          sectionCode: as.SectionID
        }));

      return {
        CaseMasterID: caseId,
        CrimeNo: c.CrimeNo,
        CaseNo: c.CaseNo,
        CrimeRegisteredDate: c.CrimeRegisteredDate,
        PoliceStation: unitMap.get(c.PoliceStationID) || 'Unknown',
        PoliceStationID: c.PoliceStationID,
        Category: catMap.get(c.CaseCategoryID) || 'FIR',
        CaseCategoryID: c.CaseCategoryID,
        Gravity: gravityMap.get(c.GravityOffenceID) || 'Non-Heinous',
        GravityOffenceID: c.GravityOffenceID,
        MajorHead: headMap.get(c.CrimeMajorHeadID) || 'Unknown',
        CrimeMajorHeadID: c.CrimeMajorHeadID,
        MinorHead: subHeadMap.get(c.CrimeMinorHeadID) || 'Unknown',
        CrimeMinorHeadID: c.CrimeMinorHeadID,
        Status: statusMap.get(c.CaseStatusID) || 'Under Investigation',
        CaseStatusID: c.CaseStatusID,
        Court: courtMap.get(c.CourtID) || 'Unknown',
        CourtID: c.CourtID,
        OfficerName: empMap.get(c.PolicePersonID) || 'Unknown',
        PolicePersonID: c.PolicePersonID,
        BriefFacts: c.BriefFacts,
        IncidentFromDate: c.IncidentFromDate,
        IncidentToDate: c.IncidentToDate,
        InfoReceivedPSDate: c.InfoReceivedPSDate,
        latitude: c.latitude ? parseFloat(c.latitude) : null,
        longitude: c.longitude ? parseFloat(c.longitude) : null,
        complainant,
        victim,
        accused,         // now an array
        arrestCount: 0,  // enriched by second pass below if needed
        actsSections
      };
    });

    // Sort by date desc
    return joined.sort((a, b) => new Date(b.CrimeRegisteredDate) - new Date(a.CrimeRegisteredDate) || b.CaseMasterID - a.CaseMasterID);
  }
}

/**
 * Fetch detailed view of a specific case/FIR by ID.
 */
async function getCaseById(req, caseId) {
  const dbConn = getDb(req);

  if (dbConn.type === 'sqlite') {
    const caseDetails = dbConn.db.prepare(`
      SELECT c.*, 
             u.UnitName as PoliceStation,
             cc.LookupValue as Category,
             go.LookupValue as Gravity,
             ch.CrimeGroupName as MajorHead,
             csh.CrimeHeadName as MinorHead,
             cs.CaseStatusName as Status,
             crt.CourtName as Court,
             e.FirstName as OfficerName
      FROM CaseMaster c
      LEFT JOIN Unit u ON c.PoliceStationID = u.UnitID
      LEFT JOIN CaseCategory cc ON c.CaseCategoryID = cc.CaseCategoryID
      LEFT JOIN GravityOffence go ON c.GravityOffenceID = go.GravityOffenceID
      LEFT JOIN CrimeHead ch ON c.CrimeMajorHeadID = ch.CrimeHeadID
      LEFT JOIN CrimeSubHead csh ON c.CrimeMinorHeadID = csh.CrimeSubHeadID
      LEFT JOIN CaseStatusMaster cs ON c.CaseStatusID = cs.CaseStatusID
      LEFT JOIN Court crt ON c.CourtID = crt.CourtID
      LEFT JOIN Employee e ON c.PolicePersonID = e.EmployeeID
      WHERE c.CaseMasterID = ?;
    `).get(caseId);

    if (!caseDetails) return null;

    const complainant = dbConn.db.prepare(`
      SELECT cd.*, 
             om.OccupationName,
             rm.ReligionName,
             cm.caste_master_name as CasteName
      FROM ComplainantDetails cd
      LEFT JOIN OccupationMaster om ON cd.OccupationID = om.OccupationID
      LEFT JOIN ReligionMaster rm ON cd.ReligionID = rm.ReligionID
      LEFT JOIN CasteMaster cm ON cd.CasteID = cm.caste_master_id
      WHERE cd.CaseMasterID = ?;
    `).get(caseId) || null;

    const victims = dbConn.db.prepare("SELECT * FROM Victim WHERE CaseMasterID = ?;").all(caseId);
    const accused = dbConn.db.prepare("SELECT * FROM Accused WHERE CaseMasterID = ?;").all(caseId);

    const actsAndSections = dbConn.db.prepare(`
      SELECT asa.*, a.ShortName, s.SectionDescription
      FROM ActSectionAssociation asa
      LEFT JOIN Act a ON asa.ActID = a.ActCode
      LEFT JOIN Section s ON asa.ActID = s.ActCode AND asa.SectionID = s.SectionCode
      WHERE asa.CaseMasterID = ?;
    `).all(caseId);

    const arrests = dbConn.db.prepare(`
      SELECT ar.*, 
             s.StateName,
             d.DistrictName,
             u.UnitName as PoliceStation,
             e.FirstName as OfficerName,
             crt.CourtName,
             acc.AccusedName
      FROM ArrestSurrender ar
      LEFT JOIN State s ON ar.ArrestSurrenderStateId = s.StateID
      LEFT JOIN District d ON ar.ArrestSurrenderDistrictId = d.DistrictID
      LEFT JOIN Unit u ON ar.PoliceStationID = u.UnitID
      LEFT JOIN Employee e ON ar.IOID = e.EmployeeID
      LEFT JOIN Court crt ON ar.CourtID = crt.CourtID
      LEFT JOIN Accused acc ON ar.AccusedMasterID = acc.AccusedMasterID
      WHERE ar.CaseMasterID = ?;
    `).all(caseId);

    const occurrence = dbConn.db.prepare("SELECT * FROM Inv_OccuranceTime WHERE CaseMasterID = ?;").get(caseId) || null;
    const chargesheet = dbConn.db.prepare(`
      SELECT cs.*, e.FirstName as OfficerName
      FROM ChargesheetDetails cs
      LEFT JOIN Employee e ON cs.PolicePersonID = e.EmployeeID
      WHERE cs.CaseMasterID = ?;
    `).get(caseId) || null;

    return {
      caseDetails,
      complainant,
      victims,
      accused,
      actsAndSections,
      arrests,
      occurrence,
      chargesheet
    };
  } else {
    // Zoho Catalyst ZCQL V2 (Single records fetched individually)
    const masterRows = await queryZcql(dbConn.zcql, `SELECT * FROM CaseMaster WHERE CaseMasterID = ${caseId}`, 'CaseMaster');
    if (masterRows.length === 0) return null;
    const caseDetails = masterRows[0];

    const compRows = await queryZcql(dbConn.zcql, `SELECT * FROM ComplainantDetails WHERE CaseMasterID = ${caseId}`, 'ComplainantDetails');
    const complainant = compRows.length > 0 ? compRows[0] : null;

    const victims = await queryZcql(dbConn.zcql, `SELECT * FROM Victim WHERE CaseMasterID = ${caseId}`, 'Victim');
    const accused = await queryZcql(dbConn.zcql, `SELECT * FROM Accused WHERE CaseMasterID = ${caseId}`, 'Accused');
    const actsAndSections = await queryZcql(dbConn.zcql, `SELECT * FROM ActSectionAssociation WHERE CaseMasterID = ${caseId}`, 'ActSectionAssociation');
    const arrests = await queryZcql(dbConn.zcql, `SELECT * FROM ArrestSurrender WHERE CaseMasterID = ${caseId}`, 'ArrestSurrender');

    const occRows = await queryZcql(dbConn.zcql, `SELECT * FROM Inv_OccuranceTime WHERE CaseMasterID = ${caseId}`, 'Inv_OccuranceTime');
    const occurrence = occRows.length > 0 ? occRows[0] : null;

    const csRows = await queryZcql(dbConn.zcql, `SELECT * FROM ChargesheetDetails WHERE CaseMasterID = ${caseId}`, 'ChargesheetDetails');
    const chargesheet = csRows.length > 0 ? csRows[0] : null;

    return {
      caseDetails,
      complainant,
      victims,
      accused,
      actsAndSections,
      arrests,
      occurrence,
      chargesheet
    };
  }
}

/**
 * Fetch lookup lists for dropdown population.
 */
async function getLookups(req) {
  const dbConn = getDb(req);

  if (dbConn.type === 'sqlite') {
    const units = dbConn.db.prepare("SELECT UnitID, UnitName, DistrictID, TypeID, ParentUnit FROM Unit WHERE Active = 1 ORDER BY UnitName;").all();
    const employees = dbConn.db.prepare("SELECT e.EmployeeID, e.FirstName, e.KGID, r.RankName, r.Hierarchy as RankHierarchy, d.DesignationName, u.UnitName FROM Employee e LEFT JOIN Rank r ON e.RankID = r.RankID LEFT JOIN Designation d ON e.DesignationID = d.DesignationID LEFT JOIN Unit u ON e.UnitID = u.UnitID ORDER BY r.Hierarchy ASC, e.FirstName;").all();
    const categories = dbConn.db.prepare("SELECT CaseCategoryID, LookupValue FROM CaseCategory;").all();
    const gravities = dbConn.db.prepare("SELECT GravityOffenceID, LookupValue FROM GravityOffence;").all();
    const crimeHeads = dbConn.db.prepare("SELECT CrimeHeadID, CrimeGroupName FROM CrimeHead WHERE Active = 1;").all();
    const crimeSubHeads = dbConn.db.prepare("SELECT CrimeSubHeadID, CrimeHeadName, CrimeHeadID FROM CrimeSubHead;").all();
    const statuses = dbConn.db.prepare("SELECT CaseStatusID, CaseStatusName FROM CaseStatusMaster;").all();
    const courts = dbConn.db.prepare("SELECT CourtID, CourtName, DistrictID, StateID FROM Court WHERE Active = 1;").all();
    const occupations = dbConn.db.prepare("SELECT OccupationID, OccupationName FROM OccupationMaster;").all();
    const religions = dbConn.db.prepare("SELECT ReligionID, ReligionName FROM ReligionMaster;").all();
    const castes = dbConn.db.prepare("SELECT caste_master_id, caste_master_name FROM CasteMaster;").all();
    const acts = dbConn.db.prepare("SELECT ActCode, ShortName FROM Act WHERE Active = 1;").all();
    const sections = dbConn.db.prepare("SELECT ActCode, SectionCode, SectionDescription FROM Section WHERE Active = 1;").all();
    let ranks = [], designations = [], unitTypes = [], states = [], crimeHeadActSections = [];
    try { ranks = dbConn.db.prepare("SELECT RankID, RankName, Hierarchy FROM Rank ORDER BY Hierarchy;").all(); } catch(e) {}
    try { designations = dbConn.db.prepare("SELECT DesignationID, DesignationName, SortOrder FROM Designation ORDER BY SortOrder;").all(); } catch(e) {}
    try { unitTypes = dbConn.db.prepare("SELECT UnitTypeID, UnitTypeName, CityDistState, Hierarchy FROM UnitType;").all(); } catch(e) {}
    try { states = dbConn.db.prepare("SELECT StateID, StateName FROM State WHERE Active = 1;").all(); } catch(e) {}
    try { crimeHeadActSections = dbConn.db.prepare("SELECT CrimeHeadID, ActCode, SectionCode FROM CrimeHeadActSection;").all(); } catch(e) {}

    return {
      units, employees, categories, gravities, crimeHeads, crimeSubHeads,
      statuses, courts, occupations, religions, castes, acts, sections,
      ranks, designations, unitTypes, states, crimeHeadActSections
    };
  } else {
    // Zoho Catalyst Mode - load lists via parallel ZCQL queries
    const [
      units, employees, categories, gravities, crimeHeads, crimeSubHeads,
      statuses, courts, occupations, religions, castes, acts, sections,
      ranks, designations, unitTypes, states, crimeHeadActSections
    ] = await Promise.all([
      queryZcql(dbConn.zcql, "SELECT UnitID, UnitName, DistrictID, TypeID, ParentUnit FROM Unit WHERE Active = 1", 'Unit'),
      queryZcql(dbConn.zcql, "SELECT EmployeeID, FirstName, KGID, RankID, DesignationID, UnitID FROM Employee", 'Employee'),
      queryZcql(dbConn.zcql, "SELECT CaseCategoryID, LookupValue FROM CaseCategory", 'CaseCategory'),
      queryZcql(dbConn.zcql, "SELECT GravityOffenceID, LookupValue FROM GravityOffence", 'GravityOffence'),
      queryZcql(dbConn.zcql, "SELECT CrimeHeadID, CrimeGroupName FROM CrimeHead WHERE Active = 1", 'CrimeHead'),
      queryZcql(dbConn.zcql, "SELECT CrimeSubHeadID, CrimeHeadName, CrimeHeadID FROM CrimeSubHead", 'CrimeSubHead'),
      queryZcql(dbConn.zcql, "SELECT CaseStatusID, CaseStatusName FROM CaseStatusMaster", 'CaseStatusMaster'),
      queryZcql(dbConn.zcql, "SELECT CourtID, CourtName, DistrictID, StateID FROM Court WHERE Active = 1", 'Court'),
      queryZcql(dbConn.zcql, "SELECT OccupationID, OccupationName FROM OccupationMaster", 'OccupationMaster'),
      queryZcql(dbConn.zcql, "SELECT ReligionID, ReligionName FROM ReligionMaster", 'ReligionMaster'),
      queryZcql(dbConn.zcql, "SELECT caste_master_id, caste_master_name FROM CasteMaster", 'CasteMaster'),
      queryZcql(dbConn.zcql, "SELECT ActCode, ShortName FROM Act WHERE Active = 1", 'Act'),
      queryZcql(dbConn.zcql, "SELECT ActCode, SectionCode, SectionDescription FROM Section WHERE Active = 1", 'Section'),
      queryZcql(dbConn.zcql, "SELECT RankID, RankName, Hierarchy FROM Rank", 'Rank').catch(() => []),
      queryZcql(dbConn.zcql, "SELECT DesignationID, DesignationName, SortOrder FROM Designation", 'Designation').catch(() => []),
      queryZcql(dbConn.zcql, "SELECT UnitTypeID, UnitTypeName, CityDistState, Hierarchy FROM UnitType", 'UnitType').catch(() => []),
      queryZcql(dbConn.zcql, "SELECT StateID, StateName FROM State WHERE Active = 1", 'State').catch(() => []),
      queryZcql(dbConn.zcql, "SELECT CrimeHeadID, ActCode, SectionCode FROM CrimeHeadActSection", 'CrimeHeadActSection').catch(() => [])
    ]);

    // Enrich employees with rank/designation/unit names for Catalyst mode
    const rankMap = new Map(ranks.map(r => [r.RankID, r]));
    const desigMap = new Map(designations.map(d => [d.DesignationID, d.DesignationName]));
    const unitNameMap = new Map(units.map(u => [u.UnitID, u.UnitName]));
    const enrichedEmployees = employees.map(e => ({
      ...e,
      RankName: rankMap.get(e.RankID)?.RankName || 'Officer',
      RankHierarchy: rankMap.get(e.RankID)?.Hierarchy || 99,
      DesignationName: desigMap.get(e.DesignationID) || 'Investigating Officer',
      UnitName: unitNameMap.get(e.UnitID) || 'Unknown Station'
    })).sort((a, b) => a.RankHierarchy - b.RankHierarchy || (a.FirstName||'').localeCompare(b.FirstName||''));

    return {
      units,
      employees: enrichedEmployees,
      categories: categories.length ? categories : [{ CaseCategoryID: 1, LookupValue: 'FIR' }, { CaseCategoryID: 2, LookupValue: 'UDR' }, { CaseCategoryID: 3, LookupValue: 'Zero FIR' }, { CaseCategoryID: 4, LookupValue: 'PAR' }],
      gravities: gravities.length ? gravities : [{ GravityOffenceID: 1, LookupValue: 'Heinous' }, { GravityOffenceID: 2, LookupValue: 'Non-Heinous' }],
      crimeHeads: crimeHeads.length ? crimeHeads : [
        { CrimeHeadID: 1, CrimeGroupName: 'Crimes Against Person / Body' },
        { CrimeHeadID: 2, CrimeGroupName: 'Crimes Against Property' },
        { CrimeHeadID: 3, CrimeGroupName: 'Crimes Against Women & Children' },
        { CrimeHeadID: 4, CrimeGroupName: 'Cyber Crime & Online Fraud' },
        { CrimeHeadID: 5, CrimeGroupName: 'Economic Offences & Financial Fraud' },
        { CrimeHeadID: 6, CrimeGroupName: 'Narcotics & NDPS Offences' },
        { CrimeHeadID: 7, CrimeGroupName: 'Public Order & Riot Offences' },
        { CrimeHeadID: 8, CrimeGroupName: 'Other IPC / Special & Local Laws (SLL)' }
      ],
      crimeSubHeads: crimeSubHeads.length ? crimeSubHeads : [
        { CrimeSubHeadID: 101, CrimeHeadID: 1, CrimeHeadName: 'Murder / Attempt to Murder' },
        { CrimeSubHeadID: 102, CrimeHeadID: 1, CrimeHeadName: 'Grievous Hurt / Assault' },
        { CrimeSubHeadID: 103, CrimeHeadID: 1, CrimeHeadName: 'Kidnapping & Abduction' },
        { CrimeSubHeadID: 201, CrimeHeadID: 2, CrimeHeadName: 'Robbery & Dacoity' },
        { CrimeSubHeadID: 202, CrimeHeadID: 2, CrimeHeadName: 'House Breaking / Burglary' },
        { CrimeSubHeadID: 203, CrimeHeadID: 2, CrimeHeadName: 'Theft / Vehicle Theft' },
        { CrimeSubHeadID: 301, CrimeHeadID: 3, CrimeHeadName: 'POCSO & Offences Against Children' },
        { CrimeSubHeadID: 302, CrimeHeadID: 3, CrimeHeadName: 'Dowry Harassment / Cruelty' },
        { CrimeSubHeadID: 303, CrimeHeadID: 3, CrimeHeadName: 'Sexual Harassment & Assault' },
        { CrimeSubHeadID: 401, CrimeHeadID: 4, CrimeHeadName: 'Financial Fraud & Phishing' },
        { CrimeSubHeadID: 402, CrimeHeadID: 4, CrimeHeadName: 'Identity Theft / Social Media Crime' },
        { CrimeSubHeadID: 501, CrimeHeadID: 5, CrimeHeadName: 'Cheating / Criminal Breach of Trust' },
        { CrimeSubHeadID: 502, CrimeHeadID: 5, CrimeHeadName: 'Counterfeiting & Forgery' },
        { CrimeSubHeadID: 601, CrimeHeadID: 6, CrimeHeadName: 'NDPS Drug Possession / Trafficking' },
        { CrimeSubHeadID: 701, CrimeHeadID: 7, CrimeHeadName: 'Rioting & Unlawful Assembly' },
        { CrimeSubHeadID: 801, CrimeHeadID: 8, CrimeHeadName: 'Rash Driving & Traffic Accidents' },
        { CrimeSubHeadID: 802, CrimeHeadID: 8, CrimeHeadName: 'Other IPC Violations' }
      ],
      statuses,
      courts,
      occupations,
      religions,
      castes,
      acts: acts.length ? acts : [
        { ActCode: 'IPC', ShortName: 'Indian Penal Code (IPC)' },
        { ActCode: 'BNS', ShortName: 'Bharatiya Nyaya Sanhita (BNS)' },
        { ActCode: 'NDPS', ShortName: 'Narcotic Drugs & Psychotropic Substances Act (NDPS)' },
        { ActCode: 'IT_ACT', ShortName: 'Information Technology Act (IT Act)' },
        { ActCode: 'POCSO', ShortName: 'Protection of Children from Sexual Offences (POCSO)' }
      ],
      sections: sections.length ? sections : [
        { ActCode: 'IPC', SectionCode: '302', SectionDescription: 'Punishment for Murder' },
        { ActCode: 'IPC', SectionCode: '307', SectionDescription: 'Attempt to Murder' },
        { ActCode: 'IPC', SectionCode: '379', SectionDescription: 'Punishment for Theft' },
        { ActCode: 'IPC', SectionCode: '392', SectionDescription: 'Punishment for Robbery' },
        { ActCode: 'IPC', SectionCode: '420', SectionDescription: 'Cheating and dishonestly inducing delivery of property' },
        { ActCode: 'BNS', SectionCode: '103', SectionDescription: 'Murder' },
        { ActCode: 'BNS', SectionCode: '109', SectionDescription: 'Attempt to Murder' },
        { ActCode: 'BNS', SectionCode: '303', SectionDescription: 'Theft' },
        { ActCode: 'NDPS', SectionCode: '20', SectionDescription: 'Punishment for contravention in relation to cannabis plant' },
        { ActCode: 'IT_ACT', SectionCode: '66D', SectionDescription: 'Punishment for cheating by personation by using computer resource' },
        { ActCode: 'POCSO', SectionCode: '6', SectionDescription: 'Punishment for aggravated penetrative sexual assault' }
      ],
      ranks,
      designations,
      unitTypes,
      states,
      crimeHeadActSections
    };
  }
}

/**
 * Register a new case/FIR.
 */
async function createCase(req, data) {
  const dbConn = getDb(req);

  const caseMasterId = await getNextId(dbConn, 'CaseMaster', 'CaseMasterID');
  const registeredDate = data.CrimeRegisteredDate || new Date().toISOString().split('T')[0];

  // Calculate CrimeNo and CaseNo structured values
  const categoryCode = data.CaseCategoryID || 1;
  const districtIdStr = String(data.DistrictID || 10).padStart(4, '0');
  const stationIdStr = String(data.PoliceStationID || 4300).padStart(4, '0');
  const yearStr = String(new Date(registeredDate).getFullYear()).padStart(4, '0');

  let serialNo = 1;
  if (dbConn.type === 'sqlite') {
    const runningSerialResult = dbConn.db.prepare(`
        SELECT COUNT(*) as count FROM CaseMaster 
        WHERE PoliceStationID = ? AND CaseCategoryID = ? AND strftime('%Y', CrimeRegisteredDate) = ?;
    `).get(data.PoliceStationID || 4300, categoryCode, yearStr);
    serialNo = (runningSerialResult ? runningSerialResult.count : 0) + 1;
  } else {
    // Catalyst count query
    const res = await dbConn.zcql.executeZCQLQuery(`
      SELECT COUNT(ROWID) as count FROM CaseMaster 
      WHERE PoliceStationID = ${data.PoliceStationID || 4300} AND CaseCategoryID = ${categoryCode}
    `);
    serialNo = (res && res[0] && res[0].CaseMaster && res[0].CaseMaster.count ? parseInt(res[0].CaseMaster.count) : 0) + 1;
  }

  const serialStr = String(serialNo).padStart(5, '0');
  const crimeNo = `${categoryCode}${districtIdStr}${stationIdStr}${yearStr}${serialStr}`;
  const caseNo = `${yearStr}${serialStr}`;

  if (dbConn.type === 'sqlite') {
    // 1. Create CaseMaster
    const insertCaseQuery = dbConn.db.prepare(`
        INSERT INTO CaseMaster (
            CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID,
            CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID,
            IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    insertCaseQuery.run(
      caseMasterId,
      crimeNo,
      caseNo,
      registeredDate,
      data.PolicePersonID,
      data.PoliceStationID,
      data.CaseCategoryID,
      data.GravityOffenceID,
      data.CrimeMajorHeadID,
      data.CrimeMinorHeadID,
      1, // Initial status: "Under Investigation"
      data.CourtID,
      data.IncidentFromDate || null,
      data.IncidentToDate || null,
      data.InfoReceivedPSDate || null,
      data.latitude || null,
      data.longitude || null,
      data.BriefFacts || ''
    );

    // 2. Occurrence extension
    const insertOccQuery = dbConn.db.prepare(`
        INSERT INTO Inv_OccuranceTime (
            CaseMasterID, IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude
        ) VALUES (?, ?, ?, ?, ?, ?);
    `);
    insertOccQuery.run(
      caseMasterId,
      data.IncidentFromDate || null,
      data.IncidentToDate || null,
      data.InfoReceivedPSDate || null,
      data.latitude || null,
      data.longitude || null
    );

    // 3. Complainant details
    if (data.ComplainantName) {
      const complainantId = dbConn.db.prepare("SELECT MAX(ComplainantID) as maxId FROM ComplainantDetails").get().maxId + 1 || 501;
      const insertComplainant = dbConn.db.prepare(`
            INSERT INTO ComplainantDetails (
                ComplainantID, CaseMasterID, ComplainantName, AgeYear, OccupationID, ReligionID, CasteID, GenderID
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `);
      insertComplainant.run(
        complainantId,
        caseMasterId,
        data.ComplainantName,
        data.ComplainantAge || null,
        data.ComplainantOccupationID,
        data.ComplainantReligionID,
        data.ComplainantCasteID,
        data.ComplainantGenderID || 1
      );
    }

    // 4. Victim details (single or array)
    if (data.VictimName) {
      const victimId = (dbConn.db.prepare("SELECT MAX(VictimMasterID) as maxId FROM Victim").get().maxId || 600) + 1;
      dbConn.db.prepare(`INSERT INTO Victim (VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID, VictimPolice) VALUES (?, ?, ?, ?, ?, ?);`)
        .run(victimId, caseMasterId, data.VictimName, data.VictimAge || null, data.VictimGenderID || 1, data.VictimPolice || '0');
    }
    if (Array.isArray(data.victimList) && data.victimList.length > 0) {
      for (const vic of data.victimList) {
        if (!vic.name) continue;
        const vicId = (dbConn.db.prepare("SELECT MAX(VictimMasterID) as maxId FROM Victim").get().maxId || 600) + 1;
        dbConn.db.prepare(`INSERT INTO Victim (VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID, VictimPolice) VALUES (?, ?, ?, ?, ?, ?);`)
          .run(vicId, caseMasterId, vic.name, vic.age || null, vic.genderId || 1, vic.isPolice ? '1' : '0');
      }
    }

    // 5. Accused details (single or array)
    if (data.AccusedName) {
      const accusedId = (dbConn.db.prepare("SELECT MAX(AccusedMasterID) as maxId FROM Accused").get().maxId || 700) + 1;
      dbConn.db.prepare(`INSERT INTO Accused (AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID, PersonID) VALUES (?, ?, ?, ?, ?, ?);`)
        .run(accusedId, caseMasterId, data.AccusedName, data.AccusedAge || null, data.AccusedGenderID || 1, 'A1');
    }
    const insertedAccusedIds = [];
    if (Array.isArray(data.accusedList) && data.accusedList.length > 0) {
      for (let i = 0; i < data.accusedList.length; i++) {
        const acc = data.accusedList[i];
        if (!acc.name) continue;
        const accId = (dbConn.db.prepare("SELECT MAX(AccusedMasterID) as maxId FROM Accused").get().maxId || 700) + 1;
        dbConn.db.prepare(`INSERT INTO Accused (AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID, PersonID) VALUES (?, ?, ?, ?, ?, ?);`)
          .run(accId, caseMasterId, acc.name, acc.age || null, acc.genderId || 1, `A${i + 1}`);
        insertedAccusedIds.push(accId);
      }
    }

    // 6. Act Section association (single or array)
    if (data.ActCode && data.SectionCode) {
      dbConn.db.prepare(`INSERT INTO ActSectionAssociation (CaseMasterID, ActID, SectionID, ActOrderID, SectionOrderID) VALUES (?, ?, ?, ?, ?);`)
        .run(caseMasterId, data.ActCode, data.SectionCode, 1, 1);
    }
    if (Array.isArray(data.actsSections) && data.actsSections.length > 0) {
      for (let i = 0; i < data.actsSections.length; i++) {
        const as = data.actsSections[i];
        if (!as.actCode || !as.sectionCode) continue;
        dbConn.db.prepare(`INSERT INTO ActSectionAssociation (CaseMasterID, ActID, SectionID, ActOrderID, SectionOrderID) VALUES (?, ?, ?, ?, ?);`)
          .run(caseMasterId, as.actCode, as.sectionCode, i + 1, i + 1);
      }
    }

    // 7. ArrestSurrender (optional — if arrest data provided at FIR time)
    if (data.ArrestSurrenderDate && insertedAccusedIds.length > 0) {
      for (const accId of insertedAccusedIds) {
        const arId = (dbConn.db.prepare("SELECT MAX(ArrestSurrenderID) as maxId FROM ArrestSurrender").get().maxId || 800) + 1;
        dbConn.db.prepare(`INSERT INTO ArrestSurrender (ArrestSurrenderID, CaseMasterID, ArrestSurrenderDate, ArrestSurrenderTypeID, ArrestSurrenderStateId, ArrestSurrenderDistrictId, PoliceStationID, IOID, CourtID, AccusedMasterID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`)
          .run(arId, caseMasterId, data.ArrestSurrenderDate, data.ArrestSurrenderTypeID || 1, data.ArrestSurrenderStateId || null, data.ArrestSurrenderDistrictId || null, data.PoliceStationID || null, data.PolicePersonID || null, data.CourtID || null, accId);
        // Also insert junction row
        try {
          dbConn.db.prepare(`INSERT INTO inv_arrestsurrenderaccused (ArrestSurrenderID, AccusedMasterID) VALUES (?, ?);`).run(arId, accId);
        } catch(e) { /* junction table may not have auto-insert */ }
      }
    }
  } else {
    // Zoho Catalyst Mode - insert via SDK Row insertion (respects Catalyst schema)

    // 1. Insert CaseMaster
    await dbConn.datastore.table('CaseMaster').insertRow({
      CaseMasterID: caseMasterId,
      CrimeNo: crimeNo,
      CaseNo: caseNo,
      CrimeRegisteredDate: registeredDate,
      PolicePersonID: data.PolicePersonID,
      PoliceStationID: data.PoliceStationID,
      CaseCategoryID: data.CaseCategoryID,
      GravityOffenceID: data.GravityOffenceID,
      CrimeMajorHeadID: data.CrimeMajorHeadID,
      CrimeMinorHeadID: data.CrimeMinorHeadID,
      CaseStatusID: 1, // Under Investigation
      CourtID: data.CourtID,
      IncidentFromDate: data.IncidentFromDate || null,
      IncidentToDate: data.IncidentToDate || null,
      InfoReceivedPSDate: data.InfoReceivedPSDate || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      BriefFacts: data.BriefFacts || ''
    });

    // 2. Insert OccurrenceTime (1-to-1 extension)
    await dbConn.datastore.table('Inv_OccuranceTime').insertRow({
      CaseMasterID: caseMasterId,
      IncidentFromDate: data.IncidentFromDate || null,
      IncidentToDate: data.IncidentToDate || null,
      InfoReceivedPSDate: data.InfoReceivedPSDate || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null
    });

    // 3. Insert ComplainantDetails
    if (data.ComplainantName) {
      const complainantId = await getNextId(dbConn, 'ComplainantDetails', 'ComplainantID');
      await dbConn.datastore.table('ComplainantDetails').insertRow({
        ComplainantID: complainantId,
        CaseMasterID: caseMasterId,
        ComplainantName: data.ComplainantName,
        AgeYear: data.ComplainantAge || null,
        OccupationID: data.ComplainantOccupationID,
        ReligionID: data.ComplainantReligionID,
        CasteID: data.ComplainantCasteID,
        GenderID: data.ComplainantGenderID || 1
      });
    }

    // 4. Insert Victim
    if (data.VictimName) {
      const victimId = await getNextId(dbConn, 'Victim', 'VictimMasterID');
      await dbConn.datastore.table('Victim').insertRow({
        VictimMasterID: victimId,
        CaseMasterID: caseMasterId,
        VictimName: data.VictimName,
        AgeYear: data.VictimAge || null,
        GenderID: data.VictimGenderID || 1,
        VictimPolice: data.VictimPolice || '0'
      });
    }

    // 5. Insert Accused
    if (data.AccusedName) {
      const accusedId = await getNextId(dbConn, 'Accused', 'AccusedMasterID');
      await dbConn.datastore.table('Accused').insertRow({
        AccusedMasterID: accusedId,
        CaseMasterID: caseMasterId,
        AccusedName: data.AccusedName,
        AgeYear: data.AccusedAge || null,
        GenderID: data.AccusedGenderID || 1,
        PersonID: 'A1'
      });
    }
    // Multi-accused array support
    if (Array.isArray(data.accusedList) && data.accusedList.length > 0) {
      for (let i = 0; i < data.accusedList.length; i++) {
        const acc = data.accusedList[i];
        const accId = await getNextId(dbConn, 'Accused', 'AccusedMasterID');
        await dbConn.datastore.table('Accused').insertRow({
          AccusedMasterID: accId,
          CaseMasterID: caseMasterId,
          AccusedName: acc.name,
          AgeYear: acc.age || null,
          GenderID: acc.genderId || 1,
          PersonID: `A${i + 1}`
        });
      }
    }

    // Multi-victim array support
    if (Array.isArray(data.victimList) && data.victimList.length > 0) {
      for (const vic of data.victimList) {
        const vicId = await getNextId(dbConn, 'Victim', 'VictimMasterID');
        await dbConn.datastore.table('Victim').insertRow({
          VictimMasterID: vicId,
          CaseMasterID: caseMasterId,
          VictimName: vic.name,
          AgeYear: vic.age || null,
          GenderID: vic.genderId || 1,
          VictimPolice: vic.isPolice ? '1' : '0'
        });
      }
    }

    // 6. Insert ActSectionAssociation (single or array)
    if (data.ActCode && data.SectionCode) {
      await dbConn.datastore.table('ActSectionAssociation').insertRow({
        CaseMasterID: caseMasterId,
        ActID: data.ActCode,
        SectionID: data.SectionCode,
        ActOrderID: 1,
        SectionOrderID: 1
      });
    }
    if (Array.isArray(data.actsSections) && data.actsSections.length > 0) {
      for (let i = 0; i < data.actsSections.length; i++) {
        const as = data.actsSections[i];
        await dbConn.datastore.table('ActSectionAssociation').insertRow({
          CaseMasterID: caseMasterId,
          ActID: as.actCode,
          SectionID: as.sectionCode,
          ActOrderID: i + 1,
          SectionOrderID: i + 1
        });
      }
    }
  }

  return {
    caseId: caseMasterId,
    crimeNo,
    caseNo
  };
}

/**
 * Get pre-aggregated analytics summary for the SCRB Intelligence Board.
 * Returns counts by status, gravity, crime head, monthly trends, demographics, legal sections.
 */
async function getAnalyticsSummary(req) {
  const dbConn = getDb(req);

  if (dbConn.type === 'sqlite') {
    const totalCases = dbConn.db.prepare('SELECT COUNT(*) as count FROM CaseMaster').get().count || 0;

    const byStatus = dbConn.db.prepare(`
      SELECT cs.CaseStatusName as status, COUNT(*) as count
      FROM CaseMaster c
      LEFT JOIN CaseStatusMaster cs ON c.CaseStatusID = cs.CaseStatusID
      GROUP BY c.CaseStatusID
    `).all();

    const byGravity = dbConn.db.prepare(`
      SELECT go.LookupValue as gravity, COUNT(*) as count
      FROM CaseMaster c
      LEFT JOIN GravityOffence go ON c.GravityOffenceID = go.GravityOffenceID
      GROUP BY c.GravityOffenceID
    `).all();

    const byCrimeHead = dbConn.db.prepare(`
      SELECT ch.CrimeGroupName as name, COUNT(*) as count
      FROM CaseMaster c
      LEFT JOIN CrimeHead ch ON c.CrimeMajorHeadID = ch.CrimeHeadID
      GROUP BY c.CrimeMajorHeadID
    `).all();

    const byCrimeSubHead = dbConn.db.prepare(`
      SELECT csh.CrimeHeadName as name, COUNT(*) as count
      FROM CaseMaster c
      LEFT JOIN CrimeSubHead csh ON c.CrimeMinorHeadID = csh.CrimeSubHeadID
      GROUP BY c.CrimeMinorHeadID ORDER BY count DESC LIMIT 10
    `).all();

    const byMonth = dbConn.db.prepare(`
      SELECT strftime('%Y-%m', CrimeRegisteredDate) as month, COUNT(*) as count
      FROM CaseMaster
      WHERE CrimeRegisteredDate IS NOT NULL
      GROUP BY month ORDER BY month DESC LIMIT 12
    `).all();

    const victimGender = dbConn.db.prepare(`
      SELECT GenderID, COUNT(*) as count FROM Victim GROUP BY GenderID
    `).all();

    const victimAge = dbConn.db.prepare(`
      SELECT
        CASE WHEN AgeYear < 18 THEN 'Minor (<18)'
             WHEN AgeYear < 30 THEN 'Youth (18-29)'
             WHEN AgeYear < 45 THEN 'Adult (30-44)'
             WHEN AgeYear < 60 THEN 'Middle-aged (45-59)'
             ELSE 'Senior (60+)'
        END as ageGroup, COUNT(*) as count
      FROM Victim WHERE AgeYear IS NOT NULL GROUP BY ageGroup
    `).all();

    const accusedGender = dbConn.db.prepare(`
      SELECT GenderID, COUNT(*) as count FROM Accused GROUP BY GenderID
    `).all();

    const accusedAge = dbConn.db.prepare(`
      SELECT
        CASE WHEN AgeYear < 18 THEN 'Minor (<18)'
             WHEN AgeYear < 30 THEN 'Youth (18-29)'
             WHEN AgeYear < 45 THEN 'Adult (30-44)'
             WHEN AgeYear < 60 THEN 'Middle-aged (45-59)'
             ELSE 'Senior (60+)'
        END as ageGroup, COUNT(*) as count
      FROM Accused WHERE AgeYear IS NOT NULL GROUP BY ageGroup
    `).all();

    const topSections = dbConn.db.prepare(`
      SELECT asa.ActID as actCode, asa.SectionID as sectionCode,
             s.SectionDescription as description, COUNT(*) as count
      FROM ActSectionAssociation asa
      LEFT JOIN Section s ON asa.ActID = s.ActCode AND asa.SectionID = s.SectionCode
      GROUP BY asa.ActID, asa.SectionID ORDER BY count DESC LIMIT 10
    `).all();

    const chargesheetTypes = dbConn.db.prepare(`
      SELECT cstype, COUNT(*) as count FROM ChargesheetDetails GROUP BY cstype
    `).all();

    const totalArrests = dbConn.db.prepare('SELECT COUNT(*) as count FROM ArrestSurrender').get().count || 0;

    const complainantOccupation = dbConn.db.prepare(`
      SELECT om.OccupationName as name, COUNT(*) as count
      FROM ComplainantDetails cd
      LEFT JOIN OccupationMaster om ON cd.OccupationID = om.OccupationID
      GROUP BY cd.OccupationID ORDER BY count DESC LIMIT 8
    `).all();

    const complainantReligion = dbConn.db.prepare(`
      SELECT rm.ReligionName as name, COUNT(*) as count
      FROM ComplainantDetails cd
      LEFT JOIN ReligionMaster rm ON cd.ReligionID = rm.ReligionID
      GROUP BY cd.ReligionID ORDER BY count DESC
    `).all();

    const byStation = dbConn.db.prepare(`
      SELECT 
        u.UnitName as station,
        COUNT(c.CaseMasterID) as total,
        SUM(CASE WHEN c.CaseStatusID = 1 THEN 1 ELSE 0 END) as underInv,
        SUM(CASE WHEN c.CaseStatusID = 2 THEN 1 ELSE 0 END) as chargesheeted,
        SUM(CASE WHEN c.CaseStatusID = 3 THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN c.GravityOffenceID = 1 THEN 1 ELSE 0 END) as heinous
      FROM Unit u
      JOIN CaseMaster c ON c.PoliceStationID = u.UnitID
      GROUP BY u.UnitID, u.UnitName
      ORDER BY total DESC
    `).all();

    const byOfficer = dbConn.db.prepare(`
      SELECT 
        e.FirstName as officer,
        e.KGID as kgid,
        u.UnitName as station,
        COUNT(c.CaseMasterID) as total,
        SUM(CASE WHEN c.CaseStatusID = 1 THEN 1 ELSE 0 END) as underInv,
        SUM(CASE WHEN c.CaseStatusID = 2 THEN 1 ELSE 0 END) as chargesheeted,
        SUM(CASE WHEN c.CaseStatusID = 3 THEN 1 ELSE 0 END) as closed
      FROM Employee e
      LEFT JOIN Unit u ON e.UnitID = u.UnitID
      JOIN CaseMaster c ON c.PolicePersonID = e.EmployeeID
      GROUP BY e.EmployeeID, e.FirstName, e.KGID, u.UnitName
      ORDER BY total DESC
    `).all();

    return {
      totalCases, byStatus, byGravity, byCrimeHead, byCrimeSubHead,
      byMonth, victimGender, victimAge, accusedGender, accusedAge,
      topSections, chargesheetTypes, totalArrests,
      complainantOccupation, complainantReligion,
      byStation, byOfficer
    };
  } else {
    // Catalyst mode — parallel ZCQL queries
    const [
      masterRows, byStatusRes, byGravityRes, byCrimeHeadRes, byCrimeSubHeadRes,
      byMonthRes, victimGenderRes, accusedGenderRes,
      topSectionsRes, chargesheetRes, arrestCountRes,
      victimRows, accusedRows, complainantOccRes, complainantRelRes,
      allCaseStationsRes, allCaseOfficersRes
    ] = await Promise.all([
      queryZcql(dbConn.zcql, 'SELECT COUNT(ROWID) as count FROM CaseMaster', 'CaseMaster').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT CaseStatusID, COUNT(ROWID) as count FROM CaseMaster', 'CaseMaster').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT GravityOffenceID, COUNT(ROWID) as count FROM CaseMaster', 'CaseMaster').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT CrimeMajorHeadID, COUNT(ROWID) as count FROM CaseMaster', 'CaseMaster').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT CrimeMinorHeadID, COUNT(ROWID) as count FROM CaseMaster', 'CaseMaster').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT CrimeRegisteredDate FROM CaseMaster', 'CaseMaster').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT GenderID, COUNT(ROWID) as count FROM Victim', 'Victim').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT GenderID, COUNT(ROWID) as count FROM Accused', 'Accused').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT ActID, SectionID, COUNT(ROWID) as count FROM ActSectionAssociation', 'ActSectionAssociation').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT cstype, COUNT(ROWID) as count FROM ChargesheetDetails', 'ChargesheetDetails').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT COUNT(ROWID) as count FROM ArrestSurrender', 'ArrestSurrender').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT AgeYear FROM Victim', 'Victim').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT AgeYear FROM Accused', 'Accused').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT OccupationID, COUNT(ROWID) as count FROM ComplainantDetails', 'ComplainantDetails').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT ReligionID, COUNT(ROWID) as count FROM ComplainantDetails', 'ComplainantDetails').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT PoliceStationID, CaseStatusID, GravityOffenceID FROM CaseMaster', 'CaseMaster').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT PolicePersonID, CaseStatusID FROM CaseMaster', 'CaseMaster').catch(() => [])
    ]);

    // Fetch lookup tables for ID→Name resolution (+ Unit/Employee for byStation/byOfficer)
    const [statuses, gravities, crimeHeads, crimeSubHeads, sections, occupations, religions, analyticsUnits, analyticsEmployees] = await Promise.all([
      queryZcql(dbConn.zcql, 'SELECT CaseStatusID, CaseStatusName FROM CaseStatusMaster', 'CaseStatusMaster').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT GravityOffenceID, LookupValue FROM GravityOffence', 'GravityOffence').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT CrimeHeadID, CrimeGroupName FROM CrimeHead', 'CrimeHead').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT CrimeSubHeadID, CrimeHeadName FROM CrimeSubHead', 'CrimeSubHead').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT ActCode, SectionCode, SectionDescription FROM Section', 'Section').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT OccupationID, OccupationName FROM OccupationMaster', 'OccupationMaster').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT ReligionID, ReligionName FROM ReligionMaster', 'ReligionMaster').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT UnitID, UnitName FROM Unit WHERE Active = 1', 'Unit').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT EmployeeID, FirstName, KGID, UnitID FROM Employee', 'Employee').catch(() => [])
    ]);

    const statusMap = new Map(statuses.map(s => [s.CaseStatusID, s.CaseStatusName]));
    const gravityMap = new Map(gravities.map(g => [g.GravityOffenceID, g.LookupValue]));
    const headMap = new Map(crimeHeads.map(h => [h.CrimeHeadID, h.CrimeGroupName]));
    const subHeadMap = new Map(crimeSubHeads.map(s => [s.CrimeSubHeadID, s.CrimeHeadName]));
    const sectionMap = new Map(sections.map(s => [`${s.ActCode}-${s.SectionCode}`, s.SectionDescription]));
    const occMap = new Map(occupations.map(o => [o.OccupationID, o.OccupationName]));
    const relMap = new Map(religions.map(r => [r.ReligionID, r.ReligionName]));

    const totalCases = masterRows.length > 0 ? parseInt(masterRows[0].count || 0) : 0;

    // Build byStatus from raw rows
    const statusCounts = {};
    byStatusRes.forEach(r => {
      const name = statusMap.get(r.CaseStatusID) || 'Unknown';
      statusCounts[name] = (statusCounts[name] || 0) + parseInt(r.count || 1);
    });
    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    const gravityCounts = {};
    byGravityRes.forEach(r => {
      const name = gravityMap.get(r.GravityOffenceID) || 'Unknown';
      gravityCounts[name] = (gravityCounts[name] || 0) + parseInt(r.count || 1);
    });
    const byGravity = Object.entries(gravityCounts).map(([gravity, count]) => ({ gravity, count }));

    const headCounts = {};
    byCrimeHeadRes.forEach(r => {
      const name = headMap.get(r.CrimeMajorHeadID) || 'Unknown';
      headCounts[name] = (headCounts[name] || 0) + parseInt(r.count || 1);
    });
    const byCrimeHead = Object.entries(headCounts).map(([name, count]) => ({ name, count }));

    const subHeadCounts = {};
    byCrimeSubHeadRes.forEach(r => {
      const name = subHeadMap.get(r.CrimeMinorHeadID) || 'Unknown';
      subHeadCounts[name] = (subHeadCounts[name] || 0) + parseInt(r.count || 1);
    });
    const byCrimeSubHead = Object.entries(subHeadCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 10);

    // Monthly breakdown from raw date strings
    const monthCounts = {};
    byMonthRes.forEach(r => {
      if (!r.CrimeRegisteredDate) return;
      const d = new Date(r.CrimeRegisteredDate);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });
    const byMonth = Object.entries(monthCounts)
      .sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12)
      .map(([month, count]) => ({ month, count }));

    // Gender labels
    const genderLabel = id => id === 2 ? 'Female' : id === 3 ? 'Transgender' : 'Male';
    const victimGender = victimGenderRes.map(r => ({ gender: genderLabel(r.GenderID), count: parseInt(r.count || 1) }));
    const accusedGender = accusedGenderRes.map(r => ({ gender: genderLabel(r.GenderID), count: parseInt(r.count || 1) }));

    // Age bucketing
    function buildAgeBuckets(rows) {
      const buckets = { 'Minor (<18)': 0, 'Youth (18-29)': 0, 'Adult (30-44)': 0, 'Middle-aged (45-59)': 0, 'Senior (60+)': 0 };
      rows.forEach(r => {
        const age = parseInt(r.AgeYear);
        if (isNaN(age)) return;
        if (age < 18) buckets['Minor (<18)']++;
        else if (age < 30) buckets['Youth (18-29)']++;
        else if (age < 45) buckets['Adult (30-44)']++;
        else if (age < 60) buckets['Middle-aged (45-59)']++;
        else buckets['Senior (60+)']++;
      });
      return Object.entries(buckets).map(([ageGroup, count]) => ({ ageGroup, count }));
    }
    const victimAge = buildAgeBuckets(victimRows);
    const accusedAge = buildAgeBuckets(accusedRows);

    // Top sections
    const sectionCounts = {};
    topSectionsRes.forEach(r => {
      const key = `${r.ActID} § ${r.SectionID}`;
      sectionCounts[key] = { actCode: r.ActID, sectionCode: r.SectionID, description: sectionMap.get(`${r.ActID}-${r.SectionID}`) || '', count: (sectionCounts[key]?.count || 0) + 1 };
    });
    const topSections = Object.values(sectionCounts).sort((a, b) => b.count - a.count).slice(0, 10);

    // Chargesheet types
    const csCounts = {};
    chargesheetRes.forEach(r => { csCounts[r.cstype] = (csCounts[r.cstype] || 0) + parseInt(r.count || 1); });
    const chargesheetTypes = Object.entries(csCounts).map(([cstype, count]) => ({ cstype, count }));

    const totalArrests = arrestCountRes.length > 0 ? parseInt(arrestCountRes[0].count || 0) : 0;

    const occCounts = {};
    complainantOccRes.forEach(r => { const name = occMap.get(r.OccupationID) || 'Other'; occCounts[name] = (occCounts[name] || 0) + parseInt(r.count || 1); });
    const complainantOccupation = Object.entries(occCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    const relCounts = {};
    complainantRelRes.forEach(r => { const name = relMap.get(r.ReligionID) || 'Other'; relCounts[name] = (relCounts[name] || 0) + parseInt(r.count || 1); });
    const complainantReligion = Object.entries(relCounts).map(([name, count]) => ({ name, count }));

    // byStation — in-memory aggregation (Catalyst can't do 2-table GROUP BY joins)
    const analyticsUnitMap = new Map(analyticsUnits.map(u => [u.UnitID, u.UnitName]));
    const stationAgg = {};
    allCaseStationsRes.forEach(r => {
      const sid = r.PoliceStationID;
      if (!sid) return;
      if (!stationAgg[sid]) stationAgg[sid] = { station: analyticsUnitMap.get(sid) || `Unit-${sid}`, total: 0, underInv: 0, chargesheeted: 0, closed: 0, heinous: 0 };
      stationAgg[sid].total++;
      const st = parseInt(r.CaseStatusID);
      const gv = parseInt(r.GravityOffenceID);
      if (st === 1) stationAgg[sid].underInv++;
      else if (st === 2) stationAgg[sid].chargesheeted++;
      else if (st === 3) stationAgg[sid].closed++;
      if (gv === 1) stationAgg[sid].heinous++;
    });
    const byStation = Object.values(stationAgg).sort((a, b) => b.total - a.total);

    // byOfficer — in-memory aggregation
    const analyticsEmpMap = new Map(analyticsEmployees.map(e => [e.EmployeeID, e]));
    const officerAgg = {};
    allCaseOfficersRes.forEach(r => {
      const oid = r.PolicePersonID;
      if (!oid) return;
      if (!officerAgg[oid]) {
        const emp = analyticsEmpMap.get(oid) || {};
        officerAgg[oid] = { officer: emp.FirstName || `Officer-${oid}`, kgid: emp.KGID || '', station: analyticsUnitMap.get(emp.UnitID) || '', total: 0, underInv: 0, chargesheeted: 0, closed: 0 };
      }
      officerAgg[oid].total++;
      const st = parseInt(r.CaseStatusID);
      if (st === 1) officerAgg[oid].underInv++;
      else if (st === 2) officerAgg[oid].chargesheeted++;
      else if (st === 3) officerAgg[oid].closed++;
    });
    const byOfficer = Object.values(officerAgg).sort((a, b) => b.total - a.total);

    return {
      totalCases, byStatus, byGravity, byCrimeHead, byCrimeSubHead,
      byMonth, victimGender, victimAge, accusedGender, accusedAge,
      topSections, chargesheetTypes, totalArrests,
      complainantOccupation, complainantReligion,
      byStation, byOfficer
    };
  }
}



/**
 * Returns a list of all tables and their row counts.
 */
async function getTables(req) {
  const dbConn = getDb(req);

  const tablesList = [
    'State', 'District', 'UnitType', 'Unit', 'Rank', 'Designation', 'Employee', 'Court',
    'CaseCategory', 'GravityOffence', 'CrimeHead', 'CrimeSubHead', 'CaseStatusMaster',
    'CasteMaster', 'ReligionMaster', 'OccupationMaster', 'Act', 'Section', 'CrimeHeadActSection',
    'CaseMaster', 'Inv_OccuranceTime', 'ComplainantDetails', 'ActSectionAssociation', 'Victim',
    'Accused', 'ArrestSurrender', 'inv_arrestsurrenderaccused', 'ChargesheetDetails'
  ];

  if (dbConn.type === 'sqlite') {
    return tablesList.map(name => {
      try {
        const row = dbConn.db.prepare(`SELECT COUNT(*) as count FROM [${name}]`).get();
        return { tableName: name, rowCount: row ? row.count : 0 };
      } catch (error) {
        return { tableName: name, rowCount: 0, error: error.message };
      }
    });
  } else {
    // Catalyst counts
    return Promise.all(tablesList.map(async name => {
      try {
        const res = await dbConn.zcql.executeZCQLQuery(`SELECT COUNT(ROWID) as count FROM ${name}`);
        const count = (res && res[0] && res[0][name] && res[0][name].count) ? parseInt(res[0][name].count) : 0;
        return { tableName: name, rowCount: count };
      } catch (error) {
        return { tableName: name, rowCount: 0, error: error.message };
      }
    }));
  }
}

/**
 * Returns rows for a specific table (limit 100).
 */
async function getTableRows(req, tableName) {
  const dbConn = getDb(req);

  if (dbConn.type === 'sqlite') {
    return dbConn.db.prepare(`SELECT * FROM [${tableName}] LIMIT 100;`).all();
  } else {
    return queryZcql(dbConn.zcql, `SELECT * FROM ${tableName} LIMIT 100`, tableName);
  }
}


/**
 * Delete a single case by CaseMasterID and all its related sub-records.
 */
async function deleteCase(req, caseId) {
  const dbConn = getDb(req);

  if (dbConn.type === 'sqlite') {
    const tables = [
      'ActSectionAssociation', 'ArrestSurrender', 'ChargesheetDetails',
      'Inv_OccuranceTime', 'ComplainantDetails', 'Victim', 'Accused', 'CaseMaster'
    ];
    for (const tbl of tables) {
      try {
        dbConn.db.prepare(`DELETE FROM [${tbl}] WHERE CaseMasterID = ?`).run(caseId);
      } catch (e) {
        console.warn(`Could not delete from ${tbl}:`, e.message);
      }
    }
    return { deleted: caseId };
  } else {
    // Catalyst Datastore — delete child rows first, then CaseMaster
    const childTables = [
      'ActSectionAssociation', 'ArrestSurrender', 'ChargesheetDetails',
      'Inv_OccuranceTime', 'ComplainantDetails', 'Victim', 'Accused'
    ];
    for (const tbl of childTables) {
      try {
        const rows = await queryZcql(dbConn.zcql, `SELECT ROWID FROM ${tbl} WHERE CaseMasterID = ${caseId}`, tbl);
        for (const row of rows) {
          const rowId = row.ROWID;
          if (rowId) {
            await dbConn.datastore.table(tbl).deleteRow(rowId);
          }
        }
      } catch (e) {
        console.warn(`Could not purge ${tbl} for case ${caseId}:`, e.message);
      }
    }
    // Delete CaseMaster row
    try {
      const masterRows = await queryZcql(dbConn.zcql, `SELECT ROWID FROM CaseMaster WHERE CaseMasterID = ${caseId}`, 'CaseMaster');
      for (const row of masterRows) {
        if (row.ROWID) {
          await dbConn.datastore.table('CaseMaster').deleteRow(row.ROWID);
        }
      }
    } catch (e) {
      console.warn(`Could not delete CaseMaster row ${caseId}:`, e.message);
    }
    return { deleted: caseId };
  }
}

/**
 * Delete ALL cases from the datastore (admin purge of seed/fake data).
 */
async function deleteAllCases(req) {
  const dbConn = getDb(req);

  if (dbConn.type === 'sqlite') {
    const tables = [
      'ActSectionAssociation', 'ArrestSurrender', 'ChargesheetDetails',
      'Inv_OccuranceTime', 'ComplainantDetails', 'Victim', 'Accused', 'CaseMaster'
    ];
    let count = 0;
    for (const tbl of tables) {
      try {
        const result = dbConn.db.prepare(`DELETE FROM [${tbl}]`).run();
        if (tbl === 'CaseMaster') count = result.changes;
      } catch (e) {
        console.warn(`Could not truncate ${tbl}:`, e.message);
      }
    }
    return { deletedCases: count };
  } else {
    // Catalyst — fetch all case IDs and delete one by one
    const casesRows = await queryZcql(dbConn.zcql, 'SELECT CaseMasterID FROM CaseMaster', 'CaseMaster');
    const caseIds = casesRows.map(r => r.CaseMasterID);
    let deletedCount = 0;
    for (const cid of caseIds) {
      await deleteCase(req, cid);
      deletedCount++;
    }
    return { deletedCases: deletedCount };
  }
}

/**
 * File a chargesheet (final report) for a case.
 * cstype: 'A' = Chargesheet, 'B' = False Case, 'C' = Undetected/Referred.
 * Updates CaseMaster.CaseStatusID automatically:
 *   A → 2 (Charge Sheeted), B/C → 3 (Closed)
 */
async function createChargesheet(req, caseId, data) {
  const dbConn = getDb(req);
  const csdate = data.csdate || new Date().toISOString().split('T')[0];
  const cstype = data.cstype || 'A';
  const policePersonID = data.PolicePersonID || null;

  // Map cstype to new CaseStatusID
  // 2 = Charge Sheeted (A), 3 = Closed (B = False Case, C = Undetected)
  const newStatusId = cstype === 'A' ? 2 : 3;

  if (dbConn.type === 'sqlite') {
    // Check if chargesheet already exists
    const existing = dbConn.db.prepare(`SELECT CSID FROM ChargesheetDetails WHERE CaseMasterID = ?`).get(caseId);
    if (existing) {
      // Update existing chargesheet
      dbConn.db.prepare(`UPDATE ChargesheetDetails SET csdate = ?, cstype = ?, PolicePersonID = ? WHERE CaseMasterID = ?`)
        .run(csdate, cstype, policePersonID, caseId);
    } else {
      const csId = (dbConn.db.prepare(`SELECT MAX(CSID) as maxId FROM ChargesheetDetails`).get()?.maxId || 0) + 1;
      dbConn.db.prepare(`INSERT INTO ChargesheetDetails (CSID, CaseMasterID, csdate, cstype, PolicePersonID) VALUES (?, ?, ?, ?, ?)`)
        .run(csId, caseId, csdate, cstype, policePersonID);
    }
    // Update case status
    dbConn.db.prepare(`UPDATE CaseMaster SET CaseStatusID = ? WHERE CaseMasterID = ?`).run(newStatusId, caseId);
    return { caseId, cstype, newStatusId };
  } else {
    // Catalyst mode — check existing then upsert
    const existing = await queryZcql(dbConn.zcql, `SELECT ROWID, CSID FROM ChargesheetDetails WHERE CaseMasterID = ${caseId}`, 'ChargesheetDetails');
    if (existing.length > 0 && existing[0].ROWID) {
      // Update
      await dbConn.datastore.table('ChargesheetDetails').updateRow({ ROWID: existing[0].ROWID, csdate, cstype, PolicePersonID: policePersonID });
    } else {
      const csId = await getNextId(dbConn, 'ChargesheetDetails', 'CSID');
      await dbConn.datastore.table('ChargesheetDetails').insertRow({ CSID: csId, CaseMasterID: caseId, csdate, cstype, PolicePersonID: policePersonID });
    }
    // Update CaseMaster status
    const masterRows = await queryZcql(dbConn.zcql, `SELECT ROWID FROM CaseMaster WHERE CaseMasterID = ${caseId}`, 'CaseMaster');
    if (masterRows.length > 0 && masterRows[0].ROWID) {
      await dbConn.datastore.table('CaseMaster').updateRow({ ROWID: masterRows[0].ROWID, CaseStatusID: newStatusId });
    }
    return { caseId, cstype, newStatusId };
  }
}

/**
 * Get full employee roster with Rank, Designation, Unit names resolved.
 */
async function getEmployees(req) {
  const dbConn = getDb(req);
  if (dbConn.type === 'sqlite') {
    try {
      return dbConn.db.prepare(`
        SELECT e.EmployeeID, e.FirstName, e.KGID, e.GenderID,
               r.RankName, r.Hierarchy as RankHierarchy,
               d.DesignationName,
               u.UnitName, u.UnitID,
               dist.DistrictName
        FROM Employee e
        LEFT JOIN Rank r ON e.RankID = r.RankID
        LEFT JOIN Designation d ON e.DesignationID = d.DesignationID
        LEFT JOIN Unit u ON e.UnitID = u.UnitID
        LEFT JOIN District dist ON e.DistrictID = dist.DistrictID
        ORDER BY r.Hierarchy ASC, e.FirstName
      `).all();
    } catch(e) {
      return dbConn.db.prepare('SELECT EmployeeID, FirstName, KGID FROM Employee ORDER BY FirstName').all();
    }
  } else {
    const [employees, ranks, designations, units, districts] = await Promise.all([
      queryZcql(dbConn.zcql, 'SELECT EmployeeID, FirstName, KGID, GenderID, RankID, DesignationID, UnitID, DistrictID FROM Employee', 'Employee').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT RankID, RankName, Hierarchy FROM Rank', 'Rank').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT DesignationID, DesignationName FROM Designation', 'Designation').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT UnitID, UnitName FROM Unit WHERE Active = 1', 'Unit').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT DistrictID, DistrictName FROM District WHERE Active = 1', 'District').catch(() => [])
    ]);
    const rankMap = new Map(ranks.map(r => [r.RankID, r]));
    const desigMap = new Map(designations.map(d => [d.DesignationID, d.DesignationName]));
    const unitMap = new Map(units.map(u => [u.UnitID, u.UnitName]));
    const distMap = new Map(districts.map(d => [d.DistrictID, d.DistrictName]));
    return employees
      .map(e => ({
        EmployeeID: e.EmployeeID,
        FirstName: e.FirstName,
        KGID: e.KGID,
        GenderID: e.GenderID,
        RankName: rankMap.get(e.RankID)?.RankName || 'Officer',
        RankHierarchy: rankMap.get(e.RankID)?.Hierarchy || 99,
        DesignationName: desigMap.get(e.DesignationID) || 'Investigating Officer',
        UnitName: unitMap.get(e.UnitID) || 'Unknown Station',
        UnitID: e.UnitID,
        DistrictName: distMap.get(e.DistrictID) || ''
      }))
      .sort((a, b) => a.RankHierarchy - b.RankHierarchy || (a.FirstName||'').localeCompare(b.FirstName||''));
  }
}

/**
 * Get Unit hierarchy using ParentUnit self-reference for tree display.
 */
async function getUnitHierarchy(req) {
  const dbConn = getDb(req);
  let units = [], unitTypes = [];
  if (dbConn.type === 'sqlite') {
    try {
      units = dbConn.db.prepare(`
        SELECT u.UnitID, u.UnitName, u.TypeID, u.ParentUnit, u.StateID, u.DistrictID,
               ut.UnitTypeName, ut.CityDistState, ut.Hierarchy as TypeHierarchy
        FROM Unit u LEFT JOIN UnitType ut ON u.TypeID = ut.UnitTypeID
        WHERE u.Active = 1 ORDER BY ut.Hierarchy, u.UnitName
      `).all();
      unitTypes = dbConn.db.prepare('SELECT UnitTypeID, UnitTypeName, CityDistState, Hierarchy FROM UnitType ORDER BY Hierarchy').all();
    } catch(e) {
      units = dbConn.db.prepare('SELECT UnitID, UnitName, TypeID, ParentUnit FROM Unit WHERE Active = 1').all();
    }
  } else {
    [units, unitTypes] = await Promise.all([
      queryZcql(dbConn.zcql, 'SELECT UnitID, UnitName, TypeID, ParentUnit, StateID, DistrictID FROM Unit WHERE Active = 1', 'Unit').catch(() => []),
      queryZcql(dbConn.zcql, 'SELECT UnitTypeID, UnitTypeName, CityDistState, Hierarchy FROM UnitType', 'UnitType').catch(() => [])
    ]);
    const typeMap = new Map(unitTypes.map(t => [t.UnitTypeID, t]));
    units = units.map(u => ({
      ...u,
      UnitTypeName: typeMap.get(u.TypeID)?.UnitTypeName || 'Unit',
      CityDistState: typeMap.get(u.TypeID)?.CityDistState || 'District',
      TypeHierarchy: typeMap.get(u.TypeID)?.Hierarchy || 99
    })).sort((a, b) => a.TypeHierarchy - b.TypeHierarchy || (a.UnitName||'').localeCompare(b.UnitName||''));
  }
  return { units, unitTypes };
}

module.exports = {
  getCases,
  getCaseById,
  getLookups,
  createCase,
  createChargesheet,
  deleteCase,
  deleteAllCases,
  getAnalyticsSummary,
  getTables,
  getTableRows,
  getEmployees,
  getUnitHierarchy
};

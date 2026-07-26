import React, { useState, useEffect, useMemo } from 'react';
import { Database, Search, Table, List, Info, AlertTriangle, Key, Link2, Check, RefreshCw, Hash, FileSpreadsheet, Zap } from 'lucide-react';
import { translations } from '../../translations';

const TABLE_DESCRIPTIONS = {
  State: {
    en: "Lookup table for states within the system. Tracks active states and nationality references.",
    kn: "ವ್ಯವಸ್ಥೆಯಲ್ಲಿನ ರಾಜ್ಯಗಳ ಲುಕಪ್ ಕೋಷ್ಟಕ. ಸಕ್ರಿಯ ರಾಜ್ಯಗಳು ಮತ್ತು ರಾಷ್ಟ್ರೀಯತೆ ಉಲ್ಲೇಖಗಳನ್ನು ಪತ್ತೆ ಮಾಡುತ್ತದೆ."
  },
  District: {
    en: "Lookup table for districts or administrative divisions belonging to states.",
    kn: "ರಾಜ್ಯಕ್ಕೆ ಸೇರಿರುವ ಜಿಲ್ಲೆಗಳು ಅಥವಾ ಆಡಳಿತಾತ್ಮಕ ವಿಭಾಗಗಳ ಲುಕಪ್ ಕೋಷ್ಟಕ."
  },
  UnitType: {
    en: "Classification of police units (e.g., Police Station, Circle Office, SP Office).",
    kn: "ಪೊಲೀಸ್ ಘಟಕಗಳ ವರ್ಗೀಕರಣ (ಉದಾ. ಪೊಲೀಸ್ ಠಾಣೆ, ಸರ್ಕಲ್ ಕಚೇರಿ, ಎಸ್‌ಪಿ ಕಚೇರಿ)."
  },
  Unit: {
    en: "Specific police stations/units, featuring a parent-child self-reference hierarchy.",
    kn: "ವಿಶೇಷ ಪೊಲೀಸ್ ಠಾಣೆಗಳು/ಘಟಕಗಳು, ಪೋಷಕ-ಮಕ್ಕಳ ಸ್ವಯಂ-ಉಲ್ಲೇಖ ಶ್ರೇಣಿಯನ್ನು ಒಳಗೊಂಡಿದೆ."
  },
  Rank: {
    en: "Police personnel ranks (e.g., Constable, Sub-Inspector, DSP) with rank hierarchy.",
    kn: "ಪೊಲೀಸ್ ಶ್ರೇಣಿಗಳು (ಉದಾ. ಕಾನ್ಸ್‌ಟೇಬಲ್, ಸಬ್-ಇನ್ಸ್‌ಪೆಕ್ಟರ್, ಡಿಎಸ್‌ಪಿ) ಶ್ರೇಣಿ ಕ್ರಮದೊಂದಿಗೆ."
  },
  Designation: {
    en: "Personnel job designations (e.g., Investigating Officer, SHO, Circle Inspector).",
    kn: "ಸಿಬ್ಬಂದಿ ಹುದ್ದೆಯ ಪದನಾಮಗಳು (ಉದಾ. ತನಿಖಾಧಿಕಾರಿ, ಎಸ್‌ಎಚ್‌ಒ, ಸರ್ಕಲ್ ಇನ್ಸ್‌ಪೆಕ್ಟರ್)."
  },
  Employee: {
    en: "Police personnel tracking (KGID, current posting, rank, designation, DOB, blood group, etc.).",
    kn: "ಪೊಲೀಸ್ ಸಿಬ್ಬಂದಿ ಟ್ರ್ಯಾಕಿಂಗ್ (ಕೆಜಿಐಡಿ, ಪ್ರಸ್ತುತ ಪೋಸ್ಟಿಂಗ್, ಶ್ರೇಣಿ, ಪದನಾಮ, ಜನ್ಮ ದಿನಾಂಕ, ರಕ್ತದ ಗುಂಪು ಇತ್ಯಾದಿ)."
  },
  Court: {
    en: "Judicial courts linked to districts and states where cases are heard.",
    kn: "ಪ್ರಕರಣಗಳ ವಿಚಾರಣೆ ನಡೆಯುವ ಜಿಲ್ಲೆಗಳು ಮತ್ತು ರಾಜ್ಯಗಳಿಗೆ ಲಿಂಕ್ ಮಾಡಲಾದ ನ್ಯಾಯಾಲಯಗಳು."
  },
  CaseCategory: {
    en: "Category lookup for cases (FIR, UDR, Zero FIR, PAR). Defines structured prefix code.",
    kn: "ಪ್ರಕರಣಗಳ ವರ್ಗ ಲುಕಪ್ (ಪ್ರಥಮ ಮಾಹಿತಿ ವರದಿ, ಯುಡಿಆರ್, ಶೂನ್ಯ ಎಫ್‌ಐಆರ್, ಪಿಎಆರ್)."
  },
  GravityOffence: {
    en: "Case severity categories (e.g., Heinous, Non-Heinous).",
    kn: "ಪ್ರಕರಣದ ಗಾಂಭೀರ್ಯದ ವರ್ಗಗಳು (ಉದಾ. ಘೋರ ಅಪರಾಧ, ಘೋರವಲ್ಲದ ಅಪರಾಧ)."
  },
  CrimeHead: {
    en: "Major classification groups for crimes (e.g., Crimes Against Body, Crimes Against Property).",
    kn: "ಅಪರಾಧಗಳ ಪ್ರಮುಖ ವರ್ಗೀಕರಣ ಗುಂಪುಗಳು (ಉದಾ. ಶಾರೀರಿಕ ಅಪರಾಧಗಳು, ಆಸ್ತಿ ಅಪರಾಧಗಳು)."
  },
  CrimeSubHead: {
    en: "Minor/specific sub-classifications for crimes (e.g., Murder, Robbery, Dacoity, Theft).",
    kn: "ಅಪರಾಧಗಳ ನಿರ್ದಿಷ್ಟ ಉಪ-ವರ್ಗೀಕರಣಗಳು (ಉದಾ. ಕೊಲೆ, ದರೋಡೆ, ಲೂಟಿ, ಕಳ್ಳತನ)."
  },
  CaseStatusMaster: {
    en: "Status codes of the case progression (e.g., Under Investigation, Charge Sheeted, Closed).",
    kn: "ಪ್ರಕರಣದ ಪ್ರಗತಿಯ ಸ್ಥಿತಿ ಸಂಕೇತಗಳು (ಉದಾ. ತನಿಖೆಯಲ್ಲಿದೆ, ಚಾರ್ಜ್ ಶೀಟ್ ಮಾಡಲಾಗಿದೆ, ಮುಕ್ತಾಯಗೊಂಡಿದೆ)."
  },
  CasteMaster: {
    en: "Caste lookup table for demographic records of complainants and victims.",
    kn: "ದೂರುದಾರರು ಮತ್ತು ಬಲಿಪಶುಗಳ ಜನಸಂಖ್ಯಾ ದಾಖಲೆಗಳಿಗಾಗಿ ಜಾತಿ ಲುಕಪ್ ಕೋಷ್ಟಕ."
  },
  ReligionMaster: {
    en: "Religion lookup table for demographic records.",
    kn: "ಜನಸಂಖ್ಯಾ ದಾಖಲೆಗಳಿಗಾಗಿ ಧರ್ಮ ಲುಕಪ್ ಕೋಷ್ಟಕ."
  },
  OccupationMaster: {
    en: "Occupation lookup table for complainants.",
    kn: "ದೂರುದಾರರಿಗಾಗಿ ಉದ್ಯೋಗ ಲುಕಪ್ ಕೋಷ್ಟಕ."
  },
  Act: {
    en: "Legal acts governing cases (e.g., Indian Penal Code - IPC, NDPS Act).",
    kn: "ಪ್ರಕರಣಗಳನ್ನು ನಿಯಂತ್ರಿಸುವ ಕಾನೂನು ಕಾಯ್ದೆಗಳು (ಉದಾ. ಭಾರತೀಯ ದಂಡ ಸಂಹಿತೆ - ಐಪಿಸಿ, ಎನ್‌ಡಿಪಿಎಸ್ ಕಾಯ್ದೆ)."
  },
  Section: {
    en: "Specific sections/clauses under legal acts, utilizing a composite key (ActCode, SectionCode).",
    kn: "ಕಾನೂನು ಕಾಯ್ದೆಗಳ ಅಡಿಯಲ್ಲಿ ನಿರ್ದಿಷ್ಟ ಸೆಕ್ಷನ್‌ಗಳು, ಜಂಟಿ ಕೀಲಿಯನ್ನು ಬಳಸುತ್ತವೆ (ActCode, SectionCode)."
  },
  CrimeHeadActSection: {
    en: "Junction table mapping CrimeHead to legal Act & Section combinations.",
    kn: "ಅಪರಾಧದ ಹೆಡ್ ಅನ್ನು ಕಾನೂನು ಕಾಯ್ದೆ ಮತ್ತು ಸೆಕ್ಷನ್ ಸಂಯೋಜನೆಗಳಿಗೆ ನಕ್ಷೆ ಮಾಡುವ ಜಂಕ್ಷನ್ ಕೋಷ್ಟಕ."
  },
  CaseMaster: {
    en: "Core case registry representing an FIR/Case containing structured CrimeNo, CaseNo and registrations.",
    kn: "ರಚನಾತ್ಮಕ ಅಪರಾಧ ಸಂಖ್ಯೆ, ಪ್ರಕರಣ ಸಂಖ್ಯೆ ಮತ್ತು ನೋಂದಣಿಗಳನ್ನು ಹೊಂದಿರುವ ಕೋರ್ ಪ್ರಕರಣದ ನೋಂದಣಿ."
  },
  Inv_OccuranceTime: {
    en: "One-to-One extension of CaseMaster capturing incident duration dates and coordinates.",
    kn: "ಘಟನೆಯ ಅವಧಿಯ ದಿನಾಂಕಗಳು ಮತ್ತು ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ಸೆರೆಹಿಡಿಯುವ ಪ್ರಕರಣದ ನೋಂದಣಿಯ ಒನ್-ಟು-ಒನ್ ವಿಸ್ತರಣೆ."
  },
  ComplainantDetails: {
    en: "Demographic and occupation details of the person filing the case.",
    kn: "ಪ್ರಕರಣವನ್ನು ದಾಖಲಿಸುವ ವ್ಯಕ್ತಿಯ ಜನಸಂಖ್ಯಾ ಮತ್ತು ಉದ್ಯೋಗದ ವಿವರಗಳು."
  },
  ActSectionAssociation: {
    en: "Junction table mapping CaseMaster cases to specific legal Act and Section charges.",
    kn: "ಪ್ರಕರಣಗಳನ್ನು ನಿರ್ದಿಷ್ಟ ಕಾನೂನು ಕಾಯ್ದೆ ಮತ್ತು ಸೆಕ್ಷನ್ ಆರೋಪಗಳಿಗೆ ನಕ್ಷೆ ಮಾಡುವ ಜಂಕ್ಷನ್ ಕೋಷ್ಟಕ."
  },
  Victim: {
    en: "Case victims, age, gender, and indicators if the victim is a police officer.",
    kn: "ಪ್ರಕರಣದ ಬಲಿಪಶುಗಳು, ವಯಸ್ಸು, ಲಿಂಗ ಮತ್ತು ಬಲಿಪಶು ಪೊಲೀಸ್ ಅಧಿಕಾರಿಯಾಗಿದ್ದಾರೆಯೇ ಎಂಬ ಸೂಚಕಗಳು."
  },
  Accused: {
    en: "Accused individuals linked to CaseMaster cases, including sorting labels (A1, A2, etc.).",
    kn: "ಅಪರಾಧ ಆರೋಪಿಗಳ ವಿವರಗಳು, ವಿಂಗಡಣಾ ಲೇಬಲ್‌ಗಳೊಂದಿಗೆ (ಎ೧, ಎ೨, ಇತ್ಯಾದಿ)."
  },
  ArrestSurrender: {
    en: "Process events capturing arrest or voluntary surrender details, dates, and producing courts.",
    kn: "ದಸ್ತಗಿರಿ ಅಥವಾ ಸ್ವಯಂ ಶರಣಾಗತಿಯ ವಿವರಗಳು, ದಿನಾಂಕಗಳು ಮತ್ತು ನ್ಯಾಯಾಲಯದ ಪ್ರಸ್ತುತಿ ಘಟನೆಗಳು."
  },
  inv_arrestsurrenderaccused: {
    en: "Junction table mapping ArrestSurrender events to Accused individuals.",
    kn: "ದಸ್ತಗಿರಿ ಘಟನೆಗಳನ್ನು ಆರೋಪಿಗಳಿಗೆ ನಕ್ಷೆ ಮಾಡುವ ಜಂಕ್ಷನ್ ಕೋಷ್ಟಕ."
  },
  ChargesheetDetails: {
    en: "Final report details capturing reporting parameters (A -> Chargesheet, B -> False Case, C -> Undetected).",
    kn: "ವರದಿಯ ನಿಯತಾಂಕಗಳನ್ನು ಸೆರೆಹಿಡಿಯುವ ಅಂತಿಮ ವರದಿ ವಿವರಗಳು (ಎ -> ಚಾರ್ಜ್ ಶೀಟ್, ಬಿ -> ಸುಳ್ಳು ಪ್ರಕರಣ, ಸಿ -> ಪತ್ತೆಯಾಗದ ಪ್ರಕರಣ)."
  }
};

const TABLE_METADATA = {
  State: { pk: "StateID", fks: {} },
  District: { pk: "DistrictID", fks: { StateID: "State.StateID" } },
  UnitType: { pk: "UnitTypeID", fks: {} },
  Unit: { pk: "UnitID", fks: { TypeID: "UnitType.UnitTypeID", ParentUnit: "Unit.UnitID", StateID: "State.StateID", DistrictID: "District.DistrictID" } },
  Rank: { pk: "RankID", fks: {} },
  Designation: { pk: "DesignationID", fks: {} },
  Employee: { pk: "EmployeeID", fks: { DistrictID: "District.DistrictID", UnitID: "Unit.UnitID", RankID: "Rank.RankID", DesignationID: "Designation.DesignationID" } },
  Court: { pk: "CourtID", fks: { DistrictID: "District.DistrictID", StateID: "State.StateID" } },
  CaseCategory: { pk: "CaseCategoryID", fks: {} },
  GravityOffence: { pk: "GravityOffenceID", fks: {} },
  CrimeHead: { pk: "CrimeHeadID", fks: {} },
  CrimeSubHead: { pk: "CrimeSubHeadID", fks: { CrimeHeadID: "CrimeHead.CrimeHeadID" } },
  CaseStatusMaster: { pk: "CaseStatusID", fks: {} },
  CasteMaster: { pk: "caste_master_id", fks: {} },
  ReligionMaster: { pk: "ReligionID", fks: {} },
  OccupationMaster: { pk: "OccupationID", fks: {} },
  Act: { pk: "ActCode", fks: {} },
  Section: { pk: "ActCode, SectionCode", fks: { ActCode: "Act.ActCode" } },
  CrimeHeadActSection: { pk: "CrimeHeadID, ActCode, SectionCode", fks: { CrimeHeadID: "CrimeHead.CrimeHeadID", "ActCode, SectionCode": "Section.(ActCode, SectionCode)" } },
  CaseMaster: {
    pk: "CaseMasterID",
    fks: {
      PolicePersonID: "Employee.EmployeeID",
      PoliceStationID: "Unit.UnitID",
      CaseCategoryID: "CaseCategory.CaseCategoryID",
      GravityOffenceID: "GravityOffence.GravityOffenceID",
      CrimeMajorHeadID: "CrimeHead.CrimeHeadID",
      CrimeMinorHeadID: "CrimeSubHead.CrimeSubHeadID",
      CaseStatusID: "CaseStatusMaster.CaseStatusID",
      CourtID: "Court.CourtID"
    }
  },
  Inv_OccuranceTime: { pk: "CaseMasterID", fks: { CaseMasterID: "CaseMaster.CaseMasterID" } },
  ComplainantDetails: { pk: "ComplainantID", fks: { CaseMasterID: "CaseMaster.CaseMasterID", OccupationID: "OccupationMaster.OccupationID", ReligionID: "ReligionMaster.ReligionID", CasteID: "CasteMaster.caste_master_id" } },
  ActSectionAssociation: { pk: "CaseMasterID, ActID, SectionID", fks: { CaseMasterID: "CaseMaster.CaseMasterID", ActID: "Act.ActCode", SectionID: "Section.SectionCode" } },
  Victim: { pk: "VictimMasterID", fks: { CaseMasterID: "CaseMaster.CaseMasterID" } },
  Accused: { pk: "AccusedMasterID", fks: { CaseMasterID: "CaseMaster.CaseMasterID" } },
  ArrestSurrender: {
    pk: "ArrestSurrenderID",
    fks: {
      CaseMasterID: "CaseMaster.CaseMasterID",
      ArrestSurrenderStateId: "State.StateID",
      ArrestSurrenderDistrictId: "District.DistrictID",
      PoliceStationID: "Unit.UnitID",
      IOID: "Employee.EmployeeID",
      CourtID: "Court.CourtID",
      AccusedMasterID: "Accused.AccusedMasterID"
    }
  },
  inv_arrestsurrenderaccused: { pk: "ArrestSurrenderID, AccusedMasterID", fks: { ArrestSurrenderID: "ArrestSurrender.ArrestSurrenderID", AccusedMasterID: "Accused.AccusedMasterID" } },
  ChargesheetDetails: { pk: "CSID", fks: { CaseMasterID: "CaseMaster.CaseMasterID", PolicePersonID: "Employee.EmployeeID" } }
};

export default function DatabaseRegistry({ lang = 'en' }) {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [rows, setRows] = useState([]);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [gridSearch, setGridSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState(null);

  // Custom states for collapsed drawer & key translators
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lookups, setLookups] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [activeDbTab, setActiveDbTab] = useState('data'); // 'data' or 'schema'

  // Fetch tables and row counts on mount
  useEffect(() => {
    async function loadTables() {
      try {
        setLoading(true);
        const response = await fetch('/server/police_fir_api/api/tables');
        if (!response.ok) throw new Error("Failed to fetch tables list");
        const data = await response.json();
        setTables(data);
        setError(null);

        // Auto-select CaseMaster as default to look premium on load
        const caseMaster = data.find(t => t.tableName === 'CaseMaster');
        if (caseMaster) setSelectedTable(caseMaster);
      } catch (err) {
        console.error("Error loading tables list:", err);
        setError(translations[lang].dbExplorer.error);
      } finally {
        setLoading(false);
      }
    }
    loadTables();
  }, [lang]);

  // Fetch rows when selectedTable changes
  useEffect(() => {
    if (!selectedTable) return;

    async function loadTableRows() {
      try {
        setLoadingTable(true);
        setRows([]);
        const response = await fetch(`/server/police_fir_api/api/table/${selectedTable.tableName}`);
        if (!response.ok) throw new Error(`Failed to fetch rows for ${selectedTable.tableName}`);
        const data = await response.json();
        setRows(data);
      } catch (err) {
        console.error(`Error loading table ${selectedTable.tableName}:`, err);
      } finally {
        setLoadingTable(false);
      }
    }
    loadTableRows();
  }, [selectedTable]);

  // Fetch reference translation values on mount
  useEffect(() => {
    async function fetchLookupData() {
      try {
        const lookupRes = await fetch('/server/police_fir_api/api/lookups');
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          setLookups(lookupData);
        }
        const districtRes = await fetch('/server/police_fir_api/api/table/District');
        if (districtRes.ok) {
          const districtData = await districtRes.json();
          setDistricts(districtData);
        }
      } catch (e) {
        console.error("Failed to load reference translation lookups:", e);
      }
    }
    fetchLookupData();
  }, []);

  // Handle table selection
  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setGridSearch('');
  };

  const getTranslationMap = (colName) => {
    if (!lookups) return null;
    switch (colName) {
      case 'DistrictID':
        return new Map(districts.map(d => [d.DistrictID, d.DistrictName]));
      case 'PoliceStationID':
      case 'UnitID':
        return new Map(lookups.units.map(u => [u.UnitID, u.UnitName]));
      case 'PolicePersonID':
      case 'EmployeeID':
      case 'IOID':
        return new Map(lookups.employees.map(e => [e.EmployeeID, e.FirstName]));
      case 'CaseCategoryID':
        return new Map(lookups.categories.map(c => [c.CaseCategoryID, c.LookupValue]));
      case 'GravityOffenceID':
        return new Map(lookups.gravities.map(g => [g.GravityOffenceID, g.LookupValue]));
      case 'CrimeMajorHeadID':
      case 'CrimeHeadID':
        return new Map(lookups.crimeHeads.map(h => [h.CrimeHeadID, h.CrimeGroupName]));
      case 'CrimeMinorHeadID':
      case 'CrimeSubHeadID':
        return new Map(lookups.crimeSubHeads.map(s => [s.CrimeSubHeadID, s.CrimeHeadName]));
      case 'CaseStatusID':
        return new Map(lookups.statuses.map(s => [s.CaseStatusID, s.CaseStatusName]));
      case 'CourtID':
        return new Map(lookups.courts.map(c => [c.CourtID, c.CourtName]));
      case 'OccupationID':
        return new Map(lookups.occupations.map(o => [o.OccupationID, o.OccupationName]));
      case 'ReligionID':
        return new Map(lookups.religions.map(r => [r.ReligionID, r.ReligionName]));
      case 'CasteID':
      case 'caste_master_id':
        return new Map(lookups.castes.map(c => [c.caste_master_id, c.caste_master_name]));
      case 'ActID':
      case 'ActCode':
        return new Map(lookups.acts.map(a => [a.ActCode, a.ShortName]));
      case 'RankID':
        return lookups.ranks ? new Map(lookups.ranks.map(r => [r.RankID, r.RankName])) : null;
      case 'DesignationID':
        return lookups.designations ? new Map(lookups.designations.map(d => [d.DesignationID, d.DesignationName])) : null;
      case 'TypeID':
      case 'UnitTypeID':
        return lookups.unitTypes ? new Map(lookups.unitTypes.map(t => [t.UnitTypeID, t.UnitTypeName])) : null;
      case 'StateID':
      case 'ArrestSurrenderStateId':
        return lookups.states ? new Map(lookups.states.map(s => [s.StateID, s.StateName])) : null;
      case 'ParentUnit':
        return new Map(lookups.units.map(u => [u.UnitID, u.UnitName]));
      default:
        return null;
    }
  };

  // Get headers from rows keys dynamically
  const tableHeaders = useMemo(() => {
    if (rows.length === 0) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  // Filtered sidebar tables
  const filteredTables = useMemo(() => {
    return tables.filter(t =>
      t.tableName.toLowerCase().includes(sidebarSearch.toLowerCase())
    );
  }, [tables, sidebarSearch]);

  // Filtered rows memoization
  const filteredRows = useMemo(() => {
    if (!gridSearch) return rows;
    return rows.filter(row => {
      return Object.values(row).some(val =>
        String(val ?? '').toLowerCase().includes(gridSearch.toLowerCase())
      );
    });
  }, [rows, gridSearch]);

  const activeMetadata = useMemo(() => {
    if (!selectedTable) return null;
    return TABLE_METADATA[selectedTable.tableName] || { pk: '', fks: {} };
  }, [selectedTable]);

  const trans = translations[lang].dbExplorer;

  return (
    <div className="visualizer-split" style={{ fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit', height: '100%', gap: '1.25rem', gridTemplateColumns: '1fr' }}>

      {/* Sliding Table List Overlay Drawer */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(3px)',
              zIndex: 2000
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '320px',
              height: '100vh',
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 2001,
              display: 'flex',
              flexDirection: 'column',
              padding: '1.25rem',
              boxSizing: 'border-box',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                <Database size={15} style={{ color: 'var(--primary)' }} />
                Browse ERD Tables
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.1rem', fontSize: '0.78rem', background: 'var(--bg-inset)', border: '1px solid var(--border)' }}
                placeholder={lang === 'kn' ? "ಕೋಷ್ಟಕಗಳನ್ನು ಹುಡುಕಿ..." : "Filter 28 ERD tables..."}
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '4px' }}>
              {filteredTables.map(t => {
                const isSelected = selectedTable && selectedTable.tableName === t.tableName;
                return (
                  <button
                    key={t.tableName}
                    onClick={() => {
                      handleSelectTable(t);
                      setDrawerOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.8rem',
                      background: isSelected ? 'var(--primary-dim)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      outline: 'none'
                    }}
                    className={isSelected ? '' : 'hover-panel'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                      <Table size={13} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.tableName}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        background: isSelected ? 'var(--primary)' : 'var(--bg-elevated)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        padding: '1px 6px',
                        borderRadius: '2px',
                        fontWeight: 600,
                        flexShrink: 0
                      }}
                    >
                      {t.rowCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Main Panel: Details, Columns Specification & Raw Rows */}
      <div className="main-display" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, height: '100%', overflow: 'hidden' }}>

        {selectedTable ? (
          <>
            {/* Header info & Mini Stats Row */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {trans.viewingTable}
                  </span>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.1rem 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      onClick={() => setDrawerOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'var(--t)'
                      }}
                      className="hover-panel"
                    >
                      <Database size={12} />
                      {lang === 'kn' ? "ಕೋಷ್ಟಕಗಳು ☰" : "Browse Tables ☰"}
                    </button>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 300 }}>/</span>
                    <span>{selectedTable.tableName}</span>
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {TABLE_DESCRIPTIONS[selectedTable.tableName]?.[lang] || TABLE_DESCRIPTIONS[selectedTable.tableName]?.en}
                  </p>
                </div>

                {/* Tab Switcher & Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Tab Selector */}
                  <div style={{ display: 'flex', background: 'var(--bg-deep)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setActiveDbTab('data')}
                      style={{
                        padding: '0.35rem 0.8rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: '2px',
                        border: 'none',
                        background: activeDbTab === 'data' ? 'var(--primary)' : 'transparent',
                        color: activeDbTab === 'data' ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'var(--t)'
                      }}
                    >
                      {lang === 'kn' ? "ಕೋಷ್ಟಕ ದತ್ತಾಂಶ" : "Table Data"}
                    </button>
                    <button
                      onClick={() => setActiveDbTab('schema')}
                      style={{
                        padding: '0.35rem 0.8rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: '2px',
                        border: 'none',
                        background: activeDbTab === 'schema' ? 'var(--primary)' : 'transparent',
                        color: activeDbTab === 'schema' ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'var(--t)'
                      }}
                    >
                      {lang === 'kn' ? "ಸಂಬಂಧಗಳು ಮತ್ತು ಲುಕಪ್‌ಗಳು" : "Relations & Lookups"}
                    </button>
                  </div>

                  {/* Grid Search Bar */}
                  {activeDbTab === 'data' && (
                    <div style={{ display: 'flex', alignItems: 'stretch', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '32px', width: '240px' }}>
                      <input
                        type="text"
                        placeholder={trans.searchPlaceholder}
                        value={gridSearch}
                        onChange={(e) => setGridSearch(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', padding: '0 0.6rem', fontSize: '0.75rem', width: '100%' }}
                      />
                      <div style={{ padding: '0 0.6rem', display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border)' }}>
                        <Search size={12} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Table Schema metadata statistics - looks premium */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Hash size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{lang === 'kn' ? 'ಒಟ್ಟು ಸಾಲುಗಳು' : 'Total Rows'}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-primary)' }}>{selectedTable.rowCount}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Key size={16} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{lang === 'kn' ? 'ಮುಖ್ಯ ಕೀಲಿ' : 'Unique ID Column'}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{activeMetadata.pk || 'None'}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }} title="Foreign key relationship constraints referencing lookup tables (e.g., Police Station, Officer, Court, Crime Category)">
                  <Link2 size={16} style={{ color: 'var(--primary-light)' }} />
                  <div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{lang === 'kn' ? 'ವಿದೇಶಿ ಸಂಬಂಧಗಳು' : 'Linked Relations (FKs)'}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {Object.keys(activeMetadata.fks).length} {lang === 'kn' ? 'ವಿದೇಶಿ ಕೀಲಿಗಳು' : 'Foreign Keys'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB VIEW: SCHEMA & RELATIONS TAB */}
            {activeDbTab === 'schema' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '4px' }}>
                {/* Logical Columns Inspector Panel - represents the PDF ERD tables precisely */}
                {Object.keys(activeMetadata.fks).length > 0 && (
                  <div className="glass-panel" style={{ padding: '0.8rem 1.25rem', borderLeft: '4px solid var(--primary-light)' }}>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.5rem 0' }}>
                      <Link2 size={14} style={{ color: 'var(--primary-light)' }} />
                      {lang === 'kn' ? "ಇಆರ್‌ಡಿ ಸಂಪರ್ಕಗಳು ಮತ್ತು ವಿದೇಶಿ ಸಂಬಂಧಗಳು:" : "ERD Schema Mappings & Relationships:"}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {Object.keys(activeMetadata.fks).map(col => (
                        <div key={col} style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{col}</span>
                          <span style={{ color: 'var(--text-muted)' }}>→</span>
                          <span style={{ color: 'var(--primary-light)' }}>{activeMetadata.fks[col]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Value Translation Legend Directory */}
                {Object.keys(activeMetadata.fks).length > 0 && lookups && (
                  <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                      <Link2 size={14} style={{ color: 'var(--accent)' }} />
                      {lang === 'kn' ? "ಮೌಲ್ಯ ಅನುವಾದಗಳು (ಸಂಬಂಧಿತ ಮಾಹಿತಿ):" : "Reference Value Translations (Linked Legends):"}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      {Object.keys(activeMetadata.fks).map(col => {
                        const transMap = getTranslationMap(col);
                        if (!transMap || transMap.size === 0) return null;
                        return (
                          <div key={col} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{col}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>➔ {activeMetadata.fks[col].split('.')[0]}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                              {Array.from(transMap.entries()).map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: '2px', padding: '2px 6px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{k}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>➔</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB VIEW: DATA GRID VIEW */}
            {activeDbTab === 'data' && (
              <>
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, border: '1px solid var(--border)' }}>
                  {/* Battenberg Accent Table Header Strip */}
                  <div style={{
                    padding: '0.8rem 1.25rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(90deg, var(--bg-deep) 0%, transparent 100%)',
                    borderLeft: '4px solid var(--accent)'
                  }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                      <FileSpreadsheet size={14} style={{ color: 'var(--accent)' }} />
                      {trans.recordsHeader} ({filteredRows.length} / {selectedTable.rowCount})
                    </h4>
                    {loadingTable && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <RefreshCw size={12} className="spinner" />
                        Syncing...
                      </span>
                    )}
                  </div>

                  {loadingTable ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <span className="spinner" style={{ marginRight: '8px' }}>⏳</span>
                      {trans.loading}
                    </div>
                  ) : filteredRows.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', gap: '8px' }}>
                      <Info size={20} style={{ color: 'var(--text-secondary)' }} />
                      {trans.noRows}
                    </div>
                  ) : (
                    <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
                            {tableHeaders.map(h => (
                              <th
                                key={h}
                                style={{
                                  padding: '0.8rem 1rem',
                                  fontWeight: 800,
                                  color: 'var(--text-primary)',
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  borderBottom: '1px solid var(--border)'
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRows.map((row, idx) => (
                            <tr
                              key={idx}
                              style={{
                                borderBottom: '1px solid var(--border)',
                                background: idx % 2 === 1 ? 'var(--bg-inset)' : 'transparent'
                              }}
                              className="hover-panel"
                            >
                              {tableHeaders.map(h => {
                                const val = row[h];
                                let displayVal = String(val ?? '');
                                if (val === null || val === undefined) displayVal = 'NULL';
                                else if (typeof val === 'boolean') displayVal = val ? '1' : '0';

                                const isNullValue = val === null || val === undefined;
                                const isPkCol = activeMetadata.pk.includes(h);
                                const isFkCol = h in activeMetadata.fks;

                                return (
                                  <td
                                    key={h}
                                    style={{
                                      padding: '0.7rem 1rem',
                                      fontFamily: 'var(--font-mono), monospace',
                                      color: isNullValue ? 'var(--text-muted)' : 'var(--text-secondary)',
                                      fontStyle: isNullValue ? 'italic' : 'normal',
                                      whiteSpace: 'nowrap',
                                      maxWidth: '320px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                    title={displayVal}
                                  >
                                    {isNullValue ? (
                                      <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: '2px', border: '1px solid var(--border)' }}>NULL</span>
                                    ) : displayVal}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '1rem', minHeight: '400px', textAlign: 'center', padding: '2rem' }}>
            <Database size={48} style={{ color: 'var(--primary)', opacity: 0.8, marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
              {trans.title}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '350px', lineHeight: 1.5 }}>
              {trans.selectPrompt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

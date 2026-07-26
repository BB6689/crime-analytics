-- ============================================================================
-- Database Schema: Police FIR System
-- Organization: Karnataka Police Department
-- Confidential - ER Diagram Database Design Document Implementation
-- Target RDBMS: Microsoft SQL Server
-- ============================================================================

-- Create Database if not exists (Uncomment if needed)
-- CREATE DATABASE PoliceFIRSystem;
-- GO
-- USE PoliceFIRSystem;
-- GO

-- ============================================================================
-- 1. STATE TABLE
-- ============================================================================
CREATE TABLE State (
    StateID INT PRIMARY KEY,
    StateName VARCHAR(100) NOT NULL,
    NationalityID INT NULL, -- Nationality reference ID
    Active BIT NOT NULL DEFAULT 1 -- 1 = Active, 0 = Inactive
);

-- ============================================================================
-- 2. DISTRICT TABLE
-- ============================================================================
CREATE TABLE District (
    DistrictID INT PRIMARY KEY,
    DistrictName VARCHAR(100) NOT NULL,
    StateID INT NOT NULL,
    Active BIT NOT NULL DEFAULT 1, -- 1 = Active, 0 = Inactive
    CONSTRAINT FK_District_State FOREIGN KEY (StateID) REFERENCES State(StateID)
);

-- ============================================================================
-- 3. UNITTYPE TABLE
-- ============================================================================
CREATE TABLE UnitType (
    UnitTypeID INT PRIMARY KEY,
    UnitTypeName VARCHAR(100) NOT NULL, -- e.g., Police Station, Circle Office
    CityDistState VARCHAR(100) NULL, -- Operational level: City / District / State
    Hierarchy INT NULL, -- Hierarchy level number (lower = higher authority)
    Active BIT NOT NULL DEFAULT 1 -- 1 = Active, 0 = Inactive
);

-- ============================================================================
-- 4. UNIT TABLE (Police Station or Unit)
-- ============================================================================
CREATE TABLE Unit (
    UnitID INT PRIMARY KEY,
    UnitName VARCHAR(255) NOT NULL,
    TypeID INT NOT NULL, -- e.g. Police Station or Circle Office
    ParentUnit INT NULL, -- Self-reference for unit hierarchy
    NationalityID INT NULL,
    StateID INT NOT NULL,
    DistrictID INT NOT NULL,
    Active BIT NOT NULL DEFAULT 1, -- 1 = Active, 0 = Inactive
    CONSTRAINT FK_Unit_UnitType FOREIGN KEY (TypeID) REFERENCES UnitType(UnitTypeID),
    CONSTRAINT FK_Unit_ParentUnit FOREIGN KEY (ParentUnit) REFERENCES Unit(UnitID),
    CONSTRAINT FK_Unit_State FOREIGN KEY (StateID) REFERENCES State(StateID),
    CONSTRAINT FK_Unit_District FOREIGN KEY (DistrictID) REFERENCES District(DistrictID)
);

-- ============================================================================
-- 5. RANK TABLE
-- ============================================================================
CREATE TABLE Rank (
    RankID INT PRIMARY KEY,
    RankName VARCHAR(100) NOT NULL, -- e.g., Constable, Inspector, DSP
    Hierarchy INT NULL, -- Lower number = higher rank
    Active BIT NOT NULL DEFAULT 1 -- 1 = Active, 0 = Inactive
);

-- ============================================================================
-- 6. DESIGNATION TABLE
-- ============================================================================
CREATE TABLE Designation (
    DesignationID INT PRIMARY KEY,
    DesignationName VARCHAR(100) NOT NULL, -- e.g., Investigating Officer, SHO
    Active BIT NOT NULL DEFAULT 1, -- 1 = Active, 0 = Inactive
    SortOrder INT NULL -- Display sort order for dropdowns/reports
);

-- ============================================================================
-- 7. EMPLOYEE TABLE (Police Personnel)
-- ============================================================================
CREATE TABLE Employee (
    EmployeeID INT PRIMARY KEY,
    DistrictID INT NOT NULL, -- District currently posted in
    UnitID INT NOT NULL, -- Unit/Police Station assigned to
    RankID INT NOT NULL, -- Current rank
    DesignationID INT NOT NULL, -- Current designation
    KGID VARCHAR(50) NOT NULL UNIQUE, -- Karnataka Government ID (unique)
    FirstName VARCHAR(100) NOT NULL,
    EmployeeDOB DATE NULL,
    GenderID INT NULL, -- Lookup value
    BloodGroupID INT NULL, -- Lookup value
    PhysicallyChallenged BIT NOT NULL DEFAULT 0, -- 1 = Yes, 0 = No
    AppointmentDate DATE NULL, -- Date of appointment to government service
    CONSTRAINT FK_Employee_District FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    CONSTRAINT FK_Employee_Unit FOREIGN KEY (UnitID) REFERENCES Unit(UnitID),
    CONSTRAINT FK_Employee_Rank FOREIGN KEY (RankID) REFERENCES Rank(RankID),
    CONSTRAINT FK_Employee_Designation FOREIGN KEY (DesignationID) REFERENCES Designation(DesignationID)
);

-- ============================================================================
-- 8. COURT TABLE
-- ============================================================================
CREATE TABLE Court (
    CourtID INT PRIMARY KEY,
    CourtName VARCHAR(255) NOT NULL,
    DistrictID INT NOT NULL,
    StateID INT NOT NULL,
    Active BIT NOT NULL DEFAULT 1, -- 1 = Active, 0 = Inactive
    CONSTRAINT FK_Court_District FOREIGN KEY (DistrictID) REFERENCES District(DistrictID),
    CONSTRAINT FK_Court_State FOREIGN KEY (StateID) REFERENCES State(StateID)
);

-- ============================================================================
-- 9. CASE CATEGORY TABLE
-- ============================================================================
CREATE TABLE CaseCategory (
    CaseCategoryID INT PRIMARY KEY,
    LookupValue VARCHAR(50) NOT NULL -- e.g., FIR, UDR, Zero FIR, PAR
);

-- ============================================================================
-- 10. GRAVITY OFFENCE TABLE
-- ============================================================================
CREATE TABLE GravityOffence (
    GravityOffenceID INT PRIMARY KEY,
    LookupValue VARCHAR(100) NOT NULL -- e.g., Heinous, Non-Heinous
);

-- ============================================================================
-- 11. CRIME HEAD TABLE (Major Classification)
-- ============================================================================
CREATE TABLE CrimeHead (
    CrimeHeadID INT PRIMARY KEY,
    CrimeGroupName VARCHAR(255) NOT NULL, -- e.g., Crimes Against Body
    Active BIT NOT NULL DEFAULT 1 -- 1 = Active, 0 = Inactive
);

-- ============================================================================
-- 12. CRIME SUB HEAD TABLE (Minor Classification)
-- ============================================================================
CREATE TABLE CrimeSubHead (
    CrimeSubHeadID INT PRIMARY KEY,
    CrimeHeadID INT NOT NULL, -- Parent major crime head
    CrimeHeadName VARCHAR(255) NOT NULL, -- Name of the crime sub-head (e.g., Murder, Robbery)
    SeqID INT NULL, -- Sort sequence number for sub-heads
    CONSTRAINT FK_CrimeSubHead_CrimeHead FOREIGN KEY (CrimeHeadID) REFERENCES CrimeHead(CrimeHeadID)
);

-- ============================================================================
-- 13. CASE STATUS MASTER TABLE
-- ============================================================================
CREATE TABLE CaseStatusMaster (
    CaseStatusID INT PRIMARY KEY,
    CaseStatusName VARCHAR(100) NOT NULL -- e.g. Under Investigation, Charge Sheeted, Closed
);

-- ============================================================================
-- 14. CASTE MASTER TABLE
-- ============================================================================
CREATE TABLE CasteMaster (
    caste_master_id INT PRIMARY KEY,
    caste_master_name VARCHAR(255) NOT NULL
);

-- ============================================================================
-- 15. RELIGION MASTER TABLE
-- ============================================================================
CREATE TABLE ReligionMaster (
    ReligionID INT PRIMARY KEY,
    ReligionName VARCHAR(100) NOT NULL -- e.g., Hindu, Muslim, Christian
);

-- ============================================================================
-- 16. OCCUPATION MASTER TABLE
-- ============================================================================
CREATE TABLE OccupationMaster (
    OccupationID INT PRIMARY KEY,
    OccupationName VARCHAR(255) NOT NULL -- e.g., Farmer, Government Employee
);

-- ============================================================================
-- 17. ACT TABLE (Legal Acts)
-- ============================================================================
CREATE TABLE Act (
    ActCode VARCHAR(50) PRIMARY KEY, -- e.g., IPC, NDPS
    ActDescription VARCHAR(500) NULL, -- Full official description of the act
    ShortName VARCHAR(100) NULL, -- Abbreviated name
    Active BIT NOT NULL DEFAULT 1 -- 1 = Active, 0 = Inactive
);

-- ============================================================================
-- 18. SECTION TABLE (Legal Sections under Acts)
-- ============================================================================
CREATE TABLE Section (
    ActCode VARCHAR(50) NOT NULL, -- Parent Act Code
    SectionCode VARCHAR(50) NOT NULL, -- Section number (e.g., 302, 307)
    SectionDescription VARCHAR(500) NULL,
    Active BIT NOT NULL DEFAULT 1, -- 1 = Active, 0 = Inactive
    PRIMARY KEY (ActCode, SectionCode),
    CONSTRAINT FK_Section_Act FOREIGN KEY (ActCode) REFERENCES Act(ActCode)
);

-- ============================================================================
-- 19. CRIME HEAD ACT SECTION TABLE (Junction Table)
-- ============================================================================
CREATE TABLE CrimeHeadActSection (
    CrimeHeadID INT NOT NULL,
    ActCode VARCHAR(50) NOT NULL,
    SectionCode VARCHAR(50) NOT NULL,
    PRIMARY KEY (CrimeHeadID, ActCode, SectionCode),
    CONSTRAINT FK_CrimeHeadActSection_CrimeHead FOREIGN KEY (CrimeHeadID) REFERENCES CrimeHead(CrimeHeadID),
    CONSTRAINT FK_CrimeHeadActSection_Section FOREIGN KEY (ActCode, SectionCode) REFERENCES Section(ActCode, SectionCode)
);

-- ============================================================================
-- 20. CASE MASTER TABLE (Core FIR/Case details)
-- ============================================================================
CREATE TABLE CaseMaster (
    CaseMasterID INT PRIMARY KEY,
    
    -- Format: 1 digit Case Category Code + 4 digit District ID + 4 digit Police Station ID (Unit ID) + 4 digit Year + 5 digit Running Serial Number
    -- Examples: 104430006202600001 (18 chars)
    CrimeNo VARCHAR(50) NOT NULL UNIQUE,
    
    -- Format: YYYY + 5-digit running serial number (e.g., 202600001) - Last 9 digits from CrimeNo
    CaseNo VARCHAR(50) NOT NULL UNIQUE,
    
    CrimeRegisteredDate DATE NOT NULL,
    PolicePersonID INT NOT NULL, -- Officer who registered the FIR
    PoliceStationID INT NOT NULL, -- Unit/Station where FIR is registered
    CaseCategoryID INT NOT NULL,
    GravityOffenceID INT NOT NULL,
    CrimeMajorHeadID INT NOT NULL, -- Major crime classification
    CrimeMinorHeadID INT NOT NULL, -- Minor crime sub-head classification
    CaseStatusID INT NOT NULL, -- Current status of the case
    CourtID INT NOT NULL, -- Court where the case is being heard
    
    -- Incident Occurrence Data (Kept here as per Page 2 of Table Definitions)
    IncidentFromDate DATETIME NULL,
    IncidentToDate DATETIME NULL,
    InfoReceivedPSDate DATETIME NULL, -- When police station received info
    latitude DECIMAL(9, 6) NULL,
    longitude DECIMAL(9, 6) NULL,
    BriefFacts NVARCHAR(MAX) NULL, -- Summary of the case
    
    CONSTRAINT FK_CaseMaster_Employee FOREIGN KEY (PolicePersonID) REFERENCES Employee(EmployeeID),
    CONSTRAINT FK_CaseMaster_Unit FOREIGN KEY (PoliceStationID) REFERENCES Unit(UnitID),
    CONSTRAINT FK_CaseMaster_CaseCategory FOREIGN KEY (CaseCategoryID) REFERENCES CaseCategory(CaseCategoryID),
    CONSTRAINT FK_CaseMaster_GravityOffence FOREIGN KEY (GravityOffenceID) REFERENCES GravityOffence(GravityOffenceID),
    CONSTRAINT FK_CaseMaster_CrimeHead FOREIGN KEY (CrimeMajorHeadID) REFERENCES CrimeHead(CrimeHeadID),
    CONSTRAINT FK_CaseMaster_CrimeSubHead FOREIGN KEY (CrimeMinorHeadID) REFERENCES CrimeSubHead(CrimeSubHeadID),
    CONSTRAINT FK_CaseMaster_CaseStatusMaster FOREIGN KEY (CaseStatusID) REFERENCES CaseStatusMaster(CaseStatusID),
    CONSTRAINT FK_CaseMaster_Court FOREIGN KEY (CourtID) REFERENCES Court(CourtID)
);

-- ============================================================================
-- 21. INV_OCCURANCETIME TABLE (One-to-One table for incident time/location details)
-- ============================================================================
CREATE TABLE Inv_OccuranceTime (
    CaseMasterID INT PRIMARY KEY,
    IncidentFromDate DATETIME NULL,
    IncidentToDate DATETIME NULL,
    InfoReceivedPSDate DATETIME NULL,
    latitude DECIMAL(9, 6) NULL,
    longitude DECIMAL(9, 6) NULL,
    CONSTRAINT FK_InvOccuranceTime_CaseMaster FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID)
);

-- ============================================================================
-- 22. COMPLAINANT DETAILS TABLE
-- ============================================================================
CREATE TABLE ComplainantDetails (
    ComplainantID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL,
    ComplainantName VARCHAR(255) NOT NULL,
    AgeYear INT NULL,
    OccupationID INT NOT NULL,
    ReligionID INT NOT NULL,
    CasteID INT NOT NULL,
    GenderID INT NULL, -- Lookup value
    CONSTRAINT FK_ComplainantDetails_CaseMaster FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    CONSTRAINT FK_ComplainantDetails_Occupation FOREIGN KEY (OccupationID) REFERENCES OccupationMaster(OccupationID),
    CONSTRAINT FK_ComplainantDetails_Religion FOREIGN KEY (ReligionID) REFERENCES ReligionMaster(ReligionID),
    CONSTRAINT FK_ComplainantDetails_Caste FOREIGN KEY (CasteID) REFERENCES CasteMaster(caste_master_id)
);

-- ============================================================================
-- 23. ACT SECTION ASSOCIATION TABLE (Junction Table)
-- ============================================================================
CREATE TABLE ActSectionAssociation (
    CaseMasterID INT NOT NULL,
    ActID VARCHAR(50) NOT NULL, -- Maps to Act.ActCode (VARCHAR)
    SectionID VARCHAR(50) NOT NULL, -- Maps to Section.SectionCode (VARCHAR)
    ActOrderID INT NULL, -- Display/print order of the act within the case
    SectionOrderID INT NULL, -- Display/print order of the section under the act
    PRIMARY KEY (CaseMasterID, ActID, SectionID),
    CONSTRAINT FK_ActSectionAssoc_CaseMaster FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    CONSTRAINT FK_ActSectionAssoc_Section FOREIGN KEY (ActID, SectionID) REFERENCES Section(ActCode, SectionCode)
);

-- ============================================================================
-- 24. VICTIM TABLE
-- ============================================================================
CREATE TABLE Victim (
    VictimMasterID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL, -- Case this victim belongs to
    VictimName VARCHAR(255) NOT NULL,
    AgeYear INT NULL,
    GenderID INT NULL, -- Lookup value like m, f, t
    VictimPolice VARCHAR(10) NULL, -- "1" if police, "0" otherwise
    CONSTRAINT FK_Victim_CaseMaster FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID)
);

-- ============================================================================
-- 25. ACCUSED TABLE
-- ============================================================================
CREATE TABLE Accused (
    AccusedMasterID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL, -- Case this accused person is linked to
    AccusedName VARCHAR(255) NOT NULL,
    AgeYear INT NULL,
    GenderID INT NULL, -- Lookup value like M/F/T
    PersonID VARCHAR(50) NULL, -- Accused sorting like A1, A2, A3...
    CONSTRAINT FK_Accused_CaseMaster FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID)
);

-- ============================================================================
-- 26. ARREST SURRENDER TABLE
-- ============================================================================
CREATE TABLE ArrestSurrender (
    ArrestSurrenderID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL, -- Linked FIR/case
    ArrestSurrenderTypeID INT NULL, -- Lookup value: arrest or voluntary surrender
    ArrestSurrenderDate DATE NULL,
    ArrestSurrenderStateId INT NOT NULL,
    ArrestSurrenderDistrictId INT NOT NULL,
    PoliceStationID INT NOT NULL, -- Handling police station unit
    IOID INT NOT NULL, -- Investigating officer who made arrest
    CourtID INT NOT NULL, -- Court before which accused was produced
    AccusedMasterID INT NOT NULL, -- Accused person linked to this event
    IsAccused BIT NOT NULL DEFAULT 0, -- 1 = Primary accused, 0 = No
    IsComplainantAccused BIT NOT NULL DEFAULT 0, -- 1 = Complainant is also accused, 0 = No
    CONSTRAINT FK_ArrestSurrender_CaseMaster FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    CONSTRAINT FK_ArrestSurrender_State FOREIGN KEY (ArrestSurrenderStateId) REFERENCES State(StateID),
    CONSTRAINT FK_ArrestSurrender_District FOREIGN KEY (ArrestSurrenderDistrictId) REFERENCES District(DistrictID),
    CONSTRAINT FK_ArrestSurrender_Unit FOREIGN KEY (PoliceStationID) REFERENCES Unit(UnitID),
    CONSTRAINT FK_ArrestSurrender_IO FOREIGN KEY (IOID) REFERENCES Employee(EmployeeID),
    CONSTRAINT FK_ArrestSurrender_Court FOREIGN KEY (CourtID) REFERENCES Court(CourtID),
    CONSTRAINT FK_ArrestSurrender_Accused FOREIGN KEY (AccusedMasterID) REFERENCES Accused(AccusedMasterID)
);

-- ============================================================================
-- 27. INV_ARRESTSURRENDERACCUSED TABLE (Junction Table)
-- ============================================================================
CREATE TABLE inv_arrestsurrenderaccused (
    ArrestSurrenderID INT NOT NULL,
    AccusedMasterID INT NOT NULL,
    PRIMARY KEY (ArrestSurrenderID, AccusedMasterID),
    CONSTRAINT FK_Junction_ArrestSurrender FOREIGN KEY (ArrestSurrenderID) REFERENCES ArrestSurrender(ArrestSurrenderID),
    CONSTRAINT FK_Junction_Accused FOREIGN KEY (AccusedMasterID) REFERENCES Accused(AccusedMasterID)
);

-- ============================================================================
-- 28. CHARGESHEET DETAILS TABLE
-- ============================================================================
CREATE TABLE ChargesheetDetails (
    CSID INT PRIMARY KEY,
    CaseMasterID INT NOT NULL, -- Linked FIR/case
    csdate DATETIME NOT NULL,
    cstype CHAR(1) NOT NULL, -- Final report type: A -> Chargesheet, B -> False Case, C -> Undetected
    PolicePersonID INT NOT NULL, -- Employee ID of officer
    CONSTRAINT FK_Chargesheet_CaseMaster FOREIGN KEY (CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
    CONSTRAINT FK_Chargesheet_Employee FOREIGN KEY (PolicePersonID) REFERENCES Employee(EmployeeID)
);

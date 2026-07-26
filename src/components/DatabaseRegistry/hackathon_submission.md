# Complete Hackathon Submission — All 16 Slides

> **Ready-to-Copy Content for PowerPoint Template (Slide 1 to 16)**
> **Live Catalyst Link:** https://project-rainfall-60074429407.development.catalystserverless.in/app/index.html
> **GitHub Repository:** https://github.com/BB6689/crime-analytics

---

## 📄 Slide 1: Team Details

* **Team Name**: Code & Clues
* **Team Leader Name**: Bhavajna & Balaji
* **Team Size**: 2
* **Problem Statement**: **AI-Driven Crime Analytics & Visualization Platform** — Enabling Karnataka State Police (KSP) to transition from static relational queries to an integrated AI intelligence hub featuring digital FIR registration, force-directed criminal network graphs, predictive offender profiling, geospatial heatmaps, and live chargesheet filing.

---

## 📄 Slide 2: Brief About the Solution

* **Full-Stack Cloud-Native Intelligence Platform**: Built specifically for Karnataka State Police to unify crime data, offender profiling, and investigative analytics in a single portal.
* **100% Relational Schema Fidelity**: Directly models KSP’s complete 28-table database schema (`CaseMaster`, `Accused`, `Victim`, `ArrestSurrender`, `ChargesheetDetails`, `Employee`, `Unit`, etc.).
* **Key Core Capabilities**:
  * Digital 7-step FIR registration with automated CrimeNo format generation.
  * Live D3 force-directed criminal network mapping connecting suspects, co-accused, and gang nexuses.
  * AI-powered offender risk scoring, recidivism forecasting, and rehabilitation scenario simulator.
  * In-portal Final Report (Chargesheet A/B/C) filing with automatic case status updates.
  * Interactive Leaflet geospatial map rendering FIR locations across Karnataka precinct limits.
  * SCRB Statistical Dashboard providing 12+ real-time decision-support charts.
  * Integrated Zoho Zia AI for facial recognition and OCR document extraction.
* **Deployment**: Deployed serverlessly on Zoho Catalyst (Advanced I/O Functions + Datastore + Static Client).

---

## 📄 Slide 3: Opportunities

### 🔹 How Different Is It From Existing Ideas?

* **Preserves 100% KSP Data Assets**: Unlike generic dashboards, our platform retains KSP's 28-table relational architecture while adding an AI and graph layer on top.
* **Force-Directed Network Analysis**: Converts static database rows into dynamic multi-hop visual graphs showing hidden relationships between accused, victims, and gang networks across districts.
* **Predictive Offender Profiling**: Replaces manual history checks with AI threat indices, recidivism probabilities, and an interactive "What-If" rehabilitation simulator.
* **Closed-Loop Case Lifecycle**: Connects FIR registration directly to Final Report filing (Chargesheet A/B/C), ensuring real-time status updates in `CaseMaster`.
* **Zero Infrastructure Overhead**: Built natively on Zoho Catalyst serverless stack, eliminating on-premise hardware maintenance.

### 🔹 How Will It Solve the Problem?

* **Surfaces Multi-District Criminal Networks**: Automatically links recurring accused persons across different police stations into suspect nodes, exposing gang hierarchies without manual cross-referencing.
* **Provides Instant SCRB Intelligence**: Gives state-level leadership real-time visibility into heinous crime trends, top IPC/SLL sections, complainant demographics, and station caseloads.
* **Streamlines Station Intake**: Augments officers with Zoho Zia AI face matching and automated OCR document extraction for faster FIR filing.
* **Closes Case Tracking Gaps**: Ensures every FIR is tracked seamlessly from initial registration to chargesheet filing and court closure.

### 🔹 USP of the Proposed Solution

> **"Maximizing the value of KSP's 28-table data assets through serverless AI, graph network analysis, and end-to-end case lifecycle intelligence — deployed natively on Zoho Catalyst."**

---

## 📄 Slide 4: List of Features Offered by the Solution

1. **Structured FIR Registration System**: 7-step wizard capturing case metadata, timeline, complainant, victims, multi-accused, legal sections (`ActSectionAssociation`), and instant arrest recording (`ArrestSurrender`).
2. **Interactive Case Register & Dossier**: Searchable directory of all FIRs with status filter, gravity badges, and expandable dossiers.
3. **In-Portal Final Report (Chargesheet) Filing**: Enables officers to file Form A (Chargesheet), Form B (False Case), or Form C (Undetected) directly from the dossier, auto-updating `CaseMaster.CaseStatusID`.
4. **Criminal Link Network Graph**: Interactive D3 force simulation mapping relationships between suspects, co-accused, incident nodes, and gang affiliations.
5. **Offender Threat Profiler**: Per-suspect risk score, recidivism risk rating, gang affiliation, case timeline, and interactive simulator (adjusting employment, substance abuse, housing, supervision).
6. **Geospatial Intelligence Map**: Real-time Leaflet map displaying crime pins across Karnataka police precincts with filtering by crime head, gravity, and status.
7. **SCRB Statistical Dashboard**: 12+ analytical charts (monthly trends, heinous ratio, top legal sections, victim/accused age & gender demographics, officer caseloads).
8. **Live Database Registry Explorer**: Interactive browser for all 28 tables displaying row counts, PK/FK relationship badges, schema details, and live row data.
9. **Precinct Directory**: Hierarchical command structure (SP Office → Circle → Police Station) based on self-referencing unit trees (`Unit.ParentUnit`).
10. **AI Scanner Desk**: Integrated Zoho Zia AI for facial recognition scanning and automated FIR document field extraction (OCR).
11. **Bilingual Support**: Complete English, Kannada (ಕನ್ನಡ), and Hindi UI localization.
12. **Role-Based Officer Login**: KGID officer authentication with a demo mode for evaluators.

---

## 📄 Slide 5: Process Flow Diagram / Use-Case Diagram

```
                    ┌──────────────────────────────────────┐
                    │       KSP Officer (Authenticated)    │
                    └─────────────────┬────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
   ┌─────────────────┐    ┌─────────────────────┐   ┌─────────────────┐
   │  FIR Registration│   │   Case Investigation │   │ SCRB Intelligence│
   │  (7-step form)  │   │   (Case Register)    │   │   Dashboard     │
   └────────┬────────┘   └──────────┬──────────┘   └────────┬────────┘
            │                       │                        │
            ▼                       ▼                        ▼
   ┌─────────────────┐    ┌─────────────────────┐   ┌─────────────────┐
   │  CaseMaster +   │   │  File Chargesheet    │   │  Analytics API  │
   │  8 child tables │   │  (A / B / C)         │   │  (28 tables)    │
   └────────┬────────┘   └──────────┬──────────┘   └────────┬────────┘
            │                       │                        │
            └───────────────────────▼────────────────────────┘
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
              ▼                     ▼                      ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │  Criminal Network│  │  Geospatial Map  │  │  Offender        │
   │  Graph (D3.js)   │  │  (Leaflet)       │  │  Risk Profiler   │
   └──────────────────┘  └──────────────────┘  └──────────────────┘
```

* **Data Lifecycle**: `Officer Entry → API Gateway → Catalyst Datastore (ZCQL) → Live Refresh across Map, Graph, Dashboard & Dossier`.

---

## 📄 Slide 6: Wireframes / Mock Diagrams

*(Insert Screenshots from Live Portal)*
* **Mockup 1**: Officer Login & Authentication Gateway.
* **Mockup 2**: 7-Step Digital FIR Registration Wizard.
* **Mockup 3**: Interactive Criminal Network Force-Directed Graph.
* **Mockup 4**: Case Dossier with "File Chargesheet" Interactive Panel.
* **Mockup 5**: SCRB Statistical Dashboard & Analytics Tiles.
* **Mockup 6**: Live 28-Table Database Registry Explorer.

---

## 📄 Slide 7: Architecture Diagram

* **Client Layer**: React 18 + Vite SPA hosted on **Catalyst Static Web Hosting**.
* **API Layer**: Express.js serverless REST API running on **Catalyst Advanced I/O Function** (`police_fir_api`).
* **Database Layer**: **Catalyst Datastore (ZCQL)** managing all 28 relational tables (`CaseMaster`, `Accused`, `Victim`, `ArrestSurrender`, `ChargesheetDetails`, etc.).
* **AI Layer**: **Zoho Zia AI Services** providing facial recognition matching & OCR document extraction.
* **Deployment Pipeline**: Single-command CI/CD via Catalyst CLI (`catalyst deploy`).

---

## 📄 Slide 8: Technologies Used

* **Frontend**: React 18, Vite, Custom Vanilla CSS (Dark Glassmorphism).
* **Data Visualization**: D3.js (Force-Directed Graph), Recharts (SCRB Charts), Leaflet.js (Geospatial Map).
* **Backend**: Node.js 18, Express.js, Catalyst Advanced I/O Functions.
* **Database**: Catalyst Datastore (ZCQL) for production, SQLite (node:sqlite) for local offline dev.
* **AI & Security**: Zoho Zia AI (Face & OCR), Catalyst Authentication (KGID Officer Login).
* **Cloud Platform**: Zoho Catalyst Serverless Suite.

---

## 📄 Slide 9: List of Catalyst Services Being Used

1. **Catalyst Datastore**: Primary database storing all 28 relational tables using ZCQL queries.
2. **Catalyst Advanced I/O Functions**: Serverless Node.js API hosting all application logic and endpoints.
3. **Catalyst Web Client Hosting**: High-speed static hosting for the React/Vite web application.
4. **Zoho Zia — Face Recognition**: Biometric face matching at the AI Scanner Desk.
5. **Zoho Zia — Document Extraction**: Automated OCR field extraction from uploaded FIR documents.
6. **Catalyst Authentication**: Secure officer login with KGID credential verification.
7. **Catalyst CLI**: Automated single-command deployment pipeline (`catalyst deploy`).

---

## 📄 Slide 10: Estimated Implementation Cost

* **Hackathon & Pilot Phase**: **₹0 / Month** (Fully covered under Catalyst Free Tier — up to 125,000 Datastore rows, 100,000 function calls, 1GB hosting).
* **District-Level Production Scale**: **~₹2,500 – ₹5,000 / Month** (Covers 10+ stations, 1,000+ officers, 50,000+ annual FIRs).
* **State-Wide Full KSP Rollout**: **~₹15,000 – ₹30,000 / Month** (High-availability serverless deployment with state-wide auto-scaling).

---

## 📄 Slide 11: Snapshots of the Prototype

*(Place high-res screenshots from the live application link)*
* **Snapshot 1**: Login Screen with Official KSP Emblem.
* **Snapshot 2**: FIR Registration Form with Auto-Generated CrimeNo.
* **Snapshot 3**: Criminal Link Force-Directed Graph & Suspect Inspector.
* **Snapshot 4**: Geospatial Intelligence Map with Precinct Markers.
* **Snapshot 5**: Offender Risk Profiler & Rehabilitation Simulator.
* **Snapshot 6**: Database Registry showing live ZCQL tables & FK badges.

---

## 📄 Slide 12: Prototype Performance Report / Benchmarking

* **Frontend Build Size**: **1.26 MB** (342 KB gzipped) via Vite minification.
* **API Case Fetch Latency**: **< 800 ms** (Catalyst Datastore ZCQL with multi-table joins).
* **Analytics Aggregation Latency**: **< 1.2 s** (17 parallel ZCQL aggregation queries).
* **FIR Filing & DB Write Latency**: **< 600 ms** (Atomic writes across 8 relational tables).
* **Chargesheet Status Update Latency**: **< 400 ms** (`ChargesheetDetails` insert + `CaseMaster` status transition).
* **Schema Integrity**: **28 / 28 Tables** fully modeled with **100% Foreign Key relationship fidelity**.
* **Zero Build Errors**: Clean compilation verified across all 559 modules.

---

## 📄 Slide 13: Project Links

* **GitHub Public Repository**: https://github.com/BB6689/crime-analytics
* **Demo Video Link (3 Minutes)**: *(Insert your Google Drive / YouTube link)*
* **Live Deployed Solution**: https://project-rainfall-60074429407.development.catalystserverless.in/app/index.html

---

## 📄 Slide 14: Additional Details / Future Development

1. **Predictive Crime Hotspot ML**: Train spatial-temporal models on historical coordinates to forecast high-risk crime zones per district.
2. **Witness Management Module**: Add `WitnessDetails` table linked to `CaseMaster` with court summons tracking.
3. **Automated Chargesheet PDF Generator**: Export formatted Form A/B/C final report PDFs directly from `ChargesheetDetails`.
4. **Mobile Officer PWA**: Lightweight offline-first mobile app for field officers to capture crime scene data.
5. **State-Wide Webhooks**: Automated push notifications to State Crime Records Bureau (SCRB) central servers.

---

## 📄 Slide 15: Blank Slide

*(Kept intentionally blank as per template specification)*

---

## 📄 Slide 16: End of Presentation

*(No text content — template closing slide)*

# 🛡️ Karnataka State Police (KSP) — AI-Driven Crime Analytics & Visualization Platform

> **Official Datathon / Hackathon Solution**  
> **Live Catalyst Deployment:** [https://project-rainfall-60074429407.development.catalystserverless.in/app/index.html](https://project-rainfall-60074429407.development.catalystserverless.in/app/index.html)

---

## 📌 Executive Summary

The **KSP Crime Analytics & Intelligence Portal** is a full-stack, cloud-native web application built for the Karnataka State Police (KSP) to transition from manual, Excel-based record keeping to an integrated, AI-powered intelligence ecosystem. 

The platform connects **28 relational database tables** (`db.md` schema) into a real-time intelligence hub featuring digital FIR registration, force-directed criminal network analysis, geospatial crime heatmaps, AI offender risk profiling, and live chargesheet filing.

---

## 🚨 Problem Statement Addressed

* **Data Silos & Manual Records**: Independent records managed in offline spreadsheets hinder state-wide visibility.
* **Lack of Network Analytics**: Hidden relationships between co-accused, gangs, and incidents across districts go unnoticed.
* **Delayed Lifecycle Tracking**: Chargesheets and arrest records are disconnected from core case registers.

---

## ✨ Key Features & Functionalities

1. **Digital FIR Registration System**: 7-step structured registration flow generating standardized `CrimeNo` formats. Supports multi-accused, multi-victim, legal section invocation (`ActSectionAssociation`), and instant arrest/surrender recording (`ArrestSurrender`).
2. **Interactive Case Register & Dossier**: Complete searchable directory of all registered FIRs with status filter, gravity tags, and case dossiers.
3. **In-Portal Final Report / Chargesheet Filing**: Officers file Final Reports (**A** - Chargesheet, **B** - False Case, **C** - Undetected/Referred) directly in the dossier, auto-transitioning `CaseMaster.CaseStatusID`.
4. **Force-Directed Criminal Network Graph**: Live D3-powered graph mapping relationships between suspects, co-accused, gang affiliations, victims, and incident nodes.
5. **AI Offender Risk Profiler**: Dynamic risk index calculation, recidivism probability forecasting, and interactive "What-If" rehabilitation scenario simulator.
6. **Geospatial Intelligence Map**: Real-time Leaflet map rendering crime markers across all Karnataka police stations with filtering by crime head, gravity, and status.
7. **SCRB Statistical Dashboard**: 12+ real-time analytical charts covering monthly crime trends, crime head distribution, top legal sections, victim/accused demographics, and officer performance.
8. **Live Database Registry Explorer**: Interactive browser for all 28 database tables with foreign key relationship badges, schema breakdown, and live row-level data grids.
9. **Precinct Command Directory**: Hierarchical directory of all police stations, circles, and commissionerates based on self-referencing unit trees (`Unit.ParentUnit`).
10. **AI Scanner Desk**: Integrated Zoho Zia AI for facial recognition scanning and document field extraction (OCR).
11. **Bilingual UI**: Complete English, Kannada (ಕನ್ನಡ), and Hindi language support.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + Vite |
| **Styling** | Custom Vanilla CSS Design System (Dark Glassmorphism) |
| **Network Visualization** | D3.js (Force Simulation) |
| **Geospatial Mapping** | Leaflet.js + OpenStreetMap |
| **Analytics Charts** | Recharts |
| **Backend Runtime** | Node.js 18 (Serverless Express on Catalyst Advanced I/O) |
| **Database** | Zoho Catalyst Datastore (ZCQL) / SQLite (Local Dev) |
| **AI Integration** | Zoho Zia AI (Face Recognition & OCR Document Extraction) |
| **Hosting & Cloud** | Zoho Catalyst Platform |

---

## 🗄️ Relational Database Architecture (28 Tables)

The application fully implements the official KSP relational schema:

* **Core Entities**: `CaseMaster`, `ComplainantDetails`, `Victim`, `Accused`, `Inv_OccuranceTime`, `ArrestSurrender`, `inv_arrestsurrenderaccused`, `ChargesheetDetails`
* **Administrative Hierarchy**: `State`, `District`, `UnitType`, `Unit`, `Rank`, `Designation`, `Employee`, `Court`
* **Legal & Categorization**: `CaseCategory`, `GravityOffence`, `CrimeHead`, `CrimeSubHead`, `CaseStatusMaster`, `Act`, `Section`, `CrimeHeadActSection`, `ActSectionAssociation`
* **Demographics**: `CasteMaster`, `ReligionMaster`, `OccupationMaster`

---

## 🚀 Local Setup & Installation

### Prerequisites
* Node.js (v18 or higher)
* npm (v9 or higher)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/crime-analytics.git
cd crime-analytics
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start local development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ☁️ Deployment on Zoho Catalyst

This application is configured for single-command deployment via Zoho Catalyst CLI:

```bash
# Login to Zoho Catalyst
catalyst login

# Build & deploy frontend and serverless function
npm run build
catalyst deploy
```

**Live Deployment URL:**  
[https://project-rainfall-60074429407.development.catalystserverless.in/app/index.html](https://project-rainfall-60074429407.development.catalystserverless.in/app/index.html)

---

## 📜 License
Developed for the **Karnataka State Police Hackathon / Datathon 2026**.

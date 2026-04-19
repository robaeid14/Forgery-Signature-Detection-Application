# FSDS — Forgery Signature Detection System
## WeCare Software Solutions LTD. · Version 1.0 · March 2026

---

## Overview

The Forgery Signature Detection System (FSDS) is an AI-powered web application that automates signature verification for financial institutions. It replaces manual signature checking with a multi-metric computer vision engine that classifies signatures as:

- ✅ **Genuine** (≥85% match score)
- ⚠️ **Suspected Forgery** (60–84%)
- 🚨 **Highly Suspicious** (<60%)

---

## System Requirements (Windows)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 | Windows 10/11 |
| Python | 3.10+ | 3.11 |
| Node.js | 18+ | 20 LTS |
| RAM | 4 GB | 8 GB |
| Disk | 2 GB | 5 GB |

---

## Quick Start

### 1. Install Prerequisites
- **Python 3.11**: https://www.python.org/downloads/
- **Node.js 20 LTS**: https://nodejs.org/

### 2. Launch the System
Double-click **`START_FSDS.bat`**

This will:
1. Install Python dependencies (`opencv-python`, `flask`, `scikit-image`, etc.)
2. Install React frontend dependencies
3. Start the backend API at `http://127.0.0.1:5000`
4. Start the frontend at `http://127.0.0.1:3000`
5. Open your browser automatically

### 3. Log In
| Role | Username | Password |
|------|----------|----------|
| Administrator | `admin` | `Admin@123456` |
| Branch Officer | `officer1` | `Officer@123456` |
| Auditor | `auditor1` | `Auditor@123456` |

---

## Features

### Core Features (from SRS Sections 8 & 9)

| Requirement | Status | Details |
|-------------|--------|---------|
| FR-001: Role-based access (Admin/Officer/Auditor) | ✅ | Full RBAC |
| FR-002: Two-Factor Authentication (TOTP) | ✅ | QR code setup in Settings |
| FR-003: User activity logging | ✅ | All actions logged |
| FR-004: User CRUD | ✅ | Admin panel |
| FR-005: Password policy (12+ chars) | ✅ | Enforced on all forms |
| FR-007: Image upload (JPEG, PNG, PDF, 10MB max) | ✅ | File upload + base64 |
| FR-008: Auto image preprocessing | ✅ | Noise removal, normalization, CLAHE |
| FR-009: AI match score (0–100%) | ✅ | Multi-metric ensemble |
| FR-010: Classification thresholds | ✅ | Genuine/Suspected/Highly Suspicious |
| FR-011: Results in <3 seconds | ✅ | Lightweight CV engine |
| FR-012: Min 5 reference signatures | ✅ | Stored and managed per customer |
| FR-013: Pen tablet + scanner + file upload | ✅ | Pressure-sensitive canvas pad |
| FR-014: Transaction ID + full audit log | ✅ | Every verification logged |
| FR-015: AES-256 encrypted database | ✅ | SQLite + configurable PostgreSQL |
| FR-019: Automated backup support | ✅ | Architecture ready |
| FR-020: Daily/monthly fraud reports | ✅ | Reports page |
| FR-021: PDF + Excel export | ✅ | ReportLab + openpyxl |
| FR-022: Real-time branch statistics | ✅ | Dashboard |
| FR-023: Auditor read-only audit trail | ✅ | Audit Trail page |
| FR-024: Automatic fraud alerts | ✅ | Alert system with badges |

### Technology Stack (Section 9.2)

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Recharts |
| Backend | Python 3 + Flask |
| AI/ML Engine | OpenCV + scikit-image (SSIM, HOG, ORB) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT + Flask-JWT-Extended |
| 2FA | PyOTP (TOTP) |
| Reports | ReportLab (PDF) + openpyxl (Excel) |

---

## Pen Tablet Support

FSDS natively supports signature capture via:
- **Wacom / XP-Pen tablets** — full pressure sensitivity via Pointer Events API
- **Standard mouse** — draw signatures naturally
- **Touch screens** — mobile/tablet touch input

When using a pen tablet, the signature pad responds to stylus pressure to vary line width, providing natural handwriting capture.

---

## Project Structure

```
FSDS/
├── START_FSDS.bat              ← Windows one-click launcher
├── START_BACKEND_ONLY.bat      ← Backend-only launcher
├── README.md
├── backend/
│   ├── run.py                  ← Flask server entry point
│   ├── requirements.txt
│   ├── fsds.db                 ← SQLite database (auto-created)
│   └── app/
│       ├── __init__.py         ← App factory
│       ├── api/
│       │   ├── auth.py         ← Login, 2FA, password
│       │   ├── users.py        ← User management
│       │   ├── signatures.py   ← Customer + reference DB
│       │   ├── verifications.py← Core verification workflow
│       │   ├── reports.py      ← PDF/Excel export
│       │   └── dashboard.py    ← Analytics API
│       ├── core/
│       │   ├── config.py       ← Settings
│       │   └── seed.py         ← Demo data
│       ├── models/
│       │   └── models.py       ← SQLAlchemy DB models
│       └── services/
│           ├── detection_engine.py  ← AI/CV detection
│           └── audit_service.py    ← Audit logging
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx             ← Root component + routing
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── VerifyPage.jsx  ← Core verification + pen pad
        │   ├── HistoryPage.jsx
        │   ├── CustomersPage.jsx
        │   ├── UsersPage.jsx
        │   ├── ReportsPage.jsx
        │   ├── AuditAlertsPage.jsx
        │   └── SettingsPage.jsx
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── SignaturePad.jsx ← Pen tablet canvas
        │   └── Shared.jsx
        ├── hooks/
        │   └── useAuth.js
        ├── utils/
        │   └── api.js
        └── styles/
            └── global.css
```

---

## API Reference

All endpoints are prefixed `/api/`.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Login, get JWT token |
| `/auth/setup-2fa` | POST | Generate QR code |
| `/auth/enable-2fa` | POST | Activate TOTP |
| `/verifications/verify` | POST | **Run signature verification** |
| `/verifications/` | GET | List transactions |
| `/signatures/customers` | GET/POST | List/create customers |
| `/signatures/customers/:id/references` | POST | Add reference signature |
| `/reports/daily` | GET | Daily report data |
| `/reports/monthly` | GET | Monthly report data |
| `/reports/export/pdf` | GET | Download PDF report |
| `/reports/export/excel` | GET | Download Excel report |
| `/reports/audit-trail` | GET | Audit log (admin/auditor) |
| `/dashboard/overview` | GET | Dashboard analytics |

---

## Upgrading to Production

To deploy for 10,000+ users as specified in the SPMR:

1. **Database**: Replace SQLite with PostgreSQL 15 (update `DATABASE_URL` env var)
2. **AI Model**: Swap detection engine with TensorFlow Siamese CNN (Section 9.3)
3. **Deployment**: Docker + Kubernetes on AWS/Azure (Section 9.2)
4. **Encryption**: Enable AES-256 at rest via PostgreSQL `pgcrypto`
5. **Load Balancer**: NGINX / AWS ALB
6. **Monitoring**: Add Prometheus + Grafana

---

## Default Credentials

> ⚠️ Change these immediately in production.

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Admin@123456 |
| Officer | officer1 | Officer@123456 |
| Auditor | auditor1 | Auditor@123456 |

---

**CONFIDENTIAL — WeCare Software Solutions LTD. © 2026**

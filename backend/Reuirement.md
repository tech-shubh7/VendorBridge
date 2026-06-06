
# VendorBridge — Complete Product Requirements Document

**Procurement & Vendor Management ERP**
Version 2.0 | Simplified DB Edition | Ready to Paste into Dev / Design Handoff

---

## Table of Contents

1. [Product Overview](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#1-product-overview)
2. [Tech Stack](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#2-tech-stack)
3. [Database Architecture — 12 Tables](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#3-database-architecture--12-tables)
4. [Phase 1 — Foundation &amp; Auth](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#phase-1--foundation--auth)
5. [Phase 2 — Dashboard &amp; Core Navigation](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#phase-2--dashboard--core-navigation)
6. [Phase 3 — Vendor Management](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#phase-3--vendor-management)
7. [Phase 4 — RFQ Creation &amp; Management](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#phase-4--rfq-creation--management)
8. [Phase 5 — Quotation Submission &amp; Comparison](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#phase-5--quotation-submission--comparison)
9. [Phase 6 — Approval Workflow](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#phase-6--approval-workflow)
10. [Phase 7 — Purchase Orders &amp; Invoices](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#phase-7--purchase-orders--invoices)
11. [Phase 8 — Activity Logs &amp; Notifications](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#phase-8--activity-logs--notifications)
12. [Phase 9 — Reports &amp; Analytics](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#phase-9--reports--analytics)
13. [Design System &amp; UI Tokens](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#design-system--ui-tokens)
14. [API Contract Summary](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#api-contract-summary)
15. [Role-Permission Matrix](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#role-permission-matrix)
16. [Non-Functional Requirements](https://claude.ai/chat/ffa38ab0-6163-4784-84d9-3dd79056305e#non-functional-requirements)

---

## 1. Product Overview

### Vision

VendorBridge is a centralized Procurement & Vendor Management ERP that digitizes the full procurement lifecycle — from vendor registration through RFQ, quotation comparison, approval, purchase orders, to invoice generation and email delivery.

### Core User Roles

| Role                          | Key Permissions                                                   |
| ----------------------------- | ----------------------------------------------------------------- |
| **Admin**               | Full system access, user management, vendor management, analytics |
| **Procurement Officer** | Create RFQs, compare quotations, generate POs and invoices        |
| **Manager / Approver**  | Approve or reject procurement requests, monitor workflows         |
| **Vendor**              | Submit quotations, track RFQ status, view own POs                 |

### Procurement Lifecycle (Happy Path)

```
RFQ Created → Vendors Notified → Quotations Submitted →
Quotation Comparison → Approval Initiated → Approved →
Purchase Order Generated → Invoice Generated → Invoice Sent/Printed
```

### What Was Simplified (v2.0)

The following were removed to meet deadline without losing core ERP value:

* `vendor_documents`, `rfq_attachments`, `quotation_attachments` — no file attachment tables
* `vendor_categories` table — category is a plain VARCHAR on the vendors table
* `approval_steps` / `approval_workflows` — merged into a single flat `approvals` table
* `po_items`, `invoice_items` — PO and Invoice derive line items from `quotation_items` via JOIN; totals stored denormalized on the PO/Invoice row
* `password_reset_tokens`, `refresh_tokens` — stateless JWT only; forgot-password uses short-lived signed token in the URL, not a DB table
* `number_sequences` table — sequence numbers generated in code via a MAX()+1 query with a prefix

---

## 2. Tech Stack

### Frontend

* **Framework:** React 18 + Vite
* **UI Library:** Shadcn/ui + Tailwind CSS
* **State Management:** Zustand (global) + React Query / TanStack Query (server state)
* **Forms:** React Hook Form + Zod validation
* **PDF (Client):** jsPDF + html2canvas for invoice print/download
* **Charts:** Recharts

### Backend

* **Runtime:** Node.js + Express.js
* **Authentication:** JWT (access token 15 min, stateless — no DB table)
* **ORM:** Sequelize 
* **Email:** Nodemailer + SendGrid (invoice email + forgot-password)
* **PDF (Server):** Puppeteer or @pdfmake/pdfmake for server-side PDF generation

### Database

* **Primary:** PostgreSQL
* **Cache:** Redis (optional — dashboard summary TTL 5 min)

### Infrastructure

* **API:** REST (JSON)
* **Auth:** Role-based JWT middleware
* **Environment:** Docker Compose (dev), Railway / Render (prod)

---

## 3. Database Architecture — 12 Tables

> All tables use UUIDs as primary keys.
> Tables with business records include `created_at` and `updated_at`.
> Core entities include `deleted_at` for soft delete.
> NO attachment tables. NO category lookup table. NO token tables.

---

### Full Schema

```sql
-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'procurement_officer', 'manager', 'vendor');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role          user_role NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ============================================================
-- 2. VENDORS
-- Separate from users. category is plain VARCHAR (no FK table).
-- ============================================================
CREATE TYPE vendor_status AS ENUM ('active', 'inactive', 'blacklisted');

CREATE TABLE vendors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name   VARCHAR(255) NOT NULL,
  category       VARCHAR(100),               -- e.g. IT, Office Supplies, Logistics
  contact_person VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(20),
  gst_number     VARCHAR(15),                -- 15-char GSTIN
  address        TEXT,
  city           VARCHAR(100),
  state          VARCHAR(100),
  status         vendor_status DEFAULT 'active',
  rating         DECIMAL(2,1) DEFAULT 0.0,   -- 0.0 to 5.0
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

-- ============================================================
-- 3. RFQs
-- ============================================================
CREATE TYPE rfq_status AS ENUM ('draft', 'open', 'under_review', 'closed', 'cancelled');

CREATE TABLE rfqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number  VARCHAR(50) UNIQUE NOT NULL,   -- RFQ-2024-0001
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  deadline    TIMESTAMPTZ NOT NULL,
  status      rfq_status DEFAULT 'draft',
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- ============================================================
-- 4. RFQ ITEMS  (one RFQ → many items)
-- ============================================================
CREATE TABLE rfq_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id         UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  item_name      VARCHAR(255) NOT NULL,
  description    TEXT,
  quantity       DECIMAL(10,2) NOT NULL,
  unit           VARCHAR(50),               -- pcs, kg, liter, box
  specifications TEXT,
  sort_order     INT DEFAULT 0
);

-- ============================================================
-- 5. RFQ VENDORS  (many-to-many: which vendors received RFQ)
-- ============================================================
CREATE TABLE rfq_vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id          UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  invited_at      TIMESTAMPTZ DEFAULT NOW(),
  invitation_sent BOOLEAN DEFAULT FALSE,
  UNIQUE (rfq_id, vendor_id)
);

-- ============================================================
-- 6. QUOTATIONS  (vendor response to an RFQ)
-- ============================================================
CREATE TYPE quotation_status AS ENUM ('draft', 'submitted', 'under_review', 'accepted', 'rejected');

CREATE TABLE quotations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number VARCHAR(50) UNIQUE NOT NULL,  -- QT-2024-0001
  rfq_id           UUID NOT NULL REFERENCES rfqs(id),
  vendor_id        UUID NOT NULL REFERENCES vendors(id),
  submitted_by     UUID REFERENCES users(id),
  status           quotation_status DEFAULT 'draft',
  delivery_days    INT,
  payment_terms    TEXT,
  valid_until      DATE,
  notes            TEXT,
  total_amount     DECIMAL(14,2),
  currency         VARCHAR(10) DEFAULT 'INR',
  submitted_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. QUOTATION ITEMS  (line items — source of truth for PO & Invoice)
-- ============================================================
CREATE TABLE quotation_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id  UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  rfq_item_id   UUID REFERENCES rfq_items(id),
  item_name     VARCHAR(255) NOT NULL,
  quantity      DECIMAL(10,2) NOT NULL,
  unit          VARCHAR(50),
  unit_price    DECIMAL(12,2) NOT NULL,
  tax_percent   DECIMAL(5,2) DEFAULT 18.0,
  tax_amount    DECIMAL(12,2),              -- stored computed value
  total_price   DECIMAL(14,2),             -- stored computed value
  delivery_days INT,
  notes         TEXT
);

-- ============================================================
-- 8. APPROVALS  (flat single-row per quotation, one approver)
-- ============================================================
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE approvals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL UNIQUE REFERENCES quotations(id),
  initiated_by UUID NOT NULL REFERENCES users(id),
  approved_by  UUID REFERENCES users(id),
  status       approval_status DEFAULT 'pending',
  remarks      TEXT,
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  acted_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. PURCHASE ORDERS
-- Line items come from quotation_items via JOIN.
-- Totals are stored denormalized for fast reads.
-- ============================================================
CREATE TYPE po_status AS ENUM ('draft', 'sent', 'acknowledged', 'fulfilled', 'cancelled');

CREATE TABLE purchase_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number           VARCHAR(50) UNIQUE NOT NULL,  -- PO-2024-0001
  quotation_id        UUID NOT NULL REFERENCES quotations(id),
  vendor_id           UUID NOT NULL REFERENCES vendors(id),
  status              po_status DEFAULT 'draft',
  delivery_date       DATE,
  payment_terms       TEXT,
  terms_and_conditions TEXT,
  billing_address     TEXT,
  shipping_address    TEXT,
  subtotal            DECIMAL(14,2),
  tax_amount          DECIMAL(14,2),
  total_amount        DECIMAL(14,2),
  currency            VARCHAR(10) DEFAULT 'INR',
  notes               TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. INVOICES
-- Line items come from quotation_items via PO → quotation JOIN.
-- Tax fields stored denormalized.
-- ============================================================
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  VARCHAR(50) UNIQUE NOT NULL,   -- INV-2024-0001
  po_id           UUID NOT NULL REFERENCES purchase_orders(id),
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  status          invoice_status DEFAULT 'draft',
  issue_date      DATE NOT NULL,
  due_date        DATE NOT NULL,
  subtotal        DECIMAL(14,2),
  cgst_amount     DECIMAL(12,2) DEFAULT 0,
  sgst_amount     DECIMAL(12,2) DEFAULT 0,
  igst_amount     DECIMAL(12,2) DEFAULT 0,
  total_amount    DECIMAL(14,2),
  amount_in_words TEXT,
  payment_terms   TEXT,
  notes           TEXT,
  pdf_url         TEXT,
  sent_at         TIMESTAMPTZ,
  sent_to_email   VARCHAR(255),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. ACTIVITY LOGS  (immutable audit trail)
-- ============================================================
CREATE TABLE activity_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  VARCHAR(50) NOT NULL,   -- 'rfq','quotation','approval','po','invoice','vendor'
  entity_id    UUID NOT NULL,
  action       VARCHAR(100) NOT NULL,  -- 'created','submitted','approved','rejected','sent'
  description  TEXT,
  performed_by UUID REFERENCES users(id),
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
  -- NOTE: no updated_at — logs are write-once, never modified
);

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(100) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  entity_type VARCHAR(50),
  entity_id   UUID,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Indexes

```sql
CREATE INDEX idx_vendors_status       ON vendors(status);
CREATE INDEX idx_vendors_category     ON vendors(category);
CREATE INDEX idx_rfqs_status          ON rfqs(status);
CREATE INDEX idx_rfqs_created_by      ON rfqs(created_by);
CREATE INDEX idx_rfq_items_rfq        ON rfq_items(rfq_id);
CREATE INDEX idx_rfq_vendors_rfq      ON rfq_vendors(rfq_id);
CREATE INDEX idx_rfq_vendors_vendor   ON rfq_vendors(vendor_id);
CREATE INDEX idx_quotations_rfq       ON quotations(rfq_id);
CREATE INDEX idx_quotations_vendor    ON quotations(vendor_id);
CREATE INDEX idx_quotations_status    ON quotations(status);
CREATE INDEX idx_quot_items_quotation ON quotation_items(quotation_id);
CREATE INDEX idx_approvals_quotation  ON approvals(quotation_id);
CREATE INDEX idx_approvals_approver   ON approvals(approved_by);
CREATE INDEX idx_po_quotation         ON purchase_orders(quotation_id);
CREATE INDEX idx_po_vendor            ON purchase_orders(vendor_id);
CREATE INDEX idx_po_status            ON purchase_orders(status);
CREATE INDEX idx_invoices_po          ON invoices(po_id);
CREATE INDEX idx_invoices_status      ON invoices(status);
CREATE INDEX idx_activity_entity      ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_performed   ON activity_logs(performed_by);
CREATE INDEX idx_notifications_user   ON notifications(user_id, is_read);
```

---

### Entity Relationship (Text Diagram)

```
users
 ├── creates ──► rfqs
 │                ├── rfq_items      (cascade delete)
 │                └── rfq_vendors ──► vendors
 │
 └── vendors
       └── (invited via rfq_vendors)
             └── submit ──► quotations
                               ├── quotation_items  (source of truth for line items)
                               └── approvals
                                     └── (approved) ──► purchase_orders
                                                             └── invoices

activity_logs  ← written on every significant action across all entities
notifications  ← written to target users on every significant action
```

---

### Document Number Generation (No Sequence Table)

Generate numbers in code using a simple MAX query:

```javascript
// utils/generateNumber.js
async function generateNumber(prefix, model, field) {
  // e.g. prefix='RFQ', model=prisma.rfqs, field='rfq_number'
  const latest = await model.findFirst({
    where: { [field]: { startsWith: prefix } },
    orderBy: { [field]: 'desc' }
  });
  const next = latest
    ? parseInt(latest[field].split('-').pop()) + 1
    : 1;
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`;
  // e.g. RFQ-2024-0001
}
```

Use inside a Prisma transaction to prevent race conditions:

```javascript
await prisma.$transaction(async (tx) => {
  const number = await generateNumber('RFQ', tx.rfqs, 'rfq_number');
  return tx.rfqs.create({ data: { rfq_number: number, ...rest } });
});
```

---

## Phase 1 — Foundation & Auth

### Scope

User signup, login, JWT authentication, role-based middleware, forgot password via email. No token DB tables — stateless JWT only.

---

### 1.1 Design Specifications

**Screen: Login**

Layout: Centered card on full-screen mint background (`#e6fcf5`).

| Element         | Spec                                                           |
| --------------- | -------------------------------------------------------------- |
| Brand           | "VendorBridge" wordmark top-center, green                      |
| Email field     | Full-width, label above, placeholder `you@company.com`       |
| Password field  | Full-width, show/hide toggle                                   |
| Forgot Password | Right-aligned link below password field                        |
| Login Button    | Full-width,`#2f9e44`, height 48px, rounded-md                |
| Sign Up link    | Center-bottom: "Don't have an account? Sign Up"                |
| Error state     | Red inline message below field                                 |
| Card            | max-width 440px, padding 40px, shadow-lg, rounded-xl, white bg |

**Screen: Sign Up**

Fields:

* Full Name (required)
* Email (required, unique)
* Password (required, min 8 chars)
* Confirm Password (required, must match)
* Role (dropdown: Procurement Officer / Manager / Vendor — Admin created separately)
* Company Name (required)

**Screen: Forgot Password**

* Email input
* "Send Reset Link" button
* Success message: "Check your inbox for a reset link"

---

### 1.2 Backend Implementation

**Routes**

```
POST  /api/auth/signup
POST  /api/auth/login
POST  /api/auth/forgot-password
POST  /api/auth/reset-password
GET   /api/auth/me
```

**POST /api/auth/signup**

```json
// Request
{
  "name": "Ravi Patel",
  "email": "ravi@company.com",
  "password": "Secure@123",
  "confirm_password": "Secure@123",
  "role": "procurement_officer",
  "company_name": "ABC Corp"
}

// Response 201
{ "message": "Account created. Please log in." }
```

Validations: email unique, password min 8 chars + 1 uppercase + 1 number, role in allowed enum.
Hash password: `bcrypt.hash(password, 12)`

**POST /api/auth/login**

```json
// Response 200
{
  "accessToken": "eyJ...",  // JWT, expires 15min
  "user": { "id": "uuid", "name": "Ravi", "email": "...", "role": "procurement_officer" }
}
```

On success: update `users.last_login_at = NOW()`

**Forgot Password (Stateless)**

* Generate a signed JWT with `{ userId, purpose: 'reset' }`, expires 1 hour
* Send email with link: `https://app.vendorbridge.com/reset-password?token=<jwt>`
* On reset: verify JWT, check `purpose === 'reset'`, update password hash

**Middleware: `authenticate`**

```javascript
// Attach to all protected routes
const token = req.headers.authorization?.split(' ')[1];
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: payload.sub, role: payload.role };
```

**Middleware: `authorize(...roles)`**

```javascript
if (!roles.includes(req.user.role)) {
  return res.status(403).json({ message: 'Forbidden' });
}
```

---

### 1.3 Acceptance Criteria — Phase 1

* [ ] Signup with valid data creates user and returns 201
* [ ] Duplicate email returns 409
* [ ] Login with correct credentials returns JWT + user object
* [ ] Login with wrong password returns 401
* [ ] Forgot password sends email with working link
* [ ] Reset link expires after 1 hour; reuse returns 401
* [ ] All protected routes return 401 without valid token
* [ ] Wrong role on protected route returns 403
* [ ] `last_login_at` updates on every successful login

---

## Phase 2 — Dashboard & Core Navigation

### Scope

Post-login landing screen with procurement KPIs, recent activity, analytics chart, and the global sidebar shell.

---

### 2.1 Design Specifications

**Global Shell Layout**

```
┌──────────────────────────────────────────────────────────┐
│  SIDEBAR (240px)         │  TOP BAR                      │
│  ─────────────────       │  Search | Notifications | User │
│  Logo: VendorBridge      ├──────────────────────────────  │
│  ─────────────────       │  PAGE CONTENT AREA             │
│  Dashboard               │                                │
│  Vendors                 │                                │
│  RFQs                    │                                │
│  Quotations              │                                │
│  Approvals               │                                │
│  Purchase Orders         │                                │
│  Invoices                │                                │
│  Reports                 │                                │
│  Activity Logs           │                                │
│  ─────────────────       │                                │
│  [Avatar] User Name      │                                │
│  Logout                  │                                │
└──────────────────────────────────────────────────────────┘
```

Sidebar items filtered by role:

* Vendors: hidden from vendor, manager
* RFQs: hidden from vendor (vendor sees only their assigned RFQs via Quotations)
* Approvals: only manager, admin
* Reports: only admin, manager

**Dashboard KPI Cards (4 cards, 2×2 grid)**

| Card              | Value Source                                                         | Color |
| ----------------- | -------------------------------------------------------------------- | ----- |
| Pending Approvals | COUNT approvals WHERE status='pending'                               | Amber |
| Active RFQs       | COUNT rfqs WHERE status='open'                                       | Blue  |
| POs This Month    | COUNT purchase_orders current month                                  | Green |
| Pending Invoices  | COUNT invoices WHERE status IN ('draft','sent') AND due_date < NOW() | Red   |

**Recent Purchase Orders** — table, last 5 rows
Columns: PO Number | Vendor | Date | Total Amount | Status badge

**Recent Invoices** — table, last 5 rows
Columns: Invoice No. | Vendor | Issue Date | Due Date | Amount | Status badge

**Monthly Spend Chart**
Bar chart, last 6 months, data from `purchase_orders.total_amount` grouped by month.

**Quick Action Buttons**

* `+ New RFQ` → /rfqs/create
* `+ New Vendor` → /vendors/create
* `View Pending Approvals` → /approvals?status=pending

---

### 2.2 Backend Implementation

**Routes**

```
GET  /api/dashboard/summary          -- 4 KPI card values
GET  /api/dashboard/recent-pos       -- last 5 POs
GET  /api/dashboard/recent-invoices  -- last 5 invoices
GET  /api/dashboard/monthly-spend    -- last 6 months chart data
```

**GET /api/dashboard/summary** (all roles, values scoped by role)

```json
// Response 200
{
  "pendingApprovals": 4,
  "activeRfqs": 7,
  "monthlyPoCount": 12,
  "pendingInvoices": 3
}
```

Vendor role: returns only data relevant to their own quotations/invoices.

**GET /api/dashboard/monthly-spend**

```json
// Response 200
{
  "data": [
    { "month": "2024-07", "total": 245000 },
    { "month": "2024-08", "total": 312000 },
    { "month": "2024-09", "total": 189000 },
    { "month": "2024-10", "total": 420000 },
    { "month": "2024-11", "total": 375000 },
    { "month": "2024-12", "total": 298000 }
  ]
}
```

SQL:

```sql
SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
       SUM(total_amount) AS total
FROM purchase_orders
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY 1
ORDER BY 1;
```

---

### 2.3 Acceptance Criteria — Phase 2

* [ ] All 4 KPI cards show correct live counts
* [ ] Recent POs and invoices show last 5 records
* [ ] Monthly chart renders correct data for past 6 months
* [ ] Sidebar highlights active route
* [ ] Sidebar nav is filtered by user role
* [ ] Quick action buttons navigate correctly
* [ ] Notification bell shows unread count badge
* [ ] Dashboard loads within 2 seconds

---

## Phase 3 — Vendor Management

### Scope

Full CRUD for vendors. Category is a free-text VARCHAR (no lookup table). No document uploads.

---

### 3.1 Design Specifications

**Screen: Vendor List**

* Header: "Vendors" + `+ Add Vendor` button (right, primary green)
* Search bar: searches company_name, email, gst_number
* Filter chips: All | Active | Inactive | Blacklisted
* Filter dropdown: Category (distinct values from vendors.category)
* Table columns:

| Column         | Notes                      |
| -------------- | -------------------------- |
| Company Name   | Clickable → vendor detail |
| Category       | Plain text                 |
| Contact Person |                            |
| Email          |                            |
| GST No.        |                            |
| Status         | Badge                      |
| Rating         | Stars (0–5)               |
| Actions        | View / Edit / Deactivate   |

* Pagination: 20 per page
* Empty state with illustration

**Screen: Add / Edit Vendor (Slide-over panel or full page)**

| Field          | Type                  | Required | Notes                            |
| -------------- | --------------------- | -------- | -------------------------------- |
| Company Name   | Text                  | Yes      |                                  |
| Category       | Text with suggestions | Yes      | e.g. IT, Logistics               |
| Contact Person | Text                  | Yes      |                                  |
| Email          | Email                 | Yes      | Unique                           |
| Phone          | Tel                   | Yes      |                                  |
| GST Number     | Text                  | No       | Validate GSTIN format            |
| Address        | Textarea              | No       |                                  |
| City           | Text                  | No       |                                  |
| State          | Text                  | No       | Used for CGST/SGST vs IGST logic |
| Status         | Select                | Yes      | active / inactive                |
| Notes          | Textarea              | No       |                                  |

**Screen: Vendor Detail**

* Header: company name, status badge, rating stars
* Info grid: category, GST, contact, email, phone, address
* Tabs:
  * **Overview** — key details
  * **RFQ History** — RFQs this vendor was invited to (from rfq_vendors JOIN rfqs)
  * **Quotations** — all quotations submitted by this vendor
  * **Purchase Orders** — POs where vendor_id matches

---

### 3.2 Backend Implementation

**Routes**

```
GET    /api/vendors               -- list with filters & pagination
GET    /api/vendors/:id           -- vendor detail
POST   /api/vendors               -- create
PUT    /api/vendors/:id           -- update
PATCH  /api/vendors/:id/status    -- change status (active/inactive/blacklisted)
DELETE /api/vendors/:id           -- soft delete (admin only, sets deleted_at)
GET    /api/vendors/categories    -- distinct categories for filter dropdown
GET    /api/vendors/:id/rfqs      -- RFQ history for a vendor
GET    /api/vendors/:id/quotations -- quotations by vendor
GET    /api/vendors/:id/pos       -- POs for vendor
```

**GET /api/vendors** — Query params: `page`, `limit`, `search`, `status`, `category`

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "company_name": "Dell India",
      "category": "IT Hardware",
      "contact_person": "Suresh Kumar",
      "email": "suresh@dell.com",
      "gst_number": "29AABCD1234E1Z5",
      "status": "active",
      "rating": 4.2
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

**GET /api/vendors/categories** — Returns distinct category values:

```sql
SELECT DISTINCT category FROM vendors
WHERE deleted_at IS NULL AND category IS NOT NULL
ORDER BY category;
```

**POST /api/vendors** — Authorization: admin, procurement_officer

Validations:

* Email unique within vendors table
* GST format if provided: `/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/`
* Soft-deleted vendors with same email can be recreated (check `deleted_at IS NULL`)

On create: log to `activity_logs` (entity_type='vendor', action='created')

**DELETE /api/vendors/:id** — Sets `deleted_at = NOW()`. All queries filter `WHERE deleted_at IS NULL`.

**Vendor Rating Update** — Recalculate after each PO is marked fulfilled:

```sql
UPDATE vendors SET rating = (
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE status = 'accepted')::DECIMAL /
     NULLIF(COUNT(*), 0)) * 5, 1
  )
  FROM quotations WHERE vendor_id = $1
) WHERE id = $1;
```

---

### 3.3 Acceptance Criteria — Phase 3

* [ ] Vendor list loads with pagination, default 20 per page
* [ ] Search works across company_name, email, gst_number
* [ ] Status filter works; category filter populates from real distinct values
* [ ] Soft-deleted vendors do not appear in list or dropdowns
* [ ] Add vendor form validates GST format
* [ ] Category field shows suggestions from existing vendor categories
* [ ] Vendor detail page shows all 4 tabs with correct data
* [ ] Rating displays correctly and updates after PO fulfillment
* [ ] Only admin can hard/soft delete; procurement_officer can create and edit

---

## Phase 4 — RFQ Creation & Management

### Scope

Create RFQs with line items, assign vendors, publish and notify. No file attachments.

---

### 4.1 Design Specifications

**Screen: RFQ List**

* Header: "RFQs" + `+ Create RFQ` button
* Status tabs: All | Draft | Open | Under Review | Closed | Cancelled
* Search: by title or rfq_number
* Table:

| Column              | Notes                                                     |
| ------------------- | --------------------------------------------------------- |
| RFQ No.             | e.g. RFQ-2024-0001                                        |
| Title               |                                                           |
| Status              | Badge                                                     |
| Vendors Invited     | COUNT from rfq_vendors                                    |
| Deadline            | Date + countdown (e.g. "3 days left" in amber if <7 days) |
| Quotations Received | COUNT from quotations WHERE status != 'draft'             |
| Actions             | View / Edit (draft only) / Close                          |

**Screen: Create RFQ — 4-Step Wizard**

**Step 1 — Basic Details**

* RFQ Title (required)
* Description / Scope (textarea)
* Deadline (date-time picker, must be future)

**Step 2 — Line Items**

* Dynamic table, `+ Add Item` button
* Per row: Item Name | Description | Quantity | Unit | Specifications | Remove (trash)
* Minimum 1 item required

**Step 3 — Assign Vendors**

* Searchable multi-select from vendors WHERE status='active'
* Shows: company name, category, rating stars
* Minimum 1 vendor required

**Step 4 — Review & Submit**

* Summary of all data entered
* Two buttons: `Save as Draft` | `Publish RFQ`
* Publishing sends notifications to vendors

**Screen: RFQ Detail**

* Header: RFQ number, title, status badge, deadline pill
* Info bar: Created by, Created date, Vendors assigned count
* Tabs:
  * **Details** — description, deadline
  * **Line Items** — table of rfq_items
  * **Vendors** — list of assigned vendors with invitation status
  * **Quotations** — all quotations received, with status badges and "Compare" button
  * **Activity Log** — filtered activity_logs for this entity_id

---

### 4.2 Backend Implementation

**Routes**

```
GET    /api/rfqs                      -- list with filters & pagination
GET    /api/rfqs/:id                  -- detail with items, vendors, quotation count
POST   /api/rfqs                      -- create (saves as draft)
PUT    /api/rfqs/:id                  -- update (only if status=draft)
PATCH  /api/rfqs/:id/publish          -- publish → notify vendors
PATCH  /api/rfqs/:id/close            -- close RFQ
DELETE /api/rfqs/:id                  -- soft delete (draft only, admin)
```

**POST /api/rfqs** — Authorization: procurement_officer, admin

```json
// Request
{
  "title": "Office Supplies Q4 2024",
  "description": "Procurement of office stationery",
  "deadline": "2024-12-15T18:00:00Z",
  "items": [
    { "item_name": "A4 Paper", "quantity": 100, "unit": "ream", "specifications": "80 GSM" },
    { "item_name": "Ballpoint Pens", "quantity": 500, "unit": "pcs" }
  ],
  "vendor_ids": ["uuid1", "uuid2", "uuid3"]
}

// Response 201
{
  "data": { "id": "uuid", "rfq_number": "RFQ-2024-0001", "status": "draft" }
}
```

Logic:

1. `generateNumber('RFQ', ...)` inside a transaction
2. Insert into `rfqs`
3. Bulk insert `rfq_items`
4. Bulk insert `rfq_vendors`
5. Log: `{ entity_type: 'rfq', action: 'created' }`

**PATCH /api/rfqs/:id/publish**

Logic:

1. Validate `status === 'draft'` and `deadline > NOW()`
2. Update `rfqs.status = 'open'`
3. For each vendor in `rfq_vendors`:
   * Create notification: `{ type: 'rfq_invited', title: 'New RFQ Invitation', message: '...' }`
   * Send invitation email (async, non-blocking)
   * Update `rfq_vendors.invitation_sent = true`
4. Log: `{ action: 'published' }`

**PATCH /api/rfqs/:id/close**

* Update status to `closed`
* Notify all vendors that RFQ is closed
* Log action

**GET /api/rfqs/:id** — Response includes:

```json
{
  "rfq": { "id":"...", "rfq_number":"RFQ-2024-0001", "title":"...", "status":"open", "deadline":"..." },
  "items": [ { "id":"...", "item_name":"A4 Paper", "quantity":100, "unit":"ream" } ],
  "vendors": [ { "vendor_id":"...", "company_name":"...", "invitation_sent": true } ],
  "quotation_count": 3
}
```

---

### 4.3 Acceptance Criteria — Phase 4

* [ ] 4-step wizard validates each step before allowing Next
* [ ] At least 1 item required; duplicate item names warn but don't block
* [ ] At least 1 vendor required
* [ ] Deadline must be a future date/time
* [ ] RFQ number auto-generates as RFQ-YYYY-NNNN
* [ ] Draft RFQs visible only to creator and admin
* [ ] Publish sends in-app notifications AND email to all assigned vendors
* [ ] `invitation_sent` flag updates correctly per vendor
* [ ] Only draft RFQs can be edited
* [ ] Activity log tab on RFQ detail shows all actions with timestamps and actor

---

## Phase 5 — Quotation Submission & Comparison

### Scope

Vendors submit quotations with pricing; procurement compares side-by-side. No file uploads.

---

### 5.1 Design Specifications

**Screen: Vendor — My RFQs (Vendor Portal)**

* List of RFQs the vendor was invited to (from rfq_vendors)
* Status badges: Open | Closed | Submitted (already submitted quotation)
* `Submit Quotation` button on open RFQs where no quotation yet
* `Edit Draft` on RFQs with draft quotation
* `View Quotation` on submitted quotations

**Screen: Submit / Edit Quotation**

Header: RFQ title, deadline countdown

Line items table (pre-populated from rfq_items, vendor fills pricing):

| Column          | Editable? | Notes              |
| --------------- | --------- | ------------------ |
| Item Name       | No        | From rfq_item      |
| Required Qty    | No        | From rfq_item      |
| Unit            | No        |                    |
| Unit Price (₹) | Yes       | Required           |
| Tax %           | Yes       | Default 18         |
| Tax Amount      | No        | Auto-calc          |
| Total           | No        | Auto-calc          |
| Delivery Days   | Yes       | Per item, optional |

Global fields:

* Overall Delivery Timeline (days) — required
* Payment Terms (text)
* Valid Until (date)
* Notes / Comments

Auto-calculated footer: Subtotal | Total Tax | Grand Total (updates live)

Buttons: `Save Draft` | `Submit Quotation`

* Submit shows confirmation modal: "Once submitted, you cannot edit. Proceed?"

**Screen: Quotation Comparison**

URL: `/rfqs/:id/compare`

Access: procurement_officer, manager, admin

Layout — horizontal scrollable comparison table:

```
                    | Vendor A      | Vendor B      | Vendor C
--------------------|---------------|---------------|---------------
Quotation No.       | QT-2024-0001  | QT-2024-0002  | QT-2024-0003
Submitted           | 10 Dec        | 11 Dec        | 12 Dec
--------------------|---------------|---------------|---------------
A4 Paper (100 ream) | ₹12,000       | ₹11,500 🏆    | ₹12,800
Ballpoint Pens(500) | ₹2,500        | ₹2,800        | ₹2,200 🏆
--------------------|---------------|---------------|---------------
Subtotal            | ₹14,500       | ₹14,300       | ₹15,000
Total Tax (18%)     | ₹2,610        | ₹2,574        | ₹2,700
Grand Total         | ₹17,110       | ₹16,874 🏆    | ₹17,700
--------------------|---------------|---------------|---------------
Delivery Days       | 10 days       | 7 days 🏆     | 14 days
Payment Terms       | Net 30        | Net 15        | Net 30
Rating              | ⭐ 4.2         | ⭐ 3.8         | ⭐ 4.5
--------------------|---------------|---------------|---------------
Action              | [Select]      | [Select] ←rec | [Select]
```

* 🏆 green highlight = lowest value in that row
* "Recommended" badge on column with lowest grand total
* `Select & Proceed to Approval` button under each vendor column
* Only one quotation per RFQ can be sent for approval

**Screen: Quotation Detail (read-only)**

* Quotation number, vendor, RFQ reference, submission date
* Line items table with full breakdown
* Summary: Subtotal / Tax / Grand Total
* Delivery, payment, notes
* Status badge + timeline (submitted → under_review → accepted/rejected)

---

### 5.2 Backend Implementation

**Routes**

```
GET    /api/quotations                        -- list (role-filtered)
GET    /api/quotations/:id                    -- detail
POST   /api/quotations                        -- vendor creates/saves draft
PUT    /api/quotations/:id                    -- vendor updates draft
PATCH  /api/quotations/:id/submit             -- vendor submits
GET    /api/rfqs/:rfqId/quotations            -- all quotations for an RFQ
GET    /api/rfqs/:rfqId/quotations/compare    -- comparison data
```

**POST /api/quotations** — Authorization: vendor

```json
// Request
{
  "rfq_id": "uuid",
  "delivery_days": 10,
  "payment_terms": "Net 30",
  "valid_until": "2025-01-15",
  "notes": "Best price guaranteed",
  "items": [
    {
      "rfq_item_id": "uuid",
      "item_name": "A4 Paper",
      "quantity": 100,
      "unit": "ream",
      "unit_price": 115,
      "tax_percent": 18,
      "delivery_days": 7
    }
  ]
}
```

Server-side calculations:

```javascript
items.forEach(item => {
  item.tax_amount = parseFloat((item.unit_price * item.quantity * (item.tax_percent / 100)).toFixed(2));
  item.total_price = parseFloat((item.unit_price * item.quantity + item.tax_amount).toFixed(2));
});
const total_amount = items.reduce((sum, i) => sum + i.total_price, 0);
```

Validations:

* Vendor must be in `rfq_vendors` for this RFQ
* RFQ status must be `open`
* Only one quotation per vendor per RFQ (check unique vendor_id + rfq_id)
* Status saved as `draft`

**PATCH /api/quotations/:id/submit**

* Validate current status is `draft`
* Validate vendor is request owner
* Set `status = 'submitted'`, `submitted_at = NOW()`
* Notify procurement officer(s): new quotation received
* Log action

**GET /api/rfqs/:rfqId/quotations/compare**

```json
// Response 200
{
  "rfq": { "id":"...", "title":"Office Supplies", "items": [...] },
  "quotations": [
    {
      "id": "uuid",
      "quotation_number": "QT-2024-0001",
      "status": "submitted",
      "vendor": { "id":"...", "company_name":"Dell India", "rating": 4.2 },
      "delivery_days": 10,
      "payment_terms": "Net 30",
      "total_amount": 17110,
      "items": [
        {
          "rfq_item_id": "uuid",
          "item_name": "A4 Paper",
          "unit_price": 120,
          "tax_percent": 18,
          "tax_amount": 2160,
          "total_price": 14160,
          "is_lowest_price": false
        }
      ]
    }
  ],
  "analysis": {
    "lowest_total_quotation_id": "uuid",
    "fastest_delivery_quotation_id": "uuid"
  }
}
```

`is_lowest_price` per item computed by comparing that item's unit_price across all quotations.

---

### 5.3 Acceptance Criteria — Phase 5

* [ ] Vendor can only see RFQs they were invited to
* [ ] Vendor can save draft and return to edit before submitting
* [ ] Each vendor can submit only one quotation per RFQ
* [ ] Submitted quotation is locked — edit returns 403
* [ ] Tax and total calculations are done server-side and stored
* [ ] Comparison view shows all submitted quotations for an RFQ
* [ ] Lowest price per item highlighted in green with 🏆
* [ ] Lowest grand total column has "Recommended" badge
* [ ] `Select & Proceed to Approval` button visible only to procurement_officer and admin
* [ ] Vendor receives notification when their quotation is accepted or rejected

---

## Phase 6 — Approval Workflow

### Scope

Single-level approval workflow. One approver per quotation. Flat `approvals` table — no multi-step sub-table.

---

### 6.1 Design Specifications

**Screen: Approval Queue (Manager View)**

* Page: "Pending Approvals"
* Filter tabs: Pending | Approved | Rejected | All
* Table:

| Column       | Notes                           |
| ------------ | ------------------------------- |
| RFQ          | RFQ number + title              |
| Vendor       | Vendor company name             |
| Quotation    | QT number + total amount        |
| Initiated By | Procurement officer name        |
| Initiated At | Date                            |
| Status       | Badge                           |
| Action       | `Review`button (pending only) |

**Screen: Approval Detail (Drawer/Modal)**

Left panel — Quotation Summary:

* Vendor name, rating
* Line items table (from quotation_items)
* Subtotal / Tax / Grand Total
* Delivery days, payment terms, notes

Right panel — Approval Action:

* Timeline:
  * ✅ Initiated by [name] on [date]
  * ⏳ Pending approval by [manager name]
* Remarks textarea (required only for rejection)
* Two buttons: `Approve` (green) | `Reject` (red)
* On approve: green success state, timeline updates
* On reject: red state, remarks shown in timeline

**Screen: Approval History (Procurement Officer)**

* Shows all approvals they initiated
* Status badges, filter by status
* Click row → read-only approval detail

---

### 6.2 Backend Implementation

**Routes**

```
POST   /api/approvals               -- initiate approval
GET    /api/approvals               -- list (role-filtered)
GET    /api/approvals/:id           -- detail with quotation + vendor info
PATCH  /api/approvals/:id/approve   -- manager approves
PATCH  /api/approvals/:id/reject    -- manager rejects
```

**POST /api/approvals** — Authorization: procurement_officer, admin

```json
// Request
{ "quotation_id": "uuid", "approver_id": "uuid" }

// Response 201
{ "data": { "id": "uuid", "status": "pending" } }
```

Logic:

1. Validate quotation exists and `status === 'submitted'`
2. Validate only one approval per quotation (`UNIQUE` on quotation_id)
3. Validate approver has role `manager` or `admin`
4. Insert into `approvals` with `status = 'pending'`
5. Update `quotations.status = 'under_review'`
6. Notify approver: "Approval required for QT-2024-0001 — ₹17,110"
7. Log: `{ entity_type: 'approval', action: 'initiated' }`

**PATCH /api/approvals/:id/approve** — Authorization: manager, admin

```json
// Request
{ "remarks": "Prices verified and approved." }
```

Logic:

1. Validate `approvals.status === 'pending'`
2. Validate `req.user.id === approvals.approved_by` (or admin)
3. Update `approvals`: `status='approved'`, `remarks`, `acted_at=NOW()`
4. Update `quotations.status = 'accepted'`
5. Notify procurement officer: "Quotation QT-2024-0001 approved by [manager]"
6. Log: `{ action: 'approved' }`

**PATCH /api/approvals/:id/reject** — Authorization: manager, admin

```json
// Request — remarks REQUIRED for rejection
{ "remarks": "Price exceeds budget. Please renegotiate." }
```

Logic:

1. Validate `remarks` is non-empty
2. Update `approvals`: `status='rejected'`, `acted_at=NOW()`
3. Update `quotations.status = 'rejected'`
4. Notify procurement officer with remarks text
5. Log: `{ action: 'rejected', metadata: { remarks } }`

**GET /api/approvals/:id** — Response includes full quotation + vendor:

```json
{
  "approval": { "id":"...", "status":"pending", "initiated_at":"...", "initiated_by": {...} },
  "quotation": {
    "quotation_number": "QT-2024-0001",
    "total_amount": 17110,
    "delivery_days": 10,
    "items": [ ... ]
  },
  "vendor": { "company_name":"Dell India", "rating": 4.2, "gst_number":"..." }
}
```

---

### 6.3 Acceptance Criteria — Phase 6

* [ ] Only submitted quotations can be sent for approval
* [ ] Unique constraint prevents duplicate approvals per quotation
* [ ] Manager sees only approvals where they are the assigned approver (admin sees all)
* [ ] Rejection without remarks returns 400 validation error
* [ ] Approval updates quotation status to `accepted` immediately
* [ ] Rejection updates quotation status to `rejected` immediately
* [ ] Both parties receive correct notifications on approval/rejection
* [ ] Approved quotation shows `Generate PO` button to procurement officer
* [ ] Acted_at timestamp recorded correctly

---

## Phase 7 — Purchase Orders & Invoices

### Scope

Generate PO from approved quotation, generate GST-compliant invoice, download PDF, print, send via email. Line items come from `quotation_items` via JOIN — no separate `po_items` or `invoice_items` tables.

---

### 7.1 Design Specifications

**Screen: Purchase Order List**

* Header: "Purchase Orders" + filter tabs: All | Draft | Sent | Acknowledged | Fulfilled | Cancelled
* Table: PO Number | Vendor | RFQ | PO Date | Total Amount | Status | Actions

**Screen: Generate / View Purchase Order**

Auto-filled from approved quotation. Editable before saving.

Sections:

* **Header:** PO Number (auto), PO Date (today)
* **Vendor Info:** Company Name, Address, GST (from vendors table)
* **Buyer Info:** Organization name, billing address, shipping address
* **Line Items Table** (pulled from `quotation_items`):

| # | Item     | Qty | Unit | Unit Price | Tax% | Tax Amt | Total    |
| - | -------- | --- | ---- | ---------- | ---- | ------- | -------- |
| 1 | A4 Paper | 100 | ream | ₹115      | 18%  | ₹2,070 | ₹13,570 |

* **Summary:** Subtotal | Total Tax | Grand Total
* **Editable fields:** Delivery Date, Payment Terms, Terms & Conditions, Billing/Shipping Address, Notes
* **Action buttons:** `Save PO` | `Send to Vendor` | `Generate Invoice`

**Screen: Invoice**

Auto-generated from PO. GST-compliant layout.

Sections:

* **Header:** "TAX INVOICE" | Invoice Number | Issue Date | Due Date
* **Seller Details:** Organization name, address, GSTIN
* **Buyer Details:** Vendor name, address, GSTIN
* **PO Reference:** PO number
* **Line Items Table:**

| # | Description | HSN/SAC | Qty | Unit | Rate | Amount |
| - | ----------- | ------- | --- | ---- | ---- | ------ |

* **Tax Summary:**
  * Same state: CGST (9%) + SGST (9%)
  * Cross-state: IGST (18%)
* **Total Section:** Subtotal | CGST/SGST or IGST | Grand Total
* **Amount in Words** (Indian numbering: Lakh, Crore)
* **Action buttons:** `Download PDF` | `Print` | `Send via Email` | `Mark as Paid`

**Send Invoice via Email Modal**

* To: pre-filled with vendor email (editable)
* CC: optional comma-separated emails
* Subject: pre-filled `Invoice INV-2024-0001 from VendorBridge`
* Message: pre-filled template (editable)
* `Send` button

**Invoice PDF Layout**

```
┌───────────────────────────────────────────────────────────┐
│  VENDORBRIDGE                    TAX INVOICE              │
│  [Organization address]          Invoice: INV-2024-0001   │
│  GSTIN: XXXXXXXXXXXX             Date: 01-Jan-2025        │
│                                  Due: 31-Jan-2025         │
├───────────────────────────────────────────────────────────┤
│  Bill To:                        PO Ref: PO-2024-0001     │
│  Dell India Pvt. Ltd.                                     │
│  Bangalore, Karnataka                                     │
│  GSTIN: 29AABCD1234E1Z5                                   │
├────┬──────────────┬────────┬────────┬───────┬─────────────┤
│ S# │ Description  │HSN/SAC │  Qty   │ Rate  │   Amount    │
├────┼──────────────┼────────┼────────┼───────┼─────────────┤
│  1 │ A4 Paper     │ 4802   │  100   │  115  │  11,500     │
│  2 │ Ballpoint    │ 9608   │  500   │    4  │   2,000     │
├────┴──────────────┴────────┴────────┴───────┼─────────────┤
│                                  Subtotal   │  13,500     │
│                                  CGST (9%)  │   1,215     │
│                                  SGST (9%)  │   1,215     │
│                                  TOTAL      │  15,930     │
├───────────────────────────────────────────────────────────┤
│ Amount in Words: Fifteen Thousand Nine Hundred Thirty     │
│ Only                                                      │
└───────────────────────────────────────────────────────────┘
```

---

### 7.2 Backend Implementation

**Routes**

```
GET    /api/purchase-orders              -- list with filters
GET    /api/purchase-orders/:id          -- detail (includes quotation_items via JOIN)
POST   /api/purchase-orders              -- generate from approved quotation
PUT    /api/purchase-orders/:id          -- update (if draft)
PATCH  /api/purchase-orders/:id/send     -- send to vendor (status → sent)
GET    /api/invoices                     -- list
GET    /api/invoices/:id                 -- detail (includes quotation_items via JOIN)
POST   /api/invoices                     -- generate from PO
PATCH  /api/invoices/:id/status          -- update status (paid, cancelled)
POST   /api/invoices/:id/send-email      -- send via email with PDF
GET    /api/invoices/:id/pdf             -- download PDF
```

**POST /api/purchase-orders** — Authorization: procurement_officer, admin

```json
// Request
{
  "quotation_id": "uuid",
  "delivery_date": "2025-02-15",
  "payment_terms": "Net 30",
  "terms_and_conditions": "Standard T&C apply.",
  "billing_address": "123 Main St, Ahmedabad",
  "shipping_address": "123 Main St, Ahmedabad"
}
```

Logic:

1. Validate `quotations.status === 'accepted'` (approval must be done)
2. Check no existing PO for this quotation
3. Generate PO number
4. Fetch `quotation_items` to calculate totals:

```javascript
const items = await prisma.quotation_items.findMany({ where: { quotation_id } });
const subtotal = items.reduce((s, i) => s + (i.unit_price * i.quantity), 0);
const tax_amount = items.reduce((s, i) => s + i.tax_amount, 0);
const total_amount = subtotal + tax_amount;
```

5. Insert `purchase_orders` with stored totals
6. Notify vendor: "Purchase Order PO-2024-0001 has been generated"
7. Log action

**GET /api/purchase-orders/:id** — Response:

```json
{
  "po": { "po_number":"PO-2024-0001", "status":"draft", "subtotal":13500, "tax_amount":2430, "total_amount":15930 },
  "vendor": { "company_name":"...", "gst_number":"...", "address":"..." },
  "items": [
    { "item_name":"A4 Paper", "quantity":100, "unit":"ream", "unit_price":115, "tax_percent":18, "tax_amount":2070, "total_price":13570 }
  ]
}
```

Items are fetched via: `quotation_items WHERE quotation_id = po.quotation_id`

**POST /api/invoices** — Authorization: procurement_officer, admin

```json
// Request
{
  "po_id": "uuid",
  "issue_date": "2025-01-01",
  "due_date": "2025-01-31",
  "payment_terms": "Net 30"
}
```

Tax logic (based on vendor state vs organization state):

```javascript
const vendorState = vendor.state;
const orgState = process.env.ORG_STATE; // e.g. 'Gujarat'

let cgst = 0, sgst = 0, igst = 0;
if (vendorState === orgState) {
  cgst = subtotal * 0.09;
  sgst = subtotal * 0.09;
} else {
  igst = subtotal * 0.18;
}
const total_amount = subtotal + cgst + sgst + igst;
const amount_in_words = toIndianWords(total_amount); // utility function
```

**POST /api/invoices/:id/send-email**

```json
// Request
{
  "to": "vendor@dell.com",
  "cc": ["finance@myorg.com"],
  "subject": "Invoice INV-2024-0001 from VendorBridge",
  "message": "Please find the invoice attached."
}
```

Logic:

1. Generate PDF server-side (Puppeteer renders invoice HTML template)
2. Send email via Nodemailer with PDF as attachment
3. Update `invoices.sent_at = NOW()`, `sent_to_email = to`
4. If status is `draft`, change to `sent`
5. Log action
6. Create notification for relevant users

**GET /api/invoices/:id/pdf**

* Render invoice HTML template with data
* Convert to PDF via Puppeteer
* Return stream: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename=INV-2024-0001.pdf`

**Amount in Words Utility (Indian Numbering)**

```javascript
// utils/indianWords.js
// Handles: Lakh (1,00,000), Crore (1,00,00,000)
// e.g. 15930 → "Fifteen Thousand Nine Hundred Thirty Only"
```

---

### 7.3 Acceptance Criteria — Phase 7

* [ ] PO can only be generated for quotations with `accepted` status
* [ ] Only one PO allowed per quotation
* [ ] PO line items fetched from `quotation_items` via JOIN (no separate po_items table)
* [ ] PO number auto-generates as PO-YYYY-NNNN
* [ ] Invoice line items fetched from `quotation_items` via PO→quotation JOIN
* [ ] Invoice number auto-generates as INV-YYYY-NNNN
* [ ] CGST+SGST applied for same-state; IGST for cross-state
* [ ] PDF download returns valid, correctly formatted PDF
* [ ] Print opens browser print dialog with invoice layout
* [ ] Email sends successfully with PDF attached
* [ ] `sent_at` and `sent_to_email` update on email send
* [ ] `Mark as Paid` updates invoice status to `paid`
* [ ] Amount in words correct for Indian numbering (includes Lakh/Crore)
* [ ] Vendor receives notification when PO is generated

---

## Phase 8 — Activity Logs & Notifications

### Scope

Immutable audit trail written on every significant action. In-app notification center with real-time badge updates.

---

### 8.1 Design Specifications

**Screen: Activity Logs**

* Header: "Activity Logs"
* Filters:
  * Entity Type (All / RFQ / Quotation / Approval / Purchase Order / Invoice / Vendor)
  * Date Range (from / to date pickers)
  * Action (All / created / submitted / approved / rejected / sent / etc.)
  * User (searchable dropdown, admin only)
* Timeline list (newest first):
  ```
  🟢  Ravi Patel created RFQ-2024-0012 "IT Equipment Q4"           2 hours ago🔵  Ankit Sharma submitted QT-2024-0031 for RFQ-2024-0010        Yesterday 3:45 PM🟡  Priya Mehta initiated approval for QT-2024-0031              Yesterday 4:00 PM✅  Suresh Manager approved QT-2024-0031                          Today 9:20 AM🧾  System generated PO-2024-0009                                Today 9:25 AM📧  Ravi Patel sent INV-2024-0008 to vendor@dell.com             Today 10:00 AM
  ```
* Entity links: clicking the number navigates to the entity detail
* `Export CSV` button (exports filtered records)
* Pagination: 50 per page

**Component: Notifications Panel (Top Bar)**

* Bell icon with red badge showing unread count
* Clicking opens a right-side sliding panel (320px wide)
* Sections: Today / Yesterday / Earlier
* Each notification card:
  * Color-coded left border by type
  * Title (bold) + message (gray) + relative time
  * Unread = white bg; Read = gray-50 bg
  * Click → navigate to entity + mark as read
* `Mark all as read` button (top right of panel)
* Empty state: "You're all caught up! 🎉"
* Notification types and icons:

| Type                | Icon          | Border Color |
| ------------------- | ------------- | ------------ |
| rfq_invited         | FileText      | Blue         |
| quotation_submitted | ClipboardList | Purple       |
| approval_required   | AlertCircle   | Amber        |
| quotation_approved  | CheckCircle   | Green        |
| quotation_rejected  | XCircle       | Red          |
| po_generated        | ShoppingCart  | Teal         |
| invoice_sent        | Mail          | Blue         |

---

### 8.2 Backend Implementation

**Routes**

```
GET    /api/activity-logs                -- list with filters & pagination
GET    /api/activity-logs/export         -- CSV download (same filters)
GET    /api/notifications                -- user's notifications (newest first)
GET    /api/notifications/unread-count   -- badge count
PATCH  /api/notifications/:id/read       -- mark single read
PATCH  /api/notifications/read-all       -- mark all read for this user
```

**Shared Utility: logActivity**

Call this from every service method. Never call it from controllers directly.

```javascript
// utils/activityLogger.js
const { prisma } = require('../db');

async function logActivity({ entity_type, entity_id, action, description, performed_by, metadata = {} }) {
  await prisma.activity_logs.create({
    data: { entity_type, entity_id, action, description, performed_by, metadata }
  });
}

module.exports = { logActivity };
```

Events to log (minimum required):

| Entity    | Action         | Triggered When                |
| --------- | -------------- | ----------------------------- |
| vendor    | created        | New vendor added              |
| vendor    | updated        | Vendor details changed        |
| vendor    | status_changed | Status updated                |
| rfq       | created        | RFQ saved as draft            |
| rfq       | published      | RFQ status → open            |
| rfq       | closed         | RFQ status → closed          |
| quotation | created        | Draft quotation saved         |
| quotation | submitted      | Quotation submitted by vendor |
| quotation | accepted       | After approval approved       |
| quotation | rejected       | After approval rejected       |
| approval  | initiated      | Approval workflow started     |
| approval  | approved       | Manager approved              |
| approval  | rejected       | Manager rejected              |
| po        | created        | Purchase order generated      |
| po        | sent           | PO sent to vendor             |
| invoice   | created        | Invoice generated             |
| invoice   | sent           | Invoice emailed               |
| invoice   | paid           | Status changed to paid        |

**Shared Utility: createNotification**

```javascript
// utils/notifier.js
async function createNotification({ user_id, type, title, message, entity_type, entity_id }) {
  await prisma.notifications.create({
    data: { user_id, type, title, message, entity_type, entity_id }
  });
}

// For notifying multiple users at once
async function notifyMany({ user_ids, type, title, message, entity_type, entity_id }) {
  await prisma.notifications.createMany({
    data: user_ids.map(user_id => ({ user_id, type, title, message, entity_type, entity_id }))
  });
}

module.exports = { createNotification, notifyMany };
```

Notification triggers (who gets notified):

| Event               | Recipients                        |
| ------------------- | --------------------------------- |
| RFQ published       | All assigned vendors              |
| Quotation submitted | All procurement officers + admins |
| Approval initiated  | Assigned manager/approver         |
| Quotation approved  | Procurement officer who initiated |
| Quotation rejected  | Procurement officer who initiated |
| PO generated        | Vendor                            |
| Invoice sent        | Vendor + admins                   |

**GET /api/activity-logs** — Role scoping:

* Admin: all logs
* Manager: logs for their own actions + approvals they handled
* Procurement Officer: logs for entities they created
* Vendor: logs for their own quotations only

Query params: `entity_type`, `action`, `from_date`, `to_date`, `performed_by` (admin only), `page`, `limit`

**GET /api/activity-logs/export** — Same filters, returns CSV:

```
Content-Type: text/csv
Content-Disposition: attachment; filename=activity-logs-2024-12-01.csv

Date,Time,User,Action,Entity Type,Entity ID,Description
2024-12-01,09:30,Ravi Patel,created,rfq,uuid,RFQ-2024-0001 created
```

**GET /api/notifications/unread-count**

```json
{ "count": 5 }
```

Suitable for polling every 30 seconds on the frontend, or implement SSE for real-time push.

**Real-time (Optional SSE)**

```javascript
// GET /api/notifications/stream
// Sends: data: {"type":"new_notification","count":6}\n\n
// Client subscribes with EventSource API
```

---

### 8.3 Acceptance Criteria — Phase 8

* [ ] Activity log written for every event listed in the trigger table
* [ ] Activity logs have no update or delete endpoints (write-once)
* [ ] Filtering by entity type, date range, and action works correctly
* [ ] Admin sees all logs; other roles see only scoped logs
* [ ] CSV export includes all filtered records with correct columns
* [ ] Notification bell badge shows correct unread count
* [ ] Notification panel groups correctly: Today / Yesterday / Earlier
* [ ] Clicking a notification marks it read and navigates to the entity
* [ ] "Mark all as read" clears all unread for that user
* [ ] Notification type icons and border colors match the type table
* [ ] Empty state shows when no notifications exist

---

## Phase 9 — Reports & Analytics

### Scope

Procurement insights via charts and tables. All data aggregated from the 12 core tables via SQL. No separate analytics tables needed.

---

### 9.1 Design Specifications

**Screen: Reports & Analytics**

Page header: "Reports & Analytics" + date range picker (applies to all tabs)

4-tab navigation:

**Tab 1: Procurement Overview**

* 4 KPI Cards: Total POs | Total Invoiced Amount | Avg Approval Time (hours) | PO Fulfillment Rate %
* Bar Chart: Monthly Procurement Spend (last 12 months) — from `purchase_orders.total_amount`
* Pie Chart: Spend by Vendor Category — from `vendors.category` joined with `purchase_orders`
* Table: Top 5 Vendors by Spend

**Tab 2: Vendor Performance**

* Table (sortable by any column):

| Vendor | Category | Quotations Submitted | Quotations Won | Win Rate | Avg Delivery Days | Total Business (₹) |
| ------ | -------- | -------------------- | -------------- | -------- | ----------------- | ------------------- |

* Bar Chart: Win rate per vendor (top 10 vendors)

**Tab 3: Spending Analysis**

* Line Chart: Cumulative spend over selected date range
* Table: Month-wise breakdown with % change from previous month
* Table: Category-wise spend breakdown

**Tab 4: RFQ Analytics**

* KPI: Avg quotations per RFQ | Avg time RFQ→PO (days) | RFQ cancellation rate %
* Donut Chart: RFQ status distribution (Open / Closed / Cancelled / Under Review)
* Table: RFQs with most quotations received
* `Export CSV` button on each tab

---

### 9.2 Backend Implementation

**Routes**

```
GET  /api/reports/overview           -- Tab 1
GET  /api/reports/vendor-performance -- Tab 2
GET  /api/reports/spending           -- Tab 3
GET  /api/reports/rfq-analytics      -- Tab 4
GET  /api/reports/export             -- CSV export for any tab
```

Authorization: all report endpoints require `admin` or `manager` role.

Query params for all: `from_date`, `to_date`

**GET /api/reports/overview**

```json
{
  "kpis": {
    "total_pos": 48,
    "total_invoiced": 2450000,
    "avg_approval_hours": 18.5,
    "fulfillment_rate": 87.5
  },
  "monthly_spend": [
    { "month": "2024-01", "total": 180000 },
    ...
  ],
  "category_spend": [
    { "category": "IT Hardware", "total": 950000 },
    { "category": "Office Supplies", "total": 320000 }
  ],
  "top_vendors": [
    { "company_name": "Dell India", "total_business": 450000 }
  ]
}
```

Key SQL queries:

```sql
-- Monthly spend
SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') month, SUM(total_amount) total
FROM purchase_orders WHERE created_at BETWEEN $1 AND $2
GROUP BY 1 ORDER BY 1;

-- Spend by category (no category table — use vendors.category)
SELECT v.category, SUM(po.total_amount) total
FROM purchase_orders po JOIN vendors v ON po.vendor_id = v.id
WHERE po.created_at BETWEEN $1 AND $2
GROUP BY v.category ORDER BY total DESC;

-- Avg approval time
SELECT AVG(EXTRACT(EPOCH FROM (acted_at - initiated_at)) / 3600) avg_hours
FROM approvals WHERE status = 'approved' AND acted_at BETWEEN $1 AND $2;
```

**GET /api/reports/vendor-performance**

```sql
SELECT
  v.company_name, v.category,
  COUNT(q.id) FILTER (WHERE q.status IN ('submitted','under_review','accepted','rejected')) AS submitted,
  COUNT(q.id) FILTER (WHERE q.status = 'accepted') AS won,
  ROUND(COUNT(q.id) FILTER (WHERE q.status = 'accepted')::DECIMAL /
    NULLIF(COUNT(q.id) FILTER (WHERE q.status != 'draft'), 0) * 100, 1) AS win_rate,
  ROUND(AVG(q.delivery_days), 1) AS avg_delivery_days,
  COALESCE(SUM(po.total_amount), 0) AS total_business
FROM vendors v
LEFT JOIN quotations q ON q.vendor_id = v.id
LEFT JOIN purchase_orders po ON po.vendor_id = v.id
WHERE v.deleted_at IS NULL
GROUP BY v.id, v.company_name, v.category
ORDER BY total_business DESC;
```

---

### 9.3 Acceptance Criteria — Phase 9

* [ ] All 4 tabs load with correct data for selected date range
* [ ] Default date range: current year
* [ ] Vendor performance table is sortable client-side by any column
* [ ] Pie and bar charts render correctly with tooltips showing values
* [ ] CSV export returns correct data matching what is displayed
* [ ] Reports accessible only to admin and manager
* [ ] Spending by category uses `vendors.category` (VARCHAR, no lookup table)
* [ ] Charts are responsive on smaller screens

---

## Design System & UI Tokens

### Color Palette

```css
/* Primary — matches Excalidraw mockup mint headers */
--color-primary:        #2f9e44;  /* Green 700 */
--color-primary-light:  #69db7c;  /* Green 400 */
--color-primary-bg:     #e6fcf5;  /* Mint 50 — header/sidebar accent */

/* Semantic */
--color-success:  #2f9e44;
--color-warning:  #f08c00;
--color-error:    #e03131;
--color-info:     #1971c2;

/* Neutral */
--color-gray-900: #1e1e1e;
--color-gray-700: #495057;
--color-gray-500: #868e96;
--color-gray-300: #dee2e6;
--color-gray-100: #f8f9fa;

/* Surface */
--color-bg-page:    #f8f9fa;
--color-bg-card:    #ffffff;
--color-bg-sidebar: #1e1e1e;
```

### Status Badge Colors

| Status                                      | Background  | Text        |
| ------------------------------------------- | ----------- | ----------- |
| active / open / approved / fulfilled / paid | `#d3f9d8` | `#2b8a3e` |
| draft / pending                             | `#fff3bf` | `#e67700` |
| inactive / rejected / overdue               | `#ffe3e3` | `#c92a2a` |
| sent / under_review / acknowledged          | `#dbe4ff` | `#3b5bdb` |
| blacklisted / cancelled                     | `#ffe8cc` | `#d9480f` |
| closed                                      | `#e9ecef` | `#495057` |

### Typography

```css
--font-family:    'Inter', sans-serif;
--font-size-xs:   12px;
--font-size-sm:   14px;
--font-size-base: 16px;
--font-size-lg:   18px;
--font-size-xl:   20px;
--font-size-2xl:  24px;
--font-size-3xl:  30px;
```

### Spacing Scale

```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
--space-12: 48px; --space-16: 64px;
```

### Breakpoints

```css
--bp-sm: 640px;   --bp-md: 768px;   --bp-lg: 1024px;  --bp-xl: 1280px;
```

### Component Specs

| Component        | Spec                                                                |
| ---------------- | ------------------------------------------------------------------- |
| Card             | rounded-xl, shadow-sm, padding 24px, bg white                       |
| Button Primary   | bg `#2f9e44`, text white, height 40px, rounded-md, px-4           |
| Button Secondary | border `#2f9e44`, text `#2f9e44`, bg transparent                |
| Button Danger    | bg `#e03131`, text white                                          |
| Input            | border `#dee2e6`, rounded-md, height 40px, focus ring `#2f9e44` |
| Table row hover  | bg `#f8f9fa`                                                      |
| Sidebar width    | 240px fixed                                                         |
| Top bar height   | 64px                                                                |

---

## API Contract Summary

### Base URL

`https://api.vendorbridge.com/api/v1`

### Auth Header

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Standard Response Envelope

```json
// Success
{ "status": "success", "data": { ... }, "message": "..." }

// List with pagination
{
  "status": "success",
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}

// Error
{
  "status": "error",
  "code": 400,
  "message": "Validation failed",
  "errors": [ { "field": "email", "message": "Email already registered" } ]
}
```

### HTTP Status Codes

| Code | Used For                                      |
| ---- | --------------------------------------------- |
| 200  | Successful GET / PATCH                        |
| 201  | Successful POST (resource created)            |
| 400  | Validation error                              |
| 401  | Missing or invalid JWT                        |
| 403  | Valid JWT but wrong role                      |
| 404  | Resource not found                            |
| 409  | Conflict (duplicate, e.g. duplicate approval) |
| 500  | Internal server error                         |

---

## Role-Permission Matrix

| Feature                | Admin        | Procurement Officer | Manager | Vendor        |
| ---------------------- | ------------ | ------------------- | ------- | ------------- |
| View Dashboard         | ✅           | ✅                  | ✅      | ✅ (own data) |
| Manage Users           | ✅           | ❌                  | ❌      | ❌            |
| Create Vendor          | ✅           | ✅                  | ❌      | ❌            |
| Edit Vendor            | ✅           | ✅                  | ❌      | ❌            |
| Delete Vendor (soft)   | ✅           | ❌                  | ❌      | ❌            |
| Create RFQ             | ✅           | ✅                  | ❌      | ❌            |
| Publish RFQ            | ✅           | ✅                  | ❌      | ❌            |
| View RFQ               | ✅           | ✅                  | ✅      | Invited only  |
| Submit Quotation       | ❌           | ❌                  | ❌      | ✅            |
| Edit Draft Quotation   | ❌           | ❌                  | ❌      | Own only      |
| View Quotations        | ✅           | ✅                  | ✅      | Own only      |
| Compare Quotations     | ✅           | ✅                  | ✅      | ❌            |
| Initiate Approval      | ✅           | ✅                  | ❌      | ❌            |
| Approve / Reject       | ✅           | ❌                  | ✅      | ❌            |
| Generate PO            | ✅           | ✅                  | ❌      | ❌            |
| View PO                | ✅           | ✅                  | ✅      | Own only      |
| Generate Invoice       | ✅           | ✅                  | ❌      | ❌            |
| Download Invoice PDF   | ✅           | ✅                  | ✅      | Own only      |
| Send Invoice via Email | ✅           | ✅                  | ❌      | ❌            |
| Mark Invoice Paid      | ✅           | ✅                  | ❌      | ❌            |
| View Activity Logs     | All (scoped) | Own                 | Own     | Own           |
| Export Activity Logs   | ✅           | ❌                  | ✅      | ❌            |
| View Notifications     | ✅           | ✅                  | ✅      | ✅            |
| View Reports           | ✅           | ❌                  | ✅      | ❌            |
| Export Reports         | ✅           | ❌                  | ✅      | ❌            |

---

## Non-Functional Requirements

### Performance

* API response P95 < 500ms
* Dashboard loads < 2 seconds
* PDF generation < 5 seconds

### Security

* Passwords: `bcrypt` with 12 salt rounds
* JWT signed with `HS256`, strong secret (min 32 chars)
* Protected routes: all except `/auth/login`, `/auth/signup`, `/auth/forgot-password`
* Rate limiting: 20 req/min on auth endpoints, 500 req/min general
* HTTPS enforced in production
* Prisma ORM — all queries parameterized, no raw SQL injection risk
* Env vars via `.env` file, never committed

### Data Integrity

* Soft deletes on: `users`, `vendors`, `rfqs` — filter `WHERE deleted_at IS NULL` everywhere
* All financial amounts: `DECIMAL(14,2)` — never `FLOAT`
* Document numbers generated inside Prisma transactions to prevent duplicates
* Activity logs: write-only, no update/delete endpoints or Prisma operations

### Indian Compliance (GST)

* GSTIN validation: 15-char format `/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/`
* Tax logic: CGST(9%) + SGST(9%) same state; IGST(18%) cross-state
* Invoice must include: Seller GSTIN, Buyer GSTIN, HSN/SAC per line, tax breakdown, PO reference
* Amount in words: Indian numbering system (Hundred, Thousand, Lakh, Crore)

### Environment Variables

```
DATABASE_URL=postgresql://...
JWT_SECRET=<min 32 char secret>
JWT_EXPIRES_IN=15m
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid api key>
FROM_EMAIL=noreply@vendorbridge.com
ORG_STATE=Gujarat        # used for CGST/SGST vs IGST logic
ORG_NAME=Your Company    # appears on invoice header
ORG_GSTIN=XXXXXXXXXXXX   # appears on invoice
ORG_ADDRESS=...          # appears on invoice
REDIS_URL=redis://...    # optional, for dashboard caching
```

---

*End of VendorBridge PRD v2.0*
*Simplified DB: 12 tables | No attachment tables | No token tables | No lookup tables*
*All 9 phases: Auth → Dashboard → Vendors → RFQs → Quotations → Approvals → PO+Invoice → Logs → Reports*

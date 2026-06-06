# 🌐 VendorBridge

> A premium, full-stack enterprise vendor portal and procurement management system. Seamlessly connect Procurement Officers, Managers, and Vendors to manage RFQs, Quotations, Purchase Orders, Approvals, and Invoicing in real-time.

---

## 🚀 Key Features by User Role

### 💼 Procurement Officers
*   **RFQ Management:** Create, publish, and edit Requests for Quotations (RFQs), specify items, and select vendors to invite.
*   **Quotation Review:** Review and compare multiple vendor quotations in a structured interface.
*   **PO Generation:** Convert approved quotations into official Purchase Orders (PO) automatically.

### 🏢 Managers
*   **Approval Queue:** Approve or reject critical workflow items, including RFQs, Quotations, Purchase Orders, and Invoices.
*   **Audit Logs:** Monitor structural changes, status updates, and user activity across the portal.

### 🤝 Vendors
*   **Portal Dashboard:** View invitations to RFQs and historical bids.
*   **Submit Quotations:** Provide pricing, delivery timelines, and detailed quotes for invited RFQs.
*   **Invoice Submission:** Upload and track status of invoices against issued Purchase Orders.

### 🛡️ Admins
*   **Role Management:** Add, configure, and manage user roles (Procurement Officers, Managers, Vendors, and Admins).
*   **System Controls:** Configure platform settings, email integrations, and overall dashboard status.

---

## 🛠️ Technology Stack

| Layer | Technologies & Frameworks | Key Libraries / Features |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4 | TanStack Query (React Query), React Router DOM v7, Zustand, React Hook Form, Zod |
| **Backend** | Node.js, Express.js (v5) | Sequelize ORM, PostgreSQL (`pg`), JSON Web Tokens (JWT), Bcrypt, Express Rate Limit, Helmet |
| **Emails** | NodeMailer | SMTP, Mailtrap, Google SMTP Integration |

---

## 📁 Repository Structure

```text
VendorBridge/
├── backend/                  # Express.js server & Database configuration
│   ├── src/
│   │   ├── config/           # Database, email, and app configuration
│   │   ├── controllers/      # Route controllers (Auth, RFQs, POs, Invoices, etc.)
│   │   ├── database/         # Sequelize migrations and seeders
│   │   ├── middlewares/      # Express middlewares (Auth, error handling, validation)
│   │   ├── models/           # Sequelize database models (User, RFQ, PO, etc.)
│   │   ├── routes/           # REST API route definitions
│   │   ├── services/         # Business logic layer (Email, PDF generation, etc.)
│   │   ├── utils/            # Helper utilities and custom error handlers
│   │   ├── validations/      # Joi request body validation schemas
│   │   └── server.js         # Entry point
│   ├── .env.example          # Environment variables template
│   └── package.json
│
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── api/              # Axios configuration and API interceptors
│   │   ├── components/       # Shared UI components (Layout, Modals, Tables)
│   │   ├── pages/            # Page views (Dashboard, RFQs, Invoices, etc.)
│   │   ├── routes/           # React Router v7 routes & Guarded routes
│   │   ├── store/            # Zustand global state management
│   │   ├── styles/           # Tailwind CSS index and custom tokens
│   │   └── App.jsx           # App wrapper with QueryClientProvider & Toaster
│   ├── .env.example          # Environment variables template
│   └── package.json
```

---

## ⚙️ Backend Setup & Installation

### 1. Configure Environment Variables
Navigate to the `backend` directory, duplicate the environment variables template, and configure your credentials:
```bash
cd backend
cp .env.example .env
```
Open the newly created `.env` file and fill in your details:
*   `DEV_DB_PASSWORD` (Your PostgreSQL password)
*   `JWT_SECRET` (For cryptographic token signing)
*   Choose your `DEFAULT_EMAIL_PROVIDER` (`smtp` for Google Gmail App Password, or `mailtrap` for developer testing sandbox) and fill in the corresponding mail credentials.

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration and Seeding
Create your local PostgreSQL database matching the name in your `.env` (default is `vendor_bridge_db`), then run:
```bash
# Run database migrations to create tables
npm run migrate

# Seed the database with default admin, officers, managers, and sample vendors
npm run seed-all
```

*For large datasets, you can optionally run:*
```bash
# Seed with extra mock data for testing performance and search lists
npm run seed-large
```

### 4. Run the Backend
```bash
# Starts Node server using nodemon for hot-reloading
npm run dev
```
By default, the server runs on [http://localhost:3000](http://localhost:3000).

---

## 💻 Frontend Setup & Installation

### 1. Configure Environment Variables
Navigate to the `frontend` directory, copy the template and review settings:
```bash
cd ../frontend
cp .env.example .env
```
Ensure that `VITE_API_BASE_URL` points to your backend instance (default: `http://localhost:3000/api/v1`).

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Frontend
```bash
# Run the Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛣️ API Endpoint Guide

Below are the key backend endpoints exposed under `/api/v1`:

| Route Category | Path | HTTP Method | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/auth/login` | `POST` | Authenticate user and receive JWT cookie |
| | `/auth/register` | `POST` | Register a new user account |
| | `/auth/forgot-password` | `POST` | Send reset-password email containing code |
| | `/auth/reset-password` | `POST` | Update password using verify token |
| **Users / Roles** | `/admins/` | `GET/POST` | Fetch/Register new Procurement Officers or Managers |
| | `/vendors/` | `GET/POST/PUT` | Manage vendor directory profiles |
| **RFQs** | `/rfqs` | `GET` | Retrieve RFQ list (filtered by role/status) |
| | `/rfqs` | `POST` | Create a new Request for Quotation |
| **Quotations** | `/quotations` | `POST` | Vendor submits a quotation for an RFQ |
| | `/quotations/:id` | `GET` | Retrieve quotation items and comparisons |
| **Approvals** | `/approvals` | `POST` | Update approval status (Approve/Reject) |
| **Purchase Orders** | `/purchase-orders`| `GET/POST` | View and dispatch POs to vendors |
| **Invoices** | `/invoices` | `POST` | Submit invoice against a PO |

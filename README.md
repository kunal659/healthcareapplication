
# Healthcare Assistant

Healthcare Assistant is a sophisticated, feature-rich web application that demonstrates a complete workflow for an AI-powered data analytics tool. It operates in two modes: a fully self-contained **frontend-only demo** using an in-browser SQLite database, and a powerful **live data mode** that connects to your local SQL Server, PostgreSQL, or MySQL databases via an included backend server.

This hybrid approach makes it a versatile showcase of modern web development, allowing users to either explore its features in a sandboxed environment or connect it to their own data for a real-world experience.

## Features

The application is built as a multi-purpose assistant with several key modules:

### 1. Core Authentication System
- **User Registration & Login:** Secure-feeling user onboarding with email/password validation.
- **Session Management:** Remembers logged-in users and provides a logout function.
- **Protected Routes:** Ensures that sensitive pages are only accessible to authenticated users.

### 2. User & API Key Management
- **User Profile:** A dedicated page for users to view their details and an AI-generated bio.
- **AI Bio Generation:** Integrates with the Gemini API (mocked) to generate a creative user bio.
- **Secure API Key Storage:** Add, manage, and store API keys. Keys are masked in the UI and mock-encrypted.
- **Key Rotation & Testing:** Set an "active" key, test its validity, and delete old keys.

### 3. Usage Dashboard
- **Cost & Usage Tracking:** Monitor API call volume and estimated costs against a user-defined monthly budget.
- **Budget Alerts:** The UI displays a warning when the estimated cost exceeds the set budget.
- **Audit Trail:** A detailed log of all API key-related activities for monitoring.

### 4. Database Connectivity Module
- **Live & Local Connections:** Add and manage connections for SQL Server, PostgreSQL, MySQL (requires backend), and SQLite (in-browser).
- **Interactive SQLite:** Upload your own `.db` or `.sqlite` file and query it directly in the browser.
- **Secure Credential Storage:** Database credentials are mock-encrypted before being saved.
- **Connection Testing & Status Monitoring:** Validate database credentials and view the live status of each connection.

### 5. Intelligent SQL Chat
- **Natural Language to SQL:** A conversational AI chat interface that converts plain English questions into SQL queries.
- **Schema-Aware Generation:** The AI (mocked Gemini) uses the schema of the selected database to generate accurate queries.
- **Live Query Execution:** When connected to a live database via the backend, queries are executed against your actual data.
- **Result Visualization:** Query results are displayed in a clean, paginated table.

### 6. Data Governance
- **Natural Language Rules:** Define security policies in plain English (e.g., "Block queries on the patients table").
- **AI Enforcement:** The AI chat will refuse to generate or execute queries that violate your active governance rules.

## Technology Stack

### Frontend
- **Framework/Library:** [React](https://reactjs.org/) (v19) with TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Routing:** [React Router](https://reactrouter.com/)
- **State Management:** React Context API
- **Forms:** [React Hook Form](https://react-hook-form.com/)
- **AI Integration:** Google Gemini API (`@google/genai`), mocked to run without a real API key.
- **Browser-side Database:** [sql.js](https://sql.js.org/) (SQLite via WebAssembly)

### Backend (Optional)
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express](https://expressjs.com/)
- **Database Driver:** [mssql](https://www.npmjs.com/package/mssql) for SQL Server connections.
- **Middleware:** `cors` for enabling communication between the frontend and backend.

## Getting Started

This application can be run in two modes.

### Mode 1: Frontend-Only Demo (Default)
The application works out-of-the-box with no installation required. In this mode, all data is stored in your browser's `localStorage`. You can use all features, but for database connections, only the **SQLite (File Upload)** type will be fully interactive. Other database types will use a high-fidelity simulated connection.

### Mode 2: Live Database Connection (Recommended)
To connect to a live SQL Server, MySQL, or PostgreSQL database on your local network, you need to run the included backend server.

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v18 or later) installed on your machine.

**Backend Setup:**
1.  **Install Dependencies:** Open a terminal in the project's root directory and run the following command. This will read the `package.json` file and install the required libraries (Express, mssql, etc.).
    ```bash
    npm install
    ```
2.  **Start the Server:** Run the following command to start the backend server.
    ```bash
    node server.js
    ```
3.  **Verify:** You should see a confirmation message in the terminal: `Backend server listening at http://localhost:3001`. The frontend will automatically communicate with this server when you add or query a networked database.

## Security Disclaimer
This application is a **demonstration project** and is **not suitable for production use.**
- The backend server is for development purposes and lacks production-grade security features like authentication, SSL, and comprehensive input sanitization.
- Features like password and credential encryption are **simulated** using basic client-side functions and are not secure.
- Do not use sensitive or production database credentials with this application.
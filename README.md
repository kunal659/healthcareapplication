# Healthcare Assistant

Healthcare Assistant is a feature-rich, frontend-only web application that demonstrates a wide range of functionalities, from secure user authentication to advanced AI-powered data interaction. It serves as a comprehensive showcase of modern web development practices, using an in-browser **SQLite** database via `sql.js` (WebAssembly) to provide a complete, interactive user experience without requiring a server.

## Features

The application is built as a multi-purpose assistant with several key modules:

### 1. Core Authentication System
- **User Registration & Login:** Secure-feeling user onboarding with email/password validation.
- **Email Verification:** Mock flow for new account activation.
- **Password Reset:** Complete "forgot password" and reset flow via simulated email links.
- **Protected Routes:** Ensures that sensitive pages are only accessible to authenticated users.
- **Session Management:** Remembers logged-in users and provides a logout function.

### 2. User & API Key Management
- **User Profile:** A dedicated page for users to view their details and an AI-generated bio.
- **AI Bio Generation:** Integrates with the Gemini API (mocked) to generate a creative user bio based on their email.
- **Secure API Key Storage:** Add, manage, and store API keys (e.g., for OpenAI/Gemini). Keys are masked in the UI and mock-encrypted in the database.
- **Key Rotation & Testing:** Set an "active" key for use across the application, test its validity, and delete old keys.

### 3. Usage Dashboard
- **Cost & Usage Tracking:** Monitor API call volume and estimated costs against a user-defined monthly budget.
- **Budget Alerts:** The UI displays a warning when the estimated cost exceeds the set budget.
- **Audit Trail:** A detailed log of all API key-related activities (creation, deletion, usage) for monitoring and security.

### 4. Database Connectivity Module
- **Multi-Database Support:** Add and manage connections for various SQL databases (PostgreSQL, MySQL, SQLite, etc.).
- **Secure Credential Storage:** Database credentials are mock-encrypted before being saved.
- **Connection Testing:** Validate database credentials with a "Test Connection" feature before saving.
- **Status Monitoring:** The UI displays the live status of each connection (Connected, Disconnected, Error) with periodic checks.

### 5. Intelligent SQL Chat
- **Natural Language to SQL:** A conversational AI chat interface that converts plain English questions into SQL queries.
- **Schema-Aware Generation:** The AI (mocked Gemini) uses the schema of the selected database to generate accurate and relevant `SELECT` queries.
- **Context-Aware Conversation:** The chat maintains context, allowing for natural follow-up questions.
- **Result Visualization:** Query results are displayed in a clean, paginated table for easy reading.

## Technology Stack

This application is built entirely with frontend technologies, demonstrating a modern client-side architecture.

- **Framework/Library:** [React](https://reactjs.org/) (v19) with TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Routing:** [React Router](https://reactrouter.com/)
- **State Management:** React Context API for global state (e.g., authentication).
- **Forms:** [React Hook Form](https://react-hook-form.com/) for robust and performant form validation.
- **AI Integration:** Google Gemini API (`@google/genai`), mocked to run without a real API key.
- **Browser-side Database:** [sql.js](https://sql.js.org/) (SQLite compiled to WebAssembly) for a complete in-browser relational database.

## How It Works: The In-Browser Backend

This application is designed to be a self-contained demo. It does not have a traditional server.

- **Data Persistence:** All application data (users, API keys, database connections) is stored in a single SQLite database file. This file is converted to a Base64 string and saved in your browser's `localStorage`. This means your data will persist if you refresh the page but will be isolated to your current browser.
- **Simulated Security:** Features like password and credential encryption are **simulated** using basic client-side functions. **This is for demonstration purposes only and is not secure for a production environment.**
- **Mock API Calls:** All external network requests (like testing connections or calling the Gemini API) are simulated using `setTimeout` to mimic network latency. The services return mock data, allowing the full UI and application logic to be tested without needing live credentials or backend infrastructure.

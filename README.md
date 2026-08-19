# 🌊 ReqFlow — AI Requirement-to-User Stories Generator

> **Turn messy requirement documents into structured Agile backlogs, test cases, and GitHub Issues in seconds.**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://www.langchain.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Table of Contents
- [About ReqFlow](#-about-reqflow)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Prerequisites](#-prerequisites)
- [How to Get Your API Keys](#-how-to-get-your-api-keys)
  - [1. OpenAI / OpenRouter API Key](#1-openai--openrouter-api-key)
  - [2. GitHub Personal Access Token (PAT)](#2-github-personal-access-token-pat)
- [Environment Configuration (`.env`)](#-environment-configuration-env)
- [How to Run the Project](#-how-to-run-the-project)
  - [Step 1: Start PostgreSQL Database](#step-1-start-postgresql-database)
  - [Step 2: Start the Backend (FastAPI)](#step-2-start-the-backend-fastapi)
  - [Step 3: Start the Frontend (React + Vite)](#step-3-start-the-frontend-react--vite)
- [User Walkthrough (How to Use)](#-user-walkthrough-how-to-use)
- [API Endpoints](#-api-endpoints)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 💡 About ReqFlow

Software projects often derail because requirements gathered from business stakeholders are vague, incomplete, or open to interpretation. Natural-language documents cause:
- Inconsistent or missing user stories.
- Vague acceptance criteria leading to scope creep.
- Slow, manual translation into sprint backlogs.
- Inadequate test cases and missed edge cases.

**ReqFlow** bridges this gap. It ingests raw requirements in **PDF, DOCX, or TXT** format, parses the text, and executes an intelligent **LLM pipeline** that detects ambiguities, structures Epics & User Stories (in standard `"As a... I want... So that..."` format), generates Gherkin Given-When-Then acceptance criteria, dev tasks, and test scenarios, and enables **1-click direct export to GitHub Issues**.

---

## ✨ Key Features

1. **Multi-Format Ingestion**: Upload `.pdf` (via PyMuPDF), `.docx` (via python-docx), or plain `.txt` files with instant client-side preview.
2. **AI Ambiguity Detection & Score**: Identifies vague statements (e.g. *"system should be fast"* or *"handle reasonable traffic"*), highlights the ambiguous excerpt, and suggests concrete improvements.
3. **Structured Agile Generation**:
   - **Epics**: Logical categorization of project modules.
   - **User Stories**: Follows strict Agile standard (`Role`, `Goal`, `Benefit`).
   - **Acceptance Criteria**: Formatted in Gherkin (`Given / When / Then`) scenarios.
   - **Development Tasks**: Actionable engineering tasks with priority (`High`, `Medium`, `Low`).
   - **Test Scenarios**: Pre-seeded QA test cases with step-by-step actions and expected outcomes.
4. **Interactive Review & Approval**: Inline story editing, status toggles (Draft / Approved / Rejected), and real-time status counters.
5. **1-Click GitHub Export**: Push approved stories directly into any GitHub repository as formatted issues complete with labels (`user-story`, `priority:high`, `epic:...`) and checklist markdown.
6. **Graceful Fallback Pipeline**: Built-in mock data pipeline fallback so local development and testing never stall due to network hiccups or LLM credit limits.

---

## 🏗️ Architecture & Tech Stack

```
ReqFlow/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── ai/               # LangChain prompt templates & pipeline
│   │   ├── api/              # REST Endpoints (upload, analyze, artifacts, export)
│   │   ├── core/             # Configuration & settings
│   │   ├── db/               # SQLAlchemy models & database session
│   │   ├── integrations/     # GitHub adapter
│   │   ├── models/           # DB tables (Documents, Epics, Stories, Criteria, etc.)
│   │   ├── parsing/          # PDF / DOCX / TXT text extraction
│   │   └── schemas/          # Pydantic validation schemas
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React 19 + Vite Application
│   ├── src/
│   │   ├── components/       # UploadZone, AgileDashboard, AmbiguityDashboard, ExportPanel
│   │   └── App.tsx           # Main application state & tabs
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml        # PostgreSQL service definition
```

### Tech Stack Details:
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Axios
- **Backend**: FastAPI (Python 3.10+), SQLAlchemy 2.0, Pydantic v2, PyMuPDF, python-docx
- **AI & LLM**: LangChain, OpenAI API / OpenRouter API
- **Database**: PostgreSQL 15 (Alpine)
- **DevOps / Target**: GitHub REST API (Issues)

---

## ⚙️ Prerequisites

Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 18 or later) & npm
- [Python](https://www.python.org/downloads/) (version 3.10 or later)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for running PostgreSQL) or a local PostgreSQL instance
- Git

---

## 🔑 How to Get Your API Keys

### 1. OpenAI / OpenRouter API Key

ReqFlow supports either standard OpenAI API or OpenRouter:

#### Option A: OpenAI API Key
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys).
2. Log in or create an account.
3. Click **Create new secret key**, give it a name, and copy the key (`sk-...`).
4. In `backend/.env`, set:
   ```ini
   OPENAI_API_KEY=sk-your-openai-api-key
   OPENAI_BASE_URL=https://api.openai.com/v1
   ```

#### Option B: OpenRouter API Key
1. Visit [OpenRouter](https://openrouter.ai/keys).
2. Sign in and click **Create Key**.
3. In `backend/.env`, set:
   ```ini
   OPENAI_API_KEY=sk-or-v1-your-openrouter-key
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   ```

---

### 2. GitHub Personal Access Token (PAT)

Required to export generated user stories to GitHub Issues:

1. Log into your [GitHub Account](https://github.com).
2. Click your **profile photo** in the top right corner → **Settings**.
3. On the left sidebar, scroll down to the bottom and click **Developer settings**.
4. Navigate to **Personal access tokens** → **Tokens (classic)** (or go directly to [github.com/settings/tokens](https://github.com/settings/tokens)).
5. Click **Generate new token** → **Generate new token (classic)**.
6. Provide a note (e.g. `ReqFlow Export`) and select an expiration.
7. Under **Select scopes**, check:
   - ✅ **`repo`** (Full control of private repositories) — *Needed to create issues and labels.*
   *(If exporting strictly to public repositories, `public_repo` is sufficient).*
8. Click **Generate token** and copy the generated token (`ghp_...`).
9. Paste it into `backend/.env` under `GITHUB_TOKEN`.

---

## 📝 Environment Configuration (`.env`)

### 1. Backend Configuration
Create a `.env` file in the `backend/` folder (`backend/.env`):

```ini
# PostgreSQL Connection URL
DATABASE_URL=postgresql://reqflow_user:reqflow_password@localhost:5432/reqflow

# AI / LLM Configuration
OPENAI_API_KEY=your_openai_or_openrouter_api_key
OPENAI_BASE_URL=https://api.openai.com/v1   # Or https://openrouter.ai/api/v1

# Server Port
PORT=8000

# Optional: Default GitHub PAT for backlog export
GITHUB_TOKEN=ghp_your_github_token_here
```

### 2. Frontend Configuration
Create a `.env` file in the `frontend/` folder (`frontend/.env`):

```ini
# Backend API Base URL
VITE_API_URL=http://localhost:8000
```

---

## 🚀 How to Run the Project

### Step 1: Start PostgreSQL Database

In the project root directory (`e:\ReqFlow`):

```powershell
docker compose up -d
```
> This starts a PostgreSQL container named `reqflow-db` exposed on port `5432`.

---

### Step 2: Start the Backend (FastAPI)

1. Open a terminal and navigate to `backend`:
   ```powershell
   cd e:\ReqFlow\backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Start the FastAPI server with live reload:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```

- **API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Step 3: Start the Frontend (React + Vite)

1. Open a **new terminal window** and navigate to `frontend`:
   ```powershell
   cd e:\ReqFlow\frontend
   ```

2. Install npm dependencies:
   ```powershell
   npm install
   ```

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

4. Open your browser at:
   👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🖥️ User Walkthrough (How to Use)

```
[ Upload Document (.pdf, .docx, .txt) ]
                  │
                  ▼
[ AI Analysis & Ambiguity Detection ]
                  │
                  ▼
[ Review & Edit Epics / User Stories / Acceptance Criteria ]
                  │
                  ▼
[ Approve User Stories (Status -> Approved) ]
                  │
                  ▼
[ 1-Click Export to GitHub Issues ]
```

1. **Upload Requirements**:
   - Drag & drop a `.pdf`, `.docx`, or `.txt` file, or select the provided sample requirement document.
   - Inspect the extracted text in the live preview panel.
2. **Trigger AI Analysis**:
   - Click **Analyze Requirements**.
   - ReqFlow parses the content, runs ambiguity scoring, and builds the full Agile hierarchy.
3. **Resolve Ambiguities**:
   - Check the **Ambiguity Report** tab to view flagged vague phrases and apply AI suggested rewrites.
4. **Review & Approve Agile Artifacts**:
   - Switch to the **Agile Board** tab to explore Epics and User Stories.
   - Expand stories to review Gherkin Acceptance Criteria, engineering tasks, and test scenarios.
   - Toggle stories to **Approved** status.
5. **Export to GitHub**:
   - Click **Export to GitHub**.
   - Enter your repository in `username/repo` format (e.g. `your-github-username/project-name`).
   - Click **Export Backlog**. ReqFlow generates GitHub issues with tags, checklists, and links.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server and database health check |
| `POST` | `/documents/upload` | Upload & extract text from PDF, DOCX, or TXT |
| `POST` | `/analyze/{doc_id}` | Trigger AI ambiguity detection & Agile artifact generation |
| `GET` | `/artifacts/{doc_id}` | Fetch all Epics, User Stories, Criteria, and Ambiguities |
| `PUT` | `/artifacts/stories/{story_id}` | Update user story content, title, or approval status |
| `PUT` | `/artifacts/ambiguities/{flag_id}` | Update ambiguity resolution status |
| `GET` | `/export/config` | Check if server has pre-configured GitHub credentials |
| `POST` | `/export/{doc_id}` | Export all approved user stories as GitHub Issues |

---

## ❓ Troubleshooting & FAQs

### 1. `GitHub API Error (404): Not Found`
- **Cause**: The repository name is incorrect, formatted wrongly, or your GitHub token lacks access.
- **Fix**:
  1. Ensure the repo format is `owner/repository` (e.g., `octocat/Hello-World`) or paste the full repository URL.
  2. Verify that your GitHub Personal Access Token (PAT) has the **`repo`** scope enabled.
  3. Ensure the repository exists and has **Issues** enabled under *Settings → General → Features*.

### 2. `Database connection error (500 / Health disconnected)`
- **Cause**: PostgreSQL is not running or credentials do not match.
- **Fix**: Run `docker compose up -d` in the root folder to spin up the container, then verify port `5432` is accessible.

### 3. `LLM Error / Insufficient credits (402)`
- **Cause**: OpenAI or OpenRouter account has run out of credits.
- **Fix**: Add credits to your LLM provider account. ReqFlow will automatically fall back to its internal mock generator so you can continue testing the UI and export flows without interruption.

---

## 📜 License
This project is developed as part of the DevOps Hackathon — *Accelerate Development with AI & DevOps*. Licensed under the [MIT License](LICENSE).

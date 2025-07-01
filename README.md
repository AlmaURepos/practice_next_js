# How to Run the Projects (FastAPI + Next.js)

## 1. Clone the Repository

```bash
git clone https://github.com/AlmaURepos/practice_next_js.git
cd practice_next_js
```

## 2. Create and Activate a Virtual Environment (once for all backends)

```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate
```

## 3. Install Dependencies and Run Backend for Each Project

For each backend:

```bash
cd project-folder/backend
pip install -r requirements.txt
fastapi dev main.py
```

> **Note:**
> - Replace `project-folder` with the actual project name (e.g., `project-7-json-guestbook`, `project-10-microblog-app`, etc.).
> - You can change the port if you want to run several projects at the same time (see fastapi dev docs).

## 4. Install and Run Frontend for Each Project

For each frontend:

```bash
cd ../frontend
pnpm install
pnpm dev
```

> **Note:**
> - If you don't have pnpm, install it: `npm install -g pnpm`
> - Use the same port as in the backend CORS settings (usually 3000 or 3001).

## 5. Typical Workflow

- For each project, run backend and frontend in separate terminals.
- Open the address shown in the terminal after starting the frontend (usually http://localhost:3000 or http://localhost:3001).

# Intelligent Event Command & Analytics Platform

AI-powered, role-based platform for event planning, live operations, and analytics.

## 1. System Modules and Detailed Logic

This section describes each role/module and its implemented logic in the current system.

### 1.1 Admin Module

Admin is responsible for monitoring, control, and governance across the platform.

Core responsibilities implemented:

- user oversight and cross-role visibility
- access to analytics endpoints and feedback streams
- system-level monitoring via dashboards and event data

Operational logic:

- Auth + authorization middleware validates JWT and role before protected routes.
- Admin can access data across events (not limited to one event manager scope).
- Admin receives real-time operational updates (including feedback and emergency broadcasts where configured).
- Admin can monitor event lifecycle data and analytics outputs from manager-level AI/analytics services.

### 1.2 Event Manager Module

Event Manager handles planning, coordination, and execution.

Core responsibilities implemented:

- create/edit/delete events
- define event type, venue, timing, expected audience, and budget
- manage logistics cart (resource quantities by category)
- assign and monitor volunteer missions/tasks
- run AI command center for readiness, budget, and optimization

Operational logic:

- Event creation enforces required fields and scheduling constraints.
- Commencement cannot be in the past; conclusion must be after commencement.
- Event manager can switch event context and trigger analytics/comparison APIs.
- Mission control supports task assignment, status tracking, and mission rescind actions.
- AI command flow:
	- client sends command to Node route
	- Node calls Python manager assistant first (RAG-grounded optimization)
	- JS fallback logic runs if Python path is unavailable
	- execution actions (e.g., suggested resource add) are applied via `/api/ai/execute`

### 1.3 Vendor Module

Vendor provides event services/resources.

Core responsibilities implemented:

- vendor role support in auth and role-based routes
- vendor references in event model and planning context
- resource-centric integration via logistics planning modules

Operational logic:

- vendor entities are associated with events and used as operational inputs in readiness/analytics context.
- manager module consumes vendor availability implicitly through planned resources and event association.

### 1.4 Volunteer Module

Volunteer performs on-ground operations.

Core responsibilities implemented:

- receives mission/task assignments
- updates task progress/status
- handles emergency/SOS signaling
- supports gate/check-in operations with QR workflows

Operational logic:

- manager creates mission -> stored in tasks -> volunteer dashboard fetches event tasks.
- real-time events are distributed through Socket.IO channels.
- emergency events are emitted and consumed by manager/admin channels for immediate response.
- volunteer productivity metrics (assigned/completed/critical closure rates) are computed for analytics.

### 1.5 Attendee Module

Attendee accesses ticketing and live experience features.

Core responsibilities implemented:

- event discovery and ticket booking
- ticket vault with QR ticket access
- live crowd status updates and attendee reporting
- feedback submission/edit (single feedback per attendee per event)
- attendee AI assistant for event Q&A

Operational logic:

- attendee books tickets with attendee details validation.
- live status subscribes to event room updates and displays crowd alerts in real time.
- attendee feedback uses upsert logic:
	- first submit creates record
	- later submit updates same record
	- sentiment is recalculated on updates
- attendee AI widget calls Python `/api/chat` endpoint.

## 2. All AI Integrations and Their Logic

This section lists all active AI integrations in the current codebase and how each works.

### 2.1 Attendee AI Chatbot (Python RAG)

Purpose:

- answer attendee event queries with concise, grounded responses

Pipeline logic:

1. Load event data from MongoDB (read-only).
2. Convert event records into text documents.
3. Generate embeddings with sentence-transformers (`all-MiniLM-L6-v2`).
4. Store vectors in FAISS index.
5. On question:
	 - retrieve top relevant event docs
	 - build strict context prompt
	 - ask Gemini with grounding constraints
	 - return compact answer (2-4 short sentences)
6. If context is unavailable, return explicit no-data message.

Anti-hallucination controls:

- context-only prompt instruction
- no fabricated answer instruction
- compact answer post-processing
- empty-knowledge-base guard and rebuild attempt

### 2.2 Manager AI Assistant (Python-first Optimization)

Purpose:

- provide readiness, budget, and logistics optimization support

Pipeline logic:

1. Manager command sent from UI to Node `/api/ai/command`.
2. Node proxies command to Python `/api/manager/chat-optimize`.
3. Python assistant builds event-specific context chunks from:
	 - event metadata
	 - logistics cart/resources
	 - task stats
	 - feedback NLP summary
	 - budget summary
4. Intent detection identifies budget/readiness/resource request.
5. Actionable response returned with structured payload:
	 - `message`
	 - `action` (e.g., `READINESS_UPDATE`, `BUDGET_SUMMARY`, `SUGGEST_RESOURCE`)
	 - `data` for execution/visualization
	 - `confidence`
6. If Python path fails, Node fallback logic provides recommendation continuity.

### 2.3 AI Execution Layer (Operational Actioning)

Purpose:

- convert recommendation into event plan updates

Logic:

- `/api/ai/execute` validates event and requested action.
- for `SUGGEST_RESOURCE`:
	- fetch resource
	- compute/add required quantity
	- upsert into logistics cart
	- persist event and return success payload

### 2.4 Feedback Sentiment AI/NLP Layer

Purpose:

- analyze attendee feedback sentiment for monitoring and analytics

Logic:

- feedback submit/update calls sentiment service/controller logic.
- sentiment labels/scores are persisted per feedback record.
- analytics aggregates trend and sentiment metrics across event timelines.

### 2.5 Comparison Analytics (Python + Node)

Purpose:

- provide audience and budget comparison metrics with suggestions

Logic:

1. Manager/Admin requests `/api/ai/comparison/:eventId`.
2. Node validates ownership/authorization.
3. Node sends normalized metrics to Python `/api/manager/comparison`.
4. Python returns:
	 - audience expected/actual/gap/attendance rate
	 - budget planned/spend/gap/utilization
	 - textual suggestions
5. Node enriches with volunteer productivity and sentiment analytics where applicable.

### 2.6 Readiness and Priority Optimization Logic

Purpose:

- tell what is critical to add and what is lower priority

Logic:

- event-type-based critical matrix defines required categories.
- existing logistics categories are compared against critical/supporting sets.
- output includes:
	- critical missing categories
	- supporting missing categories
	- lower-priority categories to reduce/remove
	- operational gaps (audience, budget, volunteers, vendors)

## 3. Technology and Library Inventory (Current)

### 3.1 Frontend

- react, react-dom
- react-router-dom
- axios
- framer-motion
- lucide-react
- react-hot-toast
- socket.io-client
- html5-qrcode
- qrcode.react
- clsx, tailwind-merge
- puppeteer
- vite + eslint + tailwind/postcss stack

### 3.2 Backend (Node)

- express
- mongoose
- socket.io
- bcryptjs
- jsonwebtoken
- cors
- dotenv
- cookie-parser
- nodemailer
- resend
- googleapis
- web-push
- pdfkit
- nodemon

### 3.3 Python AI/NLP

- flask
- flask-cors
- python-dotenv
- pymongo
- sentence-transformers
- faiss-cpu
- numpy
- transformers
- google-generativeai
- openai
- textblob
- vaderSentiment

## 4. Setup and Run

### 4.1 Install Dependencies

Server:

```bash
cd server
npm install
```

Client:

```bash
cd client
npm install
```

Python:

```bash
d:/Event_Management_Try_Again/.venv/Scripts/python.exe -m pip install -r requirements.txt
```

### 4.2 Environment Variables

Required:

- MONGO_URI
- JWT_SECRET
- GEMINI_API_KEY
- GEMINI_MODEL (optional)
- PYTHON_API_URL (default: http://localhost:5000)

OTP mail variables:

- EMAIL_SERVICE
- EMAIL_USER
- EMAIL_PASS
- EMAIL_FROM

Optional:

- MONGO_DB_NAME (force specific database for Python RAG)

### 4.3 Start Services

Python AI service:

```bash
d:/Event_Management_Try_Again/.venv/Scripts/python.exe app.py
```

Node API:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

## 5. Security and Governance Notes

- Keep API keys and secrets only in local env files.
- Never commit `.env` to git history.
- Rotate keys immediately if leak scanners flag exposure.

## License

MIT

# VSB Engineering College AI Chatbot & 3D Campus Guide

A modern, full-stack AI chatbot and 3D mascot interface built specifically for **VSB Engineering College, Karur** (Autonomous Institution, Anna University, NAAC 'A' Grade, NBA Accredited, TNEA Code: 2622).

---

## 🐧 3D Tech Penguin Mascot

The chatbot features the exact model:
`Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb`

- **Placement**: Prominently featured on the Welcome / Start Screen, and transitions to a compact companion badge during active conversations.
- **Dynamic Mascot States**:
  1. **Idle**: Gentle floating and rhythmic breathing sways.
  2. **Greeting**: Friendly right-wing wave and welcoming head nod.
  3. **Listening**: Attentive forward posture and listening tilt.
  4. **Thinking**: Curious lateral head tilt and subtle pacing bob.
  5. **Speaking**: Dynamic beak open-and-close cadence (`Beak_Lower`), speech bobbing, and vocal gestures.
  6. **Happy**: Celebratory bouncy hops and cheerful wing flutters.
  7. **Error / Confused**: Puzzled opposite head tilt and subtle confused shake when requested information is unavailable.
- **Model Hierarchy Inspection**: Inspects all nodes, bones, meshes, and embedded animations in real-time. Supports uploading replacement GLB files via the Admin Panel.

---

## 🎙️ Speech System (Text-to-Speech)

- Powered by browser `SpeechSynthesis` API.
- **Synchronized Mascot**: Automatically animates the 3D Penguin in the `speaking` state while speaking and transitions back to `idle` upon completion.
- **Controls**:
  - Global Voice Mute / Unmute switch.
  - Floating playback controller with **Pause**, **Resume**, and **Stop Voice** buttons.
  - Message-level "Speak" audio trigger on every assistant card.
- **Preemption**: Submitting a new message or clicking Stop immediately halts ongoing speech to prevent overlapping voices.
- Clean text parsing removes markdown formatting and code snippets before vocalization.

---

## 📚 College Knowledge Base & Document Processing

Authorized college administrators can upload official files in multiple formats:
- **Excel files** (`.xlsx`, `.xls`)
- **CSV files** (`.csv`)
- **PDF documents** (`.pdf`)
- **Word documents** (`.docx`)
- **Text files** (`.txt`)

### Processing Pipeline:
1. **Server-Side Extraction**:
   - `xlsx` parses sheets, tables, and rows into structured comma-separated data.
   - `pdf-parse` extracts document text and page strings.
   - `mammoth` extracts clean text from Word documents.
2. **Chunking & Indexing**: Automatically splits documents into overlapping context chunks.
3. **Retrieval-Augmented Generation (RAG)**: Answers are strictly grounded in uploaded institutional documents with citations. If information is not present, the assistant explicitly states that the data is unavailable and provides official college contact details.

---

## 🔒 Security & Admin Authorization

- **Gemini API Key**: Securely hosted server-side via `@google/genai` (never exposed to browser bundles).
- **Admin Access**: Protected via administrator secret key (default initial setup: `vsbadmin2025`).
- **File Upload Limits**: Restricted to 25MB with mimetype verification.
- **Non-destructive**: Unauthorized users cannot delete or alter college records.

---

## ⚡ Setup & Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (`.env`)
```env
# Required for AI generation:
GEMINI_API_KEY="your-gemini-api-key"

# Optional Supabase Integration:
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Admin Access Passcode:
ADMIN_SECRET="vsbadmin2025"
```

### 3. Run Locally (Development)
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```
Runs the full-stack server on port 3000 serving pre-built Vite assets and API endpoints.

---

## 🧪 Testing Checklist

1. **3D Mascot Viewer**: Test each of the 7 states (Idle, Greeting, Listening, Thinking, Speaking, Happy, Confused) using the interactive state tester.
2. **Speech Playback**: Ask a question; verify the answer is read aloud and the penguin moves its beak and head, and halts when clicking "Stop Voice".
3. **Verified Knowledge Retrieval**: Ask questions about VSB Engineering College:
   - TNEA code: `2622`
   - Autonomous status & NAAC 'A' grade
   - Departments, placements, hostel facilities, and college bus routes.
4. **Knowledge Boundary Handling**: Ask an unrelated question (e.g. secret recipes); verify the penguin enters the confused/error state and clarifies that the information is unavailable.
5. **Admin File Upload**: Click **Admin Panel** in the sidebar, enter `vsbadmin2025`, and upload an Excel, CSV, PDF, or Word document. Verify that the document is immediately indexed and answers incorporate the new information.

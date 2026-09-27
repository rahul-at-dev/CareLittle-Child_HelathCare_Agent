# 🩺 CareLittle AI - Pediatric Health Assistant

CareLittle AI is an evidence-based, AI-assisted child healthcare web application designed with a **Safety-First Architecture**. It empowers parents and caregivers to monitor child growth, track developmental milestones, maintain nutrition logs, run pediatric safety checks, and interact with a safety-guarded AI assistant grounded in curated medical evidence.

> **IMPORTANT SAFETY NOTICE**: CareLittle AI is an AI-assisted pediatric helper, **not an autonomous medical doctor**. It employs deterministic red-flag triage rules, country-configurable emergency contacts, and strict output safety validators. The LLM is **never** treated as the final authority for medical diagnoses, emergency decisions, or medication prescription/dosage generation.

---

## 🛠️ Technology Stack & AI Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + React Router v7 + Lucide Icons + React Markdown + Remark GFM
- **Backend**: Node.js + Express + TypeScript + Mongoose ORM + Express Rate Limit
- **Database**: MongoDB Atlas (`carelittle_db`) with Atlas Vector Search index support (`medical_knowledge_vector_index`)
- **Authentication**: Clerk SDK (`@clerk/clerk-react`, backend ownership token checks)
- **AI Gateway Integration (Phase 4)**:
  - **AI Gateway Provider**: OpenRouter (`https://openrouter.ai/api/v1`)
  - **Active AI Model**: `nvidia/nemotron-3-ultra-550b-a55b:free`
  - **Provider Abstraction**: Interfaced via `IAIProvider` and `OpenRouterProvider`
- **Medical RAG System (Phase 5)**:
  - **Local Embedding Provider**: `@xenova/transformers` (`sentence-transformers/all-MiniLM-L6-v2`, 384 dimensions)
  - **Vector Search Engine**: MongoDB Atlas Vector Search ($vectorSearch stage with category & age filtering)
  - **Provenance Registry**: Official sources from WHO, CDC, and NCBI/NLM with CC BY-NC-SA 3.0 IGO and Public Domain licenses
  - **Backend Citations**: Authoritative source citations generated directly from MongoDB records (independent of LLM output text)
- **Development Environment**: Windows-native

---

## 🧠 Phase 5 Medical RAG Architecture

```
User Question
    ↓
Phase 3 Deterministic Safety/Triage (Emergency? YES → Short-Circuit & Stop!)
    ↓
Query Preparation & Child Context (Age in Months, Allergies, Conditions)
    ↓
Local 384-Dim Vector Embedding (sentence-transformers/all-MiniLM-L6-v2)
    ↓
MongoDB Atlas Vector Search ($vectorSearch + Age / Category Filtering)
    ↓
Relevant Medical Evidence Retrieval (Top-K = 8, Cosine Similarity Thresholding)
    ↓
Context Builder (Structured Medical Evidence Block for Prompt)
    ↓
OpenRouter Nemotron LLM (nvidia/nemotron-3-ultra-550b-a55b:free)
    ↓
Output Safety Validator (Dosage, Diagnosis, Doctor Avoidance Checks)
    ↓
Backend-Generated Citations ([1] WHO — Title — p. 45)
    ↓
Frontend Chat Interface
```

### 📌 How Citations & No-Source Behavior Work
- **Authoritative Citations**: The backend generates source citations directly from database evidence records (`MedicalSource` and `MedicalKnowledgeChunk`). Citations are never parsed from LLM text.
- **No-Source Behavior**: If no medical source meets the relevance score threshold for a query, the system sets `grounding.status = "insufficient_evidence"` and returns zero fake citations. The AI is instructed to provide conservative general advice while explicitly noting that no grounded medical source was available.

---

## 🔒 External AI Provider & Privacy Disclosure

CareLittle AI currently utilizes **OpenRouter** as its external AI provider for processing non-emergency symptom queries with the `nvidia/nemotron-3-ultra-550b-a55b:free` model.

- **External Data Flow**: When a non-emergency health query is submitted to the AI Symptom Agent, relevant context (child age in months, allergies, chronic conditions, and recent conversation history) is transmitted to OpenRouter's API endpoints.
- **Data Policy Note**: OpenRouter is an external third-party service. CareLittle AI does not claim that medical queries never leave our infrastructure or that external providers never retain request logs.
- **Safety Interception**: Emergency red flags (such as neonatal fever, respiratory distress, or suspected poisoning) are intercepted locally by CareLittle's **Phase 3 Deterministic Triage Engine** and **are NEVER sent to OpenRouter or any third-party AI service**.

---

## ⚙️ Atlas Vector Search Index Setup

In MongoDB Atlas, create a Search Index on the `medicalknowledgechunks` collection named `medical_knowledge_vector_index` with the following JSON configuration:

```json
{
  "fields": [
    {
      "numDimensions": 384,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    },
    {
      "path": "metadata.category",
      "type": "filter"
    },
    {
      "path": "metadata.language",
      "type": "filter"
    },
    {
      "path": "metadata.ageMinMonths",
      "type": "filter"
    },
    {
      "path": "metadata.ageMaxMonths",
      "type": "filter"
    }
  ]
}
```

---

## 📁 Project Structure

```
CareLittle-AI/
├── client/                         # React + Vite Frontend SPA
│   ├── src/
│   │   ├── components/            # UI components & modals
│   │   ├── pages/                 # Route views (Landing, Dashboard, Hub, ChatPage)
│   │   ├── services/              # Axios API service
│   │   ├── App.tsx                # Client router
│   │   └── main.tsx               # Client entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                         # Node.js + Express Backend REST API
│   ├── src/
│   │   ├── agents/                # SymptomAgent
│   │   ├── config/                # Database & Country-aware emergency configs
│   │   ├── controllers/           # Health, Privacy, Child Profile, Chat controllers
│   │   ├── middleware/            # Auth, Rate Limiting, Error handling
│   │   ├── models/                # User, Child, SafetyEvent, Session, Message, MedicalSource, Chunk, IngestionBatch
│   │   ├── routes/                # Express API routes (/api/v1/...)
│   │   ├── safety/                # Phase 3 Deterministic Triage & Output Validator
│   │   ├── services/ai/           # IAIProvider & OpenRouterProvider
│   │   ├── services/rag/          # Phase 5 RAG (Embedding, Chunking, Retrieval, ContextBuilder, Citation, Ingestion)
│   │   ├── testPhase4.ts          # Automated Phase 4 tests
│   │   ├── testPhase5.ts          # Automated Phase 5 tests
│   │   └── index.ts               # Backend entry point
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ & npm
- MongoDB Atlas cluster or local MongoDB instance

### 1. Backend Setup & Medical Knowledge Ingestion

```bash
cd server
cp .env.example .env
# Ensure OPENROUTER_API_KEY is configured in server/.env
npm install

# Run Legal-Aware Medical Ingestion Workflow
npm run ingest:medical

# Run Phase 5 Automated Test Suite
npx tsx src/testPhase5.ts

# Start Development Server
npm run dev
```
The server will start on `http://localhost:5000` and automatically connect to MongoDB.

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```
The client will start on `http://localhost:5173`.

---

## 🧪 Testing Instructions

Run automated Phase 5 RAG and regression test suite:
```bash
cd server
npx tsx src/testPhase5.ts
```

Run real end-to-end integration test with OpenRouter and synthetic child data:
```bash
cd server
npx tsx src/testRealPhase5RAG.ts
```

---

## 📄 License
MIT License - Built for safe pediatric care.

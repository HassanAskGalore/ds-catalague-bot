# How to Run the PDF Chatbot

## Quick Start (System Already Set Up)

Since the system is already configured and running, you just need to start the services:

### Option 1: Using Existing Running Services

If Docker and the backend are already running (check with `docker ps` and visiting http://localhost:8000/health):

**Just start the frontend:**
```bash
cd pdf-chatbot/frontend
npm run dev
```

Then open: **http://localhost:3000**

---

### Option 2: Start Everything from Scratch

#### Step 1: Start Qdrant (Vector Database)
```bash
cd pdf-chatbot
docker-compose up -d qdrant
```

Wait 10 seconds for Qdrant to start, then verify:
```bash
curl http://localhost:6333/collections
```

#### Step 2: Start Backend API
Open a new terminal:
```bash
cd pdf-chatbot/backend
python -m api.main
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Verify backend is working:
```bash
curl http://localhost:8000/health
```

#### Step 3: Start Frontend
Open another terminal:
```bash
cd pdf-chatbot/frontend
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000
```

#### Step 4: Open the Application
Open your browser and go to: **http://localhost:3000**

---

## Testing the Chat

Try these sample queries:
- "What products are available?"
- "Tell me about aluminium conductors"
- "What are the specifications for suspension fittings?"
- "Show me products with part number 4326.01"

---

## Stopping the Services

### Stop Frontend
Press `Ctrl+C` in the frontend terminal

### Stop Backend
Press `Ctrl+C` in the backend terminal

### Stop Qdrant
```bash
cd pdf-chatbot
docker-compose down
```

---

## Re-ingesting the PDF (Only if needed)

If you need to re-index the PDF:

```bash
cd pdf-chatbot/backend
python ingest.py
```

This will:
1. Parse the PDF (55 pages)
2. Create 128 chunks with metadata
3. Generate embeddings
4. Store in Qdrant

Takes about 2-3 minutes.

---

## Troubleshooting

### Backend won't start
- Check if Qdrant is running: `docker ps`
- Check if port 8000 is free: `netstat -ano | findstr :8000`
- Verify .env file has Azure OpenAI credentials

### Frontend won't start
- Check if Node.js is installed: `node --version`
- Check if port 3000 is free: `netstat -ano | findstr :3000`
- Try: `cd frontend && npm install`

### No search results
- Verify Qdrant has data: `curl http://localhost:6333/collections/catalogue_chunks`
- Should show: `"points_count":128`
- If 0, run ingestion: `cd backend && python ingest.py`

### Docker issues
- Make sure Docker Desktop is running
- Check Docker status: `docker ps`
- Restart Docker Desktop if needed

---

## System Architecture

```
┌─────────────────┐
│   Browser       │
│  localhost:3000 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js        │
│  Frontend       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FastAPI        │
│  Backend        │
│  localhost:8000 │
└────────┬────────┘
         │
         ├──────────────┐
         ▼              ▼
┌─────────────┐  ┌──────────────┐
│   Qdrant    │  │ Azure OpenAI │
│ localhost:  │  │  Embeddings  │
│    6333     │  │   + GPT-4o   │
└─────────────┘  └──────────────┘
```

---

## Environment Variables

Make sure your `.env` file has:

```env
# Azure OpenAI - Embeddings
AZURE_OPENAI_EMBEDDING_API_KEY=your_key_here
AZURE_OPENAI_EMBEDDING_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small

# Azure OpenAI - LLM
AZURE_OPENAI_LLM_API_KEY=your_key_here
AZURE_OPENAI_LLM_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_OPENAI_LLM_DEPLOYMENT=gpt-4o

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Backend
BACKEND_URL=http://localhost:8000
```

---

## Current Status

✅ Qdrant running with 128 chunks indexed  
✅ Backend API operational on port 8000  
✅ Azure OpenAI services configured  
✅ System tested and working  

**You're ready to go!** Just start the frontend and begin chatting.





Manual Method (if you prefer):
Open 3 terminals:



Terminal 1 (Qdrant):
cd pdf-chatbot
docker-compose up -d qdrant



Terminal 2 (Backend):
cd pdf-chatbot/backend
python -m api.main



Terminal 3 (Frontend):
cd pdf-chatbot/frontend
npm run dev
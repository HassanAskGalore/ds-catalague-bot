# 🚀 RUN ME FIRST - Complete Setup Guide

## Current Status
✅ Backend configured with Camelot table extraction  
✅ Qdrant ready for indexing  
✅ Azure OpenAI configured  
⚠️ Need to install Ghostscript (for Camelot)  
⚠️ Need to re-index PDF with Camelot  
⚠️ Frontend needs npm install  

---

## IMPORTANT: Camelot Migration

We've switched from Docling to Camelot for better table extraction. You need to:

1. Install Ghostscript
2. Uninstall old dependencies
3. Install Camelot
4. Re-index the PDF

See `CAMELOT_SETUP.md` for detailed information.

---

## Quick Installation

### Option 1: Automated (Windows)
```bash
cd pdf-chatbot
INSTALL_CAMELOT.bat
```

### Option 2: Manual

#### Step 1: Install Ghostscript

**Windows:**
```bash
choco install ghostscript
# Or download from: https://ghostscript.com/releases/gsdnld.html
```

**Linux:**
```bash
sudo apt-get install ghostscript
```

**Mac:**
```bash
brew install ghostscript
```

#### Step 2: Uninstall Old Dependencies
```bash
pip uninstall -y docling transformers torch
```

#### Step 3: Install Camelot
```bash
cd pdf-chatbot/backend
pip install -r requirements.txt
```

#### Step 4: Test Camelot
```bash
python test_camelot.py
```

Expected output:
```
CAMELOT TABLE EXTRACTION TEST
======================================================================
Total pages: 55
Tables extracted: X
✓ Camelot is working!
```

---

## Complete Startup Instructions

### Step 1: Start Qdrant
```bash
cd pdf-chatbot
docker-compose up -d qdrant
```

Wait 10 seconds, then verify:
```bash
curl http://localhost:6333/collections
```

---

### Step 2: Re-Index PDF with Camelot (REQUIRED)

Since we switched to Camelot, you must re-index:

```bash
cd pdf-chatbot/backend
python ingest.py
```

Expected output:
```
[1/4] Parsing PDF with Camelot + PyMuPDF...
  ✓ Parsed 55 pages
  ✓ Extracted X tables
[2/4] Chunking by product sections...
  ✓ Created 128 chunks
[3/4] Generating embeddings...
  ✓ Generated 128 embeddings
[4/4] Storing in Qdrant...
  ✓ Chunks stored

INGESTION COMPLETE!
Total chunks indexed: 128
```

This takes 2-5 minutes.

---

### Step 3: Install Frontend Dependencies (First Time Only)
```bash
cd pdf-chatbot/frontend
npm install
```

---

### Step 4: Start All Services

Open **3 separate terminals**:

#### Terminal 1 - Qdrant (Already Running)
```bash
# Already started in Step 1
# Verify: curl http://localhost:6333/collections
```

---

#### Terminal 2 - Backend API
```bash
cd pdf-chatbot/backend
python -m api.main
```

Wait for:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Verify:
```bash
curl http://localhost:8000/health
```

---

#### Terminal 3 - Frontend
```bash
cd pdf-chatbot/frontend
npm run dev
```

Wait for:
```
ready - started server on 0.0.0.0:3000
```

---

### Step 5: Open the Application

```
http://localhost:3000
```

---

## Test the System

Try these queries to test table extraction:

1. **"Show all side ties"**
   - Should return structured table with L.-Nr., material, dimensions, weight

2. **"What products have breaking load above 100 kN?"**
   - Should filter table data properly

3. **"Compare specifications of oscillating top clamps"**
   - Should show structured comparison table

4. **"Find L.-Nr. 4326.01"**
   - Should return exact product details from table

---

## What's Different with Camelot?

### Before (PyMuPDF only):
```
Query: "show all side ties"
Result: ❌ Messy text, missing rows, no structure
```

### After (Camelot + PyMuPDF):
```
Query: "show all side ties"
Result: ✅ Structured table:
┌─────────┬──────────┬──────────┬────────┐
│ L.-Nr.  │ Material │ Cond. Ø  │ Weight │
├─────────┼──────────┼──────────┼────────┤
│ 4326.01 │ Alumin.  │ 9.0-16.5 │ 1.60kg │
└─────────┴──────────┴──────────┴────────┘
```

---

## Quick Reference

| Service | URL | Status Check |
|---------|-----|--------------|
| Frontend | http://localhost:3000 | Open in browser |
| Backend API | http://localhost:8000 | `curl http://localhost:8000/health` |
| Qdrant | http://localhost:6333 | `curl http://localhost:6333/collections` |

---

## Stopping Everything

1. **Frontend**: Press `Ctrl+C` in Terminal 3
2. **Backend**: Press `Ctrl+C` in Terminal 2
3. **Qdrant**: Run `docker-compose down`

---

## Troubleshooting

### "Ghostscript not found"
Install Ghostscript (see Step 1 above)

### "No tables extracted"
- Verify Ghostscript is installed: `gswin64c --version` (Windows) or `gs --version` (Linux/Mac)
- Check PDF is in backend directory
- Run test: `python test_camelot.py`

### "Import error: camelot"
```bash
pip install camelot-py[cv]
```

### Old Qdrant data
If you see old results, clear and re-index:
```bash
docker-compose down -v
docker-compose up -d qdrant
python ingest.py
```

---

## Quick Reference

| Service | URL | Status Check |
|---------|-----|--------------|
| Frontend | http://localhost:3000 | Open in browser |
| Backend API | http://localhost:8000 | `curl http://localhost:8000/health` |
| Qdrant | http://localhost:6333 | `curl http://localhost:6333/collections` |

---

## Stopping Everything

1. **Frontend**: Press `Ctrl+C` in Terminal 3
2. **Backend**: Press `Ctrl+C` in Terminal 2
3. **Qdrant**: Run `docker-compose down` in Terminal 1

---

## Troubleshooting

### "npm: command not found"
Install Node.js from: https://nodejs.org/ (version 18 or higher)

### "python: command not found"
Install Python from: https://www.python.org/ (version 3.10 or higher)

### "docker: command not found"
Install Docker Desktop from: https://www.docker.com/products/docker-desktop/

### Backend shows errors
Check your `.env` file has the correct Azure OpenAI credentials:
```bash
cd pdf-chatbot
notepad .env
```

### No search results in chat
Re-run the ingestion:
```bash
cd pdf-chatbot/backend
python ingest.py
```

### Port already in use
- Port 3000 (Frontend): Stop other Next.js apps
- Port 8000 (Backend): Stop other Python servers
- Port 6333 (Qdrant): Stop other Qdrant instances

Check what's using a port:
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :6333
```

---

## System Architecture

```
┌──────────────────────────────────────────────────┐
│                   Browser                        │
│              http://localhost:3000               │
└───────────────────┬──────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│              Next.js Frontend                    │
│         (React + TypeScript + Tailwind)          │
└───────────────────┬──────────────────────────────┘
                    │ HTTP POST /chat
                    ▼
┌──────────────────────────────────────────────────┐
│              FastAPI Backend                     │
│         http://localhost:8000/chat               │
│                                                  │
│  • Hybrid Search (Semantic + Keyword)           │
│  • Cross-encoder Reranking                      │
│  • GPT-4o Answer Generation                     │
└──────────┬────────────────────┬──────────────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌────────────────────────────┐
│     Qdrant       │  │     Azure OpenAI           │
│  Vector Store    │  │                            │
│  localhost:6333  │  │  • text-embedding-3-small  │
│                  │  │  • gpt-4o                  │
│  128 chunks      │  │                            │
│  indexed         │  │                            │
└──────────────────┘  └────────────────────────────┘
```

---

## What Happens When You Ask a Question?

1. **User types question** in the frontend
2. **Frontend sends** query to backend API
3. **Backend generates embedding** using Azure OpenAI
4. **Qdrant searches** for similar chunks (hybrid search)
5. **Reranker scores** and sorts results
6. **GPT-4o generates** answer from top chunks
7. **Backend returns** answer + sources
8. **Frontend displays** formatted response

---

## Next Steps

Once everything is running:

1. ✅ Test the chat with sample queries
2. ✅ Try different types of questions
3. ✅ Check the sources returned
4. ✅ Explore the catalogue content

---

## Need Help?

Check these files:
- `HOW_TO_RUN.md` - Detailed running instructions
- `SYSTEM_TEST_RESULTS.md` - Test results and verification
- `README.md` - Project overview
- `ARCHITECTURE.md` - Technical architecture

---

**You're all set! Start with Step 1 above and enjoy your PDF Chatbot! 🎉**

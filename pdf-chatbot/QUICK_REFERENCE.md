# Quick Reference - Camelot PDF Chatbot

## Installation (One-Time Setup)

```bash
# 1. Install Ghostscript
choco install ghostscript  # Windows
# OR download from: https://ghostscript.com/releases/gsdnld.html

# 2. Install Python dependencies
cd pdf-chatbot/backend
pip install -r requirements.txt

# 3. Test Camelot
python test_camelot.py

# 4. Start Qdrant
cd ..
docker-compose up -d qdrant

# 5. Index PDF (takes 2-5 minutes)
cd backend
python ingest.py

# 6. Install frontend
cd ../frontend
npm install
```

---

## Daily Startup (3 Commands)

```bash
# Terminal 1 - Qdrant (if not running)
docker-compose up -d qdrant

# Terminal 2 - Backend
cd pdf-chatbot/backend
python -m api.main

# Terminal 3 - Frontend
cd pdf-chatbot/frontend
npm run dev
```

Then open: http://localhost:3000

---

## Quick Shutdown

```bash
# Stop frontend: Ctrl+C in Terminal 3
# Stop backend: Ctrl+C in Terminal 2
# Stop Qdrant:
docker-compose down
```

---

## Test Queries

### Table Queries (Best with Camelot)
```
"Show all side ties"
"What products have breaking load above 100 kN?"
"Compare specifications of oscillating top clamps"
"Find L.-Nr. 4326.01"
"List all products with conductor diameter 9-16mm"
```

### General Queries
```
"What products are available?"
"Tell me about aluminium conductors"
"What are the specifications for suspension fittings?"
"Show me products on page 22"
```

---

## Health Checks

```bash
# Qdrant
curl http://localhost:6333/collections

# Backend
curl http://localhost:8000/health

# Frontend
# Open http://localhost:3000 in browser
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Ghostscript not found" | Install: `choco install ghostscript` |
| "No tables extracted" | Verify: `gs --version` or `gswin64c --version` |
| "Import error: camelot" | Run: `pip install camelot-py[cv]` |
| "Port already in use" | Kill process or use different port |
| "No search results" | Re-run: `python ingest.py` |
| Old data showing | Clear: `docker-compose down -v` then re-index |

---

## File Locations

```
pdf-chatbot/
├── backend/
│   ├── DS-Catalogue.pdf          ← Place PDF here
│   ├── ingest.py                 ← Run to index
│   ├── test_camelot.py           ← Test extraction
│   ├── requirements.txt          ← Dependencies
│   └── api/main.py               ← Start backend
├── frontend/
│   └── npm run dev               ← Start frontend
├── .env                          ← Azure credentials
└── docker-compose.yml            ← Qdrant config
```

---

## Key URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Qdrant: http://localhost:6333
- Qdrant Dashboard: http://localhost:6333/dashboard

---

## Important Commands

```bash
# Re-index PDF (after changes)
cd pdf-chatbot/backend
python ingest.py

# Test Camelot
python test_camelot.py

# Check Qdrant status
curl http://localhost:6333/collections

# Check backend health
curl http://localhost:8000/health

# View backend logs
# (Just watch Terminal 2 where backend is running)

# Clear all data and restart
docker-compose down -v
docker-compose up -d qdrant
python ingest.py
```

---

## What Camelot Does

1. **Extracts tables** from PDF with proper structure
2. **Preserves columns** (L.-Nr., Material, Dimensions, etc.)
3. **Maintains rows** (each product as separate row)
4. **Outputs DataFrames** for easy querying
5. **Converts to markdown** for embedding

**Result:** Your chatbot can now properly filter, compare, and query tabular data!

---

## Performance

- **Parsing**: 5-10 seconds (55 pages)
- **Indexing**: 2-5 minutes (first time)
- **Query**: <2 seconds
- **Memory**: ~500MB (vs 5GB with Docling)

---

## Support Files

- `CAMELOT_SETUP.md` - Detailed setup guide
- `MIGRATION_SUMMARY.md` - What changed from Docling
- `RUN_ME_FIRST.md` - Complete startup guide
- `README.md` - Project overview

---

**Quick Start:** Run `INSTALL_CAMELOT.bat` (Windows) for automated setup!

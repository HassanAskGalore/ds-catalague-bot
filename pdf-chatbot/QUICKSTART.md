# Quick Start Guide

## Step-by-Step Setup (5 minutes)

### 1. Environment Setup
```bash
cd pdf-chatbot
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-key-here
```

### 2. Start Qdrant Vector Database
```bash
docker-compose up -d qdrant
```

Wait 10 seconds for Qdrant to start, then verify:
```bash
curl http://localhost:6333/collections
```

### 3. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Run Ingestion (ONE TIME - takes 2-3 minutes)
```bash
python ingest.py
```

You should see:
```
[1/4] Parsing PDF with Docling...
[2/4] Chunking by product sections...
[3/4] Generating embeddings...
[4/4] Storing in Qdrant...
✅ INGESTION COMPLETE!
```

### 5. Start Backend API
```bash
python -m api.main
```

Keep this terminal open. API runs on http://localhost:8000

### 6. Start Frontend (New Terminal)
```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

### 7. Test It!

Open http://localhost:3000 in your browser.

Try these queries:
- "What is the weight of PK 20/II clamp?"
- "Show all suspension clamps"
- "What is L.-Nr. 2300.62?"
- "List products with breaking load above 200 kN"

## Troubleshooting

### "Qdrant connection failed"
```bash
docker-compose restart qdrant
# Wait 10 seconds, then retry
```

### "Module not found"
```bash
# Make sure you're in the backend directory
cd backend
pip install -r requirements.txt
```

### "Port already in use"
```bash
# Kill process on port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Then restart backend
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Testing the API Directly

```bash
# Health check
curl http://localhost:8000/health

# Chat query
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"What is the weight of PK 20/II clamp?\"}"

# Get all products
curl http://localhost:8000/products
```

## What's Next?

1. Read the full README.md for architecture details
2. Customize the system prompt in `backend/llm/chain.py`
3. Adjust chunking parameters in `backend/config.py`
4. Add more filters in the frontend
5. Deploy to production

## Architecture Flow

```
PDF → Docling Parser → Chunker (with metadata) → OpenAI Embeddings → Qdrant

User Query → Hybrid Search → Reranker → GPT-4o → Answer + Sources
```

## Key Files

- `backend/ingest.py` - Run once to index PDF
- `backend/api/main.py` - FastAPI server
- `backend/config.py` - All configuration
- `frontend/components/ChatWindow.tsx` - Main UI
- `docker-compose.yml` - Infrastructure setup

## Production Checklist

- [ ] Use Qdrant Cloud instead of local
- [ ] Add API authentication
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Use environment-specific configs
- [ ] Add error tracking (Sentry)
- [ ] Set up CI/CD
- [ ] Enable HTTPS
- [ ] Add user sessions
- [ ] Implement caching

Enjoy your hallucination-free catalogue chatbot! 
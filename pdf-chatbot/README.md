# Catalogue RAG Chatbot

Production-grade RAG (Retrieval-Augmented Generation) chatbot for Mosdorfer engineering product catalogue.

## Features

- **Hallucination-Free**: Strict guardrails ensure answers come only from the catalogue
- **Hybrid Search**: Combines BM25 keyword search with semantic search
- **Advanced Reranking**: Cross-encoder reranking for optimal relevance
- **Rich Metadata**: Every answer includes product name, page number, and part numbers
- **Table-Aware**: Preserves complex tables with specifications
- **Filtered Search**: Filter by product type, section, standards, etc.

## Tech Stack

### Backend
- **PDF Parsing**: Camelot (table extraction) + PyMuPDF (text extraction)
- **Chunking**: LlamaIndex (section-based, table-aware)
- **Embeddings**: Azure OpenAI text-embedding-3-small (1536 dims)
- **Vector DB**: Qdrant (hybrid search enabled)
- **Retrieval**: BM25 + Semantic + RRF + Cross-Encoder
- **LLM**: Azure OpenAI GPT-4o with strict guardrails
- **API**: FastAPI

### Frontend
- **Framework**: Next.js 14
- **Styling**: TailwindCSS
- **UI**: Dark theme with cyan accents

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- Ghostscript (for Camelot table extraction)
- Azure OpenAI API credentials

### 1. Install Ghostscript

Camelot requires Ghostscript for PDF processing:

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

### 2. Setup Environment

```bash
# Clone or navigate to project
cd pdf-chatbot

# Copy environment file
cp .env.example .env

# Edit .env and add your Azure OpenAI credentials
```

### 3. Place PDF

Copy `DS-Catalogue.pdf` to the backend directory:
```bash
cp /path/to/DS-Catalogue.pdf ./pdf-chatbot/backend/
```

### 4. Start Qdrant

```bash
docker-compose up -d qdrant
```

### 5. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 6. Test Camelot (Optional)

Verify Camelot table extraction works:
```bash
python test_camelot.py
```

### 7. Run Ingestion (ONE TIME)

This parses the PDF with Camelot and indexes it in Qdrant:

```bash
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
  ✓ Collection created
  ✓ Chunks stored

INGESTION COMPLETE!
Total chunks indexed: 128
```

### 8. Start Backend API

```bash
python -m api.main
```

API will be available at `http://localhost:8000`

### 9. Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Usage

### Example Queries

1. **Specific Product Info**:
   - "What is the weight of PK 20/II clamp?"
   - "Show specifications for DST20G insulator pin"

2. **Part Number Lookup**:
   - "What is L.-Nr. 2300.62?"
   - "Find part number 4210.15/1"

3. **Filtered Search**:
   - "Show all suspension clamps for conductor diameter 9-16mm"
   - "List products with breaking load above 200 kN"

4. **Material/Standards**:
   - "What is the material of oscillating top clamp?"
   - "Show all IEC standard products"

### Using Filters

Click "Show Filters" to filter by:
- Product type (clamp, insulator, connector, etc.)
- Catalogue section (17 or 19)
- Products with tables only

## API Endpoints

### POST /chat
```json
{
  "query": "What is the weight of PK 20/II?",
  "filters": {
    "product_type": "clamp",
    "catalogue_section": "17"
  }
}
```

Response:
```json
{
  "answer": "The PK 20/II weighs 0.56 kg [Product: Oscillating Top Clamp | Page: 5 | L.-Nr.: 2300.62]",
  "sources": [...],
  "chunks_used": 5
}
```

### GET /health
Check system health and Qdrant connection

### GET /products
List all unique products in the catalogue

## Architecture

```
User Query
    ↓
Hybrid Search (BM25 + Semantic)
    ↓
Reciprocal Rank Fusion
    ↓
Cross-Encoder Reranking (top 5)
    ↓
GPT-4o with Context + Guardrails
    ↓
Answer + Citations
```

## Metadata Schema

Every chunk is tagged with:
- source_file
- catalogue_section (17 or 19)
- section_name
- page_number
- product_name
- product_type
- part_numbers (L.-Nr.)
- material
- standards (IEC, ÖNORM)
- has_table
- chunk_type

## Development

### Run with Docker Compose

```bash
docker-compose up --build
```

This starts:
- Qdrant (port 6333)
- Backend API (port 8000)
- Frontend (port 3000)

### Testing

Test queries:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the weight of PK 20/II clamp?"}'
```

### Logs

Backend logs show:
- Query processing
- Search results count
- Reranking scores
- LLM responses

## Troubleshooting

### Qdrant Connection Failed
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Restart Qdrant
docker-compose restart qdrant
```

### No Results Found
- Ensure ingestion completed successfully
- Check collection exists: `GET /health`
- Verify PDF path in config

### Slow Responses
- First query loads models (cross-encoder)
- Subsequent queries are faster
- Consider GPU for production

## Production Deployment

1. Use managed Qdrant Cloud
2. Set up proper API authentication
3. Enable rate limiting
4. Use production OpenAI tier
5. Add monitoring (Sentry, DataDog)
6. Enable HTTPS
7. Set up CI/CD pipeline

## License

MIT

## Support

For issues or questions, please open a GitHub issue.

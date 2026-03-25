# Architecture Documentation

## System Overview

The Catalogue RAG Chatbot is a production-grade retrieval-augmented generation system designed to provide hallucination-free answers from the Mosdorfer engineering product catalogue.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Next.js + TailwindCSS)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Chat Window  │  │ Source Cards │  │   Filters    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    /chat Endpoint                         │  │
│  │  1. Receive query + filters                              │  │
│  │  2. Hybrid search (BM25 + Semantic)                      │  │
│  │  3. Reciprocal Rank Fusion                               │  │
│  │  4. Cross-encoder reranking                              │  │
│  │  5. GPT-4o generation                                    │  │
│  │  6. Return answer + sources                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Qdrant     │    │   OpenAI     │    │ Sentence     │
│  Vector DB   │    │  Embeddings  │    │ Transformers │
│              │    │   + GPT-4o   │    │  (Reranker)  │
│ - Dense Vec  │    │              │    │              │
│ - Sparse Vec │    │              │    │              │
│ - Metadata   │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Data Flow

### Ingestion Pipeline (Run Once)

```
DS-Catalogue.pdf
    │
    ▼
┌─────────────────────┐
│  Docling Parser     │  ← Table-aware PDF parsing
│  + PyMuPDF fallback │
└──────────┬──────────┘
           │ Structured text + tables
           ▼
┌─────────────────────┐
│  Section Chunker    │  ← Split by product sections
│  + Metadata Tagger  │     Keep tables intact
└──────────┬──────────┘
           │ Chunks with metadata
           ▼
┌─────────────────────┐
│  OpenAI Embeddings  │  ← text-embedding-3-small
│  (1536 dimensions)  │     Generate dense vectors
└──────────┬──────────┘
           │ Embeddings
           ▼
┌─────────────────────┐
│  Qdrant Storage     │  ← Store vectors + metadata
│  - Dense vectors    │     Create indexes
│  - Sparse vectors   │
│  - Payload indexes  │
└─────────────────────┘
```

### Query Pipeline (Every Request)

```
User Query: "What is the weight of PK 20/II?"
    │
    ▼
┌─────────────────────┐
│  Query Processing   │
│  - Parse filters    │
│  - Detect intent    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│      Hybrid Search                  │
│  ┌─────────────┐  ┌──────────────┐ │
│  │  Semantic   │  │   Keyword    │ │
│  │  (Dense)    │  │   (BM25)     │ │
│  │  Top 10     │  │   Top 10     │ │
│  └──────┬──────┘  └──────┬───────┘ │
│         │                 │         │
│         └────────┬────────┘         │
│                  ▼                  │
│      ┌──────────────────┐          │
│      │  RRF Fusion      │          │
│      │  (k=60)          │          │
│      └──────────────────┘          │
└──────────────┬──────────────────────┘
               │ Merged results
               ▼
┌─────────────────────┐
│  Cross-Encoder      │  ← Rerank with ms-marco
│  Reranking          │     Keep top 5
└──────────┬──────────┘
           │ Top 5 chunks
           ▼
┌─────────────────────┐
│  Context Builder    │  ← Format chunks with metadata
│  - Product name     │     for LLM context
│  - Page number      │
│  - Part numbers     │
│  - Specifications   │
└──────────┬──────────┘
           │ Formatted context
           ▼
┌─────────────────────┐
│  GPT-4o Generation  │  ← Strict system prompt
│  - Temperature: 0   │     Guardrails enabled
│  - Max tokens: 1500 │     Citation required
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Response           │
│  - Answer text      │
│  - Source citations │
│  - Metadata         │
└─────────────────────┘
```

## Component Details

### 1. PDF Parser (Docling)

**Purpose**: Extract text and tables from PDF while preserving structure

**Key Features**:
- OCR support for scanned pages
- Table structure detection
- Cell matching for complex tables
- Page number tracking
- PyMuPDF fallback for reliability

**Output**: Structured document with markdown and metadata

### 2. Chunker (LlamaIndex)

**Purpose**: Split document into searchable chunks with metadata

**Strategy**:
- Section-based splitting (one product = one chunk)
- Table preservation (never split tables)
- Size constraints (100-800 tokens)
- Overlap for context (50 tokens)

**Metadata Extraction**:
- Product name from headings
- Part numbers via regex
- Material descriptions
- Standards (IEC, ÖNORM)
- Page numbers
- Section classification

### 3. Embeddings (OpenAI)

**Model**: text-embedding-3-small
**Dimensions**: 1536
**Cost**: $0.02 per 1M tokens

**Why this model**:
- High quality for technical content
- Good balance of performance/cost
- Supports large batch sizes
- Consistent with GPT-4o

### 4. Vector Store (Qdrant)

**Why Qdrant**:
- Native hybrid search support
- Sparse + dense vectors
- Metadata filtering
- Self-hosted option
- High performance

**Collection Schema**:
```python
{
  "vectors": {
    "dense": {
      "size": 1536,
      "distance": "Cosine"
    },
    "sparse": {
      "index": "BM25-style"
    }
  },
  "payload_indexes": [
    "product_type",      # keyword
    "catalogue_section", # keyword
    "page_number",       # integer
    "has_table",         # bool
    "part_numbers",      # keyword array
    "standards"          # keyword array
  ]
}
```

### 5. Hybrid Search

**Semantic Search** (Dense Vectors):
- Captures meaning and context
- Good for: "products for high voltage"
- Uses cosine similarity

**Keyword Search** (Sparse Vectors):
- Exact term matching
- Good for: part numbers, model codes
- BM25-style scoring

**Reciprocal Rank Fusion**:
```python
score(doc) = sum(1 / (rank_semantic + k)) + sum(1 / (rank_keyword + k))
where k = 60
```

### 6. Reranker (Cross-Encoder)

**Model**: cross-encoder/ms-marco-MiniLM-L-6-v2

**Why Reranking**:
- Bi-encoder (embeddings) is fast but less accurate
- Cross-encoder is slow but very accurate
- Two-stage approach: fast retrieval → accurate reranking

**Process**:
1. Take top 10 from hybrid search
2. Score each with cross-encoder
3. Return top 5 for LLM

### 7. LLM Chain (GPT-4o)

**Model**: gpt-4o
**Temperature**: 0 (deterministic)
**Max Tokens**: 1500

**System Prompt Guardrails**:
1. Answer ONLY from context
2. Never hallucinate specifications
3. Always cite sources
4. Exact values only (no rounding)
5. List all matches if multiple
6. Say "not available" if uncertain

**Context Format**:
```
---
Product: Oscillating Top Clamp
Page: 5
Section: Distribution OHL Fittings (17)
Part Numbers: 2300.62, 2300.63
Material: aluminium, casted
Standards: IEC

[chunk text here]
---
```

## Metadata Schema

Every chunk carries this metadata:

```python
{
  # Document level
  "source_file": "DS-Catalogue.pdf",
  "catalogue_section": "17",  # or "19"
  "section_name": "Distribution OHL Fittings",
  "page_number": 5,
  
  # Product level
  "product_name": "Oscillating Top Clamp",
  "product_type": "clamp",
  "part_numbers": ["2300.62", "2300.63"],
  "material": "aluminium, casted",
  
  # Spec level
  "has_table": True,
  "standards": ["IEC"],
  "conductor_type": "aluminium based",
  
  # Chunk level
  "chunk_type": "table",
  "chunk_index": 42
}
```

## API Endpoints

### POST /chat

**Request**:
```json
{
  "query": "What is the weight of PK 20/II?",
  "filters": {
    "product_type": "clamp",
    "catalogue_section": "17",
    "has_table": true
  }
}
```

**Response**:
```json
{
  "answer": "The PK 20/II weighs 0.56 kg...",
  "sources": [
    {
      "product_name": "Oscillating Top Clamp",
      "page_number": 5,
      "part_numbers": ["2300.62"],
      "catalogue_section": "17",
      "material": "aluminium, casted",
      "standards": ["IEC"]
    }
  ],
  "chunks_used": 5
}
```

### GET /health

**Response**:
```json
{
  "status": "ok",
  "qdrant": "connected",
  "collection_info": {
    "name": "catalogue_chunks",
    "points_count": 120,
    "status": "green"
  }
}
```

### GET /products

**Response**:
```json
{
  "products": [
    {"name": "Oscillating Top Clamp", "type": "clamp"},
    {"name": "Insulator Pin", "type": "insulator"}
  ],
  "total": 45
}
```

## Performance Characteristics

### Ingestion
- Time: ~2-3 minutes for 50-page PDF
- Chunks: ~100-150 chunks
- Storage: ~50MB in Qdrant

### Query
- Cold start: ~3-5 seconds (model loading)
- Warm queries: ~1-2 seconds
- Breakdown:
  - Embedding: 100ms
  - Search: 50ms
  - Reranking: 500ms
  - LLM: 1-2s

### Scalability
- Qdrant: Millions of vectors
- Concurrent users: 10-100 (single instance)
- Rate limits: OpenAI API limits

## Security Considerations

1. **API Authentication**: Add JWT or API keys
2. **Rate Limiting**: Prevent abuse
3. **Input Validation**: Sanitize queries
4. **CORS**: Restrict origins
5. **Secrets Management**: Use env vars
6. **Logging**: Audit all queries
7. **Error Handling**: Don't leak internals

## Monitoring

**Key Metrics**:
- Query latency (p50, p95, p99)
- Search accuracy (user feedback)
- LLM token usage
- Error rates
- Qdrant performance

**Tools**:
- FastAPI metrics endpoint
- Prometheus + Grafana
- Sentry for errors
- OpenAI usage dashboard

## Cost Estimation

**Per 1000 queries**:
- Embeddings: $0.02 (1000 queries × 20 tokens)
- GPT-4o: $15 (1000 queries × 1500 tokens output)
- Qdrant: Free (self-hosted)
- Total: ~$15/1000 queries

**Optimization**:
- Cache common queries
- Use GPT-4o-mini for simple queries
- Batch embeddings
- Reduce context size

## Future Enhancements

1. **Multi-document support**: Index multiple catalogues
2. **User feedback loop**: Learn from corrections
3. **Query suggestions**: Autocomplete
4. **Export functionality**: PDF reports
5. **Comparison mode**: Compare products
6. **Image support**: Show product images
7. **Multi-language**: Translate queries/answers
8. **Analytics dashboard**: Usage insights

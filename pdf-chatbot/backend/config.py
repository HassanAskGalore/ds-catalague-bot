import os
from dotenv import load_dotenv

load_dotenv()

# Azure OpenAI Configuration - Embeddings
AZURE_OPENAI_EMBEDDING_API_KEY = os.getenv("AZURE_OPENAI_EMBEDDING_API_KEY", "")
AZURE_OPENAI_EMBEDDING_ENDPOINT = os.getenv("AZURE_OPENAI_EMBEDDING_ENDPOINT", "")
AZURE_OPENAI_EMBEDDING_DEPLOYMENT = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")
AZURE_OPENAI_EMBEDDING_API_VERSION = os.getenv("AZURE_OPENAI_EMBEDDING_API_VERSION", "2024-12-01-preview")

# Azure OpenAI Configuration - LLM
AZURE_OPENAI_LLM_API_KEY = os.getenv("AZURE_OPENAI_LLM_API_KEY", "")
AZURE_OPENAI_LLM_ENDPOINT = os.getenv("AZURE_OPENAI_LLM_ENDPOINT", "")
AZURE_OPENAI_LLM_DEPLOYMENT = os.getenv("AZURE_OPENAI_LLM_DEPLOYMENT", "gpt-4o")
AZURE_OPENAI_LLM_API_VERSION = os.getenv("AZURE_OPENAI_LLM_API_VERSION", "2024-12-01-preview")

# Qdrant Configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "catalogue_chunks")

# PDF Configuration
PDF_PATH = os.getenv("PDF_PATH", "./DS-Catalogue.pdf")

# Backend Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Embedding Configuration
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536

# Retrieval Configuration
HYBRID_SEARCH_TOP_K = 60  # Increased from 50 for maximum recall
RERANK_TOP_N = 35  # Increased from 25 to pass even more chunks to LLM
RRF_K = 60

# LLM Configuration
LLM_MODEL = "gpt-4o"
LLM_TEMPERATURE = 0
LLM_MAX_TOKENS = 1500

# Chunking Configuration
MIN_CHUNK_SIZE = 100
MAX_CHUNK_SIZE = 800
CHUNK_OVERLAP = 50

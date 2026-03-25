"""
Ingestion pipeline - Run this ONCE to index the PDF
Parses, chunks, embeds, and stores in Qdrant
"""

import sys
import logging
from ingestion.parser import CatalogueParser
from ingestion.chunker import CatalogueChunker
from embeddings.embedder import setup_embeddings, get_embeddings_batch
from vectorstore.qdrant_store import QdrantStore
import config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_ingestion(pdf_path: str):
    """
    Complete ingestion pipeline
    
    Steps:
    1. Parse PDF with Docling
    2. Chunk by sections with metadata
    3. Generate embeddings
    4. Store in Qdrant
    """
    
    print("=" * 60)
    print("CATALOGUE INGESTION PIPELINE")
    print("=" * 60)
    
    # Step 1: Parse PDF
    print("\n[1/4] Parsing PDF with Camelot + PyMuPDF...")
    parser = CatalogueParser()
    parsed = parser.parse(pdf_path)
    print(f"  ✓ Parsed {parsed['total_pages']} pages")
    print(f"  ✓ Extracted {len(parsed['structured']['tables'])} tables")
    
    # Step 2: Chunk by sections
    print("\n[2/4] Chunking by product sections...")
    chunker = CatalogueChunker(
        min_chunk_size=config.MIN_CHUNK_SIZE,
        max_chunk_size=config.MAX_CHUNK_SIZE,
        overlap=config.CHUNK_OVERLAP
    )
    chunks = chunker.chunk_by_section(parsed)
    print(f"  ✓ Created {len(chunks)} chunks")
    
    # Display sample metadata
    if chunks:
        print("\n  Sample chunk metadata:")
        sample = chunks[0].metadata
        for key, value in sample.items():
            print(f"    - {key}: {value}")
    
    # Step 3: Generate embeddings
    print("\n[3/4] Generating embeddings...")
    embed_model = setup_embeddings()
    
    texts = [chunk.text for chunk in chunks]
    embeddings = get_embeddings_batch(texts, embed_model)
    print(f"  ✓ Generated {len(embeddings)} embeddings")
    
    # Step 4: Store in Qdrant
    print("\n[4/4] Storing in Qdrant...")
    store = QdrantStore()
    
    # Create collection
    store.create_collection()
    print("  ✓ Collection created")
    
    # Upsert chunks
    store.upsert_chunks(chunks, embeddings)
    print("  ✓ Chunks stored")
    
    # Verify
    info = store.get_collection_info()
    print("\n" + "=" * 60)
    print("INGESTION COMPLETE!")
    print("=" * 60)
    if info:
        print(f"Collection: {info['name']}")
        print(f"Total chunks indexed: {info['points_count']}")
        print(f"Status: {info['status']}")
    else:
        print("Collection created successfully!")
        print("(Could not retrieve detailed collection info)")
    print("\nYou can now start the API server:")
    print("  python -m api.main")
    print("=" * 60)


if __name__ == "__main__":
    pdf_path = config.PDF_PATH
    
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    
    print(f"\nPDF Path: {pdf_path}")
    
    try:
        run_ingestion(pdf_path)
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        sys.exit(1)

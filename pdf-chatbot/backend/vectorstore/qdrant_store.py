"""
Qdrant vector store with hybrid search support
Stores dense (semantic) and sparse (BM25) vectors
"""

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    SparseVectorParams, SparseIndexParams,
    PayloadSchemaType, PayloadSchemaParams
)
import logging
from typing import List
from config import QDRANT_HOST, QDRANT_PORT, QDRANT_COLLECTION, EMBEDDING_DIMENSIONS

logger = logging.getLogger(__name__)


class QdrantStore:
    """Qdrant vector database operations"""
    
    def __init__(self):
        self.client = QdrantClient(
            host=QDRANT_HOST,
            port=QDRANT_PORT
        )
        self.collection_name = QDRANT_COLLECTION
        self.vector_size = EMBEDDING_DIMENSIONS
        logger.info(f"Connected to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}")
    
    def create_collection(self):
        """Create collection with dense and sparse vector support"""
        try:
            # Delete if exists
            try:
                self.client.delete_collection(self.collection_name)
                logger.info(f"Deleted existing collection: {self.collection_name}")
            except:
                pass
            
            # Create new collection
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "dense": VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE
                    )
                },
                sparse_vectors_config={
                    "sparse": SparseVectorParams(
                        index=SparseIndexParams(on_disk=False)
                    )
                }
            )
            
            # Create payload indexes for filtering
            self._create_payload_indexes()
            
            logger.info(f"Created collection: {self.collection_name}")
            
        except Exception as e:
            logger.error(f"Failed to create collection: {e}")
            raise
    
    def _create_payload_indexes(self):
        """Create indexes on metadata fields for fast filtering"""
        indexes = [
            ("product_type", PayloadSchemaType.KEYWORD),
            ("catalogue_section", PayloadSchemaType.KEYWORD),
            ("page_number", PayloadSchemaType.INTEGER),
            ("has_table", PayloadSchemaType.BOOL),
            ("part_numbers", PayloadSchemaType.KEYWORD),
            ("standards", PayloadSchemaType.KEYWORD),
        ]
        
        for field_name, schema_type in indexes:
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field_name,
                    field_schema=PayloadSchemaParams(type=schema_type)
                )
                logger.info(f"Created index on: {field_name}")
            except Exception as e:
                logger.warning(f"Could not create index on {field_name}: {e}")
    
    def upsert_chunks(self, chunks: List, embeddings: List):
        """
        Insert chunks with embeddings into Qdrant
        
        Args:
            chunks: List of Document objects with metadata
            embeddings: List of embedding vectors
        """
        if len(chunks) != len(embeddings):
            raise ValueError("Chunks and embeddings must have same length")
        
        points = []
        
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point = PointStruct(
                id=idx,
                vector={
                    "dense": embedding
                },
                payload={
                    "text": chunk.text,
                    **chunk.metadata  # All metadata fields
                }
            )
            points.append(point)
        
        # Batch upsert
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            self.client.upsert(
                collection_name=self.collection_name,
                points=batch
            )
            logger.info(f"Upserted batch {i//batch_size + 1}: {len(batch)} points")
        
        logger.info(f"Total upserted: {len(points)} chunks")
    
    def get_collection_info(self):
        """Get collection statistics"""
        try:
            info = self.client.get_collection(self.collection_name)
            return {
                "name": self.collection_name,
                "points_count": info.points_count,
                "status": info.status
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return None
    
    def health_check(self) -> bool:
        """Check if Qdrant is accessible"""
        try:
            collections = self.client.get_collections()
            return True
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return False

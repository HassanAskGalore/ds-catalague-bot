"""
Azure OpenAI embeddings setup
Uses text-embedding-3-small (1536 dimensions)
"""

from openai import AzureOpenAI
import logging
from config import (
    AZURE_OPENAI_EMBEDDING_API_KEY,
    AZURE_OPENAI_EMBEDDING_ENDPOINT,
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
    AZURE_OPENAI_EMBEDDING_API_VERSION,
    EMBEDDING_DIMENSIONS
)

logger = logging.getLogger(__name__)

# Global embed model instance
_embed_model = None


class AzureEmbedder:
    """Wrapper for Azure OpenAI embeddings"""
    
    def __init__(self, client, deployment, dimensions):
        self.client = client
        self.deployment = deployment
        self.dimensions = dimensions
    
    def get_text_embedding(self, text: str):
        """Get embedding for a single text"""
        response = self.client.embeddings.create(
            input=text,
            model=self.deployment,
            dimensions=self.dimensions
        )
        return response.data[0].embedding


def setup_embeddings():
    """
    Configure Azure OpenAI embeddings
    
    Returns:
        AzureEmbedder instance
    """
    global _embed_model
    
    client = AzureOpenAI(
        api_key=AZURE_OPENAI_EMBEDDING_API_KEY,
        api_version=AZURE_OPENAI_EMBEDDING_API_VERSION,
        azure_endpoint=AZURE_OPENAI_EMBEDDING_ENDPOINT
    )
    
    _embed_model = AzureEmbedder(client, AZURE_OPENAI_EMBEDDING_DEPLOYMENT, EMBEDDING_DIMENSIONS)
    
    logger.info(f"Azure OpenAI Embeddings configured: {AZURE_OPENAI_EMBEDDING_DEPLOYMENT} ({EMBEDDING_DIMENSIONS}D)")
    
    return _embed_model


def get_embedding(text: str, embed_model=None):
    """
    Get embedding for a single text
    
    Args:
        text: Text to embed
        embed_model: Optional embedding model (uses global if None)
        
    Returns:
        List of floats (embedding vector)
    """
    if embed_model is None:
        embed_model = _embed_model
    
    return embed_model.get_text_embedding(text)


def get_embeddings_batch(texts: list, embed_model=None):
    """
    Get embeddings for multiple texts
    
    Args:
        texts: List of texts to embed
        embed_model: Optional embedding model
        
    Returns:
        List of embedding vectors
    """
    if embed_model is None:
        embed_model = _embed_model
    
    embeddings = []
    for text in texts:
        embedding = embed_model.get_text_embedding(text)
        embeddings.append(embedding)
    
    logger.info(f"Generated {len(embeddings)} embeddings")
    
    return embeddings

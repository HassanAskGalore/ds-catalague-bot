"""
Cross-encoder reranking for improved relevance
Uses ms-marco-MiniLM model
"""

from sentence_transformers import CrossEncoder
import logging
from typing import List
from config import RERANK_TOP_N

logger = logging.getLogger(__name__)


class Reranker:
    """Cross-encoder reranking for search results"""
    
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """
        Initialize cross-encoder model
        
        Args:
            model_name: HuggingFace model name
        """
        logger.info(f"Loading cross-encoder: {model_name}")
        self.model = CrossEncoder(model_name)
        logger.info("Cross-encoder loaded successfully")
    
    def rerank(
        self,
        query: str,
        results: List,
        top_n: int = RERANK_TOP_N
    ) -> List:
        """
        Rerank search results using cross-encoder
        
        Args:
            query: User query
            results: List of search results from hybrid search
            top_n: Number of top results to return
            
        Returns:
            Reranked list of top_n results
        """
        if not results:
            return []
        
        # Prepare query-document pairs
        pairs = []
        for result in results:
            # Extract text from payload
            text = result.payload.get("text", "")
            pairs.append([query, text])
        
        # Get relevance scores
        scores = self.model.predict(pairs)
        
        # Combine results with scores and sort
        ranked = sorted(
            zip(results, scores),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Return top N
        top_results = [item for item, score in ranked[:top_n]]
        
        logger.info(f"Reranked {len(results)} results, returning top {len(top_results)}")
        
        return top_results

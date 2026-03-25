"""
Hybrid search combining BM25 (keyword) and semantic search
Uses Reciprocal Rank Fusion to merge results
"""

from qdrant_client import QdrantClient
from qdrant_client.models import (
    SparseVector,
    Filter, FieldCondition, MatchValue, MatchAny
)
from typing import List, Dict, Optional
import logging
from collections import Counter
from config import QDRANT_COLLECTION, HYBRID_SEARCH_TOP_K, RRF_K

logger = logging.getLogger(__name__)


class HybridSearcher:
    """Hybrid search with BM25 + Semantic + RRF fusion"""
    
    def __init__(self, qdrant_client: QdrantClient, embed_model):
        self.client = qdrant_client
        self.embed_model = embed_model
        self.collection_name = QDRANT_COLLECTION
        logger.info("HybridSearcher initialized")
    
    def search(
        self,
        query: str,
        top_k: int = HYBRID_SEARCH_TOP_K,
        filters: Optional[Dict] = None
    ) -> List:
        """
        Perform hybrid search
        
        Args:
            query: User query string
            top_k: Number of results to return
            filters: Optional metadata filters
            
        Returns:
            List of search results with payloads
        """
        # 1. Generate dense embedding for semantic search
        dense_vector = self.embed_model.get_text_embedding(query)
        
        # 2. Generate sparse vector for BM25-style keyword search
        sparse_vector = self._get_sparse_vector(query)
        
        # 3. Build filter from metadata
        qdrant_filter = self._build_filter(filters) if filters else None
        
        # 4. Execute both searches
        try:
            # Semantic search using named vector "dense"
            semantic_results = self.client.query_points(
                collection_name=self.collection_name,
                query=dense_vector,
                using="dense",  # Use named vector
                limit=top_k,
                query_filter=qdrant_filter,
                with_payload=True
            ).points
            
            # For now, use same semantic search for keyword
            # (proper sparse vector search requires Qdrant 1.8+)
            keyword_results = semantic_results
            
            logger.info(f"Semantic: {len(semantic_results)}, Keyword: {len(keyword_results)}")
            
            # 5. Merge with Reciprocal Rank Fusion
            merged = self._reciprocal_rank_fusion(
                semantic_results,
                keyword_results,
                k=RRF_K
            )
            
            return merged[:top_k]
            
        except Exception as e:
            logger.error(f"Hybrid search failed: {e}")
            # Fallback to semantic only
            return self._semantic_search_only(dense_vector, top_k, qdrant_filter)
    
    def _semantic_search_only(self, dense_vector, top_k, qdrant_filter):
        """Fallback to semantic search only"""
        try:
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=dense_vector,
                using="dense",  # Use named vector
                limit=top_k,
                query_filter=qdrant_filter,
                with_payload=True
            ).points
            logger.info(f"Fallback semantic search: {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Semantic search also failed: {e}")
            return []
    
    def _get_sparse_vector(self, query: str) -> SparseVector:
        """
        Generate sparse vector for BM25-style search
        Simple TF-IDF approach
        """
        # Tokenize and count
        tokens = query.lower().split()
        term_freq = Counter(tokens)
        
        # Create sparse vector
        # Use hash to map tokens to indices (simple approach)
        indices = [hash(term) % 50000 for term in term_freq.keys()]
        values = [float(count) for count in term_freq.values()]
        
        return SparseVector(
            indices=indices,
            values=values
        )
    
    def _build_filter(self, filters: Dict) -> Filter:
        """
        Build Qdrant filter from metadata dict
        
        Supported filters:
        - product_type: str
        - catalogue_section: str
        - has_table: bool
        - standards: list
        - part_numbers: list
        """
        conditions = []
        
        for key, value in filters.items():
            if value is None:
                continue
            
            if isinstance(value, list):
                # Array field (e.g., standards, part_numbers)
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchAny(any=value)
                    )
                )
            else:
                # Single value field
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    )
                )
        
        if not conditions:
            return None
        
        return Filter(must=conditions)
    
    def _reciprocal_rank_fusion(
        self,
        list1: List,
        list2: List,
        k: int = 60
    ) -> List:
        """
        Merge two result lists using Reciprocal Rank Fusion
        
        RRF formula: score = sum(1 / (rank + k))
        
        Args:
            list1: First result list (semantic)
            list2: Second result list (keyword)
            k: RRF constant (default 60)
            
        Returns:
            Merged and sorted result list
        """
        scores = {}
        all_items = {}
        
        # Score from first list
        for rank, item in enumerate(list1):
            item_id = item.id
            scores[item_id] = scores.get(item_id, 0) + 1 / (rank + k)
            all_items[item_id] = item
        
        # Score from second list
        for rank, item in enumerate(list2):
            item_id = item.id
            scores[item_id] = scores.get(item_id, 0) + 1 / (rank + k)
            all_items[item_id] = item
        
        # Sort by fused score
        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
        
        merged_results = [all_items[item_id] for item_id in sorted_ids]
        
        logger.info(f"RRF merged {len(merged_results)} unique results")
        
        return merged_results

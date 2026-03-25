"""
Section-based chunking with table preservation
Keeps tables intact, one product = one chunk
"""

from dataclasses import dataclass
from typing import List, Dict
import re
import logging
from .metadata import MetadataExtractor

logger = logging.getLogger(__name__)


@dataclass
class Document:
    """Simple document class to replace llama_index Document"""
    text: str
    metadata: Dict
    excluded_embed_metadata_keys: List[str] = None
    excluded_llm_metadata_keys: List[str] = None


class CatalogueChunker:
    """Chunk catalogue by product sections with metadata tagging"""
    
    # Product heading patterns
    HEADING_PATTERNS = [
        r'^#{1,3}\s+(.+)$',  # Markdown headers
        r'^([A-Z][A-Za-z\s]+(?:clamp|pin|tie|lug|eye|bolt|horn|damper)s?)$',  # Product names
    ]
    
    def __init__(self, min_chunk_size: int = 100, max_chunk_size: int = 800, overlap: int = 50):
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap
        self.metadata_extractor = MetadataExtractor()
        logger.info(f"CatalogueChunker initialized (min={min_chunk_size}, max={max_chunk_size})")
    
    def chunk_by_section(self, parsed_doc: Dict) -> List[Document]:
        """
        Chunk document by product sections
        
        Args:
            parsed_doc: Output from CatalogueParser
            
        Returns:
            List of Document objects with metadata
        """
        markdown = parsed_doc["markdown"]
        
        # Split by headers to get sections
        sections = self._split_by_headers(markdown)
        
        logger.info(f"Found {len(sections)} sections")
        
        chunks = []
        chunk_index = 0
        
        for section in sections:
            # Skip very small sections
            if len(section["content"]) < self.min_chunk_size:
                continue
            
            # If section is too large and doesn't have a table, split it
            if len(section["content"]) > self.max_chunk_size and not self._has_table(section["content"]):
                sub_chunks = self._split_large_section(section)
                for sub_chunk in sub_chunks:
                    doc = self._create_document(sub_chunk, chunk_index)
                    chunks.append(doc)
                    chunk_index += 1
            else:
                # Keep section intact (especially if it has a table)
                doc = self._create_document(section, chunk_index)
                chunks.append(doc)
                chunk_index += 1
        
        logger.info(f"Created {len(chunks)} chunks")
        return chunks
    
    def _split_by_headers(self, markdown: str) -> List[Dict]:
        """Split markdown by headers to identify sections"""
        sections = []
        lines = markdown.split('\n')
        
        current_section = {
            "heading": "General",
            "content": "",
            "page": 1
        }
        
        for line in lines:
            # Check if line is a header
            is_header = False
            heading_text = None
            
            # Markdown header
            if line.startswith('#'):
                is_header = True
                heading_text = re.sub(r'^#+\s*', '', line).strip()
            
            # Check for page markers
            page_match = re.search(r'Page\s+(\d+)', line, re.IGNORECASE)
            if page_match:
                current_section["page"] = int(page_match.group(1))
            
            if is_header and heading_text:
                # Save previous section if it has content
                if current_section["content"].strip():
                    sections.append(current_section)
                
                # Start new section
                current_section = {
                    "heading": heading_text,
                    "content": "",
                    "page": current_section["page"]
                }
            else:
                current_section["content"] += line + "\n"
        
        # Add last section
        if current_section["content"].strip():
            sections.append(current_section)
        
        return sections
    
    def _split_large_section(self, section: Dict) -> List[Dict]:
        """Split large sections while respecting sentence boundaries"""
        content = section["content"]
        sentences = re.split(r'(?<=[.!?])\s+', content)
        
        sub_chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= self.max_chunk_size:
                current_chunk += sentence + " "
            else:
                if current_chunk:
                    sub_chunks.append({
                        "heading": section["heading"],
                        "content": current_chunk.strip(),
                        "page": section["page"]
                    })
                current_chunk = sentence + " "
        
        # Add remaining content
        if current_chunk:
            sub_chunks.append({
                "heading": section["heading"],
                "content": current_chunk.strip(),
                "page": section["page"]
            })
        
        return sub_chunks
    
    def _create_document(self, section: Dict, chunk_index: int) -> Document:
        """Create Document with full metadata"""
        text = section["content"]
        heading = section["heading"]
        page_number = section.get("page", 1)
        
        # Extract metadata
        metadata = self.metadata_extractor.extract_metadata(
            text=text,
            heading=heading,
            page_number=page_number,
            chunk_index=chunk_index
        )
        
        # Create LlamaIndex Document
        doc = Document(
            text=text,
            metadata=metadata,
            # Exclude certain fields from embedding (only used for filtering)
            excluded_embed_metadata_keys=["chunk_index", "has_table", "source_file"],
            excluded_llm_metadata_keys=["chunk_index"]
        )
        
        return doc
    
    def _has_table(self, text: str) -> bool:
        """Check if text contains a table"""
        return "|" in text or text.count("\t") > 5

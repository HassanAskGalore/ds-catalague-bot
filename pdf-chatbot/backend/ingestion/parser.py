"""
PDF Parser using Camelot for table extraction + PyMuPDF for text
Extracts structured tables and text from DS-Catalogue.pdf
"""

import camelot
import fitz
from typing import Dict, List
import logging
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CatalogueParser:
    """Parse engineering catalogue PDF with proper table extraction using Camelot"""
    
    def __init__(self):
        """Initialize parser"""
        logger.info("✓ Camelot + PyMuPDF parser initialized")
        logger.info("  - Camelot: Table extraction (lattice + stream modes)")
        logger.info("  - PyMuPDF: Text extraction")
    
    def parse(self, pdf_path: str) -> Dict:
        """
        Parse PDF and extract structured content with proper table handling
        
        Args:
            pdf_path: Path to DS-Catalogue.pdf
            
        Returns:
            Dict with markdown (text + tables), structured data, and page info
        """
        logger.info(f"Parsing PDF: {pdf_path}")
        
        # Step 1: Extract text with PyMuPDF
        logger.info("Extracting text with PyMuPDF...")
        text_data = self._extract_text(pdf_path)
        
        # Step 2: Extract tables with Camelot
        logger.info("Extracting tables with Camelot...")
        tables_data = self._extract_tables(pdf_path)
        
        # Step 3: Merge text and tables into structured markdown
        logger.info("Merging text and tables...")
        markdown = self._merge_content(text_data, tables_data)
        
        logger.info(f"✓ Parsing complete!")
        logger.info(f"  - Total pages: {text_data['total_pages']}")
        logger.info(f"  - Tables extracted: {len(tables_data['tables'])}")
        logger.info(f"  - Markdown length: {len(markdown)} characters")
        
        return {
            "markdown": markdown,
            "structured": {
                "pages": text_data['pages'],
                "tables": tables_data['tables']
            },
            "pages": text_data['pages'],
            "total_pages": text_data['total_pages']
        }
    
    def _extract_text(self, pdf_path: str) -> Dict:
        """Extract text from all pages using PyMuPDF"""
        doc = fitz.open(pdf_path)
        pages = []
        page_texts = {}
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            
            page_info = {
                "page_number": page_num + 1,
                "width": page.rect.width,
                "height": page.rect.height,
                "text": text
            }
            pages.append(page_info)
            page_texts[page_num + 1] = text
        
        doc.close()
        
        return {
            "pages": pages,
            "page_texts": page_texts,
            "total_pages": len(pages)
        }
    
    def _extract_tables(self, pdf_path: str) -> Dict:
        """Extract tables using Camelot (both lattice and stream modes)"""
        all_tables = []
        
        try:
            # Try lattice mode first (for tables with borders)
            logger.info("  Trying lattice mode (bordered tables)...")
            lattice_tables = camelot.read_pdf(
                pdf_path,
                pages='all',
                flavor='lattice',
                line_scale=40  # Adjust sensitivity
            )
            
            for table in lattice_tables:
                table_info = {
                    "page": table.page,
                    "mode": "lattice",
                    "accuracy": table.accuracy,
                    "dataframe": table.df,
                    "markdown": self._df_to_markdown(table.df)
                }
                all_tables.append(table_info)
            
            logger.info(f"  ✓ Lattice mode: {len(lattice_tables)} tables found")
            
        except Exception as e:
            logger.warning(f"  Lattice mode failed: {e}")
        
        try:
            # Try stream mode (for tables without clear borders)
            logger.info("  Trying stream mode (borderless tables)...")
            stream_tables = camelot.read_pdf(
                pdf_path,
                pages='all',
                flavor='stream',
                edge_tol=50  # Adjust spacing tolerance
            )
            
            for table in stream_tables:
                # Avoid duplicates by checking if similar table already exists
                if not self._is_duplicate_table(table, all_tables):
                    table_info = {
                        "page": table.page,
                        "mode": "stream",
                        "accuracy": table.accuracy,
                        "dataframe": table.df,
                        "markdown": self._df_to_markdown(table.df)
                    }
                    all_tables.append(table_info)
            
            logger.info(f"  ✓ Stream mode: {len(stream_tables)} tables found")
            
        except Exception as e:
            logger.warning(f"  Stream mode failed: {e}")
        
        # Sort tables by page number
        all_tables.sort(key=lambda x: x['page'])
        
        return {"tables": all_tables}
    
    def _is_duplicate_table(self, new_table, existing_tables: List[Dict]) -> bool:
        """Check if table is duplicate based on page and content similarity"""
        for existing in existing_tables:
            if existing['page'] == new_table.page:
                # Same page - check if content is similar
                if existing['dataframe'].shape == new_table.df.shape:
                    return True
        return False
    
    def _df_to_markdown(self, df: pd.DataFrame) -> str:
        """Convert pandas DataFrame to markdown table"""
        try:
            # Clean up the dataframe
            df = df.fillna('')
            
            # Convert to markdown
            markdown = df.to_markdown(index=False)
            return markdown if markdown else ""
        except Exception as e:
            logger.warning(f"Failed to convert table to markdown: {e}")
            return ""
    
    def _merge_content(self, text_data: Dict, tables_data: Dict) -> str:
        """Merge text and tables into structured markdown"""
        markdown_parts = []
        
        # Group tables by page
        tables_by_page = {}
        for table in tables_data['tables']:
            page_num = table['page']
            if page_num not in tables_by_page:
                tables_by_page[page_num] = []
            tables_by_page[page_num].append(table)
        
        # Build markdown page by page
        for page_info in text_data['pages']:
            page_num = page_info['page_number']
            
            # Add page header
            markdown_parts.append(f"## Page {page_num}")
            markdown_parts.append("")
            
            # Add text content
            text = page_info['text'].strip()
            if text:
                markdown_parts.append(text)
                markdown_parts.append("")
            
            # Add tables for this page
            if page_num in tables_by_page:
                for i, table in enumerate(tables_by_page[page_num], 1):
                    markdown_parts.append(f"### Table {i} (Page {page_num}, {table['mode']} mode, accuracy: {table['accuracy']:.1f}%)")
                    markdown_parts.append("")
                    markdown_parts.append(table['markdown'])
                    markdown_parts.append("")
        
        return "\n".join(markdown_parts)

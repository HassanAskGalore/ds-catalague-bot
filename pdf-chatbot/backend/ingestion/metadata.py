"""
Metadata schema and extraction utilities
Tags every chunk with comprehensive metadata for filtering and citation
"""

import re
from typing import Dict, List, Optional


class MetadataExtractor:
    """Extract and structure metadata from catalogue chunks"""
    
    # Product type detection keywords
    PRODUCT_TYPE_MAP = {
        "clamp": ["clamp", "suspension", "tension", "wedge", "top clamp"],
        "insulator": ["insulator", "pin"],
        "connector": ["connector", "piercing", "cable lug", "lug"],
        "horn": ["arcing horn", "horn"],
        "bolt": ["bolt", "arming"],
        "damper": ["damper", "stockbridge"],
        "tie": ["side tie", "tie"],
        "eye": ["ball eye", "socket eye"]
    }
    
    # Part number regex pattern
    PART_NUMBER_PATTERN = r'\b(\d{4}\.\d{2,3}(?:/\d+)?|[A-Z]{2,4}\d{2,3}[A-Z]?)\b'
    
    # Standards patterns
    STANDARDS = ["IEC", "ÖNORM", "DIN", "EN"]
    
    def __init__(self):
        self.part_number_regex = re.compile(self.PART_NUMBER_PATTERN)
    
    def extract_metadata(
        self,
        text: str,
        heading: str,
        page_number: int,
        chunk_index: int
    ) -> Dict:
        """
        Extract comprehensive metadata from chunk
        
        Args:
            text: Chunk text content
            heading: Section heading (product name)
            page_number: PDF page number
            chunk_index: Sequential chunk ID
            
        Returns:
            Complete metadata dict matching schema
        """
        return {
            # Document level
            "source_file": "DS-Catalogue.pdf",
            "catalogue_section": self._detect_catalogue_section(text, heading),
            "section_name": self._get_section_name(text, heading),
            "page_number": page_number,
            
            # Product level
            "product_name": heading,
            "product_type": self._detect_product_type(heading),
            "part_numbers": self._extract_part_numbers(text),
            "material": self._extract_material(text),
            
            # Spec level
            "has_table": self._has_table(text),
            "standards": self._extract_standards(text),
            "conductor_type": self._extract_conductor_type(text),
            
            # Chunk level
            "chunk_type": self._determine_chunk_type(text, heading),
            "chunk_index": chunk_index
        }
    
    def _detect_product_type(self, heading: str) -> str:
        """Detect product type from heading"""
        heading_lower = heading.lower()
        
        for ptype, keywords in self.PRODUCT_TYPE_MAP.items():
            if any(keyword in heading_lower for keyword in keywords):
                return ptype
        
        return "general"
    
    def _extract_part_numbers(self, text: str) -> List[str]:
        """Extract all part numbers (L.-Nr.) from text"""
        matches = self.part_number_regex.findall(text)
        # Remove duplicates while preserving order
        seen = set()
        unique_matches = []
        for match in matches:
            if match not in seen:
                seen.add(match)
                unique_matches.append(match)
        return unique_matches
    
    def _extract_material(self, text: str) -> Optional[str]:
        """Extract material description with improved patterns"""
        # Try to find material in common table formats first
        material_patterns = [
            # Table format: "material | aluminium..."
            r'material[:\s|]+([^|\n]+?)(?:\||$)',
            # Inline format: "Material: aluminium..."
            r'material[:\s]+([^.\n]+)',
            # Direct mentions with context
            r'(aluminium[^.\n;]{0,50}(?:steel|casted|extruded|forged)?[^.\n;]{0,30})',
            r'(steel[^.\n;]{0,50}(?:hot dip galvanized|zinc)?[^.\n;]{0,30})',
            r'(copper[^.\n;]{0,30})',
            # Compound materials
            r'(aluminium[,;]\s*(?:casted|extruded|forged)[,;]?\s*steel[,;]?\s*hot dip galvanized)',
            r'(aluminium[,;]\s*(?:casted|extruded|forged))',
            r'(steel[,;]?\s*hot dip galvanized)',
        ]
        
        text_lower = text.lower()
        
        # Try each pattern
        for pattern in material_patterns:
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                material = match.group(1).strip()
                # Clean up common artifacts
                material = re.sub(r'\s+', ' ', material)
                material = material.strip('|;,. ')
                if len(material) > 5:  # Avoid single words
                    return material
        
        # Fallback: look for common material keywords
        if 'aluminium' in text_lower and 'steel' in text_lower:
            return "aluminium; steel"
        elif 'aluminium' in text_lower:
            return "aluminium"
        elif 'steel' in text_lower:
            return "steel"
        
        return None
    
    def _extract_standards(self, text: str) -> List[str]:
        """Extract standards references"""
        found_standards = []
        for standard in self.STANDARDS:
            if standard in text:
                found_standards.append(standard)
        return found_standards
    
    def _extract_conductor_type(self, text: str) -> Optional[str]:
        """Extract conductor type if mentioned"""
        conductor_patterns = [
            "aluminium based",
            "copper based",
            "ACSR",
            "AAC",
            "AAAC"
        ]
        
        text_lower = text.lower()
        for pattern in conductor_patterns:
            if pattern.lower() in text_lower:
                return pattern
        
        return None
    
    def _has_table(self, text: str) -> bool:
        """Detect if chunk contains a table"""
        # Tables typically have pipe characters or multiple aligned columns
        return "|" in text or text.count("\t") > 5
    
    def _detect_catalogue_section(self, text: str, heading: str) -> str:
        """Detect catalogue section (17 or 19)"""
        combined = (text + " " + heading).lower()
        
        if "section 17" in combined or "distribution ohl" in combined:
            return "17"
        elif "section 19" in combined or "abc system" in combined or "aerial bundled" in combined:
            return "19"
        
        # Default based on product type hints
        if "insulator" in combined or "clamp" in combined:
            return "17"
        
        return "17"  # Default
    
    def _get_section_name(self, text: str, heading: str) -> str:
        """Get full section name"""
        section = self._detect_catalogue_section(text, heading)
        
        if section == "17":
            return "Distribution OHL Fittings"
        elif section == "19":
            return "Fittings for ABC Systems"
        
        return "General"
    
    def _determine_chunk_type(self, text: str, heading: str) -> str:
        """Determine chunk type"""
        if self._has_table(text):
            return "table"
        elif heading and heading != "General":
            return "product_spec"
        else:
            return "general"

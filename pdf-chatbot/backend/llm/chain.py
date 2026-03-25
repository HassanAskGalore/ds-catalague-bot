"""
LLM chain with Azure OpenAI GPT-4o and strict guardrails
Supports both text and structured JSON output for tables
"""

from openai import AzureOpenAI
import logging
import json
import re
from typing import List, Dict
from config import (
    AZURE_OPENAI_LLM_API_KEY,
    AZURE_OPENAI_LLM_ENDPOINT,
    AZURE_OPENAI_LLM_DEPLOYMENT,
    AZURE_OPENAI_LLM_API_VERSION,
    LLM_TEMPERATURE,
    LLM_MAX_TOKENS
)

logger = logging.getLogger(__name__)

client = AzureOpenAI(
    api_key=AZURE_OPENAI_LLM_API_KEY,
    api_version=AZURE_OPENAI_LLM_API_VERSION,
    azure_endpoint=AZURE_OPENAI_LLM_ENDPOINT
)

SYSTEM_PROMPT_TEXT = """You are an expert assistant for the Mosdorfer engineering product catalogue.

STRICT RULES:
1. Answer ONLY using the provided document context
2. If answer is not in context, respond exactly: "This information is not available in the catalogue."
3. Always cite your source in this format: [Product: <name> | Page: <number> | L.-Nr.: <part_number>]
4. For numerical specs (weight, dimensions, breaking load), return EXACT values — never round or approximate
5. If multiple products match the query, list ALL of them
6. Never guess, invent, or assume any specification
7. If asked about a part number, find exact match first

RESPONSE FORMAT:
- Direct answer first
- Exact specifications if asked
- Source citation at end
- Keep responses concise and accurate

Remember: Accuracy is critical. If unsure, say the information is not available."""

SYSTEM_PROMPT_TABLE = """You are a data retrieval assistant for the Mosdorfer engineering product catalogue.

STRICT RULES:
1. Return ONLY structured data from the provided context
2. Extract ALL products mentioned in the context - do NOT filter by specifications
3. The user will apply filters after extraction - your job is to extract EVERYTHING
4. Include products from ALL categories (tension clamps, top clamps, oscillating clamps, etc.)
5. Preserve exact numerical values - never round or approximate
6. If a field is missing, use null (not empty string)
7. Never hallucinate or invent data
8. Return data in JSON format for table rendering
9. Extract EVERY product you see, even if specifications don't match the query perfectly

OUTPUT FORMAT:
Return a JSON object with:
{
  "answer_type": "table",
  "data": [
    {
      "part_number": "exact part number or null",
      "product_name": "product name",
      "material": "material description",
      "conductor_diameter": "diameter range or value",
      "dimensions": "dimensions string",
      "breaking_load_kN": numeric value or null,
      "short_circuit_kA": numeric value or null,
      "weight_kg": numeric value or null,
      "page": page number
    }
  ],
  "summary": "brief summary: 'Extracted X products from the catalogue...'"
}

IMPORTANT: Do NOT filter products based on the user's query criteria. Extract ALL products from the context and let the system filter them afterwards.

Remember: Extract everything you see. Filtering happens later."""


def detect_table_query(query: str) -> bool:
    """
    Detect if query requires table output
    
    Args:
        query: User question
        
    Returns:
        True if table format is appropriate
    """
    table_keywords = [
        'show all', 'list all', 'compare', 'table', 'specifications',
        'spec', 'what are the', 'give me all', 'show me all',
        'list the', 'comparison', 'details for', 'properties of'
    ]
    
    query_lower = query.lower()
    
    # Check for table keywords
    for keyword in table_keywords:
        if keyword in query_lower:
            return True
    
    # Check for multiple product queries
    if any(word in query_lower for word in ['products', 'items', 'fittings', 'all']):
        return True
    
    return False


def expand_query_for_recall(query: str) -> str:
    """
    Expand query to improve recall by adding related terms
    
    Args:
        query: Original user query
        
    Returns:
        Expanded query with related terms
    """
    query_lower = query.lower()
    expansions = []
    
    # Add product type variations
    if 'clamp' in query_lower:
        expansions.extend(['tension clamp', 'top clamp', 'oscillating clamp', 
                          'suspension clamp', 'bolted clamp'])
    
    if 'conductor' in query_lower or 'diameter' in query_lower:
        expansions.extend(['conductor diameter', 'conductor Ø', 'cable diameter'])
    
    if 'weight' in query_lower:
        expansions.append('kg')
    
    # Combine original query with expansions
    if expansions:
        return f"{query} {' '.join(expansions)}"
    
    return query


def generate_answer(query: str, context_chunks: List) -> Dict:
    """
    Generate answer using GPT-4o with context
    Automatically detects if table format is needed
    
    Args:
        query: User question
        context_chunks: Retrieved and reranked chunks
        
    Returns:
        Dict with answer, sources, and optional table_data
    """
    # Build context from chunks
    context_parts = []
    sources = []
    
    for chunk in context_chunks:
        payload = chunk.payload
        
        # Format context with metadata
        context_part = f"""---
Product: {payload.get('product_name', 'Unknown')}
Page: {payload.get('page_number', 'N/A')}
Section: {payload.get('section_name', 'N/A')} ({payload.get('catalogue_section', 'N/A')})
Part Numbers: {', '.join(payload.get('part_numbers', []))}
Material: {payload.get('material', 'N/A')}
Standards: {', '.join(payload.get('standards', [])) if payload.get('standards') else 'N/A'}

{payload.get('text', '')}
---"""
        
        context_parts.append(context_part)
        
        # Collect source info
        sources.append({
            "product_name": payload.get("product_name"),
            "page_number": payload.get("page_number"),
            "part_numbers": payload.get("part_numbers", []),
            "catalogue_section": payload.get("catalogue_section"),
            "section_name": payload.get("section_name"),
            "material": payload.get("material"),
            "standards": payload.get("standards", []),
            "chunk_type": payload.get("chunk_type")
        })
    
    context = "\n\n".join(context_parts)
    
    # Detect if table format is needed
    use_table = detect_table_query(query)
    
    if use_table:
        return generate_structured_answer(query, context, sources)
    else:
        return generate_text_answer(query, context, sources)


def generate_text_answer(query: str, context: str, sources: List[Dict]) -> Dict:
    """Generate regular text answer"""
    try:
        response = client.chat.completions.create(
            model=AZURE_OPENAI_LLM_DEPLOYMENT,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_TEXT},
                {"role": "user", "content": f"""CONTEXT FROM CATALOGUE:
{context}

USER QUESTION:
{query}"""}
            ],
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS
        )
        
        answer = response.choices[0].message.content
        
        logger.info(f"Generated text answer for query: {query[:50]}...")
        
        return {
            "answer": answer,
            "sources": sources,
            "format": "text"
        }
        
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return {
            "answer": "I encountered an error generating the response. Please try again.",
            "sources": sources,
            "format": "text"
        }


def generate_structured_answer(query: str, context: str, sources: List[Dict]) -> Dict:
    """Generate structured JSON answer for table rendering"""
    try:
        response = client.chat.completions.create(
            model=AZURE_OPENAI_LLM_DEPLOYMENT,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_TABLE},
                {"role": "user", "content": f"""CONTEXT FROM CATALOGUE:
{context}

USER QUESTION:
{query}

Extract all relevant product data and return as JSON."""}
            ],
            temperature=0,  # Use 0 for structured output
            max_tokens=LLM_MAX_TOKENS,
            response_format={"type": "json_object"}  # Force JSON mode
        )
        
        answer_text = response.choices[0].message.content
        
        # Parse JSON response
        try:
            structured_data = json.loads(answer_text)
            
            # Validate structure
            if "data" in structured_data and isinstance(structured_data["data"], list):
                logger.info(f"Generated structured answer with {len(structured_data['data'])} rows")
                
                return {
                    "answer": structured_data.get("summary", "Here are the matching products:"),
                    "sources": sources,
                    "format": "table",
                    "table_data": structured_data["data"]
                }
            else:
                # Fallback if structure is wrong
                logger.warning("Invalid JSON structure, falling back to text")
                return generate_text_answer(query, context, sources)
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            # Fallback to text mode
            return generate_text_answer(query, context, sources)
        
    except Exception as e:
        logger.error(f"Structured generation failed: {e}")
        # Fallback to text mode
        return generate_text_answer(query, context, sources)


def format_sources_for_display(sources: List[Dict]) -> str:
    """Format sources for readable display"""
    if not sources:
        return "No sources available"
    
    formatted = []
    for idx, source in enumerate(sources, 1):
        part_nums = ", ".join(source.get("part_numbers", []))
        formatted.append(
            f"{idx}. {source.get('product_name', 'Unknown')} "
            f"(Page {source.get('page_number', 'N/A')}, "
            f"L.-Nr.: {part_nums if part_nums else 'N/A'})"
        )
    
    return "\n".join(formatted)

"""
FastAPI backend for catalogue chatbot
Endpoints: /chat, /health, /ingest, /products, /lip-sync
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
import logging
import sys
import os
import subprocess
import platform
import base64
import azure.cognitiveservices.speech as speechsdk

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from vectorstore.qdrant_store import QdrantStore
from embeddings.embedder import setup_embeddings
from retrieval.hybrid_search import HybridSearcher
from retrieval.reranker import Reranker
from llm.chain import generate_answer, expand_query_for_recall
import config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Catalogue RAG Chatbot API",
    description="Production-grade RAG system for Mosdorfer catalogue",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
qdrant_store = None
embed_model = None
searcher = None
reranker = None

# Rhubarb and TTS configuration
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tts_audio")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Detect Rhubarb path based on OS
system = platform.system().lower()
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if system == "windows":
    rhubarbExePath = os.path.join(current_dir, "Rhubarb-Lip-Sync-1.13.0-Windows", "rhubarb.exe")
elif system == "darwin":  # macOS
    rhubarbExePath = os.path.join(current_dir, "Rhubarb", "rhubarb")
elif system == "linux":
    rhubarbExePath = os.path.join(current_dir, "Rhubarb", "rhubarb")
else:
    rhubarbExePath = os.path.join(current_dir, "Rhubarb", "rhubarb")

# Azure Speech configuration
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY", "")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "centralindia")

SUPPORTED_VOICES = {
    "Male_1": "en-US-EricNeural",
    "Female_1": "en-US-AvaMultilingualNeural",
    "Female_2": "en-US-JennyNeural",
}


@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    global qdrant_store, embed_model, searcher, reranker
    
    try:
        logger.info("Initializing backend components...")
        
        # Initialize Qdrant
        qdrant_store = QdrantStore()
        
        # Initialize embeddings
        embed_model = setup_embeddings()
        
        # Initialize searcher
        searcher = HybridSearcher(qdrant_store.client, embed_model)
        
        # Initialize reranker
        reranker = Reranker()
        
        logger.info("Backend initialized successfully")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise


# Request/Response models
class ChatRequest(BaseModel):
    query: str
    filters: Optional[Dict] = None
    show_sources: bool = False  # OFF by default


class SourceInfo(BaseModel):
    product_name: Optional[str]
    page_number: Optional[int]
    part_numbers: List[str]
    catalogue_section: Optional[str]
    section_name: Optional[str]
    material: Optional[str]
    standards: List[str]
    chunk_type: Optional[str]


class TableRow(BaseModel):
    part_number: Optional[str] = None
    product_name: Optional[str] = None
    material: Optional[str] = None
    conductor_diameter: Optional[str] = None
    dimensions: Optional[str] = None
    breaking_load_kN: Optional[float] = None
    short_circuit_kA: Optional[float] = None
    weight_kg: Optional[float] = None
    page: Optional[int] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceInfo]
    chunks_used: int
    format: str = "text"  # "text" or "table"
    table_data: Optional[List[TableRow]] = None


class HealthResponse(BaseModel):
    status: str
    qdrant: str
    collection_info: Optional[Dict] = None


class IngestRequest(BaseModel):
    pdf_path: str


class IngestResponse(BaseModel):
    status: str
    chunks_indexed: int
    message: str


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint
    
    Process:
    1. Query expansion for better recall
    2. Hybrid search (BM25 + Semantic)
    3. Reciprocal Rank Fusion
    4. Cross-encoder reranking
    5. GPT-4o generation with guardrails (text or structured table)
    """
    try:
        logger.info(f"Query: {request.query}")
        
        # Step 1: Expand query for better recall
        expanded_query = expand_query_for_recall(request.query)
        if expanded_query != request.query:
            logger.info(f"Expanded query: {expanded_query}")
        
        # Step 2: Hybrid search with expanded query
        raw_results = searcher.search(
            query=expanded_query,
            top_k=config.HYBRID_SEARCH_TOP_K,
            filters=request.filters
        )
        
        if not raw_results:
            # Get some general catalogue info to suggest
            fallback_suggestions = [
                "I couldn't find specific information about that. However, I have extensive knowledge about:\n- Tension clamps (PK series)\n- Suspension clamps\n- Oscillating clamps\n- Distribution fittings\n\nCould you rephrase your question or ask about one of these categories?",
                "I don't have information on that specific item. Our catalogue includes products like tension clamps, top clamps, and various conductor fittings. What type of product are you looking for?",
                "That's not in my current knowledge base. I can help you with product specifications, part numbers, weights, and technical details for our clamp and fitting series. What would you like to know?",
                "I couldn't locate that information. Did you mean to ask about a specific product series? I have detailed specs for PK clamps, suspension fittings, and more.",
            ]
            import random
            return ChatResponse(
                answer=random.choice(fallback_suggestions),
                sources=[],
                chunks_used=0,
                format="text"
            )
        
        # Step 3: Rerank using ORIGINAL query (not expanded)
        top_chunks = reranker.rerank(
            query=request.query,
            results=raw_results,
            top_n=config.RERANK_TOP_N
        )
        
        # Step 4: Generate answer (automatically detects if table is needed)
        result = generate_answer(request.query, top_chunks)
        
        # Step 5: Apply post-filtering if table format and filters are needed
        if result.get("format") == "table" and "table_data" in result:
            # Check if query has filterable criteria
            query_lower = request.query.lower()
            
            # Apply conductor diameter filter if mentioned
            if "conductor" in query_lower and "diameter" in query_lower:
                # Extract diameter range from query (e.g., "9-16 mm" or "9–16 mm")
                import re
                dia_match = re.search(r'(\d+)\s*[-–]\s*(\d+)\s*mm', request.query)
                if dia_match:
                    from llm.filters import filter_by_conductor_diameter
                    min_dia = float(dia_match.group(1))
                    max_dia = float(dia_match.group(2))
                    result["table_data"] = filter_by_conductor_diameter(
                        result["table_data"], min_dia, max_dia
                    )
                    logger.info(f"Applied conductor diameter filter: {min_dia}-{max_dia}mm, {len(result['table_data'])} products remain")
            
            # Apply weight filter if mentioned
            if "weight" in query_lower and ("less than" in query_lower or "<" in query_lower or "under" in query_lower):
                # Extract weight limit from query
                import re
                weight_match = re.search(r'(?:less than|<|under)\s*(\d+(?:\.\d+)?)\s*kg', request.query, re.IGNORECASE)
                if weight_match:
                    from llm.filters import filter_by_weight
                    max_weight = float(weight_match.group(1))
                    result["table_data"] = filter_by_weight(
                        result["table_data"], max_weight=max_weight
                    )
                    logger.info(f"Applied weight filter: <{max_weight}kg, {len(result['table_data'])} products remain")
            
            # Update summary with final count
            result["answer"] = f"Extracted {len(result['table_data'])} products matching the criteria."
        
        # Build response
        response_data = {
            "answer": result["answer"],
            "sources": [SourceInfo(**source) for source in result["sources"]] if request.show_sources else [],
            "chunks_used": len(top_chunks),
            "format": result.get("format", "text")
        }
        
        # Add table data if present
        if result.get("format") == "table" and "table_data" in result:
            response_data["table_data"] = [TableRow(**row) for row in result["table_data"]]
        
        return ChatResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    try:
        qdrant_healthy = qdrant_store.health_check()
        collection_info = qdrant_store.get_collection_info()
        
        return HealthResponse(
            status="ok" if qdrant_healthy else "degraded",
            qdrant="connected" if qdrant_healthy else "disconnected",
            collection_info=collection_info
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="error",
            qdrant="error",
            collection_info=None
        )


@app.post("/ingest", response_model=IngestResponse)
async def ingest(request: IngestRequest):
    """
    Ingest PDF endpoint
    Note: This is better run as a separate script, but provided for completeness
    """
    try:
        from ingestion.parser import CatalogueParser
        from ingestion.chunker import CatalogueChunker
        from embeddings.embedder import get_embeddings_batch
        
        logger.info(f"Starting ingestion: {request.pdf_path}")
        
        # Parse PDF
        parser = CatalogueParser()
        parsed = parser.parse(request.pdf_path)
        
        # Chunk
        chunker = CatalogueChunker(
            min_chunk_size=config.MIN_CHUNK_SIZE,
            max_chunk_size=config.MAX_CHUNK_SIZE,
            overlap=config.CHUNK_OVERLAP
        )
        chunks = chunker.chunk_by_section(parsed)
        
        # Generate embeddings
        texts = [chunk.text for chunk in chunks]
        embeddings = get_embeddings_batch(texts, embed_model)
        
        # Store in Qdrant
        qdrant_store.create_collection()
        qdrant_store.upsert_chunks(chunks, embeddings)
        
        return IngestResponse(
            status="success",
            chunks_indexed=len(chunks),
            message=f"Successfully indexed {len(chunks)} chunks"
        )
        
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/products")
async def get_products():
    """Get list of all unique products in the catalogue"""
    try:
        # Query all points and extract unique product names
        # Note: This is a simple implementation; for large datasets, use aggregation
        scroll_result = qdrant_store.client.scroll(
            collection_name=config.QDRANT_COLLECTION,
            limit=1000,
            with_payload=["product_name", "product_type"]
        )
        
        products = {}
        for point in scroll_result[0]:
            product_name = point.payload.get("product_name")
            product_type = point.payload.get("product_type")
            if product_name and product_name != "General":
                products[product_name] = product_type
        
        return {
            "products": [
                {"name": name, "type": ptype}
                for name, ptype in sorted(products.items())
            ],
            "total": len(products)
        }
        
    except Exception as e:
        logger.error(f"Get products failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ===== LIP-SYNC FUNCTIONS =====

def text_to_speech_azure(text: str, voice: str, session_id: str) -> str:
    """Generate speech audio using Azure TTS"""
    try:
        speech_config = speechsdk.SpeechConfig(
            subscription=AZURE_SPEECH_KEY,
            region=AZURE_SPEECH_REGION
        )
        speech_config.speech_synthesis_voice_name = voice
        
        wav_file = os.path.join(OUTPUT_DIR, f"{session_id}.wav")
        audio_config = speechsdk.audio.AudioOutputConfig(filename=wav_file)
        
        speech_synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=audio_config
        )
        
        result = speech_synthesizer.speak_text_async(text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            logger.info(f"TTS audio generated: {wav_file}")
            return wav_file
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            logger.error(f"TTS canceled: {cancellation.reason}")
            logger.error(f"Error details: {cancellation.error_details}")
            return None
        else:
            logger.error(f"TTS failed: {result.reason}")
            return None
            
    except Exception as e:
        logger.error(f"TTS error: {e}", exc_info=True)
        return None


def convert_wav_to_pcm(input_wav: str, output_wav: str) -> str:
    """Convert WAV to PCM format for Rhubarb"""
    try:
        # Try to find ffmpeg
        ffmpeg_cmd = "ffmpeg"
        
        # Check common Windows installation paths
        possible_paths = [
            os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffmpeg.exe"),
            r"C:\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
            r"C:\ProgramData\chocolatey\bin\ffmpeg.exe"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                ffmpeg_cmd = path
                logger.info(f"Found FFmpeg at: {path}")
                break
        
        subprocess.run([
            ffmpeg_cmd, "-y", "-i", input_wav,
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            output_wav
        ], check=True, capture_output=True)
        
        logger.info(f"Converted to PCM: {output_wav}")
        return output_wav
        
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg conversion failed: {e.stderr.decode()}")
        return None
    except FileNotFoundError:
        logger.error("FFmpeg not found. Please install FFmpeg or add it to PATH")
        return None
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        return None


def generate_lip_sync(wav_file: str, user_id: str) -> str:
    """Generate lip-sync JSON using Rhubarb"""
    try:
        if not os.path.exists(rhubarbExePath):
            raise RuntimeError(f"Rhubarb not found at: {rhubarbExePath}")
        
        json_file = os.path.join(OUTPUT_DIR, f"{user_id}.json")
        
        result = subprocess.run([
            rhubarbExePath,
            "-f", "json",
            "-o", json_file,
            wav_file,
            "-r", "phonetic"
        ], capture_output=True, text=True, check=True)
        
        if os.path.exists(json_file):
            logger.info(f"Lip-sync generated: {json_file}")
            return json_file
        else:
            logger.error("Rhubarb did not generate JSON file")
            return None
            
    except subprocess.CalledProcessError as e:
        logger.error(f"Rhubarb failed: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"Lip-sync generation error: {e}")
        return None


def parse_lip_sync(json_file: str, sound_file: str) -> dict:
    """Parse Rhubarb JSON and add sound file reference"""
    try:
        import json
        with open(json_file, "r") as file:
            lip_sync_data = json.load(file)
        
        lip_sync_data["metadata"]["soundFile"] = sound_file
        return lip_sync_data
        
    except Exception as e:
        logger.error(f"JSON parsing error: {e}")
        return None


# ===== LIP-SYNC ENDPOINT =====

class LipSyncRequest(BaseModel):
    message: str
    user_id: str
    voice_selection: str = "Female_2"


@app.post("/lip-sync")
async def lip_sync_endpoint(request: LipSyncRequest):
    """
    Generate lip-sync data for avatar animation
    
    Process:
    1. Get answer from RAG system
    2. Generate audio with Azure TTS
    3. Convert to PCM format
    4. Generate lip-sync with Rhubarb
    5. Return audio + lip-sync JSON
    """
    try:
        logger.info(f"Lip-sync request: {request.message}")
        
        # Step 1: Get answer from RAG
        from llm.chain import generate_answer
        
        # Quick search for answer
        raw_results = searcher.search(
            query=request.message,
            top_k=5,
            filters=None
        )
        
        if raw_results:
            top_chunks = reranker.rerank(
                query=request.message,
                results=raw_results,
                top_n=3
            )
            result = generate_answer(request.message, top_chunks)
            answer = result["answer"]
        else:
            answer = "I don't have information about that in the catalogue."
        
        # Step 2: Validate voice
        voice = SUPPORTED_VOICES.get(request.voice_selection, "en-US-JennyNeural")
        
        # Step 3: Generate TTS audio
        wav_file = text_to_speech_azure(answer, voice, request.user_id)
        if not wav_file:
            raise HTTPException(status_code=500, detail="TTS generation failed")
        
        # Step 4: Try to use Azure WAV directly with Rhubarb first
        # If that fails, try PCM conversion
        json_file = generate_lip_sync(wav_file, request.user_id)
        
        if not json_file:
            # Try PCM conversion as fallback
            logger.info("Direct WAV failed, attempting PCM conversion...")
            pcm_file = os.path.join(OUTPUT_DIR, f"{request.user_id}_pcm.wav")
            pcm_file = convert_wav_to_pcm(wav_file, pcm_file)
            if not pcm_file:
                raise HTTPException(status_code=500, detail="Audio conversion failed")
            
            # Try lip-sync with converted audio
            json_file = generate_lip_sync(pcm_file, request.user_id)
            if not json_file:
                raise HTTPException(status_code=500, detail="Lip-sync generation failed")
        
        # Step 6: Parse lip-sync data
        lip_sync_data = parse_lip_sync(json_file, wav_file)
        if not lip_sync_data:
            raise HTTPException(status_code=500, detail="Lip-sync parsing failed")
        
        # Step 7: Encode audio to base64
        with open(wav_file, "rb") as audio_file:
            audio_base64 = base64.b64encode(audio_file.read()).decode("utf-8")
        
        # Step 8: Return response
        return JSONResponse(content={
            "text": answer,
            "facialExpression": "default",
            "animation": "Idle",
            "audio": audio_base64,
            "lipsync": lip_sync_data
        })
        
    except Exception as e:
        logger.error(f"Lip-sync endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

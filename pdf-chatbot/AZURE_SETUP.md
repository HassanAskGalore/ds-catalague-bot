# Azure OpenAI Setup Guide

## ✅ Azure Credentials Configured

Your project is now configured to use Azure OpenAI instead of standard OpenAI.

## Configuration Details

### Embeddings Service
- **Endpoint**: https://ai-hassaan9847ai715047452271.cognitiveservices.azure.com/
- **Deployment**: text-embedding-3-small
- **API Version**: 2024-12-01-preview
- **Dimensions**: 1536

### LLM Service (GPT-4o)
- **Endpoint**: https://ai-hassaan-9463.cognitiveservices.azure.com/
- **Deployment**: gpt-4o
- **API Version**: 2024-12-01-preview

## Files Updated

1. ✅ `backend/config.py` - Azure OpenAI configuration
2. ✅ `backend/embeddings/embedder.py` - Azure embeddings
3. ✅ `backend/llm/chain.py` - Azure GPT-4o client
4. ✅ `backend/requirements.txt` - Azure dependencies
5. ✅ `.env` - Your Azure credentials (already configured)
6. ✅ `.env.example` - Template updated

## Quick Start

### 1. Install Dependencies
```bash
cd pdf-chatbot/backend
pip install -r requirements.txt
```

### 2. Start Qdrant
```bash
cd ..
docker-compose up -d qdrant
```

Wait 10 seconds for Qdrant to start.

### 3. Run Ingestion (One Time)
```bash
cd backend
python ingest.py
```

This will:
- Parse DS-Catalogue.pdf with Docling
- Chunk by sections with metadata
- Generate embeddings using Azure OpenAI
- Store in Qdrant

Expected output:
```
[1/4] Parsing PDF with Docling...
  ✓ Parsed 50 pages
[2/4] Chunking by product sections...
  ✓ Created 120 chunks
[3/4] Generating embeddings...
  ✓ Generated 120 embeddings (Azure OpenAI)
[4/4] Storing in Qdrant...
  ✓ Chunks stored
✅ INGESTION COMPLETE!
```

### 4. Start Backend API
```bash
python -m api.main
```

Backend will run on http://localhost:8000

### 5. Start Frontend (New Terminal)
```bash
cd ../frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3000

## Testing Azure Connection

### Test Embeddings
```python
from embeddings.embedder import setup_embeddings

embed_model = setup_embeddings()
embedding = embed_model.get_text_embedding("test query")
print(f"Embedding dimension: {len(embedding)}")
# Should output: Embedding dimension: 1536
```

### Test LLM
```python
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key="your-llm-api-key-here",
    api_version="2024-12-01-preview",
    azure_endpoint="https://your-resource-name.cognitiveservices.azure.com/"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)
```

### Test via API
```bash
# Health check
curl http://localhost:8000/health

# Chat query
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the weight of PK 20/II clamp?"}'
```

## Differences from Standard OpenAI

### Code Changes
1. **Import**: `from openai import AzureOpenAI` instead of `OpenAI`
2. **Client Init**: Requires `azure_endpoint` and `api_version`
3. **Model Name**: Uses deployment name instead of model name
4. **Embeddings**: Uses `AzureOpenAIEmbedding` from LlamaIndex

### Configuration
- Separate endpoints for embeddings and LLM
- Deployment names instead of model names
- API version required
- Azure-specific authentication

## Cost Considerations

Azure OpenAI pricing (similar to OpenAI):
- **Embeddings**: ~$0.02 per 1M tokens
- **GPT-4o**: ~$5 per 1M input tokens, ~$15 per 1M output tokens

Per 1000 queries estimate: ~$15

## Troubleshooting

### "Authentication failed"
- Verify API keys in `.env` are correct
- Check if keys have expired
- Ensure endpoints are correct

### "Deployment not found"
- Verify deployment names match Azure portal
- Check API version compatibility
- Ensure deployments are active

### "Rate limit exceeded"
- Azure has rate limits per deployment
- Check Azure portal for quota
- Consider scaling up deployment

### "Connection timeout"
- Check network connectivity
- Verify endpoints are accessible
- Check firewall settings

## Azure Portal Links

- **Embeddings Service**: https://portal.azure.com → ai-hassaan9847ai715047452271
- **LLM Service**: https://portal.azure.com → ai-hassaan-9463

## Security Notes

⚠️ **Important**: Your API keys are now in `.env` file
- ✅ `.env` is in `.gitignore` (won't be committed)
- ⚠️ Never commit API keys to version control
- ✅ Use environment variables in production
- ✅ Rotate keys regularly

## What's Left to Do

### Immediate Next Steps:
1. ✅ Azure credentials configured
2. ⏳ Install dependencies: `pip install -r requirements.txt`
3. ⏳ Start Qdrant: `docker-compose up -d qdrant`
4. ⏳ Run ingestion: `python ingest.py`
5. ⏳ Start backend: `python -m api.main`
6. ⏳ Start frontend: `npm run dev`
7. ⏳ Test with queries

### Optional Enhancements:
- [ ] Add authentication (JWT)
- [ ] Implement caching (Redis)
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Deploy to production
- [ ] Add user feedback
- [ ] Implement analytics

## Support

If you encounter issues:
1. Check this guide
2. Review backend logs
3. Test Azure connections separately
4. Check Azure portal for service status
5. Verify quotas and limits

## Summary

✅ **Configured**: Azure OpenAI for embeddings and LLM
✅ **Ready**: All code updated to use Azure
✅ **Credentials**: Stored securely in .env
✅ **Next**: Run ingestion and start services

Your chatbot is now configured to use Azure OpenAI services!

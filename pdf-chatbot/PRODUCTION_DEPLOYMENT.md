# Production Deployment Guide - Docker

## Overview
Deploy the Mosdorfer AI Assistant chatbot with 3D avatar and lip-sync using Docker containers for production.

## Prerequisites

### Required Services
1. **Azure OpenAI** - For GPT-4o LLM and embeddings
2. **Azure Speech Services** - For TTS and STT
3. **Docker & Docker Compose** - For containerized deployment

### Azure Setup
1. Create Azure OpenAI resource with GPT-4o and text-embedding-3-large deployments
2. Create Azure Speech Services resource
3. Note down API keys, endpoints, and regions

## Environment Configuration

Create `.env` file in `pdf-chatbot/` directory:

```env
# Azure OpenAI (LLM)
AZURE_OPENAI_LLM_API_KEY=your_llm_key
AZURE_OPENAI_LLM_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_LLM_DEPLOYMENT=gpt-4o
AZURE_OPENAI_LLM_API_VERSION=2024-12-01-preview

# Azure OpenAI (Embeddings)
AZURE_OPENAI_EMBED_API_KEY=your_embed_key
AZURE_OPENAI_EMBED_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_EMBED_DEPLOYMENT=text-embedding-3-large
AZURE_OPENAI_EMBED_API_VERSION=2024-12-01-preview

# Azure Speech Services
AZURE_SPEECH_KEY=your_speech_key
AZURE_SPEECH_REGION=eastus2

# Qdrant
QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_COLLECTION=catalogue_chunks

# Cohere (Reranking)
COHERE_API_KEY=your_cohere_key
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8005
NEXT_PUBLIC_AZURE_SPEECH_KEY=your_speech_key
NEXT_PUBLIC_AZURE_SPEECH_REGION=eastus2
```

## Docker Deployment

### 1. Start All Services

```bash
cd pdf-chatbot
docker-compose up -d
```

This will start:
- **Qdrant** (vector database) on port 6333
- **Backend** (FastAPI) on port 8005
- **Frontend** (Next.js) on port 3000

### 2. Verify Services

```bash
# Check running containers
docker-compose ps

# Check backend health
curl http://localhost:8005/health

# Check Qdrant
curl http://localhost:6333/collections
```

### 3. Ingest Data

Upload your PDF catalogue:

```bash
curl -X POST http://localhost:8005/ingest \
  -F "file=@DS-Catalogue.pdf"
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8005/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## Docker Compose Configuration

The `docker-compose.yml` includes:

```yaml
services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  backend:
    build: ./backend
    ports:
      - "8005:8000"
    environment:
      - QDRANT_HOST=qdrant
    env_file:
      - .env
    depends_on:
      - qdrant
    volumes:
      - ./backend/tts_audio:/app/tts_audio
      - ./backend/vectorstore:/app/vectorstore

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://localhost:8005
    env_file:
      - ./frontend/.env.local
    depends_on:
      - backend

volumes:
  qdrant_data:
```

## Production Deployment

### For Cloud Deployment (AWS/Azure/GCP)

1. **Update Backend URL**
   ```env
   # frontend/.env.local
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
   ```

2. **Build and Push Images**
   ```bash
   # Build images
   docker-compose build

   # Tag for registry
   docker tag pdf-chatbot-backend your-registry/mosdorfer-backend:latest
   docker tag pdf-chatbot-frontend your-registry/mosdorfer-frontend:latest

   # Push to registry
   docker push your-registry/mosdorfer-backend:latest
   docker push your-registry/mosdorfer-frontend:latest
   ```

3. **Deploy to Cloud**
   - Use cloud provider's container service (ECS, AKS, GKE)
   - Configure load balancer for frontend
   - Set up SSL/TLS certificates
   - Configure environment variables in cloud console

### Scaling Considerations

- **Backend**: Can scale horizontally (multiple instances)
- **Qdrant**: Use managed Qdrant Cloud for production
- **Frontend**: Deploy to CDN (Vercel, Netlify) for better performance

## Monitoring & Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f qdrant
```

### Monitor Resources
```bash
docker stats
```

## Maintenance

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backup Qdrant Data
```bash
# Backup volume
docker run --rm -v pdf-chatbot_qdrant_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/qdrant-backup.tar.gz /data
```

### Restore Qdrant Data
```bash
# Restore from backup
docker run --rm -v pdf-chatbot_qdrant_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/qdrant-backup.tar.gz -C /
```

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Missing environment variables
# - FFmpeg not installed in container
# - Rhubarb executable missing
```

### Frontend Can't Connect to Backend
```bash
# Verify backend is running
curl http://localhost:8005/health

# Check NEXT_PUBLIC_BACKEND_URL in frontend/.env.local
# Ensure CORS is configured in backend
```

### Qdrant Connection Failed
```bash
# Check Qdrant is running
docker-compose ps qdrant

# Verify QDRANT_HOST=qdrant in backend environment
```

### TTS/Lip-Sync Not Working
```bash
# Check Azure Speech credentials
# Verify FFmpeg is installed in backend container
# Check Rhubarb executable permissions
# View backend logs for specific errors
```

## Security Checklist

- [ ] Use HTTPS in production (configure reverse proxy)
- [ ] Never commit `.env` files to git
- [ ] Rotate API keys regularly
- [ ] Enable Docker security scanning
- [ ] Use secrets management (AWS Secrets Manager, Azure Key Vault)
- [ ] Configure firewall rules
- [ ] Enable rate limiting on API endpoints
- [ ] Set up monitoring and alerts

## Performance Optimization

- Use production-grade Qdrant (Qdrant Cloud)
- Enable Redis caching for frequent queries
- Use CDN for frontend static assets
- Configure proper resource limits in docker-compose
- Monitor and optimize LLM token usage

## Support

**Common Commands:**
```bash
# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# View service status
docker-compose ps

# Remove all containers and volumes
docker-compose down -v
```

**Health Checks:**
- Backend: http://localhost:8005/health
- Qdrant: http://localhost:6333/dashboard
- Frontend: http://localhost:3000

For issues, check Docker logs and ensure all environment variables are correctly set.

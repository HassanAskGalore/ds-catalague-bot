# Deployment Guide

## Local Development (Already Set Up)

You've completed local setup. To run:

**Terminal 1 - Backend**:
```bash
cd pdf-chatbot/backend
python -m api.main
```

**Terminal 2 - Frontend**:
```bash
cd pdf-chatbot/frontend
npm run dev
```

**Access**: http://localhost:3000

## Docker Deployment

### Full Stack with Docker Compose

```bash
cd pdf-chatbot

# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services:
- Qdrant: http://localhost:6333
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

## Cloud Deployment Options

### Option 1: AWS (Recommended for Production)

#### Architecture
```
Internet → CloudFront → ALB → ECS (Frontend + Backend) → Qdrant Cloud
                                      ↓
                                  OpenAI API
```

#### Steps

1. **Qdrant Cloud** (Vector Database)
```bash
# Sign up at https://cloud.qdrant.io
# Create cluster
# Get API key and URL
```

Update `.env`:
```
QDRANT_HOST=your-cluster.qdrant.io
QDRANT_PORT=6333
QDRANT_API_KEY=your-api-key
```

2. **ECR** (Container Registry)
```bash
# Create repositories
aws ecr create-repository --repository-name catalogue-backend
aws ecr create-repository --repository-name catalogue-frontend

# Build and push
docker build -t catalogue-backend ./backend
docker tag catalogue-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/catalogue-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/catalogue-backend:latest

# Same for frontend
```

3. **ECS** (Container Orchestration)
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name catalogue-cluster

# Create task definitions (see task-definition.json)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create services
aws ecs create-service \
  --cluster catalogue-cluster \
  --service-name backend \
  --task-definition catalogue-backend \
  --desired-count 2 \
  --launch-type FARGATE
```

4. **ALB** (Load Balancer)
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name catalogue-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target groups and listeners
```

5. **CloudFront** (CDN)
```bash
# Create distribution pointing to ALB
# Enable HTTPS with ACM certificate
```

#### Cost Estimate (AWS)
- ECS Fargate: $50-100/month
- ALB: $20/month
- Qdrant Cloud: $50-200/month
- OpenAI API: Usage-based (~$15/1000 queries)
- **Total**: ~$150-350/month

### Option 2: Google Cloud Platform

#### Architecture
```
Internet → Cloud CDN → Cloud Run (Frontend + Backend) → Qdrant Cloud
                                    ↓
                                OpenAI API
```

#### Steps

1. **Build Containers**
```bash
# Backend
gcloud builds submit --tag gcr.io/PROJECT_ID/catalogue-backend ./backend

# Frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/catalogue-frontend ./frontend
```

2. **Deploy to Cloud Run**
```bash
# Backend
gcloud run deploy catalogue-backend \
  --image gcr.io/PROJECT_ID/catalogue-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=$OPENAI_API_KEY

# Frontend
gcloud run deploy catalogue-frontend \
  --image gcr.io/PROJECT_ID/catalogue-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_BACKEND_URL=https://backend-url
```

3. **Set up Cloud CDN**
```bash
gcloud compute backend-services create catalogue-backend-service
gcloud compute url-maps create catalogue-url-map
```

#### Cost Estimate (GCP)
- Cloud Run: $30-80/month
- Qdrant Cloud: $50-200/month
- OpenAI API: Usage-based
- **Total**: ~$100-300/month

### Option 3: Azure

#### Architecture
```
Internet → Front Door → Container Apps (Frontend + Backend) → Qdrant Cloud
                                         ↓
                                     OpenAI API
```

#### Steps

1. **Create Container Registry**
```bash
az acr create --resource-group catalogue-rg --name catalogueacr --sku Basic
```

2. **Build and Push**
```bash
az acr build --registry catalogueacr --image catalogue-backend:latest ./backend
az acr build --registry catalogueacr --image catalogue-frontend:latest ./frontend
```

3. **Deploy Container Apps**
```bash
az containerapp create \
  --name catalogue-backend \
  --resource-group catalogue-rg \
  --image catalogueacr.azurecr.io/catalogue-backend:latest \
  --environment catalogue-env \
  --ingress external \
  --target-port 8000
```

### Option 4: Vercel + Railway (Easiest)

#### Frontend on Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

#### Backend on Railway
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select backend folder
4. Add environment variables
5. Deploy

#### Qdrant Cloud
1. Sign up at https://cloud.qdrant.io
2. Create cluster
3. Update backend env vars

#### Cost Estimate
- Vercel: Free (hobby) or $20/month (pro)
- Railway: $5-20/month
- Qdrant Cloud: $50-200/month
- **Total**: ~$55-240/month

## Environment Variables for Production

### Backend
```bash
OPENAI_API_KEY=sk-xxx
QDRANT_HOST=your-cluster.qdrant.io
QDRANT_PORT=6333
QDRANT_API_KEY=your-qdrant-key
QDRANT_COLLECTION=catalogue_chunks
PDF_PATH=/app/DS-Catalogue.pdf
BACKEND_URL=https://api.yourdomain.com
```

### Frontend
```bash
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

## Security Hardening

### 1. API Authentication

Add JWT authentication to FastAPI:

```python
# backend/api/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# Use in endpoints
@app.post("/chat")
async def chat(request: ChatRequest, user=Depends(verify_token)):
    # ...
```

### 2. Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/chat")
@limiter.limit("10/minute")
async def chat(request: Request, chat_request: ChatRequest):
    # ...
```

### 3. CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific domain
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

### 4. Input Validation

```python
from pydantic import BaseModel, validator

class ChatRequest(BaseModel):
    query: str
    
    @validator('query')
    def query_length(cls, v):
        if len(v) > 500:
            raise ValueError('Query too long')
        return v
```

## Monitoring Setup

### 1. Prometheus + Grafana

```python
# backend/api/main.py
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()
Instrumentator().instrument(app).expose(app)
```

### 2. Sentry Error Tracking

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
)
```

### 3. Logging

```python
import logging
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler('app.log', maxBytes=10000000, backupCount=5)
logging.basicConfig(handlers=[handler], level=logging.INFO)
```

## Performance Optimization

### 1. Caching

```python
from functools import lru_cache
from redis import Redis

redis_client = Redis(host='localhost', port=6379)

@lru_cache(maxsize=1000)
def get_embedding(text: str):
    # Cache embeddings
    cached = redis_client.get(f"emb:{text}")
    if cached:
        return json.loads(cached)
    
    embedding = embed_model.get_text_embedding(text)
    redis_client.setex(f"emb:{text}", 3600, json.dumps(embedding))
    return embedding
```

### 2. Connection Pooling

```python
from qdrant_client import QdrantClient

# Reuse client
qdrant_client = QdrantClient(
    host=QDRANT_HOST,
    port=QDRANT_PORT,
    timeout=30,
    prefer_grpc=True  # Faster
)
```

### 3. Async Operations

```python
import asyncio

async def parallel_search(query: str):
    semantic_task = asyncio.create_task(semantic_search(query))
    keyword_task = asyncio.create_task(keyword_search(query))
    
    semantic_results, keyword_results = await asyncio.gather(
        semantic_task, keyword_task
    )
    return merge_results(semantic_results, keyword_results)
```

## Backup Strategy

### 1. Qdrant Backup

```bash
# Create snapshot
curl -X POST 'http://localhost:6333/collections/catalogue_chunks/snapshots'

# Download snapshot
curl 'http://localhost:6333/collections/catalogue_chunks/snapshots/snapshot-name' \
  --output snapshot.tar
```

### 2. Automated Backups

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups"

# Backup Qdrant
curl -X POST 'http://localhost:6333/collections/catalogue_chunks/snapshots'
curl 'http://localhost:6333/collections/catalogue_chunks/snapshots/latest' \
  --output "$BACKUP_DIR/qdrant-$DATE.tar"

# Upload to S3
aws s3 cp "$BACKUP_DIR/qdrant-$DATE.tar" s3://your-bucket/backups/
```

## Health Checks

### Kubernetes Liveness/Readiness

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Scaling Considerations

### Horizontal Scaling
- Backend: Multiple FastAPI instances behind load balancer
- Frontend: CDN + multiple Next.js instances
- Qdrant: Cluster mode for high availability

### Vertical Scaling
- Backend: Increase CPU/RAM for reranker
- Qdrant: More RAM for larger indices

### Auto-scaling Rules
```yaml
# AWS ECS
- metric: CPUUtilization
  target: 70%
  min: 2
  max: 10

- metric: RequestCount
  target: 1000/minute
  min: 2
  max: 10
```

## Disaster Recovery

### RTO/RPO Targets
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 24 hours

### Recovery Steps
1. Restore Qdrant from latest snapshot
2. Deploy backend from container registry
3. Deploy frontend from Vercel/CDN
4. Update DNS if needed
5. Verify with health checks

## Cost Optimization

### 1. Use Spot Instances (AWS)
```bash
# 70% cost savings
aws ecs create-service \
  --capacity-provider-strategy \
    capacityProvider=FARGATE_SPOT,weight=1
```

### 2. Cache Aggressively
- Redis for embeddings
- CloudFront for frontend
- API response caching

### 3. Optimize OpenAI Usage
- Use GPT-4o-mini for simple queries
- Reduce max_tokens
- Batch requests

### 4. Right-size Resources
- Monitor actual usage
- Scale down during off-hours
- Use reserved instances for base load

## Compliance

### GDPR
- Log user queries with consent
- Provide data export
- Implement data deletion

### SOC 2
- Audit logs
- Access controls
- Encryption at rest/transit

## Maintenance

### Regular Tasks
- [ ] Weekly: Review error logs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit
- [ ] Yearly: Disaster recovery drill

### Dependency Updates
```bash
# Backend
pip list --outdated
pip install -U package-name

# Frontend
npm outdated
npm update
```

## Troubleshooting Production Issues

### High Latency
1. Check OpenAI API status
2. Review Qdrant query performance
3. Check network latency
4. Review reranker performance

### High Error Rate
1. Check logs in Sentry
2. Verify Qdrant connection
3. Check OpenAI API limits
4. Review recent deployments

### Out of Memory
1. Increase container memory
2. Optimize chunk size
3. Reduce batch sizes
4. Enable swap

## Support Contacts

- Qdrant: support@qdrant.io
- OpenAI: help.openai.com
- AWS: aws.amazon.com/support

## Conclusion

This deployment guide covers everything from local development to production deployment with monitoring, security, and scaling considerations.

Choose the deployment option that best fits your needs:
- **Vercel + Railway**: Easiest, good for MVP
- **AWS**: Most control, best for enterprise
- **GCP**: Good balance of ease and control
- **Azure**: If already using Microsoft stack

Remember to:
- Start small and scale as needed
- Monitor everything
- Backup regularly
- Keep dependencies updated
- Test disaster recovery procedures

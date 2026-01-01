# Docker Deployment Guide - Apricity ML Service

Complete guide for deploying the ML service using Docker.

## Prerequisites

- Docker 20.10+ installed
- Docker Compose 1.29+ (optional, for compose deployment)
- 2GB+ free disk space
- 4GB+ RAM recommended
- NVIDIA Docker (optional, for GPU support)

## Quick Start

### 1. Build the Image

```bash
cd ml_service
docker build -t apricity-ml-service:latest .
```

Build time: ~5-10 minutes (depending on internet speed)

### 2. Run the Container

**Basic (CPU only):**

```bash
docker run -d \
  -p 8000:8000 \
  --name apricity-ml \
  apricity-ml-service:latest
```

**With model volume mount:**

```bash
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/models:/app/models:ro \
  --name apricity-ml \
  apricity-ml-service:latest
```

### 3. Test the Service

```bash
# Health check
curl http://localhost:8000/health

# Prediction test
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "diaryId": "test-diary",
    "text": "I feel happy and excited today!"
  }'
```

## Detailed Usage

### Environment Variables

Configure the service using environment variables:

```bash
docker run -d \
  -p 8000:8000 \
  -e MODEL_PATH=/app/models/custom-bert \
  -e GENERATION_MODEL_NAME=google/flan-t5-large \
  -e MAX_LENGTH=256 \
  -e DEVICE=cpu \
  -v $(pwd)/models:/app/models \
  --name apricity-ml \
  apricity-ml-service:latest
```

**Available Environment Variables:**

| Variable                | Default                                  | Description               |
| ----------------------- | ---------------------------------------- | ------------------------- |
| `MODEL_PATH`            | `/app/models/apricity-emotion-bert/best` | Path to emotion model     |
| `GENERATION_MODEL_NAME` | `google/flan-t5-base`                    | HuggingFace model name    |
| `MAX_LENGTH`            | `192`                                    | Max input sequence length |
| `MAX_NEW_TOKENS`        | `160`                                    | Max tokens for generation |
| `NUM_BEAMS`             | `4`                                      | Beam search size          |
| `TEMPERATURE`           | `0.7`                                    | Sampling temperature      |
| `TOP_P`                 | `0.92`                                   | Top-p sampling parameter  |
| `DEVICE`                | `cpu`                                    | Device: `cpu` or `cuda`   |
| `HOST`                  | `0.0.0.0`                                | Server host               |
| `PORT`                  | `8000`                                   | Server port               |

### GPU Support

**Requirements:**

- NVIDIA GPU with CUDA support
- NVIDIA Docker runtime installed

**Install NVIDIA Docker:**

```bash
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

**Run with GPU:**

```bash
docker run -d \
  -p 8000:8000 \
  --gpus all \
  -e DEVICE=cuda \
  -v $(pwd)/models:/app/models \
  --name apricity-ml-gpu \
  apricity-ml-service:latest
```

**Verify GPU usage:**

```bash
docker exec apricity-ml-gpu nvidia-smi
```

### Volume Mounts

**Models directory:**

```bash
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/models:/app/models:ro \
  --name apricity-ml \
  apricity-ml-service:latest
```

**Logs directory:**

```bash
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/logs:/app/logs \
  --name apricity-ml \
  apricity-ml-service:latest
```

**Both:**

```bash
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/models:/app/models:ro \
  -v $(pwd)/logs:/app/logs \
  --name apricity-ml \
  apricity-ml-service:latest
```

## Docker Compose Deployment

### Basic Deployment

```bash
# Start service
docker-compose up -d ml-service

# View logs
docker-compose logs -f ml-service

# Stop service
docker-compose down
```

### GPU Deployment

```bash
# Start GPU service
docker-compose --profile gpu up -d ml-service-gpu

# View logs
docker-compose logs -f ml-service-gpu

# Stop
docker-compose --profile gpu down
```

### Custom Configuration

Create a `.env` file:

```bash
cat > .env << EOF
MODEL_PATH=/app/models/custom-model
GENERATION_MODEL_NAME=google/flan-t5-large
MAX_LENGTH=256
DEVICE=cpu
EOF

docker-compose up -d ml-service
```

## Container Management

### View Logs

```bash
# Real-time logs
docker logs apricity-ml -f

# Last 100 lines
docker logs apricity-ml --tail 100

# With timestamps
docker logs apricity-ml -f --timestamps
```

### Container Shell Access

```bash
docker exec -it apricity-ml /bin/bash
```

### Resource Limits

```bash
docker run -d \
  -p 8000:8000 \
  --memory="4g" \
  --cpus="2" \
  -v $(pwd)/models:/app/models \
  --name apricity-ml \
  apricity-ml-service:latest
```

### Auto-restart

```bash
docker run -d \
  -p 8000:8000 \
  --restart unless-stopped \
  --name apricity-ml \
  apricity-ml-service:latest
```

### Stop/Start/Restart

```bash
# Stop container
docker stop apricity-ml

# Start stopped container
docker start apricity-ml

# Restart container
docker restart apricity-ml

# Remove container
docker rm apricity-ml

# Remove container and volume
docker rm -v apricity-ml
```

## Production Deployment

### Using Docker Compose (Recommended)

```yaml
version: "3.8"

services:
  ml-service:
    image: apricity-ml-service:latest
    container_name: apricity-ml-prod
    ports:
      - "8000:8000"
    environment:
      - DEVICE=cpu
      - MODEL_PATH=/app/models/apricity-emotion-bert/best
    volumes:
      - ./models:/app/models:ro
      - ./logs:/app/logs
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 4G
        reservations:
          cpus: "1"
          memory: 2G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Deploy:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Behind Nginx Reverse Proxy

```nginx
upstream ml_service {
    server localhost:8000;
}

server {
    listen 80;
    server_name ml.apricity.com;

    location / {
        proxy_pass http://ml_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for ML inference
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://ml_service/health;
        access_log off;
    }
}
```

## Monitoring

### Health Checks

```bash
# Docker health status
docker inspect --format='{{.State.Health.Status}}' apricity-ml

# Manual health check
curl http://localhost:8000/health
```

### Container Stats

```bash
# Real-time stats
docker stats apricity-ml

# One-time stats
docker stats apricity-ml --no-stream
```

### Log Monitoring

```bash
# Monitor for errors
docker logs apricity-ml -f | grep -i error

# Monitor predictions
docker logs apricity-ml -f | grep "Processing prediction"
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs apricity-ml

# Check if port is in use
netstat -tulpn | grep 8000

# Try running interactively
docker run -it --rm apricity-ml-service:latest /bin/bash
```

### Model Loading Errors

```bash
# Verify model files exist
docker exec apricity-ml ls -la /app/models/apricity-emotion-bert/best/

# Check model path environment variable
docker exec apricity-ml env | grep MODEL_PATH

# Test model loading
docker exec apricity-ml python -c "from transformers import AutoTokenizer; AutoTokenizer.from_pretrained('/app/models/apricity-emotion-bert/best')"
```

### Out of Memory

```bash
# Increase memory limit
docker run -d \
  -p 8000:8000 \
  --memory="8g" \
  --name apricity-ml \
  apricity-ml-service:latest

# Use smaller model
docker run -d \
  -p 8000:8000 \
  -e GENERATION_MODEL_NAME=google/flan-t5-small \
  --name apricity-ml \
  apricity-ml-service:latest
```

### Slow Performance

```bash
# Use GPU
docker run -d \
  -p 8000:8000 \
  --gpus all \
  -e DEVICE=cuda \
  --name apricity-ml \
  apricity-ml-service:latest

# Increase workers (if using multiple cores)
docker run -d \
  -p 8000:8000 \
  --cpus="4" \
  --name apricity-ml \
  apricity-ml-service:latest
```

## Multi-container Setup

Example with backend + ML service:

```yaml
version: "3.8"

services:
  backend:
    image: apricity-backend:latest
    ports:
      - "5000:5000"
    environment:
      - ML_SERVICE_URL=http://ml-service:8000
    depends_on:
      - ml-service
    networks:
      - apricity-net

  ml-service:
    image: apricity-ml-service:latest
    expose:
      - "8000"
    volumes:
      - ./models:/app/models:ro
    networks:
      - apricity-net

networks:
  apricity-net:
    driver: bridge
```

## Security Best Practices

1. **Use non-root user** (already configured in Dockerfile)
2. **Read-only volumes for models:**
   ```bash
   -v $(pwd)/models:/app/models:ro
   ```
3. **Limit resources:**
   ```bash
   --memory="4g" --cpus="2"
   ```
4. **Use secrets for sensitive data:**
   ```bash
   docker secret create ml_api_key api_key.txt
   ```
5. **Regular updates:**
   ```bash
   docker pull python:3.10-slim
   docker build --no-cache -t apricity-ml-service:latest .
   ```

## Performance Optimization

1. **Use GPU for production** (~10x faster)
2. **Mount models as volume** (faster container startup)
3. **Use Docker BuildKit:**
   ```bash
   DOCKER_BUILDKIT=1 docker build -t apricity-ml-service:latest .
   ```
4. **Multi-stage build** (already configured, reduces image size)
5. **Health check intervals** (adjust based on load)

## Useful Commands

```bash
# Build
docker build -t apricity-ml-service:latest .

# Run
docker run -d -p 8000:8000 --name apricity-ml apricity-ml-service:latest

# Logs
docker logs -f apricity-ml

# Stats
docker stats apricity-ml

# Shell
docker exec -it apricity-ml /bin/bash

# Stop
docker stop apricity-ml

# Remove
docker rm apricity-ml

# Image size
docker images apricity-ml-service

# Prune unused
docker system prune -a
```

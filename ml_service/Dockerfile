# Multi-stage Dockerfile for Apricity ML Service
# Base image: python:3.10-slim
FROM python:3.10-slim as builder

# Set working directory
WORKDIR /app

# Install build dependencies for compiling Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies including torch & transformers
# Install to user site-packages for smaller final image
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --user \
    torch>=2.0.0 \
    transformers>=4.35.0 \
    fastapi>=0.104.0 \
    uvicorn[standard]>=0.24.0 \
    && pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder stage
COPY --from=builder /root/.local /root/.local

# Add local Python packages to PATH
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY predict_server.py .
COPY inference_pipeline.py .
COPY requirements.txt .

# Create directories for models and logs
RUN mkdir -p /app/models /app/logs

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOST=0.0.0.0 \
    PORT=8000 \
    MODEL_PATH=/app/models/apricity-emotion-bert/best \
    GENERATION_MODEL_NAME=google/flan-t5-base \
    DEVICE=cpu

# Expose port 8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run uvicorn server
CMD ["uvicorn", "predict_server:app", "--host", "0.0.0.0", "--port", "8000"]

# Docker build command:
# docker build -t apricity-ml-service:latest .
#
# Docker run command:
# docker run -d -p 8000:8000 \
#   -e DEVICE=cuda \
#   -v $(pwd)/models:/app/models \
#   --name apricity-ml \
#   apricity-ml-service:latest
#
# For GPU support, add: --gpus all

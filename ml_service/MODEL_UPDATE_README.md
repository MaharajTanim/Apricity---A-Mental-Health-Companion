# ML Model Update Script

## Overview

`update_model.sh` is a utility script for updating ML models and restarting the ML service container. It supports downloading models from local directories, AWS S3, or Google Cloud Storage.

## Features

- ✅ Automatic backup of existing models
- ✅ Support for local, S3, and GCS model sources
- ✅ Automatic container restart
- ✅ Health check verification
- ✅ Inference testing
- ✅ Rollback on failure
- ✅ Colored output with progress indicators

## Usage

### Basic Usage

```bash
cd ml_service

# Update from .env MODEL_PATH
./update_model.sh

# Update from local directory
./update_model.sh ./new_models/

# Update from S3
./update_model.sh s3://apricity-ml-models/production/

# Update from GCS
./update_model.sh gs://apricity-ml-models/production/
```

### Options

```bash
# Show help
./update_model.sh --help

# Update without creating backup
./update_model.sh --no-backup ./new_models/

# Update without restarting container (useful for testing)
./update_model.sh --no-restart ./new_models/

# Combine options
./update_model.sh --no-backup --no-restart s3://bucket/models/
```

## Examples

### Example 1: Update from Local Directory

```bash
# You have new models in a local directory
./update_model.sh ../downloaded_models/bert_v2/

# Output:
# ═══════════════════════════════════════════════════════
# ML MODEL UPDATE - APRICITY
# ═══════════════════════════════════════════════════════
#
# ▶ Checking dependencies...
# ✓ All dependencies found
#
# ▶ Backing up existing models...
# ✓ Models backed up to: ./models_backup_20251028_143022
#
# ▶ Updating models from local path: ../downloaded_models/bert_v2/
# ✓ Models updated from local directory
#
# ▶ Verifying model files...
# ✓ Found 8 model files
#
# ▶ Restarting ML service container...
# ✓ ML service container restarted
#
# ▶ Waiting for ML service to be healthy...
# ✓ ML service is healthy
#
# ▶ Testing inference endpoint...
# ✓ Inference test passed
#
# ═══════════════════════════════════════════════════════
# MODEL UPDATE COMPLETED SUCCESSFULLY ✓
# ═══════════════════════════════════════════════════════
```

### Example 2: Update from S3

```bash
# Prerequisites: AWS CLI configured with credentials
aws configure  # If not already configured

# Download and update models from S3
./update_model.sh s3://apricity-ml-models/production/v2/

# The script will:
# 1. Backup existing models
# 2. Download from S3 using aws s3 sync
# 3. Replace models
# 4. Restart container
# 5. Verify health
```

### Example 3: Update from GCS

```bash
# Prerequisites: gcloud CLI configured
gcloud auth login  # If not already authenticated

# Download and update models from GCS
./update_model.sh gs://apricity-ml-models/production/v2/

# Similar process to S3 but uses gsutil
```

### Example 4: Test Model Update Without Restart

```bash
# Useful for validating model files before deployment
./update_model.sh --no-restart ./new_models/

# Check models manually
ls -lh models/

# If good, restart manually
docker restart apricity-ml-service
```

## Prerequisites

### Required

- **Docker** - Container runtime
- **docker-compose** - Multi-container orchestration
- **curl** - For health checks

### Optional (based on source)

- **AWS CLI** - For S3 downloads (`pip install awscli`)
- **gsutil** - For GCS downloads (`pip install gsutil`)

## How It Works

### Workflow

```
1. Check Dependencies
   └─ Verify docker, docker-compose, curl

2. Backup Existing Models
   └─ Copy ./models to ./models_backup_TIMESTAMP

3. Download/Update Models
   ├─ From local: cp -r source ./models
   ├─ From S3: aws s3 sync s3://... ./models
   └─ From GCS: gsutil cp -r gs://... ./models

4. Verify Models
   └─ Check for .bin, .safetensors, config.json files

5. Restart Container
   ├─ Option 1: docker restart apricity-ml-service
   └─ Option 2: docker-compose restart ml_service

6. Health Check
   └─ Wait up to 60s for GET /health to return 200

7. Test Inference (optional)
   └─ POST /predict with sample text
```

### Backup Strategy

- Backups created before any changes: `./models_backup_YYYYMMDD_HHMMSS/`
- Automatic rollback if model update fails
- Backups not deleted automatically (manual cleanup recommended)

### Container Restart

The script tries two methods:

1. **Direct container restart** (if container exists)

   ```bash
   docker restart apricity-ml-service
   ```

2. **Docker Compose restart** (fallback)
   ```bash
   docker-compose restart ml_service
   ```

## Configuration

### Environment Variables

The script reads `MODEL_PATH` from `.env` if no source is provided:

```bash
# ml_service/.env
MODEL_PATH=./models
# or
MODEL_PATH=s3://apricity-ml-models/production/
# or
MODEL_PATH=gs://apricity-ml-models/production/
```

### Container Names

Default values (can be edited in script):

```bash
CONTAINER_NAME="apricity-ml-service"  # Docker container name
SERVICE_NAME="ml_service"             # Docker compose service name
```

## Troubleshooting

### Error: "Docker is not installed"

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Error: "AWS CLI is not installed"

```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure
```

### Error: "Failed to download models from S3"

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check S3 bucket access
aws s3 ls s3://apricity-ml-models/production/

# Verify bucket permissions (need s3:GetObject, s3:ListBucket)
```

### Error: "ML service did not become healthy"

```bash
# Check container logs
docker logs apricity-ml-service --tail 50

# Common issues:
# - Model files corrupted/incomplete
# - Insufficient memory (ML models need 2-4GB)
# - Wrong model format (need PyTorch .bin or .safetensors)

# Restore from backup
rm -rf ./models
mv ./models_backup_YYYYMMDD_HHMMSS ./models
docker restart apricity-ml-service
```

### Error: "Source directory is empty"

```bash
# Verify source has model files
ls -la /path/to/source/

# Model directory should contain:
# - config.json
# - pytorch_model.bin or model.safetensors
# - tokenizer files (tokenizer.json, vocab.txt, etc.)
```

## Manual Model Update (Without Script)

If you prefer manual update:

```bash
cd ml_service

# 1. Backup
cp -r models models_backup

# 2. Download/copy new models
# From local:
rm -rf models
cp -r /path/to/new/models ./models

# From S3:
aws s3 sync s3://bucket/models/ ./models/

# From GCS:
gsutil -m cp -r gs://bucket/models/* ./models/

# 3. Restart
docker restart apricity-ml-service

# 4. Check health
curl http://localhost:8000/health

# 5. Check logs if issues
docker logs apricity-ml-service -f
```

## Production Best Practices

### 1. Model Versioning

```bash
# Store models with version tags in S3/GCS
s3://apricity-ml-models/
  ├── v1.0.0/
  ├── v1.1.0/
  └── v2.0.0/  # Latest

# Update with specific version
./update_model.sh s3://apricity-ml-models/v2.0.0/
```

### 2. Blue-Green Deployment

```bash
# Keep current container running
docker run -d --name apricity-ml-service-new \
  -v $(pwd)/models:/app/models:ro \
  apricity-ml-service:latest

# Test new container
curl http://localhost:8001/health

# Switch traffic (update load balancer)
# Then remove old container
docker rm -f apricity-ml-service
docker rename apricity-ml-service-new apricity-ml-service
```

### 3. Automated Updates

```bash
# Cron job for daily model updates (if models auto-train)
# crontab -e
0 2 * * * cd /app/ml_service && ./update_model.sh s3://bucket/daily/ >> /var/log/model-update.log 2>&1
```

### 4. Monitoring

```bash
# Add alerts for:
# - Model update failures (script exit code != 0)
# - Health check failures after update
# - Model file size changes (potential corruption)
# - Inference latency changes (model degradation)
```

## Exit Codes

| Code | Meaning                                      |
| ---- | -------------------------------------------- |
| 0    | Success - models updated and service healthy |
| 1    | Dependency missing (docker, aws, gsutil)     |
| 1    | Source path invalid or empty                 |
| 1    | Model download/copy failed                   |
| 1    | Container restart failed                     |
| 1    | Health check timeout                         |

## Related Documentation

- **Deployment Guide:** [../DEPLOYMENT.md](../DEPLOYMENT.md)
- **ML Service README:** [README.md](README.md)
- **Model Training:** See training notebooks in `training/`

## Support

### Issues

If you encounter issues:

1. Check script output for specific error messages
2. Review container logs: `docker logs apricity-ml-service`
3. Verify model files exist and are valid
4. Check disk space: `df -h`
5. Verify network connectivity (for S3/GCS downloads)

### Contributing

To improve this script:

1. Test thoroughly before committing
2. Update this README with new features
3. Add error handling for edge cases
4. Maintain backward compatibility

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0

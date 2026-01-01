#!/bin/bash

#############################################################################
# ML Model Update Script
#
# This script downloads/updates ML models and restarts the ML service.
# Supports local files, S3, and GCS storage.
#
# Usage:
#   ./update_model.sh [source_path]
#
# Examples:
#   ./update_model.sh                                    # Update from default location
#   ./update_model.sh ./new_models/                      # Update from local directory
#   ./update_model.sh s3://bucket/models/v2/             # Update from S3
#   ./update_model.sh gs://bucket/models/v2/             # Update from GCS
#
#############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MODEL_DIR="./models"
BACKUP_DIR="./models_backup_$(date +%Y%m%d_%H%M%S)"
CONTAINER_NAME="apricity-ml-service"
SERVICE_NAME="ml_service"

#############################################################################
# Helper Functions
#############################################################################

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${YELLOW}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_usage() {
    echo "Usage: $0 [source_path]"
    echo ""
    echo "Update ML models and restart the ML service container."
    echo ""
    echo "Arguments:"
    echo "  source_path    Path to new models (local, s3://, or gs://)"
    echo "                 If not provided, uses MODEL_PATH from .env"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Update from .env MODEL_PATH"
    echo "  $0 ./new_models/                      # Update from local directory"
    echo "  $0 s3://bucket/models/v2/             # Update from S3"
    echo "  $0 gs://bucket/models/v2/             # Update from GCS"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --no-backup    Skip backup of existing models"
    echo "  --no-restart   Update models but don't restart container"
}

#############################################################################
# Main Functions
#############################################################################

check_dependencies() {
    print_step "Checking dependencies..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check docker-compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed"
        exit 1
    fi
    
    print_success "All dependencies found"
}

backup_existing_models() {
    if [ "$SKIP_BACKUP" = true ]; then
        print_step "Skipping backup (--no-backup flag set)"
        return 0
    fi
    
    if [ ! -d "$MODEL_DIR" ]; then
        print_step "No existing models to backup"
        return 0
    fi
    
    print_step "Backing up existing models..."
    
    # Check if models directory has content
    if [ -z "$(ls -A $MODEL_DIR 2>/dev/null)" ]; then
        print_step "Models directory is empty, skipping backup"
        return 0
    fi
    
    # Create backup
    cp -r "$MODEL_DIR" "$BACKUP_DIR"
    print_success "Models backed up to: $BACKUP_DIR"
}

download_from_s3() {
    local s3_path=$1
    
    print_step "Downloading models from S3: $s3_path"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Install: pip install awscli"
        exit 1
    fi
    
    # Create temp directory
    local temp_dir=$(mktemp -d)
    
    # Download from S3
    if aws s3 sync "$s3_path" "$temp_dir/" --quiet; then
        print_success "Models downloaded from S3"
        
        # Replace existing models
        rm -rf "$MODEL_DIR"
        mv "$temp_dir" "$MODEL_DIR"
        print_success "Models updated successfully"
    else
        print_error "Failed to download models from S3"
        rm -rf "$temp_dir"
        exit 1
    fi
}

download_from_gcs() {
    local gcs_path=$1
    
    print_step "Downloading models from GCS: $gcs_path"
    
    # Check if gsutil is installed
    if ! command -v gsutil &> /dev/null; then
        print_error "gsutil is not installed. Install: pip install gsutil"
        exit 1
    fi
    
    # Create temp directory
    local temp_dir=$(mktemp -d)
    
    # Download from GCS
    if gsutil -m cp -r "$gcs_path/*" "$temp_dir/"; then
        print_success "Models downloaded from GCS"
        
        # Replace existing models
        rm -rf "$MODEL_DIR"
        mv "$temp_dir" "$MODEL_DIR"
        print_success "Models updated successfully"
    else
        print_error "Failed to download models from GCS"
        rm -rf "$temp_dir"
        exit 1
    fi
}

update_from_local() {
    local source_path=$1
    
    print_step "Updating models from local path: $source_path"
    
    # Check if source exists
    if [ ! -d "$source_path" ]; then
        print_error "Source directory does not exist: $source_path"
        exit 1
    fi
    
    # Check if source has content
    if [ -z "$(ls -A $source_path)" ]; then
        print_error "Source directory is empty: $source_path"
        exit 1
    fi
    
    # Remove existing models
    rm -rf "$MODEL_DIR"
    
    # Copy new models
    cp -r "$source_path" "$MODEL_DIR"
    print_success "Models updated from local directory"
}

update_models() {
    local source_path=$1
    
    print_step "Updating ML models..."
    
    # Determine source type and update accordingly
    if [[ "$source_path" == s3://* ]]; then
        download_from_s3 "$source_path"
    elif [[ "$source_path" == gs://* ]]; then
        download_from_gcs "$source_path"
    else
        update_from_local "$source_path"
    fi
    
    # Verify models exist
    if [ ! -d "$MODEL_DIR" ] || [ -z "$(ls -A $MODEL_DIR)" ]; then
        print_error "Model update failed - no models found in $MODEL_DIR"
        
        # Restore from backup if available
        if [ -d "$BACKUP_DIR" ]; then
            print_step "Restoring from backup..."
            rm -rf "$MODEL_DIR"
            mv "$BACKUP_DIR" "$MODEL_DIR"
            print_success "Restored from backup"
        fi
        exit 1
    fi
    
    print_success "Models updated successfully"
}

restart_ml_service() {
    if [ "$SKIP_RESTART" = true ]; then
        print_step "Skipping restart (--no-restart flag set)"
        return 0
    fi
    
    print_step "Restarting ML service container..."
    
    # Check if container exists
    if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_step "Container not found, using docker-compose..."
        
        # Restart using docker-compose
        if docker-compose restart "$SERVICE_NAME"; then
            print_success "ML service restarted via docker-compose"
        else
            print_error "Failed to restart ML service"
            exit 1
        fi
    else
        # Restart container directly
        if docker restart "$CONTAINER_NAME"; then
            print_success "ML service container restarted"
        else
            print_error "Failed to restart container"
            exit 1
        fi
    fi
    
    # Wait for service to be healthy
    print_step "Waiting for ML service to be healthy..."
    
    local max_retries=30
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
            print_success "ML service is healthy"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        echo -n "."
        sleep 2
    done
    
    echo ""
    print_error "ML service did not become healthy after $((max_retries * 2)) seconds"
    docker logs "$CONTAINER_NAME" --tail 50
    exit 1
}

verify_models() {
    print_step "Verifying model files..."
    
    # List model files
    echo ""
    echo "Model files in $MODEL_DIR:"
    find "$MODEL_DIR" -type f -name "*.bin" -o -name "*.safetensors" -o -name "config.json" | head -20
    
    # Count model files
    local model_count=$(find "$MODEL_DIR" -type f \( -name "*.bin" -o -name "*.safetensors" \) | wc -l)
    
    if [ "$model_count" -gt 0 ]; then
        print_success "Found $model_count model files"
    else
        print_error "No model files (.bin or .safetensors) found!"
        exit 1
    fi
}

test_inference() {
    print_step "Testing inference endpoint..."
    
    # Simple health check first
    if ! curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        print_error "Health check failed"
        return 1
    fi
    
    # Try a simple prediction (if endpoint is available)
    local test_payload='{"text": "I am feeling happy today", "diaryId": "test", "userId": "test"}'
    
    if curl -sf http://localhost:8000/predict \
        -H "Content-Type: application/json" \
        -d "$test_payload" \
        -o /dev/null; then
        print_success "Inference test passed"
    else
        print_step "Inference endpoint not available or test failed (this may be normal if endpoint requires auth)"
    fi
}

#############################################################################
# Main Execution
#############################################################################

main() {
    # Parse command line arguments
    SKIP_BACKUP=false
    SKIP_RESTART=false
    SOURCE_PATH=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                print_usage
                exit 0
                ;;
            --no-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --no-restart)
                SKIP_RESTART=true
                shift
                ;;
            *)
                SOURCE_PATH="$1"
                shift
                ;;
        esac
    done
    
    # If no source provided, try to get from .env
    if [ -z "$SOURCE_PATH" ]; then
        if [ -f ".env" ]; then
            SOURCE_PATH=$(grep "^MODEL_PATH=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            if [ -z "$SOURCE_PATH" ]; then
                print_error "MODEL_PATH not found in .env file"
                print_usage
                exit 1
            fi
            print_step "Using MODEL_PATH from .env: $SOURCE_PATH"
        else
            print_error "No source path provided and no .env file found"
            print_usage
            exit 1
        fi
    fi
    
    print_header "ML MODEL UPDATE - APRICITY"
    
    # Check dependencies
    check_dependencies
    
    # Backup existing models
    backup_existing_models
    
    # Update models
    update_models "$SOURCE_PATH"
    
    # Verify models
    verify_models
    
    # Restart service
    restart_ml_service
    
    # Test inference
    test_inference
    
    # Success message
    print_header "MODEL UPDATE COMPLETED SUCCESSFULLY ✓"
    echo -e "${GREEN}ML models have been updated and service restarted${NC}"
    echo ""
    echo "Details:"
    echo "  • Source: $SOURCE_PATH"
    echo "  • Models: $MODEL_DIR"
    if [ "$SKIP_BACKUP" = false ] && [ -d "$BACKUP_DIR" ]; then
        echo "  • Backup: $BACKUP_DIR"
    fi
    echo ""
    echo "Service status:"
    docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    exit 0
}

# Run main function
main "$@"

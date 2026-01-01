#!/bin/bash
# Apricity Quick Start Script

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║   Apricity Docker Quick Start Setup   ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠  Please edit .env with your configuration before continuing${NC}"
    echo ""
    read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Ask user which profile to use
echo ""
echo -e "${BLUE}Select deployment mode:${NC}"
echo "1) Backend + ML + MongoDB only (recommended for development)"
echo "2) Full stack with Frontend"
echo ""
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        PROFILE_CMD="docker-compose up -d"
        SERVICES="Backend, ML Service, and MongoDB"
        ;;
    2)
        PROFILE_CMD="docker-compose --profile full up -d"
        SERVICES="Backend, ML Service, MongoDB, and Frontend"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Build images
echo ""
echo -e "${BLUE}Building Docker images...${NC}"
docker-compose build

# Start services
echo ""
echo -e "${BLUE}Starting services: $SERVICES${NC}"
eval $PROFILE_CMD

# Wait for services to be healthy
echo ""
echo -e "${BLUE}Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo ""
echo -e "${BLUE}Checking service health...${NC}"

# Check backend
if curl -f http://localhost:5000/health &> /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy (http://localhost:5000)${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
fi

# Check ML service
if curl -f http://localhost:8000/health &> /dev/null; then
    echo -e "${GREEN}✓ ML Service is healthy (http://localhost:8000)${NC}"
else
    echo -e "${YELLOW}⚠  ML Service is starting... (this may take a minute)${NC}"
fi

# Check MongoDB
if docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" --quiet &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB is healthy${NC}"
else
    echo -e "${RED}✗ MongoDB is not responding${NC}"
fi

# Check frontend if full profile
if [ "$choice" = "2" ]; then
    if curl -f http://localhost:3000/health &> /dev/null; then
        echo -e "${GREEN}✓ Frontend is healthy (http://localhost:3000)${NC}"
    else
        echo -e "${YELLOW}⚠  Frontend is starting...${NC}"
    fi
fi

# Display service URLs
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Apricity is running!         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Service URLs:${NC}"
echo "  • Backend API:  http://localhost:5000"
echo "  • ML Service:   http://localhost:8000"
echo "  • MongoDB:      mongodb://localhost:27017"
if [ "$choice" = "2" ]; then
    echo "  • Frontend:     http://localhost:3000"
fi
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  • View logs:     docker-compose logs -f"
echo "  • Stop services: docker-compose down"
echo "  • Check status:  docker-compose ps"
echo "  • Or use:        make help"
echo ""
echo -e "${GREEN}Setup complete! 🚀${NC}"

# Apricity Docker Setup

This directory contains Docker Compose configuration to run the entire Apricity stack.

## Services

The stack includes four services:

1. **MongoDB** - Database (port 27017)
2. **ML Service** - Python emotion analysis API (port 8000)
3. **Backend** - Node.js Express API (port 5000)
4. **Frontend** - React SPA (port 3000) - _Optional_

## Quick Start

### 1. Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### 2. Setup Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

### 3. Start Services

**Without Frontend** (Backend + ML + MongoDB only):

```bash
docker-compose up -d
```

**With Frontend** (Full stack):

```bash
docker-compose --profile full up -d
```

### 4. Check Service Health

```bash
# View all running containers
docker-compose ps

# Check logs
docker-compose logs -f

# Check specific service
docker-compose logs -f backend
```

### 5. Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:8000
- **MongoDB**: mongodb://localhost:27017

## Service Configuration

### MongoDB

- **Port**: 27017
- **Database**: apricity
- **Credentials**: Set in `.env` file
  - `MONGO_ROOT_USER` (default: admin)
  - `MONGO_ROOT_PASSWORD` (default: changeme123)
- **Volumes**:
  - `mongo_data`: Database files
  - `mongo_config`: Configuration files

### ML Service

- **Port**: 8000
- **Base Image**: python:3.10-slim
- **Models**: Mounted from `./ml_service/models`
- **Health Check**: `GET /health`
- **Environment Variables**:
  - `PORT=8000`
  - `ML_LOG_LEVEL=info`

### Backend

- **Port**: 5000
- **Base Image**: node:18-alpine
- **Health Check**: `GET /health`
- **Environment Variables**:
  - `NODE_ENV` (development/production)
  - `JWT_SECRET` (required)
  - `MONGO_URI` (auto-configured)
  - `ML_SERVICE_URL` (auto-configured)
  - `FRONTEND_URL` (for CORS)

### Frontend (Optional)

- **Port**: 3000
- **Base Image**: nginx:alpine
- **Health Check**: `GET /health`
- **Environment Variables**:
  - `VITE_API_URL=http://localhost:5000`

## Common Commands

### Start services

```bash
# Start in background
docker-compose up -d

# Start with frontend
docker-compose --profile full up -d

# Start in foreground (see logs)
docker-compose up
```

### Stop services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Rebuild services

```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Execute commands in containers

```bash
# Access backend shell
docker-compose exec backend sh

# Access MongoDB shell
docker-compose exec mongo mongosh

# Run npm commands in backend
docker-compose exec backend npm test
```

## Development Mode

For development, the docker-compose.yml includes volume mounts for hot-reloading:

```yaml
volumes:
  - ./backend/src:/app/src:ro
  - ./frontend/src:/app/src:ro
```

To disable for production, comment out these volume mounts.

## Production Deployment

### 1. Update Environment Variables

```bash
# Set production values in .env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
MONGO_ROOT_PASSWORD=<strong-password>
```

### 2. Remove Development Volumes

Comment out source code volume mounts in `docker-compose.yml`:

```yaml
# Comment these lines:
# - ./backend/src:/app/src:ro
# - ./frontend/src:/app/src:ro
```

### 3. Build for Production

```bash
docker-compose build --no-cache
docker-compose up -d
```

### 4. Enable SSL/TLS

Use a reverse proxy (Nginx/Traefik) with Let's Encrypt for HTTPS.

## Networking

All services run on a custom bridge network `apricity-network`:

- Services can communicate using service names as hostnames
- Backend connects to MongoDB at `mongodb://mongo:27017`
- Backend connects to ML service at `http://ml_service:8000`
- External access through exposed ports

## Data Persistence

MongoDB data is stored in named volumes:

```bash
# List volumes
docker volume ls | grep apricity

# Inspect volume
docker volume inspect apricity-mongo-data

# Backup data
docker run --rm -v apricity-mongo-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mongo-backup.tar.gz /data
```

## Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs <service-name>

# Check health status
docker-compose ps
```

### Connection refused errors

```bash
# Verify network
docker network inspect apricity-network

# Check service is running
docker-compose ps

# Test connectivity
docker-compose exec backend ping ml_service
```

### Reset everything

```bash
# Stop and remove everything (including volumes)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## Monitoring

### Health Checks

All services include health checks:

```bash
# View health status
docker-compose ps

# Manual health check
curl http://localhost:5000/health
curl http://localhost:8000/health
```

### Resource Usage

```bash
# View resource usage
docker stats

# View container info
docker-compose top
```

## Security Notes

1. **Change default passwords** in production
2. **Use secrets management** (Docker Secrets or external vault)
3. **Don't expose MongoDB** port in production
4. **Enable authentication** on all services
5. **Use HTTPS** with SSL/TLS certificates
6. **Keep images updated** regularly

## Support

For issues or questions, check:

- Service logs: `docker-compose logs -f`
- Health endpoints: `/health` on each service
- Documentation in each service directory

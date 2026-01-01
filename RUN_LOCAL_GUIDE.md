# Run Apricity Locally - Complete Guide

## Quick Decision Guide

**Choose your approach based on what you have installed:**

| Requirement    | Docker Option                 | Local Option               |
| -------------- | ----------------------------- | -------------------------- |
| Docker Desktop | ✅ Required (must be running) | ❌ Not needed              |
| MongoDB        | ✅ Automatic (in container)   | ⚠️ Must install separately |
| Python 3.8+    | ✅ Automatic (in container)   | ⚠️ Must install/configure  |
| Node.js 14+    | ✅ Automatic (in container)   | ✅ Already installed       |

**Recommendation:** Use Docker for easiest setup.

---

## Option 1: Docker (Recommended) 🐳

### Prerequisites

- **Docker Desktop** installed and running
- That's it! Everything else runs in containers.

### Quick Start

```bash
# Navigate to project root
cd c:/Apricity

# Start all services (Backend + ML + MongoDB)
make up
# OR: docker-compose up -d

# Check service health
make health

# View logs
make logs

# Stop when done
make down
```

### With Frontend

```bash
# Start full stack including frontend
make up-full
# OR: docker-compose --profile full up -d
```

### Services Available

- **Frontend:** http://localhost:3000 (if full profile)
- **Backend API:** http://localhost:5000
  - Health: http://localhost:5000/health
  - Docs: See DIARY_API.md, AUTH_API.md, SUGGESTIONS_API.md
- **ML Service:** http://localhost:8000
  - Health: http://localhost:8000/health
  - API Docs: http://localhost:8000/docs
- **MongoDB:** mongodb://localhost:27017

### Useful Commands

```bash
make help           # Show all available commands
make status         # Show service status
make logs-backend   # View backend logs only
make logs-ml        # View ML service logs only
make restart        # Restart all services
make down           # Stop all services
make clean          # Stop and remove volumes (WARNING: deletes data)
```

### Troubleshooting Docker

**Issue: "Error response from daemon: Docker Desktop is unable to start"**

- Solution: Open Docker Desktop application and wait for it to fully start
- Check system tray for Docker icon
- Verify with: `docker ps`

**Issue: Port already in use**

```bash
# Check what's using the port
netstat -ano | findstr :5000
# Kill the process or change the port in .env
```

**Issue: Services not healthy**

```bash
# View logs to diagnose
docker-compose logs ml_service
# ML service takes 30-60 seconds to load models
```

---

## Option 2: Local Development (Without Docker) 💻

### Prerequisites

1. **Node.js** 14+ ✅ (Already installed: v22.15.0)
2. **Python** 3.8+ ⚠️ (Needs to be installed/configured)
3. **MongoDB** 4.4+ ⚠️ (Needs to be installed)

### Step-by-Step Setup

#### 1. Install MongoDB

**Option A: MongoDB Community Server (Local)**

- Download: https://www.mongodb.com/try/download/community
- Install and start MongoDB service
- Default connection: `mongodb://localhost:27017`

**Option B: MongoDB Atlas (Cloud - Recommended)**

- Sign up: https://www.mongodb.com/cloud/atlas
- Create free cluster (M0)
- Get connection string
- Update `backend/.env` with Atlas URI

#### 2. Install/Configure Python

**Check Python:**

```bash
python --version
# or
python3 --version
```

**If not installed:**

- Download: https://www.python.org/downloads/
- During installation, check "Add Python to PATH"
- Restart terminal after installation

#### 3. Setup ML Service

```bash
cd c:/Apricity/ml_service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Git Bash on Windows:
source venv/Scripts/activate

# Install dependencies
pip install -r requirements.txt

# Models will download automatically on first run
# Or manually: place models in ml_service/models/
```

#### 4. Setup Backend

```bash
cd c:/Apricity/backend

# Install dependencies (already done)
npm install

# Verify .env file
cat .env

# Ensure MONGO_URI points to your MongoDB:
# Local: mongodb://localhost:27017/apricity
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/apricity
```

#### 5. Setup Frontend (Optional)

```bash
cd c:/Apricity/frontend

# Install dependencies
npm install

# Verify .env or create one
echo "VITE_API_URL=http://localhost:5000" > .env
```

### Running Services

**You need 4 separate terminal windows:**

#### Terminal 1: MongoDB (if local)

```bash
# If using local MongoDB
mongod --dbpath C:\data\db

# If using MongoDB Atlas, skip this terminal
```

#### Terminal 2: ML Service

```bash
cd c:/Apricity/ml_service

# Activate virtual environment
source venv/Scripts/activate  # Git Bash
# OR: venv\Scripts\activate   # CMD/PowerShell

# Start ML service
python predict_server.py
# OR: uvicorn predict_server:app --host 0.0.0.0 --port 8000

# Wait for models to load (30-60 seconds)
# Service ready at: http://localhost:8000
```

#### Terminal 3: Backend

```bash
cd c:/Apricity/backend

# Development mode (auto-restart)
npm run dev

# Production mode
npm start

# Backend ready at: http://localhost:5000
```

#### Terminal 4: Frontend (Optional)

```bash
cd c:/Apricity/frontend

# Development mode
npm run dev

# Frontend ready at: http://localhost:3000
```

### Verify Services

```bash
# Health checks
curl http://localhost:8000/health    # ML Service
curl http://localhost:5000/health    # Backend

# Test ML inference
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel happy today"}'
```

---

## Option 3: Hybrid Approach 🔄

Use Docker for services you don't want to manage locally:

### Example: Docker for MongoDB + ML, Local for Backend

```bash
# Start only MongoDB with Docker
docker run -d \
  --name apricity-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=changeme123 \
  mongo:7.0

# Start ML service with Docker
docker run -d \
  --name apricity-ml \
  -p 8000:8000 \
  -v ./ml_service/models:/app/models \
  apricity-ml-service

# Run backend locally
cd backend
npm run dev
```

---

## Testing the Setup

### 1. Test Backend

```bash
# Health check
curl http://localhost:5000/health

# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### 2. Test ML Service

```bash
# Health check
curl http://localhost:8000/health

# Test emotion detection
curl -X POST http://localhost:8000/api/v1/detect-emotion \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel anxious about tomorrow"}'

# View API docs
# Open browser: http://localhost:8000/docs
```

### 3. Test Suggestions Endpoint

```bash
# Get suggestions (requires auth token)
# 1. Register/login to get token
# 2. Use token in Authorization header

curl -X POST http://localhost:5000/api/suggestions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "daysAnalyzed": 7,
    "consecutiveDays": 5,
    "emotionScores": {
      "sadness": 0.65,
      "anxiety": 0.42
    },
    "percentages": {
      "positive": 15.2,
      "negative": 68.3,
      "neutral": 16.5
    }
  }'
```

### 4. Run Test Suites

```bash
# Backend tests
cd backend
npm test

# Suggestions endpoint tests specifically
npm test -- suggestions.test.js

# ML service tests
cd ../ml_service
pytest tests/

# Integration tests (requires all services running)
cd ..
bash test-stack.sh
```

---

## Common Issues & Solutions

### Docker Issues

**Problem:** Docker Desktop won't start

- **Solution:**
  1. Close Docker Desktop completely
  2. Restart Windows
  3. Start Docker Desktop as Administrator
  4. Wait 1-2 minutes for full startup

**Problem:** Port conflicts

- **Solution:**
  ```bash
  # Check what's using port 5000
  netstat -ano | findstr :5000
  # Kill process or change port in .env
  ```

### MongoDB Issues

**Problem:** Can't connect to MongoDB

- **Solution:**

  ```bash
  # Verify MongoDB is running
  docker ps | grep mongo  # If using Docker
  # OR
  netstat -ano | findstr :27017  # If local

  # Check connection string in backend/.env
  cat backend/.env | grep MONGO_URI
  ```

### ML Service Issues

**Problem:** Models not found

- **Solution:**
  ```bash
  # Models download automatically on first run
  # If issues, check internet connection
  # Or manually download to ml_service/models/
  ```

**Problem:** Out of memory

- **Solution:**
  - Close other applications
  - Use smaller model (adjust MODEL_PATH in .env)
  - Increase Docker memory limit (Docker Desktop → Settings → Resources)

### Python Issues

**Problem:** `python` command not found

- **Solution:**

  ```bash
  # Try python3
  python3 --version

  # Or add Python to PATH
  # Windows: Search "Environment Variables" → Edit PATH
  # Add: C:\Users\<User>\AppData\Local\Programs\Python\Python3x
  ```

**Problem:** Virtual environment issues

- **Solution:**
  ```bash
  # Delete and recreate
  rm -rf ml_service/venv
  cd ml_service
  python -m venv venv
  source venv/Scripts/activate
  pip install -r requirements.txt
  ```

---

## Recommended Approach for You

Based on your system:

✅ **You have:** Node.js, npm, Git Bash  
❌ **You need:** MongoDB, Python (or Docker)

### **Best Option: Start Docker Desktop and use `make up`**

1. **Start Docker Desktop**

   - Open Docker Desktop application
   - Wait for it to fully start (check system tray)

2. **Run the stack**

   ```bash
   cd c:/Apricity
   make up
   ```

3. **Test the services**

   ```bash
   make health
   ```

4. **If you need the frontend too**
   ```bash
   make down
   make up-full
   ```

This gives you:

- ✅ No MongoDB installation needed
- ✅ No Python configuration needed
- ✅ All services automatically connected
- ✅ Easy start/stop with one command
- ✅ Consistent environment

---

## Next Steps After Services are Running

1. **Access the application:**

   - Frontend: http://localhost:3000 (if using full profile)
   - Backend API: http://localhost:5000

2. **Test the new suggestions endpoint:**

   - See: `backend/SUGGESTIONS_QUICKSTART.md`
   - Register a user → Get token → Test suggestions

3. **Explore the APIs:**

   - ML Service docs: http://localhost:8000/docs
   - Backend APIs: See `backend/*_API.md` files

4. **Run tests:**

   ```bash
   cd backend
   npm test -- suggestions.test.js
   ```

5. **View logs:**
   ```bash
   make logs
   ```

---

## Quick Reference Card

```bash
# Docker Commands
make up              # Start services
make down            # Stop services
make logs            # View all logs
make health          # Check service health
make restart         # Restart services
make status          # Service status

# Development Commands
cd backend && npm run dev      # Backend dev mode
cd frontend && npm run dev     # Frontend dev mode
cd ml_service && python predict_server.py  # ML service

# Testing
cd backend && npm test                    # All backend tests
cd backend && npm test -- suggestions.test.js  # Suggestions tests
cd ml_service && pytest                  # ML service tests
bash test-stack.sh                       # Integration tests

# Database
make shell-mongo     # Open MongoDB shell
make backup          # Backup database
```

---

**Need help?** Check these docs:

- Overall: `README.md`
- Docker: `DOCKER.md`
- Deployment: `DEPLOYMENT.md`
- API Docs: `backend/*_API.md`
- ML Service: `ml_service/README.md`
- Testing: `TEST_STACK_README.md`

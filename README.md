# Apricity - Mental Health Companion 🌅

**Apricity** is an AI-powered mental health companion that provides empathetic, evidence-based support using Cognitive Behavioral Therapy (CBT) techniques. The platform combines advanced emotion detection with personalized supportive responses to help users navigate their mental health journey.

## 📋 Project Summary

Apricity leverages state-of-the-art Natural Language Processing (NLP) models to:

- **Detect emotions** in user text using a fine-tuned BERT model on the GoEmotions dataset (28 emotion labels)
- **Generate supportive responses** using FLAN-T5 with CBT-informed prompts
- **Provide crisis intervention** with safety checks for self-harm indicators
- **Deliver personalized support** through structured validation, cognitive reframing, and actionable coping strategies

The system uses multi-label emotion classification to identify multiple concurrent emotions, providing more nuanced and accurate emotional understanding.

> ⚠️ **Disclaimer**: Apricity is NOT a substitute for professional mental health care. If you're experiencing a crisis, please contact emergency services or a mental health professional immediately.

## 🛠 Tech Stack

### Frontend

- **React.js** - UI framework
- **Node.js** - Runtime environment
- **Express.js** - Web application framework

### Backend

- **MongoDB** - NoSQL database for user data and conversation history
- **Express.js** - RESTful API server
- **Node.js** - Backend runtime

### Machine Learning Pipeline

- **FastAPI** - High-performance ML inference API
- **PyTorch** - Deep learning framework
- **Transformers (Hugging Face)** - Pre-trained model library
  - **BERT (base-uncased)** - Multi-label emotion classification
  - **FLAN-T5 (base)** - CBT-style response generation
- **scikit-learn** - Metrics and evaluation
- **Gradio** - Demo interface

### Supporting Technologies

- **Python 3.8+** - ML development
- **CUDA** - GPU acceleration (optional)
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                    (React.js Frontend)                          │
│  • User Interface  • Session Management  • Real-time Chat       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│                  (Node.js + Express.js)                         │
│  • Authentication  • Session Logic  • Request Routing           │
│  • User Management  • Conversation History                      │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             │ MongoDB Driver             │ HTTP/REST
             ▼                            ▼
┌─────────────────────┐      ┌──────────────────────────────────┐
│   DATABASE LAYER    │      │      ML INFERENCE LAYER          │
│     (MongoDB)       │      │        (FastAPI)                 │
│                     │      │                                  │
│ • User Profiles     │      │  ┌────────────────────────────┐ │
│ • Chat Logs         │      │  │  Emotion Detection         │ │
│ • Session Data      │      │  │  (BERT Multi-Label)        │ │
│ • Preferences       │      │  │  - 28 Emotions (GoEmotions)│ │
└─────────────────────┘      │  └────────────┬───────────────┘ │
                             │               │                  │
                             │               ▼                  │
                             │  ┌────────────────────────────┐ │
                             │  │  Response Generation       │ │
                             │  │  (FLAN-T5 Base)            │ │
                             │  │  - CBT-informed prompts    │ │
                             │  │  - Safety filtering        │ │
                             │  └────────────────────────────┘ │
                             └──────────────────────────────────┘
```

### Data Flow

1. User submits text through React frontend
2. Express.js backend authenticates and processes request
3. Request forwarded to FastAPI ML service
4. BERT model detects emotions (multi-label classification)
5. FLAN-T5 generates supportive CBT-style response
6. Safety filters check for crisis indicators
7. Response returned through backend to frontend
8. Conversation stored in MongoDB for history/continuity

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 14.x
- **Python** >= 3.8
- **MongoDB** >= 4.4
- **CUDA** (optional, for GPU acceleration)
- **pip** and **npm** package managers

### Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/apricity.git
cd apricity
```

#### 2. Setup Backend (Node.js + Express)

```bash
cd backend
npm install
```

#### 3. Setup Frontend (React)

```bash
cd ../frontend
npm install
```

#### 4. Setup ML Service (FastAPI)

```bash
cd ../ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 5. Setup MongoDB

- Install MongoDB locally or use MongoDB Atlas (cloud)
- Create a database named `apricity`

#### 6. Configure Environment Variables

Create `.env` files in respective directories (see [Environment Variables](#-environment-variables))

#### 7. Download Pre-trained Models

```bash
# In ml-service directory
python scripts/download_models.py
```

### Running in Development Mode

#### Terminal 1: Start MongoDB (if local)

```bash
mongod --dbpath /path/to/data/db
```

#### Terminal 2: Start ML Service (FastAPI)

```bash
cd ml-service
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 3: Start Backend (Express)

```bash
cd backend
npm run dev
```

#### Terminal 4: Start Frontend (React)

```bash
cd frontend
npm start
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🚢 Production Deployment

> 📘 **See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive production deployment guide**

### Quick Start - Development

#### Docker Deployment (Recommended for Development)

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Production Deployment Options

#### ⚠️ Critical Security Requirements

**Before deploying to production, you MUST:**

1. **Use Managed MongoDB Atlas** (not self-hosted without security hardening)

   - Automated backups and encryption
   - No infrastructure management
   - See: https://www.mongodb.com/cloud/atlas

2. **Store Secrets Securely** (never use .env files in production)

   - Use AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault
   - Store: `JWT_SECRET`, MongoDB URI, ML model paths
   - Never commit secrets to version control

3. **Enable HTTPS/TLS** (all traffic must be encrypted)

   - Use managed certificates (AWS ACM, Let's Encrypt)
   - Redirect HTTP to HTTPS (443 only)
   - Enable HSTS headers

4. **Scale ML Service Separately** (different compute requirements)
   - ML service is CPU/GPU intensive
   - Backend can use lightweight instances
   - Consider async processing with message queues

#### Recommended Deployment Platforms

**For Fastest Deploy:** [Railway](https://railway.app)

- Git push to deploy
- One-click MongoDB
- Free tier available
- Automatic HTTPS

**For Simplicity:** [GCP Cloud Run](https://cloud.google.com/run)

- Fully serverless (pay per request)
- Auto-scaling from 0 to thousands
- Managed SSL certificates
- ~$90-210/month

**For Enterprise:** [AWS ECS with Fargate](https://aws.amazon.com/ecs/)

- Fully managed containers
- Advanced networking and security
- Integration with AWS services
- ~$140-520/month

**For Budget:** Docker Compose on VPS

- DigitalOcean, Linode, or Vultr
- Full control, manual scaling
- ~$24-84/month

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for:

- Complete deployment guides for each platform
- Security best practices and checklists
- Secrets management setup (AWS/GCP/Vault)
- HTTPS/TLS configuration
- Scaling strategies
- Monitoring and observability
- Cost comparisons

### Production Security Checklist

- [ ] **Use MongoDB Atlas** (managed database with backups)
- [ ] **Store JWT_SECRET in secrets manager** (AWS/GCP/Vault)
- [ ] **Store MongoDB URI in secrets manager** (never in code)
- [ ] **Store ML model paths in secrets manager** (S3/GCS)
- [ ] **Enable HTTPS/TLS** (443 only, redirect HTTP)
- [ ] **Use managed SSL certificates** (ACM, Let's Encrypt)
- [ ] **Configure CORS** (whitelist specific origins, not \*)
- [ ] **Enable rate limiting** (prevent API abuse)
- [ ] **Setup monitoring** (CloudWatch, Stackdriver, DataDog)
- [ ] **Enable centralized logging** (CloudWatch Logs, Stackdriver)
- [ ] **Configure auto-scaling** (based on CPU/memory/requests)
- [ ] **Scale ML service separately** (different instance types)
- [ ] **Setup health checks** (already configured in code)
- [ ] **Implement automated backups** (MongoDB Atlas handles this)
- [ ] **Review IAM permissions** (least privilege principle)
- [ ] **Update dependencies regularly** (npm audit, pip-audit)
- [ ] **Enable vulnerability scanning** (Trivy, Snyk)
- [ ] **Setup alerting** (downtime, errors, high resource usage)
- [ ] **Test disaster recovery** (restore from backups)
- [ ] **Document runbooks** (incident response procedures)

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017/apricity
MONGODB_TEST_URI=mongodb://localhost:27017/apricity-test

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

# ML Service
ML_SERVICE_URL=http://localhost:8000

# CORS
CORS_ORIGIN=http://localhost:3000

# Session
SESSION_SECRET=your-session-secret-change-this
SESSION_TIMEOUT=3600000

# Logging
LOG_LEVEL=info
```

### Frontend (`frontend/.env`)

```env
# API Endpoints
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000

# Environment
REACT_APP_ENV=development

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_NOTIFICATIONS=true

# Version
REACT_APP_VERSION=1.0.0
```

### ML Service (`ml-service/.env`)

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
ENV=development

# Model Configuration
EMOTION_MODEL_PATH=./models/apricity-emotion-bert/best
GENERATION_MODEL_NAME=google/flan-t5-base
DEVICE=cuda  # or 'cpu'

# Model Inference
MAX_NEW_TOKENS=160
NUM_BEAMS=4
TEMPERATURE=0.7
TOP_P=0.92
MAX_LENGTH=192

# Safety
ENABLE_SAFETY_FILTER=true
CRISIS_DETECTION_THRESHOLD=0.8

# Performance
BATCH_SIZE=16
MAX_WORKERS=4
CACHE_SIZE=1000

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/ml-service.log
```

### Docker Environment (`docker-compose.yml` or `.env.docker`)

```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=secure-password-change-this
MONGO_INITDB_DATABASE=apricity

# Networking
BACKEND_PORT=5000
FRONTEND_PORT=3000
ML_SERVICE_PORT=8000
MONGO_PORT=27017

# Volumes
MONGO_DATA_PATH=./data/mongodb
MODEL_CACHE_PATH=./models
LOG_PATH=./logs
```

## 📊 Model Performance

The emotion detection model achieves:

- **F1-Macro**: ~0.45-0.50 (Multi-label, 28 emotions)
- **F1-Micro**: ~0.65-0.70
- **Precision (Micro)**: ~0.68-0.73
- **Recall (Micro)**: ~0.62-0.67

Trained on **GoEmotions** dataset (58k Reddit comments, 28 emotion labels) with 4 epochs.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting PRs.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Resources

### Crisis Resources

- **National Suicide Prevention Lifeline** (US): 988
- **Crisis Text Line** (US): Text HOME to 741741
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

### Project Support

- **Documentation**: [docs.apricity.ai](https://docs.apricity.ai)
- **Issues**: [GitHub Issues](https://github.com/yourusername/apricity/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/apricity/discussions)

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- **GoEmotions Dataset** by Google Research
- **Hugging Face** for Transformers library
- **FLAN-T5** by Google Research
- CBT techniques and mental health frameworks

---

**Made with ❤️ for mental health awareness**

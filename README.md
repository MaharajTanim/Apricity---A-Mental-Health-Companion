# Apricity - Mental Health Companion 🌅

**Apricity** is an AI-powered mental health companion that provides empathetic, evidence-based support using Cognitive Behavioral Therapy (CBT) techniques. The platform combines advanced emotion detection with personalized supportive responses to help users navigate their mental health journey.

## 📋 Project Summary

Apricity leverages state-of-the-art Natural Language Processing (NLP) models to:

- **Detect emotions** in user text using a fine-tuned DeBERTa-v3 model with 5 core emotion labels
- **Generate supportive responses** using FLAN-T5 with CBT-informed prompts
- **Provide crisis intervention** with safety checks for self-harm indicators
- **Track emotional wellness** through diary entries and emotion analytics
- **Deliver personalized support** through structured validation, cognitive reframing, and actionable coping strategies

The system uses multi-label emotion classification to identify multiple concurrent emotions, providing nuanced and accurate emotional understanding.

> ⚠️ **Disclaimer**: Apricity is NOT a substitute for professional mental health care. If you're experiencing a crisis, please contact emergency services or a mental health professional immediately.

## � Demo Video

[![Apricity Demo Video](https://img.youtube.com/vi/mOSvELGEUys/maxresdefault.jpg)](https://youtu.be/mOSvELGEUys)

**▶️ [Watch the full demo on YouTube](https://youtu.be/mOSvELGEUys)**

## �🎯 Core Features

| Feature                 | Description                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| **Diary Journaling**    | Write daily diary entries with automatic emotion analysis                 |
| **Emotion Detection**   | AI-powered 5-emotion classification (anger, fear, joy, sadness, surprise) |
| **CBT Support**         | Personalized responses using Cognitive Behavioral Therapy techniques      |
| **Emotion Analytics**   | Track emotional patterns over time with visual charts                     |
| **Crisis Detection**    | Automatic detection of self-harm keywords with safety resources           |
| **User Authentication** | Secure JWT-based authentication system                                    |

## 🧠 ML Model

**Model:** [`Sadman4701/Apricity-Final`](https://huggingface.co/Sadman4701/Apricity-Final)

| Specification           | Details                                       |
| ----------------------- | --------------------------------------------- |
| **Architecture**        | DeBERTa-v3-base                               |
| **Task**                | Multi-label Emotion Classification            |
| **Emotions**            | `anger`, `fear`, `joy`, `sadness`, `surprise` |
| **Response Generation** | FLAN-T5-base with CBT prompts                 |
| **Threshold**           | 0.5 (sigmoid activation)                      |

## 🛠 Tech Stack

### Frontend

- **React 18** - UI framework with hooks
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Recharts** - Data visualization for emotion analytics
- **Axios** - HTTP client

### Backend

- **Node.js** - Runtime environment
- **Express.js** - RESTful API framework
- **MongoDB** - NoSQL database (Atlas or local)
- **Mongoose** - MongoDB ODM
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing

### ML Service

- **FastAPI** - High-performance ML inference API
- **PyTorch** - Deep learning framework
- **Transformers (Hugging Face)** - Pre-trained models
  - **DeBERTa-v3-base** - Multi-label emotion classification
  - **FLAN-T5-base** - CBT-style response generation
- **Uvicorn** - ASGI server

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                    (React + Vite Frontend)                      │
│  • Diary Entry  • Emotion Dashboard  • User Authentication      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST (Port 3000)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│                  (Node.js + Express.js)                         │
│  • Authentication  • Diary CRUD  • Emotion History              │
│  • User Management  • ML Service Integration                    │
└────────────┬────────────────────────────┬───────────────────────┘
             │ Port 5000                  │ HTTP/REST
             ▼                            ▼
┌─────────────────────┐      ┌──────────────────────────────────┐
│   DATABASE LAYER    │      │      ML INFERENCE LAYER          │
│     (MongoDB)       │      │     (FastAPI - Port 8000)        │
│                     │      │                                  │
│ • User Profiles     │      │  ┌────────────────────────────┐ │
│ • Diary Entries     │      │  │  Emotion Detection         │ │
│ • Emotion History   │      │  │  (DeBERTa-v3-base)         │ │
│ • Session Data      │      │  │  - 5 Core Emotions         │ │
└─────────────────────┘      │  └────────────┬───────────────┘ │
                             │               │                  │
                             │               ▼                  │
                             │  ┌────────────────────────────┐ │
                             │  │  Response Generation       │ │
                             │  │  (FLAN-T5-base)            │ │
                             │  │  - CBT-informed prompts    │ │
                             │  │  - Crisis safety filter    │ │
                             │  └────────────────────────────┘ │
                             └──────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 14.x
- **Python** >= 3.10
- **MongoDB** (local or Atlas)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/MaharajTanim/Apricity---A-Mental-Health-Companion.git
cd Apricity---A-Mental-Health-Companion
```

### 2. Setup Python Environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

pip install torch transformers fastapi uvicorn pydantic
```

### 3. Setup Backend

```bash
cd backend
npm install
```

### 4. Setup Frontend

```bash
cd ../frontend
npm install
```

### 5. Configure Environment

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/apricity
JWT_SECRET=your-secret-key
ML_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### 6. Start All Services

**Option A: PowerShell Script (Windows)**

```powershell
.\start.ps1
```

**Option B: Manual Start (3 terminals)**

```bash
# Terminal 1: ML Service
cd ml_service
python -m uvicorn predict_server:app --host 0.0.0.0 --port 8000

# Terminal 2: Backend
cd backend
npm start

# Terminal 3: Frontend
cd frontend
npm run dev
```

### 7. Access the Application

| Service     | URL                        |
| ----------- | -------------------------- |
| Frontend    | http://localhost:3000      |
| Backend API | http://localhost:5000      |
| ML Service  | http://localhost:8000      |
| API Docs    | http://localhost:8000/docs |

## 📁 Project Structure

```
Apricity/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   └── utils/           # Helpers, JWT
│   └── package.json
│
├── frontend/                # React + Vite app
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context
│   │   └── services/        # API calls
│   └── package.json
│
├── ml_service/              # FastAPI ML server
│   ├── predict_server.py    # Main FastAPI app
│   └── test_predict.py      # Test scripts
│
├── start.ps1                # Windows start script
├── stop.ps1                 # Windows stop script
└── docker-compose.yml       # Docker deployment
```

## 🔌 API Endpoints

### ML Service (Port 8000)

| Method | Endpoint                   | Description                                 |
| ------ | -------------------------- | ------------------------------------------- |
| GET    | `/health`                  | Health check with model status              |
| POST   | `/predict`                 | Full emotion analysis (backend integration) |
| POST   | `/api/v1/detect-emotion`   | Detect emotions in text                     |
| POST   | `/api/v1/generate-support` | Generate CBT response                       |
| POST   | `/api/v1/chat`             | Full pipeline (emotion + response)          |
| POST   | `/debug-emotion`           | Debug emotion scores                        |

### Backend (Port 5000)

| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| POST   | `/api/auth/register`   | User registration        |
| POST   | `/api/auth/login`      | User login               |
| GET    | `/api/diary`           | Get user's diary entries |
| POST   | `/api/diary`           | Create diary entry       |
| GET    | `/api/emotion/history` | Get emotion history      |

## 📊 Example API Usage

### Detect Emotions

```bash
curl -X POST http://localhost:8000/api/v1/detect-emotion \
  -H "Content-Type: application/json" \
  -d '{"text": "I am feeling really happy today!"}'
```

**Response:**

```json
{
  "emotions": "joy",
  "confidence": 0.9847,
  "all_emotions": ["joy"]
}
```

### Full Chat Pipeline

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel overwhelmed with work stress", "user_name": "Alex"}'
```

**Response:**

```json
{
  "emotions": "sadness, fear",
  "confidence": 0.82,
  "response": "I hear you, Alex. Feeling overwhelmed is completely valid...",
  "has_crisis_warning": false
}
```

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent API abuse
- **CORS Configuration** - Controlled cross-origin access
- **Crisis Detection** - Safety keywords trigger emergency resources
- **Input Validation** - Express-validator for all inputs

## 🆘 Crisis Resources

If you or someone you know is in crisis:

- **National Suicide Prevention Lifeline (US)**: 988
- **Crisis Text Line (US)**: Text HOME to 741741
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Tanim Maharaj** - [GitHub](https://github.com/MaharajTanim)

## 🙏 Acknowledgments

- **Hugging Face** for Transformers library
- **DeBERTa** by Microsoft Research
- **FLAN-T5** by Google Research
- CBT techniques and mental health frameworks

---

**Made with ❤️ for mental health awareness**

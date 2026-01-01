# Apricity Testing Scripts - Complete Index

## 📚 Overview

This directory contains comprehensive testing scripts for the Apricity Mental Health Companion application. The scripts test everything from individual components to full end-to-end workflows.

## 🎯 Integration Test Scripts

### 1. **test-stack.sh** (Main Integration Test)

**Platform:** Linux, macOS, Git Bash (Windows)  
**Purpose:** Complete end-to-end integration test  
**Duration:** 60-90 seconds

**What it tests:**

- ✅ Docker Compose orchestration
- ✅ MongoDB connectivity
- ✅ Backend API endpoints
- ✅ ML Service endpoints
- ✅ User authentication (register + login)
- ✅ Diary CRUD operations
- ✅ Job queue processing
- ✅ ML emotion analysis
- ✅ Data validation

**Usage:**

```bash
./test-stack.sh
```

**Exit codes:**

- `0` - All tests passed
- `1+` - Test failure (detailed error output)

---

### 2. **test-stack.ps1** (PowerShell Version)

**Platform:** Windows PowerShell  
**Purpose:** Same as test-stack.sh but for PowerShell users  
**Duration:** 60-90 seconds

**What it tests:** (Same as bash version)

- All integration tests from test-stack.sh
- Uses `Invoke-RestMethod` instead of curl
- Native PowerShell error handling

**Usage:**

```powershell
.\test-stack.ps1
```

---

### 3. **test-quick-reference.sh** (Command Reference)

**Platform:** Linux, macOS, Git Bash (Windows)  
**Purpose:** Display quick reference for manual testing  
**Duration:** Instant

**What it shows:**

- Quick command examples
- Manual API testing commands
- Debugging commands
- Cleanup commands
- Example diary content

**Usage:**

```bash
./test-quick-reference.sh
```

## 📖 Documentation Files

### 4. **TEST_STACK_README.md**

**Comprehensive documentation** for the integration test script:

- Detailed test flow explanation
- Prerequisites and dependencies
- Troubleshooting guide
- CI/CD integration examples
- Customization options
- Performance metrics

### 5. **TEST_SCRIPT_SUMMARY.md**

**Quick reference summary** with visual diagrams:

- Test architecture diagram
- Data flow visualization
- Success metrics table
- Coverage breakdown
- Related resources

## 🧪 Unit Test Suites

### Backend Tests (Jest)

**Location:** `backend/tests/`  
**Test Count:** 35+ test cases  
**Coverage:** Authentication endpoints

**Key files:**

- `backend/tests/auth.test.js` - Auth endpoint tests
- `backend/tests/utils/testDb.js` - MongoDB memory server utilities
- `backend/tests/setup.js` - Jest global configuration

**Run tests:**

```bash
cd backend
npm test
```

---

### ML Service Tests (Pytest)

**Location:** `ml_service/tests/`  
**Test Count:** 23 test cases  
**Coverage:** Inference function

**Key files:**

- `ml_service/tests/test_ml_service.py` - Infer function tests
- `ml_service/pytest.ini` - Pytest configuration
- `ml_service/tests/TEST_COVERAGE_SUMMARY.md` - Test documentation

**Run tests:**

```bash
cd ml_service
python -m pytest tests/ -v
```

## 🚀 Quick Start Guide

### First Time Setup

```bash
# 1. Ensure dependencies are installed
docker --version
docker-compose --version
curl --version
jq --version

# 2. Make scripts executable (Linux/macOS/Git Bash)
chmod +x test-stack.sh
chmod +x test-quick-reference.sh

# 3. Run integration test
./test-stack.sh
```

### Windows PowerShell Setup

```powershell
# 1. Ensure Docker Desktop is running

# 2. Run integration test
.\test-stack.ps1

# 3. View reference commands
.\test-quick-reference.sh  # If using Git Bash
```

## 📊 Test Coverage Matrix

| Component        | Integration | Unit     | E2E | Manual |
| ---------------- | ----------- | -------- | --- | ------ |
| MongoDB          | ✅          | -        | ✅  | ✅     |
| Backend API      | ✅          | ✅ (35+) | ✅  | ✅     |
| ML Service       | ✅          | ✅ (23)  | ✅  | ✅     |
| Frontend         | -           | -        | -   | ✅     |
| Job Queue        | ✅          | -        | ✅  | ✅     |
| Auth Flow        | ✅          | ✅       | ✅  | ✅     |
| Diary CRUD       | ✅          | -        | ✅  | ✅     |
| Emotion Analysis | ✅          | ✅       | ✅  | ✅     |

**Legend:**

- ✅ Automated tests exist
- `-` No automated tests (or not applicable)

## 🔄 Test Execution Order

### Recommended Testing Workflow

```
1. Unit Tests (Fast - ~1-2 minutes)
   │
   ├─→ Backend Jest tests
   │   └─ npm test (in backend/)
   │
   └─→ ML Service Pytest tests
       └─ pytest tests/ (in ml_service/)

2. Integration Tests (Medium - ~2 minutes)
   │
   └─→ Full stack integration
       ├─ ./test-stack.sh (Bash)
       └─ .\test-stack.ps1 (PowerShell)

3. Manual Testing (Slow - ~10 minutes)
   │
   └─→ Frontend UI testing
       └─ Use test-quick-reference.sh for commands
```

## 🎯 CI/CD Integration

All tests are integrated into the CI/CD pipeline:

**GitHub Actions:** `.github/workflows/ci.yml`

Pipeline stages:

1. **Lint** - ESLint (Backend + Frontend), Flake8 (ML)
2. **Unit Tests** - Jest (Backend), Pytest (ML)
3. **Integration Tests** - test-stack.sh
4. **Docker Builds** - Build all images
5. **Security Scan** - Trivy vulnerability scan

**Run locally:**

```bash
# Lint
cd backend && npm run lint
cd frontend && npm run lint
cd ml_service && flake8

# Unit tests
cd backend && npm test
cd ml_service && pytest tests/

# Integration tests
./test-stack.sh

# Docker builds
docker-compose build
```

## 🐛 Debugging Failed Tests

### Integration Test Failures

**View logs:**

```bash
docker-compose logs backend
docker-compose logs ml_service
docker-compose logs mongo
```

**Check service status:**

```bash
docker-compose ps
docker stats
```

**Manual health checks:**

```bash
curl http://localhost:5000/health | jq
curl http://localhost:8000/health | jq
```

### Unit Test Failures

**Backend (Jest):**

```bash
cd backend
npm test -- --verbose
npm test -- --coverage
```

**ML Service (Pytest):**

```bash
cd ml_service
pytest tests/ -v --tb=short
pytest tests/ --cov=inference_pipeline
```

## 📈 Performance Benchmarks

| Test Suite   | Target | Typical | Max  |
| ------------ | ------ | ------- | ---- |
| Backend Jest | < 30s  | 15-20s  | 30s  |
| ML Pytest    | < 15s  | 8-10s   | 15s  |
| Integration  | < 120s | 60-90s  | 120s |
| **Total**    | < 3min | 2-3min  | 5min |

## 🔧 Maintenance

### Adding New Tests

**Backend (Jest):**

```javascript
// backend/tests/your-test.test.js
describe("Your Feature", () => {
  it("should do something", async () => {
    // Test code
  });
});
```

**ML Service (Pytest):**

```python
# ml_service/tests/test_your_feature.py
def test_your_function():
    # Test code
    assert result == expected
```

**Integration Test:**
Edit `test-stack.sh` and add new test functions following the existing pattern.

### Updating Documentation

When modifying tests, update:

1. This index file
2. Individual README files
3. CI/CD pipeline if needed
4. Test coverage metrics

## 📞 Support

**Test failures?**

1. Check logs: `docker-compose logs`
2. Review documentation: `TEST_STACK_README.md`
3. Run manual tests: `./test-quick-reference.sh`
4. Check GitHub Issues

**Need help?**

- See troubleshooting sections in `TEST_STACK_README.md`
- Check test output for detailed error messages
- Review CI/CD logs in GitHub Actions

## 📝 Test Checklist

Before deploying:

- [ ] All unit tests passing
- [ ] Integration test passing
- [ ] No Docker container errors
- [ ] Health endpoints responding
- [ ] ML models loaded successfully
- [ ] Database connections working
- [ ] No security vulnerabilities (Trivy scan)

## 🎉 Success Criteria

A fully tested system should show:

- ✅ 35+ backend unit tests passing
- ✅ 23 ML service unit tests passing
- ✅ Integration test completing in < 120s
- ✅ All health endpoints returning 200
- ✅ Emotion analysis producing valid results
- ✅ Zero test failures
- ✅ Exit code 0 from all test scripts

---

## 📂 File Structure

```
c:\Apricity\
├── test-stack.sh                    # Main integration test (Bash)
├── test-stack.ps1                   # Main integration test (PowerShell)
├── test-quick-reference.sh          # Command reference
├── TEST_STACK_README.md             # Detailed documentation
├── TEST_SCRIPT_SUMMARY.md           # Quick summary
├── TEST_INDEX.md                    # This file
├── backend/
│   └── tests/
│       ├── auth.test.js             # Auth endpoint tests (35+)
│       ├── utils/testDb.js          # Test utilities
│       └── setup.js                 # Jest config
├── ml_service/
│   └── tests/
│       ├── test_ml_service.py       # Inference tests (23)
│       ├── pytest.ini               # Pytest config
│       └── TEST_COVERAGE_SUMMARY.md # ML test docs
└── .github/
    └── workflows/
        └── ci.yml                   # CI/CD pipeline
```

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0  
**Total Test Count:** 58+ automated tests + 1 comprehensive integration test
